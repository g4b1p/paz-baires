// Variable global para rastrear qué eligió el usuario
let varianteSeleccionada = null;
let talleSeleccionado = null;
let usuarioYaInteractuo = false;
let indexImagenPazBaires = 0;
let seleccionesGlobales = {};
let productoYaRenderizado = false; // EL ESCUDO DEFENSIVO: Evita que la pantalla parpadee o se resetee a los 3 segundos

function mostrarAlertaPersonalizada(mensaje) {
  const modal = document.createElement("div");
  modal.style.cssText =
    "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;";
  modal.innerHTML = `
        <div style="background:#fff;color:#333;padding:25px;border-radius:12px;max-width:350px;width:90%;text-align:center;box-shadow:0 10px 25px rgba(0,0,0,0.2);">
            <h3 style="margin-top:0;color:#ff9800;font-size:22px;">⚠️ Advertencia</h3>
            <p style="margin-bottom:20px;font-size:16px;line-height:1.5;">${mensaje}</p>
            <button onclick="this.parentElement.parentElement.remove()" style="background:#222;color:#fff;border:none;padding:12px 25px;border-radius:8px;font-weight:bold;cursor:pointer;font-size:16px;width:100%;">Aceptar</button>
        </div>
    `;
  document.body.appendChild(modal);
}

function actualizarResumen(producto) {
  const lista = document.getElementById("listaResumen");
  const mensajeObj = document.getElementById("mensajeMayoristaDinamico");
  const contenedor = document.getElementById("resumenContainer");

  lista.innerHTML = "";
  let totalArticulos = 0;

  for (let key in seleccionesGlobales) {
    const item = seleccionesGlobales[key];
    if (item.cantidad > 0) {
      totalArticulos += item.cantidad;
      const li = document.createElement("li");
      let textoTalle = item.talle ? `(Talle: ${item.talle})` : "";

      // Corrección para que muestre "Estampado N° X" si es un número corto
      let textoVariante = item.variante;
      if (textoVariante.length <= 2) {
        textoVariante = `Estampado N° <strong>${textoVariante}</strong>`;
      } else {
        textoVariante = `<strong>${textoVariante}</strong>`;
      }

      li.innerHTML = `Seleccionaste <strong>${item.cantidad}</strong> del ${textoVariante} ${textoTalle}`;
      lista.appendChild(li);
    }
  }

  if (totalArticulos > 0) {
    contenedor.style.display = "block";
  } else {
    contenedor.style.display = "none";
  }

  // Lógica de mensaje mayorista
  const tipo = (producto.tipoPrecio || "unico").toLowerCase();
  if (
    tipo.includes("mayor") ||
    tipo.includes("pormayor") ||
    tipo.includes("mayorista")
  ) {
    if (totalArticulos < 3) {
      let faltan = 3 - totalArticulos;
      mensajeObj.className = "mensaje-mayorista";
      mensajeObj.innerHTML = `Te faltan ${faltan} artículos para acceder al precio <b>por mayor!</b>`;
    } else {
      mensajeObj.className = "mensaje-mayorista exito";
      mensajeObj.innerHTML = `¡Genial! Llevás 3 o más artículos.<br><b>¡Ya se te está aplicando el precio por mayor!</b>`;
    }
  } else {
    mensajeObj.style.display = "none";
  }
}

// INTENTO DE CARGA INSTANTÁNEA (Caché)
const cache = localStorage.getItem("productos_cache");
if (cache) {
  productos = JSON.parse(cache);
  if (typeof cargarProducto === "function") {
    cargarProducto();
  }
}

// ESCUCHA DE ACTUALIZACIONES (Google Sheets)
document.addEventListener("productosListos", () => {
  // SOLUCIÓN AL BUG PRINCIPAL: Si la página ya cargó visualmente, ignoramos la actualización
  // de fondo. Así el cliente puede seguir tocando sin que se le borre todo de la nada.
  if (!productoYaRenderizado && typeof cargarProducto === "function") {
    cargarProducto();
  }
});

function cargarProducto() {
  if (typeof productos === "undefined" || productos.length === 0) {
    const cache = localStorage.getItem("cache_productos");
    if (cache) {
      productos = JSON.parse(cache);
    } else {
      return;
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

  if (!usuarioYaInteractuo) {
    indexImagenPazBaires = 0;
  }

  // 1. Cargar Datos Básicos
  document.getElementById("productName").innerText = producto.nombre;
  document.getElementById("productBrand").innerText =
    producto.marca || "PAZ BAIRES";

  // 2. LÓGICA Y RENDERIZADO DE PRECIOS POR CASO
  renderizarPrecios(producto);

  // 3. Lógica de Cartel Personalizado (Beneficio)
  const box = document.getElementById("transferBox");
  if (producto.beneficio && producto.beneficio.trim() !== "") {
    box.style.display = "block";
    box.innerHTML = `
        <div style="line-height: 1.3;">
            <strong style="font-size: 0.95rem; color: #fff;">${producto.beneficio}</strong>
            <p style="margin: 5px 0 0 0; font-size: 0.75rem; font-weight: normal; opacity: 0.9;">
                Válido para este producto.
            </p>
        </div>
    `;
  } else {
    box.style.display = "none";
  }

  // 4. Galería y Miniaturas
  const mainImg = document.getElementById("mainImg");
  const thumbBar = document.getElementById("thumbBar");

  if (producto.imagenes && producto.imagenes.length > 0) {
    mainImg.src = producto.imagenes[indexImagenPazBaires];
    thumbBar.innerHTML = "";

    if (
      indexImagenPazBaires === 0 &&
      producto.esEstampado === "NO" &&
      producto.tipo === "estampado"
    ) {
      varianteSeleccionada = null;
    }

    const esMayor = (producto.tipoPrecio || "").toLowerCase().includes("mayor");
    const esModoNumeros =
      producto.variantes &&
      producto.variantes.length > 0 &&
      producto.variantes[0].nombre.length <= 2;
    const usaMulti =
      esMayor && (producto.tipo === "estampado" || producto.tipo === "color");
    const usaMultiThumbnails =
      usaMulti && !(producto.tipo === "estampado" && esModoNumeros);

    const cantGlobal = document.getElementById("cantidadGlobalContainer");
    const resumenPanel = document.getElementById("resumenContainer");
    if (usaMulti) {
      if (cantGlobal) cantGlobal.style.display = "none";
    } else {
      if (cantGlobal) cantGlobal.style.display = "block";
      if (resumenPanel) resumenPanel.style.display = "none";
    }

    producto.imagenes.forEach((img, index) => {
      const wrapper = document.createElement("div");
      wrapper.className = "thumb-wrapper";

      const thumb = document.createElement("img");
      thumb.src = img;
      thumb.className = `thumb ${index === indexImagenPazBaires ? "active" : ""}`;

      let nombreVariante = null;
      if (producto.tipo === "estampado") {
        const offset = producto.esEstampado === "NO" ? 1 : 0;
        if (!(offset === 1 && index === 0)) {
          const indiceVarianteReal = index - offset;
          if (producto.variantes[indiceVarianteReal]) {
            nombreVariante = producto.variantes[indiceVarianteReal].nombre;
          }
        }
      }

      thumb.onclick = function () {
        usuarioYaInteractuo = true; // Frena la recarga fantasma

        if (
          producto.tipo === "estampado" &&
          talleSeleccionado &&
          producto.stockMapa
        ) {
          const permitidos = producto.stockMapa[talleSeleccionado] || [];
          const offset = producto.esEstampado === "NO" ? 1 : 0;
          if (!(offset === 1 && index === 0)) {
            const indiceVarianteReal = index - offset;
            const varianteActual = producto.variantes[indiceVarianteReal];
            if (varianteActual && !permitidos.includes(varianteActual.nombre)) {
              return; // Detiene la ejecución para que no se pueda seleccionar
            }
          }
        }

        indexImagenPazBaires = index;
        mainImg.src = this.src;
        document
          .querySelectorAll(".thumb")
          .forEach((t) => t.classList.remove("active"));
        this.classList.add("active");

        const esDocena = (producto.tipoPrecio || "")
          .toLowerCase()
          .includes("docena");
        const esDocenaCerrada =
          esDocena && (!producto.variantes || producto.variantes.length <= 1);

        // Agregamos "!esDocenaCerrada" para que NO pise el texto de Pack Cerrado
        if (nombreVariante && !esModoNumeros && !esDocenaCerrada) {
          varianteSeleccionada = nombreVariante;
          const stampedDisplay = document.getElementById("stampedName");
          if (stampedDisplay) stampedDisplay.innerText = nombreVariante;
        }
        if (typeof actualizarGuia === "function") actualizarGuia();
      };

      wrapper.appendChild(thumb);

      if (nombreVariante && usaMultiThumbnails) {
        const counterDiv = document.createElement("div");
        counterDiv.className = "thumb-counter";
        counterDiv.dataset.variante = nombreVariante;

        const btnMenos = document.createElement("button");
        btnMenos.innerText = "-";
        const spanCant = document.createElement("span");
        spanCant.innerText = "0";
        spanCant.className = "cant-display";
        const btnMas = document.createElement("button");
        btnMas.innerText = "+";

        const actualizarValor = (cambio) => {
          if (
            producto.tallesDisponibles &&
            producto.tallesDisponibles.length > 0 &&
            !talleSeleccionado
          ) {
            mostrarAlertaPersonalizada(
              "Por favor, seleccioná un talle primero para ver la disponibilidad.",
            );
            return;
          }

          const key = `${talleSeleccionado || "unico"}_${nombreVariante}`;
          if (!seleccionesGlobales[key]) {
            seleccionesGlobales[key] = {
              talle: talleSeleccionado,
              variante: nombreVariante,
              cantidad: 0,
            };
          }

          let nuevaCant = seleccionesGlobales[key].cantidad + cambio;
          if (nuevaCant < 0) nuevaCant = 0;

          seleccionesGlobales[key].cantidad = nuevaCant;
          spanCant.innerText = nuevaCant;

          actualizarResumen(producto);
        };

        btnMenos.onclick = () => actualizarValor(-1);
        btnMas.onclick = () => actualizarValor(1);

        counterDiv.appendChild(btnMenos);
        counterDiv.appendChild(spanCant);
        counterDiv.appendChild(btnMas);
        wrapper.appendChild(counterDiv);
      }

      thumbBar.appendChild(wrapper);
    });
  }

  // 5. Detalles Técnicos
  const detailsGrid = document.getElementById("techDetails");
  detailsGrid.innerHTML = "";

  if (producto.detalles && producto.detalles.Tecnico) {
    const listaDetalles = producto.detalles.Tecnico.split(",");
    listaDetalles.forEach((item) => {
      if (item.includes(":")) {
        const [titulo, valor] = item.split(":");
        const div = document.createElement("div");
        div.className = "detail-item";
        div.innerHTML = `<strong>${titulo.trim()}:</strong> <br> <span>${valor.trim()}</span>`;
        detailsGrid.appendChild(div);
      }
    });
  }

  // 6. Variantes (Colores o Estampados)
  const variantSelector = document.getElementById("variantSelector");
  variantSelector.innerHTML = "";

  const divTalles = document.createElement("div");
  divTalles.id = "talleSelectorContainer";
  variantSelector.appendChild(divTalles);

  const divOpciones = document.createElement("div");
  divOpciones.id = "opcionesContainer";
  variantSelector.appendChild(divOpciones);

  renderSeccionTalles(divTalles, producto);

  const tipoLimpio = (producto.tipo || "").toString().trim().toLowerCase();

  // MAGIA DOCENA: Detectamos si es docena y si tiene 1 sola tanda/opción
  const esDocena = (producto.tipoPrecio || "").toLowerCase().includes("docena");
  const esDocenaCerrada =
    esDocena && (!producto.variantes || producto.variantes.length <= 1);

  // Si es Único, o si es una Docena de Pack Cerrado, bloqueamos las opciones
  if (tipoLimpio === "único" || tipoLimpio === "unico" || esDocenaCerrada) {
    divOpciones.style.display = "none";
    varianteSeleccionada = esDocenaCerrada
      ? "Pack Cerrado (Docena)"
      : "Único modelo";

    // Ocultamos cartelitos extra de estampado si quedaron sueltos
    const stampedLabelContainer = document.getElementById(
      "stampedLabelContainer",
    );
    if (stampedLabelContainer) stampedLabelContainer.style.display = "none";
  } else {
    // Si es docena pero cargaste varias opciones en Excel, funciona como siempre (eligen Tanda)
    if (tipoLimpio === "color") {
      renderSeccionColores(divOpciones, producto);
    } else {
      renderSeccionEstampados(divOpciones, producto);
    }
  }

  // 7. Lógica de Flechas Carrusel
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  function cambiarImagen(direccion) {
    usuarioYaInteractuo = true; // Frena la recarga fantasma
    const totalImg = producto.imagenes.length;
    const offset = producto.esEstampado === "NO" ? 1 : 0;

    // Evaluaciones
    const esModoNumeros =
      producto.variantes &&
      producto.variantes.length > 0 &&
      producto.variantes[0].nombre.length <= 2;
    const esDocena = (producto.tipoPrecio || "")
      .toLowerCase()
      .includes("docena");
    const esDocenaCerrada =
      esDocena && (!producto.variantes || producto.variantes.length <= 1);

    if (producto.tipo === "estampado" && talleSeleccionado) {
      let nuevoIndex = indexImagenPazBaires;
      const permitidos = producto.stockMapa[talleSeleccionado] || [];

      for (let i = 0; i < totalImg; i++) {
        nuevoIndex = (nuevoIndex + direccion + totalImg) % totalImg;
        if (offset === 1 && nuevoIndex === 0) break;

        const indiceVarianteReal = nuevoIndex - offset;
        const variante = producto.variantes[indiceVarianteReal];

        if (variante && permitidos.includes(variante.nombre)) {
          break;
        }
      }
      indexImagenPazBaires = nuevoIndex;
    } else {
      indexImagenPazBaires =
        (indexImagenPazBaires + direccion + totalImg) % totalImg;
    }

    const mainImg = document.getElementById("mainImg");
    mainImg.src = producto.imagenes[indexImagenPazBaires];

    document.querySelectorAll(".thumb").forEach((t, idx) => {
      t.classList.toggle("active", idx === indexImagenPazBaires);
    });

    // Bloqueamos que modifique el texto si es Modo Números o Docena Cerrada
    if (producto.tipo === "estampado" && !esModoNumeros && !esDocenaCerrada) {
      const stampedDisplay = document.getElementById("stampedName");
      if (producto.esEstampado === "NO" && indexImagenPazBaires === 0) {
        varianteSeleccionada = null;
        if (stampedDisplay) stampedDisplay.innerText = "No seleccionado";
      } else {
        const idxReal =
          indexImagenPazBaires - (producto.esEstampado === "NO" ? 1 : 0);
        varianteSeleccionada = producto.variantes[idxReal].nombre;
        if (stampedDisplay) stampedDisplay.innerText = varianteSeleccionada;
      }
    }

    // Siempre actualizamos la guía
    if (typeof actualizarGuia === "function") actualizarGuia();
  }

  prevBtn.onclick = () => cambiarImagen(-1);
  nextBtn.onclick = () => cambiarImagen(1);

  // 8. Lógica de Cantidad (Con validación de seguridad)
  const decreaseQty = document.getElementById("decreaseQty");
  const increaseQty = document.getElementById("increaseQty");
  const qtyInput = document.getElementById("itemQuantity");

  if (decreaseQty && increaseQty && qtyInput) {
    decreaseQty.onclick = () => {
      usuarioYaInteractuo = true;
      let current = parseInt(qtyInput.value);
      if (current > 1) {
        qtyInput.value = current - 1;
        actualizarGuia();
      }
    };

    increaseQty.onclick = () => {
      usuarioYaInteractuo = true;
      let current = parseInt(qtyInput.value);
      qtyInput.value = current + 1;
      actualizarGuia();
    };
  }

  if (typeof actualizarGuia === "function") {
    actualizarGuia();
  }

  // 9. Estado de Stock y Botón
  const btn = document.getElementById("btn-agregar");
  if (producto.estado === "Sin Stock") {
    if (btn) {
      btn.disabled = true;
      btn.innerText = "SIN STOCK";
      btn.style.background = "#555";
      btn.style.cursor = "not-allowed";
    }
  } else if (producto.estado === "Próximamente") {
    if (btn) {
      btn.disabled = true;
      btn.innerText = "NUEVO INGRESO";
      btn.style.background = "#a27ae3";
      btn.style.color = "white";
      btn.style.cursor = "wait";
    }
  }

  // 10. CONFIGURACIÓN BOTÓN WHATSAPP
  const btnWhatsapp = document.getElementById("btn-whatsapp");
  if (btnWhatsapp) {
    btnWhatsapp.onclick = () => {
      const urlActual = window.location.href;
      const numeroTelefono = "5491128506874";
      const mensaje = `${urlActual}\nHola! Te consulto por el producto ${producto.nombre} que vi en Paz Baires`;
      const urlWhatsapp = `https://wa.me/${numeroTelefono}?text=${encodeURIComponent(mensaje)}`;
      window.open(urlWhatsapp, "_blank");
    };
  }

  // AL FINALIZAR TODO, ACTIVAMOS EL ESCUDO:
  productoYaRenderizado = true;
}

function getVal(obj, posiblesNombres) {
  if (!obj) return 0;
  const keys = Object.keys(obj);
  for (let nombre of posiblesNombres) {
    const nombreLimpio = nombre.toLowerCase().replace(/[\s_-]/g, "");
    for (let k of keys) {
      if (k.toLowerCase().replace(/[\s_-]/g, "") === nombreLimpio) {
        let val = obj[k];
        if (val !== undefined && val !== null && val !== "") {
          if (typeof val === "number") return val;
          const num = Number(String(val).replace(/[^0-9.-]+/g, ""));
          if (!isNaN(num)) return num;
        }
      }
    }
  }
  return 0;
}

function renderizarPrecios(producto) {
  document
    .querySelectorAll(".price-case")
    .forEach((el) => (el.style.display = "none"));

  const tipo = (producto.tipoPrecio || "unico").toLowerCase().trim();
  const pReg = producto.precioRegular || 0;
  const pEsp = producto.precioEspecial || 0;

  if (tipo.includes("oferta")) {
    document.getElementById("priceCasoOferta").style.display = "block";
    document.getElementById("precioAnterior").innerText =
      `$ ${pReg.toLocaleString("es-AR")}`;
    document.getElementById("precioOferta").innerText =
      `$ ${pEsp.toLocaleString("es-AR")}`;
  } else if (
    tipo.includes("mayor") ||
    tipo.includes("pormayor") ||
    tipo.includes("mayorista")
  ) {
    document.getElementById("priceCasoMayorMenor").style.display = "block";
    document.getElementById("precioMinorista").innerText =
      `$ ${pReg.toLocaleString("es-AR")}`;
    document.getElementById("precioMayorista").innerText =
      `$ ${pEsp.toLocaleString("es-AR")}`;

    let aviso = document.getElementById("avisoMayorista");
    if (!aviso) {
      aviso = document.createElement("p");
      aviso.id = "avisoMayorista";
      aviso.style.margin = "20px 0";
      aviso.style.fontStyle = "italic";
      aviso.style.fontWeight = "bolder";
      aviso.innerHTML =
        "* El precio por mayor aplica llevando 3 o más artículos.";
      document.getElementById("priceCasoMayorMenor").appendChild(aviso);
    }
  } else if (tipo.includes("docena")) {
    document.getElementById("priceCasoDocena").style.display = "block";
    document.getElementById("precioDocena").innerText =
      `$ ${pEsp.toLocaleString("es-AR")}`;
  } else {
    document.getElementById("priceCasoUnico").style.display = "block";
    document.getElementById("precioUnico").innerText =
      `$ ${pReg.toLocaleString("es-AR")}`;
  }
}

function actualizarGuia() {
  const guia = document.getElementById("guia-seleccion");
  const cantidadInput = document.getElementById("itemQuantity");
  if (!guia || !cantidadInput) return;

  const cantidad = cantidadInput.value;

  // Detectamos si el producto actual es de tipo docena
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");
  const producto =
    typeof productos !== "undefined"
      ? productos.find((p) => p.id == productId)
      : null;
  const esDocena = producto
    ? (producto.tipoPrecio || "").toLowerCase().includes("docena")
    : false;

  let textoTalle = "";
  if (talleSeleccionado) {
    textoTalle = ` (Talle: <strong>${talleSeleccionado}</strong>)`;
  }

  if (!varianteSeleccionada) {
    if (parseInt(cantidad) > 1) {
      guia.innerHTML = `Elegí una opción para tus <strong>${cantidad}</strong> productos`;
    } else {
      guia.innerHTML = `Seleccioná una opción`;
    }
  } else {
    let textoVariante = varianteSeleccionada;

    if (
      varianteSeleccionada === "Único modelo" ||
      varianteSeleccionada === "Pack Cerrado (Docena)"
    ) {
      if (esDocena) {
        guia.innerHTML = `Llevás <strong>${cantidad}</strong> docena(s) de <strong>Pack Cerrado</strong>${textoTalle}`;
      } else {
        guia.innerHTML = `Llevás <strong>${cantidad}</strong> producto(s)${textoTalle}`;
      }
      guia.style.opacity = "1";
      return;
    }

    if (varianteSeleccionada.length <= 2) {
      textoVariante = `Estampado N° <strong>${varianteSeleccionada}</strong>`;
    } else {
      textoVariante = `<strong>${varianteSeleccionada}</strong>`;
    }

    // Texto adaptado si es docena o producto normal
    if (esDocena) {
      guia.innerHTML = `Seleccionaste <strong>${cantidad}</strong> docena(s) de la <strong>${textoVariante}</strong>${textoTalle}`;
    } else {
      guia.innerHTML = `Seleccionaste <strong>${cantidad}</strong> de ${textoVariante}${textoTalle}`;
    }
    guia.style.opacity = "1";
  }
}

function renderSeccionColores(container, prod) {
  const esMayor = (prod.tipoPrecio || "").toLowerCase().includes("mayor");
  const usaMulti = esMayor && prod.tipo === "color";

  if (usaMulti) {
    container.innerHTML = `
      <span class="selector-title">Seleccioná la <b>CANTIDAD</b> del <b>COLOR:</b></span>
      <div class="color-multi-grid"></div>
    `;
    const grid = container.querySelector(".color-multi-grid");

    prod.variantes.forEach((v) => {
      const esAgotado =
        v.disponible === false ||
        (v.nombre && v.nombre.toUpperCase().includes("SIN STOCK"));

      const card = document.createElement("div");
      card.className = `color-counter-card ${esAgotado ? "agotado" : ""}`;

      const infoDiv = document.createElement("div");
      infoDiv.className = "color-info-card";

      const dot = document.createElement("div");
      dot.className = `color-dot-small ${esAgotado ? "variante-agotada" : ""}`;
      dot.style.backgroundColor = v.valor;

      const nameSpan = document.createElement("span");
      nameSpan.innerText = v.nombre;

      infoDiv.appendChild(dot);
      infoDiv.appendChild(nameSpan);

      const counterDiv = document.createElement("div");
      counterDiv.className = "thumb-counter-color";

      const btnMenos = document.createElement("button");
      btnMenos.innerText = "-";
      const spanCant = document.createElement("span");
      spanCant.innerText = "0";
      spanCant.className = "cant-display";
      const btnMas = document.createElement("button");
      btnMas.innerText = "+";

      if (esAgotado) {
        btnMas.disabled = true;
        btnMenos.disabled = true;
      }

      const key = `unico_${v.nombre}`;
      if (seleccionesGlobales[key]) {
        spanCant.innerText = seleccionesGlobales[key].cantidad;
      }

      const actualizarValor = (cambio) => {
        if (esAgotado) return;
        if (
          prod.tallesDisponibles &&
          prod.tallesDisponibles.length > 0 &&
          !talleSeleccionado
        ) {
          mostrarAlertaPersonalizada(
            "Por favor, seleccioná un talle primero para ver la disponibilidad.",
          );
          return;
        }

        const currentKey = `${talleSeleccionado || "unico"}_${v.nombre}`;
        if (!seleccionesGlobales[currentKey]) {
          seleccionesGlobales[currentKey] = {
            talle: talleSeleccionado,
            variante: v.nombre,
            cantidad: 0,
          };
        }

        let nuevaCant = seleccionesGlobales[currentKey].cantidad + cambio;
        if (nuevaCant < 0) nuevaCant = 0;

        seleccionesGlobales[currentKey].cantidad = nuevaCant;
        spanCant.innerText = nuevaCant;

        actualizarResumen(prod);
      };

      btnMenos.onclick = () => actualizarValor(-1);
      btnMas.onclick = () => actualizarValor(1);

      counterDiv.appendChild(btnMenos);
      counterDiv.appendChild(spanCant);
      counterDiv.appendChild(btnMas);

      card.appendChild(infoDiv);
      card.appendChild(counterDiv);
      grid.appendChild(card);
    });
  } else {
    container.innerHTML = `
        <span class="selector-title">Elegí el color:</span>
        <div class="color-grid"></div>
        <p id="colorNameDisplay" style="font-size: 0.8rem; margin-top: 10px; opacity: 0.8"><i>Hacé click en un color</i></p>
    `;
    const grid = container.querySelector(".color-grid");
    prod.variantes.forEach((v) => {
      const esAgotado =
        v.disponible === false ||
        (v.nombre && v.nombre.toUpperCase().includes("SIN STOCK"));

      const dot = document.createElement("div");
      dot.className = "color-dot";
      dot.style.backgroundColor = v.valor;

      if (esAgotado) {
        dot.classList.add("variante-agotada");
      }

      if (varianteSeleccionada === v.nombre) dot.classList.add("active");

      dot.onclick = function () {
        if (v.disponible === false) return;

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

    if (varianteSeleccionada) {
      document.querySelector("#colorNameDisplay").innerHTML =
        `Seleccionado: <strong>${varianteSeleccionada}</strong>`;
    }
  }
}

function renderSeccionEstampados(container, prod) {
  const esMayor = (prod.tipoPrecio || "").toLowerCase().includes("mayor");
  const esModoNumeros =
    prod.variantes &&
    prod.variantes.length > 0 &&
    prod.variantes[0].nombre.length <= 2;
  const usaMulti = esMayor && esModoNumeros;

  const stampedLabelContainer = document.getElementById(
    "stampedLabelContainer",
  );
  const stampedDisplayMain = document.getElementById("stampedName");

  if (usaMulti) {
    if (stampedLabelContainer) stampedLabelContainer.style.display = "none";

    container.innerHTML = `
      <span class="selector-title">Seleccioná la <b>CANTIDAD</b> del <b>N° de ESTAMPADO:</b></span>
      <div class="estampado-multi-grid"></div>
    `;
    const grid = container.querySelector(".estampado-multi-grid");

    prod.variantes.forEach((v) => {
      const esAgotado =
        v.disponible === false ||
        (v.nombre && v.nombre.toUpperCase().includes("SIN STOCK"));

      const card = document.createElement("div");
      card.className = `estampado-counter-card ${esAgotado ? "agotado" : ""}`;

      const infoDiv = document.createElement("div");
      infoDiv.className = "estampado-info-card";

      const badge = document.createElement("div");
      badge.className = "estampado-badge";
      badge.innerText = v.nombre;

      infoDiv.appendChild(badge);

      const counterDiv = document.createElement("div");
      counterDiv.className = "thumb-counter";

      const btnMenos = document.createElement("button");
      btnMenos.innerText = "-";
      const spanCant = document.createElement("span");
      spanCant.innerText = "0";
      spanCant.className = "cant-display";
      const btnMas = document.createElement("button");
      btnMas.innerText = "+";

      if (esAgotado) {
        btnMas.disabled = true;
        btnMenos.disabled = true;
      }

      const key = `unico_${v.nombre}`;
      if (seleccionesGlobales[key]) {
        spanCant.innerText = seleccionesGlobales[key].cantidad;
      }

      const actualizarValor = (cambio) => {
        if (esAgotado) return;
        if (
          prod.tallesDisponibles &&
          prod.tallesDisponibles.length > 0 &&
          !talleSeleccionado
        ) {
          mostrarAlertaPersonalizada(
            "Por favor, seleccioná un talle primero para ver la disponibilidad.",
          );
          return;
        }

        const currentKey = `${talleSeleccionado || "unico"}_${v.nombre}`;
        if (!seleccionesGlobales[currentKey]) {
          seleccionesGlobales[currentKey] = {
            talle: talleSeleccionado,
            variante: v.nombre,
            cantidad: 0,
          };
        }

        let nuevaCant = seleccionesGlobales[currentKey].cantidad + cambio;
        if (nuevaCant < 0) nuevaCant = 0;

        seleccionesGlobales[currentKey].cantidad = nuevaCant;
        spanCant.innerText = nuevaCant;

        actualizarResumen(prod);
      };

      btnMenos.onclick = () => actualizarValor(-1);
      btnMas.onclick = () => actualizarValor(1);

      counterDiv.appendChild(btnMenos);
      counterDiv.appendChild(spanCant);
      counterDiv.appendChild(btnMas);

      card.appendChild(infoDiv);
      card.appendChild(counterDiv);
      grid.appendChild(card);
    });
  } else if (esModoNumeros) {
    if (stampedLabelContainer) stampedLabelContainer.style.display = "none";

    const nombreMostrar = varianteSeleccionada
      ? varianteSeleccionada
      : "No seleccionado";

    // CORRECCIÓN 1: Le ponemos id="stampedNameNumero" para que sea único
    container.innerHTML = `
      <div class="stamped-selected-text">
          Estampado N°: <strong id="stampedNameNumero">${nombreMostrar}</strong>
      </div>
      <span class="selector-title">Elegí el número:</span>
      <div class="talles-grid"></div> 
      <p class="guia-seleccion">Mirá los números en la foto y elegí el tuyo</p>
    `;

    const grid = container.querySelector(".talles-grid");
    prod.variantes.forEach((v) => {
      const dot = document.createElement("div");
      dot.className = "talle-dot";
      dot.innerText = v.nombre;
      if (varianteSeleccionada === v.nombre) dot.classList.add("active");

      dot.onclick = function () {
        usuarioYaInteractuo = true;
        grid
          .querySelectorAll(".talle-dot")
          .forEach((d) => d.classList.remove("active"));
        this.classList.add("active");
        varianteSeleccionada = v.nombre;

        // CORRECCIÓN 2: Le decimos a JavaScript que actualice el texto con el ID nuevo
        const stampedDisplay = document.getElementById("stampedNameNumero");
        if (stampedDisplay) stampedDisplay.innerText = v.nombre;

        if (typeof actualizarGuia === "function") actualizarGuia();
      };
      grid.appendChild(dot);
    });
  } else {
    const nombreMostrar = varianteSeleccionada
      ? varianteSeleccionada
      : "No seleccionado";

    // Detectamos si es docena para cambiar el texto de ayuda
    const esDocena = (prod.tipoPrecio || "").toLowerCase().includes("docena");
    const textoGuiaVisual = esDocena
      ? "<i>Seleccioná la docena o tanda que deseás haciendo click en las fotos de la galería.</i>"
      : "<i>Seleccioná el diseño haciendo click en las fotos de la galería.</i>";

    container.innerHTML = `
      <p class="guia-seleccion">
          ${textoGuiaVisual}
      </p>
    `;
    if (stampedLabelContainer) stampedLabelContainer.style.display = "block";
    if (stampedDisplayMain) stampedDisplayMain.innerText = nombreMostrar;
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

      document
        .querySelectorAll(".talle-dot")
        .forEach((d) => d.classList.remove("active"));
      this.classList.add("active");

      if (prod.tipo === "estampado" && varianteSeleccionada && prod.stockMapa) {
        const permitidos = prod.stockMapa[talleSeleccionado] || [];

        if (!permitidos.includes(varianteSeleccionada)) {
          varianteSeleccionada = null;
          const stampedDisplay = document.getElementById("stampedName");
          if (stampedDisplay) stampedDisplay.innerText = "No seleccionado";

          document
            .querySelectorAll(".thumb")
            .forEach((th) => th.classList.remove("active"));

          const mainImg = document.getElementById("mainImg");
          if (mainImg && prod.imagenes && prod.imagenes.length > 0) {
            mainImg.src = prod.imagenes[0];
            indexImagenPazBaires = 0;
          }
        }
      }

      actualizarGuia();

      if (prod.tipo === "estampado" && prod.stockMapa) {
        const permitidos = prod.stockMapa[talleSeleccionado] || [];
        const offset = prod.esEstampado === "NO" ? 1 : 0;

        document.querySelectorAll(".thumb").forEach((thumb, idx) => {
          if (offset === 1 && idx === 0) {
            thumb.style.opacity = "1";
            thumb.style.filter = "none";
            thumb.style.cursor = "pointer";
            return;
          }

          const indiceVarianteReal = idx - offset;
          const varianteActual = prod.variantes[indiceVarianteReal];

          if (varianteActual && permitidos.includes(varianteActual.nombre)) {
            thumb.style.opacity = "1";
            thumb.style.filter = "none";
            thumb.style.cursor = "pointer";
          } else {
            thumb.style.opacity = "0.3";
            thumb.style.filter = "grayscale(100%)";
            thumb.style.cursor = "not-allowed";
          }
        });
      }

      document.querySelectorAll(".thumb-wrapper").forEach((wrapper) => {
        const counterDiv = wrapper.querySelector(".thumb-counter");
        if (counterDiv) {
          const varNombre = counterDiv.dataset.variante;
          const key = `${talleSeleccionado}_${varNombre}`;
          const span = counterDiv.querySelector(".cant-display");
          if (seleccionesGlobales[key]) {
            span.innerText = seleccionesGlobales[key].cantidad;
          } else {
            span.innerText = "0";
          }

          const permitidos = prod.stockMapa[talleSeleccionado] || [];
          const btnMas = counterDiv.querySelectorAll("button")[1];
          if (!permitidos.includes(varNombre)) {
            btnMas.disabled = true;
          } else {
            btnMas.disabled = false;
          }
        }
      });
    };
    grid.appendChild(btn);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const botonAgregar = document.getElementById("btn-agregar");

  if (botonAgregar) {
    botonAgregar.onclick = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const productId = urlParams.get("id");
      const productoActual = productos.find((p) => p.id == productId);

      if (!productoActual) return;

      const esMayor = (productoActual.tipoPrecio || "")
        .toLowerCase()
        .includes("mayor");
      const usaMulti =
        esMayor &&
        (productoActual.tipo === "estampado" ||
          productoActual.tipo === "color");

      if (usaMulti) {
        let agregados = 0;
        for (let key in seleccionesGlobales) {
          const item = seleccionesGlobales[key];
          if (item.cantidad > 0) {
            agregarAlCarrito(
              productoActual,
              item.cantidad,
              item.variante,
              item.talle,
              true,
            );
            agregados++;
          }
        }

        if (agregados === 0) {
          mostrarAlertaPersonalizada(
            "No seleccionaste ningun estampado/color. Aumentá con los botones + debajo de las fotos.",
          );
          return;
        }

        setTimeout(() => {
          window.location.href = "carrito.html";
        }, 500);
      } else {
        const qtyInput = document.getElementById("itemQuantity");
        const cant = qtyInput ? parseInt(qtyInput.value) : 1;

        if (
          productoActual.tipo !== "único" &&
          productoActual.tipo !== "unico" &&
          !varianteSeleccionada
        ) {
          mostrarAlertaPersonalizada(
            "Por favor, seleccioná una opción antes de agregar al carrito.",
          );
          return;
        }

        if (
          productoActual.tallesDisponibles &&
          productoActual.tallesDisponibles.length > 0 &&
          !talleSeleccionado
        ) {
          mostrarAlertaPersonalizada(
            "Por favor, seleccioná un talle antes de agregar al carrito.",
          );
          return;
        }

        agregarAlCarrito(
          productoActual,
          cant,
          varianteSeleccionada,
          talleSeleccionado,
          false,
        );
      }
    };
  }
});

function agregarAlCarrito(
  producto,
  cantidad,
  varianteSeleccionada,
  talle,
  esMasivo = false,
) {
  let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

  const textoVariante = talle
    ? `${varianteSeleccionada} - Talle ${talle}`
    : varianteSeleccionada;

  const tipo = (producto.tipoPrecio || "unico").toLowerCase().trim();
  const pReg = producto.precioRegular || 0;
  const pEsp = producto.precioEspecial || 0;
  const cant = parseInt(cantidad);

  const existeIndex = carrito.findIndex(
    (item) => item.id === producto.id && item.variante === textoVariante,
  );

  if (existeIndex !== -1) {
    carrito[existeIndex].cantidad += cant;
  } else {
    carrito.push({
      id: producto.id,
      nombre: producto.nombre,
      precio: pReg,
      precioMinorista: pReg,
      precioMayorista: pEsp,
      tipoPrecio: tipo,
      imagen:
        producto.imagenes && producto.imagenes.length > 0
          ? producto.imagenes[0]
          : "default.jpg",
      variante: textoVariante,
      cantidad: cant,
      subtotal: 0,
    });
  }

  const cantidadTotalDelProducto = carrito
    .filter((item) => item.id === producto.id)
    .reduce((suma, item) => suma + item.cantidad, 0);

  carrito.forEach((item) => {
    if (item.id === producto.id) {
      if (
        item.tipoPrecio.includes("mayor") ||
        item.tipoPrecio.includes("mayorista")
      ) {
        item.precio =
          cantidadTotalDelProducto >= 3 && item.precioMayorista > 0
            ? item.precioMayorista
            : item.precioMinorista;
      } else if (
        item.tipoPrecio.includes("oferta") ||
        item.tipoPrecio.includes("docena")
      ) {
        item.precio = item.precioMayorista;
      } else {
        item.precio = item.precioMinorista;
      }
      item.subtotal = item.precio * item.cantidad;
    }
  });

  localStorage.setItem("carrito", JSON.stringify(carrito));
  if (!esMasivo) {
    window.location.href = "carrito.html";
  }
}
