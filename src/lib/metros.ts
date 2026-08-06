/**
 * Metro reference list.
 *
 * Measured from `npi_cbsa` on 2026-08-06: CBSA code, official name, and the count
 * of NPIs the corpus holds in that metro. Ordered by provider density, which is a
 * good proxy for how deep the rate data runs there.
 *
 * This is reference data, not live data. It changes when OMB redefines statistical
 * areas, roughly once a decade. Regenerate with `scripts/build-metros.mjs`, which
 * needs SUPABASE_SERVICE_ROLE_KEY, when the corpus is rebuilt.
 *
 * The corpus holds 917 CBSAs. This file carries the 120 largest, which together
 * cover the overwhelming majority of commercially insured lives. A market outside
 * this list resolves to its state and the UI says so.
 */

export type Metro = { cbsa: string; name: string; state: string; npis: number };

export const METROS: Metro[] = [
  { cbsa: "35620", name: "New York-Newark-Jersey City, NY-NJ", state: "NY", npis: 625599 },
  { cbsa: "31080", name: "Los Angeles-Long Beach-Anaheim, CA", state: "CA", npis: 434016 },
  { cbsa: "16980", name: "Chicago-Naperville-Elgin, IL-IN", state: "IL", npis: 249673 },
  { cbsa: "33100", name: "Miami-Fort Lauderdale-West Palm Beach, FL", state: "FL", npis: 240315 },
  { cbsa: "47900", name: "Washington-Arlington-Alexandria, DC-VA-MD-WV", state: "DC", npis: 203028 },
  { cbsa: "19820", name: "Detroit-Warren-Dearborn, MI", state: "MI", npis: 185411 },
  { cbsa: "37980", name: "Philadelphia-Camden-Wilmington, PA-NJ-DE-MD", state: "PA", npis: 184575 },
  { cbsa: "14460", name: "Boston-Cambridge-Newton, MA-NH", state: "MA", npis: 182728 },
  { cbsa: "19100", name: "Dallas-Fort Worth-Arlington, TX", state: "TX", npis: 170063 },
  { cbsa: "26420", name: "Houston-Pasadena-The Woodlands, TX", state: "TX", npis: 158335 },
  { cbsa: "41860", name: "San Francisco-Oakland-Fremont, CA", state: "CA", npis: 154150 },
  { cbsa: "12060", name: "Atlanta-Sandy Springs-Roswell, GA", state: "GA", npis: 137117 },
  { cbsa: "42660", name: "Seattle-Tacoma-Bellevue, WA", state: "WA", npis: 133913 },
  { cbsa: "38060", name: "Phoenix-Mesa-Chandler, AZ", state: "AZ", npis: 122907 },
  { cbsa: "33460", name: "Minneapolis-St. Paul-Bloomington, MN-WI", state: "MN", npis: 111787 },
  { cbsa: "40140", name: "Riverside-San Bernardino-Ontario, CA", state: "CA", npis: 106043 },
  { cbsa: "41740", name: "San Diego-Chula Vista-Carlsbad, CA", state: "CA", npis: 105871 },
  { cbsa: "12580", name: "Baltimore-Columbia-Towson, MD", state: "MD", npis: 105240 },
  { cbsa: "19740", name: "Denver-Aurora-Centennial, CO", state: "CO", npis: 103676 },
  { cbsa: "29820", name: "Las Vegas-Henderson-North Las Vegas, NV", state: "NV", npis: 96568 },
  { cbsa: "38900", name: "Portland-Vancouver-Hillsboro, OR-WA", state: "OR", npis: 93813 },
  { cbsa: "45300", name: "Tampa-St. Petersburg-Clearwater, FL", state: "FL", npis: 92800 },
  { cbsa: "18140", name: "Columbus, OH", state: "OH", npis: 80738 },
  { cbsa: "17410", name: "Cleveland, OH", state: "OH", npis: 76983 },
  { cbsa: "41180", name: "St. Louis, MO-IL", state: "MO", npis: 76444 },
  { cbsa: "36740", name: "Orlando-Kissimmee-Sanford, FL", state: "FL", npis: 74066 },
  { cbsa: "40900", name: "Sacramento-Roseville-Folsom, CA", state: "CA", npis: 70569 },
  { cbsa: "38300", name: "Pittsburgh, PA", state: "PA", npis: 67754 },
  { cbsa: "17140", name: "Cincinnati, OH-KY-IN", state: "OH", npis: 67432 },
  { cbsa: "16740", name: "Charlotte-Concord-Gastonia, NC-SC", state: "NC", npis: 65750 },
  { cbsa: "41700", name: "San Antonio-New Braunfels, TX", state: "TX", npis: 62043 },
  { cbsa: "26900", name: "Indianapolis-Carmel-Greenwood, IN", state: "IN", npis: 61543 },
  { cbsa: "41940", name: "San Jose-Sunnyvale-Santa Clara, CA", state: "CA", npis: 59203 },
  { cbsa: "28140", name: "Kansas City, MO-KS", state: "MO", npis: 56266 },
  { cbsa: "34980", name: "Nashville-Davidson--Murfreesboro--Franklin, TN", state: "TN", npis: 55917 },
  { cbsa: "12420", name: "Austin-Round Rock-San Marcos, TX", state: "TX", npis: 52126 },
  { cbsa: "33340", name: "Milwaukee-Waukesha, WI", state: "WI", npis: 48387 },
  { cbsa: "36420", name: "Oklahoma City, OK", state: "OK", npis: 46854 },
  { cbsa: "39300", name: "Providence-Warwick, RI-MA", state: "RI", npis: 46199 },
  { cbsa: "36540", name: "Omaha, NE-IA", state: "NE", npis: 45014 },
  { cbsa: "47260", name: "Virginia Beach-Chesapeake-Norfolk, VA-NC", state: "VA", npis: 43879 },
  { cbsa: "27260", name: "Jacksonville, FL", state: "FL", npis: 43495 },
  { cbsa: "41620", name: "Salt Lake City-Murray, UT", state: "UT", npis: 42764 },
  { cbsa: "39580", name: "Raleigh-Cary, NC", state: "NC", npis: 38424 },
  { cbsa: "31140", name: "Louisville/Jefferson County, KY-IN", state: "KY", npis: 36271 },
  { cbsa: "15380", name: "Buffalo-Cheektowaga, NY", state: "NY", npis: 35466 },
  { cbsa: "41980", name: "San Juan-Bayamon-Caguas, PR", state: "PR", npis: 35304 },
  { cbsa: "40060", name: "Richmond, VA", state: "VA", npis: 34297 },
  { cbsa: "40380", name: "Rochester, NY", state: "NY", npis: 34265 },
  { cbsa: "24340", name: "Grand Rapids-Wyoming-Kentwood, MI", state: "MI", npis: 33552 },
  { cbsa: "46140", name: "Tulsa, OK", state: "OK", npis: 32649 },
  { cbsa: "35380", name: "New Orleans-Metairie, LA", state: "LA", npis: 32583 },
  { cbsa: "10740", name: "Albuquerque, NM", state: "NM", npis: 31905 },
  { cbsa: "13820", name: "Birmingham, AL", state: "AL", npis: 30154 },
  { cbsa: "19430", name: "Dayton-Kettering-Beavercreek, OH", state: "OH", npis: 29825 },
  { cbsa: "46520", name: "Urban Honolulu, HI", state: "HI", npis: 29739 },
  { cbsa: "23420", name: "Fresno, CA", state: "CA", npis: 29499 },
  { cbsa: "17820", name: "Colorado Springs, CO", state: "CO", npis: 28465 },
  { cbsa: "30780", name: "Little Rock-North Little Rock-Conway, AR", state: "AR", npis: 28272 },
  { cbsa: "32820", name: "Memphis, TN-MS-AR", state: "TN", npis: 27906 },
  { cbsa: "49340", name: "Worcester, MA", state: "MA", npis: 27355 },
  { cbsa: "46060", name: "Tucson, AZ", state: "AZ", npis: 25687 },
  { cbsa: "10420", name: "Akron, OH", state: "OH", npis: 25033 },
  { cbsa: "10580", name: "Albany-Schenectady-Troy, NY", state: "NY", npis: 24543 },
  { cbsa: "20500", name: "Durham-Chapel Hill, NC", state: "NC", npis: 24347 },
  { cbsa: "16700", name: "Charleston-North Charleston, SC", state: "SC", npis: 24287 },
  { cbsa: "45780", name: "Toledo, OH", state: "OH", npis: 23858 },
  { cbsa: "28940", name: "Knoxville, TN", state: "TN", npis: 23546 },
  { cbsa: "12940", name: "Baton Rouge, LA", state: "LA", npis: 23265 },
  { cbsa: "31540", name: "Madison, WI", state: "WI", npis: 22901 },
  { cbsa: "11460", name: "Ann Arbor, MI", state: "MI", npis: 22859 },
  { cbsa: "24860", name: "Greenville-Anderson-Greer, SC", state: "SC", npis: 22735 },
  { cbsa: "17900", name: "Columbia, SC", state: "SC", npis: 22362 },
  { cbsa: "44060", name: "Spokane-Spokane Valley, WA", state: "WA", npis: 22158 },
  { cbsa: "10900", name: "Allentown-Bethlehem-Easton, PA-NJ", state: "PA", npis: 22136 },
  { cbsa: "37100", name: "Oxnard-Thousand Oaks-Ventura, CA", state: "CA", npis: 21727 },
  { cbsa: "14260", name: "Boise City, ID", state: "ID", npis: 21201 },
  { cbsa: "26580", name: "Huntington-Ashland, WV-KY-OH", state: "WV", npis: 20908 },
  { cbsa: "35840", name: "North Port-Bradenton-Sarasota, FL", state: "FL", npis: 20546 },
  { cbsa: "45060", name: "Syracuse, NY", state: "NY", npis: 20252 },
  { cbsa: "38860", name: "Portland-South Portland, ME", state: "ME", npis: 19897 },
  { cbsa: "30460", name: "Lexington-Fayette, KY", state: "KY", npis: 19246 },
  { cbsa: "15980", name: "Cape Coral-Fort Myers, FL", state: "FL", npis: 18966 },
  { cbsa: "28880", name: "Kiryas Joel-Poughkeepsie-Newburgh, NY", state: "NY", npis: 18920 },
  { cbsa: "25420", name: "Harrisburg-Carlisle, PA", state: "PA", npis: 17897 },
  { cbsa: "11260", name: "Anchorage, AK", state: "AK", npis: 17819 },
  { cbsa: "24660", name: "Greensboro-High Point, NC", state: "NC", npis: 17614 },
  { cbsa: "12540", name: "Bakersfield-Delano, CA", state: "CA", npis: 17352 },
  { cbsa: "39900", name: "Reno, NV", state: "NV", npis: 17096 },
  { cbsa: "23540", name: "Gainesville, FL", state: "FL", npis: 17074 },
  { cbsa: "30700", name: "Lincoln, NE", state: "NE", npis: 17016 },
  { cbsa: "44700", name: "Stockton-Lodi, CA", state: "CA", npis: 16857 },
  { cbsa: "27140", name: "Jackson, MS", state: "MS", npis: 16718 },
  { cbsa: "39340", name: "Provo-Orem-Lehi, UT", state: "UT", npis: 16600 },
  { cbsa: "16620", name: "Charleston, WV", state: "WV", npis: 16573 },
  { cbsa: "44140", name: "Springfield, MA", state: "MA", npis: 16395 },
  { cbsa: "48620", name: "Wichita, KS", state: "KS", npis: 16364 },
  { cbsa: "19780", name: "Des Moines-West Des Moines, IA", state: "IA", npis: 16364 },
  { cbsa: "38940", name: "Port St. Lucie, FL", state: "FL", npis: 16239 },
  { cbsa: "21340", name: "El Paso, TX", state: "TX", npis: 15770 },
  { cbsa: "12260", name: "Augusta-Richmond County, GA-SC", state: "GA", npis: 15283 },
  { cbsa: "11700", name: "Asheville, NC", state: "NC", npis: 15051 },
  { cbsa: "49660", name: "Youngstown-Warren, OH", state: "OH", npis: 15006 },
  { cbsa: "19660", name: "Deltona-Daytona Beach-Ormond Beach, FL", state: "FL", npis: 14902 },
  { cbsa: "33700", name: "Modesto, CA", state: "CA", npis: 14806 },
  { cbsa: "32580", name: "McAllen-Edinburg-Mission, TX", state: "TX", npis: 14510 },
  { cbsa: "37340", name: "Palm Bay-Melbourne-Titusville, FL", state: "FL", npis: 14508 },
  { cbsa: "40340", name: "Rochester, MN", state: "MN", npis: 14180 },
  { cbsa: "49180", name: "Winston-Salem, NC", state: "NC", npis: 14179 },
  { cbsa: "21660", name: "Eugene-Springfield, OR", state: "OR", npis: 13809 },
  { cbsa: "36260", name: "Ogden, UT", state: "UT", npis: 13808 },
  { cbsa: "22220", name: "Fayetteville-Springdale-Rogers, AR", state: "AR", npis: 13750 },
  { cbsa: "43340", name: "Shreveport-Bossier City, LA", state: "LA", npis: 13680 },
  { cbsa: "29620", name: "Lansing-East Lansing, MI", state: "MI", npis: 13612 },
  { cbsa: "14500", name: "Boulder, CO", state: "CO", npis: 13439 },
  { cbsa: "22180", name: "Fayetteville, NC", state: "NC", npis: 13120 },
  { cbsa: "29460", name: "Lakeland-Winter Haven, FL", state: "FL", npis: 13106 },
  { cbsa: "15940", name: "Canton-Massillon, OH", state: "OH", npis: 12984 },
  { cbsa: "16860", name: "Chattanooga, TN-GA", state: "TN", npis: 12850 },
];

const byCbsa = new Map(METROS.map((m) => [m.cbsa, m]));

export function findMetro(cbsa: string): Metro | undefined {
  return byCbsa.get(cbsa);
}

/** Type-ahead over metro names. Matches on any token so "fort worth" finds Dallas. */
export function searchMetros(query: string, limit = 8): Metro[] {
  const q = query.trim().toLowerCase();
  if (!q) return METROS.slice(0, limit);
  return METROS.filter((m) => m.name.toLowerCase().includes(q) || m.state.toLowerCase() === q)
    .slice(0, limit);
}

export const STATES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon",
  PA: "Pennsylvania", PR: "Puerto Rico", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};
