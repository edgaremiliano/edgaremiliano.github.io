/**
 * CYSAR BIRDS - Convertidor Automático de Moneda
 * Obtiene el tipo de cambio actual y actualiza el precio en MXN
 * basado en el precio base en USD.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Configuración
    const BASE_PRICE_USD = 50; // Precio base en Dólares
    const ENDPOINT = 'https://open.er-api.com/v6/latest/USD'; // API Gratuita (no requiere key)

    // Elementos del DOM
    const mxnLabel = document.getElementById('dynamic-price-mxn');
    const usdLabel = document.getElementById('base-price-usd');

    // Actualizar etiqueta USD (por si cambiamos la constante arriba)
    if (usdLabel) usdLabel.textContent = BASE_PRICE_USD;

    // Función principal
    async function updatePrice() {
        try {
            // Intentar obtener datos de localStorage (caché simple de 24h)
            const cachedData = localStorage.getItem('exchangeRate');
            const cacheTime = localStorage.getItem('exchangeRateTime');
            const now = new Date().getTime();
            const ONE_DAY = 24 * 60 * 60 * 1000;

            let rate;

            // Usar caché si existe y es reciente (menos de 24h)
            if (cachedData && cacheTime && (now - cacheTime < ONE_DAY)) {
                rate = parseFloat(cachedData);
                console.log('Usando tasa de cambio en caché:', rate);
            } else {
                // Si no, consultar API
                const response = await fetch(ENDPOINT);
                if (!response.ok) throw new Error('Error en API');

                const data = await response.json();
                rate = data.rates.MXN;

                // Guardar en caché
                localStorage.setItem('exchangeRate', rate);
                localStorage.setItem('exchangeRateTime', now);
                console.log('Tasa de cambio actualizada:', rate);
            }

            // Calcular precio final
            // Multiplicamos y redondeamos para evitar decimales extraños (ej: 900.50 -> 901 o 900)
            // Math.ceil() redondea hacia arriba para asegurar margen
            // Math.round() redondea al más cercano
            const finalPriceMXN = Math.round(BASE_PRICE_USD * rate);

            // Efecto de actualización visual
            if (mxnLabel) {
                mxnLabel.style.opacity = '0'; // Ocultar brevemente
                setTimeout(() => {
                    mxnLabel.textContent = finalPriceMXN; // Actualizar texto
                    mxnLabel.style.opacity = '1'; // Mostrar suavemente
                }, 200);
            }

        } catch (error) {
            console.warn('No se pudo actualizar el precio automáticamente. Usando precio por defecto.', error);
            // El precio se queda en 900 (el que pusimos en el HTML) como fallback seguro.
        }
    }

    updatePrice();
});