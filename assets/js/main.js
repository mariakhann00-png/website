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
    var mobileNavClose = qs(".mobile-nav-close");
    if (toggle && mobileNav) {
      toggle.addEventListener("click", function () {
        mobileNav.classList.toggle("is-open");
      });
      qsa("a", mobileNav).forEach(function (a) {
        a.addEventListener("click", function () { mobileNav.classList.remove("is-open"); });
      });
    }
    if (mobileNavClose && mobileNav) {
      mobileNavClose.addEventListener("click", function () { mobileNav.classList.remove("is-open"); });
    }
    var caret = qs(".mobile-nav-caret");
    var subitems = qs(".mobile-nav-subitems");
    if (caret && subitems) {
      caret.addEventListener("click", function () {
        var open = subitems.classList.toggle("is-open");
        caret.classList.toggle("is-open", open);
        caret.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }

    /* ---------- scroll-reveal grids (e.g. The Difference) ---------- */
    if ("IntersectionObserver" in window) {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          entry.target.classList.toggle("is-visible", entry.isIntersecting);
        });
      }, { threshold: 0.25 });
      qsa("[data-reveal-grid]").forEach(function (el) { revealObserver.observe(el); });
    } else {
      qsa("[data-reveal-grid]").forEach(function (el) { el.classList.add("is-visible"); });
    }

    /* ---------- At Home: click/tap opens a full lightbox ---------- */
    var lightbox = qs("[data-at-home-lightbox]");
    if (lightbox) {
      var lbImg = qs(".lightbox-media img", lightbox);
      var lbLoc = qs(".lightbox-loc", lightbox);
      var lbDesc = qs(".lightbox-desc", lightbox);
      var openLightbox = function (item) {
        var img = qs("img", item);
        var loc = qs(".at-home-loc", item);
        var desc = qs(".at-home-desc", item);
        if (img) { lbImg.src = img.src; lbImg.alt = img.alt; }
        lbLoc.textContent = loc ? loc.textContent : "";
        lbDesc.textContent = desc ? desc.textContent : "";
        lightbox.classList.add("is-open");
        document.body.style.overflow = "hidden";
      };
      var closeLightbox = function () {
        lightbox.classList.remove("is-open");
        document.body.style.overflow = "";
      };
      qsa(".at-home-item").forEach(function (el) {
        el.addEventListener("click", function () { openLightbox(el); });
      });
      qsa("[data-lightbox-close]", lightbox).forEach(function (btn) {
        btn.addEventListener("click", closeLightbox);
      });
      lightbox.addEventListener("click", function (e) {
        if (e.target === lightbox) closeLightbox();
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeLightbox();
      });
    }

    /* ---------- "The [Month] Edit" always shows the current month ---------- */
    var monthEdit = qs("[data-month-edit]");
    if (monthEdit) {
      var monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
      monthEdit.textContent = "The " + monthNames[new Date().getMonth()] + " Edit";
    }

    /* ---------- nav goes solid once you scroll past the hero ---------- */
    var header = qs(".site-header");
    if (header && document.body.classList.contains("page-home")) {
      var toggleNavSolid = function () {
        header.classList.toggle("nav-solid", window.scrollY > window.innerHeight * 0.7);
      };
      toggleNavSolid();
      window.addEventListener("scroll", toggleNavSolid, { passive: true });
    }

    /* ---------- search overlay ---------- */
    var searchOverlay = qs(".search-overlay");
    var searchToggle = qs("[data-search-toggle]");
    if (searchToggle && searchOverlay) {
      searchToggle.addEventListener("click", function () {
        searchOverlay.classList.toggle("is-open");
        if (searchOverlay.classList.contains("is-open")) {
          var input = qs("input", searchOverlay);
          if (input) setTimeout(function () { input.focus(); }, 300);
        }
      });
      var searchForm = qs("form", searchOverlay);
      if (searchForm) {
        searchForm.addEventListener("submit", function (e) {
          e.preventDefault();
          var q = qs("input", searchForm).value.trim();
          if (q) window.location.href = "search.html?q=" + encodeURIComponent(q);
        });
      }
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") searchOverlay.classList.remove("is-open");
      });
      document.addEventListener("click", function (e) {
        if (searchOverlay.classList.contains("is-open") && !searchOverlay.contains(e.target) && !searchToggle.contains(e.target)) {
          searchOverlay.classList.remove("is-open");
        }
      });
    }

    /* ---------- shop / gallery filters ---------- */
    var grid = qs("[data-product-grid]");
    if (grid) {
      var state = { type: "All", size: "All", colour: "All", sort: "featured" };
      var chips = qsa("[data-filters] .chip");
      var sizeSelect = qs("[data-filter-size]");
      var colourSelect = qs("[data-filter-colour]");
      var sortSelect = qs("[data-sort-select]");
      var cards = qsa("[data-product-grid] > div");

      function apply() {
        cards.forEach(function (card) {
          var matches =
            (state.type === "All" || card.getAttribute("data-tag") === state.type) &&
            (state.size === "All" || card.getAttribute("data-size") === state.size) &&
            (state.colour === "All" || card.getAttribute("data-colour") === state.colour);
          card.style.display = matches ? "" : "none";
        });
        var sorted = cards.slice().sort(function (a, b) {
          if (state.sort === "price-asc") return (+a.getAttribute("data-price") || 0) - (+b.getAttribute("data-price") || 0);
          if (state.sort === "price-desc") return (+b.getAttribute("data-price") || 0) - (+a.getAttribute("data-price") || 0);
          if (state.sort === "newest") return (+b.getAttribute("data-year") || 0) - (+a.getAttribute("data-year") || 0);
          if (state.sort === "oldest") return (+a.getAttribute("data-year") || 0) - (+b.getAttribute("data-year") || 0);
          return (+a.getAttribute("data-order") || 0) - (+b.getAttribute("data-order") || 0);
        });
        sorted.forEach(function (card) { grid.appendChild(card); });
      }

      chips.forEach(function (chip) {
        chip.addEventListener("click", function () {
          chips.forEach(function (c) { c.classList.remove("active"); });
          chip.classList.add("active");
          state.type = chip.getAttribute("data-filter");
          apply();
        });
      });
      if (sizeSelect) sizeSelect.addEventListener("change", function () { state.size = sizeSelect.value; apply(); });
      if (colourSelect) colourSelect.addEventListener("change", function () { state.colour = colourSelect.value; apply(); });
      if (sortSelect) sortSelect.addEventListener("change", function () { state.sort = sortSelect.value; apply(); });

      var presetType = new URLSearchParams(window.location.search).get("type");
      if (presetType) {
        var presetChip = chips.filter(function (c) { return c.getAttribute("data-filter") === presetType; })[0];
        if (presetChip) {
          chips.forEach(function (c) { c.classList.remove("active"); });
          presetChip.classList.add("active");
          state.type = presetType;
        }
      }
      apply();
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

    /* ---------- in-page scroll targets (e.g. Our Branches, Contact Us) ---------- */
    var hash = window.location.hash;
    if (hash && hash.length > 1) {
      var target = document.getElementById(hash.slice(1));
      if (target) setTimeout(function () { target.scrollIntoView({ behavior: "smooth", block: "start" }); }, 60);
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
