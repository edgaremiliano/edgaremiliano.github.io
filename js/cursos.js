/* cursos.js
   Calcula y pinta:
   - progreso individual en cada .class-item (usando localStorage progress_claseX)
   - progreso total del curso (promedio de las clases)
   - marca con clase .completed las clases con >=100%
*/

(function() {
    'use strict';

    // Obtiene porcentaje guardado para 'claseN' desde localStorage (clave: progress_claseN)
    function getStoredClassPercent(n) {
        try {
            const raw = localStorage.getItem(`progress_clase${n}`);
            if (!raw) return null;
            const obj = JSON.parse(raw);
            if (obj && typeof obj.percentage === 'number') {
                return Math.min(100, Math.max(0, Math.round(obj.percentage)));
            }
        } catch (e) {}
        return null;
    }

    // Extrae número de clase desde elemento .class-item (href o .class-number)
    function extractIndexFromItem(item) {
        if (!item) return null;
        const href = item.getAttribute('href') || '';
        const m = href.match(/clase[-_]?detalle[-_]?(\d{1,2})/i) || href.match(/clase[-_]?(\d{1,2})/i);
        if (m) return Number(m[1]);
        const numNode = item.querySelector('.class-number');
        if (numNode) {
            const tn = (numNode.textContent || '').match(/(\d{1,2})/);
            if (tn) return Number(tn[1]);
        }
        return null;
    }

    // Actualiza una tarjeta (.class-item) con el porcentaje dado
    function updateClassItemUI(item, percent) {
        const bar = item.querySelector('.class-progress .progress');
        const text = item.querySelector('.class-progress span');

        if (bar) bar.style.width = (percent || 0) + '%';
        if (text) text.textContent = (percent ? `${percent}% completado` : 'Sin empezar');

        if (percent >= 100) {
            item.classList.add('completed');
            // Añadir check visual si no existe ya
            const numNode = item.querySelector('.class-number');
            if (numNode && !numNode.querySelector('.check')) {
                const span = document.createElement('span');
                span.className = 'check';
                span.textContent = ' ✔';
                numNode.appendChild(span);
            }
        } else {
            item.classList.remove('completed');
            const chk = item.querySelector('.class-number .check');
            if (chk) chk.remove();
        }
    }

    // Calcula promedio de todas las clases presentes en la página (.class-item)
    function computeCourseProgressFromItems() {
        const items = Array.from(document.querySelectorAll('.class-item'));
        if (!items.length) return 0;
        let sum = 0;
        let cnt = 0;
        items.forEach(item => {
            const idx = extractIndexFromItem(item);
            let pct = null;
            if (idx) pct = getStoredClassPercent(idx);
            // fallback: intenta leer porcentaje del DOM (si ya lo había)
            if (pct === null) {
                const pBar = item.querySelector('.class-progress .progress');
                if (pBar) {
                    const styleWidth = pBar.style.width || '';
                    const num = styleWidth.replace('%', '').trim();
                    if (num && !isNaN(num)) pct = Number(num);
                }
            }
            if (pct === null) pct = 0;
            updateClassItemUI(item, pct);
            sum += pct;
            cnt++;
        });
        return cnt ? Math.round(sum / cnt) : 0;
    }

    // Actualiza el tracker global (id=course-progress-tracker)
    function updateCourseTrackerUI(percent) {
        const tracker = document.getElementById('course-progress-tracker');
        if (!tracker) return;
        const bar = tracker.querySelector('.progress');
        const txt = tracker.querySelector('span');
        if (bar) bar.style.width = percent + '%';
        if (txt) txt.textContent = `${percent}% completado`;
    }

    // Función pública que actualiza todo (exponible)
    function computeAndUpdateCourseProgress() {
        const percent = computeCourseProgressFromItems();
        updateCourseTrackerUI(percent);
        return percent;
    }

    // Si no existe ya, exponer en window (para que otros scripts puedan llamarlo)
    if (typeof window.updateCourseProgress !== 'function') {
        window.updateCourseProgress = computeAndUpdateCourseProgress;
    } else {
        // si ya existe una función, también queremos poder correr el UI adaptado aquí
        // por eso dejamos disponible computeAndUpdateCourseProgress como alias
        window.updateCourseProgressLocalUI = computeAndUpdateCourseProgress;
    }

    // Ejecutar al cargar la página
    document.addEventListener('DOMContentLoaded', () => {
        // Pequeño delay para que el DOM esté completamente renderizado
        setTimeout(() => {
            // Si ya existe window.updateCourseProgress definida en otro script, preferir llamarla
            if (typeof window.updateCourseProgress === 'function' && window.updateCourseProgress !== computeAndUpdateCourseProgress) {
                try {
                    // Llama a la función global (que puede recalcular y actualizar)
                    window.updateCourseProgress();
                } catch (e) {
                    // fallback local
                    computeAndUpdateCourseProgress();
                }
            } else {
                computeAndUpdateCourseProgress();
            }
        }, 100);
    });

    // Export para uso manual si se desea
    window.computeAndUpdateCourseProgress = computeAndUpdateCourseProgress;

})();