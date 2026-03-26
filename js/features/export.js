// --- FEATURE: EXPORT (PDF, KML, ICS) ---
import { appData, currentState } from '../store.js';
import { formatDateBr } from '../utils.js';

function printIframe(html) {
    const iframe = document.createElement('iframe');
    Object.assign(iframe.style, { position: 'absolute', width: '0px', height: '0px', border: 'none' });
    document.body.appendChild(iframe);
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(html);
    iframe.contentWindow.document.close();
    setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => document.body.removeChild(iframe), 2000);
    }, 1500);
}

const PDF_BASE_CSS = `
    @media print { 
        @page { margin: 0.5cm; size: A4; } 
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } 
    }
    body { font-family: sans-serif; color: #1e3a8a; background: white; padding: 10px; }
    h1 { text-align: center; color: #0c4a6e; border-bottom: 2px solid #d4af37; margin-bottom: 5px; font-size: 20px; }
    h3 { text-align: center; color: #666; font-size: 14px; margin-bottom: 15px; }
    .day-container { margin-bottom: 15px; border: 1px solid #ddd; border-radius: 6px; overflow: hidden; page-break-inside: avoid; }
    .day-header { background: #f1f5f9; padding: 8px; font-weight: bold; font-size: 14px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; }
    ul { padding: 0; margin: 0; list-style: none; }
    li { padding: 8px; border-bottom: 1px solid #eee; page-break-inside: avoid; }
    .li-trans { background: #f0f9ff; border-left: 5px solid #3b82f6; } 
    .li-attr { background: #fff; border-left: 5px solid #d4af37; }
    .item-header { display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; margin-bottom: 4px; }
    .item-title { color: #1e3a8a; text-transform: uppercase; }
    .item-desc { font-size: 10px; color: #555; margin-top: 5px; line-height: 1.3; }
`;

export function generatePDF(event) {
    if (event) event.stopPropagation();
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if (!t) return;
    let html = `<html><head><style>${PDF_BASE_CSS}</style></head><body>`;
    html += `<h1>${t.destination}</h1><h3>${t.name || ''}</h3>`;
    t.days.forEach((d, i) => {
        html += `<div class="day-container"><div class="day-header"><span>${d.customTitle || 'Dia ' + (i+1)}</span><span>${d.date ? formatDateBr(d.date) : 'Plano B'}</span></div><ul>`;
        d.transport.forEach(tr => {
            html += `<li class="li-trans"><div class="item-header"><span class="item-title">🎫 ${tr.title}</span></div></li>`;
        });
        d.attractions.forEach(a => {
            html += `<li class="li-attr"><div class="item-header"><span class="item-title">📍 ${a.name}</span></div></li>`;
        });
        html += `</ul></div>`;
    });
    html += `</body></html>`;
    printIframe(html);
}

export function generateDayPDF(event) {
    if (event) event.stopPropagation();
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t?.days.find(x => x.id === currentState.dayId);
    if (!d) return alert("Erro: Dia não encontrado!");

    let html = `<html><head><style>${PDF_BASE_CSS}</style></head><body>`;
    html += `<h1>${t.destination}</h1><h3>${d.customTitle || 'Dia'} - ${d.date ? formatDateBr(d.date) : ''}</h3>`;

    html += `<div class="day-container"><ul>`;
    
    d.transport.forEach(tr => {
        html += `<li class="li-trans">
            <div class="item-header"><span class="item-title">🎫 ${tr.title}</span><span>${tr.currency} ${tr.cost}</span></div>
            ${tr.steps.map(s => `<div style="font-size:10px;"><b>${s.icon} ${s.time}</b> ${s.location} ➔ ${s.arrivalLoc}</div>`).join('')}
        </li>`;
    });

    d.attractions.forEach(a => {
        html += `<li class="li-attr">
            <div class="item-header"><span class="item-title">📍 ${a.name}</span></div>
            <div style="font-size: 9px; color: #888; margin-bottom: 3px;">${a.type} ${a.hours ? '| ' + a.hours : ''}</div>
            ${a.description ? `<div class="item-desc">${a.description}</div>` : ''}
        </li>`;
    });
    
    html += `</ul>`;
    if (d.journal) html += `<div style="background: #fffbeb; padding: 10px; font-size: 11px; margin-top: 10px;"><b>Notas:</b> ${d.journal}</div>`;
    html += `</div></body></html>`;

    printIframe(html);
}

export function generateCalendarPDF(event) {
    if (event) event.stopPropagation();
    try {
        const trip = appData.trips.find(x => x.id === currentState.tripId);
        if (!trip) return alert("Abra uma viagem primeiro!");

        const dataInicioStr = trip.startDate ? trip.startDate.split('-').reverse().join('/') : '';
        const dataFimStr = trip.endDate ? trip.endDate.split('-').reverse().join('/') : '';
        const dataReferencia = trip.startDate || '2026-04-01';

        let htmlContent = `
            <div style="max-width: 1100px; margin: 0 auto; font-family: sans-serif; color: #333;">
                <div style="text-align:center; margin-bottom: 20px;">
                    <h1 style="color:#0c4a6e; font-size: 24px; margin: 0; text-transform: uppercase;">Calendário - ${trip.name || trip.destination}</h1>
                    <p style="color:#666; font-size: 12px; margin-top: 5px;">${dataInicioStr} a ${dataFimStr}</p>
                </div>
                <table style="width:100%; border-collapse: collapse; table-layout: fixed;">
                    <thead>
                        <tr style="background-color:#0c4a6e; color:#ffffff; height: 30px; font-size: 11px;">
                            <th style="border:1px solid #999; padding:5px;">Dom</th><th style="border:1px solid #999; padding:5px;">Seg</th>
                            <th style="border:1px solid #999; padding:5px;">Ter</th><th style="border:1px solid #999; padding:5px;">Qua</th>
                            <th style="border:1px solid #999; padding:5px;">Qui</th><th style="border:1px solid #999; padding:5px;">Sex</th>
                            <th style="border:1px solid #999; padding:5px;">Sáb</th>
                        </tr>
                    </thead>
                    <tbody><tr>
        `;

        const startDateObj = new Date(dataReferencia + 'T00:00:00');
        let currentDayOfWeek = startDateObj.getDay();

        for(let i = 0; i < currentDayOfWeek; i++) {
            htmlContent += `<td style="border:1px solid #999; background-color:#f8f9fa; height:100px;"></td>`;
        }

        trip.days.forEach((day, index) => {
            if (currentDayOfWeek === 7) {
                htmlContent += `</tr><tr>`;
                currentDayOfWeek = 0;
            }
            const dateObj = day.date ? new Date(day.date + 'T00:00:00') : new Date(startDateObj.getTime() + (index * 86400000));
            const dayNum = dateObj.getDate();

            let dayItems = day.customTitle ? `<strong style="display:block; font-size:10px; color:#0c4a6e; margin-bottom:3px;">${day.customTitle}</strong>` : '';
            day.attractions.slice(0, 4).forEach(a => {
                dayItems += `<div style="font-size:9px; color:#444; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">• ${a.name}</div>`;
            });

            htmlContent += `
                <td style="border:1px solid #999; padding:5px; vertical-align:top; height:100px; background: white;">
                    <div style="text-align:right; font-weight:bold; font-size: 12px; border-bottom: 1px solid #eee; margin-bottom: 3px;">${dayNum}</div>
                    ${dayItems}
                </td>
            `;
            currentDayOfWeek++;
        });

        while(currentDayOfWeek < 7) {
            htmlContent += `<td style="border:1px solid #999; background-color:#f8f9fa; height:100px;"></td>`;
            currentDayOfWeek++;
        }

        htmlContent += `</tr></tbody></table></div>`;

        printIframe(`<html><head><title>Calendário</title><style>@page { size: landscape; margin: 10mm; } body { margin: 0; padding: 0; }</style></head><body>${htmlContent}</body></html>`);

    } catch (e) { console.error(e); alert("Erro ao gerar calendário."); }
}

export function generateVisitedKML() {
    const trip = appData.trips.find(x => x.id === currentState.tripId);
    if (!trip) return alert("Abra um roteiro primeiro!");
    let kml = `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${trip.destination}</name>`;
    trip.days.forEach(day => {
        day.attractions.forEach(att => {
            if (att.latitude && att.longitude) {
                kml += `<Placemark><name>${att.name}</name><Point><coordinates>${att.longitude},${att.latitude},0</coordinates></Point></Placemark>`;
            }
        });
    });
    kml += `</Document></kml>`;
    const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Mapa_${trip.destination}.kml`;
    a.click();
}

export function generateICS() {
    alert("📅 A exportação para o calendário (ICS) será ativada na próxima atualização. Por enquanto, utilize o Calendário em PDF!");
}