/* BreatheClo admin page */
window.BC = window.BC || {};
(function () {
  var $ = function (s) { return document.querySelector(s); };
  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function money(n) { return "₹" + Number(n || 0).toLocaleString("en-IN"); }
  function when(d) { return d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : ""; }
  function safeImg(src) { return /^(images\/|https:\/\/)/.test(src || "") ? src : ""; }

  BC.toast = function (msg, type) {
    var t = document.createElement("div");
    t.className = "bc-toast" + (type === "error" ? " error" : "");
    t.textContent = msg;
    $("#bc-toasts").appendChild(t);
    setTimeout(function () { t.remove(); }, 3500);
  };
  var api = function (m, p, b) { return BC.api.request(m, "/api/admin" + p, b); };
  var fail = function (e) { BC.toast(e.message || "Something went wrong", "error"); };
  var gate = $("#ad-gate");
  var products = [];

  /* login*/
  BC.setUser = function (user) {
    // auth.js calls this first, then sets BC.getIdToken
    setTimeout(function () { start(user); }, 0);
  };
  var started = false;
  function start(user) {
    if (!user) {
      gate.hidden = false; $("#ad-app").hidden = true; $("#ad-logout").hidden = true; $("#ad-who").textContent = "";
      gate.innerHTML = '<h2>Admin login required</h2><p>Log in with the admin account first.</p><a class="btn" href="login.html?next=admin.html">Log in</a>';
      return;
    }
    $("#ad-who").textContent = user.email || user.displayName || "";
    $("#ad-logout").hidden = false;
    if (!BC.api.enabled) {
      gate.innerHTML = "<h2>Backend not connected</h2><p>Open the site through <code>http://localhost:5000</code> with the backend running.</p>"; return;
    }
    api("GET", "/me").then(function () {
      if (started) return; started = true;
      gate.hidden = true; $("#ad-app").hidden = false;
      loadStats(); loadOrders();
    }).catch(function (e) {
      if (e.status === 403 && e.data && e.data.uid) {
        gate.innerHTML = "<h2>This account is not an admin yet</h2><p>Copy this ID into <code>ADMIN_UIDS</code> in <code>backend/.env</code>, then restart the backend:</p><p><code>" + esc(e.data.uid) + "</code></p>";
      } else gate.innerHTML = "<h2>Cannot open admin</h2><p>" + esc(e.message) + "</p>";
    });
  }
  $("#ad-logout").onclick = function () { if (BC.logout) BC.logout(); };

  /* tabs */
  var loaded = {};
  $("#ad-tabs").onclick = function (e) {
    var b = e.target.closest("button[data-tab]"); if (!b) return;
    var tab = b.dataset.tab;
    document.querySelectorAll("#ad-tabs button").forEach(function (x) { x.classList.toggle("on", x === b); });
    ["orders", "products", "messages", "subscribers"].forEach(function (t) { $("#tab-" + t).hidden = t !== tab; });
    if (tab === "products") loadProducts(); else if (tab === "messages") loadMessages(); else if (tab === "subscribers") loadSubs();
  };

  /* stats */
  function loadStats() {
    api("GET", "/stats").then(function (s) {
      var items = [["Orders", s.orders], ["Revenue (excl. cancelled)", money(s.revenue)], ["Products", s.products], ["Low stock (≤5)", s.lowStock, s.lowStock > 0], ["Unhandled messages", s.newMessages, s.newMessages > 0], ["Subscribers", s.subscribers]];
      $("#ad-stats").innerHTML = items.map(function (i) { return '<div class="stat' + (i[2] ? " warn" : "") + '"><span>' + esc(i[0]) + "</span><b>" + esc(i[1]) + "</b></div>"; }).join("");
    }).catch(fail);
  }

  /* orders status */
  var STATUSES = ["placed", "confirmed", "shipped", "delivered", "cancelled"];
  var orders = [];
  function loadOrders() {
    var f = $("#o-filter").value;
    api("GET", "/orders" + (f ? "?status=" + encodeURIComponent(f) : "")).then(function (list) { orders = list; drawOrders(); }).catch(fail);
  }
  function drawOrders() {
    var t = $("#o-table");
    if (!orders.length) { t.innerHTML = '<tr><td class="muted">No orders yet.</td></tr>'; return; }
    t.innerHTML = "<thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>" +
      orders.map(function (o) {
        var locked = o.status === "cancelled";
        return '<tr data-id="' + esc(o.id) + '"><td><b>' + esc(o.id) + "</b></td><td>" + esc(when(o.createdAt)) + "</td><td>" + esc(o.customer.name) + '<div class="muted">' + esc(o.customer.phone) + "</div></td><td>" +
          o.items.reduce(function (n, i) { return n + i.qty; }, 0) + "</td><td>" + money(o.total) + '</td><td><select data-status ' + (locked ? "disabled" : "") + ">" +
          STATUSES.map(function (s) { return "<option" + (s === o.status ? " selected" : "") + ">" + s + "</option>"; }).join("") + '</select></td><td><button type="button" data-detail>Details</button></td></tr>';
      }).join("") + "</tbody>";
  }
  $("#o-filter").onchange = loadOrders;
  $("#o-refresh").onclick = function () { loadOrders(); loadStats(); };
  $("#o-table").addEventListener("change", function (e) {
    var sel = e.target.closest("[data-status]"); if (!sel) return;
    var id = sel.closest("tr").dataset.id;
    if (sel.value === "cancelled" && !confirm("Cancel order " + id + "? Stock will be returned.")) { drawOrders(); return; }
    api("PATCH", "/orders/" + encodeURIComponent(id), { status: sel.value })
      .then(function () { BC.toast("Order updated"); loadOrders(); loadStats(); }).catch(function (er) { fail(er); loadOrders(); });
  });
  $("#o-table").addEventListener("click", function (e) {
    var b = e.target.closest("[data-detail]"); if (!b) return;
    var tr = b.closest("tr"), next = tr.nextElementSibling;
    if (next && next.classList.contains("detail")) { next.remove(); return; }
    var o = orders.find(function (x) { return x.id === tr.dataset.id; }); if (!o) return;
    var a = o.address;
    var d = document.createElement("tr"); d.className = "detail";
    d.innerHTML = '<td colspan="7"><b>Ship to:</b> ' + esc([a.line1, a.line2, a.city, a.state, a.pin, a.country].filter(Boolean).join(", ")) + "<br><b>Email:</b> " + esc(o.customer.email) + " · <b>Payment:</b> " + esc(o.payment).toUpperCase() +
      "<br>" + o.items.map(function (i) { return esc(i.title) + " (" + esc(i.size) + ") × " + i.qty + " = " + money(i.price * i.qty); }).join("<br>") + "</td>";
    tr.after(d);
  });

  /* products */
  function loadProducts() { api("GET", "/products").then(function (l) { products = l; drawProducts(); }).catch(fail); }
  function drawProducts() {
    $("#p-table").innerHTML = "<thead><tr><th></th><th>ID</th><th>Title</th><th>Price</th><th>Stock</th><th>Visible</th><th></th></tr></thead><tbody>" +
      products.map(function (p) {
        var img = safeImg(p.images && p.images[0]);
        return '<tr data-id="' + esc(p.id) + '"><td>' + (img ? '<img alt="" src="' + esc(img) + '" loading="lazy">' : "") + "</td><td>" + esc(p.id) + "</td><td>" + esc(p.title) +
          (p.stock <= 5 ? ' <span class="chip low">low</span>' : "") + "</td><td>" + money(p.price) + '</td><td><input type="number" min="0" step="1" value="' + p.stock + '" data-stock></td><td><input type="checkbox" data-active ' + (p.active ? "checked" : "") +
          '></td><td><button type="button" data-edit>Edit</button> <button type="button" class="danger" data-del>Delete</button></td></tr>';
      }).join("") + "</tbody>";
  }
  function patchProduct(id, fields) {
    return api("PUT", "/products/" + encodeURIComponent(id), fields).then(function () { BC.toast("Saved"); loadStats(); }).catch(function (e) { fail(e); loadProducts(); });
  }
  $("#p-table").addEventListener("change", function (e) {
    var id = e.target.closest("tr").dataset.id;
    if (e.target.matches("[data-stock]")) {
      var n = parseInt(e.target.value, 10);
      if (isNaN(n) || n < 0) { BC.toast("Stock must be 0 or more", "error"); loadProducts(); return; }
      patchProduct(id, { stock: n });
    } else if (e.target.matches("[data-active]")) patchProduct(id, { active: e.target.checked });
  });
  $("#p-table").addEventListener("click", function (e) {
    var tr = e.target.closest("tr"); if (!tr || !tr.dataset.id) return;
    var id = tr.dataset.id;
    if (e.target.matches("[data-edit]")) openForm(products.find(function (p) { return p.id === id; }));
    else if (e.target.matches("[data-del]") && confirm('Delete "' + id + '" permanently? (To just hide it, untick Visible instead.)'))
      api("DELETE", "/products/" + encodeURIComponent(id)).then(function () { BC.toast("Deleted"); loadProducts(); loadStats(); }).catch(fail);
  });

  var dlg = $("#p-dialog"), form = $("#p-form"), F = form.elements, editing = null;
  function lines(s) { return String(s || "").split("\n").map(function (x) { return x.trim(); }).filter(Boolean); }
  function openForm(p) {
    editing = p || null;
    form.reset(); $("#p-err").textContent = "";
    $("#p-title").textContent = p ? "Edit " + p.id : "Add product";
    F.id.readOnly = !!p;
    if (p) {
      F.id.value = p.id; F.title.value = p.title; F.price.value = p.price; F.stock.value = p.stock; F.category.value = p.category;
      F["tag-graphic"].checked = (p.tags || []).indexOf("graphic") > -1; F["tag-puff"].checked = (p.tags || []).indexOf("puff") > -1;
      F.isNew.checked = !!p.isNew; F.active.checked = !!p.active;
      F.images.value = (p.images || []).join("\n"); F.description.value = p.description || ""; F.specs.value = (p.specs || []).join("\n");
    } else { F.stock.value = 20; }
    dlg.showModal();
  }
  $("#p-add").onclick = function () { openForm(null); };
  $("#p-cancel").onclick = function () { dlg.close(); };
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var tags = []; if (F["tag-graphic"].checked) tags.push("graphic"); if (F["tag-puff"].checked) tags.push("puff");
    var data = {
      id: F.id.value.trim(), title: F.title.value.trim(), price: Number(F.price.value), stock: parseInt(F.stock.value, 10),
      category: F.category.value, tags: tags, isNew: F.isNew.checked, active: F.active.checked,
      images: lines(F.images.value), description: F.description.value.trim(), specs: lines(F.specs.value)
    };
    if (!data.id || !data.title || isNaN(data.price) || isNaN(data.stock)) { $("#p-err").textContent = "ID, title, price and stock are required."; return; }
    var bad = data.images.filter(function (i) { return !safeImg(i); });
    if (!data.images.length || bad.length) { $("#p-err").textContent = "Add at least one image; each must start with images/ or https://"; return; }
    var save = $("#p-save"); save.disabled = true;
    var req = editing ? api("PUT", "/products/" + encodeURIComponent(editing.id), (delete data.id, data)) : api("POST", "/products", data);
    req.then(function () { dlg.close(); BC.toast("Product saved"); loadProducts(); loadStats(); })
      .catch(function (er) { $("#p-err").textContent = er.message + (er.data && er.data.details ? " " + JSON.stringify(er.data.details) : ""); })
      .then(function () { save.disabled = false; });
  });

  /* messages / subscribers */
  function loadMessages() {
    api("GET", "/messages").then(function (list) {
      $("#m-list").innerHTML = list.length ? list.map(function (m) {
        return '<div class="msg' + (m.handled ? " done" : "") + '" data-id="' + esc(m._id) + '"><header><b>' + esc(m.name) + '</b><span class="muted">' + esc(when(m.createdAt)) + "</span></header><div class=\"muted\">" + esc(m.email) + (m.phone ? " · " + esc(m.phone) : "") + "</div><p>" + esc(m.message) +
          '</p><button type="button" data-handled="' + (m.handled ? "0" : "1") + '">' + (m.handled ? "Mark unhandled" : "Mark handled") + "</button></div>";
      }).join("") : '<p class="muted">No messages yet.</p>';
    }).catch(fail);
  }
  $("#m-list").addEventListener("click", function (e) {
    var b = e.target.closest("[data-handled]"); if (!b) return;
    api("PATCH", "/messages/" + encodeURIComponent(b.closest(".msg").dataset.id), { handled: b.dataset.handled === "1" }).then(function () { loadMessages(); loadStats(); }).catch(fail);
  });
  var emails = [];
  function loadSubs() {
    api("GET", "/subscribers").then(function (list) {
      emails = list.map(function (s) { return s.email; });
      $("#s-count").textContent = list.length + " subscriber" + (list.length === 1 ? "" : "s");
      $("#s-table").innerHTML = "<thead><tr><th>Email</th><th>Joined</th></tr></thead><tbody>" + list.map(function (s) { return "<tr><td>" + esc(s.email) + "</td><td>" + esc(when(s.createdAt)) + "</td></tr>"; }).join("") + "</tbody>";
    }).catch(fail);
  }
  $("#s-copy").onclick = function () {
    if (navigator.clipboard) navigator.clipboard.writeText(emails.join(", ")).then(function () { BC.toast("Copied " + emails.length + " emails"); }, function () { BC.toast("Copy failed", "error"); });
  };
})();
