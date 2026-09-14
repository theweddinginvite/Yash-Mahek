import { useEffect, useRef, useState } from "react";
import content from "../content";
import VenueModal from "./VenueModal";
import "./EventDetails.css";

function formatEventTime(timeStr = "") {
  return timeStr.replace(/\s+onwards/i, "").trim();
}

function getEventDay(event) {
  if (event?.day) {
    const lower = event.day.toLowerCase();
    if (lower.startsWith("sat")) return "Saturday";
    if (lower.startsWith("sun")) return "Sunday";
    return event.day;
  }
  if (!event?.date) return "";
  try {
    const parsed = new Date(event.date);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString("en-US", { weekday: "long" });
    }
  } catch {
    // fallback
  }
  return "";
}

function getShortDay(dayStr = "") {
  if (!dayStr) return "";
  const lower = dayStr.toLowerCase();
  if (lower.startsWith("sat")) return "Sat";
  if (lower.startsWith("sun")) return "Sun";
  return dayStr.slice(0, 3);
}

function formatShortDate(dateStr = "", day = "") {
  if (!dateStr) return "";
  const match = dateStr.match(/(?:December|Dec)\s+(\d+)/i);
  const baseDate = match ? `Dec ${match[1]}` : dateStr;
  const shortDay = getShortDay(day);
  if (shortDay && !baseDate.toLowerCase().includes(shortDay.toLowerCase())) {
    return `${shortDay}, ${baseDate}`;
  }
  return baseDate;
}

function EventCard({ event, autoFlipSeconds = 20 }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const timerRef = useRef(null);
  const displayTime = formatEventTime(event.time);
  const day = getEventDay(event);
  const shortDate = formatShortDate(event.date, day);

  useEffect(() => {
    if (isFlipped) {
      timerRef.current = setTimeout(() => {
        setIsFlipped(false);
      }, autoFlipSeconds * 1000);
    } else if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isFlipped, autoFlipSeconds]);

  const toggleFlip = () => setIsFlipped((prev) => !prev);
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleFlip();
    }
  };

  return (
    <div
      className={`event-flip-card ${isFlipped ? "is-flipped" : ""}`}
      onClick={toggleFlip}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-expanded={isFlipped}
      aria-label={`${event.name}, ${day ? `${day}, ` : ""}${event.date} at ${displayTime}. Click to ${
        isFlipped ? "see front" : "see more details"
      }`}
    >
      <div className="event-flip-card__inner">
        {/* Front Face */}
        <div className="event-flip-card__face event-flip-card__face--front">
          <h3 className="event-flip-card__name">
            <span className="event-flip-card__name-title">{event.name}</span>
            <span className="event-flip-card__meal">{event.meal || ""}</span>
          </h3>
          <div className="event-flip-card__divider" aria-hidden="true" />
          {day && <p className="event-flip-card__day">{day}</p>}
          <p className="event-flip-card__date">{event.date}</p>
          <p className="event-flip-card__time">{displayTime}</p>
          <span className="event-flip-card__hint">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Tap for details
          </span>
        </div>

        {/* Back Face */}
        <div className="event-flip-card__face event-flip-card__face--back">
          {/* Boundary Countdown Timer */}
          {isFlipped && (
            <svg className="event-flip-card__border-timer" aria-hidden="true">
              <rect
                x="1"
                y="1"
                width="calc(100% - 2px)"
                height="calc(100% - 2px)"
                rx="13.6"
                ry="13.6"
                className="event-flip-card__timer-track"
              />
              <rect
                x="1"
                y="1"
                width="calc(100% - 2px)"
                height="calc(100% - 2px)"
                rx="13.6"
                ry="13.6"
                pathLength="100"
                className="event-flip-card__timer-path"
                style={{ animationDuration: `${autoFlipSeconds}s` }}
                onAnimationEnd={() => setIsFlipped(false)}
              />
            </svg>
          )}

          <div className="event-flip-card__back-header">
            <h4 className="event-flip-card__back-name">
              <span className="event-flip-card__name-title">{event.name}</span>
              <span className="event-flip-card__meal">{event.meal || ""}</span>
            </h4>
            <div className="event-flip-card__back-time-wrap">
              <span className="event-flip-card__back-date">{shortDate}</span>
              <span className="event-flip-card__back-time">{displayTime}</span>
            </div>
          </div>
          <div className="event-flip-card__divider event-flip-card__divider--back" aria-hidden="true" />
          {event.description && (
            <p className="event-flip-card__desc">{event.description}</p>
          )}
          {(event.theme || event.attire) && (
            <div className="event-flip-card__details">
              <div className="event-flip-card__detail-row">
                <span className="event-flip-card__detail-label">Attire</span>
                <span className="event-flip-card__detail-val">
                  {event.theme || event.attire}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EventDetails() {
  const { events, eventCardAutoFlipSeconds, venue } = content;
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);

  return (
    <section id="details" className="section section--surface">
      <div className="section__inner">
        <div className="section__heading">
          <span className="eyebrow">Join Us</span>
          <h2>Event Details</h2>
        </div>
        <div className="events-grid">
          {events.map((event) => (
            <EventCard
              key={event.name}
              event={event}
              autoFlipSeconds={eventCardAutoFlipSeconds ?? 20}
            />
          ))}
        </div>

        {/* Button to open 'How to reach the venue?' popup */}
        <div className="event-details__venue-action">
          <button
            type="button"
            className="event-details__venue-btn"
            onClick={() => setIsVenueModalOpen(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            How to reach the venue?
          </button>
        </div>

        {/* Venue Modal Dialog */}
        <VenueModal
          isOpen={isVenueModalOpen}
          onClose={() => setIsVenueModalOpen(false)}
          venue={venue}
        />
      </div>
    </section>
  );
}

