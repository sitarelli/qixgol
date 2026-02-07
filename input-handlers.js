//13-LISTENER

// --- TASTIERA (RESTO INVARIATO) ---
const keysDown = new Set();
window.addEventListener('keydown', (e)=>{
    if(e.repeat) return; 

    cheatBuffer += e.key.toLowerCase();
    if (cheatBuffer.length > 5) {
        cheatBuffer = cheatBuffer.slice(-5);
    }
    if (cheatBuffer === "iddqd" && !isGodMode) {
        isGodMode = true;
        cheatDetected = true;
        spawnFloatingText("GOD MODE ACTIVE", player.x, player.y, 30, '#ffff00', 4000);
        console.log("God Mode Activated!");
    }

    // ⌨️ FRECCE PER PROSEGUIRE LIVELLO O RIAVVIARE DOPO GAME OVER
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
        // Se siamo in vittoria e il bottone è visibile, vai al prossimo livello
        if(isVictory && nextLevelContainer && nextLevelContainer.style.display === 'block') {
            initGame(level + 1, false);
            e.preventDefault();
            return;
        }
        
        // Se è apparso il game over e sono passati almeno 5 secondi, riavvia
        if(gameOverScreen && !gameOverScreen.classList.contains('hidden')) {
            const timeElapsed = Date.now() - gameOverTime;
            if(timeElapsed >= 5000) {  // 5000ms = 5 secondi
                window.location.reload();  // Riavvia il gioco
                e.preventDefault();
                return;
            }
        }
        
        // Altrimenti comportamento normale
        keysDown.add(e.key); 
        tryPlayMusic(); 
        if (audioCtx.state === 'suspended') { audioCtx.resume(); } 
        setPlayerDirFromKeys(); 
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e)=>{ if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){ keysDown.delete(e.key); setPlayerDirFromKeys(); e.preventDefault(); } });
function setPlayerDirFromKeys(){
    const order = ['ArrowUp','ArrowRight','ArrowDown','ArrowLeft']; let found = {x:0,y:0};
    for(let k of order){ if(keysDown.has(k)){ if(k==='ArrowUp') found = {x:0,y:-1}; if(k==='ArrowDown') found = {x:0,y:1}; if(k==='ArrowLeft') found = {x:-1,y:0}; if(k==='ArrowRight') found = {x:1,y:0}; break; }}
    player.dir = found;
}

// ==========================================
// NUOVO CONTROLLER "RELATIVE TOUCH"
// ==========================================
// Simula la tastiera: tocca ovunque per muovere, rilascia per fermare.

let touchStartX = 0;
let touchStartY = 0;
let isTouching = false;
const TOUCH_THRESHOLD = 15; // Sensibilità: pixel minimi per rilevare movimento
let lastDirX = 0;
let lastDirY = 0;

function setupMobileControls() {
    // 1. Creiamo il layer invisibile per il touch
    let touchLayer = document.getElementById('touch-layer');
    if (!touchLayer) {
        touchLayer = document.createElement('div');
        touchLayer.id = 'touch-layer';
        document.body.appendChild(touchLayer);
    }

    // 2. Aggiungiamo i listener per catturare il tocco
    touchLayer.addEventListener('touchstart', handleTouchStart, { passive: false });
    touchLayer.addEventListener('touchmove', handleTouchMove, { passive: false });
    touchLayer.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    console.log("Relative Touch Controls Activated");
}

function handleTouchStart(e) {
    // Evita scroll e zoom del browser
    e.preventDefault(); 
    
    // Attiviamo l'audio se è il primo tocco
    tryPlayMusic();
    if (audioCtx.state === 'suspended') { audioCtx.resume(); }

    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    isTouching = true;
    
    // Reset tracking direzione
    lastDirX = 0; 
    lastDirY = 0;
}

function handleTouchMove(e) {
    if (!isTouching) return;
    e.preventDefault(); 

    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartX;
    const diffY = touch.clientY - touchStartY;

    // Deadzone: Se il movimento è troppo piccolo (tremolio), ignoralo
    if (Math.abs(diffX) < TOUCH_THRESHOLD && Math.abs(diffY) < TOUCH_THRESHOLD) return;

    // LOGICA SNAP A 90 GRADI
    // Capisce se ti stai muovendo più in orizzontale o verticale
    if (Math.abs(diffX) > Math.abs(diffY)) {
        // Movimento ORIZZONTALE
        if (diffX > 0) cambioDirezione(1, 0); // DESTRA
        else cambioDirezione(-1, 0);          // SINISTRA
    } else {
        // Movimento VERTICALE
        if (diffY > 0) cambioDirezione(0, 1); // GIU
        else cambioDirezione(0, -1);          // SU
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    isTouching = false;
    
    // STOP IMMEDIATO AL RILASCIO (Fondamentale per il feeling "tastiera")
    if (typeof player !== 'undefined') {
        player.dir = { x: 0, y: 0 };
    }
}

function cambioDirezione(x, y) {
    if (typeof player === 'undefined') return;

    // Applica solo se la direzione è diversa dall'ultima registrata
    // Questo evita di sparare mille eventi se il dito trema leggermente
    if (player.dir.x !== x || player.dir.y !== y) {
        player.dir = { x: x, y: y };
        
        // Feedback tattile (vibrazione) quando cambi direzione
        if (navigator.vibrate && (lastDirX !== x || lastDirY !== y)) {
            navigator.vibrate(10); 
        }
        
        lastDirX = x;
        lastDirY = y;
        
        // NOTA: Non resettiamo touchStartX/Y qui. 
        // Questo rende il joystick "relativo all'inizio del tocco".
        // Se volessi un joystick che ti segue ("re-centering"), dovresti resettarli qui.
    }
}

// Avvia i controlli appena la pagina è pronta
window.addEventListener('load', setupMobileControls);