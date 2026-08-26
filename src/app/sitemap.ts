import type { MetadataRoute } from "next";
import { METROS } from "@/lib/metros";
import { SERVICES } from "@/lib/catalog";
import { metroSlug, serviceSlug } from "@/components/marketing/slugs";

/**
 * The sitemap for the programmatic surface.
 *
 * NOTE ON STATE. The site is PIN gated and the root layout sets robots
 * index:false, so nothing here is crawlable today and this file is deliberately
 * inert. It exists now so that opening the gate is a switch rather than a build.
 * See docs/LAUNCH-CHECKLIST.md for the exact order of operations, because the
 * order matters: publishing a sitemap before the pages are indexable advertises
 * URLs that return an entry screen, and that is how a site teaches a crawler that
 * its content is worthless.
 *
 * Priorities are relative, not absolute, and they are set by how much unique
 * measured content the page carries rather than by how much we would like it to
 * rank. The market/service pages are the deepest content we have, so they lead.
 */

const BASE = (process.env.NEXT_PUBLIC_SITE_URL || "https://broker.reddenda.com").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const core: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/brokers`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/general-agencies`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/employers`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/methodology`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/rates`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  const markets: MetadataRoute.Sitemap = METROS.map((m) => ({
    url: `${BASE}/rates/${metroSlug(m)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const pages: MetadataRoute.Sitemap = METROS.flatMap((m) =>
    SERVICES.map((s) => ({
      url: `${BASE}/rates/${metroSlug(m)}/${serviceSlug(s)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  );

  return [...core, ...markets, ...pages];
}
