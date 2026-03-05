import { readFileSync, writeFileSync, existsSync } from 'fs'
import { createInterface } from 'readline'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const rl = createInterface({ input: process.stdin, output: process.stdout })
const ask = (q) => new Promise((res) => rl.question(q, res))

const pkgPath = resolve(root, 'package.json')
const versionPath = resolve(root, 'src/version.ts')
const changelogPath = resolve(root, 'CHANGELOG.md')

const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
const currentVersion = pkg.version

const bumpPatch = (v) => {
  const parts = v.split('.').map(Number)
  parts[2] = (parts[2] || 0) + 1
  return parts.join('.')
}

console.log('\n  FinScope Release Tool')
console.log(`  Current version: ${currentVersion}`)
console.log(`  Suggested next:  ${bumpPatch(currentVersion)}\n`)

const inputVersion = await ask(`  New version [${bumpPatch(currentVersion)}]: `)
const version = inputVersion.trim() || bumpPatch(currentVersion)

const releaseName = await ask('  Release name (e.g. "Solar Flare", leave empty to skip): ')

console.log('\n  Release notes — enter items comma-separated, or press Enter to skip:\n')
const inputAdded = await ask('  Added:   ')
const inputFixed = await ask('  Fixed:   ')
const inputChanged = await ask('  Changed: ')
const inputRemoved = await ask('  Removed: ')

rl.close()

const splitLines = (s) => s.split(',').map((l) => l.trim()).filter(Boolean)
const today = new Date().toISOString().split('T')[0]

const added = splitLines(inputAdded)
const fixed = splitLines(inputFixed)
const changed = splitLines(inputChanged)
const removed = splitLines(inputRemoved)
const name = releaseName.trim()

const changelogLines = [
  ...added.map((l) => `    added: '${l.replace(/'/g, "\\'")}'`),
  ...fixed.map((l) => `    fixed: '${l.replace(/'/g, "\\'")}'`),
  ...changed.map((l) => `    changed: '${l.replace(/'/g, "\\'")}'`),
  ...removed.map((l) => `    removed: '${l.replace(/'/g, "\\'")}'`),
]

const versionTs = `export const VERSION = {
  version: '${version}',
  releaseName: '${name}',
  date: '${today}',
  changelog: {
    added: [${added.map((l) => `'${l.replace(/'/g, "\\'")}'`).join(', ')}],
    fixed: [${fixed.map((l) => `'${l.replace(/'/g, "\\'")}'`).join(', ')}],
    changed: [${changed.map((l) => `'${l.replace(/'/g, "\\'")}'`).join(', ')}],
    removed: [${removed.map((l) => `'${l.replace(/'/g, "\\'")}'`).join(', ')}],
  },
}
`

pkg.version = version
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
writeFileSync(versionPath, versionTs)

const sections = []
if (added.length) sections.push(`### Added\n${added.map((l) => `- ${l}`).join('\n')}`)
if (fixed.length) sections.push(`### Fixed\n${fixed.map((l) => `- ${l}`).join('\n')}`)
if (changed.length) sections.push(`### Changed\n${changed.map((l) => `- ${l}`).join('\n')}`)
if (removed.length) sections.push(`### Removed\n${removed.map((l) => `- ${l}`).join('\n')}`)

const header = `## [${version}]${name ? ` — ${name}` : ''} (${today})`
const entry = sections.length ? `${header}\n\n${sections.join('\n\n')}` : header

let changelog = existsSync(changelogPath) ? readFileSync(changelogPath, 'utf-8') : '# Changelog\n\n'
const marker = '# Changelog\n\n'
const idx = changelog.indexOf(marker)
changelog =
  idx !== -1
    ? changelog.slice(0, idx + marker.length) + entry + '\n\n' + changelog.slice(idx + marker.length)
    : marker + entry + '\n\n'

writeFileSync(changelogPath, changelog)

console.log(`\n  Version ${version} prepared.\n`)
console.log(`  Files updated:`)
console.log(`    package.json`)
console.log(`    src/version.ts`)
console.log(`    CHANGELOG.md`)
console.log(`\n  Next steps:`)
console.log(`    git add package.json src/version.ts CHANGELOG.md`)
console.log(`    git commit -m "chore: release v${version}"`)
console.log(`    git tag v${version}`)
console.log(`    git push && git push --tags\n`)
