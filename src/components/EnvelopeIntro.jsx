import { useRef, useState } from "react";
import content, { asset } from "../content";
import "./EnvelopeIntro.css";

// Config: tapping the seal chains four beats, each timed by its own
// setTimeout below. Durations are deliberately unhurried — this should read
// as a real hand slowly opening a real envelope, not a UI transition. If
// you retune any of these, keep the matching CSS `transition` durations in
// EnvelopeIntro.css in sync — there's no shared config file.
const OPEN_START_DELAY = 200; // ms — pause after tapping the seal before the flap/card animation begins
const FLAP_OPEN_DURATION = 900; // ms — flap tilting open
const CARD_RISE_DELAY = 1100; // ms — card waits a beat after the flap starts before it lifts
const CARD_RISE_DURATION = 900; // ms — card lifting out of the envelope
const OPEN_DURATION = Math.max(FLAP_OPEN_DURATION, CARD_RISE_DELAY + CARD_RISE_DURATION);
const PAUSE_DURATION = 1600; // ms — card sits still, front showing, so it can be read
const CARD_FLIP_DURATION = 700; // ms — card turning over to its back face
const BACK_PAUSE_DURATION = 800; // ms — back face (seal) sits still before flying
const CARD_FLY_DURATION = 900; // ms — card rushing toward the viewer, out of the screen
const SCENE_FADE_DURATION = 700; // ms — the rest of the scene dissolving behind it
const FLYING_DURATION = Math.max(CARD_FLY_DURATION, SCENE_FADE_DURATION);

// A deep-maroon envelope scene shown before the site: tap the seal and the
// flap peels back, a beat later a card lifts out of the envelope
// announcing the wedding — after a pause to actually read it, the card
// flips over to a darker, monogrammed back face, and — after a beat to
// register the seal — that back face rushes toward the viewer as if
// flying out of the screen, dissolving the scene behind it to reveal the
// (already-mounted) page underneath.
export default function EnvelopeIntro({ onOpen }) {
  const [phase, setPhase] = useState("closed"); // closed -> open -> flipped -> flying
  const { couple, wedding, mapAddress } = content;
  // Guards re-entry during the OPEN_START_DELAY pause, before `phase` has
  // moved off "closed" — without it, tapping the seal again in that window
  // would schedule a second overlapping run of the whole sequence.
  const hasStartedRef = useRef(false);

  function handleOpen() {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    setTimeout(() => {
      setPhase("open");
      const flippedAt = OPEN_DURATION + PAUSE_DURATION;
      const flyingAt = flippedAt + CARD_FLIP_DURATION + BACK_PAUSE_DURATION;
      setTimeout(() => setPhase("flipped"), flippedAt);
      setTimeout(() => setPhase("flying"), flyingAt);
      setTimeout(() => onOpen(), flyingAt + FLYING_DURATION);
    }, OPEN_START_DELAY);
  }

  const isClosed = phase === "closed";
  const hasOpened = phase !== "closed";
  const isFlipped = phase === "flipped" || phase === "flying";
  const isFlying = phase === "flying";

  // Shared border + corner-flourish "frame", identical markup on both card
  // faces — each face's own CSS `color` (see .envelope-box__card-face--front/
  // --back) drives both the border's and the flourish's `currentColor`, so
  // this one block reads as bronze-on-gold up front and gold-on-maroon on
  // the back without duplicating any markup or path data per face.
  const cardFrame = (
    <>
      <span className="envelope-box__card-frame envelope-box__card-frame--outer" aria-hidden="true" />
      <span className="envelope-box__card-frame envelope-box__card-frame--inner" aria-hidden="true" />
      <svg className="envelope-box__card-corner envelope-box__card-corner--tl" aria-hidden="true">
        <use href="#card-corner-flourish" />
      </svg>
      <svg className="envelope-box__card-corner envelope-box__card-corner--tr" aria-hidden="true">
        <use href="#card-corner-flourish" />
      </svg>
      <svg className="envelope-box__card-corner envelope-box__card-corner--bl" aria-hidden="true">
        <use href="#card-corner-flourish" />
      </svg>
      <svg className="envelope-box__card-corner envelope-box__card-corner--br" aria-hidden="true">
        <use href="#card-corner-flourish" />
      </svg>
    </>
  );

  return (
    <div className={`envelope-intro ${!isClosed ? "envelope-intro--open" : ""}`}>
      <div className="envelope-intro__backdrop" aria-hidden="true" />
      {/* Hidden sprite sheet: one hand-drawn corner-scroll flourish, reused
          via <use> at all 4 corners of both card faces (mirrored per
          corner, not duplicated path data) — see .envelope-box__card-corner
          in EnvelopeIntro.css. */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          <symbol id="card-corner-flourish" viewBox="0 0 40 40">
            <path
              d="M2 16 C2 7 8 2 18 2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <path
              d="M2 16 C2 22 6 26 13 24 C19 22.3 17.5 15 12 16 C8.7 16.7 9.3 20.6 13.5 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d="M18 2 C25 2 29 6 29.5 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d="M6 10 C8 6.5 12 6.5 13 10 C14 13.5 10 14.5 8.3 12.7 C7.3 11.6 8 10 9.2 10.1"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
            />
            <circle cx="29.5" cy="12" r="1.5" fill="currentColor" />
            <circle cx="2" cy="16" r="1.3" fill="currentColor" />
          </symbol>
        </defs>
      </svg>
      <div
        className={`envelope-intro__content ${isFlying ? "envelope-intro__content--flying" : ""}`}
      >
        <img
          src={asset("/images/lordganesh/ganeshCutoutWithoutBg.png")}
          alt=""
          className="envelope-intro__ganesh"
          aria-hidden="true"
        />
        <p className="envelope-intro__overline">{content.hero.tagline}</p>
        <p className="envelope-intro__invite">{content.hero?.invite || "WE INVITE YOU TO"}</p>

        <div className="envelope-box">
          <div className="envelope-box__body" />
          {/* Decorative only — traces where a real diamond-flap envelope's
              tucked side flaps would seam, so the body reads as folded
              paper instead of a flat rectangle once the lid's out of the
              way. Sits above the body's own fill but stays fully hidden
              under flap-backing below while closed. */}
          <svg
            className="envelope-box__body-seams"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <polyline points="0,0 50,42 100,0" className="envelope-box__body-seam-line" fill="none" />
          </svg>
          {/* The envelope's inside back wall — a plain full rectangle that
              NEVER animates and never changes shape. */}
          <div className="envelope-box__flap-backing" aria-hidden="true">
            <div
              className={`envelope-box__flap-backing-shade ${
                hasOpened ? "envelope-box__flap-backing-shade--open" : ""
              }`}
            />
          </div>
          <div className={`envelope-box__flap ${hasOpened ? "envelope-box__flap--open" : ""}`}>
            <div className="envelope-box__flap-surface">
              <div className="envelope-box__flap-fill" />
              <svg viewBox="0 0 288 130" preserveAspectRatio="none" aria-hidden="true">
                <polyline
                  points="14.4,0 144,130 273.6,0"
                  fill="none"
                  stroke="rgba(0,0,0,0.4)"
                  strokeWidth="4"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>

            <button
              type="button"
              className="envelope-box__seal"
              onClick={handleOpen}
              aria-label="Open the invitation"
              tabIndex={isClosed ? 0 : -1}
            >
              <img
                src={asset("/images/monogram/monogramCircularWithoutBg.png")}
                alt=""
                className="envelope-box__seal-monogram"
                aria-hidden="true"
              />
            </button>
          </div>

          <div
            className={`envelope-box__card ${hasOpened ? "envelope-box__card--risen" : ""} ${
              isFlying ? "envelope-box__card--flying" : ""
            }`}
            aria-hidden={isClosed}
          >
            <div
              className={`envelope-box__card-inner ${isFlipped ? "envelope-box__card-inner--flipped" : ""}`}
            >
              <div className="envelope-box__card-face envelope-box__card-face--front">
                {cardFrame}
                <span className="envelope-box__card-eyebrow">The Wedding Of</span>
                <div className="envelope-box__card-names">
                  <span className="envelope-box__card-name">{couple.partner1}</span>
                  <span className="envelope-box__card-amp">&amp;</span>
                  <span className="envelope-box__card-name">{couple.partner2}</span>
                </div>
                <span className="envelope-box__card-divider" aria-hidden="true" />
                <div className="envelope-box__card-venue">
                  <span>Winsome Resorts and Spa</span>
                  <span>Jim Corbett</span>
                </div>
              </div>
              <div className="envelope-box__card-face envelope-box__card-face--back">
                {cardFrame}
                <img
                  src={asset("/images/monogram/monogramWithoutBg.png")}
                  alt={`${couple.partner1} & ${couple.partner2}`}
                  className="envelope-box__card-seal"
                />
              </div>
            </div>
          </div>
        </div>

        <p className="envelope-intro__invocation envelope-intro__invocation--sanskrit" lang="sa">
          ‖ श्री गणेशाय नमः ‖
        </p>
        <p className="envelope-intro__invocation">‖ Shree Ganeshay Namah ‖</p>

        <p className={`envelope-intro__hint ${hasOpened ? "envelope-intro__hint--hidden" : ""}`}>
          Tap the seal to open your invitation
        </p>
      </div>
    </div>
  );
}
