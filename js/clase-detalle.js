// clase-detalle.js - integración precisa de progreso con Vimeo + fallback
document.addEventListener('DOMContentLoaded', () => {
    if (window.AOS && AOS.init) AOS.init();

    const progressBar = document.getElementById('class-progress-bar');
    const progressText = document.getElementById('class-progress-text');
    const badgeModal = document.getElementById('badge-modal');
    const closeBadgeModalBtn = document.getElementById('close-badge-modal');

    if (closeBadgeModalBtn) {
        closeBadgeModalBtn.addEventListener('click', () => badgeModal.classList.remove('show'));
    }
    window.addEventListener('click', (e) => { if (e.target === badgeModal) badgeModal.classList.remove('show'); });

    function detectClassKey() {
        const bodyKey = document.body.getAttribute('data-video');
        if (bodyKey) return bodyKey;

        const pathMatch = window.location.pathname.match(/clase[-_]?(\\d{1,2})/i);
        if (pathMatch) return `clase${pathMatch[1]}`;

        const h1 = document.querySelector('h1');
        if (h1) {
            const t = h1.textContent.match(/clase\\s+(\\d{1,2})/i);
            if (t) return `clase${t[1]}`;
        }
        return 'clase1';
    }

    const classKey = detectClassKey();
    const storageKey = `progress_${classKey}`;
    const keyMomentsThresholds = { '33': 33, '50': 50, '100': 100 };

    let currentProgress = (() => {
        try {
            const saved = localStorage.getItem(storageKey);
            return saved ? JSON.parse(saved) : { percentage: 0, keyMoments: {} };
        } catch (e) {
            return { percentage: 0, keyMoments: {} };
        }
    })();

    function updateProgressUI(percentage) {
        const rounded = Math.min(100, Math.round(percentage));
        if (progressBar) progressBar.style.width = `${rounded}%`;
        if (progressText) progressText.textContent = `${rounded}% completado`;
    }

    function saveProgress(progressObj) {
        try { localStorage.setItem(storageKey, JSON.stringify(progressObj)); } catch (e) { console.warn('No se pudo guardar progreso', e); }
    }
    // Actualizar progreso total del curso
    if (window.updateCourseProgress) {
        try { window.updateCourseProgress(); } catch (e) {}
    }

    function showBadgeModal() {
        if (!badgeModal) return;
        badgeModal.classList.add('show');
    }

    function checkKeyMoments(percentage) {
        if (percentage >= keyMomentsThresholds['33'] && !currentProgress.keyMoments['33']) {
            currentProgress.keyMoments['33'] = true;
            console.log(`${classKey}: 33% alcanzado`);
        }
        if (percentage >= keyMomentsThresholds['50'] && !currentProgress.keyMoments['50']) {
            currentProgress.keyMoments['50'] = true;
            console.log(`${classKey}: 50% alcanzado`);
            showBadgeModal();
        }
        if (percentage >= keyMomentsThresholds['100'] && !currentProgress.keyMoments['100']) {
            currentProgress.keyMoments['100'] = true;
            markAsCompleted();
        }
    }

    function markAsCompleted() {
        currentProgress.percentage = 100;
        currentProgress.keyMoments['100'] = true;
        updateProgressUI(100);
        saveProgress(currentProgress);
        console.log(`${classKey} completada`);
    }

    updateProgressUI(currentProgress.percentage);

    // ---------- Vimeo integration ----------
    const iframe = document.querySelector('iframe');
    let vimeoPlayer = null;
    let fallbackInterval = null;

    function startFallbackCounting(durationSeconds = 1200) {
        // durationSeconds por defecto = 20 minutos; ajusta si quieres
        if (fallbackInterval) return;
        const increment = 100 / durationSeconds;
        fallbackInterval = setInterval(() => {
            currentProgress.percentage = Math.min(100, currentProgress.percentage + increment);
            updateProgressUI(currentProgress.percentage);
            checkKeyMoments(currentProgress.percentage);
            saveProgress(currentProgress);
            if (currentProgress.percentage >= 100) {
                clearInterval(fallbackInterval);
                fallbackInterval = null;
            }
        }, 1000);
    }

    function stopFallbackCounting() {
        if (fallbackInterval) {
            clearInterval(fallbackInterval);
            fallbackInterval = null;
        }
    }

    function setupVimeoPlayer(iframeEl) {
        // espera a que la librería de Vimeo exista
        const waitForVimeo = (resolve, reject, attempts = 0) => {
            if (window.Vimeo && window.Vimeo.Player) return resolve();
            if (attempts > 50) return reject(new Error('Vimeo API no disponible'));
            setTimeout(() => waitForVimeo(resolve, reject, attempts + 1), 100);
        };

        return new Promise((resolve, reject) => {
            waitForVimeo(() => {
                try {
                    vimeoPlayer = new window.Vimeo.Player(iframeEl);

                    // cuando obtenemos la duración la usamos para calcular porcentajes reales
                    let videoDuration = null;
                    vimeoPlayer.getDuration().then(d => { videoDuration = d; }).catch(() => { videoDuration = null; });

                    // tiempo actual: usamos event 'timeupdate'
                    vimeoPlayer.on('timeupdate', (data) => {
                        // data.seconds, data.percent (0..1)
                        if (typeof data.percent === 'number') {
                            const perc = data.percent * 100;
                            currentProgress.percentage = perc;
                            updateProgressUI(perc);
                            checkKeyMoments(perc);
                            saveProgress(currentProgress);
                        } else if (typeof data.seconds === 'number' && videoDuration) {
                            const perc = (data.seconds / videoDuration) * 100;
                            currentProgress.percentage = perc;
                            updateProgressUI(perc);
                            checkKeyMoments(perc);
                            saveProgress(currentProgress);
                        }
                    });

                    vimeoPlayer.on('play', () => {
                        stopFallbackCounting();
                    });

                    vimeoPlayer.on('pause', () => {
                        // on pause we still save current progress (already handled in timeupdate)
                        saveProgress(currentProgress);
                    });

                    vimeoPlayer.on('ended', () => {
                        markAsCompleted();
                    });

                    // If user had progress saved, attempt to seek to that position (if >1%)
                    (async() => {
                        try {
                            if (currentProgress && currentProgress.percentage > 1) {
                                const dur = await vimeoPlayer.getDuration();
                                if (dur && dur > 0) {
                                    const seekTo = Math.min(dur, (currentProgress.percentage / 100) * dur);
                                    await vimeoPlayer.setCurrentTime(seekTo);
                                }
                            }
                        } catch (err) { /* ignore seeking errors */ }
                    })();

                    resolve();
                } catch (e) {
                    reject(e);
                }
            }, (err) => reject(err));
        });
    }

    (async() => {
        try {
            if (iframe && iframe.src && iframe.src.includes('vimeo.com')) {
                // If Vimeo player script isn't loaded yet, the promise handles waiting.
                await setupVimeoPlayer(iframe);
                // Vimeo now manages progress via events.
            } else {
                // No Vimeo iframe detected -> fallback counting (improved)
                // If you know approximate duration for this class, you can pass it:
                // e.g. startFallbackCounting(600) for 10 minutes.
                startFallbackCounting(); // default 20 minutos
            }
        } catch (e) {
            console.warn('No se pudo inicializar el player de Vimeo, activando fallback', e);
            startFallbackCounting();
        }
    })();

    // Guardado antes de salir
    window.addEventListener('beforeunload', () => {
        if (fallbackInterval) clearInterval(fallbackInterval);
        try { saveProgress(currentProgress); } catch (e) {}
    });
});
/* ============================================================
   PROGRESO TOTAL DEL CURSO (AUTOMÁTICO)
   Usa localStorage: progress_claseX
   Si no existe, usa % escrito en el HTML.
   Calcula el promedio de todas las clases.
   ============================================================ */
(function() {
    'use strict';

    function extractClassIndexFromItem(itemEl) {
        if (!itemEl) return null;
        const link = itemEl.getAttribute('href') || '';
        let m = link.match(/clase[-_]?detalle[-_]?(\d{1,2})/i) || link.match(/clase[-_]?(\d{1,2})/i);
        if (m) return m[1];

        const numNode = itemEl.querySelector('.class-number');
        if (numNode) {
            let tn = numNode.textContent.match(/(\d{1,2})/);
            if (tn) return tn[1];
        }
        return null;
    }

    function findCourseProgressTracker() {
        const trackers = document.querySelectorAll('.progress-tracker');
        for (const t of trackers) {
            const label = t.querySelector('label');
            if (label && /progreso\s*total\s*del\s*curso/i.test(label.textContent.trim())) {
                return t;
            }
        }
        return null;
    }

    function getStoredProgressForClass(index) {
        if (!index) return null;
        try {
            const raw = localStorage.getItem(`progress_clase${index}`);
            if (!raw) return null;
            const obj = JSON.parse(raw);
            if (obj && typeof obj.percentage === 'number') {
                return Math.min(100, Math.max(0, obj.percentage));
            }
        } catch (e) {}
        return null;
    }

    function getDomProgressForItem(itemEl) {
        try {
            const pBar = itemEl.querySelector('.class-progress .progress');
            if (pBar) {
                const styleWidth = pBar.style.width;
                const val = styleWidth ? styleWidth.replace('%', '') : null;
                if (val && !isNaN(val)) return Number(val);
            }
        } catch (e) {}
        return null;
    }

    function computeAndUpdateCourseProgress() {
        const items = Array.from(document.querySelectorAll('.class-item'));
        if (!items.length) return;

        let totalPercent = 0;
        let counted = 0;

        items.forEach(item => {
            const idx = extractClassIndexFromItem(item);
            let pct = idx ? getStoredProgressForClass(idx) : null;

            if (pct === null) pct = getDomProgressForItem(item);
            if (pct === null) pct = 0;

            totalPercent += pct;
            counted++;
        });

        const average = counted ? Math.round(totalPercent / counted) : 0;

        const tracker = findCourseProgressTracker();
        if (tracker) {
            const innerBar = tracker.querySelector('.progress-bar .progress');
            const textSpan = tracker.querySelector('span');
            if (innerBar) innerBar.style.width = `${average}%`;
            if (textSpan) textSpan.textContent = `${average}% completado`;
        }
        return average;
    }

    window.updateCourseProgress = computeAndUpdateCourseProgress;

    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => computeAndUpdateCourseProgress(), 120);
    });
})();