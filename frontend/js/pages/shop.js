/* shop page: shop.html?cat=tshirt | ?filter=graphic|puff|new | ?q=search words */
BC.ready.then(function () {
  var $ = function (s) { return document.querySelector(s); };
  var esc = BC.esc;
  var params = new URLSearchParams(location.search);
  var state = { cat: params.get("cat") || "", filter: params.get("filter") || "", q: (params.get("q") || "").trim(), sort: "featured" };

  var FILTERS = [
    { key: "", label: "ALL" },
    { key: "cat:tshirt", label: "T-SHIRT" }, { key: "cat:shirt", label: "SHIRT" },
    { key: "cat:sweatshirt", label: "SWEATSHIRT" }, { key: "cat:cordset", label: "CORD SETS" },
    { key: "cat:accessories", label: "ACCESSORIES" },
    { key: "filter:graphic", label: "GRAPHIC TEES" }, { key: "filter:puff", label: "PUFF PRINT" }, { key: "filter:new", label: "NEW ARRIVALS" }
  ];
  function activeKey() { return state.cat ? "cat:" + state.cat : state.filter ? "filter:" + state.filter : ""; }

  function matches(p) {
    if (state.cat && p.category !== state.cat) return false;
    if (state.filter === "new" && !p.isNew) return false;
    if (state.filter && state.filter !== "new" && p.tags.indexOf(state.filter) < 0) return false;
    if (state.q) {
      var hay = (p.title + " " + p.description + " " + p.category + " " + p.tags.join(" ")).toLowerCase();
      return state.q.toLowerCase().split(/\s+/).every(function (w) { return hay.indexOf(w) > -1; });
    }
    return true;
  }
  function sorted(list) {
    var l = list.slice();
    if (state.sort === "low") l.sort(function (a, b) { return a.price - b.price; });
    else if (state.sort === "high") l.sort(function (a, b) { return b.price - a.price; });
    else if (state.sort === "az") l.sort(function (a, b) { return a.title.localeCompare(b.title); });
    else if (state.sort === "new") l.sort(function (a, b) { return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0); });
    return l;
  }

  function render() {
    var list = sorted(BC.products.filter(matches));
    var key = activeKey();
    var label = (FILTERS.find(function (f) { return f.key === key; }) || FILTERS[0]).label;

    $("#shop-title").textContent = state.q ? "SEARCH RESULTS" : (key ? label : "SHOP ALL");
    $("#shop-sub").textContent = state.q
      ? list.length + " result" + (list.length === 1 ? "" : "s") + ' for "' + state.q + '"'
      : list.length + " product" + (list.length === 1 ? "" : "s");
    document.title = "BreatheClo | " + $("#shop-title").textContent.replace(/\b\w/g, function (c) { return c; });

    $("#chips").innerHTML = FILTERS.map(function (f) {
      return '<button type="button" class="chip' + (f.key === key && !state.q ? " on" : "") + '" data-key="' + f.key + '">' + f.label + "</button>";
    }).join("");

    $("#grid").innerHTML = list.map(function (p) {
      var second = p.images[1] || p.images[0];
      return '<a class="card" href="product.html?id=' + esc(p.id) + '">' +
        '<div class="card-img"><img class="a" src="' + esc(p.images[0]) + '" alt="' + esc(p.title) + '" loading="lazy">' +
        (second !== p.images[0] ? '<img class="b" src="' + esc(second) + '" alt="" loading="lazy">' : "") +
        (p.stock === 0 ? '<span class="tag soldout">SOLD OUT</span>' : p.isNew ? '<span class="tag">NEW</span>' : "") + "</div>" +
        '<div class="card-info"><span class="card-title">' + esc(p.title) + '</span><span class="card-price">' + BC.fmt(p.price) + "</span></div></a>";
    }).join("");

    var empty = !list.length;
    $("#empty").hidden = !empty; $("#grid").hidden = empty;
    if (empty) {
      var comingSoon = state.cat === "accessories" && !state.q;
      $("#empty-title").textContent = comingSoon ? "ACCESSORIES COMING SOON" : "NO PRODUCTS FOUND";
      $("#empty-text").textContent = comingSoon ? "This collection is being prepared. Check back soon." : "Try a different search or filter.";
    }
  }

  $("#chips").addEventListener("click", function (e) {
    var b = e.target.closest(".chip"); if (!b) return;
    var k = b.dataset.key, parts = k.split(":");
    state.q = ""; state.cat = parts[0] === "cat" ? parts[1] : ""; state.filter = parts[0] === "filter" ? parts[1] : "";
    var url = k ? "?" + (parts[0] === "cat" ? "cat=" : "filter=") + parts[1] : location.pathname;
    history.replaceState(null, "", url);
    var si = document.querySelector(".search-bar input"); if (si) si.value = "";
    render();
  });
  $("#sort").addEventListener("change", function (e) { state.sort = e.target.value; render(); });
  render();
});
