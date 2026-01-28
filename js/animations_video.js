document.addEventListener('DOMContentLoaded', () => {
    // --- Intersection Observer for scroll animations ---
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    if (animatedElements.length) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                }
            });
        }, {
            threshold: 0.1
        });

        animatedElements.forEach(element => {
            observer.observe(element);
        });
    }

    // --- Typewriter Premium Rápido (Opción 1) ---
    const typewriterElement = document.getElementById('typewriter');
    const cursorElement = document.querySelector('.cursor');

    const text =
        "Descubre los secretos para crear un entorno adecuado y seguro para tu periquito. En ésta clase te comparto las experiencias que me llevaron a aprender todo lo que te voy a compartir.";

    function typeFast() {
        let revealed = 0;

        const reveal = () => {
            revealed += 3;
            typewriterElement.textContent = text.slice(0, revealed);

            if (revealed < text.length) {
                setTimeout(reveal, 20);
            } else {
                if (cursorElement) {
                    cursorElement.style.animation = 'blinkSoft 1.2s ease-in-out infinite';
                }

                // --- Pulse 3D ultra ligero estilo iOS ---
                typewriterElement.style.animation = "iosPulse 0.6s ease-out";
            }
        };

        reveal();
    }


    // Observador para iniciar la animación
    const header = document.querySelector('.section-header');
    const typewriterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {

                // Fade inicial elegante tipo Apple
                typewriterElement.style.opacity = "0";
                typewriterElement.style.transform = "translateY(8px)";
                typewriterElement.style.transition =
                    "all 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)";

                setTimeout(() => {
                    typewriterElement.style.opacity = "1";
                    typewriterElement.style.transform = "translateY(0px)";
                    typeFast();
                }, 350);

                typewriterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    if (header) {
        typewriterObserver.observe(header);
    }
});