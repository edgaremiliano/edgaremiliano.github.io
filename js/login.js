import { users } from './auth.js';

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

document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const foundUser = users.find(user => user.username === username && user.password === password);

    if (foundUser) {
        // Si el usuario es válido, establece el estado de la sesión.
        sessionStorage.setItem('isLoggedIn', 'true');
        // Redirige a la página de cursos.
        window.location.href = 'cursos.html';
    } else {
        // Si no es válido, muestra un mensaje de error.
        showMessage('Usuario o contraseña incorrectos.');
    }
});