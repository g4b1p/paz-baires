const API_URL = "productos.json?v=1.0";

// Variable global para que el resto de tus archivos sigan funcionando
let productos = [];

// Función para quitar acentos y dejar el texto "limpio" para carpetas
const limpiarTexto = (str) =>
  str
    ? str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
    : "varios";

const CLOUDINARY_BASE =
  "https://res.cloudinary.com/duoya2obs/image/upload/f_auto,q_auto/";

// FUNCIÓN PARA LIMPIAR Y ACTUALIZAR EL CARRITO SEGÚN EL EXCEL
function sincronizarCarritoConProductos() {
  let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  if (carrito.length === 0 || productos.length === 0) return;

  let carritoFiltrado = [];
  let carritoModificado = false;

  carrito.forEach((item) => {
    // Buscamos el producto actual en la lista oficial de Google Sheets
    const productoReal = productos.find((p) => p.id === item.id);

    // CASO 1: El producto fue ocultado o eliminado del Excel -> LO ELIMINAMOS DEL CARRITO
    if (!productoReal) {
      carritoModificado = true;
      console.log(
        `🗑️ Producto ID ${item.id} (${item.nombre}) eliminado del carrito: ya no está disponible (fue ocultado o borrado en el Excel).`,
      );
      return; // No se agrega a carritoFiltrado, por lo que desaparece
    }

    // CASO 2: El producto fue modificado de estructura/tipo (ej. pasó de normal a docena) -> LO ELIMINAMOS para evitar variantes viejas
    const tipoActual = (productoReal.tipoPrecio || "unico")
      .toLowerCase()
      .trim();
    const tipoItem = (item.tipoPrecio || "").toLowerCase().trim();

    if (tipoItem && tipoItem !== tipoActual) {
      carritoModificado = true;
      console.log(
        `🗑️ Producto ID ${item.id} (${item.nombre}) eliminado del carrito: su tipo de precio cambió en el Excel y la variante ya no es válida.`,
      );
      return; // Se elimina por modificación estructural
    }

    // Si pasa las validaciones, actualizamos los precios vigentes y lo mantenemos
    item.precioMinorista = productoReal.precioRegular || 0;
    item.precioMayorista = productoReal.precioEspecial || 0;
    item.tipoPrecio = tipoActual;
    item.precio =
      tipoActual.includes("oferta") ||
      tipoActual.includes("docena") ||
      tipoActual.includes("pack")
        ? productoReal.precioEspecial > 0
          ? productoReal.precioEspecial
          : productoReal.precioRegular
        : productoReal.precioRegular;
    item.subtotal = item.precio * item.cantidad;

    carritoFiltrado.push(item);
  });

  if (carritoModificado) {
    localStorage.setItem("carrito", JSON.stringify(carritoFiltrado));
    console.log(
      "🛒 Carrito depurado: Se eliminaron productos ocultos o modificados estructuralmente.",
    );
  }
}

// Función para cargar los productos desde Google Sheets
async function cargarProductosDesdeSheet() {
  try {
    // INTENTO DE CARGA INSTANTÁNEA (Caché)
    const cache = localStorage.getItem("productos_cache");
    if (cache) {
      productos = JSON.parse(cache);
      console.log("🚀 Cargando desde caché (Instantáneo)");
      sincronizarCarritoConProductos(); // Sincroniza si carga de caché
      document.dispatchEvent(new CustomEvent("productosListos"));
    }

    // PEDIDO A GOOGLE SHEETS (Segundo plano)
    const respuesta = await fetch(API_URL, {
      method: "GET",
      redirect: "follow",
    });
    const data = await respuesta.json();

    // TRANSFORMACIÓN DE DATOS
    const nuevosProductos = data
      .filter((p) => {
        const est = p.Estado ? p.Estado.toString().trim().toLowerCase() : "";
        return est !== "oculto" && est !== "";
      })
      .map((p) => {
        const coleccionParaRuta = limpiarTexto(p.Colección);

        // Extraemos las variantes del Excel
        const variantesRaw = p.Variantes
          ? p.Variantes.toString()
              .split(",")
              .map((v) => v.trim())
          : [];

        // Creamos el Mapa de Stock (Talle:Nombre)
        const stockMapa = variantesRaw.reduce((acc, item) => {
          if (item.includes(":")) {
            let [talle, nombre] = item.split(":").map((s) => s.trim());
            nombre = nombre.replace(/\(SIN STOCK\)/i, "").trim();

            if (!acc[talle]) acc[talle] = [];
            acc[talle].push(nombre);
          }
          return acc;
        }, {});

        // Obtenemos nombres únicos
        const nombresUnicos = [
          ...new Set(
            variantesRaw.map((v) =>
              v.includes(":") ? v.split(":")[1].trim() : v.trim(),
            ),
          ),
        ];

        // Procesamos variantes
        const variantesProcesadas = nombresUnicos.map((n) => {
          const agotado = n.toUpperCase().includes("(SIN STOCK)");
          let nombreLimpio = n.replace(/\(SIN STOCK\)/i, "").trim();

          if (nombreLimpio.includes("|")) {
            const [nombreColor, hex] = nombreLimpio
              .split("|")
              .map((s) => s.trim());
            return {
              nombre: nombreColor,
              valor: hex,
              disponible: !agotado,
            };
          }

          return {
            nombre: nombreLimpio,
            valor: nombreLimpio,
            disponible: !agotado,
          };
        });

        const tipoPrecioRaw =
          p["Tipo de Precio"] || p["Tipo Precio"] || p["tipoPrecio"] || "";

        // Retornamos el objeto producto final
        return {
          id: parseInt(p.ID),
          orden: parseInt(p.Orden) || 999,
          estado: p.Estado,
          tipo: p.Tipo ? p.Tipo.toLowerCase().trim() : "",

          tipoPrecio: tipoPrecioRaw.toString().trim().toLowerCase(),
          cantidadPack: parseInt(p["Cantidad Pack"]) || 12,
          precioRegular:
            parseFloat(p["Precio Regular"]) || parseFloat(p.Precio) || 0,
          precioEspecial: parseFloat(p["Precio Especial"]) || 0,

          tipoVariante: p["Tipo de Variante"]
            ? p["Tipo de Variante"].toString().trim()
            : "Color",

          esEstampado: p.EsEstampado
            ? p.EsEstampado.toString().trim().toUpperCase()
            : "SI",
          nombre: p.Nombre,
          beneficio: p.Beneficio ? p.Beneficio.trim() : "",
          etiqueta: p.Etiqueta
            ? p.Etiqueta.toString().toLowerCase().trim()
            : "ninguno",
          coleccion: p.Colección ? p.Colección.toLowerCase().trim() : "varios",
          imagenes: p.Imágenes
            ? p.Imágenes.split(",").map((img) => {
                const nombreLimpio = img.trim();
                return `images/productos/${coleccionParaRuta}/${nombreLimpio}`;
              })
            : [],
          variantes: variantesProcesadas,
          stockMapa: stockMapa,
          tallesDisponibles: Object.keys(stockMapa),
          detalles: { Tecnico: p["Detalles Técnicos"] || "" },
        };
      });

    // Ordenamiento
    nuevosProductos.sort((a, b) => {
      const ordenA = a.orden || 999;
      const ordenB = b.orden || 999;

      if (ordenA !== 999 || ordenB !== 999) {
        return ordenA - ordenB;
      }
      return b.id - a.id;
    });

    window.productos = nuevosProductos;
    localStorage.setItem("productos_cache", JSON.stringify(window.productos));
    localStorage.setItem("productos", JSON.stringify(window.productos));

    // AQUÍ ESTABA EL DETALLE: Llamamos a la sincronización con los datos frescos de Google
    sincronizarCarritoConProductos();

    console.log("✅ Datos actualizados y guardados en window.productos");
    document.dispatchEvent(new CustomEvent("productosListos"));
  } catch (error) {
    console.error("❌ Error cargando productos:", error);
  }
}

function generarHTMLPrecios(prod) {
  const tipo = (prod.tipoPrecio || "unico").toLowerCase().trim();
  const regFormatted = prod.precioRegular
    ? prod.precioRegular.toLocaleString("es-AR")
    : "0";
  const espFormatted = prod.precioEspecial
    ? prod.precioEspecial.toLocaleString("es-AR")
    : "0";

  // 1. Caso OFERTA
  if (tipo.includes("oferta")) {
    return `
      <div class="precios">
        <div class="caso-oferta">
          <div class="etiqueta-oferta">OFERTA</div>
          <p class="precio-anterior">$ ${regFormatted}</p>
          <p class="precio-oferta">$ ${espFormatted}</p>
        </div>
      </div>`;
  }

  // 2. Caso POR MAYOR / MAYORISTA
  if (
    tipo.includes("mayor") ||
    tipo.includes("por mayor") ||
    tipo.includes("mayorista") ||
    tipo.includes("pormayor")
  ) {
    return `
      <div class="precios">
        <div class="caso-mayor-menor">
          <div class="por-mayor">
            <div class="etiqueta-mayor">POR MAYOR</div>
            <p class="precio-mayor">$ ${espFormatted}</p>
          </div>
        </div>
      </div>`;
  }

  // 3. Caso DOCENA / PACK DINÁMICO
  if (tipo.includes("docena") || tipo.includes("pack")) {
    const cantPack = prod.cantidadPack || 12;
    return `
      <div class="precios">
        <div class="caso-docena">
          <div class="etiqueta-docena">PACK x${cantPack}</div>
          <p class="precio-docena">$ ${espFormatted}</p>
        </div>
      </div>`;
  }

  // 4. Caso ÚNICO (Default)
  return `
    <div class="precios">
      <div class="caso-unico">
        <div class="etiqueta-unico">ÚNICO PRECIO</div>
        <p class="precio-unico">$ ${regFormatted}</p>
      </div>
    </div>`;
}

// Iniciamos la carga
cargarProductosDesdeSheet();
