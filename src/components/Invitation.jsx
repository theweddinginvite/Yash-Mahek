import { useEffect, useState } from "react";
import content from "../content";
import Countdown from "./Countdown";
import ScratchReveal from "./ScratchReveal";
import ConfettiBurst from "./ConfettiBurst";
import "./Invitation.css";

export default function Invitation({ isDateRevealed = false, onDateReveal }) {
  const { couple, wedding, hero } = content;
  const [revealed, setRevealed] = useState(isDateRevealed);

  useEffect(() => {
    setRevealed(isDateRevealed);
  }, [isDateRevealed]);

  function handleReveal() {
    setRevealed(true);
    onDateReveal?.();
  }

  return (
    <section id="invitation" className="invitation">
      <div className="invitation__overlay">
        <div className="invitation__header">
          <span className="invitation__tagline">{hero.tagline}</span>
        </div>

        <div className="invitation__body">
          <p className="invitation__intro">
            We cordially invite you on the auspicious union of
          </p>

          <div className="invitation__person">
            <span className="invitation__name">{couple.partner1}</span>
          </div>

          <div className="invitation__and-wrap">
            <span className="invitation__and">&amp;</span>
          </div>

          <div className="invitation__person">
            <span className="invitation__name">{couple.partner2}</span>
          </div>
        </div>

        <div className="invitation__scratch">
          <ScratchReveal
            forceRevealed={isDateRevealed}
            onReveal={handleReveal}
          >
            <div className="invitation__reveal-content">
              <p className="invitation__date invitation__date--reveal">
                {wedding.displayDate}
              </p>
              <Countdown targetDate={wedding.dateTimeISO} />
            </div>
          </ScratchReveal>
        </div>
      </div>
      <ConfettiBurst trigger={revealed} />
    </section>
  );
}
