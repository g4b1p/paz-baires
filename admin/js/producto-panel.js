// admin/js/producto-panel.js

document.addEventListener("DOMContentLoaded", () => {
  // 1. Obtener el ID de la URL (ej: ?id=10)
  const urlParams = new URLSearchParams(window.location.search);
  const productoId = urlParams.get("id");

  if (productoId) {
    cargarDatosProducto(productoId);
  } else {
    document.getElementById("titulo-pagina").innerText = "Nuevo Producto";
  }

  // 2. Escuchar el envío del formulario
  document
    .getElementById("form-producto")
    .addEventListener("submit", guardarCambios);
});

function cargarDatosProducto(id) {
  // Recuperamos los productos del cache que guardó ui-admin.js
  const productosCache =
    JSON.parse(localStorage.getItem("productos_cache")) || [];
  const producto = productosCache.find((p) => p.id == id);

  if (producto) {
    document.getElementById("titulo-pagina").innerText =
      `Editando: ${producto.nombre}`;

    // Rellenamos los campos
    document.getElementById("nombre").value = producto.nombre;
    document.getElementById("precio").value = producto.precio;
    document.getElementById("estado").value = producto.estado || "activo";
    document.getElementById("descripcion").value = producto.descripcion || "";
    document.getElementById("coleccion").value = producto.coleccion || "";

    const imgInput = document.getElementById("imagen-url");
    imgInput.value = producto.imagenes[0] || "";
    actualizarPreview(producto.imagenes[0]);

    // Escuchador para actualizar preview si cambian el link
    imgInput.addEventListener("input", (e) =>
      actualizarPreview(e.target.value),
    );
  }
}

function actualizarPreview(url) {
  const preview = document.getElementById("previsualizacion");
  if (url) {
    // Ajuste de ruta si es local
    const src = url.startsWith("http") ? url : `../${url}`;
    preview.innerHTML = `<img src="${src}" style="max-width: 100%; border-radius: 10px;">`;
  }
}

async function guardarCambios(e) {
  e.preventDefault();
  const btn = document.getElementById("btn-guardar");
  btn.innerText = "ENVIANDO...";
  btn.disabled = true;

  // Aquí irá la conexión con Google Sheets que haremos a continuación
  console.log("Datos listos para enviar");
}
