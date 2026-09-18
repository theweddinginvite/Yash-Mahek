import { jsPDF } from "jspdf";
import QRCode from "qrcode";

// Helper to force download without opening a new tab and with the correct filename (fixes Firefox mobile)
function forceDownloadPdf(doc, filename) {
  const isFirefoxMobile = /Android/i.test(navigator.userAgent) && /Firefox/i.test(navigator.userAgent);
  if (isFirefoxMobile) {
    const dataStr = doc.output("datauristring");
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 250);
  }
}


export function getWhatsAppVenueShareText(couple, venue) {
  const p1 = (couple?.partner1 || "Bride").replace(/oratna/i, "");
  const p2 = (couple?.partner2 || "Groom").replace(/oratna/i, "");

  let text = `*The wedding of ${p1} & ${p2}*\n`;
  text += `*December 5-6, 2026*\n\n`;
  text += `✨ *Location & Travel Guide*\n\n`;

  if (venue) {
    text += `*Venue:* ${venue.name}\n`;
    if (venue.address) {
      text += `Address: ${venue.address}\n\n`;
    }
    if (venue.phone) {
      text += `Helpdesk: ${venue.phone}\n\n`;
    }
    if (venue.qrUrl) {
      text += `*Google Search Resort:* ${venue.qrUrl}\n\n`;
    }
    if (venue.directionsUrl) {
      text += `*Maps Direction:* ${venue.directionsUrl}\n\n`;
    }

    if (venue.howToReach && venue.howToReach.length > 0) {
      text += `*TRAVEL OPTIONS & DIRECTIONS:*\n\n`;
      venue.howToReach.forEach((item) => {
        text += `*${item.mode.toUpperCase()}*\n`;
        if (item.subtitle) {
          text += `*${item.subtitle}*\n\n`;
        } else {
          text += `\n`;
        }
        if (item.routes && item.routes.length > 0) {
          item.routes.forEach((route) => {
            text += `*${route.name}* · ${route.distance}\n`;
            if (route.details && route.details.length > 0) {
              route.details.forEach((d) => {
                const prefix = d.label ? `${d.label} ` : "";
                text += `${prefix}${d.text}\n`;
              });
            }
            text += `\n`;
          });
        }
      });
    }
  }

  return text.trim();
}

export async function createVenuePdfDocument({ couple, venue }) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  const boxX = margin + 2;
  const boxWidth = contentWidth - 4;

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

  // Corner decorative circles
  function drawCircle(cx, cy, r = 1.35) {
    doc.setFillColor(176, 137, 104);
    doc.circle(cx, cy, r, "F");
  }
  drawCircle(10, 10, 1.35);
  drawCircle(pageWidth - 10, 10, 1.35);
  drawCircle(10, pageHeight - 10, 1.35);
  drawCircle(pageWidth - 10, pageHeight - 10, 1.35);

  // Ornamental Divider Helper
  function drawOrnamentalDivider(yPos, halfWidth = 32) {
    doc.setDrawColor(176, 137, 104);
    doc.setLineWidth(0.4);
    doc.line(pageWidth / 2 - halfWidth, yPos, pageWidth / 2 - 3.2, yPos);
    doc.line(pageWidth / 2 + 3.2, yPos, pageWidth / 2 + halfWidth, yPos);
    drawCircle(pageWidth / 2, yPos, 1.25);
  }

  // Header Section
  let y = 19.0;

  // Line 1: The wedding of
  doc.setTextColor(176, 137, 104);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("THE WEDDING OF", pageWidth / 2, y, { align: "center" });

  y += 7.5;

  // Line 2: Couple Names
  const p1 = (couple?.partner1 || "Bride").replace(/oratna/i, "");
  const p2 = (couple?.partner2 || "Groom").replace(/oratna/i, "");
  const coupleHeading = `${p1} & ${p2}`;

  doc.setTextColor(143, 51, 80); // Burgundy
  doc.setFont("times", "bold");
  doc.setFontSize(25.0);
  doc.text(coupleHeading, pageWidth / 2, y, { align: "center" });

  // Line 3: (space) + Line 4: LOCATION & TRAVEL GUIDE
  y += 7.8;

  doc.setTextColor(176, 137, 104);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("LOCATION & TRAVEL GUIDE", pageWidth / 2, y, { align: "center" });

  y += 5.5;

  doc.setTextColor(111, 106, 99);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(
    "December 5 – 6, 2026  ·  Winsome Resort & Spa, Jim Corbett",
    pageWidth / 2,
    y,
    { align: "center" }
  );

  y += 6.0;
  drawOrnamentalDivider(y, 30);

  y += 8.0;

  // Venue Information Card with QR Code and Clickable Buttons
  const venueCardY = y;
  const qrUrl = venue?.qrUrl || "https://share.google/xZAuCAlAAjEHdfEsY";
  const directionsUrl = venue?.directionsUrl || "https://maps.google.com/?daddr=Winsome+Resort+Jim+Corbett";

  let qrDataUrl = null;
  try {
    qrDataUrl = await QRCode.toDataURL(qrUrl, {
      margin: 1,
      width: 256,
      color: {
        dark: "#2e2b28",
        light: "#ffffff",
      },
    });
  } catch (err) {
    console.error("Failed to generate QR code for Venue PDF:", err);
  }

  const qrSize = 18;
  const qrX = boxX + boxWidth - qrSize - 4;
  const qrY = venueCardY + 6.0;

  // Draw Card Frame
  const venueCardH = 31.0;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(boxX, venueCardY, boxWidth, venueCardH, 2.5, 2.5, "F");
  doc.setDrawColor(215, 196, 175);
  doc.setLineWidth(0.35);
  doc.roundedRect(boxX, venueCardY, boxWidth, venueCardH, 2.5, 2.5, "S");

  // Resort Name
  doc.setTextColor(143, 51, 80);
  doc.setFont("times", "bold");
  doc.setFontSize(14.5);
  doc.text(
    `${(venue?.name || "Winsome Resort & Spa").toUpperCase()}, JIM CORBETT`,
    boxX + 5,
    venueCardY + 6.8
  );

  // Address
  doc.setTextColor(85, 80, 78);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.8);
  const cleanAddr = (venue?.address || "")
    .replace(/^Vill\.\s*Nandpur,\s*Choi,\s*Gabua\s*\(Near\s*Dabka\s*River,\s*Jim\s*Corbett\s*National\s*Park\),\s*/i, "Village Choi, Jim Corbett National Park, ")
    .replace(/Ramnagar\s*–\s*Nainital\s*Road,\s*Khempur,\s*/i, "Ramnagar, ");
  const displayAddr = cleanAddr || "Village Choi, Jim Corbett National Park, Ramnagar, Uttarakhand 244715";
  doc.text(displayAddr, boxX + 5, venueCardY + 11.8);

  // Helpdesk
  if (venue?.phone) {
    doc.setTextColor(143, 51, 80);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.0);
    doc.text("Helpdesk / Contact:", boxX + 5, venueCardY + 17.0);

    const labelW = doc.getTextWidth("Helpdesk / Contact: ");
    doc.setTextColor(176, 137, 104);
    doc.setFont("helvetica", "bold");
    doc.text(venue.phone, boxX + 5 + labelW, venueCardY + 17.0);
  }

  // 2 Clickable Buttons: Google Search Resort & Maps Direction
  const btnY = venueCardY + 20.8;
  const btnH = 6.8;

  // Button 1: Google Search Resort
  const btn1W = 43;
  doc.setFillColor(143, 51, 80); // Burgundy
  doc.roundedRect(boxX + 5, btnY, btn1W, btnH, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("Google Search Resort", boxX + 5 + btn1W / 2, btnY + 4.4, { align: "center" });
  doc.link(boxX + 5, btnY, btn1W, btnH, { url: qrUrl });

  // Button 2: Maps Direction
  const btn2X = boxX + 5 + btn1W + 4;
  const btn2W = 33;
  doc.setFillColor(143, 51, 80); // Burgundy
  doc.roundedRect(btn2X, btnY, btn2W, btnH, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("Maps Direction", btn2X + btn2W / 2, btnY + 4.4, { align: "center" });
  doc.link(btn2X, btnY, btn2W, btnH, { url: directionsUrl });

  // Right Block: QR Code for Google Search
  if (qrDataUrl) {
    doc.setFillColor(255, 255, 255);
    doc.rect(qrX - 1, qrY - 1, qrSize + 2, qrSize + 2, "F");
    doc.setDrawColor(215, 196, 175);
    doc.setLineWidth(0.3);
    doc.rect(qrX - 1, qrY - 1, qrSize + 2, qrSize + 2, "S");
    doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
    doc.link(qrX, qrY, qrSize, qrSize, { url: qrUrl });
  }

  y = venueCardY + venueCardH + 6.0;
  drawOrnamentalDivider(y, 35);

  y += 7.5;

  // Travel Section Header
  doc.setTextColor(143, 51, 80);
  doc.setFont("times", "bold");
  doc.setFontSize(14.0);
  doc.text("TRAVEL & DIRECTIONS", pageWidth / 2, y, { align: "center" });

  y += 6.0;

  // Travel Options List - Upgraded typography matching Event Details PDF
  const howToReach = venue?.howToReach || [];
  const routeGap = 5.8;
  const sectionGap = 9.0;
  const bulletGap = 1.2;

  howToReach.forEach((item, sectionIdx) => {
    // Mode Header
    if (sectionIdx > 0) {
      y += sectionGap;
    }

    doc.setTextColor(143, 51, 80);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.0);
    doc.text(`•  ${item.mode.toUpperCase()}`, boxX, y);

    if (item.subtitle) {
      doc.setTextColor(176, 137, 104);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text(item.subtitle, boxX + boxWidth, y, { align: "right" });
    }

    y += 4.8;

    if (item.routes && item.routes.length > 0) {
      item.routes.forEach((route, routeIdx) => {
        const routeStartY = y;

        // Route / City Name (Left) - Enhanced typography matching Event PDF (13.5pt)
        doc.setTextColor(143, 51, 80);
        doc.setFont("times", "bold");
        doc.setFontSize(13.5);
        doc.text(route.name, boxX, routeStartY);

        // Distance & Time (Right) - Enhanced typography matching Event PDF (10.5pt)
        if (route.distance) {
          doc.setTextColor(176, 137, 104);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10.5);
          doc.text(route.distance, boxX + boxWidth, routeStartY, { align: "right" });
        }

        let curRouteY = routeStartY + 2.4;
        const hasDetails = route.details && route.details.length > 0;

        // Dotted separator line
        doc.setDrawColor(215, 196, 175);
        doc.setLineWidth(0.3);
        doc.setLineDashPattern([1.2, 1.2], 0);
        doc.line(boxX, curRouteY, boxX + boxWidth, curRouteY);
        doc.setLineDashPattern([], 0);

        if (hasDetails) {
          curRouteY += 4.2;

          route.details.forEach((d, dIdx) => {
            if (d.label) {
              doc.setTextColor(143, 51, 80);
              doc.setFont("helvetica", "bold");
              doc.setFontSize(9.5);
              doc.text(d.label, boxX + 3, curRouteY);

              const labelWidth = doc.getTextWidth(d.label);
              const valX = boxX + 3 + labelWidth + 2;

              doc.setTextColor(55, 50, 48);
              doc.setFont("helvetica", "normal");
              doc.setFontSize(9.5);
              const textLines = doc.splitTextToSize(d.text, boxWidth - (valX - boxX));
              doc.text(textLines, valX, curRouteY);
              curRouteY += textLines.length * 4.0;
            } else {
              doc.setTextColor(143, 51, 80);
              doc.setFont("helvetica", "bold");
              doc.setFontSize(9.5);
              doc.text("•", boxX + 3, curRouteY);

              doc.setTextColor(55, 50, 48);
              doc.setFont("helvetica", "normal");
              doc.setFontSize(9.5);
              const textLines = doc.splitTextToSize(d.text, boxWidth - 12);
              doc.text(textLines, boxX + 8, curRouteY);
              curRouteY += textLines.length * 4.0;
            }
            if (dIdx < route.details.length - 1) {
              curRouteY += bulletGap;
            }
          });
          y = curRouteY;
        } else {
          y = curRouteY + 2.0;
        }

        // Space between routes within this section (e.g. between Delhi and Moradabad)
        if (routeIdx < item.routes.length - 1) {
          y += routeGap;
        }
      });
    } else if (item.description) {
      doc.setTextColor(55, 50, 48);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);

      const rawLines = (item.description || "").split("\n");
      rawLines.forEach((line) => {
        if (!line.trim()) {
          y += 2.0;
          return;
        }
        const isBullet = line.trim().startsWith("•");
        if (isBullet) {
          doc.setFont("helvetica", "bold");
          doc.setTextColor(143, 51, 80);
        } else {
          doc.setFont("helvetica", "normal");
          doc.setTextColor(55, 50, 48);
        }
        const indent = isBullet ? boxX + 3 : boxX + 8;
        const wrapped = doc.splitTextToSize(line.trim(), boxWidth - (isBullet ? 6 : 10));
        doc.text(wrapped, indent, y);
        y += wrapped.length * 4.0 + 0.6;
      });
    }
  });

  // Footer Section
  const dividerY = Math.max(y + 4.0, 258);
  drawOrnamentalDivider(dividerY, 35);

  // Assistance notice
  doc.setTextColor(111, 106, 99);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.2);
  doc.text(
    "For any travel queries or directions assistance, feel free to contact the resort helpdesk.",
    pageWidth / 2,
    dividerY + 6.8,
    { align: "center" }
  );

  // Warm regards closing line
  doc.setTextColor(143, 51, 80);
  doc.setFont("times", "italic");
  doc.setFontSize(10.0);
  doc.text(
    "With warmest regards & best compliments · We look forward to celebrating with you!",
    pageWidth / 2,
    dividerY + 14.2,
    { align: "center" }
  );

  return doc;
}

export async function downloadVenuePdf({ couple, venue }) {
  const doc = await createVenuePdfDocument({ couple, venue });
  const p1 = (couple?.partner1 || "Bride").replace(/oratna/i, "");
  const p2 = (couple?.partner2 || "Groom").replace(/oratna/i, "");
  const filename = `Venue_Travel_Guide_${p1}_${p2}.pdf`;
  forceDownloadPdf(doc, filename);
}

export async function shareVenuePdf({ couple, venue }) {
  const doc = await createVenuePdfDocument({ couple, venue });
  const p1 = (couple?.partner1 || "Bride").replace(/oratna/i, "");
  const p2 = (couple?.partner2 || "Groom").replace(/oratna/i, "");
  const filename = `Venue_Travel_Guide_${p1}_${p2}.pdf`;
  const pdfBlob = doc.output("blob");
  const file = new File([pdfBlob], filename, { type: "application/pdf" });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: `The Wedding of ${p1} & ${p2} - Venue & Travel Guide`,
        text: `Venue & Travel Guide for the wedding of ${p1} & ${p2} at ${venue?.name || "Winsome Resort & Spa"}`,
      });
      return { success: true, method: "share" };
    } catch (err) {
      if (err.name !== "AbortError") {
        forceDownloadPdf(doc, filename);
        return { success: true, method: "download", fallback: true };
      }
      return { success: false, aborted: true };
    }
  } else {
    forceDownloadPdf(doc, filename);
    return { success: true, method: "download", fallback: true };
  }
}
