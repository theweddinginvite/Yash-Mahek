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

export default function FloatingControls({ onReopenEnvelope, onOpenSaveEvents }) {
  return (
    <div className="floating-controls">
      <HomeButton onReopenEnvelope={onReopenEnvelope} />
      <button
        type="button"
        className="icon-button"
        onClick={onOpenSaveEvents}
        aria-label="Event Details & Itinerary"
        title="Event Details & Itinerary"
      >
        <CalendarIcon />
      </button>
      <MusicPlayer />
    </div>
  );
}
