# BreatheClo (frontend)

Static storefront: plain HTML, CSS and vanilla JS.

## Run locally
Best: start the backend (see `../backend/README.md`) and open **http://localhost:5000**. The backend serves this folder too.
Frontend only: VS Code "Live Server" (or `python3 -m http.server 8000` here). The site then tries `http://localhost:5000` for the API and falls back to the built-in catalogue if it isn't running.
(Opening files by double-click will not work for login, because Firebase needs `http://`.)

## Pages
| File | Purpose |
|---|---|
| index.html | Home (Winter Launch) |
| shop.html | All products, filters (`?cat=`, `?filter=puff\|graphic\|new`), search (`?q=`) and sorting |
| product.html | Product page (`?id=gd1`): photos, size, quantity, add to cart, related items |
| checkout.html | Address form, order summary, place order (cash on delivery) |
| account.html | "My orders" for the logged-in customer |
| admin.html | Admin: orders, products/stock, messages, subscribers (admin UIDs only) |
| collection.html | Winter Launch lookbook |
| login / signin / forgot.html | Firebase accounts |
| about, contact, shipping, privacy, terms, returnexchange, 404 | Content pages |

## Where things live
- `js/data.js`: the built-in catalogue (used by `npm run seed` and as an offline fallback). With the backend, manage products in admin.html.
- `js/cart.js`: cart (saved in the browser, shared by every page).
- `js/layout.js`: header, cart drawer, menu, search and footer, injected on every page. Social links and the marquee text are at the top of this file.
- `js/api.js`: all server calls. Uses the backend when available (`js/config.js`); otherwise demo mode saves orders/messages in the browser.
- `js/auth.js`: Firebase login, signup, reset and logout.
- `js/pages/*.js`: code for one page each.
- `css/base.css` (shared header/footer), `css/components.css` (drawer, toast, buttons, responsive header/footer), then one stylesheet per page.

## Adding a product
Put photos in `images/`, then use admin.html → Products → Add product.
