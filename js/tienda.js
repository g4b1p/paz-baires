// 1. VARIABLES DE ESTADO (Para saber qué filtros están marcados)
let filtrosActivos = {
  categoria: "todos",
  ambientes: [],
  publicos: [],
  materiales: [],
  precioMax: 30000,
  soloOfertas: false,
};

let yaFiltroElUsuario = false; // Variable de control

document.addEventListener("DOMContentLoaded", () => {
  // --- NUEVA LÓGICA DE RECUPERACIÓN ---
  const catMemoria = localStorage.getItem("categoria_guardada");
  if (catMemoria) {
    filtrosActivos.categoria = catMemoria;

    // Marcamos el botón visualmente como activo
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.classList.remove("active");
      if (btn.innerText.trim().toLowerCase() === catMemoria) {
        btn.classList.add("active");
      }
    });
  }
  // ------------------------------------

  const contenedor = document.getElementById("contenedor-tienda");
  if (contenedor) {
    // Ponemos esqueletos de entrada
    let esqueletosHTML = "";
    for (let i = 0; i < 8; i++) {
      // 8 para llenar la grilla inicial
      esqueletosHTML += `
        <div class="producto-card skeleton">
            <div class="skeleton-img" style="height: 250px; background: #eee; border-radius: 20px; margin-bottom: 15px;"></div>
            <div class="skeleton-text" style="height: 20px; background: #eee; width: 80%; margin-bottom: 10px;"></div>
            <div class="skeleton-text" style="height: 20px; background: #eee; width: 40%;"></div>
        </div>`;
    }
    contenedor.innerHTML = esqueletosHTML;
  }
  // LLAMADA: Ejecutala al final de configurarEscuchadores()
});

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
document.addEventListener("productosListos", () => {
  console.log("🔄 Datos frescos de Google Sheets recibidos");

  if (yaFiltroElUsuario) {
    console.log("Filtros activos detectados, no se reinicia la vista.");
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const catURL = params.get("categoria");
  const catMemoria = localStorage.getItem("categoria_guardada");

  // --- LÓGICA DE PRIORIDAD ---
  let categoriaFinal = "todos";

  if (catURL) {
    categoriaFinal = catURL.toLowerCase().trim();
    localStorage.setItem("categoria_guardada", categoriaFinal); // Actualizamos memoria con la URL
  } else if (catMemoria) {
    categoriaFinal = catMemoria;
  }

  // --- APLICAR LA CATEGORÍA ---
  if (categoriaFinal === "ofertas") {
    filtrosActivos.soloOfertas = true;
    filtrosActivos.categoria = "todos";
  } else {
    filtrosActivos.categoria = categoriaFinal;
    filtrosActivos.soloOfertas = false;
  }

  // --- ACTUALIZACIÓN VISUAL ÚNICA ---
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    const texto = btn.innerText.trim().toLowerCase();
    // Esto asegura que SOLO el botón correcto tenga la clase 'active'
    btn.classList.toggle("active", texto === (catURL || catMemoria || "todos"));
  });

  // Renderizar con los filtros aplicados
  aplicarFiltros();

  configurarEscuchadores();

  if (typeof validarYLimpiarCarrito === "function") {
    validarYLimpiarCarrito();
  }
});

// MODIFICACIÓN EN LA FUNCIÓN DE RENDERIZADO
function renderizarProductos(lista) {
  const contenedor = document.getElementById("contenedor-tienda");
  if (!contenedor) return;

  contenedor.innerHTML = "";
  contenedor.classList.remove("loading");

  if (lista.length === 0) {
    contenedor.innerHTML = `<p class="no-results" style="color: #ffffff;">No se encontraron productos con esos filtros.</p>`;
    return;
  }

  lista.forEach((prod) => {
    const imagenPortada =
      prod.imagenes && prod.imagenes.length > 0
        ? prod.imagenes[0]
        : "img/placeholder.jpg";

    // Lógica dinámica de badges
    let badgeHTML = "";
    let claseExtra = "";

    if (prod.estado === "Sin Stock") {
      badgeHTML = `<span class="badge-sin-stock">SIN STOCK</span>`;
      claseExtra = "sin-stock";
    } else if (prod.estado && prod.estado !== "Activo") {
      // Si dice "Últimos Disponibles", sale naranja con ese texto
      badgeHTML = `<span class="badge-sin-stock badge-alerta">${prod.estado.toUpperCase()}</span>`;
    }

    const card = `
        <div class="producto-card ${claseExtra}">
            <a href="info-producto.html?id=${prod.id}" class="producto-href">
                ${badgeHTML}
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
    yaFiltroElUsuario = true; // <--- AGREGAR ESTO AQUÍ

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

      // --- AGREGA ESTA LÍNEA AQUÍ ---
      localStorage.setItem("categoria_guardada", textoBoton);
      // ------------------------------

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

  sincronizarFiltrosDesdeUI();
}

// 6. FUNCIÓN LIMPIAR
function limpiarFiltros() {
  localStorage.removeItem("categoria_guardada"); // <--- AGREGAR ESTO
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

function sincronizarFiltrosDesdeUI() {
  // Si todavía no cargaron los productos (ni de caché ni de Google), no filtramos nada aún
  if (!window.productos || window.productos.length === 0) return;

  console.log(
    "🔄 Sincronizando filtros con lo que quedó marcado en el navegador...",
  );

  // 1. Limpiamos el objeto de filtros para llenarlo de nuevo con lo que hay en pantalla
  filtrosActivos.ambientes = [];
  filtrosActivos.publicos = [];
  filtrosActivos.materiales = [];

  // 2. Buscamos todos los checkboxes marcados y los metemos al objeto
  document
    .querySelectorAll('.sidebar-filtros input[type="checkbox"]')
    .forEach((check) => {
      if (check.checked) {
        const valor = check.value;
        const grupo = check.name;

        if (grupo === "ambiente") filtrosActivos.ambientes.push(valor);
        else if (grupo === "publico") filtrosActivos.publicos.push(valor);
        else if (grupo === "material") filtrosActivos.materiales.push(valor);
        else if (grupo === "oferta") filtrosActivos.soloOfertas = true;
      }
    });

  // 3. Sincronizar el Slider de Precio
  const slider = document.getElementById("rango-precio");
  if (slider) {
    filtrosActivos.precioMax = parseInt(slider.value);
    document.getElementById("precio-valor").innerText =
      `$${filtrosActivos.precioMax.toLocaleString()}`;
  }

  // 4. Ejecutamos el filtro para que la lista de productos se limpie YA
  aplicarFiltros();
}
