import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import content, { asset } from "../content";
import {
  getWhatsAppVenueShareText,
  downloadVenuePdf,
  shareVenuePdf,
} from "../utils/generateVenuePdf";
import whatsappIcon from "../assets/flaticons/whatsapp-2582600.png";
import sharePdfIcon from "../assets/flaticons/share-1358023.png";
import downloadPdfIcon from "../assets/flaticons/download-pdf-7257793.png";
import "./VenueModal.css";

export default function VenueModal({ isOpen, onClose, venue: propVenue, couple: propCouple }) {
  const [toastMessage, setToastMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const venue = propVenue || content.venue;
  const couple = propCouple || content.couple;

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const autoCloseSeconds = venue?.modalAutoCloseSeconds ?? 90;

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

  if (!isOpen || !venue) return null;

  const partner1 = (couple?.partner1 || "Bride").replace(/oratna/i, "");
  const partner2 = (couple?.partner2 || "Groom").replace(/oratna/i, "");

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  }

  async function handleShareText() {
    const text = getWhatsAppVenueShareText(couple, venue);
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
      const res = await shareVenuePdf({ couple, venue });
      if (res?.method === "download" && res?.fallback) {
        showToast("PDF downloaded! You can now send it on WhatsApp.");
      }
    } catch {
      showToast("Unable to share PDF directly. Downloading file...");
      await downloadVenuePdf({ couple, venue });
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDownloadPdf() {
    try {
      setIsProcessing(true);
      await downloadVenuePdf({ couple, venue });
      showToast("PDF downloaded successfully!");
    } catch {
      showToast("Download failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div
      className="venue-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="venue-modal-title"
    >
      <div
        className="venue-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pinned Top Progress Timer Bar */}
        <div
          className="venue-modal__timer-bar"
          style={{
            animationDuration: `${autoCloseSeconds}s`,
          }}
          onAnimationEnd={onClose}
          aria-hidden="true"
        />

        {/* Pinned Top Right Close Button */}
        <button
          type="button"
          className="venue-modal__close-btn"
          onClick={onClose}
          aria-label="Close venue details popup"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Scrollable Modal Body */}
        <div className="venue-modal__body">
          {/* Header */}
          <div className="venue-modal__header">
            <span className="eyebrow">Location &amp; Travel Guide</span>
            <h3 id="venue-modal-title" className="venue-modal__title">
              How to Reach the Venue?
            </h3>
            <div className="venue-modal__divider" aria-hidden="true" />
            <p className="venue-modal__resort-name">{venue.name}</p>
            <p className="venue-modal__resort-addr">{venue.address}</p>
            {venue.phone && (
              <p className="venue-modal__resort-phone">
                <span>Helpdesk:</span> {venue.phone}
              </p>
            )}
          </div>

          {/* QR Code & Navigation Action */}
          <div className="venue-modal__action-box">
            <div className="venue-modal__qr-frame">
              <QRCodeSVG
                value={venue.qrUrl}
                size={124}
                level="M"
                fgColor="#2e2b28"
                bgColor="#ffffff"
              />
              <span className="venue-modal__qr-hint">Scan with camera for location</span>
            </div>

            <div className="venue-modal__directions-action">
              <p className="venue-modal__action-desc">
                Open exact venue pin and live turn-by-turn navigation directly on your device:
              </p>
              <div className="venue-modal__action-btns">
                <a
                  href={venue.directionsUrl || venue.qrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="venue-modal__btn venue-modal__btn--directions"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  Maps Direction
                </a>

                <a
                  href={venue.qrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="venue-modal__btn venue-modal__btn--search"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  Google Search Resort
                </a>
              </div>
            </div>
          </div>

          {/* Travel & Directions - 3 Mode Cards (By Road, By Train, By Air) */}
          {venue.howToReach && venue.howToReach.length > 0 && (
            <div className="venue-modal__guide">
              <h4 className="venue-modal__guide-heading">Travel &amp; Directions</h4>
              <div className="venue-modal__cards-list">
                {venue.howToReach.map((modeItem, mIdx) => (
                  <div key={mIdx} className="venue-modal__card-item">
                    <div className="venue-modal__card-item-top">
                      <span className="venue-modal__card-item-name">{modeItem.mode}</span>
                      {modeItem.subtitle && (
                        <span className="venue-modal__card-item-time">{modeItem.subtitle}</span>
                      )}
                    </div>

                    {modeItem.routes && modeItem.routes.length > 0 ? (
                      <div className="venue-modal__card-routes">
                        {modeItem.routes.map((route, rIdx) => {
                          const hasDetails = route.details && route.details.length > 0;
                          return (
                            <div key={rIdx} className="venue-modal__card-route">
                              <div className="venue-modal__card-route-header">
                                <span className="venue-modal__card-route-name">
                                  {route.name}
                                </span>
                                {route.distance && (
                                  <span className="venue-modal__card-route-time">
                                    {route.distance}
                                  </span>
                                )}
                              </div>

                              {hasDetails && (
                                <div className="venue-modal__card-route-details">
                                  {route.details.map((d, dIdx) => (
                                    <div key={dIdx} className="venue-modal__card-detail-row">
                                      {d.label && (
                                        <span className="venue-modal__card-detail-label">
                                          {d.label}
                                        </span>
                                      )}
                                      <span className="venue-modal__card-detail-text">
                                        {d.text}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="venue-modal__guide-text">{modeItem.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Toast Notification */}
          {toastMessage && (
            <div className="venue-modal__toast" role="status">
              {toastMessage}
            </div>
          )}
        </div>

        {/* Footer Actions (3 Buttons - Consistent with SaveEventsModal) */}
        <div className="venue-modal__footer">
          <button
            type="button"
            className="venue-modal__btn-action venue-modal__btn-action--whatsapp"
            onClick={handleShareText}
            title="Share venue location & travel guide on WhatsApp"
          >
            <img src={whatsappIcon} alt="" className="venue-modal__btn-action-icon" aria-hidden="true" />
            Share as text
          </button>

          <button
            type="button"
            className="venue-modal__btn-action venue-modal__btn-action--share-pdf"
            onClick={handleSharePdf}
            disabled={isProcessing}
            title="Share PDF via device share sheet"
          >
            <img src={sharePdfIcon} alt="" className="venue-modal__btn-action-icon" aria-hidden="true" />
            Share as pdf
          </button>

          <button
            type="button"
            className="venue-modal__btn-action venue-modal__btn-action--download"
            onClick={handleDownloadPdf}
            disabled={isProcessing}
            title="Download PDF document"
          >
            <img src={downloadPdfIcon} alt="" className="venue-modal__btn-action-icon" aria-hidden="true" />
            Download pdf
          </button>
        </div>
      </div>
    </div>
  );
}
