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
  // Resetear siempre a todos al cargar la página
  //filtrosActivos.categoria = "todos";

  const contenedor = document.getElementById("contenedor-tienda");

  // --- EL CAMBIO ESTÁ AQUÍ ---
  // Solo ponemos esqueletos si el contenedor está vacío (o sea, si el caché no cargó nada antes)
  if (contenedor && contenedor.innerHTML.trim() === "") {
    let esqueletosHTML = "";
    for (let i = 0; i < 8; i++) {
      esqueletosHTML += `
        <div class="producto-card skeleton">
            <div class="skeleton-img" style="height: 250px; background: #eee; border-radius: 20px; margin-bottom: 15px;"></div>
            <div class="skeleton-text" style="height: 20px; background: #eee; width: 80%; margin-bottom: 10px;"></div>
            <div class="skeleton-text" style="height: 20px; background: #eee; width: 40%;"></div>
        </div>`;
    }
    contenedor.innerHTML = esqueletosHTML;
  }

  // Si después de 8 segundos sigue habiendo esqueletos (no cargó caché ni Google)
  setTimeout(() => {
    const contenedor = document.getElementById("contenedor-tienda");
    if (contenedor && contenedor.querySelector(".skeleton")) {
      contenedor.innerHTML = `
        <div style="text-align: center; padding: 50px; color: white; width: 100%;">
          <p>Parece que la conexión está lenta... </p>
          <button onclick="location.reload()" style="background: #6342E8; color: white; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer;">
            REINTENTAR CARGAR
          </button>
        </div>
      `;
    }
  }, 8000); // 8 segundos de espera
});

// Intentar cargar desde la memoria local ANTES de esperar a Google
const cache = localStorage.getItem("productos_cache");
// --- CARGA INSTANTÁNEA DESDE CACHÉ (CON ACTUALIZACIÓN DE BOTONES) ---
if (cache) {
  productos = JSON.parse(cache);
  window.productos = productos;
  console.log("Cargando productos desde caché (Instantáneo)");

  const params = new URLSearchParams(window.location.search);
  const catURL = params.get("categoria");
  const linURL = params.get("linea");

  let categoriaParaBoton = "todos";

  // Determinamos qué filtro aplicar y qué botón marcar
  if (
    (linURL && linURL.toLowerCase() === "ofertas") ||
    (catURL && catURL.toLowerCase() === "ofertas")
  ) {
    filtrosActivos.soloOfertas = true;
    filtrosActivos.categoria = "todos";
    categoriaParaBoton = "ofertas";
  } else if (catURL) {
    filtrosActivos.categoria = catURL.toLowerCase().trim();
    filtrosActivos.soloOfertas = false;
    categoriaParaBoton = filtrosActivos.categoria;
  }

  // Aplicamos el filtro visual de inmediato
  if (typeof aplicarFiltros === "function") {
    aplicarFiltros();
  }

  // ¡ESTO ES LO QUE TE FALTABA!: Marcar el botón activo en la UI
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    const texto = btn.innerText.trim().toLowerCase();
    btn.classList.toggle("active", texto === categoriaParaBoton);
  });

  const container = document.getElementById("contenedor-tienda");
  if (container) container.classList.remove("loading");

  configurarEscuchadores();
}

// 2. INICIALIZACIÓN (Versión Corregida para Nav y Ofertas)
document.addEventListener("productosListos", () => {
  console.log("🔄 Datos frescos recibidos de Google");

  if (yaFiltroElUsuario) return;

  const cacheActual = localStorage.getItem("productos_cache");
  const datosNuevos = JSON.stringify(productos);

  // Si el usuario ya está navegando o si los datos son iguales, no flasheamos la pantalla
  if (yaFiltroElUsuario && cacheActual === datosNuevos) {
    console.log("✅ El usuario ya está viendo los datos correctos del caché.");
    return;
  }

  if (cacheActual === datosNuevos) {
    console.log("✅ Datos idénticos, verificando URL...");
  }

  // --- LÓGICA DE LECTURA DE URL (NAV) ---
  const params = new URLSearchParams(window.location.search);
  const catURL = params.get("categoria");
  const linURL = params.get("linea");

  let categoriaParaBoton = "todos";

  // Prioridad 1: Si viene como Línea Ofertas o Categoría Ofertas
  if (
    (linURL && linURL.toLowerCase() === "ofertas") ||
    (catURL && catURL.toLowerCase() === "ofertas")
  ) {
    filtrosActivos.soloOfertas = true;
    filtrosActivos.categoria = "todos";
    categoriaParaBoton = "ofertas";
  }
  // Prioridad 2: Si viene una categoría normal (pijamas, blanqueria, etc)
  else if (catURL) {
    filtrosActivos.categoria = catURL.toLowerCase().trim();
    filtrosActivos.soloOfertas = false;
    categoriaParaBoton = filtrosActivos.categoria;
  }
  // Prioridad 3: No hay nada en la URL
  else {
    filtrosActivos.categoria = "todos";
    filtrosActivos.soloOfertas = false;
    categoriaParaBoton = "todos";
  }

  // Actualizar botones visualmente (buscamos el texto exacto)
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    const texto = btn.innerText.trim().toLowerCase();
    btn.classList.toggle("active", texto === categoriaParaBoton);
  });

  // Ejecutamos la actualización
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
    } else if (prod.estado === "Próximamente") {
      // --- NUEVA LÓGICA PARA PRÓXIMAMENTE ---
      badgeHTML = `<span class="badge-sin-stock badge-proximamente">PRÓXIMAMENTE</span>`;
      claseExtra = "proximamente";
    } else if (prod.estado && prod.estado !== "Activo") {
      // Aquí entran "Últimos Disponibles", "Últimas Unidades", etc. (Naranja)
      badgeHTML = `<span class="badge-sin-stock badge-alerta">${prod.estado.toUpperCase()}</span>`;
    }

    // --- PRECIO REAL (Sin descuentos ni redondeos) ---
    const precioFinal = prod.precio;

    const card = `
    <div class="producto-card ${claseExtra}">
        <a href="info-producto.html?id=${prod.id}" class="producto-href">
            ${badgeHTML}
            <img class="producto-img" src="${imagenPortada}" alt="${prod.nombre}" />
            <div class="producto-info">
                <p class="producto-name"><b>${prod.nombre}</b></p>
                ${prod.variantes && prod.variantes.length > 1 ? `<p class="variantes-tag">+${prod.variantes.length} opciones</p>` : ""}
                
                <div class="precio-container">
                    <p class="precio"><b>$${precioFinal.toLocaleString()}</b></p>
                </div>

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

  // Botones de categoría (Superiores) - REEMPLAZO
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.onclick = (e) => {
      const textoBoton = e.target.innerText.trim().toLowerCase();

      document
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");

      // --- LÓGICA NUEVA PARA EL BOTÓN OFERTAS ---
      if (textoBoton === "ofertas") {
        filtrosActivos.soloOfertas = true;
        filtrosActivos.categoria = "todos"; // Reseteamos categoría para ver todas las ofertas
      } else {
        filtrosActivos.soloOfertas = false;
        filtrosActivos.categoria =
          textoBoton === "todos" ? "todos" : textoBoton;
      }

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
  // Ya no necesitamos borrar el localStorage porque ya no lo usamos

  document
    .querySelectorAll('.sidebar-filtros input[type="checkbox"]')
    .forEach((el) => (el.checked = false));

  const slider = document.getElementById("rango-precio");
  if (slider) {
    slider.value = 30000;
    document.getElementById("precio-valor").textContent = `$30.000`;
  }

  filtrosActivos = {
    categoria: "todos",
    ambientes: [],
    publicos: [],
    materiales: [],
    precioMax: 30000,
    soloOfertas: false,
  };

  document
    .querySelectorAll(".filter-btn")
    .forEach((b) => b.classList.remove("active"));
  const btnTodos = document.querySelector(".filter-btn"); // El primero suele ser "todos"
  if (btnTodos) btnTodos.classList.add("active");

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
  if (!window.productos || window.productos.length === 0) return;

  console.log("🔄 Sincronizando filtros con la UI...");

  // 1. Sincronizar Categoría (Botones superiores)
  const btnActivo = document.querySelector(".filter-btn.active");
  if (btnActivo) {
    const texto = btnActivo.innerText.trim().toLowerCase();
    if (texto === "ofertas") {
      filtrosActivos.soloOfertas = true;
      filtrosActivos.categoria = "todos";
    } else {
      filtrosActivos.soloOfertas = false;
      filtrosActivos.categoria = texto;
    }
  }

  // 2. Limpiar y rellenar arrays de checkboxes
  filtrosActivos.ambientes = [];
  filtrosActivos.publicos = [];
  filtrosActivos.materiales = [];

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

  // 3. Sincronizar Slider
  const slider = document.getElementById("rango-precio");
  if (slider) {
    filtrosActivos.precioMax = parseInt(slider.value);
    document.getElementById("precio-valor").innerText =
      `$${filtrosActivos.precioMax.toLocaleString()}`;
  }

  // 4. Forzar el filtrado YA
  aplicarFiltros();
}

window.addEventListener("pageshow", (event) => {
  // Si la página se carga desde el caché del navegador (botón atrás)
  if (
    event.persisted ||
    (window.performance && window.performance.navigation.type === 2)
  ) {
    console.log("🔙 Volviste atrás: Re-sincronizando filtros...");
    sincronizarFiltrosDesdeUI();
  }
});
