// REEMPLAZAR POR LA URL DE TU MACRO DE GOOGLE SHEETS
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycby7NDP6_vUlAxOvigaqaEZs2RdpKhAGxIH5YFaUG4iMzBSJamybsaeMLzqwhBs1bOA1iw/exec";

let montoTotalFinal = 0;

document.addEventListener("DOMContentLoaded", () => {
  renderizarCarrito();
  actualizarContadorCarrito(); // Llamamos al contador al iniciar

  // 1. FORZAMOS LA LIMPIEZA DE LOS MÉTODOS DE ENVÍO Y PAGO PARA QUE ARRANQUEN VACÍOS
  document.querySelectorAll('input[type="radio"]').forEach((radio) => {
    radio.checked = false;
  });
  document.querySelectorAll(".option-card").forEach((card) => {
    card.classList.remove("active");
  });

  const btnFinalizar = document.getElementById("btn-finalizar-compra");
  if (btnFinalizar) {
    btnFinalizar.addEventListener("click", procesarCompra);
  }

  const radios = document.querySelectorAll('input[type="radio"]');
  radios.forEach((radio) => {
    radio.addEventListener("change", function () {
      let name = this.name;
      document.querySelectorAll(`input[name="${name}"]`).forEach((r) => {
        r.closest(".option-card").classList.remove("active");
      });
      if (this.checked) {
        this.closest(".option-card").classList.add("active");
      }
    });
  });
});

// --- SOLUCIÓN AL BFCACHE (Botón "Atrás" del navegador) ---
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    const btn = document.getElementById("btn-finalizar-compra");
    if (btn) {
      btn.innerHTML = `<img src="images/whatsapp-icon.webp" alt="" loading="lazy" decoding="async" /> FINALIZAR COMPRA Y ENVIAR`;
      btn.disabled = false;
    }
    renderizarCarrito();
    actualizarContadorCarrito();
  }
});

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

function parsearPrecio(valor) {
  if (!valor && valor !== 0) return 0;
  if (typeof valor === "number") return valor;
  let str = valor
    .toString()
    .replace(/\$/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".")
    .trim();
  return parseFloat(str) || 0;
}

function renderizarCarrito() {
  const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  const productosBD =
    JSON.parse(localStorage.getItem("productos_cache")) ||
    window.productos ||
    [];
  const contenedor = document.getElementById("carrito-body");
  const wrapper = document.querySelector(".carrito-wrapper");

  if (carrito.length === 0) {
    if (wrapper) {
      wrapper.innerHTML = `
                <div class="carrito-vacio-msj" style="text-align: center; width: 100%; padding: 50px 20px; color: white;">
                    <h2>Tu carrito está vacío</h2>
                    <p>¡Parece que aún no has elegido nada!</p>
                    <a href="tienda.html" class="btn-volver">IR A LA TIENDA</a>
                </div>
            `;
    }
    return;
  }

  if (contenedor) contenedor.innerHTML = "";

  const conteoUnidadesPorProd = {};
  carrito.forEach((item) => {
    const idProd = String(item.id || item.nombre);
    conteoUnidadesPorProd[idProd] =
      (conteoUnidadesPorProd[idProd] || 0) +
      (parsearPrecio(item.cantidad) || 1);
  });

  let totalOriginal = 0;
  let totalConDescuentos = 0;

  carrito.forEach((item, index) => {
    const prodBD =
      productosBD.find(
        (p) => String(p.id) === String(item.id) || p.nombre === item.nombre,
      ) || {};

    // ESCUDO: Si el producto ya no existe en la base de datos (fue ocultado), lo saltamos para que no dibuje nada falso
    if (!prodBD.id) {
      return;
    }

    const tipoPrecioRaw = String(
      item.tipoPrecio || prodBD.tipoPrecio || "unico",
    )
      .toLowerCase()
      .trim();
    const precioRegular = parsearPrecio(
      item.precioRegular !== undefined
        ? item.precioRegular
        : prodBD.precioRegular,
    );
    const precioEspecial = parsearPrecio(
      item.precioEspecial !== undefined
        ? item.precioEspecial
        : prodBD.precioEspecial,
    );

    const idProd = String(item.id || item.nombre);
    const unidadesAcumuladas =
      conteoUnidadesPorProd[idProd] || parsearPrecio(item.cantidad);
    const cantidadItem = parsearPrecio(item.cantidad) || 1;

    let precioAplicado = precioRegular;
    let precioBaseComparacion = precioRegular;
    let tipoDescuentoText = "Precio Único";
    let claseBadge = "badge-minorista";

    if (tipoPrecioRaw.includes("mayor")) {
      if (unidadesAcumuladas >= 3 && precioEspecial > 0) {
        precioAplicado = precioEspecial;
        precioBaseComparacion =
          precioRegular > 0 ? precioRegular : precioEspecial;
        tipoDescuentoText = "Precio x Mayor";
        claseBadge = "badge-mayor";
      } else {
        precioAplicado = precioRegular > 0 ? precioRegular : precioEspecial;
        precioBaseComparacion = precioAplicado;
        tipoDescuentoText = "Precio Minorista";
        claseBadge = "badge-minorista";
      }
    } else if (tipoPrecioRaw.includes("oferta")) {
      precioAplicado = precioEspecial > 0 ? precioEspecial : precioRegular;
      precioBaseComparacion =
        precioRegular > precioAplicado ? precioRegular : precioAplicado;
      tipoDescuentoText = "¡Oferta!";
      claseBadge = "badge-oferta";
    } else if (tipoPrecioRaw.includes("docena")) {
      precioAplicado = precioEspecial > 0 ? precioEspecial : precioRegular;
      precioBaseComparacion =
        precioRegular > precioAplicado ? precioRegular : precioAplicado;
      tipoDescuentoText = "Precio Docena";
      claseBadge = "badge-docena";
    } else {
      precioAplicado = precioRegular > 0 ? precioRegular : precioEspecial;
      precioBaseComparacion = precioAplicado;
    }

    let subtotalFila;

    if (item.esPack) {
      subtotalFila = item.precioPack * item.cantidad;
    } else {
      subtotalFila = precioAplicado * cantidadItem;
    }

    totalConDescuentos += subtotalFila;
    totalOriginal += precioBaseComparacion * cantidadItem;
    item.precioCobrado = precioAplicado;

    if (item.esPack) {
      precioAplicado = item.precioPack;
      precioBaseComparacion = item.precioPack;
      tipoDescuentoText = `Pack x${item.cantidadPack}`;
      claseBadge = "badge-docena";
    }

    let precioHtml =
      precioBaseComparacion > precioAplicado
        ? `<span class="precio-viejo">$ ${precioBaseComparacion.toLocaleString("es-AR")}</span>
             <span class="precio-nuevo">$ ${precioAplicado.toLocaleString("es-AR")}</span>`
        : `<span class="precio-nuevo">$ ${precioAplicado.toLocaleString("es-AR")}</span>`;

    let imagenAMostrar =
      prodBD.imagenes && prodBD.imagenes.length > 0
        ? prodBD.imagenes[0]
        : "images/ejemplo-producto.jpg";

    let htmlVariante = "";

    const esPackCerrado =
      !item.esPack &&
      (tipoPrecioRaw.includes("pack") || tipoPrecioRaw.includes("docena")) &&
      (!prodBD.variantes || prodBD.variantes.length <= 1);

    if (item.esPack) {
      htmlVariante = `
        <p class="variante-tag"><b>Pack surtido x${item.cantidadPack}</b></p>
        <div class="pack-desglose">
          ${item.selecciones
            .map(
              (s) =>
                `<div>${s.cantidad}x ${s.variante}${s.talle ? ` - Talle ${s.talle}` : ""}</div>`,
            )
            .join("")}
        </div>
      `;
    } else if (esPackCerrado) {
      htmlVariante = `<p class="variante-tag">Presentación: <b>Pack cerrado x${prodBD.cantidadPack || 12}</b></p>`;
    } else {
      htmlVariante = `<p class="variante-tag">Variante: <b>${item.variante || "Única"}</b></p>`;
    }

    if (contenedor) {
      contenedor.innerHTML += `
                <tr class="carrito-item">
                    <td class="prod-detalles">
                        <a href="info-producto.html?id=${item.id}" style="text-decoration:none; color:inherit; display:flex; align-items:center; gap:15px;">
                            <img src="${imagenAMostrar}" alt="${item.nombre}" loading="lazy" decoding="async" >
                            <div class="info-texto">
                                <p><b><i>${item.nombre}</i></b></p>
                                ${htmlVariante}
                                <span class="badge-precio ${claseBadge}">${tipoDescuentoText}</span>
                            </div>
                        </a>
                    </td>
                    <td class="prod-precio">${precioHtml}</td>
                    <td class="prod-qty">
                      ${
                        item.esPack
                          ? `
                          <div class="qty-selector">
                              <button onclick="cambiarCantidad(${index}, -1)">-</button>
                              <input type="number" value="${cantidadItem}" readonly>
                              <button onclick="cambiarCantidad(${index}, 1)">+</button>
                          </div>
                        `
                          : `
                          <div class="qty-selector">
                              <button onclick="cambiarCantidad(${index}, -1)">-</button>
                              <input type="number" value="${cantidadItem}" readonly>
                              <button onclick="cambiarCantidad(${index}, 1)">+</button>
                          </div>
                        `
                      }
                    </td>
                    <td class="prod-subtotal"><strong>$ ${subtotalFila.toLocaleString("es-AR")}</strong></td>
                    <td class="prod-remove">
                        <button class="btn-remove" onclick="eliminarDelCarrito(${index})">×</button>
                    </td>
                </tr>
            `;
    }
  });

  montoTotalFinal = totalConDescuentos;
  const ahorroTotal = totalOriginal - totalConDescuentos;

  const desgloseBox = document.getElementById("desglose-box");
  if (desgloseBox) {
    if (ahorroTotal > 0) {
      desgloseBox.style.display = "block";
      desgloseBox.innerHTML = `
                <div class="desglose-linea">
                    <span>Subtotal (Sin desc.):</span>
                    <span>$ ${totalOriginal.toLocaleString("es-AR")}</span>
                </div>
                <div class="desglose-linea ahorro">
                    <span>¡Ahorrás en esta compra!:</span>
                    <span>- $ ${ahorroTotal.toLocaleString("es-AR")}</span>
                </div>
            `;
    } else {
      desgloseBox.style.display = "none";
    }
  }

  const elemTotalGeneral = document.getElementById("total-general");
  if (elemTotalGeneral) {
    elemTotalGeneral.textContent = `$ ${montoTotalFinal.toLocaleString("es-AR")}`;
  }
}

function cambiarCantidad(index, cambio) {
  let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  if (!carrito[index]) return;
  carrito[index].cantidad =
    (parsearPrecio(carrito[index].cantidad) || 1) + cambio;
  if (carrito[index].cantidad <= 0) carrito.splice(index, 1);
  localStorage.setItem("carrito", JSON.stringify(carrito));
  renderizarCarrito();
  actualizarContadorCarrito(); // Llamar al contador al cambiar cantidad
}

function eliminarDelCarrito(index) {
  let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  carrito.splice(index, 1);
  localStorage.setItem("carrito", JSON.stringify(carrito));
  renderizarCarrito();
  actualizarContadorCarrito(); // Llamar al contador al eliminar
}

async function procesarCompra() {
  const nombre = document.getElementById("f-nombre")
    ? document.getElementById("f-nombre").value.trim()
    : "";
  const telefono = document.getElementById("f-tel")
    ? document.getElementById("f-tel").value.trim()
    : "";
  const envio = document.querySelector('input[name="envio"]:checked');
  const pago = document.querySelector('input[name="pago"]:checked');

  if (!nombre || !telefono) {
    mostrarAlertaPersonalizada(
      "Por favor, ingresá tu Nombre y tu número de WhatsApp para poder contactarte.",
    );
    return;
  }

  if (!envio || !pago) {
    mostrarAlertaPersonalizada(
      "Por favor, seleccioná un método de envío y de pago para continuar.",
    );
    return;
  }

  if (envio.value === "expreso" && montoTotalFinal < 70000) {
    mostrarAlertaPersonalizada(
      `Para seleccionar el envío por "Transporte o expreso", la compra mínima es de <b>$70.000</b>.<br><br>Tu total actual es de $${montoTotalFinal.toLocaleString("es-AR")}.`,
    );
    return;
  }

  const btn = document.getElementById("btn-finalizar-compra");
  if (btn) {
    btn.innerHTML = "PROCESANDO...";
    btn.disabled = true;
  }

  const carrito = JSON.parse(localStorage.getItem("carrito")) || [];

  // SALTOS DE LÍNEA Y SANGRÍA PARA EL EXCEL
  const stringProductos = carrito
    .map((item) => {
      if (item.esPack) {
        // Armamos el detalle del pack con un salto de línea por cada variante y espacios de sangría
        const detallePack = item.selecciones
          .map(
            (s) =>
              `      ↳ ${s.cantidad}x ${s.variante}${s.talle ? ` (T: ${s.talle})` : ""}`,
          )
          .join("\n");

        // El nombre del pack va en la primera línea, y abajo sus detalles
        return `${item.cantidad}x PACK ${item.nombre} ($${item.precioPack}):\n${detallePack}`;
      } else {
        // Producto normal (le sumamos la validación del talle por si existe)
        const textoTalle = item.talle ? ` - Talle ${item.talle}` : "";
        return `${item.cantidad}x ${item.nombre} - ${item.variante || "Única"}${textoTalle} ($${item.precioCobrado || item.precio})`;
      }
    })
    .join("\n\n"); // \n\n crea una línea en blanco entre producto y producto para mayor claridad

  const payload = {
    cliente: nombre,
    telefono: telefono,
    envio: envio.value,
    pago: pago.value,
    productos: stringProductos,
    total: montoTotalFinal,
  };

  const metodoEnvioTxt = envio
    .closest(".option-card")
    .querySelector("p b, strong").innerText;
  const metodoPagoTxt = pago
    .closest(".option-card")
    .querySelector("p b, strong").innerText;

  // --- MENSAJE LIMPIO ---
  let msjWA = `Hola Paz Baires! Mi nombre es *${nombre}*.\n`;
  msjWA += `Acabo de realizar un pedido en la web.\n\n`;
  msjWA += `*MI PEDIDO*\n\n`;

  carrito.forEach((item) => {
    if (item.esPack) {
      msjWA += `• *${item.nombre}* — Pack x${item.cantidadPack} — *$${(item.precioPack * item.cantidad).toLocaleString("es-AR")}*\n`;

      item.selecciones.forEach((s) => {
        msjWA += `    - ${s.cantidad}x ${s.variante}${s.talle ? ` - Talle ${s.talle}` : ""}\n`;
      });

      msjWA += `\n`;
    } else {
      const sub = (item.precioCobrado || item.precio) * item.cantidad;
      msjWA += `• *${item.nombre}* (${item.variante || "Única"}) — ${item.cantidad}x — *$${sub.toLocaleString("es-AR")}*\n\n`;
    }
  });

  msjWA += `Envío: *${metodoEnvioTxt}*\n`;
  msjWA += `Pago: *${metodoPagoTxt}*\n\n`;
  msjWA += `*TOTAL A PAGAR: $${montoTotalFinal.toLocaleString("es-AR")}*\n\n`;
  msjWA += `Quedo a la espera para coordinar. ¡Gracias!`;

  localStorage.removeItem("carrito");
  if (typeof actualizarContadorCarrito === "function")
    actualizarContadorCarrito();

  try {
    if (GOOGLE_SCRIPT_URL) {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
  } catch (error) {
    console.error("Error silencioso al intentar guardar en Excel:", error);
  }

  const telPazBaires = "5491128506874";
  const urlWhatsApp = `https://wa.me/${telPazBaires}?text=${encodeURIComponent(msjWA)}`;
  window.location.href = urlWhatsApp;
}

// --- FUNCIÓN DEL CONTADOR GLOBAL ---
function actualizarContadorCarrito() {
  const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  // Sumamos la cantidad de unidades de todos los productos
  const totalItems = carrito.reduce(
    (acc, item) => acc + (parseInt(item.cantidad) || 1),
    0,
  );

  // Actualizamos todos los elementos HTML que tengan la clase 'contador-carrito'
  document.querySelectorAll(".contador-carrito").forEach((badge) => {
    badge.textContent = totalItems;
    badge.style.display = totalItems > 0 ? "flex" : "none"; // Lo oculta si está en 0
  });
}

// Ejecutar al cargar la página dándole un respiro a componentes.js
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(actualizarContadorCarrito, 500);
});
