// BreatheClo layout
window.BC = window.BC || {};


BC.social = [
  { label: "INSTAGRAM", href: "#" },
  { label: "PINTEREST", href: "#" },
  { label: "LINKEDIN",  href: "#" },
  { label: "FACEBOOK",  href: "#" }
];
BC.marquee = [
  "NEW DROP LAUNCHING ON DEC", "FREE SHIPPING", "WORLD WIDE SHIPPING", "CASH ON DELIVERY AVAILABLE",
  "SHIPPING ON SAME DAY", "SPECIAL DISCOUNTS FOR MEMBERS", "CUSTOMER SUPPORT", "LIMITED EDITION ITEMS",
  "FAST", "SECURE CHECKOUT", "TAG US"
];

(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  BC.esc = esc;

  /* toast  */
  BC.toast = function (msg, type) {
    var box = $("#bc-toasts");
    if (!box) { box = document.createElement("div"); box.id = "bc-toasts"; box.setAttribute("aria-live", "polite"); document.body.appendChild(box); }
    var t = document.createElement("div");
    t.className = "bc-toast" + (type ? " " + type : "");
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(function () { t.classList.add("out"); setTimeout(function () { t.remove(); }, 300); }, 3500);
  };

  /* markup  */
  var count = function (fn) { return BC.products.filter(fn).length; };
  var catLinks = BC.CATEGORIES.map(function (c) { return '<li><a href="shop.html?cat=' + c.id + '">' + c.label + "</a></li>"; }).join("");
  var footCatLinks = BC.CATEGORIES.map(function (c) { return '<li class="collect"><a href="shop.html?cat=' + c.id + '">' + c.label + "</a></li>"; }).join("");
  var socialLinks = BC.social.map(function (s) { return '<a href="' + s.href + '"' + (s.href !== "#" ? ' target="_blank" rel="noopener"' : "") + ">" + s.label + "</a>"; }).join("");
  var menuSocial = BC.social.slice(0, 3).map(function (s) { return '<a href="' + s.href + '"' + (s.href !== "#" ? ' target="_blank" rel="noopener"' : "") + ">" + s.label + "</a>"; }).join("");
  var marqueeText =BC.marquee.join(" • ");
  var marqueeItems = ""; for (var i = 0; i < 3; i++) BC.marquee.forEach(function (m) { marqueeItems += '<span class="marquee-item">' + m + "</span>"; });

  var headerHTML =
    '<div class="bc-overlay"></div>' +
    '<div class="announcement-bar">NEW DROP COMING SOON! SIGN UP FOR EXCLUSIVE UPDATES AND OFFERS.</div>' +
    '<header class="header">' +
      '<div class="logo"><a href="index.html" aria-label="BreatheClo home"><img src="images/Group 14.svg" alt="BreatheClo"></a></div>' +
      '<div class="cart-icon" role="button" tabindex="0" aria-label="Open cart"><i class="fa-solid fa-bag-shopping"></i><span class="cart-count">0</span></div>' +
      '<div class="cart-sidebar" aria-label="Shopping cart">' +
        '<span class="close-cart" role="button" tabindex="0" aria-label="Close cart">&times;</span>' +
        '<div class="cart-items"></div>' +
        '<div class="cart-footer">' +
          '<p class="cart-total">ESTIMATED TOTAL <span id="cart-total">₹0.00</span></p>' +
          '<button class="checkout-btn" type="button">Checkout</button>' +
        "</div>" +
        '<div class="empty-cart-message" style="display:none">' +
          '<p class="cart-title">YOUR CART IS EMPTY</p>' +
          '<button class="continue-shopping" type="button">CONTINUE SHOPPING</button>' +
          '<p class="login-text">HAVE AN ACCOUNT?</p>' +
          '<p class="login-link"><a href="login.html">LOG IN TO CHECK OUT FASTER.</a></p>' +
        "</div>" +
      "</div>" +
      '<nav class="nav-menu">' +
        '<a href="shop.html?filter=graphic" class="nav-item" id="item1">GRAPHIC TEES <span class="badge gray" data-badge="graphic">' + count(function (p) { return p.tags.indexOf("graphic") > -1; }) + "</span></a>" +
        '<a href="shop.html?filter=puff" class="nav-item" id="item2">PUFF PRINT TEES <span class="badge gray" data-badge="puff">' + count(function (p) { return p.tags.indexOf("puff") > -1; }) + "</span></a>" +
        '<a href="shop.html?filter=new" class="nav-item" id="item3">NEW ARRIVALS <span class="badge black" data-badge="new">' + count(function (p) { return p.isNew; }) + "</span></a>" +
      "</nav>" +
      '<form class="search-bar" role="search" action="shop.html" method="get">' +
        '<i class="fa-solid fa-magnifying-glass"></i>' +
        '<input type="text" name="q" placeholder="SEARCH HERE" autocomplete="off" aria-label="Search products">' +
      "</form>" +
      '<a href="shop.html" class="shop-all">SHOP ALL</a>' +
      '<div class="menu-btn" role="button" tabindex="0" aria-label="Open menu"><a href="#" class="menu">MENU</a><div class="menu-icon"><i class="fa-solid fa-bars"></i></div></div>' +
      '<div class="menu-window">' +
        '<span class="close-menu" role="button" tabindex="0" aria-label="Close menu">&times;</span>' +
        '<ul class="menu-list">' +
          '<li class="section-title"><strong>NEW DROPS</strong><span class="highlight">2025</span></li>' +
          '<li><a href="shop.html">ALL PRODUCTS</a></li>' + catLinks +
          '<li class="section-title" id="t1"><strong>ABOUT BREATHE</strong></li><li><a href="about.html">ABOUT</a></li>' +
          '<li class="section-title" id="t2"><strong>CONNECT</strong></li><li><a href="contact.html">CONTACT</a></li>' +
          '<li class="section-title" id="t3"><strong>MEMBER LOGIN</strong></li>' +
          '<li><a href="login.html" id="bc-account-link">LOGIN / SIGN UP</a><a href="#" id="bc-logout-link" hidden>LOGOUT</a></li>' +
          '<li><a href="account.html" id="bc-orders-link" hidden>MY ORDERS</a></li>' +
          "<li>" + menuSocial + "</li>" +
          '<li><a href="privacy.html">PRIVACY POLICY</a><a href="returnexchange.html">RETURN / REFUND</a></li>' +
        "</ul>" +
      "</div>" +
    "</header>";

  var footerHTML =
    '<div class="bar"><div class="marquee-content" data-text="' + esc(marqueeText) + '">' + marqueeItems + "</div></div>" +
    '<div class="footer-container">' +
      '<div class="footer-left">' +
        '<a href="index.html"><img src="images/Group 4.svg" alt="BreatheClo" class="logo1"></a>' +
        '<div class="subscribe-section">' +
          '<p class="subscribe-text">[ GET 10% EXTRA OFF ]</p>' +
          "<p>SUBSCRIBE TO BREATHECLO COMMUNITY</p>" +
          '<form class="subscribe-box" id="bc-subscribe" novalidate>' +
            '<input type="email" placeholder="YOUR EMAIL ADDRESS" class="email-input" aria-label="Email address" required>' +
            '<button class="subscribe-button" type="submit">SUBSCRIBE</button>' +
          "</form>" +
        "</div>" +
      "</div>" +
      '<div class="footer-divider"></div>' +
      '<div class="footer-right">' +
        '<div class="footer-column"><h3 class="collection-items">COLLECTIONS</h3><ul>' + footCatLinks + "</ul></div>" +
        '<div class="footer-column" id="customer"><h3 class="customer-section">CUSTOMER SERVICES</h3><ul>' +
          '<li class="cse"><a href="privacy.html">PRIVACY POLICY</a></li>' +
          '<li class="cse"><a href="returnexchange.html">RETURN &amp; EXCHANGES</a></li>' +
          '<li class="cse"><a href="contact.html">CONTACT US</a></li>' +
          '<li class="cse"><a href="terms.html">TERMS</a></li>' +
          '<li class="cse"><a href="shipping.html">SHIPPING</a></li>' +
          '<li class="cse"><a href="login.html">MEMBERS LOGIN</a></li>' +
        "</ul></div>" +
        '<div class="footer-column" id="brand"><h3 class="brand-section">BRAND</h3><ul>' +
          '<li class="brand"><a href="about.html">ABOUT BREATHE CLO</a></li>' +
          '<li class="brand" id="b1"><a href="privacy.html">PRIVACY POLICY</a></li>' +
          '<li class="brand" id="b2"><a href="terms.html">TERMS AND CONDITION</a></li>' +
        "</ul></div>" +
      "</div>" +
    "</div>" +
    '<div class="footer-social">' + socialLinks + "</div>" +
    '<div class="footer-bottom"><div>COPYRIGHT © 2025 BREATHECLO. ALL RIGHTS RESERVED</div>' +
      '<div class="footer-bottom-links"><a href="privacy.html">PRIVACY POLICY</a><a href="terms.html">TERMS AND CONDITIONS</a></div></div>' +
    '<section class="footer-parallex-section"></section>';

  document.body.insertAdjacentHTML("afterbegin", headerHTML);
  var mount = $("#bc-footer");
  if (mount) mount.outerHTML = footerHTML; else document.body.insertAdjacentHTML("beforeend", footerHTML);

  /* header scroll style */
  var header = $(".header");
  function onScroll() { header.classList.toggle("white", window.scrollY >= 50); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* drawers */
  var drawer = $(".cart-sidebar"), menuWin = $(".menu-window"), overlay = $(".bc-overlay");
  var menuIcon = $(".menu-icon i");
  function sync() {
    var open = drawer.classList.contains("active") || menuWin.classList.contains("open");
    overlay.classList.toggle("show", open);
    document.documentElement.classList.toggle("bc-lock", open);
  }
  BC.openCart = function () { closeMenu(); drawer.classList.add("active"); sync(); };
  function closeCart() { drawer.classList.remove("active"); sync(); }
  function closeMenu() { menuWin.classList.remove("open"); menuIcon.classList.replace("fa-times", "fa-bars"); sync(); }
  BC.closeCart = closeCart;

  function activate(el, fn) {
    el.addEventListener("click", fn);
    el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(e); } });
  }
  activate($(".cart-icon"), function () { drawer.classList.contains("active") ? closeCart() : BC.openCart(); });
  activate($(".close-cart"), closeCart);
  activate($(".close-menu"), closeMenu);
  activate($(".menu-btn"), function (e) {
    if (e && e.preventDefault) e.preventDefault();
    if (menuWin.classList.contains("open")) { closeMenu(); return; }
    closeCart(); menuWin.classList.add("open"); menuIcon.classList.replace("fa-bars", "fa-times"); sync();
  });
  overlay.addEventListener("click", function () { closeCart(); closeMenu(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeCart(); closeMenu(); } });
  menuWin.addEventListener("click", function (e) { if (e.target.closest("a")) closeMenu(); });

  $(".continue-shopping").addEventListener("click", function () {
    closeCart();
    if (!/shop\.html$/.test(location.pathname)) location.href = "shop.html";
  });
  $(".checkout-btn").addEventListener("click", function () { location.href = "checkout.html"; });

  /* cart rendering */
  var itemsBox = $(".cart-items"), footerBox = $(".cart-footer"), emptyBox = $(".empty-cart-message");
  var countEl = $(".cart-count"), totalEl = $("#cart-total");

  function renderCart() {
    var lines = BC.cart.lines();
    countEl.textContent = BC.cart.count();
    if (!lines.length) {
      itemsBox.innerHTML = ""; footerBox.style.display = "none"; emptyBox.style.display = "block"; return;
    }
    emptyBox.style.display = "none"; footerBox.style.display = "block";
    itemsBox.innerHTML = lines.map(function (l) {
      return '<div class="cart-item" data-key="' + esc(l.key) + '">' +
        '<a href="product.html?id=' + esc(l.id) + '"><img src="' + esc(l.product.images[0]) + '" alt="' + esc(l.product.title) + '"></a>' +
        '<div class="cart-item-info">' +
          '<p class="ci-title">' + esc(l.product.title) + "</p>" +
          "<p>" + BC.fmt(l.product.price) + "</p>" +
          '<p class="ci-meta">Size: ' + esc(l.size) + "</p>" +
          '<div class="qty-controls">' +
            '<button type="button" data-act="dec" aria-label="Decrease quantity">−</button>' +
            '<span aria-live="polite">' + l.qty + "</span>" +
            '<button type="button" data-act="inc" aria-label="Increase quantity">+</button>' +
            '<button type="button" class="ci-remove" data-act="remove">Remove</button>' +
          "</div>" +
        "</div></div>";
    }).join("");
    totalEl.textContent = BC.fmt(BC.cart.subtotal());
  }
  itemsBox.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-act]"); if (!btn) return;
    var key = btn.closest(".cart-item").dataset.key;
    var line = BC.cart.lines().find(function (l) { return l.key === key; }); if (!line) return;
    var act = btn.dataset.act;
    if (act === "inc") BC.cart.setQty(key, line.qty + 1);
    else if (act === "dec") BC.cart.setQty(key, line.qty - 1);
    else BC.cart.remove(key);
  });
  document.addEventListener("bc:cart", renderCart);
  renderCart();

 // keep several open tabs in sync
  BC.ready.then(function () {
    var counts = { graphic: count(function (p) { return p.tags.indexOf("graphic") > -1; }), puff: count(function (p) { return p.tags.indexOf("puff") > -1; }), "new": count(function (p) { return p.isNew; }) };
    document.querySelectorAll("[data-badge]").forEach(function (b) { b.textContent = counts[b.dataset.badge]; });
    renderCart();
  });

  /* search bar */
  var search = $(".search-bar"), sInput = $("input", search);
  var q = new URLSearchParams(location.search).get("q");
  if (q) { sInput.value = q; sInput.classList.add("active"); }
  var closeSearch = document.createElement("span");
  closeSearch.className = "close-search"; closeSearch.textContent = "×"; closeSearch.setAttribute("role", "button"); closeSearch.setAttribute("aria-label", "Close search");
  search.appendChild(closeSearch);
  var isMobile = function () { return window.matchMedia("(max-width: 978px)").matches; };
  $("i", search).addEventListener("click", function () {
    if (isMobile()) { search.classList.toggle("open"); if (search.classList.contains("open")) sInput.focus(); }
    else { sInput.classList.add("active"); sInput.focus(); }
  });
  sInput.addEventListener("click", function () { sInput.classList.add("active"); });
  sInput.addEventListener("focus", function () { sInput.classList.add("active"); });
  closeSearch.addEventListener("click", function () { sInput.classList.remove("active"); search.classList.remove("open"); sInput.value = ""; });
  search.addEventListener("submit", function (e) { if (!sInput.value.trim()) e.preventDefault(); });

  /* account */
  var accLink = $("#bc-account-link"), outLink = $("#bc-logout-link"), ordersLink = $("#bc-orders-link");
  BC.setUser = function (user) {
    var name = user ? (user.displayName || (user.email || "").split("@")[0] || "ACCOUNT") : "";
    try { user ? localStorage.setItem("bc_user_name", name) : localStorage.removeItem("bc_user_name"); } catch (e) { /* ignore */ }
    BC.user = user || null;
    accLink.textContent = user ? "HI, " + name.toUpperCase() : "LOGIN / SIGN UP";
    accLink.href = user ? "#" : "login.html";
    outLink.hidden = !user;
    ordersLink.hidden = !user;
    document.dispatchEvent(new CustomEvent("bc:user"));
  };
  outLink.addEventListener("click", function (e) { e.preventDefault(); if (BC.logout) BC.logout(); });
  try { var cached = localStorage.getItem("bc_user_name"); if (cached) { accLink.textContent = "HI, " + cached.toUpperCase(); accLink.href = "#"; outLink.hidden = false; ordersLink.hidden = false; } } catch (e) { /* ignore */ }

  /* newsletter */
  var sub = $("#bc-subscribe");
  if (sub) sub.addEventListener("submit", function (e) {
    e.preventDefault();
    var input = $("input", sub), email = input.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { BC.toast("Please enter a valid email address.", "error"); return; }
    BC.api.subscribe(email).then(function () { input.value = ""; BC.toast("Thanks for subscribing!"); })
      .catch(function () { BC.toast("Could not subscribe right now. Please try again.", "error"); });
  });
})();
