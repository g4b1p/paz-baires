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

// --- FUNCIÓN DEL CONTADOR GLOBAL ---
window.actualizarContadorCarrito = function () {
  const carrito = JSON.parse(localStorage.getItem("carrito")) || [];

  // Sumamos la cantidad de unidades
  const totalItems = carrito.reduce(
    (acc, item) => acc + (parseInt(item.cantidad) || 1),
    0,
  );

  document.querySelectorAll(".contador-carrito").forEach((badge) => {
    // Truco de rendimiento: Solo modificamos el HTML si el número es diferente al que ya tiene
    if (badge.textContent !== totalItems.toString()) {
      badge.textContent = totalItems;
    }

    // Solo modificamos el display si no está correcto
    const estadoDisplay = totalItems > 0 ? "flex" : "none";
    if (badge.style.display !== estadoDisplay) {
      badge.style.display = estadoDisplay;
    }
  });
};

// 1. Intentamos ejecutarlo apenas carga la página
document.addEventListener("DOMContentLoaded", window.actualizarContadorCarrito);

// 2. EL VIGÍA SILENCIOSO (La solución al problema)
// Se ejecuta cada 500 milisegundos (medio segundo). Si componentes.js o la tienda
// recargan el header y borran nuestro número, esto lo restaura instantáneamente.
setInterval(window.actualizarContadorCarrito, 500);
