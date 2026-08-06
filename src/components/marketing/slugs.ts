import { METROS, type Metro } from "@/lib/metros";
import { SERVICES, type Service } from "@/lib/catalog";

/**
 * URL IDENTITY FOR THE PROGRAMMATIC PAGES.
 *
 * These slugs become permanent public URLs. Once one is indexed and linked from a
 * broker's email, changing it costs us the link. So the rules are strict:
 *
 *  1. Derived from stable source fields, never from anything editorial.
 *  2. Collisions are a BUILD-TIME ERROR, not a runtime surprise. Two metros
 *     resolving to one slug would silently serve one market's prices under the
 *     other's name, which is the worst defect this product could ship. The maps
 *     below throw on construction rather than let that exist.
 *  3. Human readable. "brain-mri-cost-in-chicago-il" is a URL a broker will paste
 *     into an email without embarrassment. A CBSA code is not.
 *
 * Metro slugs use the primary city plus the primary state, because the official
 * OMB names are long and multi-state ("Chicago-Naperville-Elgin, IL-IN"). The
 * primary city plus state is unique across the metros we carry, and the assertion
 * below is what proves that rather than assumes it.
 */

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** "Chicago-Naperville-Elgin, IL-IN" -> "chicago-il" */
export function metroSlug(m: Metro): string {
  const city = m.name.split(",")[0].split("-")[0];
  return `${slugify(city)}-${m.state.toLowerCase()}`;
}

/** "Brain MRI" -> "brain-mri" */
export function serviceSlug(s: Service): string {
  return slugify(s.plain);
}

/** Short display name: "Chicago, IL" */
export function metroShort(m: Metro): string {
  return `${m.name.split(",")[0].split("-")[0]}, ${m.state}`;
}

function buildMap<T>(items: T[], key: (t: T) => string, label: string): Map<string, T> {
  const map = new Map<string, T>();
  const clashes: string[] = [];
  for (const item of items) {
    const k = key(item);
    if (map.has(k)) clashes.push(k);
    else map.set(k, item);
  }
  if (clashes.length) {
    // Thrown at module load, so it fails the build rather than the customer.
    throw new Error(
      `${label} slug collision: ${[...new Set(clashes)].join(", ")}. ` +
        `Two entries resolve to one URL, which would serve one of them under the other's name.`,
    );
  }
  return map;
}

const METRO_BY_SLUG = buildMap(METROS, metroSlug, "Metro");
const SERVICE_BY_SLUG = buildMap(SERVICES, serviceSlug, "Service");

export function findMetroBySlug(slug: string): Metro | undefined {
  return METRO_BY_SLUG.get(slug.toLowerCase());
}

export function findServiceBySlug(slug: string): Service | undefined {
  return SERVICE_BY_SLUG.get(slug.toLowerCase());
}

export const ALL_METRO_SLUGS = [...METRO_BY_SLUG.keys()];
export const ALL_SERVICE_SLUGS = [...SERVICE_BY_SLUG.keys()];

/** The canonical path for one market and one service. */
export function ratePath(m: Metro, s: Service): string {
  return `/rates/${metroSlug(m)}/${serviceSlug(s)}`;
}

export function marketPath(m: Metro): string {
  return `/rates/${metroSlug(m)}`;
}

/**
 * The page title, written the way a benefits professional searches.
 * They type "MRI cost chicago", not "CPT 70553 negotiated rate distribution".
 */
export function rateTitle(m: Metro, s: Service): string {
  return `${s.plain} cost in ${metroShort(m)}`;
}
