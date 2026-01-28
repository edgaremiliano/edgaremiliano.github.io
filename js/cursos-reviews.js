const API_URL = 'http://localhost:3000/api/reviews';

document.addEventListener('DOMContentLoaded', () => {
    // 🔐 Validar sesión y obtener nombre de usuario (Fixed: Usar email si username no existe)
    let username = sessionStorage.getItem('username');
    const email = sessionStorage.getItem('email');
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';

    // Si no hay marca de sesión ni email, redirigir
    if (!isLoggedIn && !username && !email) {
        console.warn("Seguridad de Reseñas: No se detectó sesión válida.");
        window.location.href = 'login.html';
        return;
    }

    // Fallback: Si no hay username definido, usamos el email
    if (!username && email) {
        username = email;
    }

    // Ya no se rellena automáticamente el nombre. El usuario debe introducirlo.
    const reviewNameInput = document.getElementById('review-name');
    const starRatingInput = document.querySelector('.star-rating-input');
    const ratingValueInput = document.getElementById('rating-value');
    const reviewForm = document.getElementById('review-form');
    const reviewMessage = document.getElementById('review-message');
    const reviewsWrapper = document.getElementById('submitted-reviews-wrapper');
    const reviewsGrid = document.getElementById('submitted-reviews-grid');

    // Asegurarse de que los elementos existen antes de añadir listeners
    if (!reviewNameInput || !starRatingInput || !ratingValueInput || !reviewForm || !reviewMessage || !reviewsWrapper || !reviewsGrid) {
        console.error("No se encontraron todos los elementos del formulario o de la grilla de reseñas.");
        return;
    }

    const stars = starRatingInput.querySelectorAll('i');

    // --- Función para renderizar una tarjeta de reseña ---
    const renderReview = (review) => {
        const reviewCard = document.createElement('div');
        reviewCard.className = 'submitted-review-card';
        reviewCard.dataset.reviewId = review.id; // Asignar ID a la tarjeta

        const starsHTML = Array.from({ length: 5 }, (_, i) =>
            `<i class="${i < review.rating ? 'fas' : 'far'} fa-star"></i>`
        ).join('');

        // Botón de eliminar solo si la reseña pertenece al usuario actual
        const deleteButtonHTML = review.ownerUsername === username ?
            `<button class="delete-review-btn" data-review-id="${review.id}">&times;</button>` :
            '';

        reviewCard.innerHTML = `
            ${deleteButtonHTML}
            <div class="review-stars">${starsHTML}</div>
            <p class="review-text">"${review.comment}"</p>
            <p class="review-author">- ${review.publicName}</p>
        `;

        reviewsGrid.appendChild(reviewCard);
    };

    // --- Función para cargar y mostrar las reseñas desde localStorage ---
    const loadReviews = () => {
        const storedReviews = JSON.parse(localStorage.getItem('courseReviews')) || [];
        if (storedReviews.length > 0) {
            reviewsGrid.innerHTML = ''; // Limpiar para evitar duplicados
            storedReviews.forEach(review => renderReview(review));
            reviewsWrapper.style.display = 'block'; // Mostrar el contenedor si hay reseñas
        }
    };

    // Cargar reseñas existentes al iniciar
    loadReviews();

    // --- Lógica para la calificación con estrellas ---
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const value = parseInt(star.dataset.value);
            ratingValueInput.value = value;

            stars.forEach(s => {
                s.classList.toggle('fas', parseInt(s.dataset.value) <= value);
                s.classList.toggle('far', parseInt(s.dataset.value) > value);
            });
        });

        star.addEventListener('mouseover', () => {
            const hoverValue = parseInt(star.dataset.value);
            stars.forEach(s => {
                if (parseInt(s.dataset.value) <= hoverValue) {
                    s.classList.add('fas');
                    s.classList.remove('far');
                }
            });
        });

        star.addEventListener('mouseout', () => {
            const currentValue = parseInt(ratingValueInput.value);
            stars.forEach(s => {
                if (parseInt(s.dataset.value) > currentValue) {
                    s.classList.remove('fas');
                    s.classList.add('far');
                }
            });
        });
    });

    // --- Lógica para el envío del formulario ---
    reviewForm.addEventListener('submit', async(e) => {
        e.preventDefault();

        const publicName = reviewNameInput.value.trim();
        const rating = ratingValueInput.value;
        const comment = document.getElementById('review-comment').value.trim();

        // Validación
        if (!publicName || rating === '0' || !comment) {
            reviewMessage.textContent = 'Por favor, completa tu nombre, calificación y comentario.';
            reviewMessage.style.color = '#E53E3E'; // Rojo para error
            reviewMessage.classList.add('show');
            return;
        }

        try {
            const newReview = {
                id: Date.now(), // ID único para la reseña
                ownerUsername: username, // Usuario de la sesión para control
                publicName: publicName, // Nombre público del formulario
                rating: parseInt(rating),
                comment: comment
            };

            // 1. Guardar en localStorage
            const storedReviews = JSON.parse(localStorage.getItem('courseReviews')) || [];
            storedReviews.push(newReview);
            localStorage.setItem('courseReviews', JSON.stringify(storedReviews));

            // 2. Renderizar la nueva reseña en el DOM
            renderReview(newReview);
            reviewsWrapper.style.display = 'block'; // Asegurarse de que el contenedor sea visible

            // Mostrar mensaje de éxito
            reviewMessage.textContent = '¡Gracias por tu valoración!';
            reviewMessage.style.color = 'var(--green-accent)';
            reviewMessage.classList.add('show');

            // Deshabilitar el formulario y resetear después de un tiempo
            reviewForm.style.pointerEvents = 'none';
            setTimeout(() => {
                reviewForm.reset();
                ratingValueInput.value = '0';
                stars.forEach(s => {
                    s.classList.remove('fas');
                    s.classList.add('far');
                });
                reviewMessage.classList.remove('show');
                reviewForm.style.pointerEvents = 'auto';
            }, 3500);

        } catch (error) {
            reviewMessage.textContent = 'Hubo un error al enviar tu reseña. Inténtalo de nuevo.';
            reviewMessage.style.color = '#E53E3E';
            reviewMessage.classList.add('show');
            console.error('Error al enviar formulario:', error);
        }
    });

    // --- Lógica para eliminar una reseña (Event Delegation) ---
    reviewsGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-review-btn')) {
            const reviewId = parseInt(e.target.dataset.reviewId);

            // 1. Eliminar del localStorage
            let storedReviews = JSON.parse(localStorage.getItem('courseReviews')) || [];
            storedReviews = storedReviews.filter(review => review.id !== reviewId);
            localStorage.setItem('courseReviews', JSON.stringify(storedReviews));

            // 2. Eliminar del DOM
            const cardToRemove = document.querySelector(`.submitted-review-card[data-review-id="${reviewId}"]`);
            if (cardToRemove) {
                cardToRemove.remove();
            }

            // Opcional: Ocultar el contenedor si no quedan reseñas
            if (storedReviews.length === 0) {
                reviewsWrapper.style.display = 'none';
            }
        }
    });
});