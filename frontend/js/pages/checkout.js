// Checkout page
BC.ready.then(function () {
  var $ = function (s) { return document.querySelector(s); };
  var esc = BC.esc;
  var form = $("#co-form"), placed = false;

  function show() {
    if (placed) return;
    var lines = BC.cart.lines();
    $("#co-empty").hidden = lines.length > 0;
    $("#co-main").hidden = lines.length === 0;
    $("#co-items").innerHTML = lines.map(function (l) {
      return '<div class="co-item"><div class="co-img"><img src="' + esc(l.product.images[0]) + '" alt="' + esc(l.product.title) + '"><b>' + l.qty + "</b></div>" +
        '<div class="co-info"><span>' + esc(l.product.title) + "</span><small>Size " + esc(l.size) + "</small></div><span>" + BC.fmt(l.total) + "</span></div>";
    }).join("");
    $("#co-sub").textContent = $("#co-total").textContent = BC.fmt(BC.cart.subtotal());
  }
  document.addEventListener("bc:cart", show);
  show();

  /* keep what the customer typed while they go to log in, then restore it */
  var DRAFT = "bc_checkout_draft";
  function saveDraft() {
    var d = {}; Array.prototype.forEach.call(form.querySelectorAll("input[name]"), function (i) { d[i.name] = i.value; });
    try { sessionStorage.setItem(DRAFT, JSON.stringify(d)); } catch (e) { /* storage blocked */ }
  }
  try {
    var saved = JSON.parse(sessionStorage.getItem(DRAFT) || "null");
    if (saved) Object.keys(saved).forEach(function (k) { if (form.elements[k] && form.elements[k].type !== "radio") form.elements[k].value = saved[k]; });
  } catch (e) { /* ignore */ }

  /* checkout needs a login */
  var loginBox = $("#co-login");
  function showLogin(on) { loginBox.hidden = !on; if (on) loginBox.scrollIntoView({ behavior: "smooth", block: "center" }); }
  function whenKnown(cb) {
    if (BC.user !== undefined) { cb(BC.user); return; }
    var done = false, finish = function () { if (done) return; done = true; document.removeEventListener("bc:user", finish); cb(BC.user || null); };
    document.addEventListener("bc:user", finish); setTimeout(finish, 3000);
  }

  /* prefill from the logged-in Firebase user */
  document.addEventListener("bc:user", function () {
    if (BC.user) showLogin(false);
    if (!BC.user) return;
    if (!$("#co-email").value) $("#co-email").value = BC.user.email || "";
    if (!$("#co-name").value) $("#co-name").value = BC.user.displayName || "";
  });

  var rules = {
    name:  function (v) { return v.length >= 2 || "Please enter your full name"; },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Please enter a valid email"; },
    phone: function (v) { return /^[6-9]\d{9}$/.test(v) || "Enter a valid 10-digit mobile number"; },
    line1: function (v) { return v.length >= 5 || "Please enter your address"; },
    city:  function (v) { return v.length >= 2 || "Please enter your city"; },
    state: function (v) { return v.length >= 2 || "Please enter your state"; },
    pin:   function (v) { return /^[1-9]\d{5}$/.test(v) || "Enter a valid 6-digit PIN code"; }
  };
  function check(input) {
    var rule = rules[input.name]; if (!rule) return true;
    var r = rule(input.value.trim()), err = input.parentElement.querySelector(".err");
    input.classList.toggle("bad", r !== true); input.setAttribute("aria-invalid", r !== true);
    if (err) err.textContent = r === true ? "" : r;
    return r === true;
  }
  form.addEventListener("focusout", function (e) { if (e.target.matches("input")) check(e.target); });
  form.addEventListener("input", function (e) {
    if (e.target.name === "phone" || e.target.name === "pin") e.target.value = e.target.value.replace(/\D/g, "");
    if (e.target.classList.contains("bad")) check(e.target);
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var inputs = Array.prototype.slice.call(form.querySelectorAll("input[name]"));
    var firstBad = null;
    inputs.forEach(function (i) { if (!check(i) && !firstBad) firstBad = i; });
    if (firstBad) { firstBad.focus(); BC.toast("Please fix the highlighted fields.", "error"); return; }
    var lines = BC.cart.lines(); if (!lines.length) { show(); return; }

    whenKnown(function (user) {
      if (!user) { saveDraft(); showLogin(true); BC.toast("Please log in or sign up to place your order.", "error"); return; }
      send(lines);
    });
  });

  function send(lines) {
    var v = function (n) { return form.elements[n].value.trim(); };
    var total = BC.cart.subtotal();
    var order = {
      customer: { name: v("name"), email: v("email"), phone: v("phone"), uid: BC.user.uid },
      address: { line1: v("line1"), line2: v("line2"), city: v("city"), state: v("state"), pin: v("pin"), country: "India" },
      payment: "cod",
      items: lines.map(function (l) { return { id: l.id, size: l.size, qty: l.qty }; }),
      total: total
    };
    var btn = $("#co-submit"); btn.disabled = true; btn.textContent = "PLACING ORDER...";
    BC.api.placeOrder(order).then(function (res) {
      placed = true;
      order.total = res.total || total;
      BC.cart.clear();
      try { sessionStorage.removeItem(DRAFT); } catch (e2) { /* ignore */ }
      $("#co-main").hidden = true; $("#co-empty").hidden = true; $("#co-done").hidden = false;
      $("#done-id").textContent = res.id; $("#done-total").textContent = BC.fmt(res.total || total);
      $("#done-phone").textContent = "+91 " + order.customer.phone;
      $("#done-name").textContent = order.customer.name ? ", " + order.customer.name.split(" ")[0] : "";
      window.scrollTo({ top: 0, behavior: "smooth" });
    }).catch(function (e) {
      btn.disabled = false; btn.textContent = "PLACE ORDER";
      if (e && e.status === 401) { saveDraft(); showLogin(true); }
      BC.toast(e && e.message ? e.message : "Could not place your order. Please try again.", "error");
    });
  }
});
