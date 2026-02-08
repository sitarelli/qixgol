//07-DRAW

function redrawStaticLayers() {
    if (!currentBgImage) return;
    
    // Disegna l'immagine di background
    imgCtx.drawImage(currentBgImage, 0, 0, imageCanvas.width, imageCanvas.height);
    
    // Layer griglia: inizia con l'immagine
    gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
    gridCtx.drawImage(currentBgImage, 0, 0, gridCanvas.width, gridCanvas.height);
    
    // Applica oscuramento nero sopra tutto
    gridCtx.save();
    gridCtx.fillStyle = 'rgba(0, 0, 0, 0.85)'; 
    gridCtx.fillRect(0, 0, gridCanvas.width, gridCanvas.height);
    gridCtx.restore();

    let rectSizeX = Math.ceil(scaleX);
    let rectSizeY = Math.ceil(scaleY);

    // Rimuovi oscuramento SOLO per celle claimed (non per isole)
    gridCtx.globalCompositeOperation = 'destination-out';
    gridCtx.beginPath();
    for(let y=0; y<H; y++){ 
        for(let x=0; x<W; x++){ 
            if(grid[idx(x,y)] === CELL_CLAIMED) {
                gridCtx.rect(Math.floor(x*scaleX), Math.floor(y*scaleY), rectSizeX, rectSizeY);
            }
        }
    }
    gridCtx.fill();
    gridCtx.globalCompositeOperation = 'source-over';
    
    // 🏝️ DISEGNA LE ISOLE CON IL PATTERN DI SFONDO PAGINA
    // Carica il pattern corrispondente al livello
    let patternIndex = ((level - 1) % 20) + 1;
    let patternImg = new Image();
    patternImg.src = `png/pattern${patternIndex}.png`;
    
    patternImg.onload = function() {
        // Crea un pattern ripetuto
        let pattern = gridCtx.createPattern(patternImg, 'repeat');
        
        gridCtx.save();
        gridCtx.fillStyle = pattern;
        
        // Riempi tutte le celle isola con il pattern
        gridCtx.beginPath();
        for(let y=0; y<H; y++){ 
            for(let x=0; x<W; x++){ 
                if(grid[idx(x,y)] === CELL_ISLAND) {
                    gridCtx.rect(Math.floor(x*scaleX), Math.floor(y*scaleY), rectSizeX, rectSizeY);
                }
            }
        }
        gridCtx.fill();
        gridCtx.restore();
        
        // 🔲 Disegna i CONTORNI delle isole (linee chiare visibili)
        gridCtx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        gridCtx.lineWidth = 2;
        for(let y=0; y<H; y++){ 
            for(let x=0; x<W; x++){ 
                if(grid[idx(x,y)] === CELL_ISLAND) {
                    // Disegna bordi solo dove c'è una transizione
                    let hasTop = y > 0 && grid[idx(x, y-1)] !== CELL_ISLAND;
                    let hasBottom = y < H-1 && grid[idx(x, y+1)] !== CELL_ISLAND;
                    let hasLeft = x > 0 && grid[idx(x-1, y)] !== CELL_ISLAND;
                    let hasRight = x < W-1 && grid[idx(x+1, y)] !== CELL_ISLAND;
                    
                    let px = Math.floor(x*scaleX);
                    let py = Math.floor(y*scaleY);
                    
                    gridCtx.beginPath();
                    if(hasTop) {
                        gridCtx.moveTo(px, py);
                        gridCtx.lineTo(px + rectSizeX, py);
                    }
                    if(hasBottom) {
                        gridCtx.moveTo(px, py + rectSizeY);
                        gridCtx.lineTo(px + rectSizeX, py + rectSizeY);
                    }
                    if(hasLeft) {
                        gridCtx.moveTo(px, py);
                        gridCtx.lineTo(px, py + rectSizeY);
                    }
                    if(hasRight) {
                        gridCtx.moveTo(px + rectSizeX, py);
                        gridCtx.lineTo(px + rectSizeX, py + rectSizeY);
                    }
                    gridCtx.stroke();
                }
            }
        }
    };
}



function resizeCanvases() {
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    // Controllo se la Focus Mode è attiva (guardando la classe nel body)
    const isFocusMode = document.body.classList.contains('focus-active');

    const isMobile = winW < MOBILE_BREAKPOINT;
    
    const availW = isMobile ? winW - 10 : winW * (isFocusMode ? 0.92 : 0.65);
    
    // QUI LA MODIFICA CHIAVE:
    // Se focus mode è attivo, usa 95% altezza, altrimenti 75%
    const heightFactor = isFocusMode ? 0.92 : 0.75; 
    const availH = isMobile ? (winH - 240) : winH * heightFactor;
    let size = Math.min(availW, availH);
    if (size < 200) size = 200; // Sicurezza minima
    if (size > 900) size = 900;

    gameWrapper.style.width = Math.floor(size) + "px";
    gameWrapper.style.height = Math.floor(size) + "px";

    const dpr = window.devicePixelRatio || 1;
    [imageCanvas, gridCanvas, entityCanvas].forEach(c => {
        c.width = Math.floor(size * dpr);
        c.height = Math.floor(size * dpr);
    });
    
    scaleX = imageCanvas.width / W;
    scaleY = imageCanvas.height / H;
    redrawStaticLayers();
    if(isVictory) drawVictory(); 
}

function idx(x,y){ return y * W + x; }
function inBounds(x,y){ return x>=0 && x<W && y>=0 && y<H; }

function initGrid(){
    grid.fill(CELL_UNCLAIMED);
    for(let x=0;x<W;x++){ grid[idx(x,0)] = CELL_CLAIMED; grid[idx(x,H-1)] = CELL_CLAIMED; }
    for(let y=0;y<H;y++){ grid[idx(0,y)] = CELL_CLAIMED; grid[idx(W-1,y)] = CELL_CLAIMED; }
    redrawStaticLayers();
}

function spawnFloatingText(text, x, y, size = 24, color = 'white', duration = 3500) {
    floatingTexts.push({text, x, y, timer: duration, opacity: 1.0, size, color});
}

function pickRandomSkin() {
    const randomIndex = Math.floor(Math.random() * SKINS.length);
    currentSkin = SKINS[randomIndex];
}

function generateMissionName() {
    const p = MISSION_PREFIX[Math.floor(Math.random() * MISSION_PREFIX.length)];
    const s = MISSION_SUFFIX[Math.floor(Math.random() * MISSION_SUFFIX.length)];
    return `${p}: ${s}`;
}

function updateCamera() {
    if (window.innerWidth > MOBILE_BREAKPOINT) {
        cameraLayer.style.transform = 'translate(0px, 0px) scale(1)';
        return;
    }
    const playerPixelX = (player.x + 0.5) * scaleX;
    const playerPixelY = (player.y + 0.5) * scaleY;
    const viewW = gameWrapper.clientWidth;
    const viewH = gameWrapper.clientHeight;
    let transX = (viewW / 2) - (playerPixelX * MOBILE_ZOOM_LEVEL);
    let transY = (viewH / 2) - (playerPixelY * MOBILE_ZOOM_LEVEL);
    const maxTransX = 0; const minTransX = viewW - (viewW * MOBILE_ZOOM_LEVEL);
    const maxTransY = 0; const minTransY = viewH - (viewH * MOBILE_ZOOM_LEVEL);
    transX = Math.min(maxTransX, Math.max(transX, minTransX));
    transY = Math.min(maxTransY, Math.max(transY, minTransY));
    cameraLayer.style.transform = `translate(${transX}px, ${transY}px) scale(${MOBILE_ZOOM_LEVEL})`;
}

function draw() {
    updateCamera();

    let offsetX = 0, offsetY = 0;
    if (shakeIntensity > 0) {
        offsetX = (Math.random() - 0.5) * shakeIntensity; offsetY = (Math.random() - 0.5) * shakeIntensity;
        shakeIntensity *= 0.9; if(shakeIntensity < 0.5) shakeIntensity = 0;
    }
    
    entCtx.setTransform(1, 0, 0, 1, 0, 0); 
    entCtx.clearRect(0,0,entityCanvas.width,entityCanvas.height); 
    entCtx.translate(offsetX, offsetY);
    
    let rectSizeX = Math.ceil(scaleX), rectSizeY = Math.ceil(scaleY);

    if(stixList.length > 0){
        const pulse = Math.sin(Date.now() / 50) > 0 ? '#ffffff' : currentSkin.trail;
        entCtx.fillStyle = pulse; entCtx.beginPath();
        for(let p of stixList){ entCtx.rect(Math.floor(p.x*scaleX), Math.floor(p.y*scaleY), rectSizeX, rectSizeY); }
        entCtx.fill(); 
    }

    if(flashList.length > 0) {
        entCtx.save(); entCtx.fillStyle = 'white'; entCtx.shadowColor = 'white'; entCtx.shadowBlur = 0; entCtx.beginPath();
        for (let i = flashList.length - 1; i >= 0; i--) {
            let f = flashList[i];
            let fx = f.idx % W; let fy = Math.floor(f.idx / W);
            entCtx.rect(Math.floor(fx * scaleX), Math.floor(fy * scaleY), rectSizeX, rectSizeY);
            f.timer--; if (f.timer <= 0) flashList.splice(i, 1);
        }
        entCtx.fill(); entCtx.restore(); 
    }

    if (isPlaying) {
        for(let i = particles.length - 1; i >= 0; i--){
            let p = particles[i]; 
            entCtx.fillStyle = p.color; 
            entCtx.globalAlpha = p.life;
            
            // ✨ Supporto per particelle di dimensioni diverse
            let particleSize = (p.size || 1) * Math.min(scaleX, scaleY);
            entCtx.fillRect(p.x * scaleX - particleSize/2, p.y * scaleY - particleSize/2, particleSize, particleSize);
            
            entCtx.globalAlpha = 1.0; 
            p.x += p.vx; p.y += p.vy; 
            p.vx *= 0.97; // Rallentamento più graduale per effetto più fluido
            p.vy *= 0.97; 
            p.life -= p.decay;
            if(p.life <= 0) particles.splice(i, 1);
        }
        
        // ðŸ•¸ï¸ DISEGNA RAGNATELE
        if (cobwebList.length > 0) {
            for (let cobweb of cobwebList) {
                // Calcola l'opacità in base al tempo rimanente
                const timeLeft = cobweb.expiresAt - Date.now();
                const fadeThreshold = 10000; // Inizia a svanire negli ultimi 10 secondi
                let opacity = 0.55;
                
                if (timeLeft < fadeThreshold) {
                    opacity = 0.35 * (timeLeft / fadeThreshold);
                }
                
                // Disegna le celle della ragnatela
                entCtx.save();
                entCtx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                entCtx.beginPath();
                for (let cell of cobweb.cells) {
                    entCtx.rect(
                        Math.floor(cell.x * scaleX), 
                        Math.floor(cell.y * scaleY), 
                        rectSizeX, 
                        rectSizeY
                    );
                }
                entCtx.fill();
                
                // Disegna pattern a rete sopra
                entCtx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.8})`;
                entCtx.lineWidth = 1;
                entCtx.beginPath();
                
                // Linee orizzontali
                for (let cell of cobweb.cells) {
                    if (cell.y % 3 === 0) {
                        entCtx.moveTo(cell.x * scaleX, cell.y * scaleY);
                        entCtx.lineTo((cell.x + 1) * scaleX, cell.y * scaleY);
                    }
                }
                
                // Linee verticali
                for (let cell of cobweb.cells) {
                    if (cell.x % 3 === 0) {
                        entCtx.moveTo(cell.x * scaleX, cell.y * scaleY);
                        entCtx.lineTo(cell.x * scaleX, (cell.y + 1) * scaleY);
                    }
                }
                
                entCtx.stroke();
                entCtx.restore();
            }
        }
        
        for (let q of qixList) {
            entCtx.save(); entCtx.translate((q.x + 0.5) * scaleX, (q.y + 0.5) * scaleY);
            let angle = Math.atan2(q.vy, q.vx); entCtx.rotate(angle + Math.PI / 2);
            if(isDying) { entCtx.shadowColor = 'red'; entCtx.shadowBlur = 0; } 
            else if (level >= 6) { entCtx.shadowColor = '#ff0000'; entCtx.shadowBlur = 0; }
            entCtx.font = `${Math.min(scaleX, scaleY) * 7.5}px serif`; entCtx.textAlign = 'center'; entCtx.textBaseline = 'middle';
            entCtx.fillText('🕷️', 0, 0); entCtx.restore();
        }

        // 🎾 PALLE MALVAGIE CON ICONE DIFFERENZIATE
        for (let ep of evilPlayers) {
            entCtx.save(); entCtx.translate((ep.x + 0.5) * scaleX, (ep.y + 0.5) * scaleY);
            ep.angle += 0.1; 
            entCtx.rotate(ep.angle);
            entCtx.shadowColor = ep.type === 'soccer' ? '#00ff00' : '#ff6600'; 
            entCtx.shadowBlur = 10; 
            entCtx.font = `${Math.min(scaleX, scaleY) * 5.5}px sans-serif`; 
            entCtx.textAlign = 'center'; 
            entCtx.textBaseline = 'middle';
            // ⚽ Calcio da vita, 🏀 basket solo punti
            entCtx.fillText(ep.type === 'soccer' ? '⚽' : '🏀', 0, 0); 
            entCtx.restore();
        }

        // ⚽ PALLA PLAYER - SEMPRE VISIBILE
        if (isDying) playerAnimScale = Math.max(0, playerAnimScale - 0.1); 
        else playerAnimScale = Math.min(1, playerAnimScale + 0.05); 
        
        if(playerAnimScale > 0.01) {
            // ✨ TRAIL LUMINOSO quando vai veloce
            if(!isDying && playerSpeedMult > 2.5 && (player.dir.x !== 0 || player.dir.y !== 0)) {
                entCtx.save();
                entCtx.globalAlpha = 0.3;
                entCtx.shadowColor = currentSkin.trail;
                entCtx.shadowBlur = 20;
                entCtx.fillStyle = currentSkin.trail;
                entCtx.beginPath();
                entCtx.arc((player.x + 0.5) * scaleX, (player.y + 0.5) * scaleY, scaleX * 3, 0, Math.PI * 2);
                entCtx.fill();
                entCtx.restore();
            }
            
            entCtx.save(); 
            entCtx.translate((player.x + 0.5) * scaleX, (player.y + 0.5) * scaleY);
            entCtx.scale(playerAnimScale, playerAnimScale);
            if (!isDying && (player.dir.x !== 0 || player.dir.y !== 0)) playerAngle += (Math.random() - 0.5) * 1.5; 
            entCtx.rotate(playerAngle);
            
            const blinkPhase = Math.sin((Date.now() / 500) * Math.PI); 
            const glowBlur = 10 + 10 * Math.abs(blinkPhase); 
            entCtx.shadowColor = currentSkin.trail; 
            entCtx.shadowBlur = glowBlur;
            
            const outerGrad = entCtx.createRadialGradient(0, 0, 0, 0, 0, scaleX * 2.5);
            outerGrad.addColorStop(0, currentSkin.primary); 
            outerGrad.addColorStop(0.5, currentSkin.secondary); 
            outerGrad.addColorStop(1, 'rgba(0,0,0,0)');
            entCtx.fillStyle = outerGrad; 
            entCtx.beginPath(); 
            entCtx.arc(0, 0, scaleX * 2.5, 0, Math.PI * 2); 
            entCtx.fill();
            
            const innerGrad = entCtx.createRadialGradient(0, 0, 0, 0, 0, scaleX * 1.2);
            innerGrad.addColorStop(0, '#ffffff'); 
            innerGrad.addColorStop(0.6, currentSkin.primary); 
            innerGrad.addColorStop(1, currentSkin.secondary);
            entCtx.fillStyle = innerGrad; 
            entCtx.beginPath(); 
            entCtx.arc(0, 0, scaleX * 1.2, 0, Math.PI * 2); 
            entCtx.fill();
            
            // ⚽ ICONA PALLONE PLAYER
            entCtx.shadowBlur = 5;
            entCtx.font = `${Math.min(scaleX, scaleY) * 5}px sans-serif`;
            entCtx.textAlign = 'center';
            entCtx.textBaseline = 'middle';
            entCtx.fillText('⚽', 0, 0);
            
            entCtx.restore();
        }
    }

    // 💬 TESTI FLUTTUANTI
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        let ft = floatingTexts[i];
        ft.timer -= 16; 
        if (ft.timer <= 0) { floatingTexts.splice(i, 1); continue; }
        ft.y -= 0.15; 
        let fadeStart = 1000; if (ft.timer < fadeStart) ft.opacity = ft.timer / fadeStart;
        entCtx.save();
        entCtx.globalAlpha = ft.opacity;
        entCtx.font = `bold ${ft.size}px Arial, sans-serif`;
        entCtx.textAlign = 'center'; entCtx.textBaseline = 'middle';
        entCtx.shadowColor = ft.color; entCtx.shadowBlur = 10;
        entCtx.fillStyle = ft.color;
        entCtx.fillText(ft.text, ft.x * scaleX, ft.y * scaleY);
        entCtx.restore();
    }

    // 🎆 FLASH SCHERMO
    if (screenFlashAlpha > 0) {
        entCtx.save();
        entCtx.fillStyle = screenFlashColor;
        entCtx.globalAlpha = screenFlashAlpha;
        entCtx.fillRect(0, 0, entityCanvas.width, entityCanvas.height);
        entCtx.restore();
        screenFlashAlpha *= 0.85; 
        if (screenFlashAlpha < 0.01) screenFlashAlpha = 0;
    }

    // 💀 GOD MODE INDICATOR
    if (isGodMode && !isDying) {
        entCtx.save();
        entCtx.font = 'bold 14px Arial'; entCtx.fillStyle = '#ffff00';
        entCtx.shadowColor = '#ff0000'; entCtx.shadowBlur = 8;
        entCtx.fillText("GOD MODE", 10, 20);
        entCtx.restore();
    }

    // ⚡ SPEED INDICATOR (se hai ucciso nemici)
    if (playerSpeedMult > 2.0 && !isDying) {
        entCtx.save();
        let speedLevel = Math.floor((playerSpeedMult - 1.8) / SPEED_BOOST_PER_KILL);
        entCtx.font = 'bold 16px Arial'; entCtx.fillStyle = currentSkin.trail;
        entCtx.shadowColor = currentSkin.primary; entCtx.shadowBlur = 10;
        entCtx.fillText(`SPEED x${speedLevel}`, entityCanvas.width - 80, 20);
        entCtx.restore();
    }
    
    // ðŸ•¸ï¸ COBWEB INDICATOR (quando sei rallentato)
    if (isPlayerOnCobweb && !isDying) {
        entCtx.save();
        entCtx.font = 'bold 16px Arial'; 
        entCtx.fillStyle = '#ffffff';
        entCtx.shadowColor = '#888888'; 
        entCtx.shadowBlur = 10;
        // Pulsa per attirare l'attenzione
        const pulse = 0.8 + Math.sin(Date.now() / 200) * 0.2;
        entCtx.globalAlpha = pulse;
        entCtx.fillText("ðŸ•¸ï¸ SLOW!", entityCanvas.width / 2 - 40, 20);
        entCtx.restore();
    }

    entCtx.setTransform(1, 0, 0, 1, 0, 0);
}

// 🎆 ANIMAZIONE VITTORIA ULTRA SPETTACOLARE
function drawVictory() {
    if (!isVictory) return;
    
    victoryAnimTimer++;
    
    entCtx.clearRect(0, 0, entityCanvas.width, entityCanvas.height);
    
    entCtx.save();
    
    // 🌈 SFONDO PULSANTE
    let bgPulse = 0.3 + Math.sin(victoryAnimTimer * 0.05) * 0.15;
    let bgGrad = entCtx.createRadialGradient(
        entityCanvas.width / 2, entityCanvas.height / 2, 0,
        entityCanvas.width / 2, entityCanvas.height / 2, entityCanvas.width * 0.7
    );
    bgGrad.addColorStop(0, `rgba(0, 255, 100, ${bgPulse})`);
    bgGrad.addColorStop(0.5, `rgba(0, 150, 255, ${bgPulse * 0.5})`);
    bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    entCtx.fillStyle = bgGrad;
    entCtx.fillRect(0, 0, entityCanvas.width, entityCanvas.height);
    
    // 🎆 SPAWN CONTINUO PARTICELLE FIREWORKS
    if (victoryAnimTimer % 20 === 0) {
        let randomX = 20 + Math.random() * (W - 40);
        let randomY = 20 + Math.random() * (H - 40);
        spawnParticles(randomX, randomY, 'mega_fill');
    }
    
    // ✨ GLITTER CONTINUO
    if (victoryAnimTimer % 5 === 0) {
        for(let i = 0; i < 3; i++) {
            let rx = Math.random() * W;
            let ry = Math.random() * H;
            spawnParticles(rx, ry, 'fill_spark', 5);
        }
    }
    
    // Disegna tutte le particelle (fireworks + glitter)
    for(let i = particles.length - 1; i >= 0; i--){
        let p = particles[i]; 
        entCtx.fillStyle = p.color; 
        entCtx.globalAlpha = p.life;
        let particleSize = (p.size || 1) * Math.min(scaleX, scaleY);
        entCtx.fillRect(p.x * scaleX - particleSize/2, p.y * scaleY - particleSize/2, particleSize, particleSize);
        entCtx.globalAlpha = 1.0; 
        p.x += p.vx; p.y += p.vy; 
        p.vx *= 0.97;
        p.vy *= 0.97; 
        p.life -= p.decay;
        if(p.life <= 0) particles.splice(i, 1);
    }
    
    // 📝 TESTO "COMPLETED" 
    let pulse = 1 + Math.sin(victoryAnimTimer * 0.1) * 0.12;
    let completedSize = Math.floor(Math.min(entityCanvas.width, entityCanvas.height) / 8 * pulse);
    
    entCtx.font = `900 ${completedSize}px Arial Black, Arial, sans-serif`;
    entCtx.textAlign = 'center'; 
    entCtx.textBaseline = 'middle';
    entCtx.shadowColor = '#00ff00';
    entCtx.shadowBlur = 40 + Math.sin(victoryAnimTimer * 0.15) * 20;
    entCtx.fillStyle = '#00ff00';
    entCtx.fillText("COMPLETED", entityCanvas.width / 2, entityCanvas.height * 0.35);
    
    // 📝 TESTO "NEXT LEVEL"
    entCtx.shadowColor = '#ffd700';
    entCtx.shadowBlur = 30 + Math.sin(victoryAnimTimer * 0.12) * 15;
    let nextLevelSize = Math.floor(completedSize * 0.55);
    entCtx.font = `bold ${nextLevelSize}px Arial, sans-serif`;
    entCtx.fillStyle = '#ffd700';
    entCtx.fillText("", entityCanvas.width / 2, entityCanvas.height * 0.50);
    
    // 💫 Stelle rotanti
    let starRotation = victoryAnimTimer * 0.05;
    let starX = entityCanvas.width / 2 - nextLevelSize * 3.2;
    let starY = entityCanvas.height * 0.50;
    drawRotatingStar(starX, starY, 15, starRotation, '#ffd700');
    
    starX = entityCanvas.width / 2 + nextLevelSize * 3.2;
    drawRotatingStar(starX, starY, 15, -starRotation, '#ffd700');
    
    // 💬 Sottotitolo
    entCtx.shadowBlur = 10;
    entCtx.font = `bold ${completedSize * 0.25}px Arial, sans-serif`;
    entCtx.fillStyle = '#ffffff';
    entCtx.fillText("Premi freccia per continuare", entityCanvas.width / 2, entityCanvas.height * 0.72);

    entCtx.restore();
}

// ⭐ Helper function per disegnare stella rotante
function drawRotatingStar(x, y, size, rotation, color) {
    entCtx.save();
    entCtx.translate(x, y);
    entCtx.rotate(rotation);
    entCtx.fillStyle = color;
    entCtx.shadowColor = color;
    entCtx.shadowBlur = 15;
    
    entCtx.beginPath();
    for(let i = 0; i < 10; i++) {
        let angle = (Math.PI * 2 * i) / 10;
        let radius = (i % 2 === 0) ? size : size * 0.4;
        let px = Math.cos(angle) * radius;
        let py = Math.sin(angle) * radius;
        if(i === 0) entCtx.moveTo(px, py);
        else entCtx.lineTo(px, py);
    }
    entCtx.closePath();
    entCtx.fill();
    entCtx.restore();
}

// Reset variabili vittoria
function resetVictoryAnimation() {
    victorySequenceStep = 0;
    victoryAnimTimer = 0;
    revealProgress = 0;
}

function addShake(amount) { shakeIntensity = amount; }

function spawnParticles(x, y, type, intensity = 1) {
    let count = 1; 
    let pColor = '#fff';

    // 🎆 ESPLOSIONE STANDARD (morte giocatore/collisione)
    if (type === 'explosion') count = 30; 
    
    // ✨ FILL SPARK MEGA UPGRADE - Esplosione scintillante quando chiudi aree!
    else if (type === 'fill_spark') { 
        count = Math.min(80, 15 + Math.floor(intensity / 10)); // Più particelle per aree grandi
        pColor = currentSkin.trail; 
    }
    
    // 🌟 NUOVO: Esplosione colorata quando chiudi GRANDI aree (bonus visivo)
    else if (type === 'mega_fill') {
        count = 120; 
        pColor = '#ffff00'; // Oro brillante
    }
    
    else if (type === 'player') { count = 1; pColor = Math.random() > 0.5 ? currentSkin.primary : currentSkin.secondary; }
    
    // 🕷️ RAGNO UCCISO - Effetto disintegrazione
    else if (type === 'spider') {
        if(level >= 6) { pColor = Math.random() > 0.5 ? '#ff0000' : '#880000'; } 
        else { pColor = Math.random() > 0.5 ? '#ff0055' : '#aa00ff'; }
    }
    
    // 💀 SPIDER DEATH - Nuovo effetto quando uccidi un ragno
    else if (type === 'spider_death') {
        count = 60;
        pColor = level >= 6 ? '#ff0000' : '#aa00ff';
    }
    
    else if (type === 'evil_ball') { pColor = '#ff0000'; }
    
    // ⚡ EVIL DEATH - Esplosione spettacolare palla malvagia
    else if (type === 'evil_death') {
        count = 80;
        pColor = '#ff0000';
    }
    
    // 💥 PLAYER DEATH - Esplosione + fumo quando muori
    else if (type === 'player_death') {
        count = 50;
        pColor = currentSkin.primary;
    }
    
    // 💨 SMOKE - Particelle di fumo grigio che salgono lentamente
    else if (type === 'smoke') {
        count = 30;
        pColor = '#888888';
    }
    
    // ðŸ•¸ï¸ COBWEB - Particelle bianche/grigie per indicare rallentamento
    else if (type === 'cobweb') {
        count = 2;
        pColor = '#cccccc';
    }
    
    for(let i=0; i<count; i++){
        let angle = (Math.PI * 2 * i) / count; // Distribuzione circolare uniforme
        let speed = 0.3 + Math.random() * 0.4;
        
        // FUMO: sale lentamente verso l'alto
        if(type === 'smoke') {
            let p = {
                x: x + (Math.random() - 0.5) * 3, 
                y: y + (Math.random() - 0.5) * 3,
                vx: (Math.random() - 0.5) * 0.1,
                vy: -0.3 - Math.random() * 0.2, // Sale verso l'alto
                life: 1.0, 
                decay: 0.01, // Dura più a lungo
                color: Math.random() > 0.5 ? '#888888' : '#555555',
                size: 2 + Math.random() * 2 // Più grande
            };
            particles.push(p);
        }
        // ðŸ•¸ï¸ COBWEB: particelle piccole che cadono lentamente (effetto ragnatela)
        else if(type === 'cobweb') {
            let p = {
                x: x + (Math.random() - 0.5) * 2, 
                y: y + (Math.random() - 0.5) * 2,
                vx: (Math.random() - 0.5) * 0.05,
                vy: 0.1 + Math.random() * 0.1, // Cade lentamente
                life: 1.0, 
                decay: 0.02,
                color: Math.random() > 0.5 ? '#ffffff' : '#cccccc',
                size: 0.8 // Piccole
            };
            particles.push(p);
        }
        // Per fill_spark, mega_fill, spider_death, evil_death, player_death: esplosione radiale
        else if(type === 'fill_spark' || type === 'mega_fill' || type === 'spider_death' || type === 'evil_death' || type === 'player_death') {
            let p = {
                x: x + (Math.random() - 0.5) * 2, 
                y: y + (Math.random() - 0.5) * 2,
                vx: Math.cos(angle) * speed * (type === 'mega_fill' ? 1.5 : 1) * (type === 'player_death' ? 0.8 : 1),
                vy: Math.sin(angle) * speed * (type === 'mega_fill' ? 1.5 : 1) * (type === 'player_death' ? 0.8 : 1),
                life: 1.0, 
                decay: type === 'player_death' ? 0.025 : 0.015 + Math.random() * 0.02,
                color: type === 'mega_fill' ? 
                    (Math.random() > 0.3 ? '#ffff00' : '#ffffff') : 
                    (type === 'spider_death' ? 
                        (Math.random() > 0.5 ? '#ff0000' : '#ff00ff') :
                        (type === 'evil_death' ?
                            (Math.random() > 0.5 ? '#ff0000' : '#ffaa00') :
                            (type === 'player_death' ?
                                (Math.random() > 0.3 ? currentSkin.primary : currentSkin.secondary) :
                                pColor))),
                size: type === 'mega_fill' ? 1.5 : (type === 'player_death' ? 1.2 : 1)
            };
            particles.push(p);
        } else {
            // Effetti standard (player, explosion, etc)
            let p = {
                x: x + (Math.random() - 0.5) * 0.8, 
                y: y + (Math.random() - 0.5) * 0.8,
                vx: (Math.random() - 0.5) * 0.2, 
                vy: (Math.random() - 0.5) * 0.2,
                life: 1.0, 
                decay: 0.08 + Math.random() * 0.05, 
                color: (type === 'explosion') ? (Math.random()>0.3?'#ff2200':'#ffffff') : pColor,
                size: 1
            };
            particles.push(p);
        }
    }
}
