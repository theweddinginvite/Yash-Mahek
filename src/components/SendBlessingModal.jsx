import { useEffect, useState } from "react";
import content from "../content";
import { addBlessingToFirestore, isFirebaseConfigured } from "../lib/firebase";
import ConfettiBurst from "./ConfettiBurst";
import blessingsIcon from "../assets/flaticons/blessings-18060799.png";
import "./SendBlessingModal.css";

const SIDES = ["Bride", "Groom"];

function submitToSheet(appsScriptUrl, payload) {
  return fetch(appsScriptUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });
}

function SendingAnimation({ message }) {
  return (
    <div className="blessing-modal__sending" aria-live="polite">
      <div className="blessing-modal__sending-visual">
        <div className="blessing-modal__envelope">
          <svg viewBox="0 0 80 56" className="blessing-modal__svg" aria-hidden="true">
            <rect x="2" y="2" width="76" height="52" rx="6" fill="#fdfbf7" stroke="#b08968" strokeWidth="1.5" />
            <path d="M4 6 L40 34 L76 6" fill="none" stroke="#b08968" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M4 50 L30 26" fill="none" stroke="rgba(176, 137, 104, 0.4)" strokeWidth="1.2" />
            <path d="M76 50 L50 26" fill="none" stroke="rgba(176, 137, 104, 0.4)" strokeWidth="1.2" />
            <circle cx="40" cy="33" r="8" fill="#8f3350" />
            <circle cx="40" cy="33" r="6.5" fill="none" stroke="#d4af37" strokeWidth="1" />
            <path d="M37.5 33.5 L39.5 35.5 L43 31" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="blessing-modal__sparkles">
            <span className="blessing-modal__sparkle blessing-modal__sparkle--1">✨</span>
            <span className="blessing-modal__sparkle blessing-modal__sparkle--2">🌸</span>
            <span className="blessing-modal__sparkle blessing-modal__sparkle--3">✨</span>
          </div>
        </div>
        <div className="blessing-modal__trail" />
      </div>
      <p className="blessing-modal__sending-text">{message}</p>
      <div className="blessing-modal__bar">
        <div className="blessing-modal__progress" />
      </div>
    </div>
  );
}

export default function SendBlessingModal({
  isOpen,
  onClose,
  onBlessingSent,
  initialName = "",
  initialSide = SIDES[0],
}) {
  const { couple, integrations } = content;
  const p1 = (couple?.partner1 || "Bride").replace(/oratna/i, "");
  const p2 = (couple?.partner2 || "Groom").replace(/oratna/i, "");

  const [status, setStatus] = useState("idle"); // idle | submitting | success | error | not-configured
  const [form, setForm] = useState({ name: initialName, side: initialSide, message: "" });
  const [submittedName, setSubmittedName] = useState("");
  const [timeLeft, setTimeLeft] = useState(15);
  const [celebrateTrigger, setCelebrateTrigger] = useState(0);

  // Sync initial props
  useEffect(() => {
    if (initialName && form.name !== initialName) {
      setForm((f) => ({ ...f, name: initialName, side: initialSide || f.side }));
    }
  }, [initialName, initialSide]);

  // Modal open/close lifecycle & Escape key
  useEffect(() => {
    if (!isOpen) {
      setStatus("idle");
      setForm({ name: initialName || "", side: initialSide || SIDES[0], message: "" });
      setTimeLeft(15);
      setCelebrateTrigger(0); // reset so confetti doesn't replay on next open
      return;
    }

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && status !== "submitting") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, status, onClose, initialName, initialSide]);

  // Auto-close in 15 seconds once blessing is successful
  useEffect(() => {
    if (status !== "success" || !isOpen) {
      setTimeLeft(15);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, isOpen, onClose]);

  if (!isOpen) return null;

  const appsScriptUrl = integrations?.appsScriptUrl || integrations?.googleSheets?.appsScriptUrl;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) return;

    if (!isFirebaseConfigured && !appsScriptUrl) {
      setStatus("not-configured");
      return;
    }

    setStatus("submitting");
    const nameToSave = form.name.trim();
    const sideToSave = form.side;
    const messageToSave = form.message.trim();
    const startTime = Date.now();

    try {
      let docRef = null;
      if (isFirebaseConfigured) {
        docRef = await addBlessingToFirestore({ name: nameToSave, side: sideToSave, message: messageToSave });
        if (appsScriptUrl) {
          submitToSheet(appsScriptUrl, {
            type: "blessing",
            name: nameToSave,
            side: sideToSave,
            message: messageToSave,
            firestoreId: docRef?.id || "",
          }).catch(() => {});
        }
      } else {
        const res = await submitToSheet(appsScriptUrl, {
          type: "blessing",
          name: nameToSave,
          side: sideToSave,
          message: messageToSave,
        });
        if (!res.ok) throw new Error("Request failed");
      }

      // Smooth visual delight duration (minimum 1.4s)
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 1400 - elapsed);
      await new Promise((r) => setTimeout(r, remaining));

      setSubmittedName(nameToSave);
      setStatus("success");
      setTimeLeft(15);
      setCelebrateTrigger((t) => t + 1);

      if (onBlessingSent) {
        onBlessingSent({
          id: docRef?.id,
          name: nameToSave,
          side: sideToSave,
          message: messageToSave,
          timestamp: new Date().toISOString(),
        });
      }

      setForm({ name: "", side: sideToSave, message: "" });
    } catch (err) {
      console.error("Blessing submission error:", err);
      setStatus("error");
    }
  };

  const handleReset = () => {
    setStatus("idle");
    setForm({ name: "", side: initialSide || SIDES[0], message: "" });
    setTimeLeft(15);
  };

  return (
    <div className="blessing-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <ConfettiBurst trigger={celebrateTrigger} />
      <div className="blessing-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          type="button"
          className="blessing-modal__close-btn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="blessing-modal__body">
          {/* Header */}
          <div className="blessing-modal__header">
            <span className="eyebrow">With Love &amp; Gratitude</span>
            <h3 className="blessing-modal__title">Send Your Blessings</h3>
            <div className="blessing-modal__divider" aria-hidden="true" />
            <p className="blessing-modal__subtitle">
              Leave your heartfelt wishes &amp; prayers for {p1} &amp; {p2}
            </p>
          </div>

          {/* Submitting Animation */}
          {status === "submitting" && (
            <SendingAnimation
              message={`Delivering your heartfelt blessings to ${p1} & ${p2}…`}
            />
          )}

          {/* Success State with 15s Timer */}
          {status === "success" && (
            <div className="blessing-modal__status blessing-modal__status--success">
              <div className="blessing-modal__status-seal">
                <span className="blessing-modal__status-seal-icon">🌸</span>
              </div>
              <h3 className="blessing-modal__status-title">Blessings Delivered!</h3>
              <p className="blessing-modal__status-desc">
                Thank you{submittedName ? `, ${submittedName}` : ""}! Your warm wishes and blessings have reached {p1} &amp; {p2}.
              </p>

              {/* 15s Countdown Bar */}
              <div className="blessing-modal__countdown-wrap">
                <div className="blessing-modal__countdown-bar">
                  <div className="blessing-modal__countdown-fill" />
                </div>
                <p className="blessing-modal__countdown-text">
                  Popup will close automatically in <strong>{timeLeft}s</strong>
                </p>
              </div>

              <div className="blessing-modal__status-actions">
                <button
                  type="button"
                  className="button blessing-modal__action-btn blessing-modal__action-btn--primary"
                  onClick={onClose}
                >
                  Close Now
                </button>
                <button
                  type="button"
                  className="button blessing-modal__action-btn blessing-modal__action-btn--secondary"
                  onClick={handleReset}
                >
                  Send Another Blessing
                </button>
              </div>
            </div>
          )}

          {/* Idle / Error Form */}
          {(status === "idle" || status === "error" || status === "not-configured") && (
            <form onSubmit={handleSubmit} className="blessing-modal__form">
              <label className="blessing-modal__field">
                <span className="blessing-modal__label">Your Name</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul & Sunita Gupta"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  maxLength={60}
                  className="blessing-modal__input"
                />
              </label>

              <div className="blessing-modal__field">
                <span className="blessing-modal__label">From the side of</span>
                <div className="blessing-modal__side-pills">
                  {SIDES.map((side) => (
                    <label
                      key={side}
                      className={`blessing-modal__side-pill ${form.side === side ? "is-selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="modal-blessing-side"
                        value={side}
                        checked={form.side === side}
                        onChange={() => setForm({ ...form, side })}
                      />
                      <span className="blessing-modal__side-indicator" />
                      <span className="blessing-modal__side-text">{side}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="blessing-modal__field">
                <span className="blessing-modal__label">Your Message &amp; Blessings</span>
                <textarea
                  required
                  rows={4}
                  placeholder="Write your heartfelt wishes for the couple…"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="blessing-modal__textarea"
                />
              </label>

              {status === "error" && (
                <p className="blessing-modal__error-msg">
                  Something went wrong — please check your connection and try again.
                </p>
              )}
              {status === "not-configured" && (
                <p className="blessing-modal__error-msg">
                  Blessings service is not configured yet.
                </p>
              )}

              <button
                type="submit"
                className="button blessing-modal__submit-btn"
                disabled={status === "submitting"}
              >
                <img src={blessingsIcon} alt="" className="blessing-btn-flaticon" />
                <span>Send Warm Blessings</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
