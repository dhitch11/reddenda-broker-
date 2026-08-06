/**
 * The broker basket.
 *
 * A benefits professional does not think in CPT codes. They think "an MRI", "a
 * colonoscopy", "a knee replacement". Every code here carries the plain phrase a
 * broker would actually say, so search works on either.
 *
 * Selection rule: services a commercially insured working-age population actually
 * uses, weighted toward the ones where price dispersion is large enough to be worth
 * a plan design decision. Anchored on the CMS shoppable services concept rather
 * than on our own opinion of what is interesting.
 */

export type Category =
  | "imaging"
  | "surgery"
  | "lab"
  | "office"
  | "emergency"
  | "therapy"
  | "maternity"
  | "behavioral"
  | "cardiac"
  | "pain"
  | "diagnostic";

export type Service = {
  cpt: string;
  /** What it is called in the fee schedule. */
  name: string;
  /** What a broker would say out loud. */
  plain: string;
  category: Category;
  /** Alternate phrasings for search. */
  aka?: string[];
  /** True where the hospital versus freestanding gap is the whole story. */
  siteOfService?: boolean;
};

export const CATEGORY_LABEL: Record<Category, string> = {
  imaging: "Imaging",
  surgery: "Surgery",
  lab: "Lab",
  office: "Office visits",
  emergency: "Emergency",
  therapy: "Therapy",
  maternity: "Maternity",
  behavioral: "Behavioral health",
  cardiac: "Cardiac",
  pain: "Pain management",
  diagnostic: "Diagnostic",
};

export const SERVICES: Service[] = [
  // Imaging. The widest spreads in the whole basket and the easiest steering win.
  { cpt: "70553", name: "MRI brain, with and without contrast", plain: "Brain MRI", category: "imaging", aka: ["head mri", "mri head"], siteOfService: true },
  { cpt: "70450", name: "CT head, without contrast", plain: "Head CT", category: "imaging", aka: ["ct scan head", "cat scan"], siteOfService: true },
  { cpt: "71250", name: "CT chest, without contrast", plain: "Chest CT", category: "imaging", aka: ["lung ct"], siteOfService: true },
  { cpt: "72148", name: "MRI lumbar spine, without contrast", plain: "Lower back MRI", category: "imaging", aka: ["back mri", "spine mri"], siteOfService: true },
  { cpt: "73721", name: "MRI lower extremity joint, without contrast", plain: "Knee MRI", category: "imaging", aka: ["joint mri", "leg mri"], siteOfService: true },
  { cpt: "74177", name: "CT abdomen and pelvis, with contrast", plain: "Abdominal CT", category: "imaging", aka: ["belly ct"], siteOfService: true },
  { cpt: "76700", name: "Ultrasound abdomen, complete", plain: "Abdominal ultrasound", category: "imaging", siteOfService: true },
  { cpt: "77067", name: "Screening mammography, bilateral", plain: "Screening mammogram", category: "imaging", aka: ["mammogram"], siteOfService: true },

  // Surgery. The largest single-claim dollars a small plan will see.
  { cpt: "29881", name: "Knee arthroscopy with meniscectomy", plain: "Knee scope", category: "surgery", aka: ["arthroscopy", "meniscus surgery"], siteOfService: true },
  { cpt: "45378", name: "Diagnostic colonoscopy", plain: "Colonoscopy", category: "surgery", siteOfService: true },
  { cpt: "45380", name: "Colonoscopy with biopsy", plain: "Colonoscopy with biopsy", category: "surgery", siteOfService: true },
  { cpt: "43239", name: "Upper GI endoscopy with biopsy", plain: "Upper endoscopy", category: "surgery", aka: ["egd", "scope"], siteOfService: true },
  { cpt: "66984", name: "Cataract surgery with lens insertion", plain: "Cataract surgery", category: "surgery", siteOfService: true },
  { cpt: "27447", name: "Total knee arthroplasty", plain: "Knee replacement", category: "surgery", aka: ["tka"], siteOfService: true },
  { cpt: "27130", name: "Total hip arthroplasty", plain: "Hip replacement", category: "surgery", aka: ["tha"], siteOfService: true },
  { cpt: "47562", name: "Laparoscopic cholecystectomy", plain: "Gallbladder removal", category: "surgery", siteOfService: true },
  { cpt: "49505", name: "Inguinal hernia repair", plain: "Hernia repair", category: "surgery", siteOfService: true },

  // Pain. High volume, high variance, routinely missed in plan design.
  { cpt: "62323", name: "Epidural injection, lumbar", plain: "Epidural injection", category: "pain", siteOfService: true },
  { cpt: "64483", name: "Transforaminal epidural, lumbar", plain: "Nerve root injection", category: "pain", siteOfService: true },
  { cpt: "20610", name: "Major joint injection or aspiration", plain: "Joint injection", category: "pain" },

  // Cardiac.
  { cpt: "93306", name: "Echocardiogram, complete with Doppler", plain: "Echocardiogram", category: "cardiac", aka: ["echo", "heart ultrasound"], siteOfService: true },
  { cpt: "93000", name: "Electrocardiogram with interpretation", plain: "EKG", category: "cardiac", aka: ["ecg"] },

  // Lab. Small unit cost, enormous volume, and the multiples are absurd.
  { cpt: "80053", name: "Comprehensive metabolic panel", plain: "Metabolic panel", category: "lab", aka: ["cmp", "blood panel"] },
  { cpt: "80061", name: "Lipid panel", plain: "Cholesterol panel", category: "lab" },
  { cpt: "85025", name: "Complete blood count with differential", plain: "Blood count", category: "lab", aka: ["cbc"] },
  { cpt: "84443", name: "Thyroid stimulating hormone", plain: "Thyroid test", category: "lab", aka: ["tsh"] },
  { cpt: "81001", name: "Urinalysis with microscopy", plain: "Urinalysis", category: "lab" },

  // Office visits. Tight spreads, and that contrast is the teaching moment.
  { cpt: "99213", name: "Office visit, established patient, 20 to 29 minutes", plain: "Standard office visit", category: "office" },
  { cpt: "99214", name: "Office visit, established patient, 30 to 39 minutes", plain: "Longer office visit", category: "office" },
  { cpt: "99203", name: "Office visit, new patient, 30 to 44 minutes", plain: "New patient visit", category: "office" },
  { cpt: "99204", name: "Office visit, new patient, 45 to 59 minutes", plain: "Longer new patient visit", category: "office" },

  // Emergency. Where a self funded plan bleeds without noticing.
  { cpt: "99283", name: "Emergency department visit, moderate severity", plain: "ER visit, moderate", category: "emergency", siteOfService: true },
  { cpt: "99285", name: "Emergency department visit, high severity", plain: "ER visit, severe", category: "emergency", siteOfService: true },

  // Therapy.
  { cpt: "97110", name: "Therapeutic exercise, 15 minutes", plain: "Physical therapy", category: "therapy", aka: ["pt"] },

  // Maternity. Often the single largest recurring cost in a young workforce.
  { cpt: "59400", name: "Vaginal delivery, global obstetric care", plain: "Vaginal delivery", category: "maternity", aka: ["childbirth", "birth"] },
  { cpt: "59510", name: "Cesarean delivery, global obstetric care", plain: "C-section", category: "maternity", aka: ["cesarean"] },

  // Behavioral. Rising fast and under-analyzed in most renewals.
  { cpt: "90837", name: "Psychotherapy, 60 minutes", plain: "Therapy session, 60 min", category: "behavioral", aka: ["counseling", "mental health"] },
  { cpt: "90834", name: "Psychotherapy, 45 minutes", plain: "Therapy session, 45 min", category: "behavioral" },

  { cpt: "95810", name: "Polysomnography, attended", plain: "Sleep study", category: "diagnostic", siteOfService: true },
];

const byCpt = new Map(SERVICES.map((s) => [s.cpt, s]));

export function findService(cpt: string): Service | undefined {
  return byCpt.get(cpt.trim().toUpperCase());
}

/**
 * Search on code or plain language.
 * A broker types "mri" far more often than "70553", and both must work.
 */
export function searchServices(query: string, limit = 12): Service[] {
  const q = query.trim().toLowerCase();
  if (!q) return SERVICES.slice(0, limit);

  if (/^\d{4,5}[A-Z]?$/i.test(q)) {
    const exact = SERVICES.filter((s) => s.cpt.startsWith(q.toUpperCase()));
    if (exact.length) return exact.slice(0, limit);
  }

  const scored = SERVICES.map((s) => {
    const hay = [s.plain, s.name, s.cpt, ...(s.aka ?? [])].join(" ").toLowerCase();
    if (!hay.includes(q)) return null;
    // Plain-language matches rank above fee-schedule wording.
    const rank = s.plain.toLowerCase().includes(q) ? 0 : s.cpt.startsWith(q) ? 1 : 2;
    return { s, rank };
  }).filter(Boolean) as { s: Service; rank: number }[];

  return scored.sort((a, b) => a.rank - b.rank).slice(0, limit).map((x) => x.s);
}

/**
 * Codes whose upstream record is incomplete, verified 2026-08-06.
 * We still serve them, but from our own catalog name rather than the upstream
 * description, because upstream returns null and would render a nameless result.
 */
export const DESCRIPTION_MISSING_UPSTREAM = new Set(["27447"]);
