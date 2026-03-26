// --- UTILITÁRIOS PUROS (sem efeitos colaterais) ---

export function formatDateBr(isoDate) {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
}

export function getDayName(isoDate) {
    if (!isoDate) return '';
    const d = new Date(isoDate + 'T12:00:00');
    return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()];
}

export function randomId() {
    return Math.random().toString(36).substr(2, 9);
}

export function calculateEndTime(startTime, duration) {
    if (!startTime || !duration) return '';
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    let durHours = 0, durMinutes = 0;

    const m3 = duration.match(/(\d+)\s*h\s*(\d+)\s*m/i);
    const m1 = duration.match(/(\d+)\s*h/i);
    const m2 = duration.match(/(\d+)\s*m/i);

    if (m3)      { durHours = Number(m3[1]); durMinutes = Number(m3[2]); }
    else if (m1) { durHours = Number(m1[1]); }
    else if (m2) { durMinutes = Number(m2[1]); }
    else {
        const num = Number(duration);
        if (!isNaN(num) && num > 0) durMinutes = num;
    }

    if (durHours === 0 && durMinutes === 0) return '';

    const date = new Date();
    date.setHours(startHours, startMinutes);
    date.setHours(date.getHours() + durHours);
    date.setMinutes(date.getMinutes() + durMinutes);

    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// ✨ AQUI ESTÁ A CORREÇÃO QUE FECHA AS JANELAS
export function closeModals() {
    document.querySelectorAll('.modal').forEach(m => {
        m.classList.add('hidden');
        m.classList.remove('active', 'flex');
    });
}

export function exportDataAsJson(appData) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(appData)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup.json';
    a.click();
}