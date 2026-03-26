// --- FEATURE: AI FACTS ---
import { appData, currentState, getAttractionQuill } from '../store.js';
import { GEMINI_API_KEY } from '../config.js';

export async function fetchAIFacts() {
    const t = appData.trips.find(x => x.id === currentState.tripId);
    const d = t.days.find(x => x.id === currentState.dayId);
    
    // Pega o nome das localidades do dia para a IA saber sobre o que falar
    const locations = d.locations.map(l => l.name).join(', ');
    
    if (!locations) {
        return alert("📍 Adicione pelo menos uma cidade/localidade neste dia para a IA saber o que pesquisar!");
    }

    if (!GEMINI_API_KEY) {
        return alert("🔑 Chave da IA não configurada! Adicione sua GEMINI_API_KEY no arquivo config.js.");
    }

    const quill = getAttractionQuill();
    if (quill) {
        // Coloca um aviso de "carregando" na caixa de texto da atração
        quill.root.innerHTML += `<p id="ai-loading" style="color: #d4af37;">✨ <i>A IA está buscando curiosidades sobre ${locations}...</i></p>`;
    }

    // O comando que vamos dar para a IA
    const prompt = `Escreva 3 curiosidades muito curtas e interessantes para um turista sobre ${locations}. Formate em HTML usando <ul> e <li>. Não use a marcação markdown (\`\`\`).`;

    try {
        // Chamada real para a API do Gemini
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        
        if (quill) {
            // Remove o aviso de "carregando"
            const loadingEl = quill.root.querySelector('#ai-loading');
            if (loadingEl) loadingEl.remove();

            // Pega a resposta da IA e injeta no texto
            if (data.candidates && data.candidates.length > 0) {
                let aiText = data.candidates[0].content.parts[0].text;
                // Limpa marcações markdown caso a IA teime em mandar
                aiText = aiText.replace(/```html/g, '').replace(/```/g, ''); 
                
                quill.root.innerHTML += `<div style="background-color: #f0f9ff; padding: 10px; border-left: 4px solid #0ea5e9; border-radius: 4px; margin-top: 10px;">
                    <b style="color: #0c4a6e;">✨ Dicas da IA:</b><br>${aiText}
                </div><p><br></p>`;
            } else {
                quill.root.innerHTML += `<p style="color: red;">❌ <b>Erro na IA:</b> Não foi possível gerar as curiosidades.</p>`;
            }
        }
    } catch (error) {
        console.error("Erro na chamada da IA:", error);
        if (quill) {
            const loadingEl = quill.root.querySelector('#ai-loading');
            if (loadingEl) loadingEl.remove();
            quill.root.innerHTML += `<p style="color: red;">❌ <b>Erro na IA:</b> Falha na conexão. Verifique sua chave no config.js.</p>`;
        }
    }
}