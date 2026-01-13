/* script.js - Swipe, Keyboard, HD Fix, Music & Gameover Sound & Soccer Ball */

// --- CONFIGURAZIONE ---
const W = 160; 
const H = 160;
const PLAYER_SPEED_CELLS = 1; 
const WIN_PERCENT = 75;
const START_LIVES = 3;

// Costanti Celle
const CELL_UNCLAIMED = 0;
const CELL_CLAIMED = 1;
const CELL_STIX = 2;

// Riferimenti DOM
const imageCanvas = document.getElementById('imageCanvas');
const gridCanvas = document.getElementById('gridCanvas');
const entityCanvas = document.getElementById('entityCanvas');
const nextLevelContainer = document.getElementById('next-level-container');
const nextLevelBtn = document.getElementById('next-level-btn');
const gameWrapper = document.getElementById('game-wrapper');

// MUSICA & AUDIO
const bgMusic = document.getElementById('bg-music');
const gameoverSound = document.getElementById('gameover-sound');
const musicBtn = document.getElementById('music-btn');
let isMusicOn = true; 

// Variabili di Stato
let bgImage = new Image();
let imageLoaded = false;
let grid = new Uint8Array(W * H);
let stixList = []; 
let lives = START_LIVES;
let level = 1;
let score = 0;
let isPlaying = false;
let scaleX = 1, scaleY = 1;

let player = { x: Math.floor(W/2), y: H-1, drawing: false, dir: {x:0,y:0} };
let fuse = { active: false, delay: 300, timer: 0 };
let qix = { x: 0, y: 0, vx: 0, vy: 0 };

// Contexts
let imgCtx = imageCanvas.getContext('2d');
let gridCtx = gridCanvas.getContext('2d');
let entCtx = entityCanvas.getContext('2d');

// --- EFFETTI SONORI (Web Audio API) ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = new AudioContext();

function playSound(type) {
    if (audioCtx.state === 'suspended') { audioCtx.resume(); }
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'fill') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        gainNode.gain.setValueAtTime(0.3, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'hit') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
        gainNode.gain.setValueAtTime(0.5, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'win') {
        osc.type = 'square'; osc.frequency.setValueAtTime(500, now); osc.frequency.setValueAtTime(600, now + 0.1); osc.frequency.setValueAtTime(800, now + 0.2);
        gainNode.gain.setValueAtTime(0.2, now); gainNode.gain.linearRampToValueAtTime(0, now + 0.6);
        osc.start(now); osc.stop(now + 0.6);
    }
}

// --- GESTIONE MUSICA ---
function tryPlayMusic() {
    if (isMusicOn && bgMusic.paused) {
        bgMusic.play().catch(e => { console.log("Autoplay waiting..."); });
    }
}

musicBtn.addEventListener('click', () => {
    isMusicOn = !isMusicOn;
    if (isMusicOn) {
        bgMusic.play();
        musicBtn.textContent = "🎵";
        musicBtn.classList.remove('off');
    } else {
        bgMusic.pause();
        musicBtn.textContent = "🔇";
        musicBtn.classList.add('off');
    }
    musicBtn.blur();
});

// --- RIDIMENSIONAMENTO ---
function resizeCanvases() {
    const rect = gameWrapper.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    [imageCanvas, gridCanvas, entityCanvas].forEach(c => {
        c.width = Math.floor(rect.width * dpr);
        c.height = Math.floor(rect.height * dpr);
    });

    scaleX = imageCanvas.width / W;
    scaleY = imageCanvas.height / H;
    
    if(!isPlaying && imageLoaded) draw();
}

// Helpers
function idx(x,y){ return y * W + x; }
function inBounds(x,y){ return x>=0 && x<W && y>=0 && y<H; }

function initGrid(){
    grid.fill(CELL_UNCLAIMED);
    for(let x=0;x<W;x++){ grid[idx(x,0)] = CELL_CLAIMED; grid[idx(x,H-1)] = CELL_CLAIMED; }
    for(let y=0;y<H;y++){ grid[idx(0,y)] = CELL_CLAIMED; grid[idx(W-1,y)] = CELL_CLAIMED; }
}

function initGame(lvl, resetLives = true){
    level = lvl;
    if (resetLives) lives = START_LIVES;
    score = 0;
    isPlaying = true;
    nextLevelContainer.style.display = 'none'; 
    gameWrapper.style.cursor = 'none';

    initGrid();
    stixList = [];
    player.x = Math.floor(W/2); player.y = H-1;
    player.drawing = false; player.dir = {x:0,y:0};
    
    qix.x = Math.floor(W*0.3)+2; qix.y = Math.floor(H*0.3)+2;
    qix.vx = (Math.random()*0.8 + 0.4) * (Math.random()<0.5?-1:1);
    qix.vy = (Math.random()*0.8 + 0.4) * (Math.random()<0.5?-1:1);
    
    imageLoaded = false;
    bgImage.src = `img${level}.png`; 
    bgImage.onload = () => { imageLoaded = true; };
    bgImage.onerror = () => { 
        bgImage.src = `img${level}.jpg`;
        bgImage.onload = () => { imageLoaded = true; };
    };

    resizeCanvases();
    updateUI();
    tryPlayMusic();
    requestAnimationFrame(gameLoop);
}

function updateUI(){
    document.getElementById('ui-level').innerText = level;
    document.getElementById('ui-lives').innerText = lives;
    document.getElementById('ui-percent').innerText = Math.floor(getClaimPercent()) + "%";
}

function getClaimPercent(){
    let claimed = 0;
    for(let i=0;i<grid.length;i++) if(grid[i]===CELL_CLAIMED) claimed++;
    return claimed / grid.length * 100;
}

// --- RENDER LOOP ---
function draw() {
    imgCtx.clearRect(0,0,imageCanvas.width,imageCanvas.height);
    gridCtx.clearRect(0,0,gridCanvas.width,gridCanvas.height);
    entCtx.clearRect(0,0,entityCanvas.width,entityCanvas.height);

    if(imageLoaded){
        imgCtx.drawImage(bgImage, 0, 0, imageCanvas.width, imageCanvas.height);
    } else {
        imgCtx.fillStyle = '#111'; imgCtx.fillRect(0,0,imageCanvas.width, imageCanvas.height);
    }

    gridCtx.fillStyle = 'black';
    gridCtx.beginPath(); 
    let rectSizeX = Math.ceil(scaleX); 
    let rectSizeY = Math.ceil(scaleY);
    
    for(let y=0;y<H;y++){ for(let x=0;x<W;x++){ 
        if(grid[idx(x,y)] === CELL_UNCLAIMED){
            gridCtx.rect(Math.floor(x*scaleX), Math.floor(y*scaleY), rectSizeX, rectSizeY);
        }
    }}
    gridCtx.fill();

    if(stixList.length>0){
        gridCtx.fillStyle = '#00ffff'; gridCtx.beginPath();
        for(let p of stixList){ gridCtx.rect(Math.floor(p.x*scaleX), Math.floor(p.y*scaleY), rectSizeX, rectSizeY); }
        gridCtx.fill();
    }

    if (isPlaying) {
        // Disegno il NEMICO (Qix/Ragno)
        entCtx.font = `${Math.min(scaleX, scaleY) * 5}px serif`; 
        entCtx.textAlign = 'center'; entCtx.textBaseline = 'middle';
        entCtx.fillText('🕷️', (qix.x+0.5)*scaleX, (qix.y+0.5)*scaleY);

        // --- MODIFICA: DISEGNO GIOCATORE (PALLA DA CALCIO) ---
        // Impostiamo il font un po' più grande della singola cella per visibilità (es. 3.5 volte)
        entCtx.font = `${Math.min(scaleX, scaleY) * 3.5}px sans-serif`; 
        entCtx.textAlign = 'center'; 
        entCtx.textBaseline = 'middle';
        
        // Disegniamo la palla centrata sulle coordinate del player
        // (player.x + 0.5) serve a metterla esattamente al centro della casella
        entCtx.fillText('⚽', (player.x + 0.5) * scaleX, (player.y + 0.5) * scaleY);
    }
}

// --- LOGICA ---
function closeStixAndFill(){
    if(stixList.length===0) return;
    let visited = new Uint8Array(W*H);
    let stack = [];
    let qixCellX = Math.floor(qix.x); let qixCellY = Math.floor(qix.y);
    
    if(inBounds(qixCellX,qixCellY) && grid[idx(qixCellX,qixCellY)]!==CELL_CLAIMED){
        stack.push({x:qixCellX,y:qixCellY}); visited[idx(qixCellX,qixCellY)] = 1;
    }
    while(stack.length>0){
        const p = stack.pop();
        const dirs = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
        for(const d of dirs){
            const nx = p.x + d.x; const ny = p.y + d.y;
            if(!inBounds(nx,ny)) continue; 
            const idn = idx(nx,ny);
            if(visited[idn] || grid[idn]===CELL_CLAIMED || grid[idn]===CELL_STIX) continue; 
            visited[idn]=1; stack.push({x:nx,y:ny});
        }
    }
    let filled = 0;
    for(let i=0; i<grid.length; i++){
        if(grid[i]===CELL_UNCLAIMED && !visited[i]){ grid[i] = CELL_CLAIMED; filled++; }
        if(grid[i]===CELL_STIX){ grid[i] = CELL_CLAIMED; }
    }
    stixList = []; fuse.active = false; fuse.timer = 0;
    if(filled > 0) playSound('fill');
    updateUI();
    return filled;
}

function checkCollisions(){
    let qixCellX = Math.floor(qix.x); let qixCellY = Math.floor(qix.y);
    if(inBounds(qixCellX,qixCellY) && grid[idx(qixCellX,qixCellY)]===CELL_STIX){ loseLife(); return; }
    if(player.drawing){ if(qixCellX===player.x && qixCellY===player.y){ loseLife(); return; } }
}

function loseLife(){
    playSound('hit'); 
    lives -= 1; 
    updateUI();
    
    if(lives <= 0){
        isPlaying = false;
        bgMusic.pause();
        
        gameoverSound.currentTime = 0;
        gameoverSound.play().catch(e => console.log(e));

        Swal.fire({
            title:'GAME OVER', 
            text:`Score: ${score}`, 
            icon:'error', 
            background:'#111', color:'#fff', 
            confirmButtonText: 'Riprova'
        }).then(()=>{ 
            gameoverSound.pause();
            gameoverSound.currentTime = 0;
            
            if(isMusicOn) {
                bgMusic.currentTime = 0;
                bgMusic.play();
            }
            
            initGame(1, true); 
        });
    } else {
        stixList = []; player.drawing = false; player.dir = {x:0,y:0}; player.x = Math.floor(W/2); player.y = H-1;
        fuse.active=false; fuse.timer=0; qix.x = Math.floor(W*0.3)+2; qix.y = Math.floor(H*0.3)+2;
        for(let i=0; i<grid.length; i++) if(grid[i]===CELL_STIX) grid[i] = CELL_UNCLAIMED;
    }
}

function moveQix(){
    let nx = qix.x + qix.vx; let ny = qix.y + qix.vy;
    if(!inBounds(Math.floor(nx), Math.floor(qix.y)) || grid[idx(Math.floor(nx), Math.floor(qix.y))]===CELL_CLAIMED) qix.vx *= -1;
    if(!inBounds(Math.floor(qix.x), Math.floor(ny)) || grid[idx(Math.floor(qix.x), Math.floor(ny))]===CELL_CLAIMED) qix.vy *= -1;
    qix.x += qix.vx; qix.y += qix.vy;
    
    if(Math.random() < 0.02) {
        qix.vx += (Math.random() - 0.5) * 1.5;
        qix.vy += (Math.random() - 0.5) * 1.5;
    }
    const difficultyMultiplier = 1 + ((level - 1) * 0.2);
    const maxSpeed = 1.6 * difficultyMultiplier;
    const s = Math.hypot(qix.vx, qix.vy);
    if(s > maxSpeed){ qix.vx *= maxSpeed/s; qix.vy *= maxSpeed/s; }
}

function winLevel() {
    isPlaying = false;
    playSound('win');
    grid.fill(CELL_CLAIMED); 
    draw(); 
    gameWrapper.style.cursor = 'default'; 
    nextLevelContainer.style.display = 'block'; 
}

nextLevelBtn.addEventListener('click', () => { initGame(level + 1, false); });

function tickPlayer(){
    if(player.dir.x===0 && player.dir.y===0){
        if(player.drawing){ 
             if(!fuse.active){ fuse.timer += deltaTime; if(fuse.timer >= fuse.delay){ fuse.active = true; }} else { loseLife(); }
        }
        return;
    }
    fuse.timer = 0; fuse.active = false;
    const nx = player.x + player.dir.x * PLAYER_SPEED_CELLS; const ny = player.y + player.dir.y * PLAYER_SPEED_CELLS;
    if(!inBounds(nx,ny)) return;
    
    const curType = grid[idx(player.x, player.y)]; const nextType = grid[idx(nx, ny)];
    
    if(curType===CELL_CLAIMED && nextType===CELL_UNCLAIMED){ player.drawing = true; }
    if(player.drawing && nextType===CELL_CLAIMED){
        player.x = nx; player.y = ny; 
        const filled = closeStixAndFill(); 
        score += filled; player.drawing = false; updateUI();
        if(getClaimPercent() >= WIN_PERCENT){ winLevel(); }
        return;
    }
    player.x = nx; player.y = ny;
    if(player.drawing){ 
        const id = idx(player.x, player.y); 
        if(grid[id]===CELL_STIX){ loseLife(); return; } 
        grid[id] = CELL_STIX; stixList.push({x:player.x,y:player.y}); 
    }
}

let lastTime = performance.now(); let deltaTime = 0;
function gameLoop(now){
    if (!isPlaying) return;
    deltaTime = now - lastTime; lastTime = now;
    moveQix(); tickPlayer(); checkCollisions(); draw();
    requestAnimationFrame(gameLoop);
}

// --- INPUTS ---
const keysDown = new Set();
window.addEventListener('keydown', (e)=>{
    if(e.repeat) return;
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){
        keysDown.add(e.key); 
        tryPlayMusic();
        if (audioCtx.state === 'suspended') { audioCtx.resume(); } 
        setPlayerDirFromKeys(); e.preventDefault();
    }
});
window.addEventListener('keyup', (e)=>{
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){
        keysDown.delete(e.key); setPlayerDirFromKeys(); e.preventDefault();
    }
});
function setPlayerDirFromKeys(){
    const order = ['ArrowUp','ArrowRight','ArrowDown','ArrowLeft']; let found = {x:0,y:0};
    for(let k of order){ if(keysDown.has(k)){
        if(k==='ArrowUp') found = {x:0,y:-1}; if(k==='ArrowDown') found = {x:0,y:1}; if(k==='ArrowLeft') found = {x:-1,y:0}; if(k==='ArrowRight') found = {x:1,y:0}; break;
    }}
    player.dir = found;
}

// SWIPE
let touchStartX = 0; let touchStartY = 0;
gameWrapper.addEventListener('touchstart', e => {
    tryPlayMusic();
    if (audioCtx.state === 'suspended') { audioCtx.resume(); }
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    e.preventDefault(); 
}, {passive: false});

gameWrapper.addEventListener('touchmove', e => { e.preventDefault(); }, {passive: false});

gameWrapper.addEventListener('touchend', e => {
    e.preventDefault();
    let touchEndX = e.changedTouches[0].screenX;
    let touchEndY = e.changedTouches[0].screenY;
    handleSwipe(touchEndX - touchStartX, touchEndY - touchStartY);
}, {passive: false});

function handleSwipe(dx, dy) {
    if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;
    if (Math.abs(dx) > Math.abs(dy)) {
        player.dir = { x: dx > 0 ? 1 : -1, y: 0 };
    } else {
        player.dir = { x: 0, y: dy > 0 ? 1 : -1 };
    }
}

// --- AVVIO ---
function startGame() {
    resizeCanvases();
    initGame(1, true);
    setTimeout(resizeCanvases, 100);
    setTimeout(resizeCanvases, 500);
}

window.addEventListener('load', startGame);
window.addEventListener('resize', resizeCanvases);