import { useState } from "react";
import content from "../content";
import { addRSVPToFirestore, isFirebaseConfigured } from "../lib/firebase";
import ConfettiBurst from "./ConfettiBurst";
import rsvpIcon from "../assets/flaticons/rsvp-13430453.png";
import "./BlessingsRSVP.css";

const SIDES = ["Groom", "Bride"];

function submitToSheet(appsScriptUrl, payload) {
  return fetch(appsScriptUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });
}

function buildWhatsAppUrl(data, whatsappNumber) {
  if (!data) return "https://wa.me/";
  const { partner1, partner2 } = content.couple;
  const isAttending = data.attending === "Yes";
  const lines = [
    `RSVP for ${partner1} & ${partner2}'s wedding:`,
    `Name: ${data.name || ""}`,
    `From the side of: ${data.side || ""}`,
    `Visit Plan: ${isAttending ? "Joyfully accept" : "Regretfully decline"}`,
    ...(isAttending
      ? [
          `Total Guests: ${data.guests || 1}`,
          `Expected Arrival: ${data.expectedArrival || `${data.arrivalDate || "5 Dec"}, ${data.arrivalTime || "12"} ${data.arrivalPeriod || "PM"}`}`,
          `Parking Required: ${data.parkingRequired || "No"}`,
        ]
      : []),
  ];
  const number = whatsappNumber ? String(whatsappNumber).replace(/\D/g, "") : "";
  return `https://wa.me/${number}?text=${encodeURIComponent(lines.join("\n"))}`;
}

function SendingAnimation({ message = `Sending your RSVP confirmation to ${content.couple.partner1} & ${content.couple.partner2}…` }) {
  return (
    <div className="sending-animation" aria-live="polite">
      <div className="sending-animation__visual">
        <div className="sending-animation__envelope">
          <svg viewBox="0 0 80 56" className="sending-animation__svg" aria-hidden="true">
            <rect x="2" y="2" width="76" height="52" rx="6" fill="#fdfbf7" stroke="#b08968" strokeWidth="1.5" />
            <path d="M4 6 L40 34 L76 6" fill="none" stroke="#b08968" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M4 50 L30 26" fill="none" stroke="rgba(176, 137, 104, 0.4)" strokeWidth="1.2" />
            <path d="M76 50 L50 26" fill="none" stroke="rgba(176, 137, 104, 0.4)" strokeWidth="1.2" />
            <circle cx="40" cy="33" r="8" fill="#8f3350" />
            <circle cx="40" cy="33" r="6.5" fill="none" stroke="#d4af37" strokeWidth="1" />
            <path d="M37.5 33.5 L39.5 35.5 L43 31" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="sending-animation__sparkles">
            <span className="sending-sparkle sending-sparkle--1">✨</span>
            <span className="sending-sparkle sending-sparkle--2">🌸</span>
            <span className="sending-sparkle sending-sparkle--3">✨</span>
          </div>
        </div>
        <div className="sending-animation__trail" />
      </div>
      <p className="sending-animation__text">{message}</p>
      <div className="sending-animation__bar">
        <div className="sending-animation__progress" />
      </div>
    </div>
  );
}

function RsvpForm({ appsScriptUrl, whatsappNumber, onCelebrate }) {
  const [status, setStatus] = useState("idle");
  const [form, setForm] = useState({
    name: "",
    side: SIDES[0],
    attending: "Yes",
    guests: 1,
    arrivalDate: "5 Dec",
    arrivalTime: "12",
    arrivalPeriod: "PM",
    parkingRequired: "No",
  });
  const [submittedData, setSubmittedData] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isFirebaseConfigured && !appsScriptUrl) {
      setStatus("not-configured");
      return;
    }
    setStatus("submitting");
    const isAttending = form.attending === "Yes";
    const currentData = {
      ...form,
      guests: isAttending ? Number(form.guests) || 1 : 0,
      expectedArrival: isAttending
        ? `${form.arrivalDate}, ${form.arrivalTime} ${form.arrivalPeriod}`
        : "N/A",
    };
    const startTime = Date.now();

    try {
      if (isFirebaseConfigured) {
        const docRef = await addRSVPToFirestore(currentData);
        if (appsScriptUrl) {
          submitToSheet(appsScriptUrl, {
            type: "rsvp",
            ...currentData,
            firestoreId: docRef?.id || "",
          }).catch(() => {});
        }
      } else {
        const res = await submitToSheet(appsScriptUrl, { type: "rsvp", ...currentData });
        if (!res.ok) throw new Error("Request failed");
      }

      // Ensure minimum animation duration of 1.4s
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 1400 - elapsed);
      await new Promise((r) => setTimeout(r, remaining));

      setStatus("success");
      setSubmittedData(currentData);
      if (onCelebrate) onCelebrate();
      setForm({
        name: "",
        side: SIDES[0],
        attending: "Yes",
        guests: 1,
        arrivalDate: "5 Dec",
        arrivalTime: "12",
        arrivalPeriod: "PM",
        parkingRequired: "No",
      });
    } catch (err) {
      console.error("RSVP submission error:", err);
      setStatus("error");
    }
  };

  if (status === "submitting") {
    return <SendingAnimation message={`Sending your RSVP confirmation to ${content.couple.partner1} & ${content.couple.partner2}…`} />;
  }

  if (status === "success") {
    return (
      <div className="form-status form-status--success">
        <div className="form-status__seal">
          <span className="form-status__seal-icon">🎉</span>
        </div>
        <h3 className="form-status__title">RSVP Confirmed!</h3>
        <p className="form-status__desc">
          Thank you{submittedData?.name ? `, ${submittedData.name}` : ""}! Your response has been recorded for {content.couple.partner1} &amp; {content.couple.partner2}&apos;s wedding. We look forward to celebrating together!
        </p>
        <div className="form-status__actions">
          <a
            className="button form-status__btn form-status__btn--primary"
            href="#blessings"
          >
            <span style={{ marginRight: "0.35rem" }}>✨</span> Send Blessings
          </a>
          {whatsappNumber !== false && (
            <a
              className="button form-status__btn form-status__btn--secondary"
              href={buildWhatsAppUrl(submittedData, whatsappNumber)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span style={{ marginRight: "0.35rem" }}>💬</span> Share via WhatsApp
            </a>
          )}
          <button
            type="button"
            className="button form-status__btn form-status__btn--subtle"
            onClick={() => setStatus("idle")}
          >
            Submit Another RSVP
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="rsvp-form-fields" onSubmit={handleSubmit}>
      <label>
        <span className="rsvp-form-fields__label-text">Your Name</span>
        <input
          type="text"
          required
          placeholder="e.g. Rahul Gupta"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </label>

      <div className="rsvp-form-fields__side-group">
        <span className="rsvp-form-fields__label-text">From the side of</span>
        <div className="side-selector-pills">
          {SIDES.map((side) => (
            <label
              key={side}
              className={`side-pill ${form.side === side ? "is-selected" : ""}`}
            >
              <input
                type="radio"
                name="rsvp-side"
                value={side}
                checked={form.side === side}
                onChange={() => setForm({ ...form, side })}
              />
              <span className="side-pill__indicator" />
              <span className="side-pill__text">{side}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="rsvp-form-fields__row">
        <label className="rsvp-form-fields__col">
          <span className="rsvp-form-fields__label-text">Your visit plan:</span>
          <select
            value={form.attending}
            onChange={(e) => setForm({ ...form, attending: e.target.value })}
          >
            <option value="Yes">Joyfully accept</option>
            <option value="No">Regretfully decline</option>
          </select>
        </label>

        <label className="rsvp-form-fields__col">
          <span className="rsvp-form-fields__label-text">Total Guests</span>
          <input
            type="number"
            min={1}
            max={10}
            value={form.guests}
            onChange={(e) => setForm({ ...form, guests: e.target.value })}
            disabled={form.attending === "No"}
          />
        </label>
      </div>

      {form.attending === "Yes" && (
        <div className="rsvp-form-fields__arrival-group">
          <span className="rsvp-form-fields__label-text">Expected Arrival (Date &amp; Time):</span>
          <div className="rsvp-form-fields__arrival-row">
            <label className="rsvp-arrival-field rsvp-arrival-field--date">
              <span className="rsvp-arrival-field__sublabel">Date</span>
              <select
                value={form.arrivalDate}
                onChange={(e) => setForm({ ...form, arrivalDate: e.target.value })}
                aria-label="Arrival Date"
              >
                <option value="5 Dec">5 Dec</option>
                <option value="6 Dec">6 Dec</option>
              </select>
            </label>

            <label className="rsvp-arrival-field rsvp-arrival-field--time">
              <span className="rsvp-arrival-field__sublabel">Time</span>
              <select
                value={form.arrivalTime}
                onChange={(e) => setForm({ ...form, arrivalTime: e.target.value })}
                aria-label="Arrival Time"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((hour) => (
                  <option key={hour} value={String(hour)}>
                    {hour}
                  </option>
                ))}
              </select>
            </label>

            <label className="rsvp-arrival-field rsvp-arrival-field--period">
              <span className="rsvp-arrival-field__sublabel">AM/PM</span>
              <select
                value={form.arrivalPeriod}
                onChange={(e) => setForm({ ...form, arrivalPeriod: e.target.value })}
                aria-label="AM or PM"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </label>
          </div>
        </div>
      )}

      <label>
        <span className="rsvp-form-fields__label-text">Parking required?</span>
        <select
          value={form.parkingRequired}
          onChange={(e) => setForm({ ...form, parkingRequired: e.target.value })}
          disabled={form.attending === "No"}
        >
          <option value="No">No</option>
          <option value="Yes">Yes</option>
        </select>
      </label>

      {status === "error" && (
        <p className="form-status form-status--error">
          Something went wrong — please try again.
        </p>
      )}
      {status === "not-configured" && (
        <p className="form-status form-status--error">
          This form isn&apos;t connected yet. (See README.md to set up the backend.)
        </p>
      )}

      <button type="submit" className="button rsvp-submit-btn" disabled={status === "submitting"}>
        <img src={rsvpIcon} alt="" className="rsvp-btn-flaticon" /> Send RSVP
      </button>
    </form>
  );
}

export default function BlessingsRSVP() {
  const { blessingsRsvp, integrations } = content;
  const [celebrateTrigger, setCelebrateTrigger] = useState(0);
  const celebrate = () => setCelebrateTrigger((t) => t + 1);

  return (
    <section id="blessings-rsvp" className="section">
      <ConfettiBurst trigger={celebrateTrigger} />
      <div className="section__inner">
        <div className="section__heading">
          <span className="eyebrow">Join The Celebration</span>
          <h2>{blessingsRsvp.heading}</h2>
          <p>{blessingsRsvp.subtext}</p>
        </div>

        {/* Royal Luxury Card Enclosure */}
        <div className="blessings-rsvp-card">
          {/* Card Decorative Luxury Frame */}
          <div className="blessings-rsvp-card__frame" aria-hidden="true">
            <span className="blessings-rsvp-card__inner-border" />
          </div>

          <div className="blessings-rsvp-card__content">
            <RsvpForm
              appsScriptUrl={integrations?.appsScriptUrl || integrations?.googleSheets?.appsScriptUrl}
              whatsappNumber={integrations?.whatsappNumber || integrations?.whatsapp?.rsvpNumber || ""}
              onCelebrate={celebrate}
            />
          </div>
        </div>
      </div>

      {/* Full-Width Section Division Line Across Page */}
      <div className="section-divider" aria-hidden="true" />
    </section>
  );
}
