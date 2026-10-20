/**
 * pdfGenerator.js
 * Phase 9 — PDF Generation using PDFKit
 *
 * How it works:
 *   Browser calls GET /api/trips/:id/pdf
 *   Server generates a PDF Buffer from the Trip document
 *   Sets Content-Type: application/pdf + Content-Disposition: attachment
 *   Browser downloads the file automatically
 */

const PDFDocument = require('pdfkit');

const C = {
  bg:      '#0f172a',
  primary: '#818cf8',
  accent:  '#4ade80',
  text:    '#1e293b',
  sub:     '#475569',
  muted:   '#94a3b8',
  warn:    '#f59e0b',
  white:   '#ffffff',
};

function hdr(doc, right) {
  doc.rect(0, 0, doc.page.width, 65).fill(C.bg);
  doc.fillColor(C.primary).fontSize(18).font('Helvetica-Bold').text('VoyageAI', 40, 16);
  doc.fillColor(C.muted).fontSize(8).font('Helvetica').text('AI-Powered Travel Planning', 40, 38);
  if (right) doc.fillColor(C.white).fontSize(9).text(right, 0, 22, { align: 'right', width: doc.page.width - 40 });
  doc.y = 80;
}

function section(doc, title) {
  doc.moveDown(0.6);
  doc.fillColor(C.primary).fontSize(12).font('Helvetica-Bold').text(title);
  doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y)
    .strokeColor(C.primary).lineWidth(0.8).stroke();
  doc.moveDown(0.3);
}

function kv(doc, k, v) {
  doc.fillColor(C.sub).fontSize(9).font('Helvetica').text(k + ' ', { continued: true })
     .fillColor(C.text).font('Helvetica').text(v);
}

exports.generateTripPDF = (trip) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
      /* ── Page 1: Overview ──────────────────────────── */
      hdr(doc, trip.title || `Trip to ${trip.destination}`);

      doc.fillColor(C.primary).fontSize(20).font('Helvetica-Bold')
         .text(trip.title || `${trip.duration}-Day Trip to ${trip.destination}`);
      doc.moveDown(0.3);
      doc.fillColor(C.sub).fontSize(10).font('Helvetica')
         .text(`${trip.destination}  •  ${trip.duration} Days  •  ${trip.travelers} Traveler(s)  •  Budget: ${trip.currency || 'INR'} ${(trip.budget || 0).toLocaleString()}`);
      doc.moveDown(0.8);

      if (trip.overview) {
        section(doc, 'Overview');
        doc.fillColor(C.text).fontSize(10).text(trip.overview, { lineGap: 4, width: doc.page.width - 80 });
        doc.moveDown(0.6);
      }

      /* Cost breakdown */
      const bd = trip.budgetBreakdown || {};
      const total = (bd.hotel || 0) + (bd.transport || 0) + (bd.food || 0) + (bd.entertainment || 0) + (bd.emergency || 0);
      if (total > 0) {
        section(doc, 'Cost Summary');
        kv(doc, 'Hotel:', `${trip.currency || 'INR'} ${(bd.hotel || 0).toLocaleString()}`);
        kv(doc, 'Food & Dining:', `${trip.currency || 'INR'} ${(bd.food || 0).toLocaleString()}`);
        kv(doc, 'Transport:', `${trip.currency || 'INR'} ${(bd.transport || 0).toLocaleString()}`);
        kv(doc, 'Attractions:', `${trip.currency || 'INR'} ${(bd.entertainment || 0).toLocaleString()}`);
        kv(doc, 'Miscellaneous:', `${trip.currency || 'INR'} ${(bd.emergency || 0).toLocaleString()}`);
        doc.moveDown(0.2);
        doc.moveTo(40, doc.y).lineTo(220, doc.y).strokeColor(C.muted).lineWidth(0.4).stroke();
        doc.moveDown(0.2);
        const over = total > (trip.budget || 0);
        kv(doc, 'Estimated Total:', `${trip.currency || 'INR'} ${total.toLocaleString()}`);
        if (over) doc.fillColor(C.warn).fontSize(8).text(`  (${Math.round(total - trip.budget).toLocaleString()} over budget)`);
        doc.moveDown(0.6);
      }

      /* Weather */
      if (trip.weatherInfo?.avgTemp) {
        section(doc, 'Weather');
        kv(doc, 'Average Temp:', trip.weatherInfo.avgTemp);
        kv(doc, 'Conditions:', trip.weatherInfo.climate || 'N/A');
        if (trip._meta?.weatherSource === 'mock') {
          doc.fillColor(C.muted).fontSize(8).text('  (Simulated — add OPENWEATHERMAP_KEY for real forecast)');
        }
        doc.moveDown(0.6);
      }

      /* Highlights */
      if (trip.highlights?.length > 0) {
        section(doc, 'Highlights');
        trip.highlights.forEach(h => {
          doc.fillColor(C.text).fontSize(10).text(`  • ${h}`, { lineGap: 3 });
        });
        doc.moveDown(0.6);
      }

      /* ── Day pages ─────────────────────────────────── */
      (trip.itinerary || []).forEach((day, di) => {
        doc.addPage();
        hdr(doc, `Day ${day.day}`);
        section(doc, `Day ${day.day}  —  ${day.date || ''}`);

        if (day.weather) {
          doc.fillColor(C.muted).fontSize(9)
             .text(`Weather: ${day.weather.condition}, ${day.weather.tempC}°C${day.weather.rain ? '  (Rain expected)' : ''}`);
          doc.moveDown(0.3);
        }

        /* Activities */
        if (day.activities?.length > 0) {
          doc.fillColor(C.accent).fontSize(10).font('Helvetica-Bold').text('Activities');
          doc.moveDown(0.2);
          day.activities.forEach(act => {
            doc.fillColor(C.primary).fontSize(9).font('Helvetica-Bold')
               .text(`  ${act.time || ''}  `, { continued: true })
               .fillColor(C.text).font('Helvetica').text(act.activity);
            if (act.description) {
              doc.fillColor(C.muted).fontSize(8)
                 .text(`    ${String(act.description).slice(0, 130)}`, { lineGap: 2 });
            }
            const costLine = [];
            if (act.estimatedCost > 0) costLine.push(`Cost: ${trip.currency || 'INR'} ${act.estimatedCost.toLocaleString()}`);
            if (act.visitDuration)     costLine.push(`Duration: ${act.visitDuration} min`);
            if (act.travelToNext > 0)  costLine.push(`→ Next: ~${act.travelToNext} min`);
            if (costLine.length > 0) {
              doc.fillColor(C.muted).fontSize(8).text(`    ${costLine.join('  |  ')}`);
            }
            doc.moveDown(0.3);
          });
        }

        /* Meals */
        if (day.meals?.length > 0) {
          doc.fillColor(C.accent).fontSize(10).font('Helvetica-Bold').text('Meals');
          doc.moveDown(0.2);
          day.meals.forEach(m => {
            const type = (m.mealType || 'meal');
            doc.fillColor(C.primary).fontSize(9).font('Helvetica')
               .text(`  ${type.charAt(0).toUpperCase() + type.slice(1)}: `, { continued: true })
               .fillColor(C.text).text(`${m.name || 'Local restaurant'} (${m.cuisine || 'Local'}, ${m.priceRange || '$$'})`);
          });
          doc.moveDown(0.3);
        }

        /* Events */
        if (day.events?.length > 0) {
          doc.fillColor(C.accent).fontSize(10).font('Helvetica-Bold').text('Events');
          day.events.forEach(ev => {
            doc.fillColor(C.text).fontSize(9)
               .text(`  • ${ev.name}${ev.isFree ? '  (Free)' : ''}`);
          });
          doc.moveDown(0.3);
        }

        doc.fillColor(C.muted).fontSize(8)
           .text(`  Travel time: ~${day.travelTimeMinutes || 0} min  |  Daily cost: ${trip.currency || 'INR'} ${(day.estimatedDailyCost || 0).toLocaleString()}`);
      });

      /* ── Travel tips page ──────────────────────────── */
      if (trip.travelTips?.length > 0) {
        doc.addPage();
        hdr(doc, 'Travel Tips');
        section(doc, 'Travel Tips');
        trip.travelTips.forEach(tip => {
          doc.fillColor(C.text).fontSize(10).text(`  • ${tip}`, { lineGap: 4 });
        });
      }

      /* ── Footer on every page ──────────────────────── */
      const total_pages = doc.bufferedPageRange().count;
      for (let i = 0; i < total_pages; i++) {
        doc.switchToPage(i);
        const fy = doc.page.height - 28;
        doc.rect(0, fy - 4, doc.page.width, 32).fill(C.bg);
        doc.fillColor(C.muted).fontSize(7.5).font('Helvetica')
           .text(
             `Generated by VoyageAI  •  AI-Powered Travel Planning  •  Page ${i + 1} of ${total_pages}`,
             40, fy, { align: 'center', width: doc.page.width - 80 }
           );
        if (trip._meta?.weatherSource === 'mock') {
          doc.fillColor(C.muted).fontSize(7)
             .text('Some data is simulated (demo mode). Add API keys for real data.', 40, fy + 11, { align: 'center', width: doc.page.width - 80 });
        }
      }

      doc.end();
    } catch (e) { reject(e); }
  });
