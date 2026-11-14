# BreatheClo backend

Node + Express + MongoDB API. Firebase still handles login; this server only *checks* the Firebase token.
It also serves the website, so **http://localhost:5000 is the whole site**.

## Run it on Windows

1. Make sure MongoDB is running (Compass connecting to `mongodb://127.0.0.1:27017` means it is).
2. In this `backend` folder:
   ```
   copy .env.example .env
   npm install
   npm run seed
   npm start
   ```
3. Open http://localhost:5000

`npm run seed` loads the 21 products into MongoDB with stock 50 each (safe to run again; it only adds missing ones; `npm run seed -- --force` refreshes product details but keeps stock).

## Become admin

1. Open the site, sign up / log in with your own account.
2. Go to http://localhost:5000/admin.html. It shows "This account is not an admin yet" with your **UID**.
   (Same UID is in Firebase console → Authentication → Users.)
3. Put it in `backend/.env`: `ADMIN_UIDS=<your uid>` (several: comma separated), restart `npm start`, refresh admin.html.

Admin page: see/update orders (cancelling returns stock), add/edit/hide/delete products, change stock, read contact messages, copy newsletter emails.

## What the API does

| Endpoint | Who | Purpose |
|---|---|---|
| `GET /api/products` | anyone | visible catalogue with stock |
| `POST /api/orders` | anyone (login optional) | place a COD order; prices and stock are checked on the server |
| `GET /api/orders/mine` | logged in | the customer's orders |
| `POST /api/contact`, `/api/subscribe` | anyone | forms (rate limited) |
| `/api/admin/*` | admin UIDs only | the admin page |

Stock is reserved atomically, so two people can't buy the last item.

## Tests

`npm test` runs 15 API tests on a throwaway database (needs MongoDB running; set `TEST_MONGODB_URI` if it isn't on the default port).

## Notes

- Only Cash on Delivery for now. Online payment (e.g. Razorpay) is a later step.
- If the backend is not running, opening the frontend files directly still works in demo mode (orders are stored in the browser only).
- Never commit `.env`. The root `.gitignore` already excludes it and `node_modules`.
