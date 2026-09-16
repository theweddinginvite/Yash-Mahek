import { asset } from "../content";
import FitDevanagari from "./FitDevanagari";
import { smoothScrollTo } from "../lib/smoothScroll";
import "./ShreeGanesh.css";

// Fixed positions/timings for the twinkle sparkles — deterministic (no
// Math.random on every render) but spread out enough to look organic.
const SPARKLES = [
  { top: "12%", left: "8%", delay: "0s", duration: "3.2s" },
  { top: "22%", left: "22%", delay: "0.8s", duration: "4s" },
  { top: "15%", left: "40%", delay: "1.6s", duration: "3.6s" },
  { top: "30%", left: "58%", delay: "0.4s", duration: "3.8s" },
  { top: "18%", left: "75%", delay: "1.2s", duration: "3.4s" },
  { top: "35%", left: "88%", delay: "2s", duration: "4.2s" },
  { top: "55%", left: "12%", delay: "0.6s", duration: "3.5s" },
  { top: "65%", left: "30%", delay: "1.8s", duration: "3.9s" },
  { top: "48%", left: "50%", delay: "1s", duration: "3.3s" },
  { top: "60%", left: "68%", delay: "2.4s", duration: "4.1s" },
  { top: "52%", left: "85%", delay: "0.2s", duration: "3.7s" },
  { top: "78%", left: "20%", delay: "1.4s", duration: "3.6s" },
  { top: "82%", left: "45%", delay: "0.9s", duration: "4s" },
  { top: "75%", left: "65%", delay: "2.2s", duration: "3.4s" },
  { top: "85%", left: "80%", delay: "1.6s", duration: "3.8s" },
  { top: "8%", left: "55%", delay: "2.6s", duration: "3.5s" },
];

export default function ShreeGanesh() {
  return (
    <section id="shree-ganesh" className="shree-ganesh">
      <div className="shree-ganesh__view">
        <div className="shree-ganesh__shimmer" aria-hidden="true" />
        <div className="shree-ganesh__sparkles" aria-hidden="true">
          {SPARKLES.map((s, i) => (
            <span
              key={i}
              className="sparkle"
              style={{ top: s.top, left: s.left, animationDelay: s.delay, animationDuration: s.duration }}
            />
          ))}
        </div>
        <div className="shree-ganesh__overlay">
          <div className="shree-ganesh__ganesh" aria-hidden="true">
            <div className="shree-ganesh__ganesh-glow" />
            <img
              src={asset("/images/lordganesh/ganeshWithoutBackground.png")}
              alt=""
              className="shree-ganesh__ganesh-art"
              aria-hidden="true"
            />
          </div>

          <div className="shree-ganesh__inbetween">
            <div className="shree-ganesh__shlok-block">
              <FitDevanagari
                className="shree-ganesh__shlok"
                lines={["वक्रतुण्ड महाकाय सूर्यकोटिसमप्रभ ।", "निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा ॥"]}
              />
              <p className="shree-ganesh__shlok-translation">
                O Lord Ganesha, of the curved trunk and massive body, with the brilliance of a
                million suns — please make all my endeavors free of obstacles, always.
              </p>
            </div>
            <span className="shree-ganesh__shlok-divider" aria-hidden="true" />
            <div className="shree-ganesh__shlok-block">
              <FitDevanagari
                className="shree-ganesh__shlok"
                lines={["मंगलम् भगवान विष्णुः मंगलम् गरुणध्वजः ।", "मंगलम् पुण्डरी काक्षः मंगलाय तनो हरिः ॥"]}
              />
              <p className="shree-ganesh__shlok-translation">
                Lord Vishnu is auspicious, the lotus-eyed Lord who bears Garuda upon His banner is auspicious; may Lord Hari bless us with auspiciousness.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="shree-ganesh__scroll-btn"
            onClick={() => smoothScrollTo("invitation", { offset: 0 })}
            aria-label="Scroll to Invitation"
          >
            <span className="shree-ganesh__scroll-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
