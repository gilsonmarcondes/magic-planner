// --- MODAL: FINANÇAS ---
import { appData, currentState, myFinanceChart, myMonthlyChart, saveData,
         setMyFinanceChart, setMyMonthlyChart } from '../store.js';
import { formatDateBr, randomId } from '../utils.js';

// Utilitários de segurança (impedem que o app quebre se um campo estiver vazio)
const parseNum = (val) => parseFloat(String(val || 0).replace(',', '.')) || 0;
const safeStr = (str) => String(str || '');

export function openFinanceModal() {
    try {
        const t = appData.trips.find(x => x.id === currentState.tripId);
        if (!t) { alert("Erro: Viagem não encontrada no sistema."); return; }
        
        // Verifica se os campos existem antes de preencher
        if (document.getElementById('rateUSD')) document.getElementById('rateUSD').value = t.rates?.USD || '';
        if (document.getElementById('rateEUR')) document.getElementById('rateEUR').value = t.rates?.EUR || '';
        if (document.getElementById('rateGBP')) document.getElementById('rateGBP').value = t.rates?.GBP || '';
        
        // ABRE O MODAL PRIMEIRO
        const modal = document.getElementById('financeModal');
        if (modal) {
            modal.classList.add('active');
        } else {
            alert("Erro: O ID 'financeModal' não existe no seu HTML!");
        }
        
        // Depois tenta desenhar os relatórios
        switchFinanceTab('report');
        renderInitialCostsList();

    } catch (e) {
        alert("Ops! Erro ao abrir: " + e.message);
        console.error(e);
    }
}

export function switchFinanceTab(tab) {
    try {
        ['report', 'monthly', 'costs'].forEach(t => {
            const content = document.getElementById(`tab-${t}`);
            if (content) content.classList.add('hidden');
            const btn = document.getElementById(`btn-tab-${t}`);
            if (btn) { btn.classList.remove('border-blue-600', 'text-blue-600'); btn.classList.add('border-transparent', 'text-gray-500'); }
        });
        
        const activeContent = document.getElementById(`tab-${tab}`);
        if (activeContent) activeContent.classList.remove('hidden');
        const activeBtn = document.getElementById(`btn-tab-${tab}`);
        if (activeBtn) { activeBtn.classList.add('border-blue-600', 'text-blue-600'); activeBtn.classList.remove('border-transparent', 'text-gray-500'); }
        
        if (tab === 'report')  renderReport();
        if (tab === 'monthly') renderMonthlyReport();
    } catch (e) {
        console.error("Erro na navegação de abas:", e);
    }
}

export function saveRates() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if (!t) return;
    t.rates = { 
        USD: document.getElementById('rateUSD')?.value || '', 
        EUR: document.getElementById('rateEUR')?.value || '', 
        GBP: document.getElementById('rateGBP')?.value || '' 
    };
    saveData(); 
    renderReport();
}

function getRate(curr) {
    if (!curr || curr === 'BRL') return 1;
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const rate = parseFloat(t?.rates?.[curr]);
    return (rate && rate > 0) ? rate : 1; 
}

export function addInitialCost() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if (!t) return;
    if (!t.initialCosts) t.initialCosts = []; 
    
    t.initialCosts.push({
        id:       randomId(),
        type:     document.getElementById('initType')?.value || 'Outro',
        desc:     document.getElementById('initDesc')?.value || '',
        currency: document.getElementById('initCurr')?.value || 'BRL',
        value:    document.getElementById('initVal')?.value || '0',
        date:     document.getElementById('initDate')?.value || new Date().toISOString().split('T')[0],
    });
    saveData(); 
    renderInitialCostsList();
    if(document.getElementById('initDesc')) document.getElementById('initDesc').value = '';
    if(document.getElementById('initVal'))  document.getElementById('initVal').value  = '';
}

export function deleteInitialCost(id) {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    if(t) t.initialCosts = (t.initialCosts || []).filter(c => c.id !== id);
    saveData(); 
    renderInitialCostsList();
}

function renderInitialCostsList() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const el = document.getElementById('initialCostsList');
    if (!t || !el) return;
    
    el.innerHTML = (t.initialCosts || [])
        .map(c => `
            <li class="flex justify-between items-center p-2 bg-white border border-[#e2d5b5] rounded shadow-sm">
                <div class="flex flex-col">
                    <span class="font-bold text-[#2c1a4d]">${c.type}: ${c.desc}</span>
                    <span class="text-[10px] text-gray-500">📅 ${formatDateBr(c.date)}</span>
                </div>
                <div class="flex items-center gap-2">
                    <b class="text-[#b45309]">${c.currency} ${c.value}</b>
                    <button onclick="window.deleteInitialCost('${c.id}')" class="text-red-400 hover:text-red-600 font-bold">×</button>
                </div>
            </li>`).join('');
}

function renderReport() {
    try {
        const t = appData.trips.find(x => x.id === currentState.tripId);
        if (!t) return;

        const toBRL = (val, curr) => parseNum(val) * getRate(curr);
        const sunk = {BRL:0,USD:0,EUR:0,GBP:0}, variable = {BRL:0,USD:0,EUR:0,GBP:0};
        const paidItems = [], unpaidItems = [];
        const cats = { Hospedagem:0, Transporte:0, Alimentação:0, Passeios:0, Compras:0, Outros:0 };

        (t.initialCosts || []).forEach(c => {
            const val = parseNum(c.value);
            const curr = c.currency || 'BRL';
            if(sunk[curr] === undefined) sunk[curr] = 0;
            sunk[curr] += val;
            
            paidItems.push({ date: c.date || t.startDate, desc: `${c.type || 'Custo'}: ${c.desc || ''}`, val: val, curr: curr, type: 'paid' });
            
            const typeStr = safeStr(c.type);
            if (typeStr.includes('Avião') || typeStr.includes('Trem')) cats['Transporte'] += toBRL(val, curr);
            else if (typeStr.includes('Hospedagem'))                  cats['Hospedagem'] += toBRL(val, curr);
            else                                                      cats['Outros']     += toBRL(val, curr);
        });

        (t.hotels || []).forEach(h => {
            const val = parseNum(h.cost);
            const curr = h.currency || 'BRL';
            cats['Hospedagem'] += toBRL(val, curr);
            
            if (h.paid) { 
                if(sunk[curr] === undefined) sunk[curr] = 0;
                sunk[curr] += val; 
                paidItems.push({   date: h.payDate || h.checkIn, desc: `🏨 ${h.name || 'Hotel'}`, val: val, curr: curr, type: 'paid' }); 
            }
            else { 
                if(variable[curr] === undefined) variable[curr] = 0;
                variable[curr] += val; 
                unpaidItems.push({ date: h.checkOut,             desc: `🏨 ${h.name || 'Hotel'}`, val: val, curr: curr, type: 'unpaid' }); 
            }
        });

        (t.days || []).forEach(d => {
            (d.transport || []).forEach(tr => { 
                const val = parseNum(tr.cost);
                const curr = tr.currency || 'BRL';
                if(sunk[curr] === undefined) sunk[curr] = 0;
                sunk[curr] += val; 
                paidItems.push({ date: d.date, desc: `🚌 ${tr.title || 'Transporte'}`, val: val, curr: curr, type: 'paid' }); 
                cats['Transporte'] += toBRL(val, curr); 
            });
            
            (d.attractions || []).forEach(a => {
                (a.costs || []).forEach(c => {
                    const val = parseNum(c.value);
                    const curr = c.currency || 'BRL';
                    if (c.paid) { 
                        if(sunk[curr] === undefined) sunk[curr] = 0;
                        sunk[curr] += val; 
                        paidItems.push({   date: c.payDate || d.date, desc: `🎟️ ${a.name || 'Atração'}: ${c.name || 'Custo'}`, val, curr: curr, type: 'paid' }); 
                    }
                    else { 
                        if(variable[curr] === undefined) variable[curr] = 0;
                        variable[curr] += val; 
                        unpaidItems.push({ date: d.date,               desc: `🎟️ ${a.name || 'Atração'}: ${c.name || 'Custo'}`, val, curr: curr, type: 'unpaid' }); 
                    }
                    const typeMap = { food:'Alimentação', shop:'Compras', sight:'Passeios', transport:'Transporte', airport:'Transporte', hotel:'Hospedagem' };
                    cats[typeMap[a.type] || 'Outros'] += toBRL(val, curr);
                });
            });
            
            (d.extraCosts || []).forEach(e => { 
                const val = parseNum(e.value);
                const curr = e.currency || 'BRL';
                if(variable[curr] === undefined) variable[curr] = 0;
                variable[curr] += val; 
                unpaidItems.push({ date: d.date, desc: `💸 Extra: ${e.desc || ''}`, val: val, curr: curr, type: 'unpaid' }); 
                cats['Outros'] += toBRL(val, curr); 
            });
        });

        paidItems.sort((a, b) => (a.date > b.date) ? 1 : -1);
        unpaidItems.sort((a, b) => (a.date > b.date) ? 1 : -1);

        const generateHTML = items => items.length === 0
            ? '<p class="text-center text-gray-400 italic">Nenhum registro.</p>'
            : items.map(item => `
                <div class="flex justify-between items-center border-b border-gray-100 py-1.5 hover:bg-gray-50 px-1 transition-colors">
                    <div class="flex items-center text-xs truncate mr-2 flex-1">
                        ${item.date ? `<span class="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded mr-2 font-mono border">${formatDateBr(item.date)}</span>` : ''}
                        <span class="truncate font-medium text-slate-700" title="${item.desc}">${item.desc}</span>
                    </div>
                    <span class="font-bold text-xs whitespace-nowrap ${item.type === 'paid' ? 'text-emerald-700' : 'text-amber-700'}">${item.curr} ${item.val.toFixed(2)}</span>
                </div>`).join('');

        let sunkH = '', varH = '', totalBRL = 0;
        Object.keys(sunk).forEach(k => { if (sunk[k] > 0) { sunkH += `<div class="p-2 bg-blue-50 border border-blue-100 rounded text-center text-xs text-blue-900"><b>${k}</b><br>${sunk[k].toFixed(2)}</div>`; totalBRL += sunk[k] * getRate(k); } });
        Object.keys(variable).forEach(k => { if (variable[k] > 0) { varH += `<div class="p-2 bg-orange-50 border border-orange-100 rounded text-center text-xs text-orange-900"><b>${k}</b><br>${variable[k].toFixed(2)}</div>`; totalBRL += variable[k] * getRate(k); } });

        const elSunk = document.getElementById('reportSunkCosts');
        const elVar = document.getElementById('reportVariableCosts');
        const elTotal = document.getElementById('reportGrandTotal');
        const elPaid = document.getElementById('paidItemsList');
        const elUnpaid = document.getElementById('executedItemsList');

        if(elSunk) elSunk.innerHTML     = sunkH || '<div class="text-xs text-gray-400 w-full text-center">Nada registrado.</div>';
        if(elVar) elVar.innerHTML = varH  || '<div class="text-xs text-gray-400 w-full text-center">Nada registrado.</div>';
        if(elTotal) elTotal.innerText    = `Custo Total Estimado: R$ ${totalBRL.toFixed(2)}`;
        if(elPaid) elPaid.innerHTML       = generateHTML(paidItems);
        if(elUnpaid) elUnpaid.innerHTML   = generateHTML(unpaidItems);

        const canvas = document.getElementById('financeChart');
        if (canvas && totalBRL > 0) {
            const ctx = canvas.getContext('2d');
            if (myFinanceChart) myFinanceChart.destroy();
            const labels = Object.keys(cats).filter(k => cats[k] > 0);
            setMyFinanceChart(new Chart(ctx, {
                type: 'doughnut',
                data: { labels, datasets: [{ data: labels.map(k => cats[k].toFixed(2)), backgroundColor: ['#8b5cf6','#3b82f6','#f43f5e','#10b981','#f59e0b','#64748b'], borderWidth: 0 }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } } },
            }));
        }
    } catch (e) {
        console.error("Erro no renderReport:", e);
    }
}

function renderMonthlyReport() {
    try {
        const t = appData.trips.find(x => x.id === currentState.tripId);
        if (!t) return;
        
        const monthlyData = {};
        const addToMonth  = (dateStr, currency, value) => {
            if (!dateStr || !value) return;
            const key = dateStr.substring(0, 7);
            if (!monthlyData[key]) monthlyData[key] = { BRL:0, USD:0, EUR:0, GBP:0 };
            if (monthlyData[key][currency] !== undefined) monthlyData[key][currency] += parseNum(value);
        };

        (t.initialCosts || []).forEach(c => addToMonth(c.date || t.startDate, c.currency, c.value));
        (t.hotels || []).forEach(h    => addToMonth(h.paid ? (h.payDate || h.checkIn) : h.checkIn, h.currency, h.cost));
        (t.days || []).forEach(d      => {
            (d.transport || []).forEach(tr  => addToMonth(d.date, tr.currency, tr.cost));
            (d.attractions || []).forEach(a => (a.costs || []).forEach(c => addToMonth(c.paid ? (c.payDate || d.date) : d.date, c.currency, c.value)));
            (d.extraCosts || []).forEach(e  => addToMonth(d.date, e.currency, e.value));
        });

        const sortedMonths = Object.keys(monthlyData).sort();
        const labels = sortedMonths.map(m => { const [y, mo] = m.split('-'); return new Date(y, mo - 1).toLocaleString('pt-BR', { month: 'short', year: '2-digit' }); });

        const elList = document.getElementById('monthlyListContainer');
        if (elList) {
            elList.innerHTML = sortedMonths.length === 0
                ? '<div class="text-center text-gray-400 p-4">Nenhum gasto registrado.</div>'
                : sortedMonths.map((key, i) => {
                    const data = monthlyData[key];
                    const badges = [
                        data.BRL > 0 ? `<span class="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">R$ ${data.BRL.toFixed(2)}</span>` : '',
                        data.USD > 0 ? `<span class="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">USD ${data.USD.toFixed(2)}</span>` : '',
                        data.EUR > 0 ? `<span class="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded">EUR ${data.EUR.toFixed(2)}</span>` : '',
                        data.GBP > 0 ? `<span class="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded">GBP ${data.GBP.toFixed(2)}</span>` : '',
                    ].filter(Boolean).join('');
                    return `<div class="bg-slate-50 border border-slate-200 rounded p-3"><div class="flex justify-between items-center mb-2"><h4 class="font-bold text-slate-700 uppercase text-sm">📅 ${labels[i]}</h4></div><div class="flex gap-2 flex-wrap">${badges || '<span class="text-xs text-gray-400">Sem gastos</span>'}</div></div>`;
                }).join('');
        }

        const canvas = document.getElementById('monthlyChart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (myMonthlyChart) myMonthlyChart.destroy();
            setMyMonthlyChart(new Chart(ctx, {
                type: 'bar',
                data: { labels, datasets: [
                    { label: 'R$',  data: sortedMonths.map(m => monthlyData[m].BRL), backgroundColor: '#22c55e' },
                    { label: 'USD', data: sortedMonths.map(m => monthlyData[m].USD), backgroundColor: '#3b82f6' },
                    { label: 'EUR', data: sortedMonths.map(m => monthlyData[m].EUR), backgroundColor: '#a855f7' },
                    { label: 'GBP', data: sortedMonths.map(m => monthlyData[m].GBP), backgroundColor: '#ef4444' },
                ]},
                options: { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: false }, y: { beginAtZero: true } }, plugins: { legend: { position: 'bottom' } } },
            }));
        }
    } catch (e) {
        console.error("Erro no renderMonthlyReport:", e);
    }
}