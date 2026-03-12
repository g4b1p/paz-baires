// --- LÓGICA DEL FOOTER (WHATSAPP) ---
function sendMessage() {
  // Obtener el valor del campo de texto
  var message = document.getElementById("user-message").value;

  // Codificar el mensaje para que sea seguro en la URL
  var encodedMessage = encodeURIComponent(message);

  // Construir el enlace de WhatsApp con el mensaje del usuario
  var whatsappUrl =
    "https://api.whatsapp.com/send?phone=%2B541128506874&text=" +
    encodedMessage;

  // Abrir el enlace en una nueva ventana
  window.open(whatsappUrl, "_blank");

  // Limpiar el campo de texto después de enviar el mensaje
  document.getElementById("user-message").value = "";
}

// --- LÓGICA DEL CARRUSEL ---
window.scrollCarrusel = function (direction, idContenedor) {
  const contenedor = document.getElementById(idContenedor);
  if (!contenedor) return;

  const primeraTarjeta = contenedor.querySelector(".producto-card");
  const anchoTarjeta = primeraTarjeta.offsetWidth + 20;

  // Calculamos si llegó al final
  const maxScroll = contenedor.scrollWidth - contenedor.clientWidth;

  if (direction === 1 && contenedor.scrollLeft >= maxScroll - 5) {
    // Si va a la derecha y llegó al final -> vuelve al inicio
    contenedor.scrollTo({ left: 0, behavior: "smooth" });
  } else if (direction === -1 && contenedor.scrollLeft <= 5) {
    // Si va a la izquierda y está al inicio -> va al final
    contenedor.scrollTo({ left: maxScroll, behavior: "smooth" });
  } else {
    // Movimiento normal
    contenedor.scrollBy({ left: direction * anchoTarjeta, behavior: "smooth" });
  }
};

// --- CONFIGURACIÓN DEL AUTO-PLAY ---
let autoScrollDestacados;

function iniciarAutoScroll() {
  autoScrollDestacados = setInterval(() => {
    // Usamos la función que ya tenemos.
    // Si llega al final, el navegador es inteligente y no hará nada,
    // o podemos programar que vuelva al inicio.
    scrollCarrusel(1, "grid-destacados");
    scrollCarrusel(1, "grid-ofertas"); // También para ofertas si quieres
  }, 4000); // 4000ms = 4 segundos por cada movimiento
}

// Detener el movimiento cuando el usuario interactúa
function detenerAutoScroll() {
  clearInterval(autoScrollDestacados);
}

// Iniciar cuando cargue la página
window.onload = iniciarAutoScroll;

// (Opcional) Detener si el mouse entra al carrusel y reanudar al salir
const grids = document.querySelectorAll(".grid-productos");
grids.forEach((grid) => {
  grid.addEventListener("mouseenter", detenerAutoScroll);
  grid.addEventListener("mouseleave", iniciarAutoScroll);
});

// Añade esto en tu función configurarEscuchadores() en tienda.js
const navToggle = document.getElementById("nav-toggle");
const menuOverlay = document.getElementById("menuOverlay");

if (navToggle && menuOverlay) {
  navToggle.addEventListener("change", () => {
    if (navToggle.checked) {
      menuOverlay.style.display = "block";
      document.body.style.overflow = "hidden"; // Bloquea scroll
    } else {
      menuOverlay.style.display = "none";
      document.body.style.overflow = "auto";
    }
  });

  // Si hacen click en el fondo nublado, se cierra el menú
  menuOverlay.addEventListener("click", () => {
    navToggle.checked = false;
    menuOverlay.style.display = "none";
    document.body.style.overflow = "auto";
  });
}

function actualizarContadorCarrito() {
  const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  const badge = document.getElementById("cart-count");

  if (badge) {
    // Sumamos todas las cantidades de los productos en el carrito
    const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);

    if (totalItems > 0) {
      badge.innerText = totalItems;
      badge.style.display = "flex"; // Lo mostramos si hay items
    } else {
      badge.style.display = "none"; // Lo ocultamos si está vacío
    }
  }
}

// Ejecutar al cargar la página
document.addEventListener("DOMContentLoaded", actualizarContadorCarrito);
