//06-AUDIO
// --- AUDIO ---
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
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, now); osc.frequency.exponentialRampToValueAtTime(10, now + 0.5);
        gainNode.gain.setValueAtTime(0.8, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now); osc.stop(now + 0.5);
    } else if (type === 'win') {
        osc.type = 'square'; osc.frequency.setValueAtTime(500, now); osc.frequency.setValueAtTime(600, now + 0.1); osc.frequency.setValueAtTime(800, now + 0.2);
        gainNode.gain.setValueAtTime(0.2, now); gainNode.gain.linearRampToValueAtTime(0, now + 0.6);
        osc.start(now); osc.stop(now + 0.6);
    } else if (type === 'kill') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(600, now); osc.frequency.linearRampToValueAtTime(1200, now + 0.15); 
        gainNode.gain.setValueAtTime(0.3, now); gainNode.gain.linearRampToValueAtTime(0, now + 0.4);
        osc.start(now); osc.stop(now + 0.4);
        const osc2 = audioCtx.createOscillator(); const gain2 = audioCtx.createGain();
        osc2.connect(gain2); gain2.connect(audioCtx.destination);
        osc2.type = 'triangle'; osc2.frequency.setValueAtTime(900, now); osc2.frequency.linearRampToValueAtTime(1800, now + 0.15);
        gain2.gain.setValueAtTime(0.1, now); gain2.gain.linearRampToValueAtTime(0, now + 0.4);
        osc2.start(now); osc2.stop(now + 0.4);
    }
}

function tryPlayMusic() {
    if (isMusicOn && bgMusic && bgMusic.paused) {
        bgMusic.play().catch(e => { console.log("Musica attende interazione..."); });
    }
}

if(musicBtn) {
    musicBtn.addEventListener('click', () => {
        isMusicOn = !isMusicOn;
        if (isMusicOn) {
            if(bgMusic) bgMusic.play();
            musicBtn.textContent = "🎵"; musicBtn.classList.remove('off');
        } else {
            if(bgMusic) bgMusic.pause();
            musicBtn.textContent = "🔇"; musicBtn.classList.add('off');
        }
        musicBtn.blur();
    });
}

