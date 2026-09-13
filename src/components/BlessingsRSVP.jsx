import { useEffect, useRef, useState } from "react";
import content from "../content";
import { addBlessingToFirestore, addRSVPToFirestore, isFirebaseConfigured, uploadGuestMedia } from "../lib/firebase";
import ConfettiBurst from "./ConfettiBurst";
import cameraIcon from "../assets/flaticons/camera-711191.png";
import rsvpIcon from "../assets/flaticons/rsvp-13430453.png";
import blessingsIcon from "../assets/flaticons/blessings-18060799.png";
import "./BlessingsRSVP.css";

const SIDES = ["Bride Side", "Groom Side"];

const CEREMONIES = [
  "General / All Events",
  "Haldi (Dec 5, 12:30 PM)",
  "Engagement & Sangeet (Dec 5, 5:00 PM)",
  "Godh Bharai & Sagai (Dec 5, 7:00 PM)",
  "Baraat & Jaimaal (Dec 6, 10:30 AM)",
  "Phere (Dec 6, 5:00 PM)",
];

function compressImageIfNeeded(file, maxDimension = 1800, quality = 0.86) {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/") || file.type === "image/gif") {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function submitToSheet(appsScriptUrl, payload) {
  return fetch(appsScriptUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });
}

function buildWhatsAppUrl(data, whatsappNumber) {
  if (!data) return "https://wa.me/";
  const { partner1, partner2 } = content.couple;
  const lines = [
    `RSVP for ${partner1} & ${partner2}'s wedding:`,
    `Name: ${data.name || ""}`,
    `Side: ${data.side || ""}`,
    `Attending: ${data.attending === "Yes" ? "Joyfully accept" : "Regretfully decline"}`,
    `Guests: ${data.guests || 1}`,
    `Parking Required: ${data.parkingRequired || "No"}`,
  ];
  const number = whatsappNumber ? String(whatsappNumber).replace(/\D/g, "") : "";
  return `https://wa.me/${number}?text=${encodeURIComponent(lines.join("\n"))}`;
}

function SendingAnimation({ message = `Delivering your blessings to ${content.couple.partner1} & ${content.couple.partner2}...` }) {
  return (
    <div className="sending-animation" aria-live="polite">
      <div className="sending-animation__visual">
        <div className="sending-animation__envelope">
          <svg viewBox="0 0 80 56" className="sending-animation__svg" aria-hidden="true">
            <rect x="2" y="2" width="76" height="52" rx="6" fill="#fdfbf7" stroke="#b08968" strokeWidth="1.5" />
            <path d="M4 6 L40 34 L76 6" fill="none" stroke="#b08968" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M4 50 L30 26" fill="none" stroke="rgba(176, 137, 104, 0.4)" strokeWidth="1.2" />
            <path d="M76 50 L50 26" fill="none" stroke="rgba(176, 137, 104, 0.4)" strokeWidth="1.2" />
            <circle cx="40" cy="33" r="8" fill="#8f3350" />
            <circle cx="40" cy="33" r="6.5" fill="none" stroke="#d4af37" strokeWidth="1" />
            <path d="M37.5 33.5 L39.5 35.5 L43 31" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="sending-animation__sparkles">
            <span className="sending-sparkle sending-sparkle--1">✨</span>
            <span className="sending-sparkle sending-sparkle--2">🌸</span>
            <span className="sending-sparkle sending-sparkle--3">✨</span>
          </div>
        </div>
        <div className="sending-animation__trail" />
      </div>
      <p className="sending-animation__text">{message}</p>
      <div className="sending-animation__bar">
        <div className="sending-animation__progress" />
      </div>
    </div>
  );
}

function BlessingForm({ appsScriptUrl, onBlessingSent, onCelebrate, onSwitchToRsvp, initialName = "", initialSide = SIDES[0] }) {
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error | not-configured
  const [form, setForm] = useState({ name: initialName, side: initialSide, message: "" });
  const [submittedName, setSubmittedName] = useState("");

  // Sync initial props if they change
  useEffect(() => {
    if (initialName && form.name !== initialName) {
      setForm((f) => ({ ...f, name: initialName, side: initialSide || f.side }));
    }
  }, [initialName, initialSide]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isFirebaseConfigured && !appsScriptUrl) {
      setStatus("not-configured");
      return;
    }
    setStatus("submitting");
    const nameToSave = form.name;
    const sideToSave = form.side;
    const startTime = Date.now();

    try {
      let docRef = null;
      if (isFirebaseConfigured) {
        docRef = await addBlessingToFirestore({ ...form });
        if (appsScriptUrl) {
          submitToSheet(appsScriptUrl, {
            type: "blessing",
            ...form,
            firestoreId: docRef?.id || "",
          }).catch(() => {});
        }
      } else {
        const res = await submitToSheet(appsScriptUrl, { type: "blessing", ...form });
        if (!res.ok) throw new Error("Request failed");
      }

      // Ensure minimum animation duration of 1.4s for smooth visual delight
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 1400 - elapsed);
      await new Promise((r) => setTimeout(r, remaining));

      const trimmedName = nameToSave.trim();
      const trimmedMessage = form.message.trim();

      setSubmittedName(trimmedName);
      setStatus("success");
      onBlessingSent({
        id: docRef?.id,
        name: trimmedName,
        side: sideToSave,
        message: trimmedMessage,
      });
      onCelebrate();
      setForm({ name: "", side: sideToSave, message: "" });
    } catch (err) {
      console.error("Blessing submission error:", err);
      setStatus("error");
    }
  };

  if (status === "submitting") {
    return <SendingAnimation message={`Delivering your heartfelt blessings to ${content.couple.partner1} & ${content.couple.partner2}…`} />;
  }

  if (status === "success") {
    return (
      <div className="form-status form-status--success">
        <div className="form-status__seal">
          <span className="form-status__seal-icon">🌸</span>
        </div>
        <h3 className="form-status__title">Blessings Delivered!</h3>
        <p className="form-status__desc">
          Thank you{submittedName ? `, ${submittedName}` : ""}! Your warm wishes and blessings have reached {content.couple.partner1} &amp; {content.couple.partner2}.
        </p>
        <div className="form-status__actions">
          <button
            type="button"
            className="button form-status__btn form-status__btn--primary"
            onClick={() => onSwitchToRsvp?.(submittedName || "", form.side || SIDES[0])}
          >
            <span style={{ marginRight: "0.35rem" }}>💌</span> RSVP for the Wedding
          </button>
          <a href="#blessings" className="button form-status__btn form-status__btn--secondary">
            View on Blessings Wall
          </a>
          <button
            type="button"
            className="button form-status__btn form-status__btn--subtle"
            onClick={() => setStatus("idle")}
          >
            Send Another Blessing
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="rsvp-form-fields" onSubmit={handleSubmit}>
      <label>
        <span className="rsvp-form-fields__label-text">Your Name</span>
        <input
          type="text"
          required
          placeholder="e.g. Rahul & Sunita Gupta"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </label>

      <div className="rsvp-form-fields__side-group">
        <span className="rsvp-form-fields__label-text">Which side are you on?</span>
        <div className="side-selector-pills">
          {SIDES.map((side) => (
            <label
              key={side}
              className={`side-pill ${form.side === side ? "is-selected" : ""}`}
            >
              <input
                type="radio"
                name="blessing-side"
                value={side}
                checked={form.side === side}
                onChange={() => setForm({ ...form, side })}
              />
              <span className="side-pill__indicator" />
              <span className="side-pill__text">{side}</span>
            </label>
          ))}
        </div>
      </div>

      <label>
        <span className="rsvp-form-fields__label-text">Your Message &amp; Blessings</span>
        <textarea
          required
          rows={4}
          placeholder="Write your heartfelt wishes for the couple…"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
      </label>

      {status === "error" && (
        <p className="form-status form-status--error">
          Something went wrong — please try again.
        </p>
      )}
      {status === "not-configured" && (
        <p className="form-status form-status--error">
          This form isn&apos;t connected yet. (See README.md to set up the backend.)
        </p>
      )}

      <button type="submit" className="button rsvp-submit-btn" disabled={status === "submitting"}>
        <img src={blessingsIcon} alt="" className="rsvp-btn-flaticon" /> Send Blessings
      </button>
    </form>
  );
}

function RsvpForm({ appsScriptUrl, whatsappNumber, onCelebrate, onSwitchToBlessings, initialName = "", initialSide = SIDES[0] }) {
  const [status, setStatus] = useState("idle");
  const [form, setForm] = useState({
    name: initialName,
    side: initialSide,
    attending: "Yes",
    guests: 1,
    parkingRequired: "No",
  });
  const [submittedData, setSubmittedData] = useState(null);

  // Sync initial props if they change
  useEffect(() => {
    if (initialName && form.name !== initialName) {
      setForm((f) => ({ ...f, name: initialName, side: initialSide || f.side }));
    }
  }, [initialName, initialSide]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isFirebaseConfigured && !appsScriptUrl) {
      setStatus("not-configured");
      return;
    }
    setStatus("submitting");
    const currentData = { ...form };
    const startTime = Date.now();

    try {
      if (isFirebaseConfigured) {
        const docRef = await addRSVPToFirestore({ ...form });
        if (appsScriptUrl) {
          submitToSheet(appsScriptUrl, {
            type: "rsvp",
            ...form,
            firestoreId: docRef?.id || "",
          }).catch(() => {});
        }
      } else {
        const res = await submitToSheet(appsScriptUrl, { type: "rsvp", ...form });
        if (!res.ok) throw new Error("Request failed");
      }

      // Ensure minimum animation duration of 1.4s
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 1400 - elapsed);
      await new Promise((r) => setTimeout(r, remaining));

      setStatus("success");
      setSubmittedData(currentData);
      onCelebrate();
      setForm({ name: "", side: SIDES[0], attending: "Yes", guests: 1, parkingRequired: "No" });
    } catch (err) {
      console.error("RSVP submission error:", err);
      setStatus("error");
    }
  };

  if (status === "submitting") {
    return <SendingAnimation message={`Sending your RSVP confirmation to ${content.couple.partner1} & ${content.couple.partner2}…`} />;
  }

  if (status === "success") {
    return (
      <div className="form-status form-status--success">
        <div className="form-status__seal">
          <span className="form-status__seal-icon">🎉</span>
        </div>
        <h3 className="form-status__title">RSVP Confirmed!</h3>
        <p className="form-status__desc">
          Thank you{submittedData?.name ? `, ${submittedData.name}` : ""}! Your response has been recorded for {content.couple.partner1} &amp; {content.couple.partner2}&apos;s wedding. We look forward to celebrating together!
        </p>
        <div className="form-status__actions">
          <button
            type="button"
            className="button form-status__btn form-status__btn--primary"
            onClick={() => onSwitchToBlessings?.(submittedData?.name || "", submittedData?.side || SIDES[0])}
          >
            <span style={{ marginRight: "0.35rem" }}>✨</span> Send Blessings
          </button>
          {whatsappNumber !== false && (
            <a
              className="button form-status__btn form-status__btn--secondary"
              href={buildWhatsAppUrl(submittedData, whatsappNumber)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span style={{ marginRight: "0.35rem" }}>💬</span> Share via WhatsApp
            </a>
          )}
          <button
            type="button"
            className="button form-status__btn form-status__btn--subtle"
            onClick={() => setStatus("idle")}
          >
            Submit Another RSVP
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="rsvp-form-fields" onSubmit={handleSubmit}>
      <label>
        <span className="rsvp-form-fields__label-text">Your Name</span>
        <input
          type="text"
          required
          placeholder="e.g. Rahul Gupta"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </label>

      <div className="rsvp-form-fields__side-group">
        <span className="rsvp-form-fields__label-text">Which side are you on?</span>
        <div className="side-selector-pills">
          {SIDES.map((side) => (
            <label
              key={side}
              className={`side-pill ${form.side === side ? "is-selected" : ""}`}
            >
              <input
                type="radio"
                name="rsvp-side"
                value={side}
                checked={form.side === side}
                onChange={() => setForm({ ...form, side })}
              />
              <span className="side-pill__indicator" />
              <span className="side-pill__text">{side}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="rsvp-form-fields__row">
        <label className="rsvp-form-fields__col">
          <span className="rsvp-form-fields__label-text">Will you attend?</span>
          <select
            value={form.attending}
            onChange={(e) => setForm({ ...form, attending: e.target.value })}
          >
            <option value="Yes">Joyfully accept</option>
            <option value="No">Regretfully decline</option>
          </select>
        </label>

        <label className="rsvp-form-fields__col">
          <span className="rsvp-form-fields__label-text">Guests (incl. you)</span>
          <input
            type="number"
            min={1}
            max={10}
            value={form.guests}
            onChange={(e) => setForm({ ...form, guests: e.target.value })}
          />
        </label>
      </div>

      <label>
        <span className="rsvp-form-fields__label-text">Parking required?</span>
        <select
          value={form.parkingRequired}
          onChange={(e) => setForm({ ...form, parkingRequired: e.target.value })}
        >
          <option value="No">No</option>
          <option value="Yes">Yes</option>
        </select>
      </label>

      {status === "error" && (
        <p className="form-status form-status--error">
          Something went wrong — please try again.
        </p>
      )}
      {status === "not-configured" && (
        <p className="form-status form-status--error">
          This form isn&apos;t connected yet. (See README.md to set up the backend.)
        </p>
      )}

      <button type="submit" className="button rsvp-submit-btn" disabled={status === "submitting"}>
        <img src={rsvpIcon} alt="" className="rsvp-btn-flaticon" /> Send RSVP
      </button>
    </form>
  );
}

function MediaUploadForm({
  appsScriptUrl,
  initialName = "",
  initialSide = SIDES[0],
  onCelebrate,
  onSwitchToBlessings,
}) {
  const [uploaderName, setUploaderName] = useState(initialName);
  const [ceremony, setCeremony] = useState(CEREMONIES[0]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState("idle"); // 'idle' | 'uploading' | 'success' | 'error'
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [fileProgresses, setFileProgresses] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFilesAdded = (filesList) => {
    if (!filesList || filesList.length === 0) return;
    const newFiles = Array.from(filesList).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (indexToRemove) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const startUpload = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;

    const targetUrl = appsScriptUrl || content.integrations?.appsScriptUrl || content.appsScriptUrl;
    if (!targetUrl) {
      setErrorMessage("Apps Script integration URL is not configured.");
      setUploadStatus("error");
      return;
    }

    setUploadStatus("uploading");
    setErrorMessage("");

    const initialProgresses = {};
    selectedFiles.forEach((_, idx) => {
      initialProgresses[idx] = "pending";
    });
    setFileProgresses(initialProgresses);

    let successCount = 0;
    let lastErrorMsg = "";
    const batchId = "batch_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);

    for (let i = 0; i < selectedFiles.length; i++) {
      setCurrentFileIndex(i);
      setFileProgresses((prev) => ({ ...prev, [i]: "uploading" }));

      const file = selectedFiles[i];
      try {
        const base64Data = await compressImageIfNeeded(file);

        await uploadGuestMedia({
          file,
          base64Data,
          uploaderName: uploaderName.trim() || "Guest",
          ceremony,
          batchId,
          totalCount: selectedFiles.length,
          fileIndex: i,
          appsScriptUrl: targetUrl,
        });

        setFileProgresses((prev) => ({ ...prev, [i]: "done" }));
        successCount++;
      } catch (err) {
        console.error("Upload error for file", file.name, err);
        lastErrorMsg = err.message || "";
        setFileProgresses((prev) => ({ ...prev, [i]: "error" }));
      }
    }

    if (successCount > 0) {
      setUploadStatus("success");
      if (onCelebrate) onCelebrate();
    } else {
      setUploadStatus("error");
      setErrorMessage(lastErrorMsg || "Could not upload photos. Please check your connection and try again.");
    }
  };

  const totalFiles = selectedFiles.length;
  const completedFiles = Object.values(fileProgresses).filter((s) => s === "done").length;
  const overallProgress =
    totalFiles > 0
      ? Math.round(((completedFiles + (uploadStatus === "uploading" ? 0.4 : 0)) / totalFiles) * 100)
      : 0;
  const currentFileName = selectedFiles[currentFileIndex]?.name || "";

  if (uploadStatus === "uploading") {
    return (
      <div className="media-upload-progress">
        <div className="gallery-upload__spinner-wrap" style={{ margin: "0 auto 0.5rem" }}>
          <div className="gallery-upload__spinner" />
          <span className="gallery-upload__spinner-icon">📸</span>
        </div>
        <h4 className="media-upload-title" style={{ textAlign: "center", color: "var(--color-burgundy)", margin: "0 0 0.65rem" }}>
          Uploading Your Memories...
        </h4>

        <div className="gallery-upload__progress-card">
          <div className="gallery-upload__progress-card-top">
            <span className="gallery-upload__counter-text">
              📸 Uploading photo {currentFileIndex + 1} of {totalFiles}
            </span>
            <span className="gallery-upload__percent-text">
              {Math.min(overallProgress, 99)}%
            </span>
          </div>

          <div className="gallery-upload__bar-track">
            <div
              className="gallery-upload__bar-fill"
              style={{ width: `${Math.min(overallProgress, 99)}%` }}
            />
          </div>

          <p className="gallery-upload__current-file">
            <span>Current:</span> {currentFileName}
          </p>
        </div>

        <div className="gallery-upload__file-status-list">
          {selectedFiles.map((file, idx) => {
            const status = fileProgresses[idx] || "pending";
            return (
              <div key={idx} className={`gallery-upload__file-status-row is-${status}`}>
                <span className="gallery-upload__file-status-name">{file.name}</span>
                <span className="gallery-upload__file-status-badge">
                  {status === "done" && "✓ Uploaded"}
                  {status === "uploading" && "⏳ Uploading..."}
                  {status === "pending" && "Queued"}
                  {status === "error" && "✕ Failed"}
                </span>
              </div>
            );
          })}
        </div>

        <div className="gallery-upload__safety-notice">
          <span>⚠️ Please keep this page open until all files finish uploading.</span>
        </div>
      </div>
    );
  }

  if (uploadStatus === "success") {
    return (
      <div className="form-status form-status--success">
        <div className="form-status__seal">
          <span className="form-status__seal-icon">📸</span>
        </div>
        <h3 className="form-status__title">Memories Uploaded!</h3>
        <p className="form-status__desc">
          Thank you{uploaderName ? `, ${uploaderName.trim()}` : ""}! Your photos &amp; videos have been safely saved to {content.couple.partner1} &amp; {content.couple.partner2}&apos;s wedding album.
        </p>

        <div className="form-status__actions">
          <button
            type="button"
            className="button form-status__btn form-status__btn--primary"
            onClick={() => {
              setSelectedFiles([]);
              setUploadStatus("idle");
            }}
          >
            <img src={cameraIcon} alt="" className="rsvp-btn-flaticon" style={{ marginRight: "0.35rem" }} />
            Upload More Photos
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={startUpload} className="rsvp-form-fields media-upload-form">
      <label>
        <span className="rsvp-form-fields__label-text">Your Name</span>
        <input
          type="text"
          placeholder="e.g. Rahul & Sunita Gupta"
          value={uploaderName}
          onChange={(e) => setUploaderName(e.target.value)}
          maxLength={60}
        />
      </label>

      <label>
        <span className="rsvp-form-fields__label-text">Ceremony / Event</span>
        <select value={ceremony} onChange={(e) => setCeremony(e.target.value)}>
          {CEREMONIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      {/* Dropzone */}
      <div
        className={`gallery-upload__dropzone ${isDragOver ? "is-dragover" : ""} ${selectedFiles.length > 0 ? "is-compact" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
        }}
        aria-label="Click or drag and drop photos here"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => handleFilesAdded(e.target.files)}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={(e) => handleFilesAdded(e.target.files)}
        />

        <div className="gallery-upload__dropzone-icon">
          <img src={cameraIcon} alt="" className="gallery-upload__dropzone-flaticon" />
        </div>
        <p className="gallery-upload__dropzone-title">
          {selectedFiles.length > 0 ? (
            <>
              <strong>+ Add more photos</strong> or drag &amp; drop
            </>
          ) : (
            <>
              <strong>Click to select photos</strong> or drag &amp; drop here
            </>
          )}
        </p>
        {selectedFiles.length === 0 && (
          <p className="gallery-upload__dropzone-hint">
            Supports JPG, PNG, HEIC, WEBP, and MP4 videos
          </p>
        )}

        {/* Mobile Camera Button - only when no files selected */}
        {selectedFiles.length === 0 && (
          <div className="gallery-upload__camera-btn-wrap" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="gallery-upload__camera-btn"
              onClick={() => cameraInputRef.current?.click()}
            >
              <img src={cameraIcon} alt="" className="gallery-upload__camera-btn-flaticon" />
              Take Photo
            </button>
          </div>
        )}
      </div>

      {/* Selected Files Preview List */}
      {selectedFiles.length > 0 && (
        <div className="gallery-upload__selected-wrap">
          <div className="gallery-upload__selected-header">
            <span>Selected Files ({selectedFiles.length})</span>
            <button
              type="button"
              className="gallery-upload__clear-all"
              onClick={() => setSelectedFiles([])}
            >
              Clear all
            </button>
          </div>
          <div className="gallery-upload__selected-list">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="gallery-upload__file-chip">
                <span className="gallery-upload__file-chip-name">{file.name}</span>
                <span className="gallery-upload__file-chip-size">
                  {formatFileSize(file.size)}
                </span>
                <button
                  type="button"
                  className="gallery-upload__file-chip-remove"
                  onClick={() => removeFile(idx)}
                  aria-label={`Remove ${file.name}`}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {errorMessage && <p className="form-status form-status--error">{errorMessage}</p>}

      <button
        type="button"
        className="button rsvp-submit-btn"
        onClick={(e) => {
          if (selectedFiles.length === 0) {
            fileInputRef.current?.click();
          } else {
            startUpload(e);
          }
        }}
      >
        <img src={cameraIcon} alt="" className="rsvp-btn-flaticon" />
        {selectedFiles.length > 0
          ? `Upload ${selectedFiles.length} ${selectedFiles.length === 1 ? "Photo/Video" : "Photos/Videos"} →`
          : "Select Photos & Videos to Upload"}
      </button>
    </form>
  );
}

export default function BlessingsRSVP({ onBlessingSent }) {
  const { blessingsRsvp, integrations } = content;
  const [activeTab, setActiveTab] = useState("rsvp");
  const [prefilledName, setPrefilledName] = useState("");
  const [prefilledSide, setPrefilledSide] = useState(SIDES[0]);
  const [celebrateTrigger, setCelebrateTrigger] = useState(0);
  const celebrate = () => setCelebrateTrigger((t) => t + 1);

  const handleSwitchToBlessings = (name, side) => {
    if (name) setPrefilledName(name);
    if (side) setPrefilledSide(side);
    setActiveTab("blessings");
  };

  const handleSwitchToRsvp = (name, side) => {
    if (name) setPrefilledName(name);
    if (side) setPrefilledSide(side);
    setActiveTab("rsvp");
  };

  const handleSwitchToPhotos = (name, side) => {
    if (name) setPrefilledName(name);
    if (side) setPrefilledSide(side);
    setActiveTab("photos");
  };

  return (
    <section id="blessings-rsvp" className="section section--surface">
      <ConfettiBurst trigger={celebrateTrigger} />
      <div className="section__inner">
        <div className="section__heading">
          <span className="eyebrow">Join The Celebration</span>
          <h2>{blessingsRsvp.heading}</h2>
          <p>{blessingsRsvp.subtext}</p>
        </div>

        {/* Royal Luxury Card Enclosure */}
        <div className="blessings-rsvp-card">
          {/* Card Decorative Luxury Frame */}
          <div className="blessings-rsvp-card__frame" aria-hidden="true">
            <span className="blessings-rsvp-card__inner-border" />
          </div>

          <div className="blessings-rsvp-card__content">
            {/* Segmented Royal Tabs */}
            <div className="rsvp-tabs__list" role="tablist" aria-label="Blessings, RSVP, and Photo upload options">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "blessings"}
                className={`rsvp-tabs__tab ${activeTab === "blessings" ? "is-active" : ""}`}
                onClick={() => setActiveTab("blessings")}
              >
                <img src={blessingsIcon} alt="" className="rsvp-tabs__tab-flaticon" />
                <span>Blessings</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "rsvp"}
                className={`rsvp-tabs__tab ${activeTab === "rsvp" ? "is-active" : ""}`}
                onClick={() => setActiveTab("rsvp")}
              >
                <img src={rsvpIcon} alt="" className="rsvp-tabs__tab-flaticon" />
                <span>RSVP</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "photos"}
                className={`rsvp-tabs__tab ${activeTab === "photos" ? "is-active" : ""}`}
                onClick={() => setActiveTab("photos")}
              >
                <img src={cameraIcon} alt="" className="rsvp-tabs__tab-flaticon" />
                <span>Upload Photos</span>
              </button>
            </div>

            {/* Panel Area */}
            <div className="rsvp-tabs__panel">
              {activeTab === "blessings" && (
                <BlessingForm
                  key={`blessing-${prefilledName}`}
                  initialName={prefilledName}
                  initialSide={prefilledSide}
                  appsScriptUrl={integrations?.appsScriptUrl || integrations?.googleSheets?.appsScriptUrl}
                  onBlessingSent={onBlessingSent}
                  onCelebrate={celebrate}
                  onSwitchToRsvp={handleSwitchToRsvp}
                />
              )}
              {activeTab === "rsvp" && (
                <RsvpForm
                  key={`rsvp-${prefilledName}`}
                  initialName={prefilledName}
                  initialSide={prefilledSide}
                  appsScriptUrl={integrations?.appsScriptUrl || integrations?.googleSheets?.appsScriptUrl}
                  whatsappNumber={integrations?.whatsappNumber || integrations?.whatsapp?.rsvpNumber || ""}
                  onCelebrate={celebrate}
                  onSwitchToBlessings={handleSwitchToBlessings}
                />
              )}
              {activeTab === "photos" && (
                <MediaUploadForm
                  key={`upload-${prefilledName}`}
                  initialName={prefilledName}
                  initialSide={prefilledSide}
                  appsScriptUrl={integrations?.appsScriptUrl || integrations?.googleSheets?.appsScriptUrl}
                  onCelebrate={celebrate}
                  onSwitchToBlessings={handleSwitchToBlessings}
                  onSwitchToRsvp={handleSwitchToRsvp}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
