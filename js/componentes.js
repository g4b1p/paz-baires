document.addEventListener("DOMContentLoaded", () => {
  insertarHeader();
  insertarFooter();
});

function insertarHeader() {
  // Detectamos en qué página estamos
  const paginaActual = window.location.pathname;
  const esHome =
    paginaActual.includes("index.html") ||
    paginaActual.includes("quiero-comprar.html") ||
    paginaActual.endsWith("/");

  // 1. Definimos solo la parte de navegación (Lo que va en TODAS las páginas)
  let headerHTML = `
    <header>
      <div class="top-bar">Compra minima para envios a partir de $50.000.</div>
      <div class="header">

        <input type="checkbox" id="nav-toggle" hidden />

        <div class="bar-overlay" id="menuOverlay"></div>

        <label for="nav-toggle" class="menu-btn">&#9776;</label>

        <a href="index.html"
          ><img class="logo" src="images/icons/paz-baires-logotipo.png" alt=""
        /></a>

        <nav class="nav-links">
          <a href="carrito.html" class="cart-container"
            ><img
              class="icon-social-header"
              src="images/icons/carrito-icon.png"
              alt=""
            />
            <span id="cart-count" class="cart-badge">0</span>
          </a>
          <a href="https://www.instagram.com/pazbaires.ok/" target="_blank"
            ><img
              class="icon-social-header"
              src="images/icons/instagram-icon.png"
              alt=""
          /></a>
          <a href="https://www.facebook.com/pazbaires" target="_blank"
            ><img
              class="icon-social-header"
              src="images/icons/facebook-icon.png"
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
              </ul>
            </li>
          </ul>
        </aside>
      </div>
    `;

  if (esHome) {
    headerHTML += `
      <section class="video-container">
        <video autoplay muted loop playsinline class="video-bg">
          <source src="https://files.catbox.moe/rxjmuc.mp4" type="video/mp4" />
          Tu navegador no soporta videos.
        </video>
        <div class="video-overlay">
          <h1>Bienvenido a nuestra Tienda</h1>
          <p>Los mejores productos a un clic de distancia</p>
          <a href="tienda.html" class="btn-comprar">Ver Catálogo</a>
        </div>
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
            href="https://www.instagram.com/pazbaires.ok/"
            target="_blank"
            ><img
              class="icon-social-footer"
              src="images/icons/instagram-icon.png"
              alt=""
            />pazbaires</a
          >
          <a
            class="social"
            href="https://www.facebook.com/pazbaires"
            target="_blank"
            ><img
              class="icon-social-footer"
              src="images/icons/facebook-icon.png"
              alt=""
            />pazbaires</a
          >
        </div>
        <div class="contacto">
          <h2 class="title-footer">Contacto</h2>

          <p class="social">
            <img
              class="icon-social-footer"
              src="images/icons/telefono-icon.png"
              alt=""
            />11 5601 8912
          </p>

          <p class="social">
            <img
              class="icon-social-footer"
              src="images/icons/correo-icon.png"
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
          <img src="images/GabCoder.png" alt="" />
        </section>
      </div>

      <div class="chat-whatsapp">
        <!-- Botón para abrir el chat -->
        <input type="checkbox" id="chat-toggle" class="chat-toggle" />
        <label for="chat-toggle" class="chat-button">
          <img src="images/icons/whatsapp-icon.png" alt="" />
          Haz click aquí para comunicarte
        </label>

        <!-- Contenedor del chat -->
        <div class="chat-container">
          <div class="chat-header">
            <img
              src="images/icons/paz-baires-logotipo-2.png"
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
