import { useCountdown } from "../hooks/useCountdown";
import "./Countdown.css";

const UNITS = [
  { key: "days", label: "Days" },
  { key: "hours", label: "Hours" },
  { key: "minutes", label: "Mins" },
  { key: "seconds", label: "Secs" },
];

export default function Countdown({ targetDate, numSize, labelSize }) {
  const timeLeft = useCountdown(targetDate);

  if (timeLeft.isPast) {
    return <p className="countdown countdown--past">We're married!</p>;
  }

  return (
    <div className="countdown">
      {UNITS.map((unit) => (
        <div className="countdown__unit" key={unit.key}>
          <span
            className="countdown__value"
            style={numSize ? { fontSize: `${numSize}rem` } : undefined}
          >
            {timeLeft[unit.key]}
          </span>
          <span
            className="countdown__label"
            style={labelSize ? { fontSize: `${labelSize}rem` } : undefined}
          >
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
}
