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
        player.dir = {x: 0, y: 0};
    }, 200);
}

if(nextLevelBtn) nextLevelBtn.addEventListener('click', () => { initGame(level + 1, false); });

const loadingScreen = document.getElementById('loading-screen');
const loadingBar = document.getElementById('loading-bar');
const loadingText = document.getElementById('loading-text');
const startBtn = document.getElementById('start-game-btn');
const loadingBarContainer = document.getElementById('loading-bar-container');


// ==========================================
// 🌀 ANIMAZIONE SFONDO LOADING (NEON TUNNEL)
// ==========================================
const loaderCanvas = document.getElementById('loader-canvas');
let loaderCtx = null;
let loaderAnimId = null;
let loaderShapes = [];

function initLoaderAnimation() {
    if (!loaderCanvas) return;
    loaderCtx = loaderCanvas.getContext('2d');
    
    // Gestione Alta Risoluzione (Anti-aliasing)
    const dpr = window.devicePixelRatio || 1;
    const rect = loaderCanvas.getBoundingClientRect();
    loaderCanvas.width = rect.width * dpr;
    loaderCanvas.height = rect.height * dpr;
    loaderCtx.scale(dpr, dpr);
    
    // Loop di animazione
    animateLoader();
}

// Classe per le forme geometriche
class NeonShape {
    constructor() {
        this.reset();
        // Parte già un po' avanti nel tunnel per non avere vuoti all'inizio
        this.scale = Math.random() * 0.5; 
    }

    reset() {
        this.scale = 0;
        this.speed = 0.005 + Math.random() * 0.005; // Velocità crescita
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
        // Alterna tra Ciano (Primary) e Magenta (Danger) o Bianco
       // Blu elettrico, Giallo puro, Verde Fluo
const colors = ['#2C75FF', '#FFFF00', '#39FF14'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        // Forma: 0 = quadrato, 1 = esagono, 2 = triangolo
        this.type = Math.floor(Math.random() * 3); 
    }

    update() {
        this.scale += this.speed;
        this.speed *= 1.02; // Accelerazione esponenziale (effetto tunnel)
        this.rotation += this.rotationSpeed;
        
        // Se esce dallo schermo (scale > 2 circa), ricicla
        if (this.scale > 2.5) {
            this.reset();
        }
    }

    draw(ctx, w, h) {
        const cx = w / 2;
        const cy = h / 2;
        const maxDim = Math.max(w, h);
        const size = this.scale * maxDim; // Dimensione in px
        
        // Calcola opacità: trasparente al centro, solido mentre si avvicina, trasparente alla fine
        let alpha = 0;
        if (this.scale < 0.2) alpha = this.scale * 5; // Fade in
        else if (this.scale > 1.5) alpha = 1 - (this.scale - 1.5); // Fade out
        else alpha = 1;

        if (alpha <= 0) return;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.rotation);
        
        ctx.beginPath();
        const lineWidth = 2 + (this.scale * 5); // Linea diventa più spessa avvicinandosi
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = alpha;
        
        // Effetto Neon Glow
        ctx.shadowBlur = 15 * this.scale; 
        ctx.shadowColor = this.color;

        // Disegna la forma
        if (this.type === 0) { // Quadrato
            const s = size / 2;
            ctx.rect(-s, -s, size, size);
        } else if (this.type === 1) { // Esagono
            const r = size / 2;
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const x = r * Math.cos(angle);
                const y = r * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
        } else if (this.type === 2) { // Triangolo
            const r = size / 2;
            for (let i = 0; i < 3; i++) {
                const angle = (Math.PI * 2 / 3) * i - Math.PI/2;
                const x = r * Math.cos(angle);
                const y = r * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
        }

        ctx.stroke();
        ctx.restore();
    }
}

function animateLoader() {
    if (!loaderCtx) return;
    
    const w = loaderCanvas.getBoundingClientRect().width;
    const h = loaderCanvas.getBoundingClientRect().height;
    
    // Pulisci con leggera scia (opzionale, qui puliamo tutto per nitidezza)
    loaderCtx.clearRect(0, 0, w, h);

    // Gestisci numero forme
    if (loaderShapes.length < 15) {
        loaderShapes.push(new NeonShape());
    }

    loaderShapes.forEach(shape => {
        shape.update();
        shape.draw(loaderCtx, w, h);
    });

    loaderAnimId = requestAnimationFrame(animateLoader);
}

// Avvia animazione appena il JS è caricato
window.addEventListener('DOMContentLoaded', initLoaderAnimation);
// Gestisce resize finestra durante il loading
window.addEventListener('resize', () => {
    if (loaderCanvas && loaderCtx) {
        initLoaderAnimation(); // Ricalcola dimensioni
    }
});

function startGame() {
    resizeCanvases(); 
    initGame(1, true); 
    
    setTimeout(() => {
        player.dir = {x: 0, y: 0}; 
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
    if(loadingText) { 
        loadingText.innerText = "PRONTO!"; // Cambiamo testo
        loadingText.style.color = "#00ff00"; 
        loadingText.style.marginBottom = "20px"; // Un po' di spazio per il bottone
    }
    if(loadingBar) loadingBar.style.width = "100%";
    
    setTimeout(() => {
        // Nascondiamo la barra e il container della barra
        if(loadingBarContainer) loadingBarContainer.style.display = 'none';
        
        // Mostriamo il pulsante START
        if(startBtn) {
            startBtn.classList.remove('hidden'); // Rimuove classe hidden se presente
            startBtn.style.display = 'inline-block'; // Forza la visualizzazione
            startBtn.style.position = 'relative'; // Assicura che stia nel flusso
            startBtn.style.zIndex = '100'; // Assicura che sia cliccabile sopra il canvas
        }

        // NOTA: Ho rimosso il blocco che fermava l'animazione qui.
        // L'animazione continua finché non clicchi il pulsante.
        
    }, 500);
}

if(startBtn) {
    startBtn.addEventListener('click', () => {
        // 1. TENTATIVO DI FULLSCREEN (Deve essere la prima cosa)
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(err => console.log("Fullscreen bloccato:", err));
        } else if (elem.webkitRequestFullscreen) { /* Safari */
            elem.webkitRequestFullscreen();
        }

        // 2. Ferma l'animazione del Canvas
        if (loaderAnimId) {
            cancelAnimationFrame(loaderAnimId);
            loaderAnimId = null;
        }
        loaderShapes = []; // Pulisce l'array

        // 3. Nascondi schermata di caricamento
        const loadingScreen = document.getElementById('loading-screen');
        if(loadingScreen) loadingScreen.style.display = 'none';
        
        // 4. Avvia il gioco
        startGame();
    });
}

if(focusBtn) {
    focusBtn.addEventListener('click', () => {
        // 1. Attiva/Disattiva la classe CSS sul body
        document.body.classList.toggle('focus-active');
        
        // 2. Forza il browser in Fullscreen (opzionale, ma consigliato per Focus Mode)
        if (document.body.classList.contains('focus-active')) {
             const elem = document.documentElement;
             if (elem.requestFullscreen) elem.requestFullscreen().catch(e => {});
        } else {
             // Se esci dalla focus mode, esci anche dal fullscreen? (A tua scelta)
             if (document.exitFullscreen) document.exitFullscreen().catch(e => {});
        }

        // 3. IMPORTANTE: Forza il ricalcolo delle dimensioni del Canvas
        // Diamo un piccolo ritardo per permettere al CSS di applicarsi
        setTimeout(resizeCanvases, 50);
    });
}