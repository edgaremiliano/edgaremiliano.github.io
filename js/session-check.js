(function() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (isLoggedIn !== 'true') {
        // Si el usuario no está logueado, redirige a la página de login.
        // Usamos replace para que no pueda volver a la página de cursos con el botón de "atrás".
        window.location.replace('login.html?reason=unauthorized');
    }
})();