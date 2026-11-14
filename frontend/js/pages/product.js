/* product detail page: product.html?id=gd1 */
BC.ready.then(function () {
  var $ = function (s) { return document.querySelector(s); };
  var esc = BC.esc;
  var params = new URLSearchParams(location.search);
  var id = params.get("id") || params.get("product");      
  var p = BC.getProduct(id);

  if (!p) {
    $("#product-root").hidden = true;
    $("#not-found").hidden = false;
    document.title = "BreatheClo | Product not found";
    return;
  }

  document.title = "BreatheClo | " + p.title;
  $("#product-title").textContent = p.title;
  $("#product-price").textContent = BC.fmt(p.price);
  $("#product-description").textContent = p.description;
  var cat = BC.CATEGORIES.find(function (c) { return c.id === p.category; });
  var crumb = $("#crumb-cat"); crumb.textContent = cat ? cat.label : "ALL"; crumb.href = "shop.html" + (cat ? "?cat=" + cat.id : "");
  $("#product-specs").innerHTML = p.specs.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("");

  /* gallery: scroll-snap slider with arrows and a counter */
  var gal = $("#gallery");
  gal.innerHTML = p.images.map(function (src, i) {
    return '<img class="product-image" src="' + esc(src) + '" alt="' + esc(p.title) + " - photo " + (i + 1) + '"' + (i ? ' loading="lazy"' : "") + ">";
  }).join("");
  var nav = $("#gallery-nav"), n = p.images.length, cur = 0;
  $("#g-count").textContent = "1 / " + n;
  function show(i) {
    cur = (i + n) % n;
    gal.scrollTo({ left: gal.clientWidth * cur, behavior: "smooth" });
    $("#g-count").textContent = (cur + 1) + " / " + n;
  }
  if (n > 1) {
    nav.hidden = false;
    $("#g-prev").onclick = function () { show(cur - 1); };
    $("#g-next").onclick = function () { show(cur + 1); };
    gal.addEventListener("scroll", function () {
      var i = Math.round(gal.scrollLeft / Math.max(1, gal.clientWidth));
      if (i !== cur) { cur = i; $("#g-count").textContent = (cur + 1) + " / " + n; }
    }, { passive: true });
    gal.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") show(cur + 1); else if (e.key === "ArrowLeft") show(cur - 1);
    });
  }

  /* size + quantity */
  var size = null, qty = 1;
  var soldOut = p.stock === 0;                                   
  var maxQty = typeof p.stock === "number" ? Math.max(1, Math.min(10, p.stock)) : 10;
  if (typeof p.stock === "number" && p.stock > 0 && p.stock <= 5) $(".ship-note").textContent = "ONLY " + p.stock + " LEFT";
  var sizesBox = $("#sizes"), msg = $("#size-msg");
  sizesBox.innerHTML = BC.SIZES.map(function (s) { return '<button type="button" class="size-btn" role="radio" aria-checked="false" data-size="' + s + '">' + s + "</button>"; }).join("");
  sizesBox.addEventListener("click", function (e) {
    var b = e.target.closest(".size-btn"); if (!b) return;
    size = b.dataset.size; msg.textContent = ""; sizesBox.classList.remove("shake");
    sizesBox.querySelectorAll(".size-btn").forEach(function (x) { var on = x === b; x.classList.toggle("selected", on); x.setAttribute("aria-checked", on); });
  });
  $("#q-dec").onclick = function () { qty = Math.max(1, qty - 1); $("#q-val").textContent = qty; };
  $("#q-inc").onclick = function () { qty = Math.min(maxQty, qty + 1); $("#q-val").textContent = qty; };
  if (soldOut) {
    var btn = $(".add-to-cart"); btn.disabled = true; btn.textContent = "SOLD OUT";
    sizesBox.querySelectorAll(".size-btn").forEach(function (b) { b.disabled = true; });
  }

  $(".add-to-cart").addEventListener("click", function () {
    if (soldOut) return;
    if (!size) {
      msg.textContent = "Please select a size";
      sizesBox.classList.remove("shake"); void sizesBox.offsetWidth; sizesBox.classList.add("shake");
      return;
    }
    BC.cart.add(p.id, size, qty);
    BC.openCart();
  });

  /* related products*/
  var related = BC.products.filter(function (x) { return x.id !== p.id && x.category === p.category; });
  BC.products.forEach(function (x) { if (x.id !== p.id && related.indexOf(x) < 0 && related.length < 6) related.push(x); });
  related = related.slice(0, 6);
  if (related.length) {
    $("#related").innerHTML = related.map(function (x) {
      return '<a class="product related-card" href="product.html?id=' + esc(x.id) + '"><img src="' + esc(x.images[0]) + '" alt="' + esc(x.title) + '" loading="lazy">' +
        '<span class="rc-title">' + esc(x.title) + '</span><span class="rc-price">' + BC.fmt(x.price) + "</span></a>";
    }).join("");
    $("#related-section").hidden = false;
  }
});
