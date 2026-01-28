import { auth } from './auth.js';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const showMessage = (message, isError = true) => {
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = message;
    // Cambia el color del mensaje: rojo para error, gris para información.
    errorMessage.style.color = isError ? '#ff7b7b' : '#B9BDC5';
    errorMessage.style.display = 'block';
};

// Al cargar la página, comprueba si el usuario fue redirigido por intentar acceder sin autorización.
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reason') === 'unauthorized') {}
});

document.getElementById('login-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = document.querySelector('.login-button');

    try {
        // Feedback visual de carga
        if (submitBtn) submitBtn.textContent = "Verificando...";

        // 🛡️ IMPORTANTE: Forzamos la persistencia LOCAL antes de loguear
        // Esto asegura que el usuario no se desconecte al cambiar de página
        await setPersistence(auth, browserLocalPersistence);

        // 🔐 Petición a los servidores de Google
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Si el login es exitoso:
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('uid', user.uid); // Guardamos el ID único de Firebase
        sessionStorage.setItem('email', user.email);

        // Redirige
        window.location.href = 'cursos.html';

    } catch (error) {
        // Manejo de errores SEGURO y profesional
        console.error("Login Error:", error.code);

        let msg = "Error al iniciar sesión.";

        // Mensajes amigables según el error de Firebase
        switch (error.code) {
            case 'auth/invalid-credential':
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                msg = "El correo o la contraseña no son correctos.";
                break;
            case 'auth/too-many-requests':
                msg = "Demasiados intentos fallidos. Intenta más tarde.";
                break;
            case 'auth/invalid-email':
                msg = "El formato del correo no es válido.";
                break;
        }

        if (submitBtn) submitBtn.textContent = "Ingresar";
        showMessage(msg);

        // Limpiamos sesión por seguridad
        sessionStorage.removeItem('isLoggedIn');
    }
});