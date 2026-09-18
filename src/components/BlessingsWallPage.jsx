import { useEffect, useState } from "react";
import content from "../content";
import { NoteCard, NOTE_COLORS, signature, formatDate } from "./Blessings";
import { HOME_HASH } from "../lib/routes";
import "./Blessings.css";
import "./BlessingsWallPage.css";

export default function BlessingsWallPage({ entries, status }) {
  const { partner1, partner2 } = content.couple;
  const [active, setActive] = useState(null);
  const openNote = (entry, colorClass) => setActive({ entry, colorClass });

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Wall of Blessings";
    window.scrollTo(0, 0);
    return () => {
      document.title = previousTitle;
    };
  }, []);

  const goHome = () => {
    window.location.hash = HOME_HASH;
  };

  const isLoading = status === "loading" && entries.length === 0;

  return (
    <div className="blessings-wall-page">
      <header className="blessings-wall-page__header">
        <button type="button" className="blessings-wall-page__back" onClick={goHome}>
          ← Back to the invitation
        </button>
        <span className="eyebrow">
          {partner1} &amp; {partner2}
        </span>
        <h1>Wall of Blessings</h1>
        <p>Every blessing, newest first.</p>
      </header>

      <main className="blessings-wall-page__body">
        {isLoading ? (
          <p className="blessings-wall-page__empty">Loading blessings…</p>
        ) : entries.length > 0 ? (
          <div className="blessings-tiles">
            {entries.map((entry, index) => (
              <NoteCard
                key={signature(entry)}
                entry={entry}
                colorClass={NOTE_COLORS[index % NOTE_COLORS.length]}
                onOpen={openNote}
                tile
              />
            ))}
          </div>
        ) : (
          <p className="blessings-wall-page__empty">
            {status === "error"
              ? "Couldn't load blessings right now — please try again shortly."
              : "No blessings yet — be the first to leave one!"}
          </p>
        )}
      </main>

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
            className={`note note-lightbox__note ${active.colorClass}`}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="note__message">{active.entry.message}</p>
            <p className="note__author">— {active.entry.name}</p>
            {active.entry.side && <p className="note__side">({active.entry.side})</p>}
            <p className="note__date">{formatDate(active.entry.timestamp)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
