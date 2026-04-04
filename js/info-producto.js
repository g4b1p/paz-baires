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
        usuarioYaInteractuo = true;

        // --- VALIDACIÓN DE STOCK (LA QUE YA TENÍAS) ---
        if (
          producto.tipo === "estampado" &&
          talleSeleccionado &&
          producto.stockMapa
        ) {
          const nombreEstampadoClick = producto.variantes[index].nombre;
          const permitidos = producto.stockMapa[talleSeleccionado] || [];

          if (!permitidos.includes(nombreEstampadoClick)) {
            alert(
              `⚠️ El diseño "${nombreEstampadoClick}" no está disponible en Talle ${talleSeleccionado}.`,
            );
            return;
          }
        }

        // --- CAMBIO VISUAL DE LA IMAGEN ---
        indexImagenPazBaires = index;
        mainImg.src = this.src;
        document
          .querySelectorAll(".thumb")
          .forEach((t) => t.classList.remove("active"));
        this.classList.add("active");

        // --- SELECCIÓN INTELIGENTE DEL ESTAMPADO ---
        if (producto.tipo === "estampado") {
          const nombreVariante = producto.variantes[index].nombre;

          // SOLO se selecciona automáticamente si el nombre es LARGO (más de 2 letras)
          // Si es un número (ej: "1"), NO entra acá y no te pisa la selección.
          if (nombreVariante.length > 2) {
            varianteSeleccionada = nombreVariante;
            document.getElementById("stampedName").innerText =
              varianteSeleccionada;
            actualizarGuia();
          }
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
  // BUSCÁ ESTO EN cargarProducto() y reemplazalo:
  const variantSelector = document.getElementById("variantSelector");
  variantSelector.innerHTML = ""; // Limpiamos UNA SOLA VEZ al principio

  // Creamos contenedores vacíos para que cada función escriba en su lugar
  const divTalles = document.createElement("div");
  divTalles.id = "talleSelectorContainer";
  variantSelector.appendChild(divTalles);

  // Contenedor para la opción (Color o Estampado)
  const divOpciones = document.createElement("div");
  divOpciones.id = "opcionesContainer";
  variantSelector.appendChild(divOpciones);

  // 1. Renderizamos talles si existen
  renderSeccionTalles(divTalles, producto);

  // 2. Lógica Inteligente: ¿Es color o es estampado?
  if (producto.tipo === "color") {
    // Si en el Excel dice "color", dibuja los circulitos
    renderSeccionColores(divOpciones, producto);
  } else {
    // Si dice "estampado" (o cualquier otra cosa), usa la lógica de fotos
    renderSeccionEstampados(divOpciones, producto);
  }

  // 6. Lógica de Flechas Carrusel
  let indexImagenActual = 0;
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  function cambiarImagen(direccion) {
    const totalImg = producto.imagenes.length;
    let nuevoIndex = indexImagenPazBaires;

    // Intentamos buscar la siguiente imagen válida
    for (let i = 0; i < totalImg; i++) {
      nuevoIndex = (nuevoIndex + direccion + totalImg) % totalImg;

      // Si es tipo estampado y hay un talle elegido, verificamos si esta imagen es válida
      if (producto.tipo === "estampado" && talleSeleccionado) {
        const nombreEst = producto.variantes[nuevoIndex].nombre;
        const permitidos = producto.stockMapa[talleSeleccionado] || [];

        if (permitidos.includes(nombreEst)) {
          // ¡Encontramos una válida! Cortamos el bucle
          break;
        }
        // Si no es válida, el "for" seguirá buscando la siguiente
      } else {
        // Si no hay restricciones de talle, la primera que sigue ya nos sirve
        break;
      }
    }

    indexImagenPazBaires = nuevoIndex;
    const mainImg = document.getElementById("mainImg");
    mainImg.src = producto.imagenes[indexImagenPazBaires];

    // Actualizamos miniaturas visualmente
    document.querySelectorAll(".thumb").forEach((t, idx) => {
      t.classList.toggle("active", idx === indexImagenPazBaires);
    });

    // IMPORTANTE: Si es estampado, actualizamos la selección al mover la flecha
    if (producto.tipo === "estampado") {
      const nombreVarianteFlecha =
        producto.variantes[indexImagenPazBaires].nombre;

      // Solo actualiza el texto y la selección si el nombre tiene más de 2 letras (ej: "Rosa con Flores")
      // Si es "1", "2" o "3", la flecha SOLO pasa la foto y deja el número quietito.
      if (nombreVarianteFlecha.length > 2) {
        varianteSeleccionada = nombreVarianteFlecha;
        const stampedDisplay = document.getElementById("stampedName");
        if (stampedDisplay) stampedDisplay.innerText = varianteSeleccionada;
        usuarioYaInteractuo = true;
        actualizarGuia();
      }
    }
  }

  prevBtn.onclick = () => cambiarImagen(-1);
  nextBtn.onclick = () => cambiarImagen(1);

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
    // ESTADO: AGOTADO (Gris)
    if (btn) {
      btn.disabled = true;
      btn.innerText = "SIN STOCK";
      btn.style.background = "#555";
      btn.style.cursor = "not-allowed";
    }
    if (precioContainer) {
      precioContainer.innerHTML += ` <span style="color: #ba2e2e; font-size: 0.8rem; display: block;">Temporalmente sin stock</span>`;
    }
  } else if (producto.estado === "Próximamente") {
    // --- NUEVO ESTADO: PRÓXIMAMENTE (Lila / Violeta Aesthetic) ---
    if (btn) {
      btn.disabled = true;
      btn.innerText = "NUEVO INGRESO";
      btn.style.background = "#a27ae3"; // Un violeta/lila que combine con tu web
      btn.style.color = "white";
      btn.style.cursor = "wait";
    }
    if (precioContainer) {
      // Usamos el mismo violeta para el texto informativo
      precioContainer.innerHTML += ` <span style="color: #99e05e; font-size: 0.9rem; display: block; font-weight: bold; margin-top: 5px;">¡Próximamente en Paz Baires!</span>`;
    }
  } else if (producto.estado && producto.estado !== "Activo") {
    // ESTADO: ÚLTIMOS DISPONIBLES (Naranja)
    if (precioContainer) {
      precioContainer.innerHTML += ` <span style="color: #ffe600; font-size: 0.8rem; display: block;">¡Aprovechá! ${producto.estado}</span>`;
    }
  }
}

// FUNCIONES DE APOYO (Fuera de cargarProducto para que sea más limpio)
// --- FUNCION DE GUIA RENOVADA ---
function actualizarGuia() {
  const guia = document.getElementById("guia-seleccion");
  const cantidad = document.getElementById("itemQuantity").value;
  if (!guia) return;

  // 1. Manejar el estado del Talle
  let textoTalle = "";
  if (talleSeleccionado) {
    textoTalle = ` (Talle: <strong>${talleSeleccionado}</strong>)`;
  }

  // 2. Manejar el estado de la Variante (Color o Estampado)
  if (!varianteSeleccionada) {
    if (parseInt(cantidad) > 1) {
      guia.innerHTML = `Elegí una opción para tus <strong>${cantidad}</strong> productos`;
    } else {
      guia.innerHTML = `Seleccioná una opción`;
    }
    guia.style.opacity = "0.7";
  } else {
    // --- NUEVA LÓGICA MÁGICA PARA NÚMEROS ---
    let textoVariante = varianteSeleccionada;

    // Si el nombre es un número (2 caracteres o menos), le damos formato de "Estampado N°"
    if (varianteSeleccionada.length <= 2) {
      textoVariante = `Estampado N° <strong>${varianteSeleccionada}</strong>`;
    } else {
      // Si es un nombre largo, lo ponemos en negrita normal
      textoVariante = `<strong>${varianteSeleccionada}</strong>`;
    }

    // Combinamos todo: Cantidad + El texto que armamos arriba + Talle
    guia.innerHTML = `Seleccionaste <strong>${cantidad}</strong> de ${textoVariante}${textoTalle}`;
    guia.style.opacity = "1";
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
  const nombreMostrar = varianteSeleccionada
    ? varianteSeleccionada
    : "No seleccionado";

  // Detectamos si son números (2 letras o menos, ej: "1", "02", "A")
  const esModoNumeros =
    prod.variantes.length > 0 && prod.variantes[0].nombre.length <= 2;

  if (esModoNumeros) {
    // CASO A: CÍRCULOS CON NÚMEROS (Estilo Vidrio igual a los talles)
    container.innerHTML = `
      <div class="stamped-selected-text">
          Estampado: <strong id="stampedName">${nombreMostrar}</strong>
      </div>
      <span class="selector-title">Elegí el número:</span>
      <div class="talles-grid"></div> 
      <p style="font-size:0.75rem; opacity:0.7; margin-top:8px;">
          <i>Mirá los números en la foto y elegí el tuyo</i>
      </p>
    `;

    const grid = container.querySelector(".talles-grid");

    prod.variantes.forEach((v) => {
      const dot = document.createElement("div");
      dot.className = "talle-dot"; // Usamos tu clase de CSS de los talles
      dot.innerText = v.nombre;

      if (varianteSeleccionada === v.nombre) dot.classList.add("active");

      dot.onclick = function () {
        usuarioYaInteractuo = true;
        // Buscamos dentro de este contenedor específico para no pisar los talles reales
        grid
          .querySelectorAll(".talle-dot")
          .forEach((d) => d.classList.remove("active"));
        this.classList.add("active");

        varianteSeleccionada = v.nombre;
        document.getElementById("stampedName").innerText = v.nombre;

        if (typeof actualizarGuia === "function") actualizarGuia();
      };
      grid.appendChild(dot);
    });
  } else {
    // CASO B: TU DISEÑO ORIGINAL (Nombres largos / Click en galería)
    container.innerHTML = `
      <div class="stamped-selected-text">
          Estampado: <strong id="stampedName">${nombreMostrar}</strong>
      </div>
      <p style="font-size:0.8rem; opacity:0.7; margin-top:10px;">
          <i>Seleccioná el diseño haciendo click en las fotos de la galería.</i>
      </p>
    `;
  }

  if (typeof actualizarGuia === "function") actualizarGuia();
}

function renderSeccionTalles(container, prod) {
  const listaTalles = prod.tallesDisponibles || [];
  if (listaTalles.length === 0) return;

  container.innerHTML = `<span class="selector-title">Elegí tu talle:</span><div class="talles-grid"></div>`;
  const grid = container.querySelector(".talles-grid");

  listaTalles.forEach((t) => {
    const btn = document.createElement("div");
    btn.className = `talle-dot ${talleSeleccionado === t ? "active" : ""}`;
    btn.innerText = t;

    btn.onclick = function () {
      usuarioYaInteractuo = true;
      talleSeleccionado = t;

      // Actualizamos visualmente los botones de talle
      document
        .querySelectorAll(".talle-dot")
        .forEach((d) => d.classList.remove("active"));
      this.classList.add("active");

      // --- AQUÍ ESTÁ EL CAMBIO ---
      // Solo actualizamos la guía y el texto, NO borramos la pantalla
      actualizarGuia();

      // Si querés que al cambiar talle se avise qué estampados hay (opcional)
      console.log("Estampados para este talle:", prod.stockMapa[t]);

      // Dentro de btn.onclick de los talles, al final:
      if (prod.tipo === "estampado" && prod.stockMapa) {
        const permitidos = prod.stockMapa[talleSeleccionado] || [];
        document.querySelectorAll(".thumb").forEach((thumb, idx) => {
          const nombreEst = prod.variantes[idx].nombre;
          thumb.style.opacity = permitidos.includes(nombreEst) ? "1" : "0.3";
          thumb.style.filter = permitidos.includes(nombreEst)
            ? "none"
            : "grayscale(100%)";
        });
      }
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

      // 1. Validar Talle (Si el producto tiene talles)
      const tieneTalles =
        productoActual.tallesDisponibles &&
        productoActual.tallesDisponibles.length > 0;
      if (tieneTalles && !talleSeleccionado) {
        alert("❌ Por favor, seleccioná un talle primero.");
        // Opcional: scroll suave hacia los talles para que el usuario los vea
        document
          .getElementById("talleSelectorContainer")
          .scrollIntoView({ behavior: "smooth" });
        return;
      }

      // 2. Validar Estampado/Variante
      const varianteLimpia = (varianteSeleccionada || "")
        .toString()
        .trim()
        .toLowerCase();
      if (
        !varianteSeleccionada ||
        varianteLimpia === "" ||
        varianteLimpia === "no seleccionado"
      ) {
        alert("❌ Por favor, seleccioná un estampado o color.");
        return;
      }

      if (
        productoActual.talles &&
        productoActual.talles.length > 0 &&
        !talleSeleccionado
      ) {
        alert("⚠️ Por favor, seleccioná un talle.");
        return;
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
      // Animación de éxito (opcional) antes de ir al carrito
      botonAgregar.innerText = "¡Agregado!";
      setTimeout(() => {
        window.location.href = "carrito.html";
      }, 500);
    };
  }
});

function agregarAlCarrito(producto, cantidad, varianteSeleccionada, talle) {
  let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

  // Creamos el texto que se va a ver en el carrito
  // Si hay talle: "Azul - Talle 85" | Si no hay talle: "Azul"
  const textoVariante = talle
    ? `${varianteSeleccionada} - Talle ${talle}`
    : varianteSeleccionada;

  const nuevoItem = {
    id: producto.id,
    nombre: producto.nombre,
    precio: producto.precio,
    imagen:
      producto.imagenes && producto.imagenes.length > 0
        ? producto.imagenes[0]
        : "default.jpg",
    variante: textoVariante, // <--- Ahora usamos la variable que creamos arriba
    cantidad: parseInt(cantidad),
    subtotal: producto.precio * parseInt(cantidad),
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
  window.location.href = "carrito.html"; // La lleva a ver su compra
}

// En lugar de "load", esperamos a que los productos de Google estén listos
document.addEventListener("productosListos", cargarProducto);
