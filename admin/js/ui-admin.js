// Variable global para que el buscador pueda acceder desde afuera
window.listaCompletaAdmin = [];

async function cargarTodosParaAdmin() {
  const API_URL =
    "https://script.google.com/macros/s/AKfycbwUw5LrPHWpOz8gxbmObj8E0oE6Ccaew2JR3Y63OX2VTNBxdFno-EgjxXjQEMY6NFvg/exec";

  try {
    const respuesta = await fetch(API_URL, {
      method: "GET",
      redirect: "follow",
    });
    const data = await respuesta.json();

    // 1. FILTRAR FILAS VACÍAS Y MAPEAR
    // Usamos .filter para asegurarnos de que el producto tenga un nombre
    const listaLimpia = data
      .filter((p) => p.Nombre && p.Nombre.toString().trim() !== "")
      .map((p) => {
        const coleccionParaRuta = p.Colección
          ? p.Colección.toLowerCase().trim()
          : "varios";

        return {
          id: parseInt(p.ID) || 0,
          nombre: p.Nombre,
          precio: parseFloat(p.Precio) || 0,
          estado: p.Estado ? p.Estado.toLowerCase().trim() : "",
          imagenes: p.Imágenes
            ? p.Imágenes.split(",").map((img) => {
                const imgLimpia = img.trim();
                return imgLimpia.startsWith("http")
                  ? imgLimpia
                  : `../images/productos/${coleccionParaRuta}/${imgLimpia}`;
              })
            : [],
        };
      });

    // 2. GUARDAR EN LA VARIABLE GLOBAL (Vital para el buscador)
    window.listaCompletaAdmin = listaLimpia;

    renderizarAdmin(window.listaCompletaAdmin);
  } catch (e) {
    console.error("Error cargando todo:", e);
  }
}

// Lógica de esqueletos (Mantenemos tu código pero corregimos el ID del contenedor)
document.addEventListener("DOMContentLoaded", () => {
  const contenedor = document.getElementById("contenedor-admin"); // Cambiado a contenedor-admin
  if (!contenedor) return;

  let esqueletosHTML = "";
  for (let i = 0; i < 8; i++) {
    esqueletosHTML += `
      <div class="producto-card skeleton">
          <div class="skeleton-img" style="height: 250px; background: #e0e0e0; border-radius: 20px; margin-bottom: 15px; animation: pulse 1.5s infinite;"></div>
          <div class="skeleton-text" style="height: 20px; background: #e0e0e0; width: 80%; margin-bottom: 10px; animation: pulse 1.5s infinite;"></div>
      </div>`;
  }
  contenedor.innerHTML = esqueletosHTML;
});

// Ejecutar carga
cargarTodosParaAdmin();

function renderizarAdmin(lista) {
  const contenedor = document.getElementById("contenedor-admin");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  if (lista.length === 0) {
    contenedor.innerHTML =
      "<p style='color:white;'>No se encontraron productos.</p>";
    return;
  }

  lista.forEach((prod) => {
    const imagen = prod.imagenes[0] || "../img/placeholder.jpg";
    const oculto = prod.estado === "oculto";

    const card = `
        <div class="producto-card" style="${oculto ? "opacity: 0.6; border: 1px dashed red;" : ""}">
            <img src="${imagen}" alt="${prod.nombre}">
            <div class="producto-info">
                <p><b>${prod.nombre}</b> ${oculto ? "(OCULTO)" : ""}</p>
                <p>$${prod.precio.toLocaleString()}</p>
                <button class="btn-editar" onclick="abrirEditor(${prod.id})">EDITAR</button>
            </div>
        </div>
    `;
    contenedor.innerHTML += card;
  });
}

// Función auxiliar para limpiar tildes (similar a la que ya usas en productos_2.js)
const normalizarTexto = (str) =>
  str
    ? str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
    : "";

// BUSCADOR MEJORADO (Ignora tildes y mayúsculas)
document.getElementById("buscadorAdmin").addEventListener("input", (e) => {
  // Limpiamos lo que escribió el usuario
  const termino = normalizarTexto(e.target.value);

  const filtrados = window.listaCompletaAdmin.filter((p) => {
    // Limpiamos el nombre del producto y el ID para comparar
    const nombreLimpio = normalizarTexto(p.nombre);
    const idLimpio = p.id.toString();

    return nombreLimpio.includes(termino) || idLimpio.includes(termino);
  });

  renderizarAdmin(filtrados);
});

// Botón Nuevo Producto
document.querySelector(".btn-primary").onclick = () => {
  abrirEditor(null); // Pasamos null para indicar que es nuevo
};

// Botón Cerrar Sesión
document.querySelector(".btn-outline").onclick = () => {
  if (confirm("¿Estás segura de cerrar sesión?")) {
    window.location.href = "../index.html"; // O a tu login si tenés uno
  }
};
// Cambiá la función abrirEditor en ui-admin.js:
function abrirEditor(id) {
  window.location.href = `producto-panel.html?id=${id}`;
}
