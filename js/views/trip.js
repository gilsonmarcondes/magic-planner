import { appData, saveData, currentState } from '../store.js';
import { render, goTo } from '../router.js';
import { closeModals, formatDateBr, getDayName } from '../utils.js';

export function renderTrip(container, tripId) {
    const t = appData.trips.find(x => x.id === tripId);
    if (!t) {
        container.innerHTML = '<div class="p-10 text-center text-gray-500 font-bold italic">Viagem não encontrada no Mapa do Maroto.</div>';
        return;
    }

    let html = `
        <div class="p-4 max-w-5xl mx-auto pb-24 animate-fade-in">
            <div class="flex justify-between items-center mb-6">
                <button onclick="window.goTo('home')" class="bg-white border px-4 py-2 rounded-lg text-xs font-bold shadow-sm text-slate-600 hover:bg-gray-50 transition">⬅ Voltar</button>
                <h2 class="text-3xl font-magic font-bold text-[#0c4a6e] uppercase text-center leading-tight">${t.name}</h2>
                <button onclick="window.editTripMetadata('${t.id}')" class="text-blue-500 hover:text-blue-700 bg-blue-50 px-3 py-2 rounded-lg font-bold text-xs transition">✏️ Editar</button>
            </div>
            
            <div class="flex flex-wrap justify-center gap-2 mb-8 border-b border-[#d4af37]/30 pb-4">
                <button class="bg-[#0c4a6e] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md flex items-center gap-2">🗺️ Roteiro</button>
                <button onclick="window.openHotelManager()" class="bg-white border border-[#0c4a6e] text-[#0c4a6e] px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-blue-50 transition flex items-center gap-2">🏨 Hotéis</button>
                <button onclick="window.openChecklist()" class="bg-white border border-[#0c4a6e] text-[#0c4a6e] px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-blue-50 transition flex items-center gap-2">✅ Checklist</button>
                <button onclick="window.openDocumentsModal()" class="bg-white border border-[#0c4a6e] text-[#0c4a6e] px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-blue-50 transition flex items-center gap-2">📄 Documentos</button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">`;

    if (t.days && t.days.length > 0) {
        t.days.forEach((d, index) => {
            const dateStr = d.date ? `${formatDateBr(d.date)} • ${getDayName(d.date)}` : `Dia ${index + 1}`;
            html += `
                <div class="card p-5 cursor-pointer hover:bg-blue-50 transition border-l-4 border-l-[#d4af37] shadow-sm bg-white rounded-xl" onclick="window.goTo('day', '${t.id}', '${d.id}')">
                    <h3 class="font-bold text-lg text-[#0c4a6e]">${d.customTitle || 'Dia ' + (index + 1)}</h3>
                    <p class="text-[10px] text-gray-400 mb-2 font-bold uppercase tracking-widest">${dateStr}</p>
                    <p class="text-xs text-slate-500 font-medium line-clamp-1 italic">📍 ${(d.locations || []).map(l => l.name).join(', ') || 'Sem cidades'}</p>
                    <div class="mt-4 flex gap-2">
                        <span class="text-[9px] bg-slate-50 border px-2 py-1 rounded-full text-slate-500 font-bold uppercase tracking-tighter">✨ ${d.attractions ? d.attractions.length : 0} paradas</span>
                    </div>
                </div>`;
        });
    } else {
        html += `<div class="col-span-full text-center py-16 text-gray-400 bg-white border border-dashed rounded-xl font-medium">Nenhum dia gerado para este roteiro.</div>`;
    }

    html += `
            </div>
            <div class="mt-10 flex justify-center gap-4">
                <button onclick="window.addDay()" class="bg-[#0c4a6e] text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-[#073654] transition">+ Adicionar Dia Extra</button>
                <button onclick="window.addBucketList()" class="bg-amber-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-amber-600 transition">📝 Bucket List</button>
            </div>
        </div>`;
    container.innerHTML = html;
}

export async function addDay() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if(!t) return;
    if(!t.days) t.days = [];
    let nextDate = '';
    if(t.days.length > 0) {
        const lastDate = t.days[t.days.length-1].date;
        if(lastDate) {
            const d = new Date(lastDate + 'T12:00:00');
            d.setDate(d.getDate() + 1);
            nextDate = d.toISOString().split('T')[0];
        }
    }
    t.days.push({ id: Math.random().toString(36).substr(2, 9), date: nextDate, attractions: [], transport: [], extraCosts: [], locations: [] });
    await saveData();
    window.render();
}

export async function deleteDay(dayId) {
    if(!confirm('Apagar este dia e todas as suas paradas?')) return;
    const t = appData.trips.find(x => x.id === currentState.tripId);
    t.days = t.days.filter(d => d.id !== dayId);
    await saveData();
    window.render();
}

export function addBucketList() { alert("📝 Em breve: Sua lista de desejos para esta viagem!"); }