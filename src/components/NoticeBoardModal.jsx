import { useEffect, useRef } from "react";
import "./NoticeBoardModal.css";

function formatNoticeTime(timestamp) {
  if (!timestamp) return "";
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400 && date.getDate() === now.getDate()) {
      return `Today at ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (_) {
    return "";
  }
}

export default function NoticeBoardModal({
  isOpen,
  onClose,
  announcements = [],
  autoCloseSeconds = 90,
}) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const autoCloseMs = autoCloseSeconds * 1000;
    const timerId = setTimeout(() => {
      if (onCloseRef.current) onCloseRef.current();
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

  return (
    <div
      className="notice-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notice-modal-title"
    >
      <div
        className="notice-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pinned Top Progress Timer Bar */}
        <div
          className="notice-modal__timer-bar"
          style={{ animationDuration: `${autoCloseSeconds}s` }}
          onAnimationEnd={onClose}
          aria-hidden="true"
        />

        {/* Pinned Top Right Close Button */}
        <button
          type="button"
          className="notice-modal__close-btn"
          onClick={onClose}
          aria-label="Close Notice Board"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Scrollable Modal Body */}
        <div className="notice-modal__body">
          {/* Header */}
          <div className="notice-modal__header">
            <span className="eyebrow">Live Updates from Hosts</span>
            <h3 id="notice-modal-title" className="notice-modal__title">
              Wedding Notice Board
            </h3>
            <div className="notice-modal__divider" aria-hidden="true" />
            <p className="notice-modal__subtitle">
              Live updates, schedule changes, and ceremony alerts posted directly by the host family.
            </p>
          </div>

          {/* Notices Feed */}
          <div className="notice-modal__feed">
            {announcements.length === 0 ? (
              <div className="notice-modal__empty">
                <div className="notice-modal__empty-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h4 className="notice-modal__empty-title">All on Schedule</h4>
                <p className="notice-modal__empty-desc">
                  There are no active notices right now. All ceremony events are running smoothly on schedule! Check back here during the wedding for live announcements.
                </p>
              </div>
            ) : (
              announcements.map((item) => {
                const isUrgent = item.priority === "urgent";
                const timeStr = formatNoticeTime(item.timestamp);
                return (
                  <article
                    key={item.id}
                    className={`notice-card ${isUrgent ? "notice-card--urgent" : ""}`}
                  >
                    <div className="notice-card__header">
                      <span className="notice-card__badge">
                        {isUrgent ? "🚨 Urgent Notice" : "📢 Announcement"}
                      </span>
                      {timeStr && <span className="notice-card__time">{timeStr}</span>}
                    </div>
                    <p className="notice-card__message">{item.message}</p>
                  </article>
                );
              })
            )}
          </div>

          {/* Footer Status Bar */}
          <div className="notice-modal__footer-status">
            <span className="notice-modal__live-dot" aria-hidden="true" />
            <span>Live updates synchronized in real time</span>
          </div>
        </div>
      </div>
    </div>
  );
}
