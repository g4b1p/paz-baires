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
                <div class="input-group"><label>TELÉFONO</label><input type="tel" id="f-tel" placeholder="Número de contacto"></div>
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
                <div class="input-group"><label>TELÉFONO</label><input type="tel" id="f-tel" placeholder="Número de contacto"></div>
                <div class="input-group"><label>LOCALIDAD</label><input type="text" id="f-localidad" placeholder="Barrio / Localidad"></div>
                <div class="input-group"><label>CÓDIGO POSTAL</label><input type="text" id="f-cp" placeholder="CP"></div>
                <div class="input-group full-width"><label>DOMICILIO</label><input type="text" id="f-domicilio" placeholder="Calle y número"></div>
                <div class="input-group full-width"><label>CARACTERÍSTICAS DEL DOMICILIO</label><textarea id="f-obs" placeholder="Ej: Portón blanco, timbre que no anda, etc."></textarea></div>
            </div>`;
  } else if (metodo === "local") {
    htmlForm = `
            <div class="form-grid">
                <div class="input-group full-width"><label>NOMBRE Y APELLIDO</label><input type="text" id="f-nombre" placeholder="Nombre completo"></div>
                <div class="input-group"><label>TELÉFONO</label><input type="tel" id="f-tel" placeholder="Número de contacto"></div>
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

function validarYEnviar(e) {
  e.preventDefault();
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

  enviarPedidoWhatsApp(datosTemporalesCliente);
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

  // 3. Método de Pago (viene del carrito)
  if (elecciones.metodoPago) {
    mensaje += `%0A*💳 PAGO:* ${elecciones.metodoPago}%0A`;
  }

  // 4. Detalle de Productos
  mensaje += `%0A*🛍️ PRODUCTOS:*%0A`;
  let total = 0;
  carrito.forEach((i) => {
    mensaje += `- ${i.cantidad}x ${i.nombre} (${i.variante}) - $${i.subtotal.toLocaleString()}%0A`;
    total += i.subtotal;
  });

  // 5. Cierre con Total
  mensaje += `%0A💰 *TOTAL A PAGAR: $${total.toLocaleString()}*%0A%0A`;
  mensaje += `_Pedido generado desde la Tienda Online_`;

  // Reemplazá con tu número real
  const url = `https://api.whatsapp.com/send?phone=541128506874&text=${mensaje}`;

  window.open(url, "_blank");
}
