//12-VBFUNZIONI

// --- DB FUNZIONI ---
async function gestisciFinePartita(vittoria) {
    if(!gameOverScreen) { alert("GAME OVER! Punteggio: " + score); window.location.reload(); return; }
    gameOverScreen.classList.remove('hidden'); finalScoreVal.innerText = score;
    // Se si muore, si muore (ma teoricamente non si vince mai definitivamente ora)
    if (vittoria) { endTitle.innerText = "HAI VINTO!"; endTitle.style.color = "#00ff00"; } 
    else { endTitle.innerText = "GAME OVER"; endTitle.style.color = "red"; }
    await checkAndShowLeaderboard();
}

async function checkAndShowLeaderboard() {
    leaderboardList.innerHTML = "<li>Caricamento dati...</li>"; inputSection.classList.add('hidden'); 
    
    let { data: classifica, error } = await dbClient.from('classifica').select('*').order('punteggio', { ascending: false }).limit(10);
    
    if (error) { 
        console.error("Errore Supabase:", error); 
        leaderboardList.innerHTML = "<li>Errore caricamento (Vedi Console).</li>"; return; 
    }
    
    let entraInClassifica = false;
    if (classifica.length < 10) entraInClassifica = true; else if (score > classifica[9].punteggio) entraInClassifica = true;
    if (score === 0) entraInClassifica = false;
    if (entraInClassifica) inputSection.classList.remove('hidden');
    disegnaLista(classifica);
}

function disegnaLista(data) {
    leaderboardList.innerHTML = "";
    if(!data || data.length === 0) { leaderboardList.innerHTML = "<li>Nessun record ancora.</li>"; return; }
    data.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>#${index + 1} ${item.nome}</span><span>${item.punteggio}</span>`;
        leaderboardList.appendChild(li);
    });
}

window.salvaPunteggio = async function() {
    const nome = playerNameInput.value.trim();
    if (nome.length === 0 || nome.length > 18) { alert("Inserisci un nome valido (1-18 caratteri)"); return; }
    const btn = document.getElementById('btn-save'); if(btn) { btn.disabled = true; btn.innerText = "Salvataggio..."; }
    
    const { error } = await dbClient.from('classifica').insert([{ nome: nome, punteggio: score }]);
    
    if (error) { 
        console.error("ERRORE SALVATAGGIO:", error);
        alert("Errore: " + error.message + " (Codice: " + error.code + ")"); 
        if(btn) btn.disabled = false; 
    } else { 
        inputSection.classList.add('hidden'); 
        const { data } = await dbClient.from('classifica').select('*').order('punteggio', { ascending: false }).limit(10); 
        disegnaLista(data); 
    }
}

window.riavviaGioco = function() { window.location.reload(); }

if(nextLevelBtn) nextLevelBtn.addEventListener('click', () => { initGame(level + 1, false); });

const loadingScreen = document.getElementById('loading-screen');
const loadingBar = document.getElementById('loading-bar');
const loadingText = document.getElementById('loading-text');
const startBtn = document.getElementById('start-game-btn');
const loadingBarContainer = document.getElementById('loading-bar-container');

function startGame() {
    resizeCanvases(); 
    initGame(1, true); 
    
    setTimeout(() => {
        player.dir = {x: 0, y: -1}; 
        if (bgMusic) { bgMusic.play().catch(e => console.log("Audio ancora bloccato")); }
    }, 200);

    setTimeout(resizeCanvases, 150);
}

preloadLevelImages(); 

let loadProgress = 0;
const loadInterval = setInterval(() => {
    loadProgress += Math.random() * 15; if(loadProgress > 100) loadProgress = 100;
    if(loadingBar) loadingBar.style.width = loadProgress + "%";
    if(loadProgress >= 100) { clearInterval(loadInterval); onLoadComplete(); }
}, 100); 

window.addEventListener('load', () => { loadProgress = 90; });

function onLoadComplete() {
    if(loadingText) { loadingText.innerText = "GIOCO CARICATO"; loadingText.style.color = "#00ff00"; }
    if(loadingBar) loadingBar.style.width = "100%";
    setTimeout(() => {
        if(loadingBarContainer) loadingBarContainer.style.display = 'none';
        if(startBtn) startBtn.style.display = 'inline-block';
    }, 500);
}

if(startBtn) {
    startBtn.addEventListener('click', () => {
        if (audioCtx.state === 'suspended') { audioCtx.resume().then(() => { console.log("Audio Context Resumed"); }); }
        if(loadingScreen) loadingScreen.style.opacity = '0';
        setTimeout(() => { if(loadingScreen) loadingScreen.style.display = 'none'; startGame(); }, 500);
    });
}
