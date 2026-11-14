// BreatheClo API layer
window.BC = window.BC || {};

(function () {
  var cfg = BC.config;

  function readList(key) {
    try { var v = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; }
  }
  function saveLocal(key, item) {
    var list = readList(key); list.push(item);
    try { localStorage.setItem(key, JSON.stringify(list)); } catch (e) { /* storage blocked */ }
  }
  function later(value) { return new Promise(function (res) { setTimeout(function () { res(value); }, 400); }); }

  /** Sends a request to the backend. Adds the Firebase login token when the visitor is logged in. */
  function request(method, path, body, opts) {
    opts = opts || {};
    var tokenPromise = BC.getIdToken ? BC.getIdToken().catch(function () { return null; }) : Promise.resolve(null);
    return tokenPromise.then(function (token) {
      var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, opts.timeout || 15000) : null;
      var headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = "Bearer " + token;
      return fetch(cfg.API_BASE + path, {
        method: method, headers: headers, signal: ctrl ? ctrl.signal : undefined,
        body: body === undefined ? undefined : JSON.stringify(body)
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (data) {
          if (!r.ok) { var err = new Error(data.error || "Request failed (" + r.status + ")"); err.status = r.status; err.data = data; throw err; }
          return data;
        });
      }).catch(function (e) {
        if (e.name === "AbortError") throw new Error("The server took too long to respond. Please try again.");
        if (!e.status) throw new Error("Cannot reach the server. Please check your connection and try again.");
        throw e;
      }).then(function (d) { clearTimeout(timer); return d; }, function (e) { clearTimeout(timer); throw e; });
    });
  }

  BC.api = {
    enabled: !!cfg.USE_API,
    request: request,

    /** loads the catalogue from the server. */
    getProducts: function () { return request("GET", "/api/products", undefined, { timeout: 5000 }); },

    /** order = { customer:{name,email,phone}, address:{...}, payment:"cod", items:[{id,size,qty}] } */
    placeOrder: function (order) {
      if (cfg.USE_API) return request("POST", "/api/orders", order);
      var id = "BC" + Date.now().toString().slice(-8);
      saveLocal("bc_orders", Object.assign({ id: id, createdAt: new Date().toISOString(), status: "placed" }, order));
      return later({ id: id });
    },
    myOrders: function () {
      if (cfg.USE_API) return request("GET", "/api/orders/mine");
      var uid = BC.user && BC.user.uid;
      return later(readList("bc_orders").filter(function (o) { return o.customer && o.customer.uid === uid; }).reverse());
    },
    cancelOrder: function (id) {
      if (cfg.USE_API) return request("POST", "/api/orders/" + encodeURIComponent(id) + "/cancel");
      var list = readList("bc_orders");
      list.forEach(function (o) { if (o.id === id && (o.status === "placed" || o.status === "confirmed")) o.status = "cancelled"; });
      try { localStorage.setItem("bc_orders", JSON.stringify(list)); } catch (e) { /* storage blocked */ }
      return later({ id: id, status: "cancelled" });
    },
    sendMessage: function (msg) {
      if (cfg.USE_API) return request("POST", "/api/contact", msg);
      saveLocal("bc_messages", Object.assign({ createdAt: new Date().toISOString() }, msg));
      return later({ ok: true });
    },
    subscribe: function (email) {
      if (cfg.USE_API) return request("POST", "/api/subscribe", { email: email });
      saveLocal("bc_subscribers", { email: email, createdAt: new Date().toISOString() });
      return later({ ok: true });
    }
  };

  /* BC.ready resolves once the catalogue is loaded. Pages wait for it before drawing products.
     If the server cannot be reached, the built-in catalogue (js/data.js) is used so the site still browses. */
  BC.ready = (cfg.USE_API ? BC.api.getProducts() : Promise.reject(new Error("demo mode")))
    .then(function (list) {
      if (Array.isArray(list) && list.length) {
        BC.products.splice.apply(BC.products, [0, BC.products.length].concat(list));
        BC.source = "api";
      }
    })
    .catch(function () { BC.source = "static"; });
})();
