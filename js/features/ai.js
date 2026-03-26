// --- FEATURE: AI FACTS ---
import { appData, currentState, getAttractionQuill } from '../store.js';
import { GEMINI_API_KEY } from '../config.js';

export async function fetchAIFacts() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    
    const locations = d.locations.map(l => l.name).join(', ');
    const prompt = `Dê 3 curiosidades rápidas sobre ${locations}.`;

    // Aqui iria a chamada real para a API do Gemini
    console.log("Chamando IA para:", locations);
    
    const quill = getAttractionQuill();
    if (quill) {
        quill.root.innerHTML += `<p>✨ <b>Dica da IA:</b> Curiosidades sobre ${locations} em breve...</p>`;
    }
}