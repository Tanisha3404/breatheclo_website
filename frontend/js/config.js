/* BreatheClo settings. Loaded first on every page. */
window.BC = window.BC || {};

(function () {
  var PRODUCTION_API = "";

  var host = location.hostname;
  var isLocal = host === "localhost" || host === "127.0.0.1";

  BC.config = {
    API_BASE: isLocal ? (location.port === "5000" ? "" : "http://localhost:5000") : PRODUCTION_API,

    USE_API: isLocal || !!PRODUCTION_API || /\.onrender\.com$/.test(host)
  };
})();
