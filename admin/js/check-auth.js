// Este script va al inicio del panel.html
if (sessionStorage.getItem("isLoggedIn") !== "true") {
  window.location.href = "index.html";
}
