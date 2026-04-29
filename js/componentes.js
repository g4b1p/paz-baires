document.addEventListener("DOMContentLoaded", () => {
  insertarHeader();
  insertarFooter();
});

function insertarHeader() {
  // Detectamos en qué página estamos
  const paginaActual = window.location.pathname;

  // 1. Ahora 'esHome' SOLO es para el index
  const esHome =
    paginaActual.includes("index.html") || paginaActual.endsWith("/");

  // 2. Detectamos si es la página de ayuda
  const esAyuda = paginaActual.includes("quiero-comprar.html");

  // 1. Definimos solo la parte de navegación (Lo que va en TODAS las páginas)
  let headerHTML = `
    <header>
      <div class="top-bar">
          <div class="marquee-track">
              <span>ENVÍOS A TODO EL PAÍS | COMPRA MÍNIMA $80.000</span>
              <span>ENVÍOS A TODO EL PAÍS | COMPRA MÍNIMA $80.000</span>
              <span>ENVÍOS A TODO EL PAÍS | COMPRA MÍNIMA $80.000</span>
              <span>ENVÍOS A TODO EL PAÍS | COMPRA MÍNIMA $80.000</span>
          </div>
          <div class="marquee-track">
              <span>ENVÍOS A TODO EL PAÍS | COMPRA MÍNIMA $80.000</span>
              <span>ENVÍOS A TODO EL PAÍS | COMPRA MÍNIMA $80.000</span>
              <span>ENVÍOS A TODO EL PAÍS | COMPRA MÍNIMA $80.000</span>
              <span>ENVÍOS A TODO EL PAÍS | COMPRA MÍNIMA $80.000</span>
          </div>
      </div>
      <div class="header">

        <input type="checkbox" id="nav-toggle" hidden />

        <div class="bar-overlay" id="menuOverlay"></div>

        <label for="nav-toggle" class="menu-btn">&#9776;</label>

        <a href="index.html"
          ><img class="logo" src="images/icons/paz-baires-logotipo.webp" alt=""
        /></a>

        <nav class="nav-links">
          <a href="carrito.html" class="cart-container"
            ><img
              class="icon-social-header"
              src="images/icons/carrito-icon.webp"
              alt=""
            />
            <span id="cart-count" class="cart-badge">0</span>
          </a>
          <a href="https://www.instagram.com/pazbaires?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank"
            ><img
              class="icon-social-header"
              src="images/icons/instagram-icon.webp"
              alt=""
          /></a>
          <a href="https://www.facebook.com/pazbaires" target="_blank"
            ><img
              class="icon-social-header"
              src="images/icons/facebook-icon.webp"
              alt=""
          /></a>
        </nav>

        <aside class="sidebar">
          <label for="nav-toggle" class="close-btn">✖</label>
          <ul>
            <li><a href="index.html">INICIO</a></li>
            <li><a href="quiero-comprar.html">QUIERO COMPRAR</a></li>
            <li class="dropdown">
              <input type="checkbox" id="dropdown-toggle" hidden />
              <label for="dropdown-toggle" class="dropdown-label">
                <a href="tienda.html">TIENDA</a>
                <span class="arrow"></span>
              </label>
              <ul class="dropdown-menu">
                <li>
                  <a href="tienda.html?categoria=accesorios">ACCESORIOS</a>
                </li>
                <li>
                  <a href="tienda.html?categoria=blanqueria">BLANQUERIA</a>
                </li>
                <li><a href="tienda.html?categoria=pijamas">PIJAMAS</a></li>
                <li><a href="tienda.html?linea=OFERTAS">OFERTAS</a></li>
              </ul>
            </li>
          </ul>
        </aside>
      </div>
    `;

  // SECCIÓN DINÁMICA

  if (esHome) {
    // EL VIDEO SOLO PARA EL INICIO
    headerHTML += `
      <section class="video-container">
        <!-- Video para PC -->
        <video autoplay muted loop playsinline class="video-bg video-pc">
          <source src="https://cdn.discordapp.com/attachments/1498837712122413090/1498837851545145374/intro-pb.mp4?ex=69f29d06&is=69f14b86&hm=51d4aac4045a86187a5958c4b0912aff01eadbb22e646798296dd02350714b8b&" type="video/mp4">
        </video>

        <!-- Video para Celu -->
        <video autoplay muted loop playsinline class="video-bg video-movil">
          <source src="https://cdn.discordapp.com/attachments/1498837712122413090/1498845431264841951/intro-pb-2.mp4?ex=69f2a416&is=69f15296&hm=178e4abe2e667a3dda34888ad8ce1a5f7f788110244e877618d6c9fda265f0c5&" type="video/mp4">
        </video>
        <div class="video-overlay">
          <h1>Bienvenido a nuestra Tienda</h1>
          <a href="tienda.html" class="btn-comprar">Ver Catálogo</a>
        </div>
      </section>
    `;
  } else if (esAyuda) {
    // BANNER SIMPLE PARA QUIERO COMPRAR
    headerHTML += `
      <section class="ayuda-banner">
        <h1>PREGUNTAS FRECUENTES</h1>
        <p>
          Aquí encontrarás la información necesaria para envíos, medios de pago y respuestas a las dudas más frecuentes para tu compra.
        </p>
      </section>
    `;
  }

  // 3. Cerramos el tag header y lo insertamos
  headerHTML += `</header>`;
  document.body.insertAdjacentHTML("afterbegin", headerHTML);
}

function insertarFooter() {
  const footerHTML = `
    <footer class="footer">
      <div class="social-container">
        <div class="redes-sociales">
          <h2 class="title-footer">Seguinos</h2>
          <a
            class="social"
            href="https://www.instagram.com/pazbaires?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
            target="_blank"
            ><img
              class="icon-social-footer"
              src="images/icons/instagram-icon.webp"
              alt=""
            />pazbaires</a
          >
          <a
            class="social"
            href="https://www.facebook.com/pazbaires"
            target="_blank"
            ><img
              class="icon-social-footer"
              src="images/icons/facebook-icon.webp"
              alt=""
            />pazbaires</a
          >
        </div>
        <div class="contacto">
          <h2 class="title-footer">Contacto</h2>

          <p class="social">
            <img
              class="icon-social-footer"
              src="images/icons/telefono-icon.webp"
              alt=""
            />11 5601 8912
          </p>

          <p class="social">
            <img
              class="icon-social-footer"
              src="images/icons/correo-icon.webp"
              alt=""
            />pazbaires.adm@gmail.com
          </p>
        </div>
      </div>
      <div class="copyright">
        <p>Paz Baires © Copyright 2025. Todos los derechos reservados.</p>
        <hr class="line-footer" />
        <section class="firma">
          <p>Created by</p>
          <img src="images/GabCoder.webp" alt="" style="margin-bottom: 70px;" />
        </section>
      </div>

      <div class="chat-whatsapp">
        <!-- Botón para abrir el chat -->
        <input type="checkbox" id="chat-toggle" class="chat-toggle" />
        <label for="chat-toggle" class="chat-button">
          <img src="images/icons/whatsapp-icon.webp" alt="" />
          Haz click aquí para comunicarte
        </label>

        <!-- Contenedor del chat -->
        <div class="chat-container">
          <div class="chat-header">
            <img
              src="images/icons/paz-baires-logotipo-2.webp"
              alt="Lab Dental Congreso"
              class="chat-logo"
            />
            <div>
              <h3>Paz Baires</h3>
              <span class="status">Online</span>
            </div>
            <label for="chat-toggle" class="close-chat">&times;</label>
          </div>
          <div class="chat-body">
            <div class="chat-message">
              <span class="emoji">📋</span> Hola <span class="emoji">👋</span>,
              bienvenido a <b><i>Paz Baires</i></b
              >.
              <p>¿En qué podemos ayudarte?</p>
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
