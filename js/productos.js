const API_URL =
  "https://script.google.com/macros/s/AKfycbxe7UPbvDRT2dcfxMdWfPo5MZikdGb4HWIP6l5rg0kaxftUgOUvrsmIe_MhDSDeeiFw/exec";

// 2. Variable global para que el resto de tus archivos sigan funcionando
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

// 3. Función para cargar los productos desde Google Sheets
async function cargarProductosDesdeSheet() {
  try {
    // 1. INTENTO DE CARGA INSTANTÁNEA (Caché)
    const cache = localStorage.getItem("productos_cache");
    if (cache) {
      productos = JSON.parse(cache);
      console.log("🚀 Cargando desde caché (Instantáneo)");
      // Avisamos a la web que ya tenemos datos para mostrar mientras Google responde en segundo plano
      document.dispatchEvent(new CustomEvent("productosListos"));
    }

    // 2. PEDIDO A GOOGLE SHEETS (Segundo plano)
    const respuesta = await fetch(API_URL, {
      method: "GET",
      redirect: "follow",
    });
    const data = await respuesta.json();

    // 3. TRANSFORMACIÓN DE DATOS
    const nuevosProductos = data
      .filter((p) => {
        // Normalizamos el estado para que no importen espacios ni mayúsculas
        const est = p.Estado ? p.Estado.toString().trim().toLowerCase() : "";
        // REGLA: Pasa todo menos lo que esté vacío o diga "oculto"
        return est !== "oculto" && est !== "";
      })

      .map((p) => {
        const coleccionParaRuta = limpiarTexto(p.Colección);

        // 1. Extraemos las variantes del Excel
        const variantesRaw = p.Variantes
          ? p.Variantes.toString()
              .split(",")
              .map((v) => v.trim())
          : [];

        // 2. Creamos el Mapa de Stock (Talle:Nombre)
        const stockMapa = variantesRaw.reduce((acc, item) => {
          if (item.includes(":")) {
            let [talle, nombre] = item.split(":").map((s) => s.trim());

            // LIMPIEZA: Quitamos el "(SIN STOCK)" del nombre para que el mapa sea limpio // <--- NUEVO
            nombre = nombre.replace(/\(SIN STOCK\)/i, "").trim();

            if (!acc[talle]) acc[talle] = [];
            acc[talle].push(nombre);
          }
          return acc;
        }, {});

        // 3. Obtenemos nombres únicos (para no repetir fotos si hay varios talles)
        const nombresUnicos = [
          ...new Set(
            variantesRaw.map((v) =>
              v.includes(":") ? v.split(":")[1].trim() : v.trim(),
            ),
          ),
        ];

        // 4. Procesamos si es Color (Rosa|#hex) o Estampado + ESTADO DE STOCK
        const variantesProcesadas = nombresUnicos.map((n) => {
          // DETECTAR STOCK: ¿Contiene la frase mágica? // <--- NUEVO
          const agotado = n.toUpperCase().includes("(SIN STOCK)");

          // LIMPIEZA: Quitamos el texto "(SIN STOCK)" para que no se vea en la web // <--- NUEVO
          let nombreLimpio = n.replace(/\(SIN STOCK\)/i, "").trim();

          if (nombreLimpio.includes("|")) {
            const [nombreColor, hex] = nombreLimpio
              .split("|")
              .map((s) => s.trim());
            return {
              nombre: nombreColor,
              valor: hex,
              disponible: !agotado, // <--- AGREGADO
            };
          }

          return {
            nombre: nombreLimpio,
            valor: nombreLimpio,
            disponible: !agotado, // <--- AGREGADO
          };
        });

        // 5. Retornamos el objeto producto final
        return {
          id: parseInt(p.ID),
          estado: p.Estado,
          tipo: p.Tipo ? p.Tipo.toLowerCase().trim() : "",
          nombre: p.Nombre,
          precio: parseFloat(p.Precio) || 0,
          beneficio: p.Beneficio ? p.Beneficio.trim() : "",
          etiqueta: p.Etiqueta ? p.Etiqueta.trim() : "Ninguno",
          fechaIngreso: p["Fecha Ingreso"] || null,
          coleccion: p.Colección ? p.Colección.toLowerCase().trim() : "varios",
          ambiente: p.Ambiente
            ? p.Ambiente.split(",").map((s) => s.trim())
            : [],
          linea: p.Línea ? p.Línea.split(",").map((s) => s.trim()) : [],
          material: p.Material
            ? p.Material.split(",").map((s) => s.trim())
            : [],
          descripcion: p.Descripción,
          imagenes: p.Imágenes
            ? p.Imágenes.split(",").map((img) => {
                const nombreLimpio = img.trim();

                // 1. Caso Link completo (Cualquier sitio o Cloudinary con URL larga)
                if (nombreLimpio.startsWith("http")) {
                  if (nombreLimpio.includes("cloudinary.com")) {
                    return nombreLimpio.replace(
                      "/upload/",
                      "/upload/f_auto,q_auto/",
                    );
                  }
                  return nombreLimpio;
                }

                // 2. Caso Cloudinary (Nombre corto sin punto, ej: conjunto-pijama-plush-2)
                if (
                  !nombreLimpio.includes(".") &&
                  !nombreLimpio.includes("/")
                ) {
                  return `${CLOUDINARY_BASE}${nombreLimpio}`;
                }

                // 3. Caso Local (Fotos viejas con punto, ej: pijama.jpg)
                return `images/productos/${coleccionParaRuta}/${nombreLimpio}`;
              })
            : [],
          variantes: variantesProcesadas,
          stockMapa: stockMapa,
          tallesDisponibles: Object.keys(stockMapa),
          detalles: { Tecnico: p["Detalles Técnicos"] || "" },
        };
      });

    window.productos = nuevosProductos; // <--- ESTO ES VITAL
    localStorage.setItem("productos_cache", JSON.stringify(window.productos));

    console.log("✅ Datos actualizados y guardados en window.productos");
    document.dispatchEvent(new CustomEvent("productosListos"));

    // 4. ACTUALIZACIÓN DE MEMORIA Y CACHÉ
    // Comparamos si lo nuevo es distinto a lo que teníamos para no refrescar innecesariamente
    if (JSON.stringify(nuevosProductos) !== JSON.stringify(productos)) {
      productos = nuevosProductos;
      window.productos = nuevosProductos;
      localStorage.setItem("productos_cache", JSON.stringify(productos));
      document.dispatchEvent(new CustomEvent("productosListos"));
      console.log("✅ Productos actualizados desde Google Sheets");
    }
  } catch (error) {
    console.error("❌ Error cargando productos:", error);
  }
}

// Iniciamos la carga
cargarProductosDesdeSheet();
