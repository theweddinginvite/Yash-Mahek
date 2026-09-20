// ==========================================================================
// Yash & Mahek Wedding — Instant Two-Way Firebase ↔ Google Sheets & Telegram
// ==========================================================================
//
// 1. Instant Sheet ↔ Firebase Bidirectional Synchronization.
// 2. Real-Time Telegram Notifications for every Blessing & RSVP.
// 3. Native Telegram "🗑️ Delete from Live Wall" Callback Button:
//    - No browser or URL navigation.
//    - Strikes through the message in Telegram (<s>...</s>) and marks it REMOVED.
//    - Shows a subtle in-app toast at the bottom of the screen.
// 4. Live Heart Counts (❤️) synchronized.

const FIREBASE_PROJECT_ID = "yashmahekwedding";
const FIREBASE_API_KEY = "AIzaSyB-H7JyM-REapOa3PftjigCqhMBjaSOu3Y";

// Telegram Bot Configuration (Private Script Properties)
// Secrets are stored securely in Google Apps Script Properties so they are NEVER exposed in git!
function getTelegramBotToken_() {
  return PropertiesService.getScriptProperties().getProperty("TELEGRAM_BOT_TOKEN") || "";
}

function getTelegramChatId_() {
  return PropertiesService.getScriptProperties().getProperty("TELEGRAM_CHAT_ID") || "-1004270754193";
}

const BLESSINGS_SHEETS = ["BLESSINGS_BRIDE", "BLESSINGS_GROOM"];
const SHEET_BY_TYPE_AND_SIDE = {
  blessing: {
    "Bride": "BLESSINGS_BRIDE",
    "Groom": "BLESSINGS_GROOM",
    "Bride Side": "BLESSINGS_BRIDE",
    "Groom Side": "BLESSINGS_GROOM",
  },
  rsvp: {
    "Bride": "RSVP_BRIDE",
    "Groom": "RSVP_GROOM",
    "Bride Side": "RSVP_BRIDE",
    "Groom Side": "RSVP_GROOM",
  },
};

// Google Drive Gallery Folder Configuration
// 1. Curated folder displayed on the wedding invite gallery (Managed exclusively by hosts)
const GALLERY_DRIVE_FOLDER_ID = "1n0l1dZEb3eQE9qn9CZyZVhLZ9wC6fqtz";

// 2. Folder where guests upload photos & videos
// Paste the exact 'Guest Uploaded Gallery' folder ID below (or leave "" to auto-detect):
const GUEST_UPLOAD_FOLDER_ID = "";
const GUEST_UPLOAD_FOLDER_NAME = "Guest Uploaded Gallery";

// 3. Dedicated Google Sheet tab names:
const GALLERY_SHEET_NAME = "GALLERY";
const GUEST_UPLOADS_SHEET_NAME = "GUEST_UPLOADS";

/**
 * Derives uppercase initials from a person's name (e.g. "Rohan Gupta" -> "RG")
 */
function deriveInitials_(name) {
  if (!name || !name.trim()) return "GUEST";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].substring(0, 4).toUpperCase();
  }
  return parts.map(function(p) { return p[0]; }).join("").toUpperCase().substring(0, 5);
}

/**
 * Safe spreadsheet accessor:
 * Returns active spreadsheet or falls back to SPREADSHEET_ID stored in ScriptProperties.
 */
function getSpreadsheet_() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) return ss;
  } catch (e) {}

  const sheetId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (sheetId) {
    try {
      return SpreadsheetApp.openById(sheetId);
    } catch (e) {
      Logger.log("getSpreadsheet_ openById error: " + e);
    }
  }
  return null;
}

function getKnownIds_(key) {
  try {
    const raw = PropertiesService.getScriptProperties().getProperty(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function setKnownIds_(key, idsArray) {
  try {
    PropertiesService.getScriptProperties().setProperty(key, JSON.stringify(idsArray));
  } catch (e) {
    Logger.log("Error saving known IDs: " + e);
  }
}

function addKnownId_(key, id) {
  if (!id) return;
  try {
    const known = getKnownIds_(key) || [];
    if (!known.includes(id)) {
      known.push(id);
      setKnownIds_(key, known);
    }
  } catch (e) {
    Logger.log("addKnownId_ error: " + e);
  }
}

function removeKnownId_(key, id) {
  if (!id) return;
  try {
    const known = getKnownIds_(key) || [];
    const updated = known.filter(function(x) { return x !== id; });
    setKnownIds_(key, updated);
  } catch (e) {
    Logger.log("removeKnownId_ error: " + e);
  }
}

function deleteFromFirestore_(collectionName, docId) {
  if (!docId) return false;
  try {
    const deleteUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${collectionName}/${docId}?key=${FIREBASE_API_KEY}`;
    const res = UrlFetchApp.fetch(deleteUrl, { method: "delete", muteHttpExceptions: true });
    Logger.log(`Deleted ${collectionName}/${docId} from Firestore: response ${res.getResponseCode()}`);
    return res.getResponseCode() === 200;
  } catch (err) {
    Logger.log(`Firestore delete error for ${collectionName}/${docId}: ` + err);
    return false;
  }
}

/**
 * Checks if a submission with this firestoreId was already processed recently.
 * Returns true if duplicate (to be ignored), false if new.
 */
function isDuplicateSubmission_(firestoreId, type) {
  if (!firestoreId) return false;
  const cleanId = String(firestoreId).trim();
  if (!cleanId) return false;

  // 1. Check in-memory fast cache (catches near-simultaneous POST and GET within 5 mins)
  try {
    const cache = CacheService.getScriptCache();
    const cacheKey = "proc_" + cleanId;
    if (cache.get(cacheKey)) {
      return true;
    }
    cache.put(cacheKey, "1", 300); // 5 minutes TTL
  } catch (e) {
    Logger.log("Cache check error: " + e);
  }

  // 2. Check persistent known IDs
  const propKey = type === "rsvp" ? "KNOWN_RSVP_IDS" : "KNOWN_BLESSING_IDS";
  const known = getKnownIds_(propKey) || [];
  if (known.includes(cleanId)) {
    return true;
  }

  return false;
}

/**
 * Creates custom menu in Google Sheets on open
 */
function onOpen() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) {
      PropertiesService.getScriptProperties().setProperty("SPREADSHEET_ID", ss.getId());
    }
  } catch (e) {}

  SpreadsheetApp.getUi()
    .createMenu("💌 Wedding Admin")
    .addItem("⚡ Instant 2-Way Sync (Firebase ↔ Sheet)", "instantBidirectionalSync")
    .addItem("⬇️ Pull All Blessings & Hearts from Firebase", "pullAllBlessingsFromFirebaseToSheet")
    .addSeparator()
    .addItem("🖼️ Set 'Wedding Invite' Curated Gallery Folder ID", "promptSetGalleryFolderId")
    .addItem("🔄 Sync Curated Photos to GALLERY Sheet", "syncDriveFolderToGallerySheet")
    .addSeparator()
    .addItem("📁 Set 'Guest Uploaded Gallery' Folder ID", "promptSetGuestUploadFolderId")
    .addSeparator()
    .addItem("🔑 Authorize Google Drive Permissions", "authorizeDrivePermissions")
    .addSeparator()
    .addItem("🚀 Activate Instant Auto-Sync Triggers", "setupInstantTriggers")
    .addSeparator()
    .addItem("🔑 Configure Telegram Bot Credentials", "promptSetTelegramCredentials")
    .addItem("🤖 Register Telegram Webhook (For Delete & Notice Board)", "registerTelegramWebhook")
    .addItem("🧪 Send Test Telegram Alert", "sendTestTelegramNotification")
    .addSeparator()
    .addItem("🧹 Clear All Test RSVPs", "clearAllRsvpsMenu")
    .addToUi();
}

/**
 * ONE-CLICK GOOGLE DRIVE AUTHORIZATION HELPER
 * Run this once in the Apps Script Editor toolbar to grant Google Drive permissions.
 */
function authorizeDrivePermissions() {
  const curatedFolder = DriveApp.getFolderById(GALLERY_DRIVE_FOLDER_ID);
  Logger.log("✅ Curated Gallery folder connected: " + curatedFolder.getName());

  const guestFolder = getGuestUploadFolder_();
  Logger.log("✅ Guest Uploads folder connected: " + guestFolder.getName() + " (ID: " + guestFolder.getId() + ")");

  // Perform a test file creation to verify write permissions
  const testFile = guestFolder.createFile("auth_test.txt", "OK");
  testFile.setTrashed(true);
  Logger.log("✅ Google Drive Write & Create permissions are fully Authorized in '" + guestFolder.getName() + "'!");
}

/**
 * Returns the 'Guest Uploaded Gallery' Google Drive folder.
 * Automatically searches for it under the same parent directory as 'Wedding Invite Photo Gallery'.
 */
function getGuestUploadFolder_() {
  // 0. Check if configured as a constant at the top of Code.gs
  if (typeof GUEST_UPLOAD_FOLDER_ID !== "undefined" && GUEST_UPLOAD_FOLDER_ID && GUEST_UPLOAD_FOLDER_ID.trim()) {
    try {
      return DriveApp.getFolderById(GUEST_UPLOAD_FOLDER_ID.trim());
    } catch (e) {
      Logger.log("Configured GUEST_UPLOAD_FOLDER_ID error: " + e);
    }
  }

  // 1. Check if explicitly saved in Script Properties
  const propId = PropertiesService.getScriptProperties().getProperty("GUEST_UPLOAD_FOLDER_ID");
  if (propId) {
    try {
      return DriveApp.getFolderById(propId);
    } catch (_) {}
  }

  // 2. Automatically find folder named 'Guest Uploaded Gallery' under the same parent directory
  try {
    const curatedFolderId = PropertiesService.getScriptProperties().getProperty("GALLERY_FOLDER_ID") || GALLERY_DRIVE_FOLDER_ID;
    const curatedFolder = DriveApp.getFolderById(curatedFolderId);
    const parents = curatedFolder.getParents();
    while (parents.hasNext()) {
      const parent = parents.next();
      const subfolders = parent.getFoldersByName(GUEST_UPLOAD_FOLDER_NAME);
      if (subfolders.hasNext()) {
        const guestFolder = subfolders.next();
        PropertiesService.getScriptProperties().setProperty("GUEST_UPLOAD_FOLDER_ID", guestFolder.getId());
        Logger.log("Found 'Guest Uploaded Gallery' under parent: " + guestFolder.getId());
        return guestFolder;
      }
    }
  } catch (err) {
    Logger.log("Auto-find guest folder under parent error: " + err);
  }

  // 3. Search anywhere in Google Drive by exact folder name
  try {
    const folders = DriveApp.getFoldersByName(GUEST_UPLOAD_FOLDER_NAME);
    if (folders.hasNext()) {
      const guestFolder = folders.next();
      PropertiesService.getScriptProperties().setProperty("GUEST_UPLOAD_FOLDER_ID", guestFolder.getId());
      Logger.log("Found 'Guest Uploaded Gallery' via global search: " + guestFolder.getId());
      return guestFolder;
    }
  } catch (err) {
    Logger.log("Global search guest folder error: " + err);
  }

  // 4. Fallback: if not found, create 'Guest Uploaded Gallery' next to the curated folder
  try {
    const curatedFolderId = PropertiesService.getScriptProperties().getProperty("GALLERY_FOLDER_ID") || GALLERY_DRIVE_FOLDER_ID;
    const curatedFolder = DriveApp.getFolderById(curatedFolderId);
    const parents = curatedFolder.getParents();
    if (parents.hasNext()) {
      const parent = parents.next();
      const newFolder = parent.createFolder(GUEST_UPLOAD_FOLDER_NAME);
      try {
        newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (_) {}
      PropertiesService.getScriptProperties().setProperty("GUEST_UPLOAD_FOLDER_ID", newFolder.getId());
      Logger.log("Created 'Guest Uploaded Gallery': " + newFolder.getId());
      return newFolder;
    }
  } catch (createErr) {
    Logger.log("Create guest folder error: " + createErr);
  }

  // 5. Ultimate fallback: curated folder
  return DriveApp.getFolderById(GALLERY_DRIVE_FOLDER_ID);
}

/**
 * Prompt to view or set the 'Guest Uploaded Gallery' Google Drive Folder ID
 */
function promptSetGuestUploadFolderId() {
  const ui = SpreadsheetApp.getUi();
  const current = PropertiesService.getScriptProperties().getProperty("GUEST_UPLOAD_FOLDER_ID") || "Auto-detected";
  const res = ui.prompt(
    "Set 'Guest Uploaded Gallery' Folder",
    "Paste the Google Drive Folder Link or Folder ID for guest uploads:\n\nCurrent: " + current,
    ui.ButtonSet.OK_CANCEL
  );
  if (res.getSelectedButton() === ui.Button.OK) {
    const raw = res.getResponseText().trim();
    if (!raw) return;
    const folderId = extractDriveFolderId_(raw);
    PropertiesService.getScriptProperties().setProperty("GUEST_UPLOAD_FOLDER_ID", folderId);
    ui.alert("✅ Saved! 'Guest Uploaded Gallery' folder set to:\n" + folderId);
  }
}

/**
 * Prompt to set Google Drive Gallery Folder ID or Link
 */
function promptSetGalleryFolderId() {
  const ui = SpreadsheetApp.getUi();
  const current = PropertiesService.getScriptProperties().getProperty("GALLERY_FOLDER_ID") || GALLERY_DRIVE_FOLDER_ID;
  const res = ui.prompt(
    "Set 'Wedding Invite' Curated Gallery Google Drive Folder",
    "Paste your Google Drive Folder Link or Folder ID for the curated invite gallery:\n(Make sure folder sharing is set to 'Anyone with the link can view')\n\nCurrent: " + current,
    ui.ButtonSet.OK_CANCEL
  );
  if (res.getSelectedButton() === ui.Button.OK) {
    const raw = res.getResponseText().trim();
    if (!raw) return;
    const folderId = extractDriveFolderId_(raw);
    PropertiesService.getScriptProperties().setProperty("GALLERY_FOLDER_ID", folderId);
    ui.alert("✅ Saved! Curated gallery folder set to:\n" + folderId + "\n\nSyncing photos now...");
    syncDriveFolderToGallerySheet();
  }
}

/**
 * Extracts clean Google Drive folder ID from full URL or raw ID
 */
function extractDriveFolderId_(input) {
  if (!input) return "";
  const match = input.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  const matchId = input.match(/id=([a-zA-Z0-9_-]+)/);
  if (matchId) return matchId[1];
  return input.trim();
}

/**
 * Extracts clean Google Drive file ID from full URL or raw ID
 */
function extractDriveFileId_(input) {
  if (!input) return "";
  const match = input.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  const matchId = input.match(/id=([a-zA-Z0-9_-]+)/);
  if (matchId) return matchId[1];
  return input.trim();
}

const DEFAULT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxibdTIQ5m8jfUdoCZ2SSAIVNOIJE6uzDPKrPUulREgq8rZ8TCtykTghNK7WJWR86oxxA/exec";

/**
 * Prompt to set Telegram Bot Token and Chat ID securely in Script Properties
 */
function promptSetTelegramCredentials() {
  const ui = SpreadsheetApp.getUi();
  const currentToken = getTelegramBotToken_();
  const maskedToken = currentToken ? currentToken.substring(0, 10) + "..." + currentToken.slice(-4) : "Not Set";
  const currentChatId = getTelegramChatId_();

  const tokenPrompt = ui.prompt(
    "🔑 Configure Telegram Bot Token",
    "Paste your NEW Telegram Bot Token from @BotFather:\n\nCurrent: " + maskedToken,
    ui.ButtonSet.OK_CANCEL
  );
  if (tokenPrompt.getSelectedButton() !== ui.Button.OK) return;
  const tokenVal = tokenPrompt.getResponseText().trim();
  if (tokenVal) {
    PropertiesService.getScriptProperties().setProperty("TELEGRAM_BOT_TOKEN", tokenVal);
  }

  const chatPrompt = ui.prompt(
    "💬 Configure Telegram Chat ID (Optional)",
    "Telegram Group Chat ID:\n(Press OK to keep default: " + currentChatId + ")",
    ui.ButtonSet.OK_CANCEL
  );
  if (chatPrompt.getSelectedButton() === ui.Button.OK) {
    const chatVal = chatPrompt.getResponseText().trim();
    if (chatVal) {
      PropertiesService.getScriptProperties().setProperty("TELEGRAM_CHAT_ID", chatVal);
    }
  }

  // Automatically attempt webhook registration using active Bot Token
  const activeToken = getTelegramBotToken_();
  let webhookMsg = "";
  if (activeToken) {
    try {
      const res = UrlFetchApp.fetch(`https://api.telegram.org/bot${activeToken}/setWebhook?url=${encodeURIComponent(DEFAULT_WEB_APP_URL)}`, { muteHttpExceptions: true });
      const resJson = JSON.parse(res.getContentText());
      if (resJson.ok) {
        webhookMsg = "\n\n🤖 Webhook successfully registered to Telegram!";
      } else {
        webhookMsg = "\n\n⚠️ Webhook registration response: " + resJson.description;
      }
    } catch (e) {
      webhookMsg = "\n\n⚠️ Webhook auto-connect note: " + e.message;
    }
  }

  ui.alert("✅ Saved! Credentials stored in Script Properties." + webhookMsg);
}

/**
 * Synchronizes Drive photos into a 'GALLERY' sheet tab (Interactive with UI alert)
 */
function syncDriveFolderToGallerySheet() {
  const count = syncDriveFolderToGallerySheet_Silent();
  if (count >= 0) {
    SpreadsheetApp.getUi().alert(`✅ Synced ${count} photos from Google Drive to the GALLERY sheet!`);
  } else {
    SpreadsheetApp.getUi().alert("⚠️ Please set a valid Google Drive Folder ID first using the Wedding Admin menu.");
  }
}

/**
 * Silent background synchronizer (Runs automatically on schedule and on API requests)
 */
function syncDriveFolderToGallerySheet_Silent() {
  const folderId = PropertiesService.getScriptProperties().getProperty("GALLERY_FOLDER_ID") || GALLERY_DRIVE_FOLDER_ID;
  if (!folderId || folderId === "YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE") {
    return -1;
  }

  try {
    const folder = DriveApp.getFolderById(folderId);
    const files = folder.getFiles();
    const photos = [];

    while (files.hasNext()) {
      const file = files.next();
      const mime = file.getMimeType();
      if (mime.startsWith("image/")) {
        const fileId = file.getId();
        photos.push({
          src: `https://lh3.googleusercontent.com/d/${fileId}`,
          alt: file.getName().replace(/\.[^/.]+$/, ""),
          id: fileId,
          created: file.getDateCreated().getTime(),
        });
      }
    }

    // Sort chronologically (oldest to newest)
    photos.sort((a, b) => a.created - b.created);

    // Synchronize dedicated Google Sheets tab
    updateGallerySheetWithPhotos_(photos);
    return photos.length;
  } catch (err) {
    Logger.log("Silent sync error: " + err);
    return -1;
  }
}

/**
 * Updates the dedicated curated Gallery sheet tab with live photos from Drive.
 * Keeps row 1 headers intact and shows thumbnail previews via =IMAGE(...) formula.
 */
function updateGallerySheetWithPhotos_(photos) {
  try {
    const sheet = getOrCreateGallerySheet_();
    if (!sheet) return;

    const headers = ["IMAGE_URL", "PHOTO_CAPTION", "DRIVE_FILE_ID", "DATE_ADDED", "PREVIEW"];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f0e6dd");
      sheet.setFrozenRows(1);
    }

    // Clear old data rows (keep row 1 header intact)
    const lastRow = sheet.getLastRow();
    const lastCol = Math.max(sheet.getLastColumn(), headers.length);
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
    }

    if (photos && photos.length > 0) {
      const rows = photos.map((p) => {
        const url = p.src || `https://lh3.googleusercontent.com/d/${p.id}`;
        const caption = p.alt || "";
        const fileId = p.id || "";
        const dateStr = p.created
          ? Utilities.formatDate(new Date(p.created), "Asia/Kolkata", "dd MMM yyyy, hh:mm a")
          : Utilities.formatDate(new Date(), "Asia/Kolkata", "dd MMM yyyy, hh:mm a");
        const formula = `=IMAGE("${url}")`;
        return [url, caption, fileId, dateStr, formula];
      });
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
      sheet.setRowHeights(2, rows.length, 60);
    }
    SpreadsheetApp.flush();
  } catch (err) {
    Logger.log("updateGallerySheetWithPhotos_ error: " + err);
  }
}

/**
 * Returns dynamic gallery photos from Google Drive in real-time
 * 1. Reads directly from Google Drive folder (live on the fly)
 * 2. Automatically updates the dedicated curated GALLERY sheet tab
 * 3. Deletions in Drive are instantly reflected!
 */
function getGalleryPhotos_() {
  const folderId = PropertiesService.getScriptProperties().getProperty("GALLERY_FOLDER_ID") || GALLERY_DRIVE_FOLDER_ID;

  // Real-time live read from Google Drive folder
  if (folderId && folderId !== "YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE") {
    try {
      const folder = DriveApp.getFolderById(folderId);
      const files = folder.getFiles();
      const photos = [];
      while (files.hasNext()) {
        const file = files.next();
        if (file.getMimeType().startsWith("image/")) {
          photos.push({
            src: `https://lh3.googleusercontent.com/d/${file.getId()}`,
            alt: file.getName().replace(/\.[^/.]+$/, ""),
            id: file.getId(),
            created: file.getDateCreated().getTime(),
          });
        }
      }
      // Sort oldest to newest
      photos.sort((a, b) => a.created - b.created);

      // Keep Google Sheet gallery tab synchronized live
      try {
        updateGallerySheetWithPhotos_(photos);
      } catch (sheetErr) {
        Logger.log("Sheet auto-update notice: " + sheetErr);
      }

      return photos;
    } catch (err) {
      Logger.log("Direct folder read error: " + err);
    }
  }

  // Fallback: Read from GALLERY sheet tab if populated
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("GALLERY");

  if (sheet) {
    const values = sheet.getDataRange().getValues();
    if (values.length > 1) {
      const [, ...rows] = values;
      const list = rows
        .filter((r) => r[0])
        .map((r, idx) => {
          const rawUrl = String(r[0]).trim();
          const fileId = extractDriveFileId_(rawUrl);
          const src = fileId && !rawUrl.includes("lh3.googleusercontent.com")
            ? `https://lh3.googleusercontent.com/d/${fileId}`
            : rawUrl;
          return {
            src: src,
            alt: r[1] ? String(r[1]).trim() : `Wedding Memory ${idx + 1}`,
            id: r[2] ? String(r[2]).trim() : fileId || `photo-${idx}`,
          };
        });
      if (list.length > 0) return list;
    }
  }

  return [];
}

/**
 * Real-time trigger: Fires IMMEDIATELY when any row is deleted or modified in Sheet!
 */
function handleSpreadsheetChange_(e) {
  try {
    instantBidirectionalSync();
  } catch (err) {
    Logger.log("Real-time onChange error: " + err);
  }
}

/**
 * Web App GET endpoint:
 * Handles:
 * 1. ?action=getGallery -> Returns dynamic photos from Google Drive / Sheet
 * 2. Default -> Returns blessings for website
 */
function doGet(e) {
  const p = e && e.parameter ? e.parameter : {};
  const action = p.action;

  // 1. GET Blessing Submission Fallback
  if (action === "sendBlessing" || action === "blessing") {
    const data = {
      type: "blessing",
      name: p.name || "Guest",
      side: p.side || "Bride",
      message: p.message || "",
      firestoreId: p.firestoreId || "",
    };
    if (isDuplicateSubmission_(data.firestoreId, "blessing")) {
      Logger.log("Duplicate GET blessing ignored: " + data.firestoreId);
      return jsonResponse_({ ok: true, duplicate: true });
    }
    const sheetName = (SHEET_BY_TYPE_AND_SIDE["blessing"] || {})[data.side] || "BLESSINGS_BRIDE";
    const sheet = getOrCreateSheet_(sheetName, "blessing");
    if (sheet) {
      sheet.appendRow([data.name, data.side, data.message, new Date(), 1, data.firestoreId]);
      SpreadsheetApp.flush();
    }
    if (data.firestoreId) {
      addKnownId_("KNOWN_BLESSING_IDS", data.firestoreId);
    }
    sendTelegramBlessingNotification_(data);
    return jsonResponse_({ ok: true, message: "Blessing recorded via GET" });
  }

  // 2. GET RSVP Submission Fallback
  if (action === "sendRSVP" || action === "rsvp") {
    const data = {
      type: "rsvp",
      name: p.name || "Guest",
      side: p.side || "Bride",
      attending: p.attending || "Yes",
      guests: Number(p.guests) || 1,
      parkingRequired: p.parkingRequired || "No",
      expectedArrival: p.expectedArrival || "",
      firestoreId: p.firestoreId || "",
    };
    if (isDuplicateSubmission_(data.firestoreId, "rsvp")) {
      Logger.log("Duplicate GET RSVP ignored: " + data.firestoreId);
      return jsonResponse_({ ok: true, duplicate: true });
    }
    const sheetName = (SHEET_BY_TYPE_AND_SIDE["rsvp"] || {})[data.side] || "RSVP_BRIDE";
    const sheet = getOrCreateSheet_(sheetName, "rsvp");
    if (sheet) {
      sheet.appendRow([data.name, data.side, data.attending, data.guests, data.parkingRequired, new Date(), data.firestoreId]);
      SpreadsheetApp.flush();
    }
    if (data.firestoreId) {
      addKnownId_("KNOWN_RSVP_IDS", data.firestoreId);
    }
    sendTelegramRsvpNotification_(data);
    return jsonResponse_({ ok: true, message: "RSVP recorded via GET" });
  }

  if (action === "getGallery") {
    const photos = getGalleryPhotos_();
    return jsonResponse_({ ok: true, photos: photos });
  }

  if (action === "getAnnouncements") {
    const announcements = readAnnouncementsSheet_();
    return jsonResponse_({ ok: true, announcements: announcements });
  }

  if (action === "getRsvps") {
    const rsvps = ["RSVP_BRIDE", "RSVP_GROOM"].flatMap(readRsvpsSheet_).sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
    return jsonResponse_({ rsvps });
  }

  const blessings = BLESSINGS_SHEETS.flatMap(readBlessingsSheet_).sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );
  return jsonResponse_({ blessings });
}

function readBlessingsSheet_(sheetName) {
  const ss = getSpreadsheet_();
  if (!ss) return [];
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  const [, ...dataRows] = sheet.getDataRange().getValues();
  return dataRows
    .filter((row) => row[0])
    .map((row) => ({
      name: row[0],
      side: row[1],
      message: row[2],
      timestamp: row[3],
      hearts: typeof row[4] === "number" ? row[4] : 1,
      id: row[5] || "",
    }));
}

function readRsvpsSheet_(sheetName) {
  const ss = getSpreadsheet_();
  if (!ss) return [];
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  const [, ...dataRows] = sheet.getDataRange().getValues();
  return dataRows
    .filter((row) => row[0])
    .map((row) => ({
      name: row[0],
      side: row[1],
      attending: row[2],
      guests: row[3],
      parkingRequired: row[4],
      timestamp: row[5],
      id: row[6] || "",
    }));
}

function readAnnouncementsSheet_() {
  const ss = getSpreadsheet_();
  if (!ss) return [];
  const sheet = ss.getSheetByName(ANNOUNCEMENTS_SHEET_NAME);
  if (!sheet) return [];

  const [, ...dataRows] = sheet.getDataRange().getValues();
  return dataRows
    .filter((row) => row[1] && String(row[4]).trim() !== "REMOVED")
    .map((row, idx) => ({
      id: String(row[5] || ("sheet_" + idx)),
      message: String(row[1] || ""),
      priority: String(row[2] || "NORMAL").toLowerCase(),
      author: String(row[3] || "Host"),
      timestamp: row[0] instanceof Date ? row[0].toISOString() : (row[0] ? new Date(row[0]).toISOString() : new Date().toISOString()),
    }))
    .reverse();
}

/**
 * Web App POST endpoint:
 * Handles both Website Submissions AND Native Telegram Callback Queries
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse_({ ok: false, error: "Empty request" });
    }

    const payload = JSON.parse(e.postData.contents);

    // CASE 1: Telegram Native Inline Button Callback (Admin clicked Delete)
    if (payload.callback_query) {
      return handleTelegramCallback_(payload.callback_query);
    }

    // CASE 1.2: Telegram Incoming Message (Notice Board Announcement)
    if (payload.message && payload.message.text) {
      return handleTelegramMessage_(payload.message);
    }

    // CASE 2: Guest Media Upload (Photo/Video to Google Drive)
    if (payload.action === "uploadMedia") {
      return handleMediaUpload_(payload);
    }

    // CASE 2.5: Admin Clear Test RSVPs
    if (payload.action === "clearAllRsvps") {
      clearAllRsvps_();
      return jsonResponse_({ ok: true, message: "Cleared all RSVPs from sheets" });
    }

    // CASE 3: Website Submission (Blessing or RSVP)
    const data = payload;
    if (isDuplicateSubmission_(data.firestoreId, data.type)) {
      Logger.log("Duplicate POST ignored: " + data.firestoreId);
      return jsonResponse_({ ok: true, duplicate: true });
    }

    const sideNormalized = data.side || "Bride";
    const sheetName =
      (SHEET_BY_TYPE_AND_SIDE[data.type] || {})[sideNormalized] ||
      (data.type === "rsvp" ? "RSVP_BRIDE" : "BLESSINGS_BRIDE");

    const sheet = getOrCreateSheet_(sheetName, data.type);

    if (data.type === "blessing") {
      if (sheet) {
        sheet.appendRow([
          data.name,
          data.side,
          data.message,
          new Date(),
          1, // initial hearts
          data.firestoreId || "",
        ]);
        SpreadsheetApp.flush();
      }
      if (data.firestoreId) {
        addKnownId_("KNOWN_BLESSING_IDS", data.firestoreId);
      }
      sendTelegramBlessingNotification_(data);
    } else if (data.type === "rsvp") {
      if (sheet) {
        sheet.appendRow([
          data.name,
          data.side,
          data.attending,
          data.guests,
          data.parkingRequired,
          new Date(),
          data.firestoreId || "",
        ]);
        SpreadsheetApp.flush();
      }
      if (data.firestoreId) {
        addKnownId_("KNOWN_RSVP_IDS", data.firestoreId);
      }
      sendTelegramRsvpNotification_(data);
    }

    return jsonResponse_({ ok: true });
  } catch (err) {
    Logger.log("doPost error: " + err);
    return jsonResponse_({ ok: false, error: err.toString() });
  }
}

// ==========================================================================
// Telegram Bot Notifications & Native Inline Moderation
// ==========================================================================

/**
 * Sends a Telegram notification when a new Blessing is posted
 */
function sendTelegramBlessingNotification_(data) {
  const botToken = getTelegramBotToken_();
  const chatId = getTelegramChatId_();
  if (!botToken || !chatId || botToken.includes("YOUR_")) return;

  const text =
    `🌸 <b>New Blessing on Wedding Wall!</b> 🌸\n\n` +
    `👤 <b>Name:</b> ${escapeHtml_(data.name)}\n` +
    `🎪 <b>Side:</b> ${escapeHtml_(data.side)}\n` +
    `💌 <b>Message:</b>\n<i>"${escapeHtml_(data.message)}"</i>\n\n` +
    `⏰ <b>Time:</b> ${Utilities.formatDate(new Date(), "Asia/Kolkata", "dd MMM yyyy, hh:mm a")}`;

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: "🗑️ Delete from Live Wall",
          callback_data: `del_blessing:${data.firestoreId || ""}`,
        },
      ],
    ],
  };

  sendTelegramApi_("sendMessage", {
    chat_id: chatId,
    text: text,
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
}

/**
 * Sends a Telegram notification when a new RSVP is submitted
 */
function sendTelegramRsvpNotification_(data) {
  const botToken = getTelegramBotToken_();
  const chatId = getTelegramChatId_();
  if (!botToken || !chatId || botToken.includes("YOUR_")) return;

  const isAttending = data.attending === "Yes" ? "✅ Joyfully Accept (Attending)" : "❌ Regretfully Decline";
  const text =
    `🎉 <b>New RSVP Received!</b> 🎉\n\n` +
    `👤 <b>Name:</b> ${escapeHtml_(data.name)}\n` +
    `🎪 <b>Side:</b> ${escapeHtml_(data.side)}\n` +
    `✨ <b>Status:</b> ${isAttending}\n` +
    `👥 <b>Guests Count:</b> ${escapeHtml_(String(data.guests || 1))}\n` +
    `🚗 <b>Parking Needed:</b> ${escapeHtml_(data.parkingRequired || "No")}\n\n` +
    `⏰ <b>Time:</b> ${Utilities.formatDate(new Date(), "Asia/Kolkata", "dd MMM yyyy, hh:mm a")}`;

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: "🗑️ Delete RSVP",
          callback_data: `del_rsvp:${data.firestoreId || ""}`,
        },
      ],
    ],
  };

  sendTelegramApi_("sendMessage", {
    chat_id: chatId,
    text: text,
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
}

/**
 * Handles native Telegram button clicks (In-app, no browser navigation)
 */
function handleTelegramCallback_(callbackQuery) {
  if (!callbackQuery) return HtmlService.createHtmlOutput("OK");

  const callbackId = callbackQuery.id;
  const callbackData = callbackQuery.data || "";
  const message = callbackQuery.message;
  const fromUser = callbackQuery.from?.first_name || "Admin";

  // 1. Immediately acknowledge Telegram callback within 0.2s to prevent 5s timeout!
  if (callbackId) {
    try {
      sendTelegramApi_("answerCallbackQuery", {
        callback_query_id: callbackId,
        text: "🗑️ Deleting from live website...",
        show_alert: false,
      });
    } catch (err) {
      Logger.log("answerCallbackQuery error: " + err);
    }
  }

  if (!message || !message.chat) {
    return HtmlService.createHtmlOutput("OK");
  }

  const chatId = message.chat.id;
  const messageId = message.message_id;
  const originalText = message.text || "";

  // Guard against double clicks / already removed messages
  if (originalText.includes("REMOVED & DELETED")) {
    if (callbackId) {
      try {
        sendTelegramApi_("answerCallbackQuery", {
          callback_query_id: callbackId,
          text: "⚠️ This item has already been deleted.",
          show_alert: true,
        });
      } catch (_) {}
    }
    return HtmlService.createHtmlOutput("OK");
  }

  const [action, docId] = callbackData.split(":");

  if (action === "del_blessing" || action === "del_rsvp" || action === "del_notice") {
    // 2. IMMEDIATELY update Telegram message in-place: Strike through text and REMOVE the delete button
    // This gives the admin instant visual feedback (<0.5s) and prevents double-clicks!
    const cleanOriginalText = originalText
      .replace(/🗑️ Delete from Live Wall/g, "")
      .replace(/🗑️ Remove from Notice Board/g, "")
      .trim();
    const isNotice = action === "del_notice";
    const itemTypeDesc = isNotice ? "This announcement has been removed from the live website" : "This item is now deleted from Firebase and the live website";
    const updatedText =
      `<s>${escapeHtml_(cleanOriginalText)}</s>\n\n` +
      `❌ <b>REMOVED & DELETED by ${escapeHtml_(fromUser)}</b>\n` +
      `<i>(${itemTypeDesc})</i>`;

    try {
      sendTelegramApi_("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text: updatedText,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: [] }, // Remove the delete button immediately
      });
    } catch (editErr) {
      Logger.log("editMessageText error: " + editErr);
    }

    // 3. Delete from Firebase Firestore immediately
    if (docId) {
      let collectionName = "blessings";
      if (action === "del_rsvp") collectionName = "rsvps";
      if (action === "del_notice") collectionName = "announcements";
      deleteFromFirestore_(collectionName, docId);
    }

    // 4. Update row in Google Sheet (targeted to relevant sheets only, fast)
    try {
      if (action === "del_notice") {
        updateNoticeSheetStatus_(docId, "REMOVED");
      } else {
        deleteRowFromSheetByDocId_(docId, action);
      }
    } catch (sheetErr) {
      Logger.log("Sheet delete error: " + sheetErr);
    }
  }

  return HtmlService.createHtmlOutput("OK");
}

function deleteRowFromSheetByDocId_(docId, action) {
  if (!docId) return;
  const ss = getSpreadsheet_();
  if (!ss) {
    Logger.log("deleteRowFromSheetByDocId_: No active spreadsheet found");
    return;
  }

  const searchId = String(docId).trim();
  if (!searchId) return;

  const sheets = ss.getSheets();
  let deletedCount = 0;

  // 1. First search prioritized sheets matching action
  for (let s = 0; s < sheets.length; s++) {
    const sheet = sheets[s];
    const sheetName = sheet.getName().toUpperCase();
    const isTarget =
      action === "del_rsvp"
        ? sheetName.includes("RSVP")
        : sheetName.includes("BLESSING");

    if (!isTarget) continue;

    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) continue;

    for (let i = values.length - 1; i >= 1; i--) {
      const row = values[i];
      const isMatch = row.some(cell => String(cell).trim() === searchId);
      if (isMatch) {
        sheet.deleteRow(i + 1);
        deletedCount++;
        Logger.log(`Deleted row ${i + 1} with ID ${searchId} from sheet ${sheet.getName()}`);
      }
    }
  }

  // 2. Fallback: Search all sheets if not found in prioritized sheets
  if (deletedCount === 0) {
    for (let s = 0; s < sheets.length; s++) {
      const sheet = sheets[s];
      const values = sheet.getDataRange().getValues();
      if (values.length <= 1) continue;

      for (let i = values.length - 1; i >= 1; i--) {
        const row = values[i];
        const isMatch = row.some(cell => String(cell).trim() === searchId);
        if (isMatch) {
          sheet.deleteRow(i + 1);
          deletedCount++;
          Logger.log(`Fallback deleted row ${i + 1} with ID ${searchId} from sheet ${sheet.getName()}`);
        }
      }
    }
  }

  if (deletedCount > 0) {
    SpreadsheetApp.flush();
    if (action === "del_rsvp") {
      removeKnownId_("KNOWN_RSVP_IDS", searchId);
    } else {
      removeKnownId_("KNOWN_BLESSING_IDS", searchId);
    }
  }
}

function clearAllRsvps_() {
  const ss = getSpreadsheet_();
  if (ss) {
    ["RSVP_BRIDE", "RSVP_GROOM"].forEach((name) => {
      const sheet = ss.getSheetByName(name);
      if (!sheet) return;
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
        Logger.log(`Cleared all RSVPs from ${name}`);
      }
    });
    SpreadsheetApp.flush();
  }

  // Also clear all RSVPs from Firebase Firestore
  try {
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/rsvps?key=${FIREBASE_API_KEY}`;
    const response = UrlFetchApp.fetch(firestoreUrl, { muteHttpExceptions: true });
    if (response.getResponseCode() === 200) {
      const data = JSON.parse(response.getContentText());
      (data.documents || []).forEach((doc) => {
        const docId = doc.name.split("/").pop();
        deleteFromFirestore_("rsvps", docId);
      });
    }
    setKnownIds_("KNOWN_RSVP_IDS", []);
  } catch (e) {
    Logger.log("clearAllRsvps_ Firestore error: " + e);
  }
}

function clearAllRsvpsMenu() {
  const ui = SpreadsheetApp.getUi();
  const resp = ui.alert("Clear All RSVPs", "Are you sure you want to clear all test RSVP entries from the sheets?", ui.ButtonSet.YES_NO);
  if (resp !== ui.Button.YES) return;
  clearAllRsvps_();
  ui.alert("✅ All RSVPs have been cleared from RSVP_BRIDE and RSVP_GROOM.");
}

const ANNOUNCEMENTS_SHEET_NAME = "ANNOUNCEMENTS";

/**
 * Handles incoming Telegram messages sent to the Bot or Admin Group.
 * Detects /notice, /announce, /alert, or #notice commands and posts
 * them directly to the Live Wedding Notice Board (Firebase Firestore + Google Sheets).
 */
function handleTelegramMessage_(msg) {
  const text = (msg.text || "").trim();
  const chatId = msg.chat?.id;
  const fromName = msg.from?.first_name || "Host";

  if (!text) {
    return HtmlService.createHtmlOutput("OK");
  }

  // 1. Help or info command
  if (text === "/notice" || text === "/announce" || text === "/notices" || text === "/notice_help") {
    sendTelegramApi_("sendMessage", {
      chat_id: chatId,
      text:
        "📢 <b>Wedding Notice Board Guide</b>\n\n" +
        "To post an announcement to the live wedding website, send:\n" +
        "• <code>/notice Your message here</code>\n" +
        "• <code>/announce Your message here</code>\n" +
        "• <code>/alert Urgent message here</code> (marks as Urgent)\n\n" +
        "<i>Example:</i>\n" +
        "<code>/notice Lunch is now being served at the Poolside Lawn!</code>\n\n" +
        "Any announcement posted will appear instantly on the guests' Notice Board with an inline delete button to remove it whenever needed.",
      parse_mode: "HTML",
    });
    return HtmlService.createHtmlOutput("OK");
  }

  // 2. Check for Announcement Command or Prefix
  let noticeText = "";
  let isUrgent = false;

  if (text.startsWith("/alert ") || text.startsWith("/urgent ")) {
    noticeText = text.replace(/^\/(alert|urgent)\s+/i, "").trim();
    isUrgent = true;
  } else if (text.startsWith("/notice ") || text.startsWith("/announce ")) {
    noticeText = text.replace(/^\/(notice|announce)\s+/i, "").trim();
  } else if (text.startsWith("#notice ") || text.toLowerCase().startsWith("notice: ")) {
    noticeText = text.replace(/^(#notice|notice:)\s+/i, "").trim();
  }

  // If not an announcement command, return OK
  if (!noticeText) {
    return HtmlService.createHtmlOutput("OK");
  }

  // 3. Post to Firebase Firestore collection 'announcements'
  let firestoreId = "";
  try {
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/announcements?key=${FIREBASE_API_KEY}`;
    const payload = {
      fields: {
        message: { stringValue: noticeText },
        priority: { stringValue: isUrgent ? "urgent" : "normal" },
        author: { stringValue: fromName },
        active: { booleanValue: true },
        timestamp: { timestampValue: new Date().toISOString() },
        telegramMessageId: { integerValue: msg.message_id ? String(msg.message_id) : "0" },
      },
    };

    const res = UrlFetchApp.fetch(firestoreUrl, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });

    const resJson = JSON.parse(res.getContentText());
    if (resJson.name) {
      firestoreId = resJson.name.split("/").pop();
    }
  } catch (fbErr) {
    Logger.log("Firestore announcement error: " + fbErr);
  }

  // 4. Save to Google Sheets tab 'ANNOUNCEMENTS'
  try {
    const sheet = getOrCreateAnnouncementsSheet_();
    sheet.appendRow([
      new Date(),
      noticeText,
      isUrgent ? "URGENT" : "NORMAL",
      fromName,
      "ACTIVE",
      firestoreId,
      msg.message_id || "",
    ]);
    SpreadsheetApp.flush();
  } catch (sheetErr) {
    Logger.log("Sheet announcement error: " + sheetErr);
  }

  // 5. Send Telegram confirmation reply with native inline Delete button
  const timeFormatted = Utilities.formatDate(new Date(), "GMT+5:30", "hh:mm a, dd MMM");
  sendTelegramApi_("sendMessage", {
    chat_id: chatId,
    text:
      `📢 <b>${isUrgent ? "🚨 URGENT NOTICE POSTED" : "POSTED TO WEDDING NOTICE BOARD"}</b>\n\n` +
      `"${escapeHtml_(noticeText)}"\n\n` +
      `⏱️ <i>${timeFormatted} IST · Live on website</i>`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🗑️ Remove from Notice Board",
            callback_data: `del_notice:${firestoreId}`,
          },
        ],
      ],
    },
  });

  return HtmlService.createHtmlOutput("OK");
}

function getOrCreateAnnouncementsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(ANNOUNCEMENTS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(ANNOUNCEMENTS_SHEET_NAME);
    sheet.appendRow([
      "Timestamp",
      "Notice Message",
      "Priority",
      "Posted By",
      "Status",
      "Firestore ID",
      "Telegram Msg ID",
    ]);
    sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#f3e8eb");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(2, 400);
  }
  return sheet;
}

function updateNoticeSheetStatus_(docId, status) {
  if (!docId) return;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(ANNOUNCEMENTS_SHEET_NAME);
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][5]).trim() === docId) {
      sheet.getRange(i + 1, 5).setValue(status);
      break;
    }
  }
}

function sendTelegramApi_(method, payload) {
  const botToken = getTelegramBotToken_();
  if (!botToken || botToken.includes("YOUR_")) return null;
  const url = `https://api.telegram.org/bot${botToken}/${method}`;
  return UrlFetchApp.fetch(url, {
    method: "POST",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });
}

/**
 * Registers this Google Apps Script Web App URL with Telegram Bot Webhook
 */
function registerTelegramWebhook() {
  const ui = SpreadsheetApp.getUi();
  const botToken = getTelegramBotToken_();
  if (!botToken || botToken.includes("YOUR_")) {
    ui.alert("Please configure your Telegram Bot Token first using:\n\n'💌 Wedding Admin' -> '🔑 Configure Telegram Bot Credentials'");
    return;
  }

  const prompt = ui.prompt(
    "Register Telegram Webhook",
    "Confirm or paste your Google Apps Script Web App URL (ending in /exec):\n\n(Press OK directly to use active URL: " + DEFAULT_WEB_APP_URL + ")",
    ui.ButtonSet.OK_CANCEL
  );

  if (prompt.getSelectedButton() !== ui.Button.OK) return;
  let webAppUrl = prompt.getResponseText().trim();
  if (!webAppUrl) {
    webAppUrl = DEFAULT_WEB_APP_URL;
  }

  if (!webAppUrl.includes("/exec")) {
    ui.alert("Invalid URL. It must be your deployed Apps Script URL ending in /exec.");
    return;
  }

  const res = sendTelegramApi_("setWebhook", { url: webAppUrl });
  const resultText = res ? res.getContentText() : "Failed";

  ui.alert("Telegram Webhook Response:\n" + resultText);
}

/**
 * Test function to verify Telegram Bot connectivity
 */
function sendTestTelegramNotification() {
  const botToken = getTelegramBotToken_();
  const chatId = getTelegramChatId_();
  if (!botToken || !chatId || botToken.includes("YOUR_")) {
    SpreadsheetApp.getUi().alert("Please configure your Telegram Bot Token and Chat ID first using:\n\n'💌 Wedding Admin' -> '🔑 Configure Telegram Bot Credentials'");
    return;
  }

  sendTelegramBlessingNotification_({
    name: "Test Guest (Yash & Mahek)",
    side: "Bride Side",
    message: "This is a test blessing notification with native in-app Delete! 🌸",
    firestoreId: "test_doc_id",
  });

  SpreadsheetApp.getActiveSpreadsheet().toast("Test alert sent to Telegram! Check your group.", "Telegram Bot", 5);
}

function escapeHtml_(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ==========================================================================
// Super-Fast Bi-Directional Sync (Sheet ↔ Firebase)
// ==========================================================================

/**
 * Safe 2-Way Synchronization:
 * 1. Synchronizes live heart reaction counts (❤️).
 * 2. Deletes from Firebase any item that was removed from Google Sheets.
 * 3. Pulls in genuine new submissions from website if they haven't been written to sheet yet.
 */
function instantBidirectionalSync() {
  const ss = getSpreadsheet_();
  if (!ss) return;

  syncBlessings_(ss);
  syncRsvps_(ss);
}

function syncBlessings_(ss) {
  const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/blessings?key=${FIREBASE_API_KEY}`;
  const response = UrlFetchApp.fetch(firestoreUrl, { muteHttpExceptions: true });

  if (response.getResponseCode() !== 200) {
    Logger.log("Firestore blessings connection error: " + response.getContentText());
    return;
  }

  const data = JSON.parse(response.getContentText());
  const firestoreDocs = data.documents || [];

  const firestoreMap = new Map();
  firestoreDocs.forEach((doc) => {
    const docId = doc.name.split("/").pop();
    const fields = doc.fields || {};
    const hearts = fields.hearts?.integerValue ? parseInt(fields.hearts.integerValue, 10) : 1;
    const ts = fields.timestamp?.timestampValue || fields.timestamp?.stringValue || new Date().toISOString();
    firestoreMap.set(docId, {
      id: docId,
      name: fields.name?.stringValue || "",
      side: fields.side?.stringValue || "Bride Side",
      message: fields.message?.stringValue || "",
      timestamp: ts,
      hearts: hearts,
      createdAtMs: new Date(ts).getTime() || 0,
    });
  });

  const sheetDocIds = new Set();
  const sheets = ss.getSheets();
  const blessingSheets = sheets.filter(s => s.getName().toUpperCase().includes("BLESSING"));
  const targetSheets = blessingSheets.length > 0 ? blessingSheets : sheets;

  targetSheets.forEach((sheet) => {
    if (!sheet.getName().toUpperCase().includes("BLESSING") && blessingSheets.length > 0) return;
    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) return;

    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      let docId = String(row[5] || "").trim();
      if (!docId) {
        for (let c = 0; c < row.length; c++) {
          const v = String(row[c] || "").trim();
          if (firestoreMap.has(v)) {
            docId = v;
            break;
          }
        }
      }

      if (!docId) continue;
      sheetDocIds.add(docId);

      if (firestoreMap.has(docId)) {
        const liveHearts = firestoreMap.get(docId).hearts;
        if (row[4] !== liveHearts) {
          sheet.getRange(i + 1, 5).setValue(liveHearts);
        }
      }
    }
  });

  const knownIds = getKnownIds_("KNOWN_BLESSING_IDS");
  const now = Date.now();

  firestoreDocs.forEach((doc) => {
    const docId = doc.name.split("/").pop();
    if (!sheetDocIds.has(docId)) {
      const item = firestoreMap.get(docId);
      const ageMinutes = (now - (item ? item.createdAtMs : 0)) / (1000 * 60);
      const wasInSheet = knownIds && knownIds.includes(docId);

      // If it was previously tracked in the sheet, OR if it's an older doc (>3 mins) missing from sheet:
      // Host deleted it from the sheet! Delete from Firestore.
      if (wasInSheet || ageMinutes > 3) {
        deleteFromFirestore_("blessings", docId);
        Logger.log(`Deleted blessing ${docId} from Firestore because row is absent from sheet`);
      } else if (item) {
        // Recent web submission fallback: pull to sheet
        const targetSheetName = item.side.toLowerCase().includes("groom") ? "BLESSINGS_GROOM" : "BLESSINGS_BRIDE";
        const targetSheet = getOrCreateSheet_(targetSheetName, "blessing");
        if (targetSheet) {
          targetSheet.appendRow([
            item.name,
            item.side,
            item.message,
            item.timestamp,
            item.hearts,
            docId,
          ]);
          sheetDocIds.add(docId);
        }
      }
    }
  });

  SpreadsheetApp.flush();
  setKnownIds_("KNOWN_BLESSING_IDS", Array.from(sheetDocIds));
}

function syncRsvps_(ss) {
  const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/rsvps?key=${FIREBASE_API_KEY}`;
  const response = UrlFetchApp.fetch(firestoreUrl, { muteHttpExceptions: true });

  if (response.getResponseCode() !== 200) {
    Logger.log("Firestore rsvps connection error: " + response.getContentText());
    return;
  }

  const data = JSON.parse(response.getContentText());
  const firestoreDocs = data.documents || [];

  const firestoreMap = new Map();
  firestoreDocs.forEach((doc) => {
    const docId = doc.name.split("/").pop();
    const fields = doc.fields || {};
    const ts = fields.timestamp?.timestampValue || fields.timestamp?.stringValue || new Date().toISOString();
    firestoreMap.set(docId, {
      id: docId,
      name: fields.name?.stringValue || "",
      side: fields.side?.stringValue || "Bride",
      attending: fields.attending?.stringValue || "Yes",
      guests: fields.guests?.integerValue ? parseInt(fields.guests.integerValue, 10) : 1,
      parkingRequired: fields.parkingRequired?.stringValue || "No",
      expectedArrival: fields.expectedArrival?.stringValue || "",
      timestamp: ts,
      createdAtMs: new Date(ts).getTime() || 0,
    });
  });

  const sheetDocIds = new Set();
  const sheets = ss.getSheets();
  const rsvpSheets = sheets.filter(s => s.getName().toUpperCase().includes("RSVP"));
  const targetSheets = rsvpSheets.length > 0 ? rsvpSheets : sheets;

  targetSheets.forEach((sheet) => {
    if (!sheet.getName().toUpperCase().includes("RSVP") && rsvpSheets.length > 0) return;
    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) return;

    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      let docId = String(row[6] || "").trim();
      if (!docId) {
        for (let c = 0; c < row.length; c++) {
          const v = String(row[c] || "").trim();
          if (firestoreMap.has(v)) {
            docId = v;
            break;
          }
        }
      }

      if (!docId) continue;
      sheetDocIds.add(docId);
    }
  });

  const knownIds = getKnownIds_("KNOWN_RSVP_IDS");
  const now = Date.now();

  firestoreDocs.forEach((doc) => {
    const docId = doc.name.split("/").pop();
    if (!sheetDocIds.has(docId)) {
      const item = firestoreMap.get(docId);
      const ageMinutes = (now - (item ? item.createdAtMs : 0)) / (1000 * 60);
      const wasInSheet = knownIds && knownIds.includes(docId);

      if (wasInSheet || ageMinutes > 3) {
        deleteFromFirestore_("rsvps", docId);
        Logger.log(`Deleted RSVP ${docId} from Firestore because row is absent from sheet`);
      } else if (item) {
        const sideNormalized = item.side || "Bride";
        const targetSheetName = (SHEET_BY_TYPE_AND_SIDE["rsvp"] || {})[sideNormalized] || "RSVP_BRIDE";
        const targetSheet = getOrCreateSheet_(targetSheetName, "rsvp");
        if (targetSheet) {
          targetSheet.appendRow([
            item.name,
            item.side,
            item.attending,
            item.guests,
            item.parkingRequired,
            item.timestamp,
            docId,
          ]);
          sheetDocIds.add(docId);
        }
      }
    }
  });

  SpreadsheetApp.flush();
  setKnownIds_("KNOWN_RSVP_IDS", Array.from(sheetDocIds));
}

function pullAllBlessingsFromFirebaseToSheet() {
  const ss = getSpreadsheet_();
  if (!ss) return;

  const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/blessings?key=${FIREBASE_API_KEY}`;
  const response = UrlFetchApp.fetch(firestoreUrl, { muteHttpExceptions: true });

  if (response.getResponseCode() !== 200) {
    ss.toast("Failed to connect to Firebase", "Error", 5);
    return;
  }

  const data = JSON.parse(response.getContentText());
  const documents = data.documents || [];

  const brideSheet = getOrCreateSheet_("BLESSINGS_BRIDE", "blessing");
  const groomSheet = getOrCreateSheet_("BLESSINGS_GROOM", "blessing");

  clearSheetData_(brideSheet);
  clearSheetData_(groomSheet);

  const importedIds = [];
  documents.forEach((doc) => {
    const fields = doc.fields || {};
    const docId = doc.name.split("/").pop();
    const name = fields.name?.stringValue || "";
    const side = fields.side?.stringValue || "Bride Side";
    const message = fields.message?.stringValue || "";
    const timestamp = fields.timestamp?.timestampValue || fields.timestamp?.stringValue || new Date().toISOString();
    const hearts = fields.hearts?.integerValue ? parseInt(fields.hearts.integerValue, 10) : 1;

    const targetSheet = side.toLowerCase().includes("groom") ? groomSheet : brideSheet;
    if (targetSheet) {
      targetSheet.appendRow([name, side, message, timestamp, hearts, docId]);
      importedIds.push(docId);
    }
  });

  SpreadsheetApp.flush();
  setKnownIds_("KNOWN_BLESSING_IDS", importedIds);
  ss.toast(`Successfully imported ${importedIds.length} blessings with live heart counts from Firebase!`, "Wedding Admin", 5);
}

function setupInstantTriggers() {
  const ss = getSpreadsheet_();
  if (!ss) {
    SpreadsheetApp.getUi().alert("Please open this script directly from the Google Sheet container.");
    return;
  }

  PropertiesService.getScriptProperties().setProperty("SPREADSHEET_ID", ss.getId());

  const triggers = ScriptApp.getProjectTriggers();

  triggers.forEach((t) => {
    const fn = t.getHandlerFunction();
    if (
      fn === "handleSpreadsheetChange_" ||
      fn === "instantBidirectionalSync" ||
      fn === "syncSheetDeletionsToFirebase" ||
      fn === "syncDriveFolderToGallerySheet_Silent"
    ) {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger("handleSpreadsheetChange_")
    .forSpreadsheet(ss)
    .onChange()
    .create();

  // 1-Minute Auto-Sync for Firebase ↔ Sheets Bi-directional Sync
  ScriptApp.newTrigger("instantBidirectionalSync")
    .timeBased()
    .everyMinutes(1)
    .create();

  // 1-Minute Auto-Sync for Google Drive Gallery Photos
  ScriptApp.newTrigger("syncDriveFolderToGallerySheet_Silent")
    .timeBased()
    .everyMinutes(1)
    .create();

  // Immediately run sync once to populate known IDs
  instantBidirectionalSync();

  ss.toast("🚀 All Instant Auto-Sync Triggers are active! (Every 1 minute & Real-time Sheet -> Website Deletions)", "Activated", 6);
}

function clearSheetData_(sheet) {
  if (!sheet) return;
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }
}

function getOrCreateSheet_(name, type) {
  const ss = getSpreadsheet_();
  if (!ss) return null;
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }

  if (sheet.getLastRow() === 0) {
    if (type === "blessing") {
      sheet.getRange(1, 1, 1, 6).setValues([["Name", "Side", "Message", "Timestamp", "Hearts (❤️)", "FirebaseDocID"]]);
      sheet.getRange(1, 1, 1, 6).setFontWeight("bold");
      sheet.setFrozenRows(1);
    } else if (type === "rsvp") {
      sheet.getRange(1, 1, 1, 7).setValues([["Name", "Side", "Attending", "Guests", "Parking Required", "Timestamp", "FirebaseDocID"]]);
      sheet.getRange(1, 1, 1, 7).setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
  }

  return sheet;
}

function getOrCreateGallerySheet_() {
  const ss = getSpreadsheet_();
  if (!ss) return null;
  const sheets = ss.getSheets();
  const targetName = (typeof GALLERY_SHEET_NAME !== "undefined" && GALLERY_SHEET_NAME) ? GALLERY_SHEET_NAME : "GALLERY";

  let sheet = ss.getSheetByName(targetName) ||
              sheets.find(function(s) { return s.getName().trim().toUpperCase() === targetName.toUpperCase(); }) ||
              sheets.find(function(s) { return s.getName().trim().toLowerCase().indexOf("gallery") !== -1; });

  if (!sheet) {
    sheet = ss.insertSheet(targetName);
    sheet.appendRow(["IMAGE_URL", "PHOTO_CAPTION", "DRIVE_FILE_ID", "DATE_ADDED", "PREVIEW"]);
    sheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#f0e6dd");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getOrCreateGuestUploadsSheet_() {
  const ss = getSpreadsheet_();
  if (!ss) return null;
  const sheets = ss.getSheets();
  const targetName = (typeof GUEST_UPLOADS_SHEET_NAME !== "undefined" && GUEST_UPLOADS_SHEET_NAME) ? GUEST_UPLOADS_SHEET_NAME : "GUEST_UPLOADS";

  let sheet = ss.getSheetByName(targetName) ||
              sheets.find(function(s) { return s.getName().trim().toUpperCase() === targetName.toUpperCase(); }) ||
              sheets.find(function(s) { return s.getName().trim().toLowerCase().indexOf("guest") !== -1; });

  if (!sheet) {
    sheet = ss.insertSheet(targetName);
    sheet.appendRow([
      "Uploader Name",
      "Photo Count",
      "Ceremony / Event",
      "Date",
      "Time",
      "Drive Folder Link",
      "Batch ID",
      "Timestamp"
    ]);
    sheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#e6edf5");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Handles incoming guest photo/video upload from website into Google Drive
 * Saves exclusively into 'Guest Uploaded Gallery' (keeps curated invite gallery clean!)
 * Uses uploader's full name in file naming (e.g. Rohan_Gupta_20260907_Haldi_photo1.jpg)
 * Logs: Uploader Name, Photo Count, Ceremony, Date, Time to 'GUEST_UPLOADS' sheet & Telegram.
 */
function handleMediaUpload_(payload) {
  try {
    const folder = getGuestUploadFolder_();
    if (!folder) {
      return jsonResponse_({ ok: false, error: "Guest Uploaded Gallery folder could not be found or created." });
    }

    const rawData = String(payload.fileData || "");
    const rawBase64 = rawData.indexOf(",") !== -1 ? rawData.split(",")[1] : rawData;
    const mimeType = payload.mimeType || "image/jpeg";
    const uploaderName = (payload.uploaderName || "Guest").trim();
    const safeUploader = uploaderName ? uploaderName.replace(/[^a-zA-Z0-9_-]/g, "_") : "Guest";
    const ceremony = (payload.ceremony || "General").trim();
    const ceremonyTag = ceremony.replace(/[^a-zA-Z0-9_-]/g, "_");

    const timestampStr = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyyMMdd_HHmmss");
    const originalName = (payload.fileName || "photo.jpg").replace(/[^a-zA-Z0-9._-]/g, "_");
    const finalFileName = safeUploader + "_" + timestampStr + "_" + ceremonyTag + "_" + originalName;

    let fileId = "";
    let driveViewUrl = "";

    // 1. Create file in 'Guest Uploaded Gallery' Google Drive folder
    try {
      const decoded = Utilities.base64Decode(rawBase64);
      const blob = Utilities.newBlob(decoded, mimeType, finalFileName);
      const file = folder.createFile(blob);
      fileId = file.getId();

      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (e) {
        Logger.log("Set sharing warning: " + e);
      }

      driveViewUrl = file.getUrl();
    } catch (driveErr) {
      Logger.log("DriveApp error: " + driveErr);
      return jsonResponse_({ ok: false, error: "Drive upload error: " + driveErr.toString() });
    }

    const fileIndex = typeof payload.fileIndex === "number" ? payload.fileIndex : 0;
    const totalCount = typeof payload.totalCount === "number" ? payload.totalCount : 1;
    const batchId = payload.batchId || "";
    const dateStr = Utilities.formatDate(new Date(), "Asia/Kolkata", "dd MMM yyyy");
    const timeStr = Utilities.formatDate(new Date(), "Asia/Kolkata", "hh:mm a");

    // 2. Log batch to dedicated 'GUEST_UPLOADS' sheet (Logged on first file of batch or single file)
    if (fileIndex === 0) {
      try {
        const uploadsSheet = getOrCreateGuestUploadsSheet_();
        uploadsSheet.appendRow([
          uploaderName,
          totalCount,
          ceremony,
          dateStr,
          timeStr,
          folder.getUrl(),
          batchId,
          new Date(),
        ]);
      } catch (e) {
        Logger.log("Guest uploads sheet update error: " + e);
      }
    }

    // 3. Send Telegram alert to hosts (Sent on completion of the batch)
    if (fileIndex === (totalCount - 1) || totalCount <= 1) {
      try {
        sendTelegramGuestBatchNotification_({
          uploaderName: uploaderName,
          photoCount: totalCount,
          ceremony: ceremony,
          dateStr: dateStr,
          timeStr: timeStr,
          driveFolderUrl: folder.getUrl(),
        });
      } catch (e) {
        Logger.log("Telegram media notification error: " + e);
      }
    }

    return jsonResponse_({
      ok: true,
      fileId: fileId,
      fileUrl: driveViewUrl,
    });
  } catch (err) {
    Logger.log("handleMediaUpload_ error: " + err);
    return jsonResponse_({ ok: false, error: err.toString() });
  }
}

/**
 * Sends a Telegram notification when guest(s) upload photo(s)
 * Includes: Uploader Name, Total Photos, Ceremony, Date, Time, and Drive folder link.
 */
function sendTelegramGuestBatchNotification_(data) {
  const botToken = getTelegramBotToken_();
  const chatId = getTelegramChatId_();
  if (!botToken || !chatId || botToken.indexOf("YOUR_") !== -1) return;

  const sender = data.uploaderName && data.uploaderName.trim() ? data.uploaderName.trim() : "A Loving Guest";
  const event = data.ceremony && data.ceremony.trim() ? data.ceremony.trim() : "Wedding";
  const text =
    "📸 <b>New Guest Photos Uploaded!</b> 📸\n\n" +
    "👤 <b>Uploaded By:</b> " + escapeHtml_(sender) + "\n" +
    "🔢 <b>Total Photos:</b> <b>" + data.photoCount + "</b>\n" +
    "🎪 <b>Ceremony / Event:</b> " + escapeHtml_(event) + "\n" +
    "📅 <b>Date:</b> " + data.dateStr + "\n" +
    "⏰ <b>Time:</b> " + data.timeStr + "\n\n" +
    "📁 <i>Stored safely in 'Guest Uploaded Gallery'</i>";

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: "📂 View in Google Drive",
          url: data.driveFolderUrl || ("https://drive.google.com/drive/folders/" + GALLERY_DRIVE_FOLDER_ID),
        },
      ],
    ],
  };

  sendTelegramApi_("sendMessage", {
    chat_id: chatId,
    text: text,
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
