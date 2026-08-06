// 1. VARIABLES DE ESTADO
let filtrosActivos = {
  categoria: "todos",
  tipoPrecioFiltro: "todos",
  busqueda: "",
  etiqueta: "destacado", // NUEVO: Filtro inicial por defecto
};

let cantidadMostrada = 12; // NUEVO: Límite de paginación visual
let yaFiltroElUsuario = false;

document.addEventListener("DOMContentLoaded", () => {
  // Inyectar esqueletos al cargar el DOM
  mostrarEsqueletosTienda();

  // Sincronizar UI por si volvió atrás en el navegador
  sincronizarFiltrosDesdeUI();

  // Tiempo límite de seguridad ampliado (12 segundos)
  setTimeout(() => {
    const contenedor = document.getElementById("contenedor-tienda");
    if (contenedor && contenedor.querySelector(".skeleton")) {
      contenedor.innerHTML = `
        <div class="sin-resultados">
          <p>El catálogo está tardando un poquito más de lo normal...</p>
          <button onclick="location.reload()" style="background: #ffffff; color: #7454d9; border: none; padding: 10px 20px; border-radius: 10px; font-weight: bold; cursor: pointer; margin-top: 15px;">
            RECARGAR TIENDA
          </button>
        </div>
      `;
    }
  }, 12000);
});

function mostrarEsqueletosTienda() {
  const contenedor = document.getElementById("contenedor-tienda");
  if (!contenedor) return;

  let esqueletosHTML = "";
  for (let i = 0; i < 6; i++) {
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
  contenedor.innerHTML = esqueletosHTML;
}

// CARGA DESDE CACHÉ LOCAL INSTANTÁNEO
const cache = localStorage.getItem("productos_cache");
if (cache) {
  productos = JSON.parse(cache);
  window.productos = productos;
  console.log("⚡ Tienda: Cargando desde caché...");

  procesarURLYFiltrar();
  configurarEscuchadores();
}

// INICIALIZACIÓN CUANDO LLEGAN DATOS DE GOOGLE SHEETS (ACTUALIZACIÓN SILENCIOSA)
document.addEventListener("productosListos", () => {
  console.log("🔄 Datos frescos recibidos de Google (en segundo plano)");

  // Actualizamos la referencia local de productos de forma interna
  if (window.productos) {
    productos = window.productos;
  }

  // Sincronizamos el carrito silenciosamente sin tocar el DOM de la tienda
  if (typeof validarYLimpiarCarrito === "function") {
    validarYLimpiarCarrito();
  }
});

// PROCESAR PARÁMETROS DE LA URL
function procesarURLYFiltrar() {
  const params = new URLSearchParams(window.location.search);
  const catURL = params.get("categoria");
  const linURL = params.get("linea");

  let textoBotonActivo = ""; // Ya no hay botón "Todos"

  if (
    (linURL && linURL.toLowerCase() === "ofertas") ||
    (catURL && catURL.toLowerCase() === "ofertas")
  ) {
    filtrosActivos.tipoPrecioFiltro = "oferta";
    filtrosActivos.categoria = "todos";
    filtrosActivos.etiqueta = "todos"; // Mostramos todas las ofertas
    textoBotonActivo = "ofertas";
  } else if (
    (linURL &&
      (linURL.toLowerCase() === "docenas" ||
        linURL.toLowerCase() === "packs")) ||
    (catURL &&
      (catURL.toLowerCase() === "docenas" || catURL.toLowerCase() === "packs"))
  ) {
    filtrosActivos.tipoPrecioFiltro = "pack";
    filtrosActivos.categoria = "todos";
    filtrosActivos.etiqueta = "todos";
    textoBotonActivo = "docenas";
  } else if (catURL) {
    filtrosActivos.categoria = catURL.toLowerCase().trim();
    filtrosActivos.tipoPrecioFiltro = "todos";
    filtrosActivos.etiqueta = "todos"; // Mostramos toda la categoría
    textoBotonActivo = filtrosActivos.categoria;
  } else {
    // Si entra a la tienda limpia sin nada, mostramos solo destacados
    filtrosActivos.categoria = "todos";
    filtrosActivos.tipoPrecioFiltro = "todos";
    filtrosActivos.etiqueta = "destacado";
  }

  // Marcar botón activo en la UI
  document.querySelectorAll(".category-btn").forEach((btn) => {
    const texto = btn.innerText.trim().toLowerCase();
    btn.classList.toggle("active", texto === textoBotonActivo);
  });

  cantidadMostrada = 12; // Reseteamos la paginación
  aplicarFiltros();
}

// FUNCIÓN DE RENDERIZADO DE PRODUCTOS
function renderizarProductos(lista, totalResultados) {
  const contenedor = document.getElementById("contenedor-tienda");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  // SI NO HAY PRODUCTOS, MOSTRAR MENSAJE EXPLICATIVO
  if (lista.length === 0) {
    let mensaje = "No se encontraron productos disponibles.";
    const tieneBusqueda = filtrosActivos.busqueda.trim() !== "";
    const tieneCategoria = filtrosActivos.categoria !== "todos";
    const tieneEspecial = filtrosActivos.tipoPrecioFiltro !== "todos";

    if (tieneBusqueda && tieneCategoria) {
      mensaje = `No se encontraron productos para "<strong>${filtrosActivos.busqueda}</strong>" en la categoría <strong>${filtrosActivos.categoria.toUpperCase()}</strong>.`;
    } else if (tieneBusqueda && tieneEspecial) {
      mensaje = `No se encontraron productos para "<strong>${filtrosActivos.busqueda}</strong>" en la sección <strong>${filtrosActivos.tipoPrecioFiltro.toUpperCase()}S</strong>.`;
    } else if (tieneBusqueda) {
      mensaje = `No se encontraron productos que coincidan con "<strong>${filtrosActivos.busqueda}</strong>".`;
    } else if (tieneCategoria) {
      mensaje = `No hay productos disponibles actualmente en la categoría <strong>${filtrosActivos.categoria.toUpperCase()}</strong>.`;
    } else if (tieneEspecial) {
      mensaje = `No hay productos disponibles actualmente en <strong>${filtrosActivos.tipoPrecioFiltro.toUpperCase()}S</strong>.`;
    }

    contenedor.innerHTML = `
      <div class="sin-resultados">
        <p>${mensaje}</p>
      </div>`;
    return;
  }

  // DIBUJAR CARDS
  lista.forEach((prod) => {
    const imagenPortada =
      prod.imagenes && prod.imagenes.length > 0
        ? prod.imagenes[0]
        : "images/placeholder.jpg";

    let badgeHTML = "";
    let claseExtra = "";

    if (prod.estado === "Sin Stock") {
      badgeHTML = `<span class="badge">SIN STOCK</span>`;
      claseExtra = "sin-stock";
    } else if (prod.estado === "Últimos Disponibles") {
      badgeHTML = `<span class="badge">ÚLTIMOS DISPONIBLES</span>`;
      claseExtra = "ultimos";
    }

    const HTMLPrecios =
      typeof generarHTMLPrecios === "function"
        ? generarHTMLPrecios(prod)
        : `<div class="precios"><p class="precio-unico">$ ${prod.precioRegular || 0}</p></div>`;

    const card = `
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
    contenedor.innerHTML += card;
  });

  // SI FALTAN PRODUCTOS POR MOSTRAR, DIBUJAMOS EL BOTÓN "CARGAR MÁS"
  if (cantidadMostrada < totalResultados) {
    contenedor.innerHTML += `
      <div style="width: 100%; display: flex; justify-content: center; margin-top: 30px; margin-bottom: 20px;">
        <button id="btn-cargar-mas" style="background-color: #ffffff; color: #7454d9; border: 2px solid #7454d9; padding: 12px 30px; border-radius: 15px; font-weight: 800; cursor: pointer; font-family: 'Unbounded', sans-serif; font-size: 14px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
          CARGAR MÁS PRODUCTOS
        </button>
      </div>`;

    // Le damos vida al botón
    setTimeout(() => {
      const btnCargarMas = document.getElementById("btn-cargar-mas");
      if (btnCargarMas) {
        btnCargarMas.onclick = () => {
          cantidadMostrada += 12; // Sumamos 12 más a la vista
          aplicarFiltros(); // Re-dibujamos
        };
      }
    }, 0);
  }
}

// FUNCIÓN DE FILTRADO
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
    const catFiltro = norm(filtrosActivos.categoria);
    const pColeccion = norm(p.coleccion);
    const matchCategoria =
      catFiltro === "todos" || pColeccion.includes(catFiltro);

    let matchTipoPrecio = true;
    const pTipoPrecio = norm(p.tipoPrecio || "");
    if (filtrosActivos.tipoPrecioFiltro === "oferta") {
      matchTipoPrecio = pTipoPrecio.includes("oferta");
    } else if (filtrosActivos.tipoPrecioFiltro === "pack") {
      matchTipoPrecio =
        pTipoPrecio.includes("pack") || pTipoPrecio.includes("docena");
    }

    const queryBusqueda = norm(filtrosActivos.busqueda || "");
    const textoCompleto =
      norm(p.nombre || "") + " " + norm(p.descripcion || "");
    const palabrasIgnoradas = [
      "de",
      "para",
      "el",
      "la",
      "los",
      "las",
      "un",
      "una",
      "con",
      "sin",
      "y",
      "o",
    ];

    let palabrasBuscadas = queryBusqueda
      .split(" ")
      .filter(
        (palabra) => palabra.length > 1 && !palabrasIgnoradas.includes(palabra),
      );
    if (palabrasBuscadas.length === 0 && queryBusqueda !== "") {
      palabrasBuscadas = queryBusqueda.split(" ").filter((p) => p !== "");
    }
    const matchBusqueda =
      palabrasBuscadas.length === 0 ||
      palabrasBuscadas.some((palabra) => textoCompleto.includes(palabra));

    // NUEVO: FILTRO POR ETIQUETA MÚLTIPLE
    const pEtiquetas = norm(p.etiqueta || "");
    const matchEtiqueta =
      filtrosActivos.etiqueta === "todos" ||
      pEtiquetas.includes(filtrosActivos.etiqueta);

    return matchCategoria && matchTipoPrecio && matchBusqueda && matchEtiqueta;
  });

  // CORTAMOS LA LISTA PARA LA PAGINACIÓN
  const productosPaginados = resultado.slice(0, cantidadMostrada);

  // Enviamos los paginados a dibujar, pero le avisamos cuántos hay en total
  renderizarProductos(productosPaginados, resultado.length);
}

// CONFIGURACIÓN DE ESCUCHADORES Y EVENTOS
function configurarEscuchadores() {
  console.log("⚙️ Configurando escuchadores...");

  // 1. BOTONES DE CATEGORÍA
  document.querySelectorAll(".category-btn").forEach((btn) => {
    btn.onclick = (e) => {
      const textoBoton = e.target.innerText.trim().toLowerCase();

      document
        .querySelectorAll(".category-btn")
        .forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");

      if (textoBoton === "ofertas") {
        filtrosActivos.tipoPrecioFiltro = "oferta";
        filtrosActivos.categoria = "todos";
      } else if (textoBoton === "docenas" || textoBoton === "packs/docenas") {
        filtrosActivos.tipoPrecioFiltro = "pack";
        filtrosActivos.categoria = "todos";
      } else {
        filtrosActivos.tipoPrecioFiltro = "todos";
        filtrosActivos.categoria = textoBoton;
      }

      yaFiltroElUsuario = true;
      filtrosActivos.etiqueta = "todos";
      cantidadMostrada = 12;
      aplicarFiltros();
    };
  });

  // 2. LÓGICA DEL BUSCADOR (Lupa, Enter y X)
  const buscadorInput = document.getElementById("buscador-input");
  const btnLupa = document.getElementById("lupa-btn");
  const btnLimpiar = document.getElementById("limpiar-busqueda-btn");

  const ejecutarBusqueda = () => {
    if (buscadorInput) {
      filtrosActivos.busqueda = buscadorInput.value.trim();

      // NUEVO: Si el usuario escribe algo, quitamos el filtro de categoría para buscar en toda la tienda
      if (filtrosActivos.busqueda !== "") {
        filtrosActivos.categoria = "todos";
        filtrosActivos.tipoPrecioFiltro = "todos";

        // Actualizamos los botones visualmente para que se marque "Todos"
        document.querySelectorAll(".category-btn").forEach((b) => {
          const txt = b.innerText.trim().toLowerCase();
          b.classList.toggle("active", txt === "todos");
        });
      }

      yaFiltroElUsuario = true;
      filtrosActivos.etiqueta = "todos";
      cantidadMostrada = 12;
      aplicarFiltros();
    }
  };

  if (buscadorInput) {
    // Mostrar u ocultar la 'X' mientras escribe
    buscadorInput.oninput = (e) => {
      const val = e.target.value.trim();
      if (btnLimpiar) {
        btnLimpiar.classList.toggle("hidden", val === "");
      }
    };

    // Buscar al presionar ENTER
    buscadorInput.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        ejecutarBusqueda();
      }
    };
  }

  // Buscar al presionar la LUPA
  if (btnLupa) {
    btnLupa.onclick = (e) => {
      e.preventDefault();
      ejecutarBusqueda();
    };
  }

  // Borrar búsqueda con el botón 'X'
  if (btnLimpiar) {
    btnLimpiar.onclick = () => {
      if (buscadorInput) {
        buscadorInput.value = "";
        btnLimpiar.classList.add("hidden");
        filtrosActivos.busqueda = "";
        yaFiltroElUsuario = true;
        aplicarFiltros();
      }
    };
  }

  sincronizarFiltrosDesdeUI();
}

// SCROLL HEADER EFFECT
window.addEventListener("scroll", () => {
  const header = document.querySelector(".filters");
  if (!header) return;

  if (window.scrollY > 50) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});

// SINCRONIZAR UI DESDE ESTADO
function sincronizarFiltrosDesdeUI() {
  if (!window.productos || window.productos.length === 0) return;

  const btnActivo = document.querySelector(".category-btn.active");
  if (btnActivo) {
    const texto = btnActivo.innerText.trim().toLowerCase();
    if (texto === "ofertas") {
      filtrosActivos.tipoPrecioFiltro = "oferta";
      filtrosActivos.categoria = "todos";
    } else if (texto === "docenas" || texto === "packs/docenas") {
      filtrosActivos.tipoPrecioFiltro = "pack";
      filtrosActivos.categoria = "todos";
    } else {
      filtrosActivos.tipoPrecioFiltro = "todos";
      filtrosActivos.categoria = texto;
    }
  }

  aplicarFiltros();
}

window.addEventListener("pageshow", (event) => {
  if (
    event.persisted ||
    (window.performance && window.performance.navigation.type === 2)
  ) {
    sincronizarFiltrosDesdeUI();
  }
});
