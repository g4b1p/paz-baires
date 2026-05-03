document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const errorMessage = document.getElementById("errorMessage");

  // La contraseña por ahora es fija (podés cambiarla después)
  const ADMIN_PASS = "pb";

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const inputPass = document.getElementById("adminPass").value;

    if (inputPass === ADMIN_PASS) {
      // Guardamos que el usuario está logueado
      sessionStorage.setItem("isLoggedIn", "true");

      // Redirigimos al panel
      window.location.href = "panel.html";
    } else {
      errorMessage.textContent = "Contraseña incorrecta. Inténtalo de nuevo.";
      document.getElementById("adminPass").value = "";
    }
  });
});
