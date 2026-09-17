import { useEffect, useRef, useState } from "react";
import content, { asset } from "../content";
import GalleryUploadModal from "./GalleryUploadModal";
import cameraIcon from "../assets/flaticons/camera-711191.png";
import "./Gallery.css";

const VISIBLE_RANGE = 3; // covers beyond +/-3 slots from center are hidden
const IDLE_RESET_DELAY_MS = 8000; // Reset to center logo card after 8s of inactivity

// Default Generated Tile with Monogram Logo
const CARICATURE_PLACEHOLDERS = [
  {
    isCaricature: true,
    caricatureSrc: asset("/images/monogram/monogramWithoutBg.png"),
    title: `${content.couple.partner1} & ${content.couple.partner2}`,
    subtitle: "A Lifetime of Love and Happiness",
    badge: "Forever Together 🌸",
    alt: `${content.couple.partner1} & ${content.couple.partner2} Monogram Logo`,
  },
];

// Helper to convert Google Drive URL to direct streaming URL
function normalizePhotoUrl(url) {
  if (!url) return "";
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  if (match) {
    const fileId = match[1];
    return `https://lh3.googleusercontent.com/d/${fileId}=w1600`;
  }
  return url;
}

// Signed distance from `index` to `activeIndex`, wrapped the short way
function wrappedOffset(index, activeIndex, count) {
  let diff = index - activeIndex;
  if (diff > count / 2) diff -= count;
  if (diff < -count / 2) diff += count;
  return diff;
}

export default function Gallery() {
  const [failedImages, setFailedImages] = useState({});

  const defaultGallery = (content.gallery || []).map((item, idx) => ({
    src: normalizePhotoUrl(item.src),
    alt: item.alt || `Memory ${idx + 1}`,
  }));

  const [rawPhotos, setRawPhotos] = useState(() => {
    try {
      const cached = localStorage.getItem("wedding_dynamic_gallery");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return defaultGallery;
  });

  // Always position the logo card in the center count of the photos array:
  // e.g. 5 total -> 3rd (index 2); 6 photos -> 4th item (index 3 out of 7 total)
  const photos = (() => {
    const realPhotos = rawPhotos.filter((p) => p && p.src && !p.isCaricature);
    const mid = Math.floor(realPhotos.length / 2);
    return [
      ...realPhotos.slice(0, mid),
      ...CARICATURE_PLACEHOLDERS,
      ...realPhotos.slice(mid),
    ];
  })();

  const logoIndex = Math.max(0, photos.findIndex((p) => p.isCaricature));
  const logoIndexRef = useRef(logoIndex);
  logoIndexRef.current = logoIndex;

  const [activeIndex, setActiveIndex] = useState(() => logoIndex);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const touchStartXRef = useRef(null);

  // Keep activeIndex on the logo card if dynamic photos change the logo position initially
  const prevLogoIndexRef = useRef(logoIndex);
  useEffect(() => {
    if (prevLogoIndexRef.current !== logoIndex) {
      setActiveIndex((current) => (current === prevLogoIndexRef.current ? logoIndex : current));
      prevLogoIndexRef.current = logoIndex;
    }
  }, [logoIndex]);

  // Fetch dynamic gallery photos from Google Apps Script / Drive endpoint
  useEffect(() => {
    const appsScriptUrl = content.integrations?.appsScriptUrl || content.appsScriptUrl;
    if (!appsScriptUrl) return;

    let isMounted = true;
    const fetchGallery = async () => {
      try {
        const res = await fetch(`${appsScriptUrl}?action=getGallery&_t=${Date.now()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.ok && Array.isArray(data.photos)) {
          const normalized = data.photos.map((p, i) => ({
            src: normalizePhotoUrl(p.src),
            alt: p.alt || `Wedding Memory ${i + 1}`,
          }));
          if (isMounted) {
            setRawPhotos(normalized);
            try {
              localStorage.setItem("wedding_dynamic_gallery", JSON.stringify(normalized));
            } catch {
              // ignore
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch dynamic gallery photos:", err);
      }
    };

    fetchGallery();
    return () => {
      isMounted = false;
    };
  }, []);

  // Return to center logo card after an idle period of inactivity
  useEffect(() => {
    if (activeIndex === logoIndexRef.current || lightboxOpen) return;

    const idleTimer = setTimeout(() => {
      setActiveIndex(logoIndexRef.current);
    }, IDLE_RESET_DELAY_MS);

    return () => {
      clearTimeout(idleTimer);
    };
  }, [activeIndex, lightboxOpen]);

  const selectTile = (index) => setActiveIndex(index);
  const openLightbox = () => setLightboxOpen(true);
  const closeLightbox = () => setLightboxOpen(false);

  const showPrev = (e) => {
    e?.stopPropagation();
    setActiveIndex((i) => (i - 1 + photos.length) % photos.length);
  };

  const showNext = (e) => {
    e?.stopPropagation();
    setActiveIndex((i) => (i + 1) % photos.length);
  };

  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      touchStartXRef.current = e.touches[0].clientX;
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null) return;
    if (e.changedTouches && e.changedTouches[0]) {
      const diff = touchStartXRef.current - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) {
          showNext();
        } else {
          showPrev();
        }
      }
    }
    touchStartXRef.current = null;
  };

  const handleImageError = (photoSrc, index) => {
    setFailedImages((prev) => ({ ...prev, [photoSrc || `photo-${index}`]: true }));
  };

  const activePhoto = photos[activeIndex] || photos[logoIndex] || CARICATURE_PLACEHOLDERS[0];
  const activeIsFailed = activePhoto?.src && failedImages[activePhoto.src];

  return (
    <section id="gallery" className="section section--surface">
      <div className="section__inner">
        <div className="section__heading">
          <span className="eyebrow">Memories</span>
          <h2>Gallery</h2>
        </div>

        <div className="gallery-stage-wrapper">
          <div
            className="coverflow"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="coverflow__stage">
              {photos.map((photo, index) => {
                const offset = wrappedOffset(index, activeIndex, photos.length);
                const abs = Math.abs(offset);
                const isActive = offset === 0;
                const hidden = abs > VISIBLE_RANGE;
                const isFailed = photo.src && failedImages[photo.src];
                const isCaricature = photo.isCaricature || isFailed;
                const caricatureData = photo.isCaricature
                  ? photo
                  : CARICATURE_PLACEHOLDERS[0];

                return (
                  <div
                    key={(photo.src || "caricature") + index}
                    className={`coverflow__cover ${isActive ? "is-active" : ""}`}
                    style={{
                      zIndex: photos.length - abs,
                      transform: `translateX(${offset * 52}%) translateZ(${-abs * 130}px) rotateY(${offset * -38}deg) scale(${isActive ? 1 : 0.76})`,
                      opacity: hidden ? 0 : 1,
                      pointerEvents: hidden ? "none" : "auto",
                    }}
                    onClick={() => (isActive ? openLightbox() : selectTile(index))}
                    role="button"
                    tabIndex={hidden ? -1 : 0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        isActive ? openLightbox() : selectTile(index);
                      }
                    }}
                    aria-label={isActive ? `View ${photo.alt || caricatureData.title} enlarged` : `Show ${photo.alt || caricatureData.title}`}
                  >
                    {isCaricature ? (
                      /* Monogram Logo Card */
                      <div className="coverflow__caricature-card">
                        <div className="coverflow__caricature-icon-wrap">
                          <img
                            src={caricatureData.caricatureSrc}
                            alt={caricatureData.alt}
                            className="coverflow__caricature-img"
                          />
                        </div>
                        <h3 className="coverflow__caricature-title">{caricatureData.title}</h3>
                        <p className="coverflow__caricature-subtitle">{caricatureData.subtitle}</p>
                        <span className="coverflow__caricature-badge">{caricatureData.badge}</span>
                      </div>
                    ) : (
                      <>
                        {/* Ambient Backdrop */}
                        <div
                          className="coverflow__cover-bg"
                          style={{ backgroundImage: `url("${photo.src}")` }}
                          aria-hidden="true"
                        />
                        {/* Crisp Scaled Image */}
                        <img
                          src={photo.src}
                          alt={photo.alt}
                          className="coverflow__img"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const match = photo.src.match(/\/d\/([a-zA-Z0-9_-]+)/);
                            if (match && !e.currentTarget.dataset.retried) {
                              e.currentTarget.dataset.retried = "true";
                              e.currentTarget.src = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1200`;
                            } else {
                              handleImageError(photo.src, index);
                            }
                          }}
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls Below Gallery View */}
          <div className="gallery-carousel-controls">
            <button
              type="button"
              className="gallery-nav-btn gallery-nav-btn--prev"
              onClick={showPrev}
              aria-label="Previous photo"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>Prev</span>
            </button>

            <div className="coverflow__dots">
              {photos.map((photo, index) => (
                <button
                  key={(photo.src || "dot") + index}
                  type="button"
                  className={`coverflow__dot ${index === activeIndex ? "is-active" : ""}`}
                  onClick={() => selectTile(index)}
                  aria-label={`Show photo ${index + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              className="gallery-nav-btn gallery-nav-btn--next"
              onClick={showNext}
              aria-label="Next photo"
            >
              <span>Next</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Upload Photos & Videos Action Button Below Tiles */}
          <div className="gallery-upload-action">
            <p className="gallery-upload-action__subtext">
              Share your captured memories with us
            </p>
            <button
              type="button"
              className="gallery-upload-btn"
              onClick={() => setIsUploadModalOpen(true)}
            >
              <img src={cameraIcon} alt="" className="gallery-upload-btn__img" />
              Upload Photos &amp; Videos
            </button>
          </div>
        </div>
      </div>

      {/* Full-Width Section Division Line Across Page */}
      <div className="section-divider" aria-hidden="true" />

      {lightboxOpen && activePhoto && (
        <div className="lightbox" onClick={closeLightbox}>
          <button
            type="button"
            className="lightbox__close"
            onClick={closeLightbox}
            aria-label="Close"
          >
            &times;
          </button>
          <button
            type="button"
            className="lightbox__nav lightbox__nav--prev"
            onClick={showPrev}
            aria-label="Previous photo"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="lightbox__content" onClick={(e) => e.stopPropagation()}>
            {activePhoto.isCaricature || activeIsFailed ? (
              <div className="lightbox__caricature-wrap">
                <img
                  src={
                    activePhoto.isCaricature
                      ? activePhoto.caricatureSrc
                      : CARICATURE_PLACEHOLDERS[0].caricatureSrc
                  }
                  alt={activePhoto.alt || `${content.couple.partner1} & ${content.couple.partner2} Monogram Logo`}
                  className="lightbox__img lightbox__img--caricature"
                />
                <h3 className="coverflow__caricature-title" style={{ fontSize: "1.5rem", marginTop: "0.35rem" }}>
                  {activePhoto.title || CARICATURE_PLACEHOLDERS[0].title}
                </h3>
                <p className="coverflow__caricature-subtitle" style={{ fontSize: "0.95rem" }}>
                  {activePhoto.subtitle || CARICATURE_PLACEHOLDERS[0].subtitle}
                </p>
                <span className="coverflow__caricature-badge" style={{ marginTop: "0.5rem" }}>
                  {activePhoto.badge || CARICATURE_PLACEHOLDERS[0].badge}
                </span>
              </div>
            ) : (
              <img
                src={activePhoto.src}
                alt=""
                className="lightbox__img"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
          <button
            type="button"
            className="lightbox__nav lightbox__nav--next"
            onClick={showNext}
            aria-label="Next photo"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}

      {/* Guest Photos & Videos Upload Modal */}
      <GalleryUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </section>
  );
}
