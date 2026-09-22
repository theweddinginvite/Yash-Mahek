import { useEffect, useRef, useState } from "react";
import content from "../content";
import { uploadGuestMedia } from "../lib/firebase";
import cameraIcon from "../assets/flaticons/camera-711191.png";
import "./GalleryUploadModal.css";

const CEREMONIES = [
  "General / All Events",
  "Haldi (Dec 5, 12:30 PM)",
  "Engagement & Godh Bharai (Dec 5, 5:00 PM)",
  "Sagai & Sangeet (Dec 5, 7:00 PM)",
  "Baraat & Jaimaal (Dec 6, 10:30 AM)",
  "Phere (Dec 6, 5:00 PM)",
];

// Client-side image compressor for superfast mobile 4G/5G uploads
function compressImageIfNeeded(file, maxDimension = 1800, quality = 0.86) {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/") || file.type === "image/gif") {
      // Direct base64 for videos or GIFs
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

export default function GalleryUploadModal({ isOpen, onClose, onUploadSuccess }) {
  const p1 = (content.couple?.partner1 || "Bride").replace(/oratna/i, "");
  const p2 = (content.couple?.partner2 || "Groom").replace(/oratna/i, "");
  const [uploaderName, setUploaderName] = useState("");
  const [ceremony, setCeremony] = useState(CEREMONIES[0]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState("idle"); // 'idle' | 'uploading' | 'success' | 'error'
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [fileProgresses, setFileProgresses] = useState({}); // { [index]: 'pending' | 'uploading' | 'done' | 'error' }
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when closed
      setSelectedFiles([]);
      setUploadStatus("idle");
      setCurrentFileIndex(0);
      setFileProgresses({});
      setErrorMessage("");
      return;
    }

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && uploadStatus !== "uploading") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, uploadStatus, onClose]);

  if (!isOpen) return null;

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

    const appsScriptUrl = content.integrations?.appsScriptUrl || content.appsScriptUrl;
    if (!appsScriptUrl) {
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
          appsScriptUrl,
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
      if (onUploadSuccess) onUploadSuccess(successCount);
    } else {
      setUploadStatus("error");
      setErrorMessage(lastErrorMsg || "Could not upload photos. Please check your connection and try again.");
    }
  };

  const totalFiles = selectedFiles.length;
  const completedFiles = Object.values(fileProgresses).filter(
    (status) => status === "done"
  ).length;
  const overallProgress =
    totalFiles > 0
      ? Math.round(((completedFiles + (uploadStatus === "uploading" ? 0.4 : 0)) / totalFiles) * 100)
      : 0;

  const currentFileName = selectedFiles[currentFileIndex]?.name || "";

  return (
    <div
      className="gallery-upload-overlay"
      onClick={() => {
        if (uploadStatus !== "uploading") onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-upload-title"
    >
      <div className="gallery-upload-card" onClick={(e) => e.stopPropagation()}>
        {/* Top Close Button */}
        {uploadStatus !== "uploading" && (
          <button
            type="button"
            className="gallery-upload__close-btn"
            onClick={onClose}
            aria-label="Close upload popup"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        {/* Modal Content */}
        <div className="gallery-upload__body">
          {/* Header */}
          <div className="gallery-upload__header">
            <span className="eyebrow">Share The Love</span>
            <h3 id="gallery-upload-title" className="gallery-upload__title">
              Upload Photos &amp; Videos
            </h3>
            <div className="gallery-upload__divider" aria-hidden="true" />
            <p className="gallery-upload__subtitle">
              Captured a moment from {p1} &amp; {p2}&apos;s celebration? Share your candid memories with the family!
            </p>
          </div>

          {/* 1. UPLOADING IN-PROGRESS SCREEN */}
          {uploadStatus === "uploading" && (
            <div className="gallery-upload__progress-wrap">
              <div className="gallery-upload__spinner-wrap">
                <div className="gallery-upload__spinner" />
                <img src={cameraIcon} alt="" className="gallery-upload__spinner-flaticon" />
              </div>

              <h4 className="gallery-upload__progress-heading">Uploading Memories...</h4>

              {/* Integrated Live Counter Progress Bar Card */}
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

              {/* Per-File Status List */}
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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>Please keep this window open until all files finish uploading.</span>
              </div>
            </div>
          )}

          {/* 2. SUCCESS CELEBRATION SCREEN */}
          {uploadStatus === "success" && (
            <div className="gallery-upload__success-wrap">
              <div className="gallery-upload__success-icon">✓</div>
              <h4 className="gallery-upload__success-heading">Memories Uploaded!</h4>
              <p className="gallery-upload__success-text">
                Thank you so much! Your photos have been safely saved to {content.couple.partner1} &amp; {content.couple.partner2}&apos;s wedding album.
              </p>
              <div className="gallery-upload__success-actions">
                <button
                  type="button"
                  className="gallery-upload__btn gallery-upload__btn--outline"
                  onClick={() => {
                    setSelectedFiles([]);
                    setUploadStatus("idle");
                  }}
                >
                  Upload More Photos
                </button>
                <button
                  type="button"
                  className="gallery-upload__btn gallery-upload__btn--primary"
                  onClick={onClose}
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* 3. IDLE FORM SCREEN */}
          {uploadStatus === "idle" && (
            <form onSubmit={startUpload} className="gallery-upload__form">
              <div className="gallery-upload__fields-row">
                <div className="gallery-upload__field">
                  <label htmlFor="uploader-name" className="gallery-upload__label">
                    Your Name (Optional)
                  </label>
                  <input
                    id="uploader-name"
                    type="text"
                    className="gallery-upload__input"
                    placeholder="e.g. Rahul &amp; Priya Gupta"
                    value={uploaderName}
                    onChange={(e) => setUploaderName(e.target.value)}
                    maxLength={60}
                  />
                </div>

                <div className="gallery-upload__field">
                  <label htmlFor="ceremony-select" className="gallery-upload__label">
                    Ceremony / Event
                  </label>
                  <select
                    id="ceremony-select"
                    className="gallery-upload__select"
                    value={ceremony}
                    onChange={(e) => setCeremony(e.target.value)}
                  >
                    {CEREMONIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Drag and Drop Zone */}
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
                    Supports JPG, PNG, HEIC, WEBP, and MP4 videos (Select multiple)
                  </p>
                )}

                {/* Mobile Camera Quick Action */}
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

              {/* Error Notice if any */}
              {errorMessage && (
                <p className="gallery-upload__error-msg">{errorMessage}</p>
              )}

              {/* Submit Button */}
              <div className="gallery-upload__submit-wrap">
                <button
                  type="submit"
                  className="gallery-upload__btn gallery-upload__btn--primary"
                  disabled={selectedFiles.length === 0}
                >
                  <img src={cameraIcon} alt="" className="gallery-upload__btn-flaticon" />
                  {selectedFiles.length > 0
                    ? `Upload ${selectedFiles.length} ${selectedFiles.length === 1 ? "File" : "Files"} →`
                    : "Select Files to Upload"}
                </button>
              </div>
            </form>
          )}

          {/* 4. ERROR SCREEN */}
          {uploadStatus === "error" && (
            <div className="gallery-upload__error-wrap">
              <div className="gallery-upload__error-icon">✕</div>
              <h4 className="gallery-upload__error-heading">Upload Encountered an Issue</h4>
              <p className="gallery-upload__error-text">
                {errorMessage || "We could not upload some files. Please check your internet connection and try again."}
              </p>
              <div className="gallery-upload__error-actions">
                <button
                  type="button"
                  className="gallery-upload__btn gallery-upload__btn--outline"
                  onClick={() => setUploadStatus("idle")}
                >
                  Back to Files
                </button>
                <button
                  type="button"
                  className="gallery-upload__btn gallery-upload__btn--primary"
                  onClick={startUpload}
                >
                  Retry Upload
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
