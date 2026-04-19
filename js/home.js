// MATA-AUTO-SCROLL: Esto detiene cualquier movimiento automático residual
function detenerTodoMovimiento() {
    console.log("🛑 Deteniendo todos los intervalos automáticos...");
    for (let i = 1; i < 1000; i++) {
        window.clearInterval(i);
        window.clearTimeout(i);
    }
}

// Lo ejecutamos apenas carga y un segundo después por si las dudas
detenerTodoMovimiento();
setTimeout(detenerTodoMovimiento, 1000);

// 1. Al cargar la página, prioridad al Caché
document.addEventListener("DOMContentLoaded", () => {
  const cache = localStorage.getItem("productos_cache");
  const contenedorDestacados = document.getElementById("grid-destacados");
  const contenedorNuevos = document.getElementById("grid-nuevos");

  if (cache) {
    // Si hay caché, lo usamos de una y NO mostramos esqueletos
    window.productos = JSON.parse(cache);
    console.log("🏠 Home: Cargando desde caché...");
    renderizarHome();
  } else {
    // Solo si NO hay nada guardado, mostramos los esqueletos
    console.log("🏠 Home: Sin caché, mostrando esqueletos...");
    mostrarEsqueletos("grid-destacados");
    mostrarEsqueletos("grid-nuevos");
  }
});

// 2. Escuchamos cuando los productos reales estén listos (de Google Sheets)
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
      prod.imagenes && prod.imagenes.length > 0
        ? prod.imagenes[0]
        : "images/placeholder.jpg";

    // --- 1. LÓGICA DINÁMICA DE BADGES (Igual a Tienda) ---
    let badgeHTML = "";
    let claseExtra = "";

    if (prod.estado === "Sin Stock") {
      badgeHTML = `<span class="badge-sin-stock">SIN STOCK</span>`;
      claseExtra = "sin-stock";
    } else if (prod.estado === "Próximamente") {
      badgeHTML = `<span class="badge-sin-stock badge-proximamente">PRÓXIMAMENTE</span>`;
      claseExtra = "proximamente";
    } else if (prod.estado && prod.estado !== "Activo") {
      // Para "Últimas Unidades", "Liquidación", etc.
      badgeHTML = `<span class="badge-sin-stock badge-alerta">${prod.estado.toUpperCase()}</span>`;
    }

    // --- 2. LÓGICA DE PRECIO PSICOLÓGICO (Igual a Tienda) ---
    const precioReal = prod.precio;
    // Usamos el 1.3 (30%) como tenés en tienda.js
    const precioTachado = Math.round((precioReal * 1.3) / 100) * 100;
    const precioPsicologico = precioReal - 1;

    // --- 3. CONSTRUCCIÓN DE LA CARD ---
    const cardHTML = `
            <div class="producto-card ${claseExtra}">
                <a href="info-producto.html?id=${prod.id}" class="producto-href">
                    ${badgeHTML}
                    
                    <img class="producto-img" src="${imagenPortada}" alt="${prod.nombre}" />
                    
                    <div class="producto-info">
                        <p class="producto-name"><b>${prod.nombre}</b></p>
                        
                        ${
                          prod.variantes && prod.variantes.length > 1
                            ? `<p class="variantes-tag">+${prod.variantes.length} opciones</p>`
                            : ""
                        }
                        
                        <div class="precio-container">
                            <span class="precio-tachado">$${precioTachado.toLocaleString()}</span>
                            <p class="precio"><b>$${precioPsicologico.toLocaleString()}</b></p>
                        </div>

                        <button class="btn-ver-mas">ver más</button>
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

// IMPORTANTE: Asegurate de que no haya NINGÚN "setInterval" o "setTimeout" debajo de esto.
