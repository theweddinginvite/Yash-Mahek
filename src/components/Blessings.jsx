import { useEffect, useMemo, useState } from "react";
import content from "../content";
import "./Blessings.css";
import hinduBrideIcon from "../assets/flaticons/hindu-bride.png";
import hinduWeddingIcon from "../assets/flaticons/hindu-wedding-mandap.png";
import hinduGroomIcon from "../assets/flaticons/hindu-groom.png";
import writingIcon from "../assets/flaticons/writing.png";
import SendBlessingModal from "./SendBlessingModal";
import { isFirebaseConfigured, updateBlessingHearts } from "../lib/firebase";

export const NOTE_COLORS = ["note--blush", "note--sage", "note--butter", "note--sky"];
const ITEMS_PER_PAGE = 6;

export function signature(entry) {
  if (!entry) return "";
  const name = (entry.name || "").trim().toLowerCase();
  const message = (entry.message || "").trim().toLowerCase();
  return `${name}||${message}`;
}

export function formatDate(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function NoteCard({ entry, colorClass = "note--blush", isMine, onOpen, tile = false }) {
  return (
    <button
      type="button"
      id={isMine ? "my-blessing" : undefined}
      className={`note ${colorClass} ${isMine ? "note--mine" : ""} ${tile ? "note--tile" : ""}`}
      onClick={() => onOpen && onOpen(entry, colorClass)}
    >
      <p className="note__message">{entry.message}</p>
      <p className="note__author">— {entry.name}</p>
      {entry.side && <p className="note__side">({entry.side})</p>}
      <p className="note__date">{formatDate(entry.timestamp)}</p>
    </button>
  );
}

// ============================================================================
// EXACT FLATICON ICONS FOR FILTER BAR
// Bride: #5625421 | All Wishes: #4165189 | Groom: #5625422
// ============================================================================

function BrideIcon({ className = "" }) {
  return (
    <img
      src={hinduBrideIcon}
      alt="Bride"
      className={`filter-icon-img ${className}`}
      width="22"
      height="22"
    />
  );
}

function AllWishesIcon({ className = "" }) {
  return (
    <img
      src={hinduWeddingIcon}
      alt="Hindu Wedding"
      className={`filter-icon-img ${className}`}
      width="22"
      height="22"
    />
  );
}

function GroomIcon({ className = "" }) {
  return (
    <img
      src={hinduGroomIcon}
      alt="Groom"
      className={`filter-icon-img ${className}`}
      width="22"
      height="22"
    />
  );
}

function HeartIcon({ filled }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill={filled ? "#8f3350" : "none"} stroke="#8f3350" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export default function Blessings({ entries = [], status, myBlessingKey, onBlessingSent }) {
  const { blessings } = content;
  const [active, setActive] = useState(null); // Lightbox { entry }
  const [filter, setFilter] = useState("all"); // 'bride' | 'all' | 'groom'
  const [pageIndex, setPageIndex] = useState(0);
  const [isBlessingModalOpen, setIsBlessingModalOpen] = useState(false);

  // Heart Reactions: local map + user click tracking
  const [reactions, setReactions] = useState(() => {
    try {
      const saved = localStorage.getItem("blessingsReactions");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [heartedByUser, setHeartedByUser] = useState(() => {
    try {
      const saved = localStorage.getItem("blessingsHeartedByUser");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Real entries only, sorted chronologically descending (most recent first), deduplicated
  const combinedList = useMemo(() => {
    const list = Array.isArray(entries) ? [...entries] : [];

    // Sort descending by timestamp
    list.sort((a, b) => {
      const timeA = new Date(a.timestamp || 0).getTime();
      const timeB = new Date(b.timestamp || 0).getTime();
      return timeB - timeA; // Descending: Most recent first
    });

    // Deduplicate by ID and by signature
    const seenIds = new Set();
    const seenSignatures = new Set();
    const unique = [];

    for (const item of list) {
      if (item.id) {
        if (seenIds.has(item.id)) continue;
        seenIds.add(item.id);
      }
      const sig = signature(item);
      if (seenSignatures.has(sig)) continue;
      seenSignatures.add(sig);

      unique.push(item);
    }

    return unique;
  }, [entries]);

  // Counts for filter pills
  const counts = useMemo(() => {
    let bride = 0;
    let groom = 0;
    combinedList.forEach((item) => {
      const s = (item.side || "").toLowerCase();
      if (s.includes("bride")) bride++;
      else if (s.includes("groom")) groom++;
    });
    return { all: combinedList.length, bride, groom };
  }, [combinedList]);

  // Filtered list based on selected filter
  const filteredList = useMemo(() => {
    if (filter === "bride") {
      return combinedList.filter((item) => (item.side || "").toLowerCase().includes("bride"));
    }
    if (filter === "groom") {
      return combinedList.filter((item) => (item.side || "").toLowerCase().includes("groom"));
    }
    return combinedList;
  }, [combinedList, filter]);

  // Pagination calculations (6 wishes per page)
  const totalPages = Math.max(1, Math.ceil(filteredList.length / ITEMS_PER_PAGE));
  const currentSix = filteredList.slice(
    pageIndex * ITEMS_PER_PAGE,
    pageIndex * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  // Always fill up to 6 slots so the 2x3 grid layout stays perfectly uniform
  const placeholderCount = Math.max(0, ITEMS_PER_PAGE - currentSix.length);
  const placeholders = Array.from({ length: placeholderCount });

  const openNote = (entry) => setActive({ entry });

  const scrollToRSVP = () => {
    const el = document.getElementById("rsvp") || document.querySelector(".blessings-rsvp-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleToggleHeart = (sig, item) => {
    const isCurrentlyHearted = Boolean(heartedByUser[sig]);
    const baseCount = reactions[sig] ?? item.hearts ?? 1;
    const newCount = isCurrentlyHearted ? Math.max(0, baseCount - 1) : baseCount + 1;

    const newReactions = { ...reactions, [sig]: newCount };
    const newHeartedByUser = { ...heartedByUser, [sig]: !isCurrentlyHearted };

    setReactions(newReactions);
    setHeartedByUser(newHeartedByUser);

    try {
      localStorage.setItem("blessingsReactions", JSON.stringify(newReactions));
      localStorage.setItem("blessingsHeartedByUser", JSON.stringify(newHeartedByUser));
    } catch {
      // ignore quota errors
    }

    if (item.id && isFirebaseConfigured) {
      updateBlessingHearts(item.id, isCurrentlyHearted ? -1 : 1).catch((err) =>
        console.error("Failed to update hearts in Firestore:", err)
      );
    }
  };

  return (
    <section id="blessings" className="section section--surface blessings-section">
      <div className="section__inner">
        <div className="section__heading">
          <span className="eyebrow">With Honor &amp; Gratitude</span>
          <h2>{blessings.heading}</h2>
          <p>{blessings.subtext}</p>
        </div>

        <div className="blessings-center-group">
          {/* 3-Tab Filter Bar: Bride's Side | All Wishes | Groom's Side */}
          <div className="blessings-filter-bar" role="tablist" aria-label="Filter blessings">
          <button
            type="button"
            role="tab"
            aria-selected={filter === "bride"}
            className={`filter-btn ${filter === "bride" ? "is-active" : ""}`}
            onClick={() => {
              setFilter("bride");
              setPageIndex(0);
            }}
          >
            <BrideIcon />
            <span>Bride&apos;s Side</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={filter === "all"}
            className={`filter-btn ${filter === "all" ? "is-active" : ""}`}
            onClick={() => {
              setFilter("all");
              setPageIndex(0);
            }}
          >
            <AllWishesIcon />
            <span>All Wishes</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={filter === "groom"}
            className={`filter-btn ${filter === "groom" ? "is-active" : ""}`}
            onClick={() => {
              setFilter("groom");
              setPageIndex(0);
            }}
          >
            <GroomIcon />
            <span>Groom&apos;s Side</span>
          </button>
        </div>

        {/* Uniform 2x3 (6-Card) Curated Grid with Luxury Placeholders */}
        <div className="blessings-curated-grid-6">
          {currentSix.map((item, idx) => {
            const sig = signature(item);
            const count = reactions[sig] ?? item.hearts ?? 1;
            const isHearted = Boolean(heartedByUser[sig]);
            const isBride = (item.side || "").toLowerCase().includes("bride");

            return (
              <div
                key={sig + idx}
                className={`curated-wish-card ${isBride ? "curated-wish-card--bride" : "curated-wish-card--groom"}`}
                onClick={() => openNote(item)}
              >
                <div className="curated-wish-card__top">
                  <span className="curated-wish-card__quote-mark">“</span>
                  <button
                    type="button"
                    className={`curated-heart-btn ${isHearted ? "is-hearted" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleHeart(sig, item);
                    }}
                    title={isHearted ? "Unlike wish" : "Send heart"}
                    aria-label={`Heart reaction count: ${count}`}
                  >
                    <HeartIcon filled={isHearted} />
                    <span className="heart-count">{count}</span>
                  </button>
                </div>

                <p className="curated-wish-card__message">{item.message}</p>

                <div className="curated-wish-card__footer">
                  <p className="curated-wish-card__author">— {item.name}</p>
                  <div className="curated-wish-card__meta">
                    {item.side && (
                      <span className={`curated-side-badge ${isBride ? "badge--bride" : "badge--groom"}`}>
                        {item.side}
                      </span>
                    )}
                    <span className="curated-date">{formatDate(item.timestamp)}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {placeholders.map((_, idx) => (
            <button
              key={`placeholder-${idx}`}
              type="button"
              onClick={() => setIsBlessingModalOpen(true)}
              className="curated-wish-card curated-wish-card--placeholder"
              title="Click to send warm blessings"
              aria-label="Click to send warm blessing"
            >
              <div className="curated-placeholder-inner">
                <img
                  src={writingIcon}
                  alt="Write a blessing"
                  className="placeholder-pen-icon"
                  width="38"
                  height="38"
                  loading="lazy"
                />
                <p className="placeholder-title">Click to leave warm wishes</p>
              </div>
            </button>
          ))}
        </div>

        {/* Carousel Pagination Controls (Shown when there are multiple pages) */}
        {totalPages > 1 && (
          <div className="blessings-carousel-controls">
            <button
              type="button"
              className="carousel-btn"
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              disabled={pageIndex === 0}
              aria-label="Previous wishes"
            >
              ‹ Previous
            </button>

            <div className="carousel-pagination-dots">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`pagination-dot ${pageIndex === idx ? "is-active" : ""}`}
                  onClick={() => setPageIndex(idx)}
                  aria-label={`Go to page ${idx + 1}`}
                />
              ))}
            </div>

            <span className="carousel-page-indicator">
              Page {pageIndex + 1} of {totalPages}
            </span>

            <button
              type="button"
              className="carousel-btn"
              onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
              disabled={pageIndex >= totalPages - 1}
              aria-label="Next wishes"
            >
              Next ›
            </button>
          </div>
        )}
        </div>

        <div className="blessings-bottom-group">
          {/* Tap to See Full Message Hint (Just Above Button Below) */}
          <p className="blessings-bottom-tap-hint">
            ✨ Tap the card to see full message
          </p>

          {/* Action Button */}
          <div className="blessings-actions">
            <button
              type="button"
              className="blessings-action-btn"
              onClick={() => setIsBlessingModalOpen(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              Send Blessings
            </button>
          </div>
        </div>
      </div>

      {/* Full-Width Section Division Line Across Page */}
      <div className="section-divider" aria-hidden="true" />

      {/* Send Blessing Modal Popup */}
      <SendBlessingModal
        isOpen={isBlessingModalOpen}
        onClose={() => setIsBlessingModalOpen(false)}
        onBlessingSent={onBlessingSent}
      />

      {/* Detail Lightbox */}
      {active && (
        <div className="note-lightbox" onClick={() => setActive(null)}>
          <button
            type="button"
            className="note-lightbox__close"
            onClick={() => setActive(null)}
            aria-label="Close"
          >
            &times;
          </button>
          <div
            className="note note-lightbox__note"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="note__message">“{active.entry.message}”</p>
            <p className="note__author">— {active.entry.name}</p>
            {active.entry.side && <p className="note__side">({active.entry.side})</p>}
            <p className="note__date">{formatDate(active.entry.timestamp)}</p>
          </div>
        </div>
      )}
    </section>
  );
}
