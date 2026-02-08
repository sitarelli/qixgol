//12-VBFUNZIONI

// --- DB FUNZIONI ---


async function gestisciFinePartita(vittoria) {
    if(!gameOverScreen) { 
        alert("GAME OVER! Punteggio: " + score); 
        window.location.reload(); 
        return; 
    }

    // --- GESTIONE AUDIO ---
    if (!vittoria) {
        // 1. Fermiamo la musica di sottofondo (bgMusic è definita in dom-elements.js)
        if (bgMusic) {
            bgMusic.pause();
            bgMusic.currentTime = 0; 
        }

        // 2. Facciamo partire il suono funebre (gameoverSound è in dom-elements.js)
        if (gameoverSound) {
            gameoverSound.currentTime = 0; // Reset per sicurezza
            gameoverSound.play().catch(e => console.log("Riproduzione audio bloccata dal browser:", e));
        }

        endTitle.innerText = "GAME OVER"; 
        endTitle.style.color = "red"; 
    } else {
        // Caso vittoria (se il gioco prevede un traguardo finale)
        endTitle.innerText = "HAI VINTO!"; 
        endTitle.style.color = "#00ff00"; 
    }

    // --- GESTIONE INTERFACCIA ---
    gameOverScreen.classList.remove('hidden'); 
    finalScoreVal.innerText = score;
    gameOverTime = Date.now(); // Salva il momento per il delay dei tasti

    // Avvia il sistema di classifica che abbiamo sistemato prima
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

window.riavviaGioco = function() { 
    // Nascondi schermata game over
    if(gameOverScreen) gameOverScreen.classList.add('hidden');
    
    // Ferma il suono di game over
    if(gameoverSound) {
        gameoverSound.pause();
        gameoverSound.currentTime = 0;
    }
    
    // Riavvia la musica di sottofondo
    if(bgMusic && isMusicOn) {
        bgMusic.currentTime = 0;
        bgMusic.play().catch(e => console.log("Audio bloccato"));
    }
    
    // Resetta le variabili di gioco
    lives = START_LIVES;
    score = 0;
    level = 1;
    isPlaying = false;
    isDying = false;
    isVictory = false;
    gameOverTime = 0;
    isGodMode = false;
    cheatDetected = false;
    playerSpeedMult = 1.8;
    
    // Riavvia il gioco dal livello 1
    initGame(1, true);
    
    // Imposta direzione iniziale dopo un breve delay
    setTimeout(() => {
        player.dir = {x: 0, y: -1};
    }, 200);
}

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
