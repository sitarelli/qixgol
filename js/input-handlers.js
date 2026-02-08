//13-LISTENER

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

let touchStartX = 0; let touchStartY = 0;
function isButton(e) { return e.target.id === 'next-level-btn' || e.target.closest('#next-level-btn') || e.target.closest('#game-over-screen') || e.target.closest('.turn-btn'); }
gameWrapper.addEventListener('touchstart', e => { if (isButton(e)) return; tryPlayMusic(); if (audioCtx.state === 'suspended') { audioCtx.resume(); } touchStartX = e.changedTouches[0].screenX; touchStartY = e.changedTouches[0].screenY; e.preventDefault(); }, {passive: false});
gameWrapper.addEventListener('touchmove', e => { if (isButton(e)) return; e.preventDefault(); }, {passive: false});
gameWrapper.addEventListener('touchend', e => { if (isButton(e)) return; e.preventDefault(); let touchEndX = e.changedTouches[0].screenX; let touchEndY = e.changedTouches[0].screenY; handleSwipe(touchEndX - touchStartX, touchEndY - touchStartY); }, {passive: false});
function handleSwipe(dx, dy) { if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return; if (Math.abs(dx) > Math.abs(dy)) player.dir = { x: dx > 0 ? 1 : -1, y: 0 }; else player.dir = { x: 0, y: dy > 0 ? 1 : -1 }; }

const turnLeftBtn = document.getElementById('btn-turn-left');
const turnRightBtn = document.getElementById('btn-turn-right');

function handleMobileTurn(direction) {
    tryPlayMusic();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const oldDir = player.dir;
    let newDir = {x: 0, y: 0};

    if (oldDir.x === 0 && oldDir.y === 0) {
         newDir = {x: 0, y: -1}; 
    } else {
        if (direction === 'right') { 
            newDir = { x: -oldDir.y, y: oldDir.x };
        } else { 
            newDir = { x: oldDir.y, y: -oldDir.x };
        }
    }
    player.dir = newDir;
}

if (turnLeftBtn) {
    const action = (e) => { e.preventDefault(); handleMobileTurn('left'); };
    turnLeftBtn.addEventListener('touchstart', action, { passive: false });
    turnLeftBtn.addEventListener('mousedown', action);
}
if (turnRightBtn) {
    const action = (e) => { e.preventDefault(); handleMobileTurn('right'); };
    turnRightBtn.addEventListener('touchstart', action, { passive: false });
    turnRightBtn.addEventListener('mousedown', action);
}

window.addEventListener('load', () => {
    const container = document.getElementById('joystick-container');
    const stick = document.getElementById('joystick-stick');
    
    let active = false;
    let centerX, centerY;
    const maxDist = 35; // Raggio visuale stick

    // Funzione che calcola la direzione basandosi sull'ANGOLO (più preciso)
    const updateDirection = (clientX, clientY) => {
        const dx = clientX - centerX;
        const dy = clientY - centerY;
        const dist = Math.sqrt(dx*dx + dy*dy);

        // 1. Muovi lo stick visivo
        const visualDist = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx); // Angolo in radianti
        
        const moveX = Math.cos(angle) * visualDist;
        const moveY = Math.sin(angle) * visualDist;
        stick.style.transform = `translate(${moveX}px, ${moveY}px)`;

        // 2. Logica di Gioco (Solo se ci siamo mossi di almeno 5px)
        if (dist > 5) {
            // Convertiamo l'angolo in gradi (0 a 360) per facilità
            let degrees = angle * (180 / Math.PI);
            
            // Assegnazione basata su 4 settori (con sovrapposizione diagonale minima)
            if (degrees > -45 && degrees <= 45) {
                nextDir = {x: 1, y: 0}; // DESTRA
            } else if (degrees > 45 && degrees <= 135) {
                nextDir = {x: 0, y: 1}; // GIÙ
            } else if (degrees > 135 || degrees <= -135) {
                nextDir = {x: -1, y: 0}; // SINISTRA
            } else if (degrees > -135 && degrees <= -45) {
                nextDir = {x: 0, y: -1}; // SU
            }
        }
    };


//14-LISTENER
 // --- EVENTI JOYSTICK ---
    const startInput = (e) => {
        if (e.cancelable) e.preventDefault();
        active = true;
        const rect = container.getBoundingClientRect();
        centerX = rect.left + rect.width / 2;
        centerY = rect.top + rect.height / 2;
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        updateDirection(clientX, clientY);
    };

    const moveInput = (e) => {
        if (!active) return;
        if (e.cancelable) e.preventDefault();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        updateDirection(clientX, clientY);
    };

    const stopInput = () => {
        active = false;
        stick.style.transform = `translate(0px, 0px)`;
        // AGGIUNTO: Ferma la palla quando molli il joystick
        if (typeof player !== 'undefined') player.dir = { x: 0, y: 0 };
    };

    container.addEventListener('touchstart', startInput, {passive: false});
    document.addEventListener('touchmove', moveInput, {passive: false});
    document.addEventListener('touchend', stopInput);
    container.addEventListener('mousedown', startInput);
    document.addEventListener('mousemove', moveInput);
    document.addEventListener('mouseup', stopInput);

    // ===============================
    // MOBILE FALLBACK DIRECTION FIX
    // ===============================
    let touchStartX2 = 0;
    let touchStartY2 = 0;
    let touchActive2 = false;

    window.addEventListener('touchstart', (e) => {
        if (e.target.closest('button')) return;
        const t = e.touches[0];
        touchStartX2 = t.clientX;
        touchStartY2 = t.clientY;
        touchActive2 = true;
        tryPlayMusic();
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
        if (!touchActive2) return;
        if (e.cancelable) e.preventDefault();
        const t = e.touches[0];
        const dx = t.clientX - touchStartX2;
        const dy = t.clientY - touchStartY2;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        const DEADZONE = 12;
        if (absX < DEADZONE && absY < DEADZONE) return;
        if (absX > absY) {
            player.dir = { x: dx > 0 ? 1 : -1, y: 0 };
        } else {
            player.dir = { x: 0, y: dy > 0 ? 1 : -1 };
        }
    }, { passive: false });

    window.addEventListener('touchend', () => {
        touchActive2 = false;
        // AGGIUNTO: Ferma la palla quando molli lo swipe
        if (typeof player !== 'undefined') player.dir = { x: 0, y: 0 };
    });

    // ===============================
    // TASTI A SCHERMO
    // ===============================
    const dpadMoves = {
        'btn-up': {x: 0, y: -1},
        'btn-down': {x: 0, y: 1},
        'btn-left': {x: -1, y: 0},
        'btn-right': {x: 1, y: 0}
    };

    Object.keys(dpadMoves).forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            const start = (e) => {
                if (e.cancelable) e.preventDefault();
                if (typeof player !== 'undefined') player.dir = dpadMoves[id];
            };
            const stop = (e) => {
                if (e.cancelable) e.preventDefault();
                if (typeof player !== 'undefined') player.dir = { x: 0, y: 0 };
            };
            btn.addEventListener('touchstart', start, { passive: false });
            btn.addEventListener('mousedown', start);
            btn.addEventListener('touchend', stop, { passive: false });
            btn.addEventListener('mouseup', stop);
            btn.addEventListener('mouseleave', stop);
        }
    });

}); // Fine del file
