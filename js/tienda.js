// 1. VARIABLES DE ESTADO (Para saber qué filtros están marcados)
let filtrosActivos = {
  categoria: "todos",
  ambientes: [],
  publicos: [],
  materiales: [],
  precioMax: 30000,
  soloOfertas: false,
};

// Intentar cargar desde la memoria local ANTES de esperar a Google
const cache = localStorage.getItem("productos_cache");
if (cache) {
  productos = JSON.parse(cache);
  console.log("Cargando productos desde caché (Instantáneo)");

  // Si estamos en la tienda, renderizamos ya mismo
  if (typeof renderizarProductos === "function") {
    renderizarProductos(productos);
    // Quitamos el mensaje de "Cargando..."
    const container = document.getElementById("contenedor-tienda");
    if (container) container.classList.remove("loading");
  }

  // --- AGREGA ESTA LÍNEA AQUÍ ---
  configurarEscuchadores();
  // ------------------------------

  // Si estamos en info-producto, cargamos ya mismo
  if (typeof cargarProducto === "function") {
    cargarProducto();
  }
}

// 2. INICIALIZACIÓN
// Esperamos a que los productos lleguen desde Google Sheet
document.addEventListener("productosListos", () => {
  const params = new URLSearchParams(window.location.search);
  const catURL = params.get("categoria");

  if (catURL) {
    const categoriaLimpia = catURL.toLowerCase().trim();
    if (categoriaLimpia === "ofertas") {
      filtrosActivos.soloOfertas = true;
      filtrosActivos.categoria = "todos";
    } else {
      filtrosActivos.categoria = categoriaLimpia;
    }

    // Activar botón visual
    const botones = document.querySelectorAll(".filter-btn");
    botones.forEach((btn) => {
      btn.classList.remove("active");
      if (btn.textContent.trim().toLowerCase() === categoriaLimpia) {
        btn.classList.add("active");
      }
    });

    if (categoriaLimpia === "todos" || !categoriaLimpia) {
      const btnTodos = document.querySelector(".filter-btn");
      if (btnTodos) btnTodos.classList.add("active");
    }

    aplicarFiltros();
  } else {
    // IMPORTANTE: Ahora 'productos' ya tiene los datos de Google
    renderizarProductos(productos);
    const btnTodos = document.querySelector(".filter-btn");
    if (btnTodos) btnTodos.classList.add("active");
  }

  configurarEscuchadores();

  // ¡NUEVO! Validamos el carrito apenas llegan los datos frescos del Excel
  if (typeof validarYLimpiarCarrito === "function") {
    validarYLimpiarCarrito();
  }
});

// MODIFICACIÓN EN LA FUNCIÓN DE RENDERIZADO
function renderizarProductos(lista) {
  const contenedor = document.getElementById("contenedor-tienda");
  contenedor.innerHTML = "";

  if (lista.length === 0) {
    contenedor.innerHTML = `<p class="no-results" style="color: #ffffff;">No se encontraron productos con esos filtros.</p>`;
    return;
  }

  lista.forEach((prod) => {
    // IMPORTANTE: Usamos prod.imagenes[0] porque ahora es un array
    const imagenPortada =
      prod.imagenes && prod.imagenes.length > 0
        ? prod.imagenes[0]
        : "img/placeholder.jpg";

    const card = `
        <div class="producto-card ${prod.estado === "Sin Stock" ? "sin-stock" : ""}">
            <a href="info-producto.html?id=${prod.id}" class="producto-href">
                ${prod.estado === "Sin Stock" ? '<span class="badge-sin-stock">SIN STOCK</span>' : ""}
                
                <img class="producto-img" src="${imagenPortada}" alt="${prod.nombre}" />
                
                <div class="producto-info">
                    <p class="producto-name">${prod.nombre}</p>
                    ${prod.variantes && prod.variantes.length > 1 ? `<p class="variantes-tag">+${prod.variantes.length} opciones</p>` : ""}
                    <p class="precio"><b>$${prod.precio.toLocaleString()}</b></p>
                    <button class="btn-ver-mas">ver más</button>
                </div>
            </a>
        </div>
    `;
    contenedor.innerHTML += card;
  });
}

// --- FUNCIÓN DE FILTRADO (Limpiada y Garantizada) ---
function aplicarFiltros() {
  const norm = (t) =>
    t
      ? t
          .toString()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim()
      : "";

  const resultado = productos.filter((p) => {
    // 1. Categoría (Colección)
    const catFiltro = norm(filtrosActivos.categoria);
    const pColeccion = norm(p.coleccion);
    const matchCategoria =
      catFiltro === "todos" || pColeccion.includes(catFiltro);

    // 2. Precio
    const matchPrecio = p.precio <= filtrosActivos.precioMax;

    // 3. Sidebar (Usando la lógica de normalización para que 'Baño' coincida con 'baño')
    const verificarMatch = (filtrosArr, datoProd) => {
      if (!filtrosArr || filtrosArr.length === 0) return true;
      if (!datoProd) return false;
      const fNorm = filtrosArr.map((f) => norm(f));
      const dNorm = Array.isArray(datoProd)
        ? datoProd.map((d) => norm(d))
        : [norm(datoProd)];
      return fNorm.some((opcion) => dNorm.includes(opcion));
    };

    const matchAmbiente = verificarMatch(filtrosActivos.ambientes, p.ambiente);
    const matchPublico = verificarMatch(filtrosActivos.publicos, p.linea);
    const matchMaterial = verificarMatch(filtrosActivos.materiales, p.material);

    // 4. OFERTAS (Lógica Corregida)
    let matchOferta = true; // Por defecto todos pasan

    if (filtrosActivos.soloOfertas) {
      // Si el usuario activó el checkbox, SOLO pasan los que tienen la palabra "oferta"
      const enLinea = p.linea
        ? p.linea.some((l) => norm(l).includes("oferta"))
        : false;
      const enNombre = norm(p.nombre).includes("oferta");

      matchOferta = enLinea || enNombre;
    }

    return (
      matchCategoria &&
      matchPrecio &&
      matchAmbiente &&
      matchPublico &&
      matchMaterial &&
      matchOferta
    );
  });

  renderizarProductos(resultado);
}

// --- CONFIGURACIÓN DE ESCUCHADORES CORREGIDA ---
function configurarEscuchadores() {
  console.log("⚙️ Configurando escuchadores...");

  // Botones de categoría (Superiores)
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.onclick = (e) => {
      const textoBoton = e.target.innerText.trim().toLowerCase();
      console.log("Click en categoría:", textoBoton);

      document
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");

      // Si el botón dice "todos", reseteamos el filtro de categoría
      filtrosActivos.categoria = textoBoton === "todos" ? "todos" : textoBoton;

      aplicarFiltros();
    };
  });

  // Checkboxes (Laterales)
  document
    .querySelectorAll('.sidebar-filtros input[type="checkbox"]')
    .forEach((check) => {
      check.onchange = (e) => {
        const valor = e.target.value; // El value del HTML: "baño", "adulto", etc.
        const grupo = e.target.name;

        console.log(`Cambio en ${grupo}: ${valor} (${e.target.checked})`);

        if (grupo === "ambiente") {
          if (e.target.checked) filtrosActivos.ambientes.push(valor);
          else
            filtrosActivos.ambientes = filtrosActivos.ambientes.filter(
              (v) => v !== valor,
            );
        } else if (grupo === "publico") {
          if (e.target.checked) filtrosActivos.publicos.push(valor);
          else
            filtrosActivos.publicos = filtrosActivos.publicos.filter(
              (v) => v !== valor,
            );
        } else if (grupo === "material") {
          if (e.target.checked) filtrosActivos.materiales.push(valor);
          else
            filtrosActivos.materiales = filtrosActivos.materiales.filter(
              (v) => v !== valor,
            );
        } else if (grupo === "oferta") {
          filtrosActivos.soloOfertas = e.target.checked;
        }

        aplicarFiltros();
      };
    });

  // Slider de Precio
  const slider = document.getElementById("rango-precio");
  if (slider) {
    slider.oninput = (e) => {
      const val = parseInt(e.target.value);
      document.getElementById("precio-valor").innerText =
        `$${val.toLocaleString()}`;
      filtrosActivos.precioMax = val;
      aplicarFiltros();
    };
  }
}

// 6. FUNCIÓN LIMPIAR
function limpiarFiltros() {
  document
    .querySelectorAll('.sidebar-filtros input[type="checkbox"]')
    .forEach((el) => (el.checked = false));

  const slider = document.getElementById("rango-precio");
  slider.value = 30000;
  document.getElementById("precio-valor").textContent = `$30.000`;

  filtrosActivos = {
    categoria: "todos",
    ambientes: [],
    publicos: [],
    materiales: [],
    precioMax: 30000,
    soloOfertas: false,
  };

  // Reset de botones superiores
  document
    .querySelectorAll(".filter-btn")
    .forEach((b) => b.classList.remove("active"));
  document.querySelector(".filter-btn:first-child").classList.add("active");

  renderizarProductos(productos);
}

window.addEventListener("scroll", () => {
  const header = document.querySelector(".tienda-header-sticky");

  // Si bajamos más de 50px de la parte superior
  if (window.scrollY > 50) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});

function toggleFiltros() {
  const sidebar = document.getElementById("sidebarFiltros");
  const overlay = document.getElementById("filtrosOverlay");

  sidebar.classList.toggle("active");

  if (sidebar.classList.contains("active")) {
    overlay.style.display = "block";
    document.body.style.overflow = "hidden"; // Evita scroll de fondo
  } else {
    overlay.style.display = "none";
    document.body.style.overflow = "auto"; // Devuelve el scroll
  }
}
