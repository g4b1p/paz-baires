document.addEventListener("DOMContentLoaded", () => {
  insertarHeader();
  insertarFooter();
});

function insertarHeader() {
  // Detectamos en qué página estamos
  const paginaActual = window.location.pathname;

  const esHome =
    paginaActual.includes("index.html") || paginaActual.endsWith("/");

  const esComoComprar =
    paginaActual.includes("como-comprar.html") || paginaActual.endsWith("/");

  const esTienda =
    paginaActual.includes("tienda.html") || paginaActual.endsWith("/");

  const esCarrito =
    paginaActual.includes("carrito.html") || paginaActual.endsWith("/");

  let headerHTML = `
    <header>

    <div class="top-bar">
      <div class="marquee-track">
        
        <!-- BLOQUE 1 (Con más contenido para cubrir pantallas grandes) -->
        <div class="marquee-content">
          <span>ENVÍOS A TODO EL PAÍS</span>
          <span class="separator">&bull;</span>
          <span>COMPRA MÍNIMA PARA ENVÍOS A PARTIR DE $70.000</span>
          <span class="separator">&bull;</span>
          <span>PRECIOS POR MAYOR A PARTIR DE 3 O MÁS ARTÍCULOS</span>
          <span class="separator">&bull;</span>
          <!-- Repetimos las frases una vez más para alargar el bloque -->
          <span>ENVÍOS A TODO EL PAÍS</span>
          <span class="separator">&bull;</span>
          <span>COMPRA MÍNIMA PARA ENVÍOS A PARTIR DE $70.000</span>
          <span class="separator">&bull;</span>
          <span>PRECIOS POR MAYOR A PARTIR DE 3 O MÁS ARTÍCULOS</span>
          <span class="separator">&bull;</span>
        </div>

        <!-- BLOQUE 2 CLONADO (Debe ser siempre una copia exacta del Bloque 1) -->
        <div class="marquee-content" aria-hidden="true">
          <span>ENVÍOS A TODO EL PAÍS</span>
          <span class="separator">&bull;</span>
          <span>COMPRA MÍNIMA PARA ENVÍOS A PARTIR DE $70.000</span>
          <span class="separator">&bull;</span>
          <span>PRECIOS POR MAYOR A PARTIR DE 3 O MÁS ARTÍCULOS</span>
          <span class="separator">&bull;</span>
          <!-- Repetimos las frases una vez más para alargar el bloque -->
          <span>ENVÍOS A TODO EL PAÍS</span>
          <span class="separator">&bull;</span>
          <span>COMPRA MÍNIMA PARA ENVÍOS A PARTIR DE $70.000</span>
          <span class="separator">&bull;</span>
          <span>PRECIOS POR MAYOR A PARTIR DE 3 O MÁS ARTÍCULOS</span>
          <span class="separator">&bull;</span>
        </div>

      </div>
    </div>

      <div class="header">
        <div class="nav-link">
          <a href="como-comprar.html">COMO COMPRAR</a>
          <a href="tienda.html">TIENDA</a>
        </div>

        <a href="index.html" class="logo-container">
          <img class="logo" src="images/icons/paz-baires-logotipo.webp" alt="" fetchpriority="high" loading="eager" />
        </a>

        <a href="carrito.html" class="carrito"
          >MI CARRITO
          <img class="icon" src="images/icons/carrito-icon.webp" alt="" fetchpriority="high" loading="eager" />
          <span id="cart-count" class="contador-carrito" style="display:none;">0</span>
        </a>
      </div>
    `;

  // SECCIÓN DINÁMICA

  if (esHome) {
    // EL VIDEO SOLO PARA EL INICIO
    headerHTML += `
      <section class="video-container">
        <!-- Video para PC -->
        <video autoplay muted loop playsinline class="video-bg video-pc">
          <source
            src="https://res.cloudinary.com/duoya2obs/video/upload/q_auto/f_auto/v1778288479/intro-pb-pc_l2ec3g.mp4"
            type="video/mp4"
          />
        </video>

        <!-- Video para Celu -->
        <video autoplay muted loop playsinline class="video-bg video-movil">
          <source
            src="https://res.cloudinary.com/duoya2obs/video/upload/q_auto/f_auto/v1778288474/intro-pb-celu_ehioaz.mp4"
            type="video/mp4"
          />
        </video>
        <div class="video-overlay">
          <h1>Bienvenido a nuestro Catálogo/Tienda Web!</h1>
        </div>
      </section>
    </header>
    `;
  }
  if (esComoComprar) {
    headerHTML += `
      <div class="header">
        <div class="nav-link">
          <a href="como-comprar.html" class="active">COMO COMPRAR</a>
          <a href="tienda.html">TIENDA</a>
        </div>

        <a href="index.html" class="logo-container">
          <img class="logo" src="images/icons/paz-baires-logotipo.webp" alt="" fetchpriority="high" loading="eager" />
        </a>

        <a href="carrito.html" class="carrito"
          >MI CARRITO
          <img class="icon" src="images/icons/carrito-icon.webp" alt="" fetchpriority="high" loading="eager" />
          <span id="cart-count" class="contador-carrito" style="display:none;">0</span>
        </a>
      </div>
    `;
  }
  if (esTienda) {
    headerHTML += `
      <div class="header">
        <div class="nav-link">
          <a href="como-comprar.html">COMO COMPRAR</a>
          <a href="tienda.html" class="active">TIENDA</a>
        </div>

        <a href="index.html" class="logo-container">
          <img class="logo" src="images/icons/paz-baires-logotipo.webp" alt="" fetchpriority="high" loading="eager" />
        </a>

        <a href="carrito.html" class="carrito"
          >MI CARRITO
          <img class="icon" src="images/icons/carrito-icon.webp" alt="" fetchpriority="high" loading="eager" />
          <span id="cart-count" class="contador-carrito" style="display:none;">0</span>
        </a>
      </div>
    `;
  }
  if (esCarrito) {
    headerHTML += `
      <div class="header">
        <div class="nav-link">
          <a href="como-comprar.html">COMO COMPRAR</a>
          <a href="tienda.html">TIENDA</a>
        </div>

        <a href="index.html" class="logo-container">
          <img class="logo" src="images/icons/paz-baires-logotipo.webp" alt="" fetchpriority="high" loading="eager" />
        </a>

        <a href="carrito.html" class="carrito active"
          >MI CARRITO
          <img class="icon" src="images/icons/carrito-blanco-icon.webp" alt="" fetchpriority="high" loading="eager" />
          <span id="cart-count" class="contador-carrito" style="display:none;">0</span>
        </a>
      </div>
    `;
  }

  // 3. Cerramos el tag header y lo insertamos
  headerHTML += `</header>`;
  document.body.insertAdjacentHTML("afterbegin", headerHTML);
}

function insertarFooter() {
  const footerHTML = `
    <footer>
      <div class="container-footer">
        <div class="social-media-column">
          <h2 class="titles-footer">Seguinos</h2>
          <a class="data" target="_blank" href=""
            ><img
              class="icons-data"
              src="images/icons/instagram-icon.webp"
              alt=""
              loading="lazy" decoding="async"
            />@pazbaires</a
          >
          <a class="data" target="_blank" href=""
            ><img
              class="icons-data"
              src="images/icons/facebook-icon.webp"
              alt=""
              loading="lazy" decoding="async"
            />Paz Baires</a
          >
          <a class="data" target="_blank" href=""
            ><img
              class="icons-data"
              src="images/icons/tiktok-icon.webp"
              alt=""
              loading="lazy" decoding="async"
            />@paz.baires</a
          >
        </div>
        <div class="contact-column">
          <h2 class="titles-footer">Contacto</h2>
          <a class="data" target="_blank" href=""
            ><img class="icons-data" src="images/icons/telefono-icon.webp" alt="" loading="lazy" decoding="async" />1128506874</a
          >
          <a class="data" target="_blank" href=""
            ><img
              class="icons-data"
              src="images/icons/correo-icon.webp"
              alt=""
              loading="lazy" decoding="async"
            />pazbaires.adm@gmail.com</a
          >
        </div>
      </div>
      <div class="footer-footer">
        <div class="copyright">
          <p>Paz Baires © Copyright 2026. Todos los derechos reservados.</p>
          <hr />
        </div>
        <div class="firma-page">
          <p>Pagina creada por</p>
          <img src="images/icons/GabCoder.webp" class="firma-icon" alt="" loading="lazy" decoding="async" />
        </div>
      </div>
      <div class="chat-whatsapp">
        <input type="checkbox" id="chat-toggle" class="chat-toggle" />
        <label for="chat-toggle" class="chat-button">
          <img src="images/icons/whatsapp-icon.webp" alt="" loading="lazy" decoding="async" />Haz click aquí para
          comunicarte
        </label>

        <div class="chat-container">
          <div class="chat-header">
            <img
              src="images/icons/paz-baires-logotipo-2.webp"
              class="chat-logo"
              alt=""
              loading="lazy" decoding="async"
            />
            <div>
              <h3>Paz Baires</h3>
              <span class="status">En linea</span>
            </div>
            <label for="chat-toggle" class="close-chat">&times;</label>
          </div>
          <div class="chat-body">
            <div class="chat-message">
              <p>
                Hola! bienvenido a <b>Paz Baires. 😊</b><br />¿En qué podemos
                ayudarte?
              </p>
            </div>
          </div>
          <div class="chat-footer">
            <input
              type="text"
              id="user-message"
              placeholder="Hola! Vengo de la página web..."
            />
            <button class="send-btn" onclick="sendMessage()">➤</button>
          </div>
        </div>
      </div>
    </footer>     
    `;
  // Esto lo mete al final del <body>
  document.body.insertAdjacentHTML("beforeend", footerHTML);
}
