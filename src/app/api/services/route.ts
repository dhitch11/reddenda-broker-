import { NextRequest, NextResponse } from "next/server";
import { SERVICES, findService } from "@/lib/catalog";
import { nationalSearch, nationalCatalog } from "@/lib/national";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/services?q=mri
 *
 * PROCEDURE SEARCH ACROSS THE FULL NATIONAL CATALOG.
 *
 * WHY THIS IS A SERVER ROUTE AND NOT A CLIENT IMPORT
 * The federal catalog is 7,647 procedures and its seed file is roughly 978KB. Shipping
 * that into the browser to power a type-ahead would be a megabyte of JSON on the
 * highest-traffic control on the site, on a phone, for a broker between meetings.
 * MetroPicker can hold its 928 markets client-side because that list is small. This one
 * cannot, so the search runs here and the control fetches.
 *
 * THE RANKING, AND WHY THE CURATED BASKET WINS TIES
 * A benefits professional types "mri", not "70553". The 39-service basket carries the
 * phrase a broker would actually say ("Brain MRI") while the federal catalog carries the
 * CMS descriptor ("Mri brain w/o & w/dye"), which is correct and unreadable. So curated
 * entries rank first and supply the display name; everything else in the country is still
 * reachable behind them. Scope goes up without usability going down.
 *
 * NEVER LOWERCASE A SERVICE NAME. Acronyms like MRI, CT and EKG read as a typo to this
 * audience. The CMS descriptors arrive in mixed shorthand, so they are title-cased on the
 * first word only and otherwise left exactly as filed.
 */

type Row = { cpt: string; name: string; plain: string; featured: boolean };

const LIMIT = 12;

/** CMS descriptors are filed in abbreviated shorthand. Make the first letter a capital
 *  and leave every acronym alone, rather than "fixing" casing we do not understand. */
function presentable(desc: string): string {
  const t = desc.trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/**
 * ★ METERED 2026-08-26 under Bulletin 2 #5 ("gate or meter"). This route serves
 * catalog names and codes, never a dollar, so it stays open for the typeahead —
 * but open is not unmetered. 600 requests per IP per hour is far above any
 * human typing rate (the picker debounces) and far below a scrape.
 *
 * HONEST LIMIT OF THIS METER, stated so nobody oversells it: the counter is
 * per-instance memory, so a fleet of lambdas each grants its own window and a
 * cold start resets one. It is a ceiling against casual bulk pulls, not a
 * security boundary; the security boundary is that THIS ROUTE HOLDS NO RATES.
 */
const WINDOW_MS = 60 * 60 * 1000;
const CEILING = 600;
const hits = new Map<string, { n: number; at: number }>();

export async function GET(req: NextRequest) {
  const ip = (req.headers.get("x-nf-client-connection-ip") ?? req.headers.get("x-forwarded-for") ?? "unknown")
    .split(",")[0]
    .trim();
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.at > WINDOW_MS) {
    hits.set(ip, { n: 1, at: now });
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (now - v.at > WINDOW_MS) hits.delete(k);
    }
  } else if (++h.n > CEILING) {
    return NextResponse.json(
      { ok: false, error: "metered", note: "Too many catalog searches from this address. Try again in an hour, or use the console." },
      { status: 429, headers: { "retry-after": "3600", "cache-control": "no-store" } },
    );
  }

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();

  // Empty query: the curated basket, which is the default view in the control.
  if (!q) {
    return NextResponse.json({
      ok: true,
      results: SERVICES.slice(0, LIMIT).map<Row>((s) => ({
        cpt: s.cpt,
        name: s.name,
        plain: s.plain,
        featured: true,
      })),
      total: nationalCatalog().length,
    });
  }

  const lower = q.toLowerCase();
  const seen = new Set<string>();
  const out: Row[] = [];

  // 1. The curated basket first, on code, plain phrase, formal name or alias.
  for (const s of SERVICES) {
    const hit =
      s.cpt.startsWith(q.toUpperCase()) ||
      s.plain.toLowerCase().includes(lower) ||
      s.name.toLowerCase().includes(lower) ||
      (s.aka ?? []).some((a) => a.toLowerCase().includes(lower));
    if (!hit) continue;
    seen.add(s.cpt);
    out.push({ cpt: s.cpt, name: s.name, plain: s.plain, featured: true });
    if (out.length >= LIMIT) break;
  }

  // 2. Then the rest of the country. `nationalSearch` handles both code and text.
  if (out.length < LIMIT) {
    try {
      for (const c of nationalSearch(q, LIMIT * 3)) {
        if (seen.has(c.cpt)) continue;
        seen.add(c.cpt);
        const curated = findService(c.cpt);
        out.push({
          cpt: c.cpt,
          name: curated?.name ?? presentable(c.desc),
          plain: curated?.plain ?? presentable(c.desc),
          featured: false,
        });
        if (out.length >= LIMIT) break;
      }
    } catch (err) {
      // A failure here must not take down the curated results the user can already
      // see. Report it rather than swallowing it into an empty list, because an
      // empty list and a broken search look identical to the person typing.
      console.error("[services] national search failed", err);
      return NextResponse.json({
        ok: true,
        results: out,
        total: null,
        degraded: true,
      });
    }
  }

  return NextResponse.json({ ok: true, results: out, total: nationalCatalog().length });
}
