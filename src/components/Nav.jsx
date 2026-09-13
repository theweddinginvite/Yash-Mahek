import { useEffect, useRef, useState } from "react";
import { smoothScrollTo } from "../lib/smoothScroll";
import content, { asset } from "../content";
import "./Nav.css";

const LINKS = [
  { href: "#shree-ganesh", label: "Shree Ganesh" },
  { href: "#invitation", label: "Invitation" },
  { href: "#couple", label: "Meet Families" },
  { href: "#details", label: "Events" },
  { href: "#gallery", label: "Gallery" },
  { href: "#blessings", label: "Blessings Wall" },
  { href: "#blessings-rsvp", label: "RSVP" },
  { href: "#faq", label: "FAQ" },
];

export default function Nav() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const { partner1, partner2 } = content.couple;

  useEffect(() => {
    function updateVisibility() {
      const shreeGanesh = document.getElementById("shree-ganesh");
      const threshold = shreeGanesh ? shreeGanesh.offsetHeight - 80 : 200;
      setIsVisible(window.scrollY > threshold);
    }
    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);
    return () => {
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, []);

  // Close menu on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const scrollTo = (id) => {
    smoothScrollTo(id, { offset: 0 });
    setIsOpen(false);
  };

  const handleLinkClick = (event, href) => {
    event.preventDefault();
    scrollTo(href.slice(1));
  };

  const handleLogoClick = () => scrollTo("shree-ganesh");

  return (
    <>
      {/* Floating left hamburger button — only visible from 2nd page onwards */}
      <div className={`nav-trigger ${isVisible ? "nav-trigger--visible" : ""}`}>
        <button
          type="button"
          className={`nav-btn ${isOpen ? "nav-btn--active" : ""}`}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          <span className="nav-btn__bar" />
          <span className="nav-btn__bar" />
          <span className="nav-btn__bar" />
        </button>
      </div>

      {/* Dimmed backdrop when menu is open */}
      <div
        className={`nav-backdrop ${isOpen ? "nav-backdrop--open" : ""}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-out side drawer */}
      <aside
        className={`nav-drawer ${isOpen ? "nav-drawer--open" : ""}`}
        aria-label="Site navigation"
        aria-hidden={!isOpen}
      >
        <div className="nav-drawer__header">
          <button type="button" className="nav-drawer__logo" onClick={handleLogoClick} aria-label="Back to top">
            <img
              src={asset("/images/monogram/monogramCircularWithoutBg.png")}
              alt={`${partner1} & ${partner2}`}
              className="nav-drawer__logo-img"
            />
          </button>
          <div className="nav-drawer__couple-title">
            <span className="nav-drawer__couple-name">{partner1}</span>
            <span className="nav-drawer__couple-name">
              <span className="nav-drawer__amp">&amp;</span> {partner2}
            </span>
          </div>
          <button
            type="button"
            className="nav-drawer__close"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="nav-drawer__nav">
          <ul className="nav-drawer__list">
            {LINKS.map((link) => (
              <li key={link.href} className="nav-drawer__item">
                <a
                  href={link.href}
                  className="nav-drawer__link"
                  onClick={(e) => handleLinkClick(e, link.href)}
                >
                  <span className="nav-drawer__link-dot" aria-hidden="true" />
                  <span className="nav-drawer__link-text">{link.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
