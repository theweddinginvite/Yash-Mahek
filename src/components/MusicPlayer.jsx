import { useEffect, useRef, useState } from "react";
import content from "../content";

function MusicPlayingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" fill="currentColor" fillOpacity="0.2" />
      <circle cx="18" cy="16" r="3" fill="currentColor" fillOpacity="0.2" />
    </svg>
  );
}

function MusicMutedIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
      <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export default function MusicPlayer() {
  const { music } = content;
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!music.src) return;
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.8;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => {
          // Browser autoplay restriction before interaction
          setIsPlaying(false);
        });
    }

    const unlockOnInteraction = () => {
      if (audio && audio.paused) {
        audio.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    };

    window.addEventListener("click", unlockOnInteraction, { once: true });
    window.addEventListener("touchstart", unlockOnInteraction, { once: true });

    return () => {
      window.removeEventListener("click", unlockOnInteraction);
      window.removeEventListener("touchstart", unlockOnInteraction);
    };
  }, [music.src]);

  if (!music.src) return null;

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused || audio.muted) {
      audio.muted = false;
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  return (
    <>
      <audio ref={audioRef} src={music.src} loop />
      <button
        type="button"
        className="icon-button"
        onClick={toggleMusic}
        aria-label={isPlaying ? "Mute background music" : "Play background music"}
        title={isPlaying ? "Mute background music" : "Play background music"}
      >
        {isPlaying ? <MusicPlayingIcon /> : <MusicMutedIcon />}
      </button>
    </>
  );
}
