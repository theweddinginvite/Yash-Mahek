import { useEffect, useRef, useState } from "react";
import {
  getWhatsAppShareText,
  downloadEventPdf,
  shareEventPdf,
} from "../utils/generateEventPdf";
import "./SaveEventsModal.css";

export default function SaveEventsModal({ isOpen, onClose, events = [], couple, venue }) {
  const [toastMessage, setToastMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) {
      setToastMessage("");
      return;
    }

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (onCloseRef.current) onCloseRef.current();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const partner1 = (couple?.partner1 || "Bride").replace(/oratna/i, "");
  const partner2 = (couple?.partner2 || "Groom").replace(/oratna/i, "");

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  }

  function handleShareText() {
    const text = getWhatsAppShareText(couple, events, venue);
    const encoded = encodeURIComponent(text);
    const url = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function handleSharePdf() {
    try {
      setIsProcessing(true);
      const res = await shareEventPdf({ events, couple, venue });
      if (res?.method === "download" && res?.fallback) {
        showToast("PDF downloaded! You can now send it on WhatsApp.");
      }
    } catch {
      showToast("Unable to share PDF directly. Downloading file...");
      downloadEventPdf({ events, couple, venue });
    } finally {
      setIsProcessing(false);
    }
  }

  function handleDownloadPdf() {
    try {
      setIsProcessing(true);
      downloadEventPdf({ events, couple, venue });
      showToast("PDF downloaded successfully!");
    } catch {
      showToast("Download failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div
      className="save-events-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-events-modal-title"
    >
      <div className="save-events-card" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          type="button"
          className="save-events-card__close-btn"
          onClick={onClose}
          aria-label="Close event schedule popup"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Scrollable Content */}
        <div className="save-events-card__body">
          {/* Header */}
          <div className="save-events-card__header">
            <span className="eyebrow">Wedding Itinerary</span>
            <h3 id="save-events-modal-title" className="save-events-card__title">
              Event Details
            </h3>
            <div className="save-events-card__divider" aria-hidden="true" />
          </div>

          {/* Events Itinerary List */}
          <div className="save-events-card__list">
            {events.map((event) => (
              <div key={event.name} className="save-events-card__item">
                <div className="save-events-card__item-top">
                  <span className="save-events-card__item-name">{event.name}</span>
                  <span className="save-events-card__item-time">
                    {event.day ? `${event.day.slice(0, 3)}, ` : ""}{event.date} · {event.time}
                  </span>
                </div>

                {/* 2x2 Grid: Event Details & Attire Details */}
                <div className="save-events-card__grid">
                  <div className="save-events-card__grid-label">Event details:</div>
                  <div className="save-events-card__grid-val">
                    {event.description && (
                      <p className="save-events-card__grid-desc">{event.description}</p>
                    )}
                    {event.meal && (
                      <p className="save-events-card__grid-meal">{event.meal}</p>
                    )}
                  </div>

                  {event.attire && (
                    <>
                      <div className="save-events-card__grid-label">Attire details:</div>
                      <div className="save-events-card__grid-val">
                        <p className="save-events-card__grid-attire">{event.attire}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Toast Notification */}
          {toastMessage && (
            <div className="save-events-card__toast" role="status">
              {toastMessage}
            </div>
          )}
        </div>

        {/* Footer Actions (3 Buttons) */}
        <div className="save-events-card__footer">
          <button
            type="button"
            className="save-events-card__btn save-events-card__btn--whatsapp"
            onClick={handleShareText}
            title="Share ceremony schedule on WhatsApp"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.63.076-1.85-.429-1.57-.648-2.58-2.247-2.66-2.355-.078-.108-.636-.848-.636-1.616 0-.769.403-1.147.546-1.303.143-.155.313-.194.417-.194.103 0 .207.002.298.006.096.004.226-.036.353.27.13.313.444 1.082.483 1.162.039.08.065.174.013.279-.052.104-.078.17-.156.26-.078.092-.163.205-.233.275-.078.078-.16.162-.069.318.092.156.408.673.875 1.089.601.535 1.109.7 1.265.778.156.078.247.065.338-.04.092-.104.39-.455.494-.61.104-.156.208-.13.351-.078.143.052.91.429 1.066.507.156.078.26.117.299.182.039.065.039.377-.105.782z" />
            </svg>
            Share as text
          </button>

          <button
            type="button"
            className="save-events-card__btn save-events-card__btn--share-pdf"
            onClick={handleSharePdf}
            disabled={isProcessing}
            title="Share PDF via device share sheet"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            Share as pdf
          </button>

          <button
            type="button"
            className="save-events-card__btn save-events-card__btn--download"
            onClick={handleDownloadPdf}
            disabled={isProcessing}
            title="Download PDF document"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download pdf
          </button>
        </div>
      </div>
    </div>
  );
}
