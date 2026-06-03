const provincias = [
  "Buenos Aires",
  "CABA",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
];

let datosTemporalesCliente = null;

document.addEventListener("DOMContentLoaded", () => {
  // 1. Verificar Carrito
  const carritoCheck = JSON.parse(localStorage.getItem("carrito")) || [];
  if (carritoCheck.length === 0) {
    window.location.href = "tienda.html";
    return;
  }

  // 2. Verificar Elecciones de Envío
  const elecciones = JSON.parse(localStorage.getItem("eleccionesFinales"));
  if (!elecciones) {
    window.location.href = "carrito.html";
    return;
  }

  // 3. Renderizar el formulario correspondiente
  renderizarFormularioSegunEnvio(elecciones.metodoEnvio);

  // 4. Configurar eventos de botones
  const btnFinalizarForm = document.querySelector(".btn-finalizar-checkout");
  if (btnFinalizarForm) {
    btnFinalizarForm.addEventListener("click", validarYEnviar);
  }
});

function renderizarFormularioSegunEnvio(metodo) {
  const formContenedor = document.getElementById(
    "formulario-dinamico-contenedor",
  );
  const btnFinalizar = document.querySelector(".btn-finalizar-checkout");

  let htmlForm = "";

  if (metodo === "expreso") {
    htmlForm = `
            <div class="form-grid">
                <div class="input-group full-width"><label>NOMBRE Y APELLIDO</label><input type="text" id="f-nombre" placeholder="Nombre completo"></div>
                <div class="input-group"><label>CUIT / DNI</label><input type="text" id="f-cuit" placeholder="Ingrese CUIT o DNI"></div>
                <div class="input-group"><label>TELÉFONO (Whatsapp)</label><input type="tel" id="f-tel" placeholder="Ej: 11 2345 6789"></div>
                <div class="input-group full-width"><label>CORREO ELECTRÓNICO (OPCIONAL)</label><input type="email" id="f-email" placeholder="email@ejemplo.com"></div>
                <div class="input-group"><label>PROVINCIA</label><div class="select-custom-wrapper"><select id="f-provincia"></select></div></div>
                <div class="input-group"><label>LOCALIDAD</label><input type="text" id="f-localidad" placeholder="Localidad"></div>
                <div class="input-group"><label>CÓDIGO POSTAL</label><input type="text" id="f-cp" placeholder="CP"></div>
                <div class="input-group full-width"><label>DOMICILIO</label><input type="text" id="f-domicilio" placeholder="Calle y número"></div>
                <div class="input-group"><label>TRANSPORTE ELEGIDO</label><input type="text" id="f-transporte" placeholder="Ej: Vía Cargo, Andreani..."></div>
                <div class="input-group full-width"><label>ENTREGA</label><select id="f-entrega-tipo"><option value="sucursal">Retiro en Sucursal</option><option value="domicilio">Envío a Domicilio</option></select></div>
            </div>`;
  } else if (metodo === "moto") {
    htmlForm = `
            <div class="form-grid">
                <div class="input-group full-width"><label>NOMBRE Y APELLIDO</label><input type="text" id="f-nombre" placeholder="Nombre completo"></div>
                <div class="input-group"><label>TELÉFONO (Whatsapp)</label><input type="tel" id="f-tel" placeholder="Ej: 11 2345 6789"></div>
                <div class="input-group"><label>LOCALIDAD</label><input type="text" id="f-localidad" placeholder="Barrio / Localidad"></div>
                <div class="input-group"><label>CÓDIGO POSTAL</label><input type="text" id="f-cp" placeholder="CP"></div>
                <div class="input-group full-width"><label>DOMICILIO</label><input type="text" id="f-domicilio" placeholder="Calle y número"></div>
                <div class="input-group full-width"><label>CARACTERÍSTICAS DEL DOMICILIO</label><textarea id="f-obs" placeholder="Ej: Portón blanco, timbre que no anda, etc."></textarea></div>
            </div>`;
  } else if (metodo === "local") {
    htmlForm = `
            <div class="form-grid">
                <div class="input-group full-width"><label>NOMBRE Y APELLIDO</label><input type="text" id="f-nombre" placeholder="Nombre completo"></div>
                <div class="input-group"><label>TELÉFONO (Whatsapp)</label><input type="tel" id="f-tel" placeholder="Ej: 11 2345 6789"></div>
                <div class="input-group full-width"><label>¿QUIÉN RETIRA?</label><input type="text" id="f-retira" placeholder="Yo misma / Comisionista / Familiar"></div>
            </div>`;
  }

  formContenedor.innerHTML = htmlForm;
  btnFinalizar.style.display = "block";

  if (metodo === "expreso") cargarProvincias("f-provincia");
}

function cargarProvincias(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.innerHTML =
    '<option value="" disabled selected>Seleccione provincia</option>';
  provincias.forEach((prov) => {
    const opt = document.createElement("option");
    opt.value = prov;
    opt.textContent = prov;
    select.appendChild(opt);
  });
}

// --- NUEVA FUNCIÓN PARA EL EXCEL ---
async function registrarPedidoExcel(d, carrito, elecciones) {
  const API_URL =
    "https://script.google.com/macros/s/AKfycbxe7UPbvDRT2dcfxMdWfPo5MZikdGb4HWIP6l5rg0kaxftUgOUvrsmIe_MhDSDeeiFw/exec"; // Pegá aquí tu URL de implementación

  console.log("Intentando enviar a Excel...", d); // Ver si los datos están listos

  // 1. Calculamos el total
  const total = carrito.reduce((acc, item) => acc + item.subtotal, 0);

  // 2. Preparamos el detalle de productos con el separador |
  const detalleProductos = carrito
    .map((i) => `${i.cantidad}x ${i.nombre} (${i.variante})`)
    .join(" | ");

  // 3. Preparamos el objeto para el Excel (nombres coinciden con tu doPost)
  const datosVenta = {
    cliente: d.nombre,
    telefono: d.tel,
    envio: d.metodo,
    pago: elecciones.metodoPago || "No especificado",
    productos: detalleProductos,
    total: total,
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      mode: "no-cors", // Con no-cors no podemos leer la respuesta, pero el envío sale
      body: JSON.stringify(datosVenta),
    });
    console.log("Petición enviada al servidor de Google");
  } catch (error) {
    console.error("Error en el fetch:", error);
  }
}

async function validarYEnviar(e) {
  e.preventDefault();

  // 1. CAPTURAMOS EL BOTÓN AQUÍ MISMO (Para evitar el ReferenceError)
  const btnFinalizar = e.currentTarget;
  // e.currentTarget es el botón que disparó el evento, ¡es lo más seguro!

  const elecciones = JSON.parse(localStorage.getItem("eleccionesFinales"));
  const m = elecciones.metodoEnvio;

  // Captura común
  const nombre = document.getElementById("f-nombre")?.value.trim();
  const tel = document.getElementById("f-tel")?.value.trim();

  // Validaciones según método
  if (!nombre || !tel) return alert("❌ Completa nombre y teléfono");

  datosTemporalesCliente = { nombre, tel, metodo: m };

  if (m === "expreso") {
    const cuit = document.getElementById("f-cuit").value.trim();
    const prov = document.getElementById("f-provincia").value;
    const loc = document.getElementById("f-localidad").value.trim();
    const dom = document.getElementById("f-domicilio").value.trim();
    const cp = document.getElementById("f-cp").value.trim();
    const trans = document.getElementById("f-transporte").value.trim();
    const entrega = document.getElementById("f-entrega-tipo").value;
    const email = document.getElementById("f-email").value.trim();

    if (!cuit || !prov || !loc || !dom || !cp || !trans)
      return alert("❌ Completa todos los datos de envío");
    Object.assign(datosTemporalesCliente, {
      cuit,
      prov,
      loc,
      dom,
      cp,
      trans,
      entrega,
      email,
    });
  } else if (m === "moto") {
    const loc = document.getElementById("f-localidad").value.trim();
    const dom = document.getElementById("f-domicilio").value.trim();
    const cp = document.getElementById("f-cp").value.trim();
    const obs = document.getElementById("f-obs").value.trim();
    if (!loc || !dom || !cp) return alert("❌ Completa los datos de entrega");
    Object.assign(datosTemporalesCliente, { loc, dom, cp, obs, prov: "CABA" });
  } else if (m === "local") {
    const retira = document.getElementById("f-retira").value.trim();
    if (!retira) return alert("❌ Indica quién retira el pedido");
    Object.assign(datosTemporalesCliente, { retira });
  }

  // 2. EFECTO VISUAL DE CARGA
  btnFinalizar.disabled = true;
  btnFinalizar.innerHTML = `⏳ Guardando pedido...`; // Esto le da tiempo al sistema
  // --- INTEGRACIÓN FINAL ---
  const carrito = JSON.parse(localStorage.getItem("carrito")) || [];

  try {
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const elecciones = JSON.parse(localStorage.getItem("eleccionesFinales"));

    // EL AWAIT ES OBLIGATORIO AQUÍ
    await registrarPedidoExcel(datosTemporalesCliente, carrito, elecciones);

    btnFinalizar.innerHTML = "✅ ¡Abriendo WhatsApp!";

    // Disparamos WhatsApp
    enviarPedidoWhatsApp(datosTemporalesCliente);
  } catch (error) {
    console.error("Error al guardar:", error);
    // Si falla el Excel, igual abrimos WhatsApp para no perder la venta
    enviarPedidoWhatsApp(datosTemporalesCliente);
  }
}

function enviarPedidoWhatsApp(d) {
  const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  const elecciones =
    JSON.parse(localStorage.getItem("eleccionesFinales")) || {};

  // 1. Cabecera y Datos Comunes
  let mensaje = `*PEDIDO NUEVO - PAZ BAIRES*%0A%0A`;
  mensaje += `*👤 CLIENTE:* ${d.nombre}%0A`;
  mensaje += `*📞 TEL:* ${d.tel}%0A`;

  // 2. Datos específicos según el tipo de envío
  if (d.metodo === "expreso") {
    mensaje += `%0A*- TRANSPORTE O EXPRESO*%0A`;
    mensaje += `*🆔 CUIT/DNI:* ${d.cuit}%0A`;
    mensaje += `*📧 EMAIL:* ${d.email || "No proporcionado"}%0A`;
    mensaje += `*📍 PROVINCIA:* ${d.prov}%0A`;
    mensaje += `*🏙️ LOCALIDAD:* ${d.loc}%0A`;
    mensaje += `*📮 CP:* ${d.cp}%0A`;
    mensaje += `*🏠 DOMICILIO:* ${d.dom}%0A`;
    mensaje += `*🚛 TRANSPORTE:* ${d.trans}%0A`;
    mensaje += `*📦 ENTREGA:* ${d.entrega.toUpperCase()}%0A`;
  } else if (d.metodo === "moto") {
    mensaje += `%0A*- ENVÍO MOTO (CABA)*%0A`;
    mensaje += `*📍 DIRECCIÓN:* ${d.dom}%0A`;
    mensaje += `*🏘️ LOCALIDAD:* ${d.loc}%0A`;
    mensaje += `*📮 CP:* ${d.cp}%0A`;
    mensaje += `*📝 OBS:* ${d.obs || "-"}%0A`;
  } else if (d.metodo === "local") {
    mensaje += `%0A*- RETIRO EN LOCAL*%0A`;
    mensaje += `*👤 QUIÉN RETIRA:* ${d.retira}%0A`;
  }

  // 3. Método de Pago
  if (elecciones.metodoPago) {
    mensaje += `%0A*💳 PAGO:* ${elecciones.metodoPago}%0A`;
  }

  // 4. Detalle de Productos
  mensaje += `%0A*🛍️ PRODUCTOS:*%0A`;
  let totalBase = 0;
  carrito.forEach((i) => {
    mensaje += `- ${i.cantidad}x ${i.nombre} (${i.variante}) - $${i.subtotal.toLocaleString()}%0A`;
    totalBase += i.subtotal;
  });

  // --- 5. CIERRE CON TOTAL (Limpio) ---
  mensaje += `%0A💰 *TOTAL A PAGAR: $${totalBase.toLocaleString()}*%0A`;
  mensaje += `--------------------------%0A`;
  mensaje += `_Pedido generado desde la Tienda Online_`;

  // 1. Limpiamos el carrito (fundamental hacerlo antes)
  localStorage.removeItem("carrito");
  localStorage.removeItem("eleccionesFinales");

  const url = `https://api.whatsapp.com/send?phone=541128506874&text=${mensaje}`;

  // --- 2. EL TRUCO DE VISIBILIDAD ---
  let saltoAWhatsApp = false;

  // Creamos un "vigilante" que mira si la pestaña se oculta
  const vigilarPestana = () => {
    if (document.hidden) {
      saltoAWhatsApp = true; // Confirmamos que el cliente se fue de la pantalla

      // Como ya se fue a WhatsApp, limpiamos la casa y volvemos al inicio
      // para que no quede la pantalla de carga colgada.
      setTimeout(() => {
        window.location.href = "index.html";
      }, 500);

      // Apagamos el vigilante para que no consuma memoria
      document.removeEventListener("visibilitychange", vigilarPestana);
    }
  };

  // Activamos el vigilante justo antes de intentar abrir WhatsApp
  document.addEventListener("visibilitychange", vigilarPestana);

  // 3. Intentamos abrir WhatsApp INMEDIATAMENTE
  const win = window.open(url, "_blank");
  if (!win) {
    // Si la ventana emergente fue bloqueada, intentamos en la misma pestaña
    window.location.href = url;
  }

  // 4. LA ESPERA INTELIGENTE (3 segundos)
  setTimeout(() => {
    // Si pasaron 3 segundos y el vigilante dice que el cliente SIGUE en la pantalla...
    // ¡Significa que falló! Mostramos el cartel de rescate.
    if (!saltoAWhatsApp) {
      document.body.innerHTML = `
        <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 30px; text-align: center; font-family: sans-serif; background-color: #f9f9f9;">
          <h2 style="color: #d9534f; font-size: 24px; margin-bottom: 10px;">🚨 ¡Último paso!</h2>
          <p style="font-size: 18px; color: #333; margin-bottom: 20px;">
            Tu pedido está registrado, pero <strong>NO ESTÁ CONFIRMADO</strong> hasta que nos envíes el mensaje por WhatsApp.
          </p>
          <p style="font-size: 16px; color: #666; margin-bottom: 30px;">
            Si la aplicación no se abrió automáticamente, tocá el botón de abajo:
          </p>
          
          <a href="${url}" style="background-color: #25D366; color: white; padding: 18px 30px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            📲 ENVIAR PEDIDO AHORA
          </a>

          <a href="index.html" style="margin-top: 40px; color: #888; text-decoration: underline; font-size: 14px;">
            Volver a la tienda (Cancelar pedido)
          </a>
        </div>
      `;
    }
  }, 3000);
}
