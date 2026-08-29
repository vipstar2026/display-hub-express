(function () {
  var marker = "vipstar-runtime-recovery";
  var maxAge = 30000;

  function messageOf(value) {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value.message === "string") return value.message;
    if (value.reason) return messageOf(value.reason);
    if (value.error) return messageOf(value.error);
    return "";
  }

  function isStaleRuntimeError(value) {
    var message = messageOf(value);
    return (
      message.indexOf("Cannot read properties of null (reading 'use')") !== -1 ||
      message.indexOf("Failed to fetch dynamically imported module") !== -1 ||
      message.indexOf("Importing a module script failed") !== -1
    );
  }

  function recover(event) {
    if (!isStaleRuntimeError(event)) return;

    var lastRecovery = Number(sessionStorage.getItem(marker) || "0");
    if (Date.now() - lastRecovery < maxAge) return;

    if (event && typeof event.preventDefault === "function") event.preventDefault();
    sessionStorage.setItem(marker, String(Date.now()));

    var url = new URL(window.location.href);
    url.searchParams.set("runtime-reload", String(Date.now()));
    window.location.replace(url.toString());
  }

  window.addEventListener("error", recover, true);
  window.addEventListener("unhandledrejection", recover, true);
})();