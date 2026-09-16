import { useEffect, useState } from "react";
import Nav from "./components/Nav";
import ShreeGanesh from "./components/ShreeGanesh";
import Invitation from "./components/Invitation";
import MeetFamilies from "./components/MeetFamilies";
import EventDetails from "./components/EventDetails";
import Gallery from "./components/Gallery";
import Blessings from "./components/Blessings";
import BlessingsRSVP from "./components/BlessingsRSVP";
import FAQ from "./components/FAQ";
import FloatingControls from "./components/FloatingControls";
import EnvelopeIntro from "./components/EnvelopeIntro";
import PageSparkles from "./components/PageSparkles";
import CursorSparkleTrail from "./components/CursorSparkleTrail";
import SaveEventsModal from "./components/SaveEventsModal";
import NoticeBoardModal from "./components/NoticeBoardModal";
import { subscribeToAnnouncements } from "./lib/firebase";
import content from "./content";

function App({ entries, status, myBlessingKey, addLocalBlessing }) {
  // Remembered per-session so navigating to/from the Blessings Wall page
  // (which remounts App via the hash route in main.jsx) doesn't replay it.
  const [opened, setOpened] = useState(
    () =>
      sessionStorage.getItem("envelopeOpened") === "true" ||
      window.location.search.includes("noenvelope") ||
      (window.location.hash.length > 1 && window.location.hash !== "#wall")
  );

  const [dateRevealed, setDateRevealed] = useState(
    () => sessionStorage.getItem("dateRevealed") === "true"
  );

  const [isSaveEventsModalOpen, setIsSaveEventsModalOpen] = useState(false);
  const [isNoticeBoardOpen, setIsNoticeBoardOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToAnnouncements(
      (data) => setAnnouncements(data || []),
      (err) => console.warn("Firestore announcements subscription notice:", err)
    );
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = opened ? "" : "hidden";
    if (opened && window.location.hash && window.location.hash !== "#wall") {
      setTimeout(() => {
        const el = document.querySelector(window.location.hash);
        if (el) el.scrollIntoView({ behavior: "instant" });
      }, 50);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [opened]);

  function handleOpen() {
    sessionStorage.setItem("envelopeOpened", "true");
    setOpened(true);
  }

  function handleDateReveal() {
    sessionStorage.setItem("dateRevealed", "true");
    setDateRevealed(true);
  }

  function handleReopenEnvelope() {
    sessionStorage.removeItem("envelopeOpened");
    sessionStorage.removeItem("dateRevealed");
    setDateRevealed(false);
    setOpened(false);
  }

  return (
    <>
      {!opened && <EnvelopeIntro onOpen={handleOpen} />}
      <PageSparkles />
      <CursorSparkleTrail />
      <Nav />
      <ShreeGanesh />
      <Invitation isDateRevealed={dateRevealed} onDateReveal={handleDateReveal} />
      <MeetFamilies />
      <EventDetails onOpenSaveEvents={() => setIsSaveEventsModalOpen(true)} />
      <Gallery />
      <Blessings entries={entries} status={status} myBlessingKey={myBlessingKey} />
      <BlessingsRSVP onBlessingSent={addLocalBlessing} />
      <FAQ isDateRevealed={dateRevealed} />
      <FloatingControls
        onReopenEnvelope={handleReopenEnvelope}
        onOpenSaveEvents={() => setIsSaveEventsModalOpen(true)}
        onOpenNoticeBoard={() => setIsNoticeBoardOpen(true)}
        hasNotices={announcements.length > 0}
      />
      <SaveEventsModal
        isOpen={isSaveEventsModalOpen}
        onClose={() => setIsSaveEventsModalOpen(false)}
        events={content.events}
        couple={content.couple}
        venue={content.venue}
      />
      <NoticeBoardModal
        isOpen={isNoticeBoardOpen}
        onClose={() => setIsNoticeBoardOpen(false)}
        announcements={announcements}
      />
    </>
  );
}

export default App;
