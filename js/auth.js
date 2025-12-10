// ============================================================================
// 🔐 BASE DE DATOS SIMULADA DE USUARIOS AUTORIZADOS
// ============================================================================
// Este archivo contiene los accesos disponibles y el historial de accesos ya
// entregados. Está organizado por secciones para mantener control, evitar
// duplicados y asegurar que cada cliente reciba un usuario único.
// ============================================================================


// ============================================================================
// 📁 1) USUARIOS DISPONIBLES ACTUALMENTE
// ----------------------------------------------------------------------------
// Estos usuarios están libres y pueden ser otorgados a nuevos clientes.
// IMPORTANTE: No repetir usuarios ya otorgados.
// ============================================================================
export const users = [

    // Usuarios originales (excepto user1 por pruebas internas)
    { username: 'user2', password: 'password_C3d4' },
    { username: 'user3', password: 'password_E5f6' },
    { username: 'user4', password: 'password_G7h8' },
    { username: 'user5', password: 'password_I9j0' },
    { username: 'user6', password: 'password_K1l2' },
    { username: 'user7', password: 'password_M3n4' },
    { username: 'user8', password: 'password_O5p6' },
    { username: 'user9', password: 'password_Q7r8' },
    { username: 'user10', password: 'password_S9t0' },
    { username: 'user11', password: 'password_U1v2' },
    { username: 'user12', password: 'password_W3x4' },
    { username: 'user13', password: 'password_Y5z6' },
    { username: 'user14', password: 'password_a7B8' },
    { username: 'user15', password: 'password_c9D0' },
    { username: 'user16', password: 'password_e1F2' },
    { username: 'user17', password: 'password_g3H4' },
    { username: 'user18', password: 'password_i5J6' },
    { username: 'user19', password: 'password_k7L8' },
    { username: 'user20', password: 'password_m9N0' },

    // Nuevos usuarios agregados
    { username: 'user21', password: 'password_P2q3' },
    { username: 'user22', password: 'password_R4s5' },
    { username: 'user23', password: 'password_T6u7' },
    { username: 'user24', password: 'password_V8w9' },
    { username: 'user25', password: 'password_X1y2' },
    { username: 'user26', password: 'password_Z3a4' },
    { username: 'user27', password: 'password_b5C6' },
    { username: 'user28', password: 'password_d7E8' },
    { username: 'user29', password: 'password_f9G0' },
    { username: 'user30', password: 'password_h2I3' },

];


// ============================================================================
// 📁 2) USUARIOS PARA AGREGAR (Editar al crecer el sistema)
// ----------------------------------------------------------------------------
// En este espacio puedes añadir más usuarios conforme los necesites.  
// Mantén el formato y agrega usuarios al final para evitar confusiones.
// Ejemplo:
//   { username: 'user31', password: 'password_j4K5' },
// ============================================================================
/*
    // Usuarios próximos a agregar:
    // { username: 'user31', password: 'password_j4K5' },
    // { username: 'user32', password: 'password_L6m7' },
    // { username: 'user33', password: 'password_N8o9' },
*/



// ============================================================================
// 📁 3) HISTORIAL DE USUARIOS YA ENTREGADOS (SOLO COMENTARIOS)
// ----------------------------------------------------------------------------
// Aquí anota MANUALMENTE cada usuario que ya hayas otorgado a un cliente.
// Esto evita entregar accesos duplicados y te da control administrativo.
//
// ⚠ Muy importante: Eliminar el usuario de la sección 1 al asignarlo.
// ----------------------------------------------------------------------------
// EJEMPLO:
//   - user1 → usado para pruebas internas (NO disponible)
//   - user7 → entregado a cliente el 05/07/2025
//   - user12 → otorgado el 21/07/2025
// ============================================================================
/*

// ===================== HISTORIAL =====================

// user1 → Usado para pruebas (ya no disponible)

// Agrega aquí los que vayas entregando:
// -----------------------------------------------------
// userXX → Cliente: __________   Fecha: __ / __ / __
// userXX → Cliente: __________   Fecha: __ / __ / __
// userXX → Cliente: __________   Fecha: __ / __ / __

*/


export function authenticateUser(username, password) {
    return users.find(user => user.username === username && user.password === password);
}