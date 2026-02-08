//01-SUPA

/* script.js - v4.0: INFINITE LEVELS & PROGRESSIVE DIFFICULTY */

// 1. SUPABASE
const SUPABASE_URL = 'https://rhttiiwsouqnlwoqpcvb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_EamNmDEcYnm9qeKTiSw7Rw_Sb9BVsVW';
const dbClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

//02-CONF
// 2. CONFIGURAZIONE GIOCO
const W = 160; const H = 160;
const PLAYER_SPEED_CELLS = 1; 
const WIN_PERCENT = 75;
const START_LIVES = 3;

// MODIFICA: Immagini totali disponibili (1-100)
const TOTAL_IMAGES = 100; 

const POINTS_PER_LEVEL = 1000; 
const MAX_TIME_BONUS = 500;     
const POINTS_PER_FILL = 10;     
const POINTS_KILL_SPIDER = 500; 
const POINTS_KILL_EVIL = 1000;  

// BONUS VELOCITÀ
const SPEED_BOOST_PER_KILL = 0.25; 

// Configurazione ZOOM Mobile
const MOBILE_ZOOM_LEVEL = 1; 
const MOBILE_BREAKPOINT = 768;

// 🏝️ TIPI DI CELLE (aggiunto CELL_ISLAND)
const CELL_UNCLAIMED = 0; 
const CELL_CLAIMED = 1; 
const CELL_STIX = 2;
const CELL_ISLAND = 3; // Nuovo: celle isola non attraversabili

const SKINS = [
    { name: "STRETCHING",   primary: '#ffff00', secondary: '#ffaa00', trail: '#00ffff' },
    { name: "WARMUP",    primary: '#00ff00', secondary: '#003300', trail: '#008800' },
    { name: "INFERNO",   primary: '#ff3300', secondary: '#ffaa00', trail: '#ff0000' },
    { name: "SE SCOMISSIA",       primary: '#ffffff', secondary: '#aaccff', trail: '#0088ff' },
    { name: "DAI CHE NDEMO", primary: '#ff00ff', secondary: '#00ffff', trail: '#ffff00' },
    { name: "INFERNO",      primary: '#ffd700', secondary: '#ffcc00', trail: '#ffffff' }
];
let currentSkin = SKINS[0];

const MISSION_PREFIX = ["OPERATION", "PROTOCOL", "PROJECT", "INITIATIVE", "CODE"];
const MISSION_SUFFIX = ["OMEGA", "ZERO", "GHOST", "NEON", "STORM", "PHANTOM", "ECHO"];

// ðŸ•¸ï¸ CONFIGURAZIONE RAGNATELE (dal livello 3+)
const COBWEB_ENABLED_FROM_LEVEL = 3;    // Dal livello 3 in poi
const COBWEB_SPAWN_INTERVAL = 20000;    // 1 minuto (20000ms) tra una ragnatela e l'altra
const COBWEB_DURATION = 20000;          // Durata ragnatela: 1 minuto
const COBWEB_MAX_COVERAGE = 0.12;       // 15% massimo dell'area di gioco
const COBWEB_SPEED_PENALTY = 0.3;       // Rallentamento del 30% sulla ragnatela
const COBWEB_CELL_TYPE = 2;             // Tipo di cella per la ragnatela
