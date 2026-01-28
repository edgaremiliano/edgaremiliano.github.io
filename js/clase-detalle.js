import { auth, db } from './auth.js';
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// clase-detalle.js - integración precisa de progreso con Vimeo + FIRESTORE
document.addEventListener('DOMContentLoaded', () => {
    if (window.AOS && AOS.init) AOS.init();

    let currentUser = null;
    let unsubscribeAuth = null;

    // Elementos UI
    const progressBar = document.getElementById('class-progress-bar');
    const progressText = document.getElementById('class-progress-text');
    const badgeModal = document.getElementById('badge-modal');
    const closeBadgeModalBtn = document.getElementById('close-badge-modal');

    // ✨ NUEVO: Indicador visual de estado de guardado
    const statusIndicator = document.createElement('div');
    statusIndicator.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(15, 23, 42, 0.9);
        color: #fff;
        padding: 8px 16px;
        border-radius: 50px;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 9999;
        border: 1px solid rgba(255,255,255,0.1);
        pointer-events: none;
    `;
    statusIndicator.innerHTML = '<i class="fas fa-circle-notch fa-spin" style="color: #2EFF7B"></i> Guardando progreso...';
    document.body.appendChild(statusIndicator);

    function showSavingStatus() {
        statusIndicator.innerHTML = '<i class="fas fa-circle-notch fa-spin" style="color: #2EFF7B"></i> Guardando...';
        statusIndicator.style.opacity = '1';
    }

    function showSavedStatus() {
        statusIndicator.innerHTML = '<i class="fas fa-check" style="color: #2EFF7B"></i> Progreso guardado';
        setTimeout(() => {
            statusIndicator.style.opacity = '0';
        }, 2000);
    }

    if (closeBadgeModalBtn) {
        closeBadgeModalBtn.addEventListener('click', () => badgeModal.classList.remove('show'));
    }
    window.addEventListener('click', (e) => { if (e.target === badgeModal) badgeModal.classList.remove('show'); });

    // Detectar ID de la clase
    function detectClassKey() {
        // Intentar sacar del nombre del archivo: clase-detalle-4-2.html -> clase4_2
        const path = window.location.pathname;
        const match = path.match(/clase-detalle-(\d+(?:-\d+)?)\.html/);

        if (match) {
            return `clase${match[1].replace('-', '_')}`;
        }

        // Fallback antiguos
        const bodyKey = document.body.getAttribute('data-video');
        if (bodyKey) return bodyKey;

        return 'clase_generica';
    }

    const classKey = detectClassKey();
    console.log("Gestionando progreso para:", classKey);

    // Estado local
    let currentProgress = { percentage: 0, completed: false };

    // ==========================================
    // 🔥 CONEXIÓN CON FIREBASE
    // ==========================================
    onAuthStateChanged(auth, async(user) => {
        if (user) {
            currentUser = user;
            await loadProgressFromCloud();
        } else {
            console.warn("No hay usuario logueado en la clase.");
            // session-check.js se encargará de redirigir, pero por si acaso:
            // window.location.href = '../login.html'; 
        }
    });

    async function loadProgressFromCloud() {
        if (!currentUser) return;
        try {
            const userRef = doc(db, "progreso_usuarios", currentUser.uid);
            const docSnap = await getDoc(userRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data[classKey]) {
                    currentProgress = data[classKey];
                    updateProgressUI(currentProgress.percentage);

                    // Si ya estaba completada, restaurar estado completo si es necesario
                    if (currentProgress.percentage >= 100) markAsCompleted(false); // false = no guardar de nuevo
                }
            }
        } catch (e) {
            console.error("Error cargando progreso:", e);
        }
    }

    async function saveProgressToCloud() {
        if (!currentUser) return;

        // Visual feedback
        showSavingStatus();

        const userRef = doc(db, "progreso_usuarios", currentUser.uid);

        const updateData = {};
        updateData[classKey] = {
            percentage: currentProgress.percentage,
            lastUpdated: new Date().toISOString(),
            completed: currentProgress.percentage >= 99 // Margen de error
        };

        try {
            await setDoc(userRef, updateData, { merge: true });
            console.log("Progreso guardado en nube:", currentProgress.percentage);
            showSavedStatus(); // ✨ Confirmación visual
        } catch (e) {
            console.error("Error guardando progreso:", e);
            statusIndicator.innerHTML = '<i class="fas fa-exclamation-circle" style="color: #ff4444"></i> Error al guardar';
        }
    }

    // Debounce para no saturar Firebase (ahora 2 segundos en lugar de 5)
    let saveTimeout;

    function triggerSave() {
        showSavingStatus(); // ✨ Mostrar "Guardando..." inmediatamente
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveProgressToCloud, 2000);
    }

    function updateProgressUI(percentage) {
        const rounded = Math.min(100, Math.round(percentage));
        if (progressBar) progressBar.style.width = `${rounded}%`;
        if (progressText) progressText.textContent = `${rounded}% completado`;
    }

    function checkKeyMoments(percentage) {
        // Lógica de insignias o momentos clave aquí
        if (percentage >= 100 && !currentProgress.completed) {
            markAsCompleted(true);
        }
    }

    function markAsCompleted(shouldSave = true) {
        currentProgress.percentage = 100;
        currentProgress.completed = true;
        updateProgressUI(100);
        if (shouldSave) saveProgressToCloud();
        // showBadgeModal(); // Si quieres mostrar la insignia al terminar
    }


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
            triggerSave();
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

                            // Solo actualizamos si el nuevo progreso es MAYOR al actual (para no retroceder si el usuario repite una parte)
                            // Opcional: permitir retroceder visualmente, pero normalmente en cursos se guarda el "máximo alcanzado"
                            if (perc > currentProgress.percentage) {
                                currentProgress.percentage = perc;
                                updateProgressUI(perc);
                                triggerSave(); // Guardar en nube
                            }
                        }
                    });

                    // ✨ MEJORA: Guardar inmediatamente al pausar
                    vimeoPlayer.on('pause', () => {
                        console.log("Video pausado, forzando guardado...");
                        clearTimeout(saveTimeout); // Cancelar el debounce pendiente
                        showSavingStatus();
                        saveProgressToCloud(); // Guardar YA
                    });

                    vimeoPlayer.on('ended', () => {
                        markAsCompleted();
                    });

                    // Modificación: Restaurar posición del video si el alumno regresa
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
        try { saveProgressToCloud(); } catch (e) {}
    });
});