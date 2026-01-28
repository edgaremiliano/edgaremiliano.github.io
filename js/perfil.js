import { auth } from './auth.js';
import { onAuthStateChanged, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Elementos del DOM
const emailDisplay = document.getElementById('user-email-display');
const logoutBtn = document.getElementById('logout-btn-profile');
const resetBtn = document.getElementById('reset-password-btn');
const toast = document.getElementById('toast');

// 1. Verificar estado de autenticación y mostrar datos
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Usuario logueado
        emailDisplay.textContent = user.email;
    } else {
        // Si no hay usuario, devolver al login
        window.location.href = 'login.html';
    }
});

// 2. Manejar Cierre de Sesión
logoutBtn.addEventListener('click', async() => {
    try {
        await signOut(auth);
        sessionStorage.removeItem('isLoggedIn');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        alert('Hubo un problema al cerrar sesión');
    }
});

// 3. Manejar Reset de Contraseña
resetBtn.addEventListener('click', async() => {
    const user = auth.currentUser;
    if (user && user.email) {
        try {
            // Deshabilitar botón temporalmente
            resetBtn.disabled = true;
            resetBtn.style.opacity = "0.5";

            await sendPasswordResetEmail(auth, user.email);

            // Mostrar Toast
            showToast('📩 Correo de cambio de contraseña enviado');

        } catch (error) {
            console.error('Error reset password:', error);
            showToast('❌ Error al enviar el correo. Intenta más tarde.');
        } finally {
            // Rehabilitar botón después de unos segundos
            setTimeout(() => {
                resetBtn.disabled = false;
                resetBtn.style.opacity = "1";
            }, 3000);
        }
    }
});

// Función auxiliar para notificaciones
function showToast(message) {
    toast.textContent = message;
    toast.style.opacity = '1';

    setTimeout(() => {
        toast.style.opacity = '0';
    }, 3000);
}