import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import content from "../content";

// Firebase Configuration:
// Used exclusively for real-time text blessings & RSVPs (Zero file storage consumption)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || content.integrations?.firebase?.apiKey || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || content.integrations?.firebase?.authDomain || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || content.integrations?.firebase?.projectId || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || content.integrations?.firebase?.messagingSenderId || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || content.integrations?.firebase?.appId || "",
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

let db = null;
if (isFirebaseConfigured) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
  } catch (err) {
    console.error("Failed to initialize Firebase:", err);
  }
}

export { db };

/**
 * Subscribe to real-time blessings updates from Firestore.
 * Automatically updates when any guest adds a blessing or reacts with a heart.
 */
export function subscribeToBlessings(onData, onError) {
  if (!db) return () => {};

  const q = query(collection(db, "blessings"), orderBy("timestamp", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const blessings = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || "",
          message: data.message || "",
          side: data.side || "",
          hearts: typeof data.hearts === "number" ? data.hearts : 1,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : data.timestamp || new Date().toISOString(),
        };
      });
      onData(blessings);
    },
    (error) => {
      console.error("Firestore blessings subscription error:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * Fallback to fetch announcements directly from Google Sheets / Apps Script
 * when Firestore security rules deny direct client read access.
 */
export async function fetchAnnouncementsFallback() {
  const scriptUrl = content.integrations?.appsScriptUrl;
  if (!scriptUrl) return [];
  try {
    const res = await fetch(`${scriptUrl}?action=getAnnouncements`);
    const data = await res.json();
    return data?.announcements || [];
  } catch (err) {
    console.error("Failed to fetch announcements fallback:", err);
    return [];
  }
}

/**
 * Subscribe to real-time wedding announcements from Firestore.
 * Updates instantly when a host sends an announcement via Telegram bot.
 * Automatically falls back to Google Sheets if Firestore rules are not yet configured.
 */
export function subscribeToAnnouncements(onData, onError) {
  if (!db) {
    fetchAnnouncementsFallback().then(onData).catch(() => onData([]));
    return () => {};
  }

  const q = query(collection(db, "announcements"), orderBy("timestamp", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const announcements = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data();
          if (data.active === false) return null;
          return {
            id: docSnap.id,
            message: data.message || "",
            priority: data.priority || "normal",
            author: data.author || "",
            timestamp: data.timestamp?.toDate
              ? data.timestamp.toDate().toISOString()
              : (typeof data.timestamp === "string" ? data.timestamp : new Date().toISOString()),
          };
        })
        .filter(Boolean);
      onData(announcements);
    },
    (error) => {
      console.warn("Firestore announcements subscription error, falling back to Google Sheets:", error);
      fetchAnnouncementsFallback().then(onData).catch(() => {});
      if (onError) onError(error);
    }
  );
}

/**
 * Post a new blessing to Firestore
 */
export async function addBlessingToFirestore({ name, message, side }) {
  if (!db) throw new Error("Firebase is not configured");
  return addDoc(collection(db, "blessings"), {
    name,
    message,
    side,
    hearts: 1,
    timestamp: serverTimestamp(),
  });
}

/**
 * Atomically increment or decrement heart count on a blessing
 */
export async function updateBlessingHearts(blessingId, delta = 1) {
  if (!db || !blessingId) return;
  const docRef = doc(db, "blessings", blessingId);
  return updateDoc(docRef, {
    hearts: increment(delta),
  });
}

/**
 * Submit an RSVP to Firestore
 */
export async function addRSVPToFirestore(rsvpData) {
  if (!db) throw new Error("Firebase is not configured");
  return addDoc(collection(db, "rsvps"), {
    ...rsvpData,
    timestamp: serverTimestamp(),
  });
}

/**
 * Upload Guest Photo/Video directly into Google Drive (via Google Apps Script)
 * Consumes 0 bytes of Firebase Storage (100% Free-Tier Safe).
 */
export async function uploadGuestMedia({
  file,
  base64Data,
  uploaderName,
  ceremony,
  initials,
  batchId,
  totalCount,
  fileIndex,
  appsScriptUrl,
}) {
  const targetUrl = appsScriptUrl || content.integrations?.appsScriptUrl;
  if (!targetUrl) {
    throw new Error("Google Apps Script URL is not configured.");
  }

  const payload = {
    action: "uploadMedia",
    uploaderName: uploaderName || "Guest",
    initials: initials || "",
    ceremony: ceremony || "General",
    fileName: file.name,
    mimeType: file.type || "image/jpeg",
    fileData: base64Data,
    batchId: batchId || "",
    totalCount: typeof totalCount === "number" ? totalCount : 1,
    fileIndex: typeof fileIndex === "number" ? fileIndex : 0,
  };

  const res = await fetch(targetUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (_) {}

  if (json && json.ok) {
    return { ok: true, source: "drive", ...json };
  }

  const errMsg = json?.error || "Google Drive upload failed. Please ensure Drive permissions are authorized in Apps Script.";
  throw new Error(errMsg);
}
