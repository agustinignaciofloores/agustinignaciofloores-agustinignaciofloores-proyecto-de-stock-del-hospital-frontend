// utils.js - Funciones comunes para manejo de modales, alertas, sesión y navegación

const DEFAULT_BACKEND_ORIGIN = 'http://localhost:3001';

// FUNCIONES DE URL Y BACKEND

function getBackendOrigin() {
    const configuredOrigin = (window.localStorage && localStorage.getItem('backendOrigin')) || window.BACKEND_ORIGIN;
    if (configuredOrigin) {
        return String(configuredOrigin).replace(/\/+$/, '');
    }

    if (window.location.protocol === 'file:') {
        return DEFAULT_BACKEND_ORIGIN;
    }

    // En desarrollo local el frontend puede correr en otro puerto.
    // En ese caso forzamos el backend real para evitar errores de login/API.
    const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    if (isLocalHost && window.location.port && window.location.port !== '3001') {
        return DEFAULT_BACKEND_ORIGIN;
    }

    return window.location.origin || DEFAULT_BACKEND_ORIGIN;
}

// Construye la URL completa para la API del backend, asegurando que siempre comience con /api
function buildApiUrl(path = '') {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const backendOrigin = getBackendOrigin();

    if (normalizedPath === '/api') {
        return `${backendOrigin}/api`;
    }

    if (normalizedPath.startsWith('/api/')) {
        return `${backendOrigin}${normalizedPath}`;
    }

    return `${backendOrigin}/api${normalizedPath}`;
}
// Exportamos las funciones para que puedan ser usadas en otros scripts del frontend 
window.getBackendOrigin = getBackendOrigin;
// Exportamos la función buildApiUrl para que pueda ser usada en otros scripts del frontend
window.buildApiUrl = buildApiUrl;

//  FUNCIONES DE MODALES Y ALERTAS

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('show');
}
// Función para cerrar un modal y resetear su formulario si existe
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        const form = modal.querySelector('form');
        if (form) form.reset();
    }
}
// Función para mostrar alertas de manera genérica
function showAlert(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} show`; 
    alertDiv.style.whiteSpace = 'pre-line'; // Permite saltos de línea (\n) en las alertas
    alertDiv.textContent = message;
    
    const mainContent = document.querySelector('.main-content') || document.body;
    mainContent.insertBefore(alertDiv, mainContent.firstChild);
    // Elimina la alerta después de 5 segundos
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}
//  FUNCIONES DE SESIÓN
function logout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        localStorage.removeItem('usuarioLogueado');
        window.location.href = 'index.html';
    }
}

//  FUNCIONES DE NAVEGACIÓN ENTRE SECCIONES

function showSection(sectionId) {
    // Ocultar todas las secciones y quitar clases activas de los menús
    document.querySelectorAll('.section-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.sidebar-menu a').forEach(el => el.classList.remove('active'));
    // Mostrar la sección seleccionada y marcar el menú correspondiente como activo
    if (sectionId === 'dashboard') {
        const dashSec = document.getElementById('dashboard-section');
        const menuDash = document.getElementById('menu-dashboard') || document.querySelector('.sidebar-menu a[data-section="dashboard"]');
        if (dashSec) dashSec.style.display = 'block';
        if (menuDash) menuDash.classList.add('active');
    } else {
        const sec = document.getElementById(sectionId);
        if (sec) sec.style.display = 'block';
        
        const menuBtn = document.querySelector(`.sidebar-menu a[data-section="${sectionId}"]`);
        if (menuBtn) menuBtn.classList.add('active');
    }
}

//  CONFIGURACIÓN DE ESCUCHAS GLOBALES

document.addEventListener("DOMContentLoaded", () => {

    // --- MANEJO DE SESIÓN VISUAL (Escudado contra nulos y multi-rol) ---
    const loggedUser = JSON.parse(localStorage.getItem("usuarioLogueado"));
    const userNameLabel = document.getElementById("doctorName") || document.getElementById("userName");
    if (userNameLabel && loggedUser) {
        userNameLabel.textContent = loggedUser.usuario || loggedUser.nombre || "Usuario";
    }

    // --- BOTÓN LOGOUT ---
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) btnLogout.addEventListener('click', logout);

    // --- MANEJO DE SIDEBARS GENÉRICO (Se adapta al nombre de el usuario que ingresa) ---
    const sidebarMenus = document.querySelectorAll('.sidebar-menu, [id^="sidebarMenu"]');
    sidebarMenus.forEach(sidebar => {
        sidebar.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                const section = link.getAttribute('data-section');
                if (section) {
                    e.preventDefault();
                    showSection(section);
                }
            });
        });
    });

    // --- CONTROLADORES DE MODAL REUTILIZABLES DE REGISTRO ---
    const btnOpenRegister = document.getElementById('btnOpenRegister');
    const btnCloseRegisterX = document.getElementById('btnCloseRegisterX');
    const btnCancelRegister = document.getElementById('btnCancelRegister');

    if (btnOpenRegister) btnOpenRegister.addEventListener('click', (e) => { e.preventDefault(); openModal('modalRegister'); });
    if (btnCloseRegisterX) btnCloseRegisterX.addEventListener('click', () => closeModal('modalRegister'));
    if (btnCancelRegister) btnCancelRegister.addEventListener('click', () => closeModal('modalRegister'));

    // Cerrar modales clickeando afuera (en el backdrop)
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target.id);
        }
    });

    // === 1. LÓGICA DE REGISTRO ===
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", async function(event) {
            event.preventDefault();
            let errores = [];

            const usuario = document.getElementById("usuario_reg").value.trim();
            if (usuario.length < 4) errores.push("El usuario debe tener al menos 4 caracteres.");

            const pass = document.getElementById("contraseña_reg").value;
            const passConfirm = document.getElementById("contraseña_reg_confirm").value;
            if (pass.length < 6) errores.push("La contraseña debe tener al menos 6 caracteres.");
            if (pass !== passConfirm) errores.push("Las contraseñas no coinciden.");

            const dni = document.getElementById("DNI").value;
            if (!/^\d{7,10}$/.test(dni)) errores.push("El DNI debe ser un número válido entre 7 y 10 dígitos.");

            const email = document.getElementById("email").value;
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errores.push("El email no tiene un formato válido.");

            const edad = parseInt(document.getElementById("edad").value);
            if (isNaN(edad) || edad <= 0 || edad > 99) errores.push("La edad debe ser un número entre 1 y 99.");

            const telefono = document.getElementById("telefono").value;
            if (telefono && !/^\d{7,15}$/.test(telefono)) errores.push("El teléfono debe contener entre 7 y 15 dígitos.");

            if (errores.length > 0) {
                showAlert("danger", "Errores encontrados:\n- " + errores.join("\n- "));
            } else {
                const datos = {
                    usuario,
                    contraseña: pass,
                    dni,
                    apellido: document.getElementById("apellido").value,
                    nombre: document.getElementById("nombre").value,
                    telefono,
                    sexo: document.getElementById("sexo").value,
                    fecha_nac: document.getElementById("fecha_nac").value,
                    email,
                    edad,
                    estado_civil: document.getElementById("estado_civil").value,
                    etnia: document.getElementById("etnia").value,
                    discapacidad: document.getElementById("discapacidad").value,
                    provincia: document.getElementById("provincia").value,
                    localidad: document.getElementById("localidad").value,
                    barrio: document.getElementById("barrio").value,
                    calle: document.getElementById("calle").value,
                    manzana: document.getElementById("manzana").value,
                    n_casa: document.getElementById("n_casa").value,
                    cp: document.getElementById("cp").value,
                    pais: document.getElementById("pais").value,
                    rol: document.getElementById("rol").value
                };
                // Enviar datos al backend para registro
                try {
                    const response = await fetch(buildApiUrl('/registro'), {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(datos)
                    });
                
                    const result = await response.json();
                    if (result.success) {
                        showAlert("success", "Registro exitoso. ¡Bienvenido!");
                        closeModal("modalRegister");
                    } else {
                        showAlert("danger", "Error: " + result.message);
                    }
                } catch (error) {
                    console.error("Error al registrar:", error);
                    showAlert("danger", "No se pudo conectar con el servidor backend");
                }
            }
        });
    }

    // === 2. LÓGICA DE LOGIN ===
    const loginForm = document.getElementById("loginForm"); 
    if (loginForm) {
        loginForm.addEventListener("submit", async function(event) {
            event.preventDefault();

            const usuarioInput = document.getElementById("usuario");
            const contraseniaInput = document.getElementById("contraseña");

            if (!usuarioInput || !contraseniaInput) return;

            const usuario = usuarioInput.value.trim();
            const contrasenia = contraseniaInput.value;

            try {
                const response = await fetch(buildApiUrl('/login'), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ usuario, contraseña: contrasenia })
                });

                const result = await response.json();
                // Manejo de la respuesta del backend
                if (result.success) {
                    showAlert("success", "¡Inicio de sesión correcto! Redirigiendo...");
                    localStorage.setItem("usuarioLogueado", JSON.stringify(result.usuario));

                    setTimeout(() => {
                        const rolOriginal = result.rol || (result.usuario && result.usuario.rol) || "paciente";
                        const rol = rolOriginal.toLowerCase().trim();
                        
                        let destino = "index.html";

                        if (rol === "doctor" || rol === "medico" || rol === "médico") {
                            destino = "doctor.html"; 
                        } else if (rol === "paciente" || rol === "usuario") {
                            destino = "paciente.html";
                        } else if (rol === "admin" || rol === "administrador") {
                            destino = "gestionar-roles.html"; 
                        } else if (rol === "almacenero") {
                            destino = "almacenero.html"; 
                        } else if (rol === "cocinero") {
                            destino = "cocinero.html"; 
                        } else if (rol === "donaciones" || rol === "donacion") {
                            destino = "donaciones.html"; 
                        } else if (rol === "visitas" || rol === "visita") {
                            destino = "visitas.html"; 
                        }

                        window.location.replace(destino);
                    }, 1000);

                } else {
                    showAlert("danger", "Error: " + result.message);
                }
            } catch (error) {
                console.error("Error al iniciar sesión:", error);
                showAlert("danger", "No se pudo conectar con el servidor backend.");
            }
        });
    }

    // === 3. INICIALIZADOR DE TABLAS ACTIVAS DE MÓDULOS ===
    // Ejecuta de forma segura la función de actualización de la tabla del módulo en la vista que se encuentre.
    if (typeof actualizarTablaPersonas === 'function') actualizarTablaPersonas();
    if (typeof actualizarTablaPersonal === 'function') actualizarTablaPersonal();
    if (typeof actualizarTablaPatologias === 'function') actualizarTablaPatologias();
    if (typeof actualizarTablaPacientes === 'function') actualizarTablaPacientes();
    if (typeof actualizarTablaMovimientos === 'function') actualizarTablaMovimientos();
    if (typeof actualizarTablaMenus === 'function') actualizarTablaMenus();
    if (typeof actualizarTablaInventario === 'function') actualizarTablaInventario();
    if (typeof actualizarTablaIngresos === 'function') actualizarTablaIngresos();
    if (typeof actualizarTablaHabitaciones === 'function') actualizarTablaHabitaciones();
});

console.log('Script utils.js cargado e inicializado correctamente.');