/* Oriental Carpet Gallery — shared interactivity
   Cart is client-side only (localStorage) for this design preview.
   Real checkout will be wired to WooCommerce. */

(function () {
  "use strict";

  var CART_KEY = "ocg_cart_preview";

  /* ---------- helpers ---------- */
  function readCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (e) {
      return [];
    }
  }
  function writeCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    renderCart();
  }
  function formatZAR(n) {
    return "R " + Number(n).toLocaleString("en-ZA", { minimumFractionDigits: 0 });
  }
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---------- mobile nav ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    var toggle = qs(".nav-toggle");
    var mobileNav = qs(".mobile-nav");
    if (toggle && mobileNav) {
      toggle.addEventListener("click", function () {
        mobileNav.classList.toggle("is-open");
      });
      qsa("a", mobileNav).forEach(function (a) {
        a.addEventListener("click", function () { mobileNav.classList.remove("is-open"); });
      });
    }

    /* ---------- cart drawer open/close ---------- */
    var scrim = qs(".overlay-scrim");
    var drawer = qs(".cart-drawer");
    function openCart() {
      drawer.classList.add("is-open");
      scrim.classList.add("is-open");
    }
    function closeCart() {
      drawer.classList.remove("is-open");
      scrim.classList.remove("is-open");
    }
    qsa("[data-open-cart]").forEach(function (btn) {
      btn.addEventListener("click", function (e) { e.preventDefault(); openCart(); });
    });
    qsa("[data-close-cart]").forEach(function (btn) {
      btn.addEventListener("click", closeCart);
    });
    if (scrim) scrim.addEventListener("click", function () {
      closeCart();
      closeModal();
    });

    /* ---------- add to cart ---------- */
    qsa("[data-add-to-cart]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var card = btn.closest("[data-product]");
        var product = card ? JSON.parse(card.getAttribute("data-product")) : JSON.parse(btn.getAttribute("data-product"));
        addToCart(product);
        openCart();
        showToast(product.title + " added to your cart");
      });
    });

    /* ---------- enquiry modal ---------- */
    var modal = qs(".modal");
    function openModal(piece) {
      if (!modal) return;
      if (piece) {
        var nameEl = qs("[data-modal-piece-name]", modal);
        var metaEl = qs("[data-modal-piece-meta]", modal);
        var hidden = qs("input[name='piece']", modal);
        if (nameEl) nameEl.textContent = piece.title;
        if (metaEl) metaEl.textContent = piece.meta || "";
        if (hidden) hidden.value = piece.title;
      }
      modal.classList.add("is-open");
      scrim.classList.add("is-open");
    }
    function closeModal() {
      if (modal) modal.classList.remove("is-open");
      if (scrim && !drawer.classList.contains("is-open")) scrim.classList.remove("is-open");
    }
    window.closeModal = closeModal;
    qsa("[data-open-enquiry]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var raw = btn.getAttribute("data-piece");
        var piece = raw ? JSON.parse(raw) : null;
        openModal(piece);
      });
    });
    qsa("[data-close-modal]").forEach(function (btn) {
      btn.addEventListener("click", closeModal);
    });
    var enquiryForm = qs("#enquiry-form");
    if (enquiryForm) {
      enquiryForm.addEventListener("submit", function (e) {
        e.preventDefault();
        closeModal();
        showToast("Enquiry sent — our team will be in touch shortly.");
        enquiryForm.reset();
      });
    }

    /* ---------- contact / newsletter forms (preview only) ---------- */
    qsa("[data-preview-form]").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        showToast(form.getAttribute("data-preview-form") || "Thank you — we'll be in touch.");
        form.reset();
      });
    });

    /* ---------- checkout placeholder ---------- */
    var checkoutBtn = qs("[data-checkout]");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", function (e) {
        e.preventDefault();
        showToast("Checkout & payment are being connected next — for now this is a design preview.");
      });
    }

    renderCart();
  });

  /* ---------- toast ---------- */
  var toastTimer;
  function showToast(msg) {
    var toast = qs(".toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("is-open");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("is-open"); }, 3200);
  }

  /* ---------- cart logic ---------- */
  function addToCart(product) {
    var items = readCart();
    var existing = items.find(function (i) { return i.id === product.id; });
    if (existing) {
      existing.qty += 1;
    } else {
      product.qty = 1;
      items.push(product);
    }
    writeCart(items);
  }

  function updateQty(id, delta) {
    var items = readCart();
    var item = items.find(function (i) { return i.id === id; });
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) items = items.filter(function (i) { return i.id !== id; });
    writeCart(items);
  }

  function removeItem(id) {
    var items = readCart().filter(function (i) { return i.id !== id; });
    writeCart(items);
  }

  function renderCart() {
    var items = readCart();
    var countEls = qsa("[data-cart-count]");
    var totalQty = items.reduce(function (sum, i) { return sum + i.qty; }, 0);
    countEls.forEach(function (el) {
      el.textContent = totalQty;
      el.style.display = totalQty > 0 ? "flex" : "none";
    });

    var body = qs("[data-cart-body]");
    var footer = qs("[data-cart-footer]");
    if (!body) return;

    if (items.length === 0) {
      body.innerHTML = '<div class="drawer-empty"><p class="eyebrow">Your cart is empty</p><p class="mt-12">Discover pieces from the collection.</p><a href="shop.html" class="text-link mt-24" style="display:inline-block">Shop the Collection</a></div>';
      if (footer) footer.style.display = "none";
      return;
    }
    if (footer) footer.style.display = "block";

    body.innerHTML = items.map(function (item) {
      return (
        '<div class="cart-line">' +
        '<div class="art art-tall" data-label="' + (item.artLabel || "Rug") + '"></div>' +
        '<div>' +
        '<div class="cart-line-title">' + item.title + '</div>' +
        '<div class="cart-line-meta">' + (item.meta || "") + '</div>' +
        '<div class="qty-row">' +
        '<button class="qty-btn" data-qty-minus="' + item.id + '">&minus;</button>' +
        '<span>' + item.qty + '</span>' +
        '<button class="qty-btn" data-qty-plus="' + item.id + '">+</button>' +
        '<button class="cart-line-remove" data-remove="' + item.id + '">Remove</button>' +
        '</div></div>' +
        '<div class="cart-line-price">' + formatZAR(item.price * item.qty) + '</div>' +
        '</div>'
      );
    }).join("");

    qsa("[data-qty-plus]", body).forEach(function (b) {
      b.addEventListener("click", function () { updateQty(b.getAttribute("data-qty-plus"), 1); });
    });
    qsa("[data-qty-minus]", body).forEach(function (b) {
      b.addEventListener("click", function () { updateQty(b.getAttribute("data-qty-minus"), -1); });
    });
    qsa("[data-remove]", body).forEach(function (b) {
      b.addEventListener("click", function () { removeItem(b.getAttribute("data-remove")); });
    });

    var subtotal = items.reduce(function (sum, i) { return sum + i.price * i.qty; }, 0);
    var subtotalEl = qs("[data-cart-subtotal]");
    if (subtotalEl) subtotalEl.textContent = formatZAR(subtotal);
  }
})();
