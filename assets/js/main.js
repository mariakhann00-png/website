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
    qsa(".mobile-nav-caret").forEach(function (caret) {
      var block = caret.closest(".mobile-nav-block");
      var subitems = block && qs(".mobile-nav-subitems", block);
      if (!subitems) return;
      caret.addEventListener("click", function () {
        var open = subitems.classList.toggle("is-open");
        caret.classList.toggle("is-open", open);
        caret.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });

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

    /* ---------- Behind the Threads: fade/rise text blocks into view ---------- */
    var revealEls = qsa("[data-reveal]");
    if (revealEls.length) {
      if ("IntersectionObserver" in window) {
        var singleReveal = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-in");
              singleReveal.unobserve(entry.target);
            }
          });
        }, { threshold: 0.2 });
        revealEls.forEach(function (el) { singleReveal.observe(el); });
      } else {
        revealEls.forEach(function (el) { el.classList.add("is-in"); });
      }
    }

    /* ---------- Behind the Threads: scroll-linked journey timeline ---------- */
    var journeySteps = qsa(".journey-step");
    var journeyImgs = qsa(".journey-img");
    var journeyMedia = qs(".journey-media");
    if (journeySteps.length && journeyImgs.length) {
      var setJourneyActive = function (i) {
        journeySteps.forEach(function (el) { el.classList.toggle("is-active", el.dataset.journeyStep === i); });
        var activeImg = null;
        journeyImgs.forEach(function (el) {
          var isActive = el.dataset.journeyImg === i;
          el.classList.toggle("is-active", isActive);
          if (isActive) activeImg = el;
        });
        if (journeyMedia) journeyMedia.classList.toggle("is-wide", !!(activeImg && activeImg.dataset.aspect === "wide"));
      };
      var journeyTicking = false;
      var updateJourneyActive = function () {
        journeyTicking = false;
        var center = window.innerHeight * 0.42;
        var closest = null, closestDist = Infinity;
        journeySteps.forEach(function (el) {
          var rect = el.getBoundingClientRect();
          var mid = rect.top + rect.height / 2;
          var dist = Math.abs(mid - center);
          if (dist < closestDist) { closestDist = dist; closest = el; }
        });
        if (closest) setJourneyActive(closest.dataset.journeyStep);
      };
      var onJourneyScroll = function () {
        if (!journeyTicking) { journeyTicking = true; requestAnimationFrame(updateJourneyActive); }
      };
      window.addEventListener("scroll", onJourneyScroll, { passive: true });
      window.addEventListener("resize", onJourneyScroll);
      updateJourneyActive();

      var jumpToJourneyStep = function (el) {
        var rect = el.getBoundingClientRect();
        var y = window.scrollY + rect.top - window.innerHeight * 0.42 + rect.height / 2;
        window.scrollTo({ top: y, behavior: "smooth" });
      };
      journeySteps.forEach(function (el) {
        el.addEventListener("click", function () { jumpToJourneyStep(el); });
        el.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); jumpToJourneyStep(el); }
        });
      });
    }

    /* ---------- The Art of the Persian Rug: autoplaying video, click to pause/resume ---------- */
    qsa("[data-craft-video]").forEach(function (wrap) {
      var video = qs("video", wrap);
      if (!video) return;
      var tryAutoplay = function () {
        var p = video.play();
        if (p && p.catch) p.catch(function () {});
      };
      if (video.readyState >= 2) tryAutoplay();
      else video.addEventListener("loadeddata", tryAutoplay, { once: true });
      wrap.addEventListener("click", function () {
        if (video.paused) {
          video.muted = false;
          video.play();
        } else {
          video.pause();
        }
      });
      video.addEventListener("play", function () { wrap.classList.add("is-playing"); });
      video.addEventListener("pause", function () { wrap.classList.remove("is-playing"); });
      video.addEventListener("ended", function () { wrap.classList.remove("is-playing"); });
    });

    /* ---------- Cover hero: split/zoom reaction on hover ---------- */
    qsa(".cover-panel").forEach(function (el) {
      el.addEventListener("mouseenter", function () { el.classList.add("is-hovering"); });
      el.addEventListener("mouseleave", function () { el.classList.remove("is-hovering"); });
    });

    /* ---------- Why Choose Us: motif zoom on hover (desktop) or tap (touch/iPad) ----------
       iPadOS reports (hover: hover) as true even on touch-only use (it just means a
       trackpad/mouse COULD be attached), so that media query alone wrongly sends iPads
       down the mouseenter/mouseleave path, where a finger tap never fires anything.
       Checking touch capability directly is the reliable signal here. */
    var diffCols = qsa(".diff-col");
    var isTouchCapable = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    var supportsHover = window.matchMedia("(hover: hover)").matches && !isTouchCapable;
    diffCols.forEach(function (el) {
      if (supportsHover) {
        el.addEventListener("mouseenter", function () { el.classList.add("is-active"); });
        el.addEventListener("mouseleave", function () { el.classList.remove("is-active"); });
      } else {
        el.addEventListener("click", function () {
          var wasActive = el.classList.contains("is-active");
          diffCols.forEach(function (other) { other.classList.remove("is-active"); });
          if (!wasActive) el.classList.add("is-active");
        });
      }
    });

    /* ---------- At Home: click/tap opens a full lightbox ---------- */
    var lightbox = qs("[data-at-home-lightbox]");
    if (lightbox) {
      var lbImg = qs(".lightbox-media img", lightbox);
      var lbLoc = qs(".lightbox-loc", lightbox);
      var lbDesc = qs(".lightbox-desc", lightbox);
      var lbCaption = qs(".lightbox-caption", lightbox);
      var alignCaptionToImage = function () {
        var mediaRect = lbImg.parentElement.getBoundingClientRect();
        var imgRect = lbImg.getBoundingClientRect();
        if (!imgRect.width) return;
        lbCaption.style.marginLeft = (imgRect.left - mediaRect.left) + "px";
        lbCaption.style.width = imgRect.width + "px";
      };
      var openLightbox = function (item) {
        var img = qs("img", item);
        var loc = qs(".at-home-loc", item);
        var desc = qs(".at-home-desc", item);
        if (img) { lbImg.src = img.src; lbImg.alt = img.alt; }
        lbLoc.textContent = loc ? loc.textContent : "";
        lbDesc.textContent = desc ? desc.textContent : "";
        lightbox.classList.add("is-open");
        document.body.style.overflow = "hidden";
        if (lbImg.complete) alignCaptionToImage();
        else lbImg.onload = alignCaptionToImage;
      };
      var closeLightbox = function () {
        lightbox.classList.remove("is-open");
        document.body.style.overflow = "";
      };
      window.addEventListener("resize", function () {
        if (lightbox.classList.contains("is-open")) alignCaptionToImage();
      });
      qsa(".at-home-item").forEach(function (el) {
        el.addEventListener("click", function () { openLightbox(el); });
        el.addEventListener("mouseenter", function () { el.classList.add("is-hovering"); });
        el.addEventListener("mouseleave", function () { el.classList.remove("is-hovering"); });
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

    /* ---------- Product detail photo: zoom toward the cursor on hover ---------- */
    qsa(".product-photo-lg").forEach(function (container) {
      var img = qs("img", container);
      if (!img) return;
      container.addEventListener("mousemove", function (e) {
        var r = container.getBoundingClientRect();
        var x = ((e.clientX - r.left) / r.width) * 100;
        var y = ((e.clientY - r.top) / r.height) * 100;
        img.style.transformOrigin = x + "% " + y + "%";
      });
      container.addEventListener("mouseenter", function () { img.classList.add("is-zoomed"); });
      container.addEventListener("mouseleave", function () {
        img.classList.remove("is-zoomed");
        img.style.transformOrigin = "";
      });
    });

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
      var state = { type: "All", size: "All", colour: "All", rugType: "All", sort: "featured" };
      var chips = qsa("[data-filters] .chip");
      var sizeSelect = qs("[data-filter-size]");
      var colourSelect = qs("[data-filter-colour]");
      var rugTypeSelect = qs("[data-filter-rug-type]");
      var sortSelect = qs("[data-sort-select]");
      var cards = qsa("[data-product-grid] > div");

      var collectionHeading = qs("[data-collection-heading]");
      var collectionDesc = qs("[data-collection-desc]");
      var COLLECTION_COPY = {
        "All": { heading: "The Collection", desc: "Explore our current collection of carpets, carefully selected for their quality, design and character. Enquire with us for further details." },
        "Traditional": { heading: "Traditional", desc: "Timeless carpets rooted in centuries of Persian artistry, featuring intricate motifs, rich colour palettes and enduring craftsmanship." },
        "Transitional": { heading: "Transitional", desc: "A refined balance between heritage and modernity, blending traditional Persian motifs with softer palettes and contemporary sensibilities." },
        "Contemporary": { heading: "Contemporary", desc: "Modern expressions of carpet artistry, defined by bold compositions, understated palettes and a fresh approach to timeless craftsmanship." },
        "Kilims and Flatweaves": { heading: "Kilims & Flatweaves", desc: "Woven without a pile, these versatile carpets celebrate texture, geometric design and the beauty of traditional weaving techniques." },
        "Machine Made": { heading: "Machine Made", desc: "Precisely crafted for contemporary living, offering the look and feel of a fine carpet with consistency, practicality and accessibility." }
      };
      function updateCollectionCopy(type) {
        if (!collectionHeading || !collectionDesc) return;
        var copy = COLLECTION_COPY[type] || COLLECTION_COPY["All"];
        collectionHeading.textContent = copy.heading;
        collectionDesc.textContent = copy.desc;
      }

      function apply() {
        cards.forEach(function (card) {
          var matches =
            (state.type === "All" || card.getAttribute("data-tag") === state.type) &&
            (state.size === "All" || card.getAttribute("data-size") === state.size) &&
            (state.colour === "All" || card.getAttribute("data-colour") === state.colour) &&
            (state.rugType === "All" || card.getAttribute("data-rug-type") === state.rugType);
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
          updateCollectionCopy(state.type);
          apply();
        });
      });
      if (sizeSelect) sizeSelect.addEventListener("change", function () { state.size = sizeSelect.value; apply(); });
      if (colourSelect) colourSelect.addEventListener("change", function () { state.colour = colourSelect.value; apply(); });
      if (rugTypeSelect) rugTypeSelect.addEventListener("change", function () { state.rugType = rugTypeSelect.value; apply(); });
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
      updateCollectionCopy(state.type);
      apply();
    }

    /* ---------- cart drawer open/close ---------- */
    var scrim = qs(".overlay-scrim");
    var drawer = qs(".cart-drawer");
    function syncBodyScrollLock() {
      var anyOpen = (drawer && drawer.classList.contains("is-open")) || (modal && modal.classList.contains("is-open"));
      document.body.style.overflow = anyOpen ? "hidden" : "";
    }
    function openCart() {
      drawer.classList.add("is-open");
      scrim.classList.add("is-open");
      syncBodyScrollLock();
    }
    function closeCart() {
      drawer.classList.remove("is-open");
      scrim.classList.remove("is-open");
      syncBodyScrollLock();
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
    var messageEl = qs("[data-modal-message]", modal);
    var defaultPlaceholder = messageEl ? messageEl.placeholder : "";
    function openModal(piece) {
      if (!modal) return;
      if (piece) {
        var nameEl = qs("[data-modal-piece-name]", modal);
        var metaEl = qs("[data-modal-piece-meta]", modal);
        var noteEl = qs("[data-modal-piece-note]", modal);
        var hidden = qs("input[name='piece']", modal);
        if (nameEl) nameEl.textContent = piece.title;
        if (metaEl) metaEl.textContent = piece.meta || "";
        if (hidden) hidden.value = piece.title;
        if (noteEl) noteEl.hidden = !piece.id;
        if (messageEl) messageEl.placeholder = piece.placeholder || defaultPlaceholder;
      }
      modal.classList.add("is-open");
      scrim.classList.add("is-open");
      syncBodyScrollLock();
    }
    function closeModal() {
      if (modal) modal.classList.remove("is-open");
      if (scrim && !drawer.classList.contains("is-open")) scrim.classList.remove("is-open");
      syncBodyScrollLock();
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
      body.innerHTML = '<div class="drawer-empty"><p class="eyebrow">Your cart is empty</p><p class="mt-12">Discover pieces from the collection.</p><a href="shop.html" class="text-link mt-24" style="display:inline-block">Shop Online</a></div>';
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
