// Variable global para rastrear qué eligió el usuario
let varianteSeleccionada = null;
let talleSeleccionado = null; // Para rastrear el talle elegido
let usuarioYaInteractuo = false; // Nueva variable de control
let indexImagenPazBaires = 0;

// 1. INTENTO DE CARGA INSTANTÁNEA (Caché)
const cache = localStorage.getItem("productos_cache");
if (cache) {
  productos = JSON.parse(cache);
  console.log("🚀 Cargando info del producto desde caché");

  // Solo ejecutamos cargarProducto si la función ya está definida
  if (typeof cargarProducto === "function") {
    cargarProducto();
  }
}

// 2. ESCUCHA DE ACTUALIZACIONES (Google Sheets)
// Si Google responde después con datos nuevos, volvemos a cargar para actualizar precios/stock
document.addEventListener("productosListos", () => {
  console.log("🔄 Datos frescos de Google Sheets recibidos...");
  // SI EL USUARIO YA ELIGIÓ ALGO, NO RECARGAMOS LA PÁGINA
  if (usuarioYaInteractuo) {
    console.log(
      "⚠️ El usuario ya está eligiendo opciones, no se reinicia para no perder la selección.",
    );
    return;
  }

  console.log("🔄 Actualizando info del producto desde Google Sheets...");
  if (typeof cargarProducto === "function") {
    cargarProducto();
  }
});

function cargarProducto() {
  if (typeof productos === "undefined" || productos.length === 0) {
    const cache = localStorage.getItem("cache_productos");
    if (cache) {
      productos = JSON.parse(cache);
    } else {
      return; // Si no hay nada, esperamos a Google
    }
  }

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");
  const producto = productos.find((p) => p.id == productId);

  if (!producto) {
    document.querySelector("main").innerHTML =
      `<h1 style="color:white; text-align:center; padding-top:150px">Producto no encontrado</h1>`;
    return;
  }

  // --- EL TRUCO ESTÁ ACÁ ---
  // Si el usuario ya interactuó, NO reseteamos el índice a 0
  if (!usuarioYaInteractuo) {
    indexImagenPazBaires = 0;
  }
  // -------------------------

  // 1. Cargar Datos Básicos
  document.getElementById("productName").innerText = producto.nombre;
  document.getElementById("productBrand").innerText =
    producto.marca || "PAZ BAIRES";
  document.getElementById("productDesc").innerHTML = producto.descripcion;

  // 2. Precios
  document.getElementById("currentPrice").innerText =
    `$${producto.precio.toLocaleString()}`;
  document.getElementById("transferPrice").innerText =
    `$${Math.round(producto.precio * 0.85).toLocaleString()}`;

  // 3. Galería y Miniaturas
  const mainImg = document.getElementById("mainImg");
  const thumbBar = document.getElementById("thumbBar");

  if (producto.imagenes && producto.imagenes.length > 0) {
    mainImg.src = producto.imagenes[indexImagenPazBaires];
    thumbBar.innerHTML = "";
    producto.imagenes.forEach((img, index) => {
      const thumb = document.createElement("img");
      thumb.src = img;
      thumb.className = `thumb ${index === indexImagenPazBaires ? "active" : ""}`;
      thumb.onclick = function () {
        usuarioYaInteractuo = true; // <--- AGREGAR ESTO
        indexImagenPazBaires = index;
        mainImg.src = this.src;
        document
          .querySelectorAll(".thumb")
          .forEach((t) => t.classList.remove("active"));
        this.classList.add("active");

        // Si es tipo estampado, la miniatura también elige la variante
        if (producto.tipo === "estampado") {
          varianteSeleccionada = producto.variantes[index].nombre;
          document.getElementById("stampedName").innerText =
            varianteSeleccionada;
          actualizarGuia();
        }
      };
      thumbBar.appendChild(thumb);
    });
  }

  // 4. Detalles Técnicos (Reparado para múltiples cuadros)
  const detailsGrid = document.getElementById("techDetails");
  detailsGrid.innerHTML = "";

  if (producto.detalles && producto.detalles.Tecnico) {
    // 1. Separamos por comas para obtener cada par (Ej: "Material: Microfibra")
    const listaDetalles = producto.detalles.Tecnico.split(",");

    listaDetalles.forEach((item) => {
      if (item.includes(":")) {
        const [titulo, valor] = item.split(":");

        // 2. Creamos el cuadrito individual
        const div = document.createElement("div");
        div.className = "detail-item"; // Usamos tu clase existente
        div.innerHTML = `<strong>${titulo.trim()}:</strong> <span>${valor.trim()}</span>`;

        detailsGrid.appendChild(div);
      }
    });
  }

  // 5. Variantes (Colores o Estampados)
  const variantSelector = document.getElementById("variantSelector");
  if (producto.tipo === "color") {
    renderSeccionColores(variantSelector, producto);
  } else {
    renderSeccionEstampados(variantSelector, producto);
    // Solo marcamos si existen variantes para evitar el error 'nombre' of undefined
    if (
      !usuarioYaInteractuo &&
      producto.variantes &&
      producto.variantes.length > 0
    ) {
      varianteSeleccionada = producto.variantes[0].nombre;
    }
  }

  // --- NUEVO: Sección de Talles ---
  // Buscamos si el producto tiene la propiedad talles (asegurate que en productos.js se llame así)
  renderSeccionTalles(variantSelector, producto);

  // 6. Lógica de Flechas Carrusel
  let indexImagenActual = 0;
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  function cambiarImagen(index) {
    if (index < 0) index = producto.imagenes.length - 1;
    if (index >= producto.imagenes.length) index = 0;
    indexImagenActual = index;
    mainImg.src = producto.imagenes[indexImagenActual];
    document.querySelectorAll(".thumb").forEach((t, idx) => {
      t.classList.toggle("active", idx === indexImagenActual);
    });
  }

  prevBtn.onclick = () => cambiarImagen(indexImagenActual - 1);
  nextBtn.onclick = () => cambiarImagen(indexImagenActual + 1);

  // 7. Lógica de Cantidad
  const decreaseQty = document.getElementById("decreaseQty");
  const increaseQty = document.getElementById("increaseQty");
  const qtyInput = document.getElementById("itemQuantity");

  decreaseQty.onclick = () => {
    usuarioYaInteractuo = true; // <--- AGREGAR ESTO
    let current = parseInt(qtyInput.value);
    if (current > 1) {
      qtyInput.value = current - 1;
      actualizarGuia(); // <--- Actualiza el texto
    }
  };

  increaseQty.onclick = () => {
    usuarioYaInteractuo = true; // <--- AGREGAR ESTO
    let current = parseInt(qtyInput.value);
    qtyInput.value = current + 1;
    actualizarGuia(); // <--- Actualiza el texto
  };

  // 8. Inicializar Guía por primera vez
  actualizarGuia();

  // AL FINAL DE LA FUNCIÓN DE CARGA:
  const container = document.getElementById("productContainer");
  if (container) {
    container.classList.remove("loading");
  }

  const btn = document.getElementById("btn-agregar");
  const precioContainer = document.getElementById("currentPrice");

  if (producto.estado === "Sin Stock") {
    if (btn) {
      btn.disabled = true;
      btn.innerText = "SIN STOCK";
      btn.style.background = "#555";
      btn.style.cursor = "not-allowed";
    }
    if (precioContainer) {
      precioContainer.innerHTML += ` <span style="color: #ba2e2e; font-size: 0.8rem; display: block;">Temporalmente sin stock</span>`;
    }
  } else if (producto.estado && producto.estado !== "Activo") {
    // Para "Últimos Disponibles" u otros estados
    if (precioContainer) {
      precioContainer.innerHTML += ` <span style="color: #ff9800; font-size: 0.8rem; display: block;">¡Aprovechá! ${producto.estado}</span>`;
    }
  }
}

// FUNCIONES DE APOYO (Fuera de cargarProducto para que sea más limpio)
// --- FUNCION DE GUIA RENOVADA ---
function actualizarGuia() {
  const guia = document.getElementById("guia-seleccion");
  const cantidad = document.getElementById("itemQuantity").value;
  if (!guia) return;

  // 1. Manejar el estado del Talle (Útil para Pijamas o Toallas con talle)
  let textoTalle = "";
  if (talleSeleccionado) {
    textoTalle = ` (Talle: <strong>${talleSeleccionado}</strong>)`;
  }

  // 2. Manejar el estado de la Variante (Color o Estampado)
  if (!varianteSeleccionada) {
    // Si no eligió color/estampado, solo mostramos la cantidad si ya es > 1
    if (parseInt(cantidad) > 1) {
      guia.innerHTML = `Elegí una opción para tus <strong>${cantidad}</strong> productos`;
    } else {
      guia.innerHTML = `Seleccioná una opción`;
    }
    guia.style.opacity = "0.7"; // Un poco transparente para avisar que falta algo
  } else {
    // --- ESTA ES LA LINEA MAGICA ---
    // Combinamos todo: Cantidad + Variante + Talle (si existe)
    guia.innerHTML = `Seleccionaste <strong>${cantidad}</strong> de <strong>${varianteSeleccionada}</strong>${textoTalle}`;
    guia.style.opacity = "1"; // Totalmente opaco, está todo listo
  }
}

function renderSeccionColores(container, prod) {
  container.innerHTML = `
        <span class="selector-title">Elegí el color:</span>
        <div class="color-grid"></div>
        <p id="colorNameDisplay" style="font-size: 0.8rem; margin-top: 10px; opacity: 0.8"><i>Hacé click en un color</i></p>
    `;
  const grid = container.querySelector(".color-grid");
  prod.variantes.forEach((v) => {
    const dot = document.createElement("div");
    dot.className = "color-dot";
    if (varianteSeleccionada === v.nombre) dot.classList.add("active");
    dot.style.backgroundColor = v.valor;
    dot.onclick = function () {
      usuarioYaInteractuo = true;
      document
        .querySelectorAll(".color-dot")
        .forEach((d) => d.classList.remove("active"));
      this.classList.add("active");
      varianteSeleccionada = v.nombre;
      document.querySelector("#colorNameDisplay").innerHTML =
        `Seleccionado: <strong>${v.nombre}</strong>`;
      actualizarGuia();
    };
    grid.appendChild(dot);
  });

  // Si ya había algo seleccionado (por caché), actualizamos el texto de abajo
  if (varianteSeleccionada) {
    document.querySelector("#colorNameDisplay").innerHTML =
      `Seleccionado: <strong>${varianteSeleccionada}</strong>`;
  }
}

function renderSeccionEstampados(container, prod) {
  // --- BORRÁ ESTA LÍNEA: varianteSeleccionada = null; ---

  // Si ya había una variante (porque el usuario ya clickeó antes de que Google Sheets actualice)
  // la mantenemos, si no, ponemos "No seleccionado"
  const nombreMostrar = varianteSeleccionada
    ? varianteSeleccionada
    : "No seleccionado";

  container.innerHTML = `
        <div class="stamped-selected-text">
            Estampado: <strong id="stampedName">${nombreMostrar}</strong>
        </div>
        <p style="font-size:0.8rem; opacity:0.7; margin-top:10px; opacity: 0.8">
            <i>Seleccioná el diseño haciendo click en las fotos de la galería.</i>
        </p>
    `;
  actualizarGuia();
}

function renderSeccionTalles(container, prod) {
  // Verificamos si hay talles. Si no hay o es un array vacío, no hacemos nada.
  if (
    !prod.talles ||
    prod.talles.length === 0 ||
    (prod.talles.length === 1 && prod.talles[0] === "")
  ) {
    return;
  }

  // Creamos el contenedor de talles si no existe
  let talleDiv = document.getElementById("talleSelectorContainer");
  if (!talleDiv) {
    talleDiv = document.createElement("div");
    talleDiv.id = "talleSelectorContainer";
    talleDiv.className = "detalles-item";
    talleDiv.innerHTML = `<span class="selector-title">Elegí tu talle:</span><div class="talles-grid"></div>`;
    container.appendChild(talleDiv);
  }

  const grid = talleDiv.querySelector(".talles-grid");
  grid.innerHTML = ""; // Limpiamos para no duplicar

  prod.talles.forEach((t) => {
    const btn = document.createElement("div");
    btn.className = "talle-dot"; // Usaremos una clase similar a color-dot pero cuadrada
    btn.innerText = t;

    // Lógica para "Talle Único": Se selecciona solo
    if (t.toLowerCase().includes("unico") || prod.talles.length === 1) {
      talleSeleccionado = t;
      btn.classList.add("active");
    }

    if (talleSeleccionado === t) btn.classList.add("active");

    btn.onclick = function () {
      usuarioYaInteractuo = true;
      document
        .querySelectorAll(".talle-dot")
        .forEach((d) => d.classList.remove("active"));
      this.classList.add("active");
      talleSeleccionado = t;
      actualizarGuia();
    };
    grid.appendChild(btn);
  });
}

// Esperamos a que cargue el DOM
document.addEventListener("DOMContentLoaded", () => {
  const botonAgregar = document.getElementById("btn-agregar");

  if (botonAgregar) {
    botonAgregar.onclick = () => {
      // Usamos .onclick para asegurar que sea el único evento
      const urlParams = new URLSearchParams(window.location.search);
      const productId = urlParams.get("id");
      const productoActual = productos.find((p) => p.id == productId);

      if (!productoActual) return;

      // Limpiamos la variante de cualquier espacio o texto raro
      const varianteLimpia = (varianteSeleccionada || "")
        .toString()
        .trim()
        .toLowerCase();

      console.log("DEBUG - Variante detectada:", `"${varianteLimpia}"`);

      if (
        productoActual.talles &&
        productoActual.talles.length > 0 &&
        !talleSeleccionado
      ) {
        alert("⚠️ Por favor, seleccioná un talle.");
        return;
      }

      // VALIDACIÓN RADICAL:
      // Si está vacía, es null, es "ninguno", o es el texto por defecto
      if (
        !varianteSeleccionada ||
        varianteLimpia === "" ||
        varianteLimpia === "ninguno" ||
        varianteLimpia.includes("hace click")
      ) {
        alert(
          "⚠️ Por favor, seleccioná un color o estampado específico antes de continuar.",
        );
        return; // BLOQUEO TOTAL
      }

      const cantidad =
        parseInt(document.getElementById("itemQuantity")?.value) || 1;

      // Si pasó la validación, agregamos y redirigimos
      agregarAlCarrito(
        productoActual,
        cantidad,
        varianteSeleccionada,
        talleSeleccionado,
      );
      window.location.href = "carrito.html";
    };
  }
});

function agregarAlCarrito(producto, cantidad, varianteSeleccionada, talle) {
  let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

  const nuevoItem = {
    id: producto.id,
    nombre: producto.nombre,
    precio: producto.precio,
    // CAMBIO AQUÍ: Usamos una validación para la imagen por si el array viene vacío
    imagen:
      producto.imagenes && producto.imagenes.length > 0
        ? producto.imagenes[0]
        : "default.jpg",
    variante: talle ? `${variante} - Talle ${talle}` : variante, // Combinamos variante y talle
    cantidad: parseInt(cantidad),
    subtotal: producto.precio * parseInt(cantidad), // Aseguramos que cantidad sea número
  };

  const existeIndex = carrito.findIndex(
    (item) => item.id === nuevoItem.id && item.variante === nuevoItem.variante,
  );

  if (existeIndex !== -1) {
    carrito[existeIndex].cantidad += nuevoItem.cantidad;
    carrito[existeIndex].subtotal =
      carrito[existeIndex].cantidad * carrito[existeIndex].precio;
  } else {
    carrito.push(nuevoItem);
  }

  localStorage.setItem("carrito", JSON.stringify(carrito));

  // Opcional: puedes quitar el alert si ya vas a redirigir
  // para que la experiencia sea más fluida.
}

// En lugar de "load", esperamos a que los productos de Google estén listos
document.addEventListener("productosListos", cargarProducto);
