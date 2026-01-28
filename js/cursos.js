import { auth, db } from './auth.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* cursos.js
   Calcula y pinta el progreso sincronizado desde FIREBASE.
*/

(function() {
    'use strict';

    let currentUser = null;

    // Mapa de IDs de clases (según tus archivos HTML)
    // Esto nos ayudará a saber qué buscar en la base de datos
    const totalClasses = 10; // Ajusta según el número real de tus clases

    // ✨ MEJORA VISUAL: Estado de carga inicial (Skeleton)
    // Ponemos las barras en modo "cargando" antes de pedir datos a Firebase
    document.querySelectorAll('.class-item').forEach(item => {
        const barContainer = item.querySelector('.class-progress .progress-bar');
        const textSpan = item.querySelector('.class-progress span');

        if (barContainer) barContainer.classList.add('loading');
        if (textSpan) {
            textSpan.textContent = "Sincronizando...";
            textSpan.classList.add('status-loading');
        }
    });

    // Esperar a que Firebase confirme usuario
    onAuthStateChanged(auth, async(user) => {
        if (user) {
            currentUser = user;
            console.log("Cargando progreso para:", user.email);
            // Pequeño delay para asegurar que el DOM está listo si venimos de caché
            setTimeout(() => loadUserProgress(user.uid), 100);
        }
    });

    // ✨ FIX CRÍTICO: Recargar datos al volver con el botón "Atrás"
    // Los navegadores modernos guardan la página en memoria (BFCache).
    // Este evento detecta si la página se restauró desde ahí.
    window.addEventListener('pageshow', async(event) => {
        // Si la página viene de caché (event.persisted) o si ya tenemos usuario cargado
        if ((event.persisted || currentUser) && auth.currentUser) {
            console.log("🔄 Regreso detectado, actualizando progreso...");

            // Volvemos a poner el estado de carga visualmente
            document.querySelectorAll('.class-item').forEach(item => {
                const bar = item.querySelector('.progress-bar');
                if (bar) bar.classList.add('loading');
            });

            await loadUserProgress(auth.currentUser.uid);
        }
    });

    async function loadUserProgress(uid) {
        // Obtenemos el documento de progreso del usuario de Firestore
        const docRef = doc(db, "progreso_usuarios", uid);

        try {
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                console.log("Datos recuperados:", data);
                applyProgressToUI(data);
            } else {
                console.log("Usuario nuevo o sin progreso registrado.");
                // Si es nuevo, igual debemos quitar el efecto de carga y dejarlo en 0%
                applyProgressToUI({});
            }
        } catch (error) {
            console.error("Error leyendo progreso:", error);
            // En caso de error, también limpiamos la UI
            applyProgressToUI({});
        }
    }

    function applyProgressToUI(progressData) {
        // progressData será algo como: { 'clase1': { percentage: 50, completed: false }, 'clase2': ... }

        const items = document.querySelectorAll('.class-item');
        let totalSum = 0;
        let count = 0;

        items.forEach(item => {
            const classId = detectClassId(item);
            if (!classId) return;

            const classData = progressData[classId];
            let percent = 0;

            if (classData && classData.percentage) {
                percent = classData.percentage;
            }

            // Actualizar la tarjeta visualmente
            updateClassItemUI(item, percent);

            totalSum += percent;
            count++;
        });

        // Calcular global
        const globalAverage = count > 0 ? Math.round(totalSum / count) : 0;
        updateCourseTrackerUI(globalAverage);
    }

    function detectClassId(item) {
        // Intentar sacar el ID del HREF: classes/clase-detalle-1.html -> clase1
        const href = item.getAttribute('href') || '';
        const match = href.match(/clase-detalle-(\d+(?:-\d+)?)\.html/);
        if (match) {
            return `clase${match[1].replace('-', '_')}`; // clase1, clase4_2
        }
        return null;
    }

    // Actualiza una tarjeta (.class-item) con el porcentaje dado
    function updateClassItemUI(item, percent) {
        const barContainer = item.querySelector('.class-progress .progress-bar');
        const bar = item.querySelector('.class-progress .progress');
        const text = item.querySelector('.class-progress span');
        const rounded = Math.round(percent);

        // ✅ FINALIZAR CARGA: Removemos clases de skeleton/loading
        if (barContainer) barContainer.classList.remove('loading');
        if (text) text.classList.remove('status-loading');

        if (bar) bar.style.width = (rounded || 0) + '%';
        if (text) text.textContent = (rounded ? `${rounded}% completado` : 'Sin empezar');

        if (rounded >= 100) {
            item.classList.add('completed');
            const numNode = item.querySelector('.class-number');
            if (numNode && !numNode.querySelector('.check')) {
                const span = document.createElement('span');
                span.className = 'check';
                span.textContent = ' ✔';
                numNode.appendChild(span);
            }
        }
    }

    // Actualiza el tracker global (id=course-progress-tracker)
    function updateCourseTrackerUI(percent) {
        const tracker = document.getElementById('course-progress-tracker');
        if (!tracker) return;
        const bar = tracker.querySelector('.progress');
        const txt = tracker.querySelector('span'); // Busca el span con texto "XX% completado"

        // A veces el span está dentro de .progress-bar o fuera, aseguramos selector
        const labelText = tracker.querySelector('span:last-child') || tracker.querySelector('span');

        if (bar) bar.style.width = percent + '%';
        if (labelText) labelText.textContent = `${percent}% completado`;
    }

})();