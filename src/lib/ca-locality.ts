/**
 * THE CALIFORNIA CBSA -> MEDICARE LOCALITY CROSSWALK, marketing-side port.
 * @BROKER-MARKETING, 2026-08-26, under Bulletin 2 #5: "make the marketing page
 * read the same locality anchors as the app (one source of truth)."
 *
 * The app resolves a California metro to its CMS locality through
 * `reddenda-app/src/lib/broker/ca-locality.ts` over the seed file
 * `src/demo/seed/ca-locality.json`, which this repo carries byte-identically
 * (same provenance note inside: "REAL public CMS Physician Fee Schedule at
 * California LOCALITY grain. Not fabricated."). This module ports the CROSSWALK
 * only: cbsa -> locality code -> locality name. The dollar figures themselves
 * come from `medicare_locality_cpt_rate_fixed` at query time, never from the
 * seed, so both hosts price off the same table at the same grain.
 */
import loc from "@/demo/seed/ca-locality.json";

type LocalityFile = {
  cbsa_to_locality: Record<string, string>;
  rest_of_ca: string;
  meta: Record<string, { name: string; w: number; pe: number; mp: number }>;
};

/* The JSON module's arrays widen past the tuple the full file declares; this
   port only reads the three fields above, so the assertion is narrow and true. */
const CA = loc as unknown as LocalityFile;

/** The CMS locality code for a California CBSA. Null for any non-CA metro. */
export function caLocalityCodeFor(cbsa: string): string | null {
  if (!cbsa) return null;
  return CA.cbsa_to_locality[cbsa.trim()] ?? null;
}

/** Sacramento. The app's own CA default when a caller names no market, chosen
    because it is the room this product is sold into, and only honest because
    every consumer prints WHICH locality it was served. */
export const CA_DEFAULT_LOCALITY = "63";
