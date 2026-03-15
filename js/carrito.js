document.addEventListener("DOMContentLoaded", () => {
  renderizarCarrito();

  // Escuchar el clic en el botón finalizar dentro del carrito
  const btnIrAPagar = document.querySelector(".btn-finalizar");
  if (btnIrAPagar) {
    btnIrAPagar.addEventListener("click", guardarPreferenciasYContinuar);
  }
});

function guardarPreferenciasYContinuar() {
  // 1. Obtener qué radio buttons están seleccionados
  const envioSeleccionado = document.querySelector(
    'input[name="envio"]:checked',
  );
  const pagoSeleccionado = document.querySelector('input[name="pago"]:checked');

  // 2. Validar que ambos estén elegidos
  if (!envioSeleccionado || !pagoSeleccionado) {
    alert("❌ Por favor, selecciona un método de envío y de pago.");
    return;
  }

  // 3. Guardar con los nombres exactos que espera form-cliente.js
  const elecciones = {
    // Usamos .value para obtener "expreso", "moto" o "local"
    metodoEnvio: envioSeleccionado.value,
    // Usamos el texto del strong para el mensaje de WhatsApp
    metodoPago:
      pagoSeleccionado.parentElement.querySelector("strong").innerText,
  };

  // IMPORTANTE: Guardar como 'eleccionesFinales'
  localStorage.setItem("eleccionesFinales", JSON.stringify(elecciones));

  // 4. Redirigir al formulario
  window.location.href = "form-cliente.html";
}

function renderizarCarrito() {
  const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  const contenedor = document.getElementById("carrito-body"); // El tbody de tu tabla
  const wrapper = document.querySelector(".carrito-wrapper"); // El contenedor principal

  // SI EL CARRITO ESTÁ VACÍO
  if (carrito.length === 0) {
    // Reemplazamos todo el contenido por el mensaje de vacío
    wrapper.innerHTML = `
            <div class="carrito-vacio-msj" style="text-align: center; width: 100%; padding: 100px 20px;">
                <h2 style="color: white; margin-bottom: 20px;">Tu carrito está vacío</h2>
                <p style="color: rgba(255,255,255,0.8); margin-bottom: 30px;">¡Parece que aún no has elegido nada!</p>
                <a href="tienda.html" class="btn-finalizar-carrito-vacio" style="text-decoration: none; display: inline-block; width: auto; padding: 15px 40px;">
                    IR A LA TIENDA
                </a>
            </div>
        `;
    return;
  }

  // SI TIENE PRODUCTOS
  contenedor.innerHTML = ""; // Limpiamos tabla
  let totalGeneral = 0;

  carrito.forEach((item, index) => {
    totalGeneral += item.subtotal;

    contenedor.innerHTML += `
            <tr class="carrito-item">
                <td class="prod-detalles">
                    <img src="${item.imagen}" alt="${item.nombre}">
                    <div class="info-texto">
                        <h3>${item.nombre}</h3>
                        <p class="variante-tag">Color: <span>${item.variante}</span></p>
                    </div>
                </td>
                <td class="prod-precio">$ ${item.precio.toLocaleString()}</td>
                <td class="prod-qty">
                    <div class="qty-selector">
                        <button onclick="cambiarCantidad(${index}, -1)">-</button>
                        <input type="number" value="${item.cantidad}" readonly>
                        <button onclick="cambiarCantidad(${index}, 1)">+</button>
                    </div>
                </td>
                <td class="prod-subtotal"><strong>$ ${item.subtotal.toLocaleString()}</strong></td>
                <td class="prod-remove">
                    <button class="btn-remove" onclick="eliminarDelCarrito(${index})">×</button>
                </td>
            </tr>
        `;
  });

  // Actualizar el total en el panel lateral
  document.getElementById("total-general").textContent =
    `$ ${totalGeneral.toLocaleString()}`;
}

// Función para borrar un producto
function cambiarCantidad(index, cambio) {
  let carrito = JSON.parse(localStorage.getItem("carrito"));

  // Aplicamos el cambio
  carrito[index].cantidad += cambio;

  // Si la cantidad llega a 0, eliminamos el producto
  if (carrito[index].cantidad <= 0) {
    carrito.splice(index, 1);
  } else {
    // Recalculamos el subtotal de esa fila
    carrito[index].subtotal = carrito[index].cantidad * carrito[index].precio;
  }

  // Guardamos los cambios en el "bloc de notas" (localStorage)
  localStorage.setItem("carrito", JSON.stringify(carrito));

  // RE-DIBUJAMOS TODO PARA QUE SE VEA EL CAMBIO
  renderizarCarrito(); // Esto actualiza la tabla y el TOTAL abajo
  actualizarContadorCarrito(); // <--- ESTO ACTUALIZA EL CÍRCULO DEL HEADER
}

function eliminarDelCarrito(index) {
  let carrito = JSON.parse(localStorage.getItem("carrito"));
  carrito.splice(index, 1);
  localStorage.setItem("carrito", JSON.stringify(carrito));

  renderizarCarrito();
  actualizarContadorCarrito(); // <--- También actualizamos el badge aquí
}

function validarYLimpiarCarrito() {
  // 1. Obtenemos lo que la clienta tenía guardado
  let carritoGuardado = JSON.parse(localStorage.getItem("carrito")) || [];

  if (carritoGuardado.length === 0) return;

  // 2. Filtramos el carrito: solo se quedan los que están en 'productos' Y tienen stock
  const carritoValidado = carritoGuardado.filter((itemCarrito) => {
    // Buscamos el producto real en la lista que bajó de Google Sheets
    const productoReal = productos.find((p) => p.id === itemCarrito.id);

    // Si el producto ya no existe en el Excel o dice "Sin Stock", lo borramos
    if (!productoReal || productoReal.estado === "Sin Stock") {
      console.warn(
        `Producto ${itemCarrito.nombre} eliminado por falta de stock.`,
      );
      return false;
    }

    // Si existe y hay stock, se queda
    return true;
  });

  // 3. Guardamos el carrito limpio y actualizamos la vista
  localStorage.setItem("carrito", JSON.stringify(carritoValidado));
  actualizarInterfazCarrito();
}
