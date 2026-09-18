import { useEffect, useRef, useState } from "react";
import { asset } from "../content";
import "./ScratchReveal.css";

const REVEAL_THRESHOLD = 0.5;
const BRUSH_RADIUS = 26;
const DEBRIS_COLORS = ["#7a1f1a", "#932823", "#5c1512", "#a8362f"];

function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export default function ScratchReveal({
  children,
  logoSrc = asset("/images/monogram/monogramCircularWithoutBg.png"),
  heading = "SAVE THE DATE",
  label = "Scratch to reveal",
  onReveal,
  forceRevealed = false,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const baseCanvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const isPointerDown = useRef(false);
  const lastPointRef = useRef(null);
  const debrisIdRef = useRef(0);
  const hasRevealedRef = useRef(false);
  const hasScratchedRef = useRef(false);
  const isVisibleRef = useRef(false);
  const animFrameRef = useRef(null);
  const [revealed, setRevealed] = useState(false);
  const [debris, setDebris] = useState([]);
  const logoImgRef = useRef(null);
  const onRevealRef = useRef(onReveal);
  onRevealRef.current = onReveal;

  const layoutRef = useRef({
    width: 0,
    height: 0,
    headingY: 0,
    subtitleY: 0,
    headingSize: 17,
    labelSize: 17,
    textWidth: 160,
  });
  const lastSizeRef = useRef({ w: 0, h: 0 });

  const isActuallyRevealed = revealed || forceRevealed;

  useEffect(() => {
    if (!forceRevealed) {
      hasRevealedRef.current = false;
      hasScratchedRef.current = false;
      setRevealed(false);
    }
  }, [forceRevealed]);

  useEffect(() => {
    if (isActuallyRevealed) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !container) return;

    // Preload logo image
    const img = new Image();
    img.src = logoSrc;
    img.onload = () => {
      logoImgRef.current = img;
      if (!isActuallyRevealed && container) {
        const rect = container.getBoundingClientRect();
        paintBaseOverlay(rect.width, rect.height);
      }
    };

    function paintBaseOverlay(logicalWidth, logicalHeight) {
      if (!logicalWidth || !logicalHeight || !baseCanvasRef.current) return;
      const bCanvas = baseCanvasRef.current;
      const bCtx = bCanvas.getContext("2d");
      const ratio = window.devicePixelRatio || 1;

      bCtx.save();
      bCtx.setTransform(1, 0, 0, 1, 0, 0);
      bCtx.clearRect(0, 0, bCanvas.width, bCanvas.height);
      bCtx.setTransform(ratio, 0, 0, ratio, 0, 0);

      // Base red paper-like gradient.
      const gradient = bCtx.createLinearGradient(0, 0, logicalWidth, logicalHeight);
      gradient.addColorStop(0, "#8f231f");
      gradient.addColorStop(0.5, "#b5322f");
      gradient.addColorStop(1, "#7a1a17");
      bCtx.fillStyle = gradient;
      bCtx.fillRect(0, 0, logicalWidth, logicalHeight);

      // Fine diagonal fiber lines, like textured paper.
      bCtx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      bCtx.lineWidth = 1;
      for (let x = -logicalHeight; x < logicalWidth; x += 5) {
        bCtx.beginPath();
        bCtx.moveTo(x, 0);
        bCtx.lineTo(x + logicalHeight, logicalHeight);
        bCtx.stroke();
      }

      // Random speckles for authentic paper grain.
      const speckleCount = Math.floor((logicalWidth * logicalHeight) / 40);
      for (let i = 0; i < speckleCount; i++) {
        const x = Math.random() * logicalWidth;
        const y = Math.random() * logicalHeight;
        bCtx.fillStyle = Math.random() > 0.5 ? "rgba(255,235,225,0.18)" : "rgba(40,10,8,0.15)";
        bCtx.fillRect(x, y, 1.3, 1.3);
      }

      // Delicate gold inner border frame
      bCtx.strokeStyle = "rgba(216, 178, 126, 0.35)";
      bCtx.lineWidth = 1;
      bCtx.strokeRect(8, 8, logicalWidth - 16, logicalHeight - 16);

      const isCompact = logicalWidth < 380;
      const targetLogoSize = isCompact ? 68 : 74;
      const headingSize = 17;
      const labelSize = 17;
      const spacing = isCompact ? 13 : 15;

      const logoX = (logicalWidth - targetLogoSize) / 2;
      const totalBlockHeight = targetLogoSize + spacing + headingSize + (labelSize * 1.3);
      const startY = (logicalHeight - totalBlockHeight) / 2;
      const logoY = startY;

      // Draw Initials Monogram Logo in center of scratch card
      if (logoImgRef.current && logoImgRef.current.complete && logoImgRef.current.naturalWidth > 0) {
        bCtx.save();
        bCtx.shadowColor = "rgba(0, 0, 0, 0.28)";
        bCtx.shadowBlur = 6;
        bCtx.drawImage(logoImgRef.current, logoX, logoY, targetLogoSize, targetLogoSize);
        bCtx.restore();
      }

      // Heading: "SAVE THE DATE" (base warm ivory text)
      bCtx.fillStyle = "#faf1ea";
      bCtx.textAlign = "center";
      bCtx.textBaseline = "middle";
      if ("letterSpacing" in bCtx) {
        bCtx.letterSpacing = "0.14em";
      }
      bCtx.font = `600 ${headingSize}px "Playfair Display", Georgia, serif`;
      const headingY = logoY + targetLogoSize + spacing + headingSize / 2;
      bCtx.fillText(heading, logicalWidth / 2, headingY);

      const textWidth = bCtx.measureText(heading).width || 160;

      // Subtitle: "Scratch to reveal"
      bCtx.fillStyle = "rgba(250, 241, 234, 0.85)";
      if ("letterSpacing" in bCtx) {
        bCtx.letterSpacing = "0.04em";
      }
      bCtx.font = `italic 400 ${labelSize}px "Cormorant Garamond", Georgia, serif`;
      const subtitleY = headingY + headingSize / 2 + labelSize / 2 + 7;
      bCtx.fillText(label, logicalWidth / 2, subtitleY);
      if ("letterSpacing" in bCtx) {
        bCtx.letterSpacing = "0px";
      }

      bCtx.restore();

      layoutRef.current = {
        width: logicalWidth,
        height: logicalHeight,
        headingY,
        subtitleY,
        headingSize,
        labelSize,
        textWidth,
      };
    }

    function renderFrame(timestamp) {
      if (hasRevealedRef.current || !canvasRef.current || !baseCanvasRef.current) return;
      const canvasEl = canvasRef.current;
      const ctx = canvasEl.getContext("2d");
      const {
        width: logicalWidth,
        height: logicalHeight,
        headingY,
        headingSize,
        textWidth,
      } = layoutRef.current;

      if (!logicalWidth || !logicalHeight) {
        animFrameRef.current = requestAnimationFrame(renderFrame);
        return;
      }

      const ratio = window.devicePixelRatio || 1;
      ctx.save();
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, logicalWidth, logicalHeight);

      // Draw base paper overlay
      ctx.drawImage(baseCanvasRef.current, 0, 0, logicalWidth, logicalHeight);

      // Glass shine animation cycle:
      // Reduced glare speed: 2.6s slow, graceful sweep across "SAVE THE DATE", 2.6s pause
      const CYCLE = 5200;
      const SWEEP = 2600;
      const elapsed = timestamp ? timestamp % CYCLE : 0;
      const isSweeping = elapsed < SWEEP;

      if (isSweeping) {
        const progress = elapsed / SWEEP;
        const eased = easeInOutCubic(progress);

        const cx = logicalWidth / 2;
        const startX = cx - textWidth / 2 - 80;
        const endX = cx + textWidth / 2 + 80;
        const shineX = startX + (endX - startX) * eased;

        // 1. Diagonal glass sheen reflection sweeping across the card body
        const cardShine = ctx.createLinearGradient(
          shineX - 55,
          headingY - 30,
          shineX + 55,
          headingY + 30
        );
        cardShine.addColorStop(0, "rgba(255, 255, 255, 0)");
        cardShine.addColorStop(0.3, "rgba(255, 255, 255, 0.03)");
        cardShine.addColorStop(0.5, "rgba(255, 255, 255, 0.12)");
        cardShine.addColorStop(0.7, "rgba(255, 255, 255, 0.03)");
        cardShine.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = cardShine;
        ctx.fillRect(8, 8, logicalWidth - 16, logicalHeight - 16);

        // 2. Brilliant glass shine sweep on "SAVE THE DATE" text
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if ("letterSpacing" in ctx) {
          ctx.letterSpacing = "0.14em";
        }
        ctx.font = `600 ${headingSize}px "Playfair Display", Georgia, serif`;

        const textShine = ctx.createLinearGradient(
          shineX - 45,
          headingY - 12,
          shineX + 45,
          headingY + 12
        );
        textShine.addColorStop(0, "rgba(255, 255, 255, 0)");
        textShine.addColorStop(0.2, "rgba(255, 255, 255, 0.2)");
        textShine.addColorStop(0.45, "rgba(255, 255, 255, 0.95)");
        textShine.addColorStop(0.5, "rgba(255, 245, 220, 1.0)");
        textShine.addColorStop(0.55, "rgba(255, 255, 255, 0.95)");
        textShine.addColorStop(0.8, "rgba(255, 255, 255, 0.2)");
        textShine.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.fillStyle = textShine;
        ctx.shadowColor = "rgba(255, 235, 190, 0.85)";
        ctx.shadowBlur = 10;
        ctx.fillText(heading, cx, headingY);
        ctx.restore();
      }

      // Punch out scratched strokes using mask
      if (hasScratchedRef.current && maskCanvasRef.current) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.drawImage(maskCanvasRef.current, 0, 0, logicalWidth, logicalHeight);
        ctx.globalCompositeOperation = "source-over";
      }

      ctx.restore();

      if (isVisibleRef.current && !hasRevealedRef.current) {
        animFrameRef.current = requestAnimationFrame(renderFrame);
      }
    }

    function resize() {
      const rect = container.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const w = Math.round(rect.width * ratio);
      const h = Math.round(rect.height * ratio);
      if (!w || !h) return;
      if (lastSizeRef.current.w === w && lastSizeRef.current.h === h) return;
      lastSizeRef.current = { w, h };

      canvas.width = w;
      canvas.height = h;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      if (!baseCanvasRef.current) {
        baseCanvasRef.current = document.createElement("canvas");
      }
      baseCanvasRef.current.width = w;
      baseCanvasRef.current.height = h;

      if (!maskCanvasRef.current) {
        maskCanvasRef.current = document.createElement("canvas");
        maskCanvasRef.current.width = w;
        maskCanvasRef.current.height = h;
      } else if (!hasScratchedRef.current) {
        maskCanvasRef.current.width = w;
        maskCanvasRef.current.height = h;
      } else {
        const temp = document.createElement("canvas");
        temp.width = maskCanvasRef.current.width;
        temp.height = maskCanvasRef.current.height;
        const tempCtx = temp.getContext("2d");
        if (tempCtx) {
          tempCtx.drawImage(maskCanvasRef.current, 0, 0);
          maskCanvasRef.current.width = w;
          maskCanvasRef.current.height = h;
          const mCtx = maskCanvasRef.current.getContext("2d");
          if (mCtx) {
            mCtx.drawImage(temp, 0, 0, w, h);
          }
        }
      }

      paintBaseOverlay(rect.width, rect.height);
      renderFrame(performance.now());
    }

    if (document.fonts) {
      document.fonts.ready.then(() => {
        if (!hasRevealedRef.current && container) {
          const rect = container.getBoundingClientRect();
          paintBaseOverlay(rect.width, rect.height);
        }
      });
    }

    function getPoint(event) {
      const rect = canvas.getBoundingClientRect();
      const source = event.touches ? event.touches[0] : event;
      return { x: source.clientX - rect.left, y: source.clientY - rect.top };
    }

    function scratchSegment(x1, y1, x2, y2) {
      if (!maskCanvasRef.current) return;
      hasScratchedRef.current = true;
      const mCanvas = maskCanvasRef.current;
      const mCtx = mCanvas.getContext("2d");
      const ratio = window.devicePixelRatio || 1;

      mCtx.save();
      mCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
      mCtx.lineCap = "round";
      mCtx.lineJoin = "round";
      mCtx.lineWidth = BRUSH_RADIUS * 2;
      mCtx.strokeStyle = "#ffffff";
      mCtx.fillStyle = "#ffffff";
      mCtx.beginPath();
      mCtx.moveTo(x1, y1);
      mCtx.lineTo(x2, y2);
      mCtx.stroke();
      mCtx.beginPath();
      mCtx.arc(x2, y2, BRUSH_RADIUS, 0, Math.PI * 2);
      mCtx.fill();
      mCtx.restore();
    }

    function spawnDebris(x, y) {
      if (Math.random() > 0.45) return; // throttle so it doesn't flood the DOM
      const id = debrisIdRef.current++;
      const piece = {
        id,
        x,
        y,
        dx: (Math.random() - 0.5) * 50,
        rotation: (Math.random() - 0.5) * 220,
        size: 3 + Math.random() * 5,
        color: DEBRIS_COLORS[Math.floor(Math.random() * DEBRIS_COLORS.length)],
      };
      setDebris((current) => [...current, piece]);
      setTimeout(() => {
        setDebris((current) => current.filter((p) => p.id !== id));
      }, 900);
    }

    function measureCleared() {
      if (!maskCanvasRef.current || !container) return 0;
      const rect = container.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const w = Math.round(rect.width * ratio);
      const h = Math.round(rect.height * ratio);
      if (!w || !h) return 0;
      const mCtx = maskCanvasRef.current.getContext("2d");
      const pixels = mCtx.getImageData(0, 0, w, h).data;
      let cleared = 0;
      let sampled = 0;
      for (let i = 3; i < pixels.length; i += 4 * 16) {
        sampled += 1;
        if (pixels[i] > 128) cleared += 1;
      }
      return sampled ? cleared / sampled : 0;
    }

    function handleMove(event) {
      if (!isPointerDown.current) return;
      if (event.touches) event.preventDefault();
      const { x, y } = getPoint(event);
      const last = lastPointRef.current || { x, y };
      scratchSegment(last.x, last.y, x, y);
      lastPointRef.current = { x, y };
      spawnDebris(x, y);

      if (measureCleared() > REVEAL_THRESHOLD && !hasRevealedRef.current) {
        hasRevealedRef.current = true;
        setRevealed(true);
        onRevealRef.current?.();
      }
    }

    function handleDown(event) {
      isPointerDown.current = true;
      const { x, y } = getPoint(event);
      lastPointRef.current = { x, y };
      scratchSegment(x, y, x, y);
      spawnDebris(x, y);
    }

    function handleUp() {
      isPointerDown.current = false;
      lastPointRef.current = null;
    }

    resize();
    window.addEventListener("resize", resize);

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        isVisibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          if (!animFrameRef.current) {
            animFrameRef.current = requestAnimationFrame(renderFrame);
          }
        } else {
          if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = null;
          }
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(container);

    canvas.addEventListener("mousedown", handleDown);
    canvas.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    canvas.addEventListener("touchstart", handleDown, { passive: true });
    canvas.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleUp);

    return () => {
      observer.disconnect();
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousedown", handleDown);
      canvas.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      canvas.removeEventListener("touchstart", handleDown);
      canvas.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [isActuallyRevealed, logoSrc, heading, label]);

  return (
    <div
      className={`scratch-reveal ${isActuallyRevealed ? "scratch-reveal--revealed" : ""}`}
      ref={containerRef}
    >
      <div className="scratch-reveal__content">{children}</div>
      {!isActuallyRevealed && (
        <canvas className="scratch-reveal__canvas" ref={canvasRef} aria-hidden="true" />
      )}
      {debris.map((p) => (
        <span
          key={p.id}
          className="scratch-debris"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            background: p.color,
            "--debris-dx": `${p.dx}px`,
            "--debris-rotation": `${p.rotation}deg`,
          }}
        />
      ))}
    </div>
  );
}
