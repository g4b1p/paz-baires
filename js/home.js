// 1. Al cargar la página, ponemos los esqueletos
document.addEventListener("DOMContentLoaded", () => {
  mostrarEsqueletos("grid-destacados");
  mostrarEsqueletos("grid-nuevos");

  // Si ya hay algo en caché, renderizamos de una
  if (window.productos && window.productos.length > 0) {
    renderizarHome();
  }
});

// 2. Escuchamos cuando los productos reales estén listos
document.addEventListener("productosListos", () => {
  renderizarHome();
});

function mostrarEsqueletos(contenedorId) {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  let esqueletosHTML = "";
  for (let i = 0; i < 4; i++) {
    esqueletosHTML += `
            <div class="producto-card skeleton">
                <div class="skeleton-img"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text short"></div>
            </div>
        `;
  }
  contenedor.innerHTML = esqueletosHTML;
}

function renderizarHome() {
  const lista = window.productos;
  if (!lista || lista.length === 0) return;

  const hoy = new Date();

  const destacados = lista.filter(
    (p) => (p.etiqueta || "").toString().toLowerCase().trim() === "destacado",
  );

  const nuevos = lista.filter((p) => {
    const etiquetaLimpia = (p.etiqueta || "").toString().toLowerCase().trim();
    if (etiquetaLimpia === "nuevo ingreso") return true;
    if (p.fechaIngreso) {
      const fechaProd = new Date(p.fechaIngreso);
      const diferencia = (hoy - fechaProd) / (1000 * 60 * 60 * 24);
      return diferencia <= 30 && diferencia >= 0;
    }
    return false;
  });

  inyectarProductos(destacados, "grid-destacados");
  inyectarProductos(nuevos, "grid-nuevos");
}

function inyectarProductos(lista, contenedorId) {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  if (lista.length === 0) {
    contenedor.closest("section").style.display = "none";
    return;
  }

  contenedor.closest("section").style.display = "block";
  contenedor.innerHTML = "";

  lista.forEach((prod) => {
    const imagenPortada =
      prod.imagenes && prod.imagenes[0]
        ? prod.imagenes[0]
        : "images/placeholder.jpg";

    const cardHTML = `
            <div class="producto-card ${prod.estado === "Sin Stock" ? "sin-stock" : ""}">
                <a href="info-producto.html?id=${prod.id}" class="producto-href">
                    ${prod.estado === "Sin Stock" ? '<span class="badge-sin-stock">SIN STOCK</span>' : ""}
                    
                    <img class="producto-img" src="${imagenPortada}" alt="${prod.nombre}" />
                    
                    <div class="producto-info">
                        <p class="producto-name">${prod.nombre}</p>
                        ${prod.variantes && prod.variantes.length > 1 ? `<p class="variantes-tag">+${prod.variantes.length} opciones</p>` : ""}
                        <p class="precio"><b>$${prod.precio.toLocaleString("es-AR")}</b></p>
                        <button class="btn-ver-mas">ver más</button>
                    </div>
                </a>
            </div>
        `;
    contenedor.insertAdjacentHTML("beforeend", cardHTML);
  });
}
