/* "My orders" page: shows the logged-in customer's orders */
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var esc = BC.esc, loaded = false;

  function show(which) {
    ["#acc-login", "#acc-empty", "#acc-error"].forEach(function (s) { $(s).hidden = s !== which; });
  }
  function date(iso) {
    var d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }
  function card(o) {
    var total = o.total != null ? o.total : (o.items || []).reduce(function (s, i) { return s + (i.price || 0) * i.qty; }, 0);
    return '<article class="order">' +
      '<header><div><b>' + esc(o.id) + "</b><small>" + date(o.createdAt) + '</small></div><span class="status ' + esc(o.status) + '">' + esc(o.status) + "</span></header>" +
      (o.items || []).map(function (i) {
        return '<div class="line">' + (i.image ? '<img src="' + esc(i.image) + '" alt="">' : "") +
          "<span>" + esc(i.title || i.id) + "<small>Size " + esc(i.size) + " &times; " + i.qty + "</small></span>" +
          "<span>" + (i.price != null ? BC.fmt(i.price * i.qty) : "") + "</span></div>";
      }).join("") +
      '<footer><span>Cash on delivery</span><b>Total ' + BC.fmt(total) + "</b></footer>" +
      (o.status === "placed" || o.status === "confirmed" ? '<div class="cancel-row"><button type="button" class="cancel-btn" data-cancel="' + esc(o.id) + '">Cancel order</button></div>' : "") + "</article>";
  }

  function load() {
    if (loaded) return; loaded = true;
    $("#acc-sub").textContent = "Hi, " + (BC.user.displayName || BC.user.email || "there");
    BC.api.myOrders().then(function (orders) {
      if (!orders.length) { show("#acc-empty"); return; }
      show(null);
      $("#acc-list").innerHTML = orders.map(card).join("");
    }).catch(function (e) {
      loaded = false; $("#acc-error-text").textContent = e.message; show("#acc-error");
    });
  }

  $("#acc-list").addEventListener("click", function (e) {
    var b = e.target.closest("[data-cancel]"); if (!b) return;
    if (!confirm("Cancel order " + b.dataset.cancel + "?")) return;
    b.disabled = true; b.textContent = "Cancelling...";
    BC.api.cancelOrder(b.dataset.cancel).then(function () {
      BC.toast("Order cancelled."); loaded = false; load();
    }).catch(function (er) {
      BC.toast(er.message, "error"); loaded = false; load();
    });
  });

  function update() {
    if (BC.user) { load(); return; }
    $("#acc-sub").textContent = ""; $("#acc-list").innerHTML = ""; show("#acc-login");
  }
  document.addEventListener("bc:user", update);
  setTimeout(function () { if (BC.user === undefined) update(); }, 5000);
})();
