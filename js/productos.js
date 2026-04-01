const API_URL =
  "https://script.google.com/macros/s/AKfycbx3t1MhseZqhqEu9ZqfztVe5wXGSj9CcWKLRRvf7xdxApZY_tj_0i0xw1vyOQAGEl3k/exec";

// 2. Variable global para que el resto de tus archivos sigan funcionando
let productos = [];

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
        // 1. Extraemos las variantes del Excel
        const variantesRaw = p.Variantes
          ? p.Variantes.toString()
              .split(",")
              .map((v) => v.trim())
          : [];

        // 2. Creamos el Mapa de Stock (Talle:Nombre)
        const stockMapa = variantesRaw.reduce((acc, item) => {
          if (item.includes(":")) {
            const [talle, nombre] = item.split(":").map((s) => s.trim());
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

        // 4. Procesamos si es Color (Rosa|#hex) o Estampado
        const variantesProcesadas = nombresUnicos.map((n) => {
          if (n.includes("|")) {
            const [nombreColor, hex] = n.split("|").map((s) => s.trim());
            return { nombre: nombreColor, valor: hex };
          }
          return { nombre: n, valor: n };
        });

        // 5. Retornamos el objeto producto final
        return {
          id: parseInt(p.ID),
          estado: p.Estado,
          tipo: p.Tipo ? p.Tipo.toLowerCase().trim() : "",
          nombre: p.Nombre,
          precio: parseFloat(p.Precio) || 0,
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
                const imgLimpia = img.trim();
                return imgLimpia.startsWith("http")
                  ? imgLimpia
                  : `images/productos/${p.Colección.toLowerCase().trim()}/${imgLimpia}`;
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
