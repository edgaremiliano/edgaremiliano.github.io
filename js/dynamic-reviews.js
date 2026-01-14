document.addEventListener('DOMContentLoaded', () => {
    const testimonialsGrid = document.getElementById('testimonials-grid');
    const storedReviews = JSON.parse(localStorage.getItem('courseReviews')) || [];

    // Si no hay reseñas guardadas o el contenedor no existe, no hacer nada.
    if (storedReviews.length === 0 || !testimonialsGrid) {
        return;
    }

    // Limpiar las reseñas estáticas
    testimonialsGrid.innerHTML = '';

    // Función para crear una tarjeta de reseña
    const createReviewCard = (review, index) => {
        const card = document.createElement('div');
        card.className = 'review-card animate-on-scroll';
        card.style.setProperty('--animation-delay', `${index * 0.1}s`);

        const starsHTML = Array.from({ length: 5 }, (_, i) =>
            `<span>${i < review.rating ? '★' : '☆'}</span>`
        ).join('');

        card.innerHTML = `
            <div class="review-card-header">
                <div class="review-stars">${starsHTML}</div>
            </div>
            <p class="review-text">"${review.comment}"</p>
            <div class="review-author">
                <p class="author-name">- ${review.name}</p>
                <p class="author-role">Alumno del curso</p>
            </div>
        `;
        return card;
    };

    // Añadir las reseñas dinámicas a la grilla
    storedReviews.forEach((review, index) => {
        const reviewCard = createReviewCard(review, index);
        testimonialsGrid.appendChild(reviewCard);
    });

    // Re-inicializar el observador de animaciones para las nuevas tarjetas
    // (Asumiendo que el script de animación ya está observando la clase 'animate-on-scroll')
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                scrollObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        scrollObserver.observe(el);
    });
});
