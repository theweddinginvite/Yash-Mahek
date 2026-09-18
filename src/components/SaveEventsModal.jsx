import { useEffect, useRef, useState } from "react";
import { asset } from "../content";
import {
  getWhatsAppShareText,
  downloadEventPdf,
  shareEventPdf,
  getItineraryEvents,
} from "../utils/generateEventPdf";
import whatsappIcon from "../assets/flaticons/whatsapp-2582600.png";
import sharePdfIcon from "../assets/flaticons/share-1358023.png";
import downloadPdfIcon from "../assets/flaticons/download-pdf-7257793.png";
import "./SaveEventsModal.css";

export default function SaveEventsModal({ isOpen, onClose, events = [], couple, venue }) {
  const [toastMessage, setToastMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const autoCloseSeconds = venue?.saveEventsAutoCloseSeconds ?? 90;

  const itinerary = getItineraryEvents(events);

  useEffect(() => {
    if (!isOpen) {
      setToastMessage("");
      return;
    }

    const autoCloseMs = autoCloseSeconds * 1000;
    const timerId = setTimeout(() => {
      if (onCloseRef.current) {
        onCloseRef.current();
      }
    }, autoCloseMs);

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (onCloseRef.current) onCloseRef.current();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      clearTimeout(timerId);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, autoCloseSeconds]);

  if (!isOpen) return null;

  const partner1 = (couple?.partner1 || "Bride").replace(/oratna/i, "");
  const partner2 = (couple?.partner2 || "Groom").replace(/oratna/i, "");

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  }

  async function handleShareText() {
    const text = getWhatsAppShareText(couple, itinerary, venue);
    const encoded = encodeURIComponent(text);
    const waUrl = `https://api.whatsapp.com/send?text=${encoded}`;

    try {
      setIsProcessing(true);
      const cardImageUrl = asset("/images/wedding_invite_card.png");
      if (navigator.canShare) {
        const response = await fetch(cardImageUrl);
        if (response.ok) {
          const blob = await response.blob();
          const cardFile = new File([blob], `Wedding_Invitation_${partner1}_${partner2}.png`, {
            type: "image/png",
          });
          if (navigator.canShare({ files: [cardFile] })) {
            await navigator.share({
              files: [cardFile],
              text: text,
              title: `The Wedding of ${partner1} & ${partner2}`,
            });
            return;
          }
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        return;
      }
    } finally {
      setIsProcessing(false);
    }

    window.open(waUrl, "_blank", "noopener,noreferrer");
  }

  async function handleSharePdf() {
    try {
      setIsProcessing(true);
      const res = await shareEventPdf({ events: itinerary, couple, venue });
      if (res?.method === "download" && res?.fallback) {
        showToast("PDF downloaded! You can now send it on WhatsApp.");
      }
    } catch {
      showToast("Unable to share PDF directly. Downloading file...");
      await downloadEventPdf({ events: itinerary, couple, venue });
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDownloadPdf() {
    try {
      setIsProcessing(true);
      await downloadEventPdf({ events: itinerary, couple, venue });
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
        {/* Pinned Top Progress Timer Bar */}
        <div
          className="save-events-card__timer-bar"
          style={{
            animationDuration: `${autoCloseSeconds}s`,
          }}
          onAnimationEnd={onClose}
          aria-hidden="true"
        />

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
            {itinerary.map((event) => (
              <div
                key={`${event.name}-${event.time}`}
                className={`save-events-card__item ${event.isFoodEvent ? "save-events-card__item--food" : ""}`}
              >
                <div className="save-events-card__item-top">
                  <span className="save-events-card__item-name">{event.name}</span>
                  <span className="save-events-card__item-time">
                    {event.day ? `${event.day.slice(0, 3)}, ` : ""}{event.date} · {event.time}
                  </span>
                </div>

                {/* Grid details (only rendered if description, meal, or attire exists) */}
                {(event.description || event.meal || event.attire) && (
                  <div className="save-events-card__grid">
                    {(event.description || event.meal) && (
                      <>
                        <div className="save-events-card__grid-label">Event details:</div>
                        <div className="save-events-card__grid-val">
                          {event.description && (
                            <p className="save-events-card__grid-desc">{event.description}</p>
                          )}
                          {event.meal && (
                            <p className="save-events-card__grid-meal">{event.meal}</p>
                          )}
                        </div>
                      </>
                    )}

                    {event.attire && (
                      <>
                        <div className="save-events-card__grid-label">Attire details:</div>
                        <div className="save-events-card__grid-val">
                          <p className="save-events-card__grid-attire">{event.attire}</p>
                        </div>
                      </>
                    )}
                  </div>
                )}
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
            <img src={whatsappIcon} alt="" className="save-events-card__btn-icon" aria-hidden="true" />
            Share as text
          </button>

          <button
            type="button"
            className="save-events-card__btn save-events-card__btn--share-pdf"
            onClick={handleSharePdf}
            disabled={isProcessing}
            title="Share PDF via device share sheet"
          >
            <img src={sharePdfIcon} alt="" className="save-events-card__btn-icon" aria-hidden="true" />
            Share as pdf
          </button>

          <button
            type="button"
            className="save-events-card__btn save-events-card__btn--download"
            onClick={handleDownloadPdf}
            disabled={isProcessing}
            title="Download PDF document"
          >
            <img src={downloadPdfIcon} alt="" className="save-events-card__btn-icon" aria-hidden="true" />
            Download pdf
          </button>
        </div>
      </div>
    </div>
  );
}
