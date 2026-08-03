# Oriental Carpet Gallery — Design Preview

This is a **static design preview** of the revamped site: a black & white, editorial-luxury
direction inspired by Abbas Carpets, built to showcase both the **Shop** (rugs for sale,
delivered/collected) and the **Gallery** (rare, permanent-collection pieces available by
enquiry only, no online price).

## Viewing it

No build step — open `index.html` directly, or serve the folder locally:

```
python3 -m http.server 8080
```

then visit `http://localhost:8080`.

## What's in here

- `index.html`, `shop.html`, `gallery.html`, `info.html`, `checkout.html` — top-level pages
- `shop/*.html` — one page per for-sale rug (Add to Cart)
- `gallery/*.html` — one page per gallery piece (Enquire only, no price/cart)
- `assets/css/style.css` — the full design system (colours, type, components)
- `assets/js/main.js` — mobile nav, cart drawer (localStorage), enquiry modal, forms

## Known placeholders (swap before launch)

- **Product photography**: every rug uses a plain tinted placeholder block with a text
  label — there is no real photography yet.
- **Catalogue data**: rug names, sizes, materials and prices are invented examples in
  `assets/../build` conventions, not your real stock.
- **Branch details** on the Info page (Somerset West, Claremont, Pretoria — addresses,
  phone, email, hours) were pulled from public search results about the current site,
  since the live site couldn't be fetched directly during this session. Please verify
  these against your actual current listings before publishing.
- **Cart & checkout are not connected to payment.** Add to Cart / quantities / the cart
  drawer are fully working client-side (localStorage), but "Checkout" leads to a
  placeholder page rather than a real payment flow.

## Next step: connecting it to WooCommerce

You mentioned the live site already runs on WordPress + WooCommerce — that's where real
payment (PayFast/Yoco/etc.), inventory, and order management already live, so the plan is:

1. Confirm this design direction (colours, layout, tone, the Shop/Gallery split).
2. Turn this into a WordPress child theme (recommended base: **Storefront**, the official
   WooCommerce parent theme) so the existing checkout, payment gateway, and order
   management keep working, with this look layered on top.
3. Map the "Gallery" concept onto a WooCommerce product tag/category (e.g. `gallery`)
   that hides price and Add to Cart and shows the Enquire form instead — same pattern
   used in this preview.
4. Replace placeholder art with real product photography and the real catalogue.
