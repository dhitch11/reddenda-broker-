/**
 * WHERE EVERY DOOR AND EVERY BUY BUTTON POINTS. One module, because the homepage
 * and the pricing page each defined these locally and the homepage's pricing
 * cards drifted: they sent a buyer who pressed a price to the SIGNUP DOOR
 * instead of the buy page. Measured 2026-08-26: the /pricing cards deep-linked
 * the buy page per plan (d95c023) while the homepage cards still read
 * "Create account" -> the door.
 *
 * ★ NO PRICE EVER RIDES IN A LINK. The plan is chosen on the buy page and the
 * amount is resolved server-side from the live Stripe catalog by lookup_key,
 * never from anything a browser sends. A slug in a fragment is not a price in a
 * URL: if the anchor is absent the buyer lands at the top of the buy page,
 * which can never be the reason a purchase fails.
 */

/** The app door. The free tier IS the door, so free CTAs point here. */
export const APP = "https://app.reddenda.com/broker";

/** The demo seat. No account, nothing to cancel. */
export const APP_DEMO = "https://app.reddenda.com/broker?demo=1";

/** The page where money is actually taken. Verified live 2026-08-26: h1
    "Priced flat, so it is easy to disclose", live Checkout by lookup_key. */
export const BUY = "https://app.reddenda.com/broker/console/upgrade";

/** Each plan card on the buy page carries `id={slug}`, so a fragment lands the
    buyer on the plan whose price they just pressed. */
export const BUY_PRO_MONTHLY = `${BUY}#pro_monthly`;
export const BUY_AGENCY = `${BUY}#agency_annual`;
