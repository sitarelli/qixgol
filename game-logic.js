function initGame(lvl, resetLives = true){
    if(gameOverScreen) gameOverScreen.classList.add('hidden');
    level = lvl;


//08-BACKGROUND

// --- NUOVO CODICE: CAMBIO SFONDO PAGINA ---
    // Calcola un numero da 1 a 20 basato sul livello (es. liv 21 usa pattern 1)
    let patternIndex = ((level - 1) % 20) + 1;
    document.body.style.backgroundImage = `url('png/pattern${patternIndex}.png')`;
    // ------------------------------------------

//09-MUSIC
// Gestione Musica
if (bgMusic) {
    // Creiamo un ciclo di 24 livelli (dal 25-esimo si ricomincia)
    let ciclo = ((level - 1) % 24) + 1; 
    let nuovaMusica;

    if (ciclo >= 15) {
        nuovaMusica = 'part4.mp3';  // Livelli 20-24
    } else if (ciclo >= 10) {
        nuovaMusica = 'part3.mp3';  // Livelli 15-19
    } else if (ciclo >= 5) {
        nuovaMusica = 'part2.mp3';  // Livelli 5-14
    } else {
        nuovaMusica = 'soundtrack.mp3'; // Livelli 1-4
    }

    // Se il brano calcolato è diverso da quello attualmente in riproduzione, lo cambia
    if (!bgMusic.src.includes(nuovaMusica)) {
        bgMusic.src = nuovaMusica;
        bgMusic.load();
        if (isMusicOn) {
            bgMusic.play().catch(e => console.log("Errore musica:", e));
        }
    }
}


//10-REGOLE

    if (resetLives) { 
        lives = START_LIVES; 
        score = 0; 
        pickRandomSkin(); 
        isGodMode = false;
        cheatDetected = false; 
    }
    
    playerSpeedMult = 1.8;
    moveAccumulator = 0;

    levelStartTime = Date.now();
    flashList = []; particles = []; floatingTexts = [];
    currentPercent = 0; playerAngle = 0; playerAnimScale = 0; shakeIntensity = 0;
    
    isPlaying = true; isDying = false; isVictory = false;
    if(nextLevelContainer) nextLevelContainer.style.display = 'none'; 
    gameWrapper.style.cursor = 'none';

    if(cameraLayer) cameraLayer.style.transform = 'translate(0px, 0px) scale(1)';

    // --- IMMAGINI INFINITE (Rotazione 1-100) ---
    let imgIndex = ((level - 1) % TOTAL_IMAGES) + 1;
    let imgSource = `img/img${imgIndex}.jpg`;

    currentBgImage = new Image();
    currentBgImage.src = imgSource;
    currentBgImage.onload = () => { redrawStaticLayers(); };
    currentBgImage.onerror = () => { 
        currentBgImage.src = `img${imgIndex}.png`; 
        currentBgImage.onload = () => redrawStaticLayers();
    };

    initGrid(); 
    stixList = [];
    player.x = Math.floor(W/2); player.y = H-1;
    player.drawing = false; 
    player.dir = {x:0,y:0}; 
    
    qixList = [];
    evilPlayers = []; 

    // --- DIFFICOLTÀ DINAMICA INFINITA ---
    
    // Ragni: Aumentano ogni 3 livelli. Min 1, Max 15.
    let numSpiders = Math.min(15, 1 + Math.floor((level - 1) / 3));

    for(let i=0; i<numSpiders; i++) {
        let startX = Math.floor(W * 0.3) + (i * 20);
        let startY = Math.floor(H * 0.3) + (i * 10);
        if(startX >= W-2) startX = W-10; if(startY >= H-2) startY = H-10;
        
        // Velocità base aumenta leggermente coi livelli
        let baseSpeed = 0.4 + (level * 0.02);

        qixList.push({
            x: startX, y: startY,
            vx: (Math.random() * 0.8 + baseSpeed) * (Math.random() < 0.5 ? -1 : 1),
            vy: (Math.random() * 0.8 + baseSpeed) * (Math.random() < 0.5 ? -1 : 1)
        });
    }

    // Palle Malvagie: 0 fino al livello 8, poi aumentano ogni 5 livelli (max 5)
    let numEvilBalls = 0;
    if (level >= 9) {
        numEvilBalls = 1 + Math.floor((level - 9) / 5);
        if (numEvilBalls > 5) numEvilBalls = 5;
    }

    for (let i = 0; i < numEvilBalls; i++) {
        let ex = Math.floor(W/2) + (Math.random() > 0.5 ? 40 : -40);
        let ey = Math.floor(H/3);
        evilPlayers.push({
            x: ex, y: ey,
            vx: (Math.random() * 0.9 + 0.5) * (Math.random() < 0.5 ? -1 : 1),
            vy: (Math.random() * 0.9 + 0.5) * (Math.random() < 0.5 ? -1 : 1),
            angle: 0
        });
    }

    resizeCanvases();
    updateUI();
    tryPlayMusic(); 

    if(level === 1) {
        spawnFloatingText(generateMissionName(), W/2, H/2, 30, currentSkin.primary, 2500);
        spawnFloatingText(`SKIN: ${currentSkin.name}`, W/2, H/2 + 20, 16, '#888', 2000);
    }
    else if (level % 10 === 0) {
        spawnFloatingText("BOSS BATTLE", W/2, H/2, 40, '#ff0000', 4000);
    }
    else {
        spawnFloatingText(`LEVEL ${level}`, W/2, H/2, 30, '#ffffff', 2000);
    }

    requestAnimationFrame(gameLoop);
    
   // if (window.innerWidth <= MOBILE_BREAKPOINT) {
    //    setTimeout(() => {
     //       if(player.dir.x === 0 && player.dir.y === 0) player.dir = {x: 0, y: -1};
     //   }, 300);
   // }
}

function updateUI(){
    const lvlEl = document.getElementById('ui-level');
    const livEl = document.getElementById('ui-lives');
    const perEl = document.getElementById('ui-percent');
    const scrEl = document.getElementById('ui-score');

    if(lvlEl) lvlEl.innerText = level;
    if(livEl) livEl.innerText = lives;
    if(perEl) perEl.innerText = Math.floor(currentPercent) + "%";
    if(scrEl) scrEl.innerText = score;
}

function getClaimPercent(){
    let claimed = 0;
    for(let i=0;i<grid.length;i++) if(grid[i]===CELL_CLAIMED) claimed++;
    return claimed / grid.length * 100;
}

function closeStixAndFill(){
    if(stixList.length===0) return;

    for (let p of stixList) {
        grid[idx(p.x, p.y)] = CELL_CLAIMED;
    }

    let visited = new Uint8Array(W * H);
    let areas = [];

    for (let i = 0; i < W * H; i++) {
        if (grid[i] === CELL_UNCLAIMED && !visited[i]) {
            let currentArea = [];
            let stack = [i];
            visited[i] = 1;

            while (stack.length > 0) {
                let curr = stack.pop();
                currentArea.push(curr);
                let cx = curr % W;
                let cy = Math.floor(curr / W);

                const neighbors = [];
                if (cx > 0) neighbors.push(curr - 1);
                if (cx < W - 1) neighbors.push(curr + 1);
                if (cy > 0) neighbors.push(curr - W);
                if (cy < H - 1) neighbors.push(curr + W);

                for (let n of neighbors) {
                    if (grid[n] === CELL_UNCLAIMED && !visited[n]) {
                        visited[n] = 1;
                        stack.push(n);
                    }
                }
            }
            areas.push(currentArea);
        }
    }

    if (areas.length === 0) return 0; 
    areas.sort((a, b) => b.length - a.length);

    let mainArea = areas[0]; 
    let capturedAreas = areas.slice(1); 

    let filledCount = 0;
    let rectSizeX = Math.ceil(scaleX);
    let rectSizeY = Math.ceil(scaleY);

    gridCtx.globalCompositeOperation = 'destination-out';
    gridCtx.beginPath();

    for (let area of capturedAreas) {
        for (let idxVal of area) {
            grid[idxVal] = CELL_CLAIMED;
            filledCount++;
            flashList.push({idx: idxVal, timer: 15});

            let x = idxVal % W;
            let y = Math.floor(idxVal / W);
            gridCtx.rect(Math.floor(x*scaleX), Math.floor(y*scaleY), rectSizeX, rectSizeY);
        }
    }
    gridCtx.fill();
    gridCtx.globalCompositeOperation = 'source-over'; 

    stixList = []; 
    let killed = false;

    // RAGNI
    for (let i = qixList.length - 1; i >= 0; i--) {
        let q = qixList[i];
        let qIdx = idx(Math.floor(q.x), Math.floor(q.y));
        if (grid[qIdx] === CELL_CLAIMED) {
            // 💥 EFFETTO SPETTACOLARE MORTE RAGNO
            spawnParticles(q.x, q.y, 'spider_death'); // Esplosione particelle
            spawnParticles(q.x, q.y, 'explosion'); // Esplosione base sovrapposta
            addShake(6); // Scossa schermo
            
            playSound('kill'); 
            qixList.splice(i, 1);
            score += POINTS_KILL_SPIDER;
            spawnFloatingText("💀 ENEMY KILLED! 💀", q.x, q.y, 24, '#ff0000', 2500);
            spawnFloatingText("⚡ SPEED UP! ⚡", q.x, q.y + 20, 20, '#00ffff', 2000);
            playerSpeedMult = Math.min(4.5, playerSpeedMult + SPEED_BOOST_PER_KILL);
            killed = true;
        }
    }

// PALLE NEMICHE
    for (let i = evilPlayers.length - 1; i >= 0; i--) {
        let ep = evilPlayers[i];
        let epIdx = idx(Math.floor(ep.x), Math.floor(ep.y));
        if (grid[epIdx] === CELL_CLAIMED) {
            
            // 🔥🔥🔥 EFFETTO SUPER SPETTACOLARE PALLA MALVAGIA 🔥🔥🔥
            spawnParticles(ep.x, ep.y, 'evil_death'); // Esplosione principale
            spawnParticles(ep.x, ep.y, 'explosion'); // Esplosione secondaria
            setTimeout(() => spawnParticles(ep.x, ep.y, 'mega_fill'), 80); // Esplosione dorata ritardata
            addShake(12); // Scossa potente!

            // --- SUONO TRIPLO (Effetto Bonus Epico) ---
            playSound('kill'); 
            setTimeout(() => playSound('kill'), 100); 
            setTimeout(() => playSound('win'), 200); // Aggiunge suono vittoria per enfasi

            // --- LOGICA DI GIOCO ---
            evilPlayers.splice(i, 1);
            score += POINTS_KILL_EVIL;
            lives++;     // Bonus vita!
            updateUI();  // Aggiorna il numero a schermo

            // --- FEEDBACK TESTUALE EPICO ---
            spawnFloatingText("🏆 LEGENDARY KILL! 🏆", ep.x, ep.y - 35, 32, '#ffd700', 3500);
            spawnFloatingText("⭐ LIFE UP! +1 ⭐", ep.x, ep.y - 10, 28, '#00ff00', 3000);
            spawnFloatingText("⚡ SPEED BOOST! ⚡", ep.x, ep.y + 15, 22, '#00ffff', 2500);

            playerSpeedMult = Math.min(4.5, playerSpeedMult + SPEED_BOOST_PER_KILL);
            killed = true;
        }
    }

    if(filledCount > 0) {
        if (!killed) playSound('fill'); 
        score += POINTS_PER_FILL; 
        let newPercent = getClaimPercent(); 
        spawnFloatingText(Math.floor(newPercent) + "%", player.x, player.y);
        currentPercent = newPercent; 
        
        // 🎆 EFFETTI VISIVI SPETTACOLARI in base all'area chiusa
        if(filledCount > 200) {
            // MEGA AREA - Esplosione dorata gigante + FLASH ORO!
            spawnParticles(player.x, player.y, 'mega_fill');
            spawnFloatingText("🌟 MEGA COMBO! 🌟", player.x, player.y - 15, 28, '#ffff00', 3000);
            triggerScreenFlash('#ffff00', 0.5); // Flash oro
            addShake(8);
        }
        else if(filledCount > 100) {
            // GRANDE AREA - Esplosione brillante + FLASH VERDE
            spawnParticles(player.x, player.y, 'fill_spark', filledCount);
            spawnFloatingText("✨ BIG CATCH! ✨", player.x, player.y - 10, 22, '#00ffff', 2500);
            triggerScreenFlash('#00ff00', 0.3); // Flash verde
            addShake(5);
        }
        else if(filledCount > 50) {
            // MEDIA AREA - Scintille
            spawnParticles(player.x, player.y, 'fill_spark', filledCount);
            addShake(3);
        }
        else {
            // PICCOLA AREA - Effetto base migliorato
            spawnParticles(player.x, player.y, 'fill_spark', filledCount);
        }
    }

    updateUI(); 

    if (getClaimPercent() >= WIN_PERCENT || (qixList.length === 0 && evilPlayers.length === 0)) { 
        winLevel(); 
    }

    return filledCount;
}

function checkCollisions(){
    for (let q of qixList) {
        let qixCellX = Math.floor(q.x); let qixCellY = Math.floor(q.y);
        if(inBounds(qixCellX,qixCellY) && grid[idx(qixCellX,qixCellY)]===CELL_STIX){ triggerDeath(q.x, q.y); return; }
        if(player.drawing){ if(qixCellX===player.x && qixCellY===player.y){ triggerDeath(player.x, player.y); return; } }
    }
    
    for (let ep of evilPlayers) {
        let dx = ep.x - player.x;
        let dy = ep.y - player.y;
        let distance = Math.sqrt(dx*dx + dy*dy);
        
        if(distance < 1.5) {
            triggerDeath(player.x, player.y);
            return;
        }
        
        let epCellX = Math.floor(ep.x); let epCellY = Math.floor(ep.y);
        if(inBounds(epCellX,epCellY) && grid[idx(epCellX,epCellY)]===CELL_STIX) {
            triggerDeath(ep.x, ep.y);
            return;
        }
    }
}


function triggerDeath(impactX, impactY) {
    if (isDying) return;
    if (isGodMode) return;

    isDying = true;

    // 📍 POSIZIONE REALE DEL PLAYER (fix definitivo)
    const px = player.x;
    const py = player.y;

    // 💥 Esplosione della palla
    spawnParticles(px, py, 'player_death');

    // 🔥 Esplosione secondaria
    spawnParticles(px, py, 'explosion');

    // 💨 Fumo ESATTAMENTE dove la palla è esplosa
    setTimeout(() => {
        spawnParticles(px, py, 'smoke');
    }, 120);

    setTimeout(() => {
        spawnParticles(px, py, 'smoke');
    }, 320);

    // 🔴 Flash + shake
    triggerScreenFlash('#ff0000', 0.6);
    addShake(25);

    playSound('hit');

    setTimeout(() => {
        resetAfterDeath();
    }, 2000);
}



function resetAfterDeath(){
    lives -= 1; updateUI(); isDying = false; 
    if(lives <= 0){
        isPlaying = false; if(bgMusic) bgMusic.pause();
        if(gameoverSound) { gameoverSound.currentTime = 0; gameoverSound.play().catch(e => console.log(e)); }
        gestisciFinePartita(false);
    } else {
        stixList = []; player.drawing = false; player.dir = {x:0,y:0}; player.x = Math.floor(W/2); player.y = H-1;
        playerAnimScale = 0; 
        
        playerSpeedMult = 1.8; 
        moveAccumulator = 0;

        // --- MODIFICA QUI ---
        // INVECE DI RIGENERARE TUTTO, MANTENIAMO QUELLI VIVI
        // E LI SPOSTIAMO SOLO ALLA POSIZIONE INIZIALE PER SICUREZZA
        
        // 1. Gestione RAGNI sopravvissuti
        // (Rimuoviamo: qixList = [] e il ciclo for di generazione)
        qixList.forEach((q, i) => {
            // Li rimettiamo alla posizione di partenza calcolata come all'inizio
            // per evitare che siano sopra al giocatore al respawn
            let startX = Math.floor(W * 0.3) + (i * 20); 
            let startY = Math.floor(H * 0.3) + (i * 10);
            if(startX >= W-2) startX = W-10; 
            if(startY >= H-2) startY = H-10;
            
            q.x = startX;
            q.y = startY;
            // Opzionale: se vuoi resettare anche la direzione, scommenta sotto, 
            // altrimenti mantengono la loro inerzia caotica:
            // let baseSpeed = 0.4 + (level * 0.02);
            // q.vx = (Math.random() * 0.8 + baseSpeed) * (Math.random() < 0.5 ? -1 : 1);
            // q.vy = (Math.random() * 0.8 + baseSpeed) * (Math.random() < 0.5 ? -1 : 1);
        });

        // 2. Gestione PALLE MALVAGIE sopravvissute
        // (Rimuoviamo: evilPlayers = [] e il ciclo for di generazione)
        evilPlayers.forEach(ep => {
            let ex = Math.floor(W/2) + (Math.random() > 0.5 ? 40 : -40);
            let ey = Math.floor(H/3);
            ep.x = ex;
            ep.y = ey;
            ep.angle = 0;
        });
        
        // Pulizia griglia dai tracciati non finiti (rimane invariato)
        for(let i=0; i<grid.length; i++) {
            if(grid[i]===CELL_STIX) {
                grid[i] = CELL_UNCLAIMED;
            }
        }
        
        redrawStaticLayers();
        flashList = [];
    }
}

function moveQix(){
    for (let q of qixList) {
        let nx = q.x + q.vx; let ny = q.y + q.vy;
        if(!inBounds(Math.floor(nx), Math.floor(q.y)) || grid[idx(Math.floor(nx), Math.floor(q.y))]===CELL_CLAIMED) q.vx *= -1;
        if(!inBounds(Math.floor(q.x), Math.floor(ny)) || grid[idx(Math.floor(q.x), Math.floor(ny))]===CELL_CLAIMED) q.vy *= -1;
        q.x += q.vx; q.y += q.vy; spawnParticles(q.x, q.y, 'spider');
        if(Math.random() < 0.02) { q.vx += (Math.random() - 0.5) * 1.5; q.vy += (Math.random() - 0.5) * 1.5; }
        
        // MODIFICA: Difficoltà e Cap Velocità
        const difficultyMultiplier = Math.min(3.0, 1 + ((level - 1) * 0.05)); 
        const maxSpeed = 1.8 * difficultyMultiplier; 
        const s = Math.hypot(q.vx, q.vy); if(s > maxSpeed){ q.vx *= maxSpeed/s; q.vy *= maxSpeed/s; }
    }
    
    for (let ep of evilPlayers) {
        let nx = ep.x + ep.vx; let ny = ep.y + ep.vy;
        if(!inBounds(Math.floor(nx), Math.floor(ep.y)) || grid[idx(Math.floor(nx), Math.floor(ep.y))]===CELL_CLAIMED) ep.vx *= -1;
        if(!inBounds(Math.floor(ep.x), Math.floor(ny)) || grid[idx(Math.floor(ep.x), Math.floor(ny))]===CELL_CLAIMED) ep.vy *= -1;
        ep.x += ep.vx; ep.y += ep.vy; 
        if(Math.random() < 0.02) { ep.vx += (Math.random() - 0.5) * 1.5; ep.vy += (Math.random() - 0.5) * 1.5; }
        
        const maxSpeed = 1.8 + (level * 0.05); 
        const s = Math.hypot(ep.vx, ep.vy); if(s > maxSpeed){ ep.vx *= maxSpeed/s; ep.vy *= maxSpeed/s; }
    }
}

function winLevel() {
    isPlaying = false; 
    isVictory = true;
    playSound('win');
    
    let levelScore = POINTS_PER_LEVEL; 
    let timeTakenSeconds = (Date.now() - levelStartTime) / 1000;
    let timeBonus = Math.max(0, MAX_TIME_BONUS - Math.floor(timeTakenSeconds * 5));
    score += (levelScore + timeBonus);
    
    // 🎆 TRIPLE FLASH EPICO
    triggerScreenFlash('#ffffff', 0.9);
    setTimeout(() => triggerScreenFlash('#ffd700', 0.8), 150);
    setTimeout(() => triggerScreenFlash('#ffffff', 0.7), 300);
    
    // Shake potente
    addShake(15);
    
    // Esplosioni fireworks agli angoli dopo i flash
    setTimeout(() => {
        spawnParticles(10, 10, 'mega_fill');
        spawnParticles(W - 10, 10, 'mega_fill');
        spawnParticles(10, H - 10, 'mega_fill');
        spawnParticles(W - 10, H - 10, 'mega_fill');
    }, 400);
    
    grid.fill(CELL_CLAIMED); 
    gridCtx.clearRect(0,0,gridCanvas.width, gridCanvas.height);
    
    flashList = []; 
    floatingTexts = [];
    
    resetVictoryAnimation();
    gameWrapper.style.cursor = 'default'; 

    // MODIFICA: Sempre livello successivo, niente fine gioco
    if(nextLevelContainer) {
        // Mostra il bottone dopo 1 secondo
        setTimeout(() => {
            nextLevelContainer.style.display = 'block';
        }, 1000);
        
        // Opzionale: mostra messaggio speciale ogni giro di immagini completato
        if (level % TOTAL_IMAGES === 0) {
           spawnFloatingText("CYCLE COMPLETE!", W/2, H/2, 40, '#ffd700', 5000);
        }
    }
    
    // 🎆 Continua a disegnare la sequenza vittoria
    requestAnimationFrame(victoryLoop);
}

// Loop separato per animazione vittoria
function victoryLoop() {
    if(!isVictory) return;
    drawVictory();
    requestAnimationFrame(victoryLoop);
}

function tickPlayer(){
    if(player.dir.x===0 && player.dir.y===0) return;
    spawnParticles(player.x, player.y, 'player');
    const nx = player.x + player.dir.x * PLAYER_SPEED_CELLS; const ny = player.y + player.dir.y * PLAYER_SPEED_CELLS;
    if(!inBounds(nx,ny)) return;
    const curType = grid[idx(player.x, player.y)]; const nextType = grid[idx(nx, ny)];
    if(curType===CELL_CLAIMED && nextType===CELL_UNCLAIMED){ player.drawing = true; }
    if(player.drawing && nextType===CELL_CLAIMED){
        player.x = nx; player.y = ny; const filled = closeStixAndFill(); player.drawing = false; 
        updateUI(); 
        return;
    }
    if(player.drawing){ 
        const nextId = idx(nx, ny);
        if(grid[nextId] === CELL_STIX) {
            if(stixList.length >= 2) {
                const prevPoint = stixList[stixList.length - 2];
                if (prevPoint.x === nx && prevPoint.y === ny) {
                    const currentPoint = stixList.pop(); grid[idx(currentPoint.x, currentPoint.y)] = CELL_UNCLAIMED; 
                    player.x = nx; player.y = ny; return; 
                }
            }
            triggerDeath(nx, ny); return; 
        }
        player.x = nx; player.y = ny; grid[nextId] = CELL_STIX; stixList.push({x:player.x,y:player.y}); 
    } else { player.x = nx; player.y = ny; }
}

let lastTime = performance.now(); let deltaTime = 0;
function gameLoop(now){

 if (!isPlaying && !isVictory) return;


//11-FPS

// CAP FPS: Limita a ~60fps per evitare velocità eccessiva (es. su 144hz)
    if (now - lastTime < 16) { requestAnimationFrame(gameLoop); return; }

    // Calcola il tempo trascorso
    let rawDelta = now - lastTime;
    // RALLENTAMENTO MOBILE: Se siamo su schermo piccolo, il gioco scorre all'80% della velocità (0.8)
    // Cambia 0.8 in 0.5 per dimezzare la velocità, o 1.0 per disattivare.
    if (window.innerWidth < 768) { rawDelta *= 0.8; }
    
    deltaTime = rawDelta;
    lastTime = now;




   
    if (!isDying && !isVictory) { 
        moveQix(); 
        
   
moveAccumulator += (1 * playerSpeedMult); 
        
        let loops = 0;
        while (moveAccumulator >= 1 && loops < 8) { // MAX 8 step fisici per frame per evitare freeze
            tickPlayer();
            checkCollisions(); 
            moveAccumulator -= 1;
            loops++;
            
            if(isDying || isVictory) break; 
        }
        if (loops >= 8) moveAccumulator = 0; // Scarta l'accumulo eccessivo
    }
    if(!isVictory) draw();





    requestAnimationFrame(gameLoop);
}
