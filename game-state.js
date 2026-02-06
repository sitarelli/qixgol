//05-VARIA
// VARIABILI STATO
const levelImages = []; 
let currentBgImage = null; 
let grid = new Uint8Array(W * H);
let stixList = []; 
let lives = START_LIVES;
let level = 1;
let score = 0;
let isPlaying = false;
let isDying = false; 
let isVictory = false; 
let scaleX = 1, scaleY = 1;
let levelStartTime = 0; 
let currentPercent = 0;
let playerAngle = 0;
let playerAnimScale = 0; 
let shakeIntensity = 0;  
let flashList = []; 
let particles = [];       
let floatingTexts = []; 
let player = { x: Math.floor(W/2), y: H-1, drawing: false, dir: {x:0,y:0} };
let qixList = []; 
let evilPlayers = []; 

// VARIABILI VELOCITÀ & GOD MODE
let cheatBuffer = "";
let isGodMode = false;
let cheatDetected = false; 
let playerSpeedMult = 1.8; 
let moveAccumulator = 0;   

// 🎆 NUOVE VARIABILI PER EFFETTI SPECIALI
let screenFlashAlpha = 0;
let screenFlashColor = '#ffffff';
let victorySequenceStep = 0;
let victoryAnimTimer = 0;
let revealProgress = 0;

// Contexts
let imgCtx = imageCanvas.getContext('2d', { alpha: false }); 
let gridCtx = gridCanvas.getContext('2d');
let entCtx = entityCanvas.getContext('2d');

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = new AudioContext();

function preloadLevelImages() {
    // MODIFICA: Carica fino a TOTAL_IMAGES (100)
    for (let i = 1; i <= TOTAL_IMAGES; i++) {
        const img = new Image();
        img.src = `img/img${i}.jpg`; 
        levelImages[i] = img;
    }
}
