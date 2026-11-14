/* BreatheClo cart page.
   - Stores only { id, size, qty }; title, price and image always come from BC.products. */
window.BC = window.BC || {};

(function () {
  var KEY = "bc_cart_v1";

  BC.fmt = function (n) {
    return "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  BC.getProduct = function (id) {
    return BC.products.find(function (p) { return p.id === id; }) || null;
  };

  function read() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch (e) { return []; }
  }
  function write(lines) {
    try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch (e) { /* storage blocked: cart lives in memory only */ }
    mem = lines;
    document.dispatchEvent(new CustomEvent("bc:cart"));
  }

  var mem = read();

  BC.cart = {
    /** Lines with product info attached. Lines for products that no longer exist are dropped. */
    lines: function () {
      return mem.map(function (l) {
        var p = BC.getProduct(l.id);
        return p ? { key: l.id + "|" + l.size, id: l.id, size: l.size, qty: l.qty, product: p, total: p.price * l.qty } : null;
      }).filter(Boolean);
    },
    count: function () { return mem.reduce(function (n, l) { return n + l.qty; }, 0); },
    subtotal: function () { return this.lines().reduce(function (s, l) { return s + l.total; }, 0); },
    add: function (id, size, qty) {
      qty = Math.max(1, parseInt(qty, 10) || 1);
      if (!BC.getProduct(id)) return false;
      var lines = mem.slice();
      var hit = lines.find(function (l) { return l.id === id && l.size === size; });
      if (hit) hit.qty = Math.min(10, hit.qty + qty); else lines.push({ id: id, size: size, qty: Math.min(10, qty) });
      write(lines);
      return true;
    },
    setQty: function (key, qty) {
      var lines = mem.map(function (l) { return { id: l.id, size: l.size, qty: l.qty }; });
      var hit = lines.find(function (l) { return l.id + "|" + l.size === key; });
      if (!hit) return;
      hit.qty = Math.min(10, qty);
      write(lines.filter(function (l) { return l.qty > 0; }));
    },
    remove: function (key) { write(mem.filter(function (l) { return l.id + "|" + l.size !== key; })); },
    clear: function () { write([]); }
  };

  // keep several open tabs in sync
  window.addEventListener("storage", function (e) {
    if (e.key === KEY) { mem = read(); document.dispatchEvent(new CustomEvent("bc:cart")); }
  });
})();
