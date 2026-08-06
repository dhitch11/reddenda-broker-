#!/usr/bin/env node
/**
 * guard-demo-isolation.mjs — CONTAINMENT 6: the leak check. Run in CI and before any deploy.
 *
 * A convention nobody enforces is not containment. This asserts, mechanically, that
 * fabricated data cannot reach a real surface. Exit non-zero = do not ship.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const SRC = join(ROOT, 'src')
const fails = []

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e === '.next' || e === '.git') continue
    const p = join(dir, e)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(p)) out.push(p)
  }
  return out
}

const files = walk(SRC)

for (const f of files) {
  const rel = relative(ROOT, f)
  const body = readFileSync(f, 'utf8')
  const inDemo = rel.startsWith('src/demo/')

  // 1. Only the demo module may import the fixture directly.
  if (!inDemo && /demo-data\.json/.test(body)) {
    fails.push(`${rel}: imports demo-data.json directly. Go through src/demo/index.ts.`)
  }

  // 2. Nothing may import the demo module from a route that also touches the real DB.
  const importsDemo = /from\s+['"].*\/demo(\/index)?['"]/.test(body) || /from\s+['"]@\/demo['"]/.test(body)
  const touchesDb = /supabase|createClient|postgres|\bsql`|pg\.Pool/i.test(body)
  if (!inDemo && importsDemo && touchesDb) {
    fails.push(`${rel}: imports demo data AND touches a database in the same module. Split them.`)
  }

  // 3. Fabricated data must never be written anywhere.
  if (importsDemo && /\.(insert|upsert|update|delete)\s*\(/.test(body)) {
    fails.push(`${rel}: imports demo data and performs a WRITE. Fabricated rows must never be persisted.`)
  }
}

// 4. The fixture itself must still carry its manifest and markers.
const fx = JSON.parse(readFileSync(join(SRC, 'demo', 'demo-data.json'), 'utf8'))
if (!fx.__MANIFEST?.BANNER) fails.push('demo-data.json: __MANIFEST.BANNER missing.')
const unmarked = [...(fx.rates || []), ...(fx.providers || []), ...(fx.employer_groups || [])]
  .filter((r) => r.__synthetic !== true).length
if (unmarked) fails.push(`demo-data.json: ${unmarked} records missing __synthetic marker.`)

// 5. Re-verify every NPI is checksum-INVALID, independently of the generator.
const ck = (b) => { const s = '80840' + b; let sum = 0, d = true
  for (let i = s.length - 1; i >= 0; i--) { let x = +s[i]; if (d) { x *= 2; if (x > 9) x -= 9 } sum += x; d = !d }
  return (10 - (sum % 10)) % 10 }
const realLooking = (fx.providers || []).filter((p) => ck(p.npi.slice(0, 9)) === +p.npi[9])
if (realLooking.length) fails.push(`demo-data.json: ${realLooking.length} NPIs are checksum-VALID and could collide with a real provider.`)

// 6. Every payer slug must carry the demo_ prefix.
const badPayer = (fx.payers || []).filter((p) => !p.slug.startsWith('demo_'))
if (badPayer.length) fails.push(`demo-data.json: ${badPayer.length} payer slugs missing demo_ prefix.`)

if (fails.length) {
  console.error('❌ DEMO ISOLATION VIOLATED — DO NOT SHIP\n')
  for (const f of fails) console.error('  - ' + f)
  process.exit(1)
}
console.log('✅ demo isolation intact')
console.log(`   scanned ${files.length} source files`)
console.log(`   ${(fx.rates || []).length} rate rows, ${(fx.providers || []).length} providers, ${(fx.employer_groups || []).length} employer groups`)
console.log('   all NPIs checksum-invalid · all payers demo_-prefixed · all records marked · manifest present')
