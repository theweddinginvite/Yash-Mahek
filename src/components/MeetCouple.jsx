import { useMemo } from "react";
import content from "../content";
import FitDevanagari from "./FitDevanagari";
import "./MeetFamilies.css";

function LayeredSymbol({ word, initial }) {
  const ghost = word.startsWith(initial) ? word.slice(initial.length) : "";
  return (
    <span className="family-card__symbol-layered">
      <span className="family-card__symbol-base">{word}</span>
      <span className="family-card__symbol-overlay" aria-hidden="true">
        <span className="family-card__symbol-initial">{initial}</span>
        <span className="family-card__symbol-ghost">{ghost}</span>
      </span>
    </span>
  );
}

function SymbolHeader({ text, side }) {
  if (text?.includes("मंगलम्") || side === "bride") {
    return (
      <div className="family-card__symbol-title" lang="sa">
        <span className="family-card__symbol-danda">॥</span>
        <LayeredSymbol word="मंगलम्" initial="म" />
        <span className="family-card__symbol-danda">॥</span>
      </div>
    );
  }

  if (text?.includes("युग्म") || side === "groom") {
    return (
      <div className="family-card__symbol-title" lang="sa">
        <span className="family-card__symbol-danda">॥</span>
        <LayeredSymbol word="युग्म" initial="य" />
        <span className="family-card__symbol-danda">॥</span>
      </div>
    );
  }

  return (
    <div className="family-card__symbol-title" lang="sa">
      <span className="family-card__symbol-base">{text || "॥ श्री ॥"}</span>
    </div>
  );
}

function FamilyCard({ family, side }) {
  const {
    symbol,
    symbolTranslation,
    familyTitle,
    location,
    grandparents,
    invitePhrase1,
    parents,
    invitePhrase2,
    name,
    relation,
  } = family;

  return (
    <article className={`family-card family-card--${side}`}>
      {/* Luxury Royal Double Border Frame */}
      <div className="family-card__frame" aria-hidden="true">
        <span className="family-card__inner-border" />
      </div>

      <div className="family-card__content">
        <div className="family-card__symbol" lang="sa">
          <SymbolHeader text={symbol} side={side} />
        </div>
        <p className="family-card__symbol-translation">
          {symbolTranslation || (side === "bride" ? "Auspicious Beginning" : "Sacred Union")}
        </p>
        <h3 className="family-card__title">{familyTitle}</h3>
        {location && <p className="family-card__location">{location}</p>}

        <div className="family-card__divider" aria-hidden="true" />

        {grandparents && grandparents.length > 0 && (
          <div className="family-card__blessing-box">
            <span className="family-card__blessing-tag">
              Under the divine grace &amp; blessings of revered grandparents
            </span>
            <div className="family-card__blessing-names">
              <span>{grandparents[0]}</span>
              <span className="family-card__amp-sub">&amp;</span>
              <span>{grandparents[1]}</span>
            </div>
          </div>
        )}

        <div className="family-card__group family-card__group--parents">
          <p className="family-card__sublabel">
            {invitePhrase1 || "with their family and loved ones"}
          </p>
          <div className="family-card__parents">
            <span className="family-card__parent-name">{parents[0]}</span>
            <span className="family-card__amp">&amp;</span>
            <span className="family-card__parent-name">{parents[1]}</span>
          </div>
        </div>

        <p className="family-card__request-phrase">
          {invitePhrase2 ||
            "request the pleasure of your company on the auspicious wedding of"}
        </p>

        <div className="family-card__name">{name}</div>
        <div className="family-card__relation">{relation}</div>
      </div>
    </article>
  );
}

export default function MeetFamilies() {
  const familyData = content.familySection || {};
  const { brideFamily, groomFamily, shloka, quote } = familyData;

  const shlokaLines = useMemo(() => {
    if (Array.isArray(shloka)) return shloka;
    const text =
      shloka || "॥ ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं ।\nभर्गो देवस्य धीमहि धियो यो नः प्रचोदयात् ॥";
    if (text.includes("\n")) {
      return text.split("\n").map((l) => l.trim()).filter(Boolean);
    }
    if (text.includes(",")) {
      const parts = text.split(",");
      return [`${parts[0].trim()},`, parts.slice(1).join(",").trim()];
    }
    return [text];
  }, [shloka]);

  // Fallbacks if not fully populated
  const bride = brideFamily || {
    symbol: "॥ मंगलम् ॥",
    familyTitle: "THE GUPTA FAMILY",
    location: "Moradabad · The City of Brass",
    grandparents: [
      content.coupleProfiles?.bride?.grandparentage?.person1 || "Late Smt. Sarla Devi Gupta",
      content.coupleProfiles?.bride?.grandparentage?.person2 || "Late Shri Prem Shankar Gupta",
    ],
    invitePhrase1: "with their family and loved ones",
    parents: [
      content.coupleProfiles?.bride?.parentage?.person1 || "Smt. Deepa Gupta",
      content.coupleProfiles?.bride?.parentage?.person2 || "Shri Rajiv Gupta",
    ],
    invitePhrase2: "request the pleasure of your company on the auspicious wedding of",
    name: content.couple?.partner1 || "Mahek",
    relation: "Their beloved daughter",
  };

  const groom = groomFamily || {
    symbol: "॥ युग्म ॥",
    familyTitle: "THE GUPTA FAMILY",
    location: "Moradabad · The City of Brass",
    grandparents: [
      content.coupleProfiles?.groom?.grandparentage?.person1 || "Late Smt. Rama Gupta",
      content.coupleProfiles?.groom?.grandparentage?.person2 || "Late Shri Shri Niwas Gupta",
    ],
    invitePhrase1: "with their family and loved ones",
    parents: [
      content.coupleProfiles?.groom?.parentage?.person1 || "Smt. Renu Gupta",
      content.coupleProfiles?.groom?.parentage?.person2 || "Shri Sandeep Kumar Gupta",
    ],
    invitePhrase2: "request the pleasure of your company on the auspicious wedding of",
    name: content.couple?.partner2 || "Yashoratna",
    relation: "Their beloved son",
  };

  return (
    <section id="couple" className="section family-section">
      <div id="families" style={{ position: "absolute", top: 0 }} />
      <div className="section__inner family-section__inner">
        <div className="section__heading family-section__heading">
          <span className="eyebrow">Meet</span>
          <h2>The Families</h2>
        </div>

        <div className="family-section__header">
          <FitDevanagari
            className="family-section__shloka"
            lines={shlokaLines}
          />
          <p className="family-section__quote">
            {quote ||
              '"We meditate on the transcendent glory of the Divine Sun, creator of all realms — may that divine brilliance inspire and illuminate our path."'}
          </p>
        </div>

        <div className="family-cards-container">
          <FamilyCard family={bride} side="bride" />

          <div className="family-cards__divider" aria-hidden="true">
            <span className="family-cards__divider-line family-cards__divider-line--top" />
            <span className="family-cards__divider-om" lang="sa">
              ॐ
            </span>
            <span className="family-cards__divider-line family-cards__divider-line--bottom" />
          </div>

          <FamilyCard family={groom} side="groom" />
        </div>
      </div>
    </section>
  );
}
