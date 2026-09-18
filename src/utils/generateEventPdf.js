import { jsPDF } from "jspdf";
import QRCode from "qrcode";

/**
 * Calculates a new time string exactly 1 hour after the provided time string.
 * Supports formats like "12:30 PM", "7:00 PM", "1:00 PM", "5:00 PM", etc.
 */
export function addOneHour(timeStr) {
  if (!timeStr) return "";
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return timeStr;

  let hour = parseInt(match[1], 10);
  const minute = match[2];
  let meridiem = match[3].toUpperCase();

  hour += 1;
  if (hour === 12) {
    meridiem = meridiem === "AM" ? "PM" : "AM";
  } else if (hour > 12) {
    hour = 1;
  }

  return `${hour}:${minute} ${meridiem}`;
}

/**
 * Transforms an array of events by expanding any event that includes a meal
 * into its primary ceremony plus a separate, subsequent food event box (Lunch, Gala Lunch, or Dinner)
 * set to begin exactly 1 hour after the ceremony.
 * Food events do not carry redundant detail text.
 */
export function getItineraryEvents(events = []) {
  const result = [];

  events.forEach((event) => {
    // If event is already an expanded food event, preserve it directly
    if (event.isFoodEvent) {
      result.push(event);
      return;
    }

    // Include the main ceremony event (omitting inline meal text since meal now has its own box)
    const mainEvent = { ...event };
    delete mainEvent.meal;
    result.push(mainEvent);

    // If event has meal information, create a separate food event 1 hour later
    if (event.meal) {
      let foodName = "Lunch";

      if (/gala lunch/i.test(event.meal)) {
        foodName = "Gala Lunch";
      } else if (/dinner/i.test(event.meal)) {
        foodName = "Dinner";
      } else if (/lunch/i.test(event.meal)) {
        foodName = "Lunch";
      }

      const foodTime = addOneHour(event.time);

      result.push({
        name: foodName,
        day: event.day,
        date: event.date,
        time: foodTime,
        description: "",
        isFoodEvent: true,
      });
    }
  });

  return result;
}

export function getWhatsAppShareText(couple, rawEvents, venue) {
  const events = getItineraryEvents(rawEvents);
  const p1 = (couple?.partner1 || "Bride").replace(/oratna/i, "");
  const p2 = (couple?.partner2 || "Groom").replace(/oratna/i, "");

  let text = `*The wedding of ${p1} & ${p2}*\n`;
  text += `*December 5-6, 2026*\n\n`;
  text += `✨ *Events & Itinerary*\n\n`;

  events.forEach((ev) => {
    text += `*${ev.name.toUpperCase()}*\n`;
    const dayStr = ev.day ? `${ev.day}, ` : "";
    text += `${dayStr}${ev.date} · ${ev.time}\n`;
    if (ev.description) text += `• ${ev.description}\n`;
    if (ev.attire) text += `• Attire: ${ev.attire}\n`;
    text += `\n`;
  });

  if (venue) {
    text += `*Venue:* ${venue.name}\n`;
    if (venue.address) {
      text += `${venue.address}\n\n`;
    }
    if (venue.phone) {
      text += `*Helpdesk:* ${venue.phone}\n\n`;
    }
    if (venue.qrUrl) {
      text += `*Google Search Resort:*\n${venue.qrUrl}\n`;
    }
    if (venue.directionsUrl) {
      text += `*Maps Direction:*\n${venue.directionsUrl}\n`;
    }
  }

  return text;
}

export async function createEventPdfDocument({ events: rawEvents, couple, venue }) {
  const events = getItineraryEvents(rawEvents);

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

  // Corner decorative circles (consistent with website jewel dots)
  function drawCircle(cx, cy, r = 1.35) {
    doc.setFillColor(176, 137, 104);
    doc.circle(cx, cy, r, "F");
  }
  drawCircle(10, 10, 1.35);
  drawCircle(pageWidth - 10, 10, 1.35);
  drawCircle(10, pageHeight - 10, 1.35);
  drawCircle(pageWidth - 10, pageHeight - 10, 1.35);

  const isGroomSide = events.length > 9;

  // Header Section with royal typography
  let y = isGroomSide ? 17.5 : 19.0;

  // Line 1: The wedding of
  doc.setTextColor(176, 137, 104);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(isGroomSide ? 9.0 : 9.5);
  doc.text("THE WEDDING OF", pageWidth / 2, y, { align: "center" });

  y += isGroomSide ? 6.8 : 7.5;

  // Line 2: Couple Names
  const p1 = (couple?.partner1 || "Bride").replace(/oratna/i, "");
  const p2 = (couple?.partner2 || "Groom").replace(/oratna/i, "");
  const coupleHeading = `${p1} & ${p2}`;

  doc.setTextColor(143, 51, 80); // Burgundy
  doc.setFont("times", "bold");
  doc.setFontSize(isGroomSide ? 23.0 : 25.0);
  doc.text(coupleHeading, pageWidth / 2, y, { align: "center" });

  // Line 3: (space) + Line 4: WEDDING CELEBRATIONS & ITINERARY
  y += isGroomSide ? 7.2 : 7.8;

  doc.setTextColor(176, 137, 104);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(isGroomSide ? 9.0 : 9.5);
  doc.text("WEDDING CELEBRATIONS & ITINERARY", pageWidth / 2, y, { align: "center" });

  y += isGroomSide ? 5.0 : 5.5;

  // Tagline / Date / Location
  doc.setTextColor(111, 106, 99);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(isGroomSide ? 9.0 : 9.5);
  doc.text(
    "December 5 – 6, 2026  ·  Winsome Resort & Spa, Jim Corbett",
    pageWidth / 2,
    y,
    { align: "center" }
  );

  y += isGroomSide ? 5.5 : 6.0;

  // Ornamental Divider Line with Center Circle
  doc.setDrawColor(176, 137, 104);
  doc.setLineWidth(0.4);
  doc.line(pageWidth / 2 - 28, y, pageWidth / 2 - 3, y);
  doc.line(pageWidth / 2 + 3, y, pageWidth / 2 + 28, y);
  drawCircle(pageWidth / 2, y, 1.25);

  y += isGroomSide ? 7.8 : 9.0;

  // Events Iteration
  const boxX = margin + 2;
  const boxWidth = contentWidth - 4;
  const labelX = boxX + 3;
  const valueX = boxX + 22;

  // Strictly uniform spacing between end of an event and start of the next event
  const gapBetweenEvents = isGroomSide ? 8.2 : 9.6;

  events.forEach((event, idx) => {
    const eventStartY = y;

    // Event Name (Left) - Enhanced typography
    doc.setTextColor(143, 51, 80); // Burgundy
    doc.setFont("times", "bold");
    doc.setFontSize(isGroomSide ? 13.5 : 14.5);
    doc.text(event.name, boxX, eventStartY);

    // Day + Date + Time (Right) - Enhanced typography
    const dayStr = event.day ? `${event.day}, ` : "";
    const timeBadge = `${dayStr}${event.date}  ·  ${event.time}`;
    doc.setTextColor(176, 137, 104); // Gold
    doc.setFont("helvetica", "bold");
    doc.setFontSize(isGroomSide ? 9.5 : 10.5);
    doc.text(timeBadge, boxX + boxWidth, eventStartY, { align: "right" });

    let currentY = eventStartY + 2.4;

    // Dotted separator line
    doc.setDrawColor(215, 196, 175);
    doc.setLineWidth(0.3);
    doc.setLineDashPattern([1.2, 1.2], 0);
    doc.line(boxX, currentY, boxX + boxWidth, currentY);
    doc.setLineDashPattern([], 0); // reset dash

    // Details block (Ceremonies only)
    const hasDetails = Boolean(event.description);
    if (hasDetails) {
      currentY += 4.2;
      doc.setTextColor(143, 51, 80);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text("•  Details:", labelX, currentY);

      doc.setTextColor(55, 50, 48);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);

      const descLines = doc.splitTextToSize(event.description, boxWidth - 24);
      doc.text(descLines, valueX, currentY);
      currentY += descLines.length * 4.0;
    }

    // Attire block (Ceremonies only)
    if (event.attire) {
      currentY += hasDetails ? 0.4 : 4.2;
      doc.setTextColor(143, 51, 80);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text("•  Attire:", labelX, currentY);

      doc.setTextColor(55, 50, 48);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.text(event.attire, valueX, currentY);
      currentY += 4.0;
    }

    const eventEndY = currentY;

    // Exactly uniform space from the end of this event to the start of the next event
    if (idx < events.length - 1) {
      y = eventEndY + gapBetweenEvents;
    } else {
      y = eventEndY;
    }
  });

  // Footer Section - Center Aligned
  const dividerY = isGroomSide ? 236 : 233;
  doc.setDrawColor(176, 137, 104);
  doc.setLineWidth(0.4);
  doc.line(pageWidth / 2 - 35, dividerY, pageWidth / 2 - 3.5, dividerY);
  doc.line(pageWidth / 2 + 3.5, dividerY, pageWidth / 2 + 35, dividerY);
  drawCircle(pageWidth / 2, dividerY, 1.25);

  const qrUrl = venue?.qrUrl || "https://share.google/xZAuCAlAAjEHdfEsY";
  const directionsUrl = venue?.directionsUrl || "https://maps.google.com/?daddr=Winsome+Resort+Jim+Corbett";

  // Center Aligned Venue Title
  const venueTitle = `VENUE: ${(venue?.name || "Winsome Resort & Spa").toUpperCase()}, JIM CORBETT`;
  doc.setTextColor(143, 51, 80);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.0);
  doc.text(venueTitle, pageWidth / 2, dividerY + 6.2, { align: "center" });

  // Center Aligned Venue Address
  doc.setTextColor(111, 106, 99);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.8);
  const cleanAddress = (venue?.address || "")
    .replace(/^Vill\.\s*Nandpur,\s*Choi,\s*Gabua\s*\(Near\s*Dabka\s*River,\s*Jim\s*Corbett\s*National\s*Park\),\s*/i, "Village Choi, Jim Corbett National Park, ")
    .replace(/Ramnagar\s*–\s*Nainital\s*Road,\s*Khempur,\s*/i, "Ramnagar, ");
  const displayAddress = cleanAddress || "Village Choi, Jim Corbett National Park, Ramnagar, Uttarakhand 244715";
  doc.text(displayAddress, pageWidth / 2, dividerY + 11.2, { align: "center" });

  // Center Aligned 2 Interactive Clickable Buttons
  const btnY = dividerY + 15.2;
  const btnH = 6.8;
  const btn1W = 43;
  const btn2W = 32;
  const btnGap = 4.5;
  const totalBtnsW = btn1W + btnGap + btn2W;
  const btnsStartX = (pageWidth - totalBtnsW) / 2;

  // Button 1: Google Search Resort
  doc.setFillColor(143, 51, 80); // Burgundy
  doc.roundedRect(btnsStartX, btnY, btn1W, btnH, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("Google Search Resort", btnsStartX + btn1W / 2, btnY + 4.4, { align: "center" });
  doc.link(btnsStartX, btnY, btn1W, btnH, { url: qrUrl });

  // Button 2: Maps Direction
  const btn2X = btnsStartX + btn1W + btnGap;
  doc.setFillColor(143, 51, 80); // Burgundy
  doc.roundedRect(btn2X, btnY, btn2W, btnH, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("Maps Direction", btn2X + btn2W / 2, btnY + 4.4, { align: "center" });
  doc.link(btn2X, btnY, btn2W, btnH, { url: directionsUrl });

  // Center Aligned Warm Regards Closing Line
  doc.setTextColor(143, 51, 80);
  doc.setFont("times", "italic");
  doc.setFontSize(9.8);
  doc.text(
    "With warmest regards & best compliments · We look forward to celebrating with you!",
    pageWidth / 2,
    dividerY + 27.5,
    { align: "center" }
  );

  return doc;
}

export async function downloadEventPdf({ events, couple, venue }) {
  const doc = await createEventPdfDocument({ events, couple, venue });
  const p1 = (couple?.partner1 || "Bride").replace(/oratna/i, "");
  const p2 = (couple?.partner2 || "Groom").replace(/oratna/i, "");
  const filename = `The_Wedding_Events_${p1}_${p2}.pdf`;
  doc.save(filename);
}

export async function shareEventPdf({ events, couple, venue }) {
  const doc = await createEventPdfDocument({ events, couple, venue });
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
