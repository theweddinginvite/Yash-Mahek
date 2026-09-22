import HomeButton from "./HomeButton";
import MusicPlayer from "./MusicPlayer";
import "./FloatingControls.css";

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01M16 17.5h.01" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
    </svg>
  );
}

function MegaphoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 11l13-5v12L3 13v-2z" />
      <path d="M16 8.5c1.5.8 2.5 2.1 2.5 3.5s-1 2.7-2.5 3.5" />
      <path d="M19 6c2.5 1.5 4 3.8 4 6s-1.5 4.5-4 6" />
      <path d="M6 13v4a2 2 0 0 0 2 2h1" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export default function FloatingControls({
  onReopenEnvelope,
  onOpenSaveEvents,
  onOpenNoticeBoard,
  onOpenVenue,
  hasNotices = false,
}) {
  return (
    <div className="floating-controls">
      <HomeButton onReopenEnvelope={onReopenEnvelope} />
            <button
        type="button"
        className="icon-button"
        onClick={onOpenNoticeBoard}
        aria-label="Wedding Notice Board & Announcements"
        title="Notice Board & Announcements"
      >
        <MegaphoneIcon />
        {hasNotices && <span className="icon-button__badge" aria-hidden="true" />}
      </button>
      <button
        type="button"
        className="icon-button"
        onClick={onOpenSaveEvents}
        aria-label="Event Details & Itinerary"
        title="Event Details & Itinerary"
      >
        <CalendarIcon />
      </button>
      <button
        type="button"
        className="icon-button"
        onClick={onOpenVenue}
        aria-label="How to reach & Venue Guide"
        title="Venue & Travel Guide"
      >
        <LocationIcon />
      </button>
      <MusicPlayer />
    </div>
  );
}
