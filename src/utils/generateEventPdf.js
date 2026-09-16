import { jsPDF } from "jspdf";

export function getWhatsAppShareText(couple, events, venue) {
  const p1 = (couple?.partner1 || "Bride").replace(/oratna/i, "");
  const p2 = (couple?.partner2 || "Groom").replace(/oratna/i, "");

  let text = `*The wedding of ${p1} & ${p2}*\n`;
  text += `December 5-6, 2026\n\n`;
  text += `Events details:\n\n`;

  events.forEach((ev) => {
    text += `✨ *${ev.name.toUpperCase()}*\n`;
    const dayStr = ev.day ? `${ev.day}, ` : "";
    text += `📅 ${dayStr}${ev.date} · ${ev.time}\n`;
    if (ev.description) text += `• ${ev.description}\n`;
    if (ev.meal) text += `• ${ev.meal}\n`;
    if (ev.attire) text += `• Attire: ${ev.attire}\n`;
    text += `\n`;
  });

  if (venue) {
    text += `📍 *Venue:* ${venue.name}\n`;
    text += `${venue.address}\n`;
    if (venue.directionsUrl || venue.qrUrl) {
      text += `🗺️ Location Map: ${venue.directionsUrl || venue.qrUrl}\n`;
    }
  }

  return text;
}

export function createEventPdfDocument({ events, couple, venue }) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  // Background - Soft Ivory (#faf7f2)
  doc.setFillColor(250, 247, 242);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Outer Border - Warm Gold (#b08968)
  doc.setDrawColor(176, 137, 104);
  doc.setLineWidth(0.7);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

  // Inner Border - Finer Gold
  doc.setLineWidth(0.3);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // Corner decorative diamonds
  function drawDiamond(cx, cy, size = 1.6) {
    doc.setFillColor(176, 137, 104);
    doc.lines(
      [
        [size, size],
        [-size, size],
        [-size, -size],
        [size, -size],
      ],
      cx,
      cy - size,
      [1, 1],
      "F"
    );
  }
  drawDiamond(10, 10);
  drawDiamond(pageWidth - 10, 10);
  drawDiamond(10, pageHeight - 10);
  drawDiamond(pageWidth - 10, pageHeight - 10);

  // Header Section with increased font size & line spacing
  let y = 22;

  // Subtitle
  doc.setTextColor(176, 137, 104);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("WEDDING CELEBRATIONS & ITINERARY", pageWidth / 2, y, { align: "center" });

  y += 8.5;

  // Couple Names
  const p1 = (couple?.partner1 || "Bride").replace(/oratna/i, "");
  const p2 = (couple?.partner2 || "Groom").replace(/oratna/i, "");
  const coupleHeading = `${p1} & ${p2}`;

  doc.setTextColor(143, 51, 80); // Burgundy
  doc.setFont("times", "bold");
  doc.setFontSize(26);
  doc.text(coupleHeading, pageWidth / 2, y, { align: "center" });

  y += 8.5;

  // Tagline / Date / Location
  doc.setTextColor(111, 106, 99);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.text(
    "December 5 – 6, 2026  ·  Winsome Resort & Spa, Jim Corbett",
    pageWidth / 2,
    y,
    { align: "center" }
  );

  y += 7.5;

  // Ornamental Divider Line with Center Diamond
  doc.setDrawColor(176, 137, 104);
  doc.setLineWidth(0.4);
  doc.line(pageWidth / 2 - 28, y, pageWidth / 2 - 3.5, y);
  doc.line(pageWidth / 2 + 3.5, y, pageWidth / 2 + 28, y);
  drawDiamond(pageWidth / 2, y, 1.3);

  y += 11;

  // Events Iteration
  const boxX = margin + 2;
  const boxWidth = contentWidth - 4;

  events.forEach((event) => {
    // Event Name (Left)
    doc.setTextColor(143, 51, 80); // Burgundy
    doc.setFont("times", "bold");
    doc.setFontSize(14.5);
    doc.text(event.name, boxX, y);

    // Day + Date + Time (Right)
    const dayStr = event.day ? `${event.day}, ` : "";
    const timeBadge = `${dayStr}${event.date}  ·  ${event.time}`;
    doc.setTextColor(176, 137, 104); // Gold
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text(timeBadge, boxX + boxWidth, y, { align: "right" });

    y += 2.5;

    // Dotted separator line
    doc.setDrawColor(215, 196, 175);
    doc.setLineWidth(0.3);
    doc.setLineDashPattern([1.2, 1.2], 0);
    doc.line(boxX, y, boxX + boxWidth, y);
    doc.setLineDashPattern([], 0); // reset dash

    y += 5.0;

    // Details bullet
    if (event.description) {
      doc.setTextColor(143, 51, 80);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("•  Details:", boxX + 3, y);

      doc.setTextColor(46, 43, 40);
      doc.setFont("times", "normal");
      doc.setFontSize(10);
      const descLines = doc.splitTextToSize(event.description, boxWidth - 28);
      doc.text(descLines, boxX + 24, y);
      y += descLines.length * 4.4;
    }

    // Food bullet
    if (event.meal) {
      doc.setTextColor(143, 51, 80);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("•  Food:", boxX + 3, y);

      doc.setTextColor(176, 137, 104);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(event.meal, boxX + 24, y);
      y += 4.8;
    }

    // Attire bullet
    if (event.attire) {
      doc.setTextColor(143, 51, 80);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("•  Attire:", boxX + 3, y);

      doc.setTextColor(90, 85, 80);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(event.attire, boxX + 24, y);
      y += 4.8;
    }

    y += 5.5; // spacing between events
  });

  // Footer Section with increased line spacing & font size
  const footerY = pageHeight - 28;
  doc.setDrawColor(176, 137, 104);
  doc.setLineWidth(0.4);
  doc.line(pageWidth / 2 - 35, footerY, pageWidth / 2 - 4, footerY);
  doc.line(pageWidth / 2 + 4, footerY, pageWidth / 2 + 35, footerY);
  drawDiamond(pageWidth / 2, footerY, 1.3);

  doc.setTextColor(111, 106, 99);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(
    `Venue: ${venue?.name || "Winsome Resort & Spa"}  ·  ${venue?.address || ""}`,
    pageWidth / 2,
    footerY + 6.5,
    { align: "center", maxWidth: 170 }
  );

  doc.setTextColor(143, 51, 80);
  doc.setFont("times", "italic");
  doc.setFontSize(10.5);
  doc.text(
    "With warmest regards & best compliments · We look forward to celebrating with you!",
    pageWidth / 2,
    footerY + 14,
    { align: "center" }
  );

  return doc;
}

export function downloadEventPdf({ events, couple, venue }) {
  const doc = createEventPdfDocument({ events, couple, venue });
  const p1 = (couple?.partner1 || "Bride").replace(/oratna/i, "");
  const p2 = (couple?.partner2 || "Groom").replace(/oratna/i, "");
  const filename = `The_Wedding_Events_${p1}_${p2}.pdf`;
  doc.save(filename);
}

export async function shareEventPdf({ events, couple, venue }) {
  const doc = createEventPdfDocument({ events, couple, venue });
  const p1 = (couple?.partner1 || "Bride").replace(/oratna/i, "");
  const p2 = (couple?.partner2 || "Groom").replace(/oratna/i, "");
  const filename = `The_Wedding_Events_${p1}_${p2}.pdf`;
  const pdfBlob = doc.output("blob");
  const file = new File([pdfBlob], filename, { type: "application/pdf" });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: `The Wedding of ${p1} & ${p2} - Event Details`,
        text: `Event Schedule for the wedding of ${p1} & ${p2}`,
      });
      return { success: true, method: "share" };
    } catch (err) {
      if (err.name !== "AbortError") {
        doc.save(filename);
        return { success: true, method: "download", fallback: true };
      }
      return { success: false, aborted: true };
    }
  } else {
    // Desktop or unsupported browser
    doc.save(filename);
    return { success: true, method: "download", fallback: true };
  }
}
