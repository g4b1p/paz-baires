/* LISTOS CAMBIOS (V.2) */

// Al cargar la página, prioridad al Caché
document.addEventListener("DOMContentLoaded", () => {
  mostrarEsqueletosHome();

  const cache = localStorage.getItem("productos_cache");
  const contenedorNuevos = document.getElementById("grid-nuevos");

  if (cache) {
    // Si hay caché, lo usamos de una y NO mostramos esqueletos
    window.productos = JSON.parse(cache);
    console.log("🏠 Home: Cargando desde caché...");
    renderizarHome();
  } else {
    // Solo si NO hay nada guardado, mostramos los esqueletos
    console.log("🏠 Home: Sin caché, mostrando esqueletos...");
    mostrarEsqueletos("grid-nuevos");
  }
});

function mostrarEsqueletosHome() {
  const contenedores = ["grid-nuevos"];

  contenedores.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      let esqueletosHTML = "";
      for (let i = 0; i < 4; i++) {
        esqueletosHTML += `
          <div class="producto-card skeleton">
              <div class="skeleton-img" style="height: 240px; border-radius: 15px; margin-bottom: 15px;"></div>
              <div class="info-prod" style="padding: 5px;">
                <div class="skeleton-text" style="height: 16px; width: 80%; margin-bottom: 10px; border-radius: 6px;"></div>
                <div class="skeleton-text" style="height: 14px; width: 40%; margin-bottom: 18px; border-radius: 6px;"></div>
                <div class="skeleton-text" style="height: 22px; width: 55%; margin-bottom: 15px; border-radius: 6px;"></div>
                <div class="skeleton-text" style="height: 38px; width: 100%; border-radius: 10px;"></div>
              </div>
          </div>`;
      }
      el.innerHTML = esqueletosHTML;
    }
  });
}

// Escuchamos cuando los productos reales estén listos (de Google Sheets)
document.addEventListener("productosListos", () => {
  const cacheActual = localStorage.getItem("productos_cache");
  const datosNuevos = JSON.stringify(window.productos);

  // COMPARACIÓN: Si lo que llegó de Google es igual a lo que ya se ve, no hacemos nada
  if (cacheActual === datosNuevos) {
    console.log("🏠 Home: Datos idénticos, evitando re-renderizado.");
    return;
  }

  console.log("🏠 Home: Datos nuevos detectados, actualizando...");
  renderizarHome();
});

function renderizarHome() {
  const lista = window.productos;

  // --- CAMBIO CLAVE: Si no hay productos, esperamos y reintentamos ---
  if (!lista || lista.length === 0) {
    console.log("⏳ Datos no listos en Home, reintentando en 100ms...");
    setTimeout(renderizarHome, 100);
    return; // Salimos de esta ejecución, pero el setTimeout disparará la siguiente
  }

  // Si llegamos acá, es porque window.productos YA TIENE DATOS
  console.log("✅ Datos cargados, renderizando galerías...");
  const hoy = new Date();

  // --- FILTRO DE NUEVOS INGRESOS ---
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
    let imagenPortada = "images/placeholder.jpg";

    if (
      prod.imagenes &&
      Array.isArray(prod.imagenes) &&
      prod.imagenes.length > 0
    ) {
      imagenPortada = prod.imagenes[0];
    } else if (typeof prod.imagen === "string") {
      imagenPortada = prod.imagen;
    }

    let badgeHTML = "";
    let claseExtra = "";

    if (prod.estado === "Sin Stock") {
      badgeHTML = `<span class="badge">SIN STOCK</span>`;
      claseExtra = "sin-stock";
    } else if (prod.estado === "Últimos Disponibles") {
      badgeHTML = `<span class="badge">ÚLTIMOS DISPONIBLES</span>`;
      claseExtra = "ultimos";
    }

    // AQUÍ GENERAMOS EL BLOQUE DINÁMICO DE PRECIO
    const HTMLPrecios = generarHTMLPrecios(prod);

    const cardHTML = `
      <div class="producto-card ${claseExtra}">
          <a href="info-producto.html?id=${prod.id}" class="producto-href">
              ${badgeHTML}
              <img class="producto-img" loading="lazy" decoding="async" src="${imagenPortada}" alt="${prod.nombre}" />
              
              <div class="info-prod">
                <div class="producto-header">
                  <p class="producto-name">${prod.nombre}</p>
                  ${
                    prod.variantes && prod.variantes.length > 1
                      ? `<p class="opciones">+${prod.variantes.length} opciones</p>`
                      : `<p class="opciones">Diseño exclusivo</p>`
                  }
                </div>
                
                ${HTMLPrecios}

                <button class="btn-ver-mas">VER MÁS</button>
              </div>
          </a>
      </div>
    `;
    contenedor.insertAdjacentHTML("beforeend", cardHTML);
  });
}

// --- LÓGICA DEL CARRUSEL (SOLO MANUAL) ---
window.scrollCarrusel = function (direction, idContenedor) {
  const contenedor = document.getElementById(idContenedor);
  if (!contenedor) return;

  const primeraTarjeta = contenedor.querySelector(".producto-card");
  if (!primeraTarjeta) return; // Seguridad por si no cargaron los productos

  const anchoTarjeta = primeraTarjeta.offsetWidth + 20;
  const maxScroll = contenedor.scrollWidth - contenedor.clientWidth;

  if (direction === 1 && contenedor.scrollLeft >= maxScroll - 5) {
    contenedor.scrollTo({ left: 0, behavior: "smooth" });
  } else if (direction === -1 && contenedor.scrollLeft <= 5) {
    contenedor.scrollTo({ left: maxScroll, behavior: "smooth" });
  } else {
    contenedor.scrollBy({ left: direction * anchoTarjeta, behavior: "smooth" });
  }
};
