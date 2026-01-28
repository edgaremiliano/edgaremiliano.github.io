import { auth } from './auth.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

(function() {
    // Función para manejar redirección segura (funciona desde raíz o subcarpetas)
    const redirectToLogin = (reason) => {
        // Detectar si estamos en una subcarpeta (haciendo check de profundidad)
        const isSubfolder = window.location.pathname.includes('/clases/');
        const prefix = isSubfolder ? '../' : '';
        window.location.replace(`${prefix}login.html?reason=${reason}`);
    };

    // 1. Verificación rápida (Cliente) para evitar 'flicker'
    const localCheck = sessionStorage.getItem('isLoggedIn');

    // Si NO hay marca local, expulsar inmediatamente
    if (localCheck !== 'true') {
        redirectToLogin('unauthorized');
        return;
    }

    // 2. Verificación REAL (Servidor) con tolerancia
    // Esperamos a que Firebase cargue. Si devuelve null, verifiquemos si realmente terminó de cargar.

    // Bandera para no redirigir múltiples veces
    let hasRedirected = false;

    onAuthStateChanged(auth, (user) => {
        if (!user) {
            // Firebase ha terminado de cargar y NO encontró usuario.
            // INTENTO DE RECUPERACIÓN:
            // Si sessionStorage dice que estamos logueados, pero Firebase dice que no,
            // podría ser un retraso de red o carga. Damos un pequeño margen de duda.

            console.warn("Firebase no detecta usuario. Verificando estado local...");

            // Si el sessionStorage está marcado, la expulsión no debería ser inmediata si estamos en un flujode carga
            // Pero como onAuthStateChanged ya es el estado final de carga, significa que la sesión se perdió
            // o no se pudo recuperar (ej: abriendo en file://).

            if (!hasRedirected) {
                hasRedirected = true;
                console.log("Sesión no válida. Cerrando sesión local y redirigiendo.");
                sessionStorage.removeItem('isLoggedIn');
                sessionStorage.removeItem('uid');
                sessionStorage.removeItem('email');

                redirectToLogin('session_expired');
            }
        } else {
            console.log("✅ Sesión activa:", user.email);
            // Si el usuario existe, nos aseguramos que sessionStorage esté sincronizado
            if (sessionStorage.getItem('isLoggedIn') !== 'true') {
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('uid', user.uid);
            }
        }
    });

})();