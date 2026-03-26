// --- FEATURE: INTEGRAÇÃO GEMINI IA ---
import { attractionQuill } from '../store.js';
import { GEMINI_API_KEY } from '../config.js';

export async function fetchAIFacts() {
    const nameInput = document.getElementById('attName');
    const addressInput = document.getElementById('attAddress');
    const term = nameInput?.value;

    if (!term) return alert('Digite o nome do local primeiro!');
    if (!GEMINI_API_KEY) return alert('Chave da IA não configurada!');

    const btn = document.getElementById('btn-ai-magic');
    const oldText = btn?.innerText || '✨';
    if (btn) { btn.innerHTML = '⏳'; btn.disabled = true; }

    try {
        const prompt = `Atue como um especialista em viagens e guia turístico local. 
        O utilizador vai visitar um local chamado "${term}". 
        Localização/Endereço de referência: ${addressInput?.value || 'desconhecida'}.
        
        Pesquise e escreva um resumo focado no planeamento prático da viagem, contendo as seguintes seções:
        
        <p><b>🕒 Horários e 💰 Preços:</b> Informe os horários de funcionamento habituais, dias de fechamento (se houver) e os valores médios de entrada/ingressos. (Se for gratuito, informe. Se não tiver o valor exato, dê uma estimativa realista em Libras/Euros).</p>
        
        <p><b>🎒 Dicas Práticas de Viagem:</b> Qual o melhor horário para visitar? Tem muita fila? Precisa reservar com antecedência? O que tem perto para aproveitar a viagem?</p>
        
        <p><b>🏰 O Local e História:</b> O que é este local, sua importância e uma breve história ou curiosidade interessante.</p>
        
        IMPORTANTE: Não invente dados se não existirem. Seja muito prático e direto, pensando no que um turista precisa saber antes de chegar na porta do local.
        O texto DEVE ser formatado exclusivamente em HTML básico usando APENAS <p>, <b>, <strong>, <ul> e <li>. 
        NÃO uses Markdown (asteriscos). Sem saudações.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error?.message || 'Erro de comunicação');
        if (!data.candidates || data.candidates.length === 0) throw new Error("A IA não retornou dados.");

        const aiText = data.candidates[0].content.parts[0].text;
        const cleanText = aiText.replace(/```html/g, '').replace(/```/g, '');

        // Formatação simples à prova do "faxineiro" do Quill
        const formattedHTML = `
            <p><br></p>
            <p><strong style="color: #9c27b0; font-size: 18px;">✨ Descobertas do Guia (IA): ${term}</strong></p>
            ${cleanText}
            <p><br></p>
        `;

        if (attractionQuill) {
            // A forma oficial e segura de inserir HTML sem ser apagado
            const currentLength = attractionQuill.getLength();
            attractionQuill.clipboard.dangerouslyPasteHTML(currentLength, formattedHTML);
            
            // Força a tela a rolar para baixo para ler o texto novo
            setTimeout(() => {
                const editor = document.querySelector('#attDescEditor .ql-editor');
                if(editor) editor.scrollTop = editor.scrollHeight;
            }, 100);
        } else {
            // Plano B
            const editorBox = document.querySelector('#attDescEditor .ql-editor');
            if(editorBox) editorBox.innerHTML += formattedHTML;
        }

    } catch (err) {
        console.error(err);
        if (attractionQuill) {
            const currentLength = attractionQuill.getLength();
            attractionQuill.clipboard.dangerouslyPasteHTML(currentLength, `<p><strong style="color:red;">🚨 Erro na IA: ${err.message}</strong></p>`);
        } else {
            alert('Erro na IA: ' + err.message);
        }
    } finally {
        if (btn) { btn.innerText = oldText; btn.disabled = false; }
    }
}