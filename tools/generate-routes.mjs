// Node.js >= 18 (uses global fetch). Generates data/routes.json from busansandan.rideus.net.
// Run: node tools/generate-routes.mjs
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = 'https://busansandan.rideus.net/busansandan/page/busansandan-detail?zone=noksan';
const MAP_BASE = 'https://rideus.net/busansandan/shuttlebus/';

function extractDataLiteral(html) {
  const start = html.indexOf('const data = ');
  if (start < 0) throw new Error('const data = ... not found in HTML');
  const objStart = html.indexOf('{', start);
  let depth = 0, end = -1;
  for (let i = objStart; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end < 0) throw new Error('unbalanced braces in data literal');
  return html.substring(objStart, end + 1);
}

const idFromUrl = (u) => {
  const m = (u || '').match(/shuttlebus\/(\d+)\/map/);
  return m ? Number(m[1]) : null;
};

const main = async () => {
  console.log('Fetching:', SOURCE);
  const res = await fetch(SOURCE);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const html = await res.text();
  const literal = extractDataLiteral(html);
  // Use Function (NOT eval) - same effect for object literal containing only data
  const data = new Function('return ' + literal)();

  const out = {
    generatedAt: new Date().toISOString().slice(0, 10),
    source: 'https://busansandan.rideus.net',
    mapBaseUrl: MAP_BASE,
    complexes: data.zones.map(z => ({
      id: z.id,
      name: z.name,
      zones: (z.routes || []).map(r => {
        const m = (r.map && r.map[0]) || {};
        return {
          name: r.name,
          commute: { go: idFromUrl(m.am), return: idFromUrl(m.pm) },
          timetable: (r.timetable || []).map(t => ({
            name: t.name,
            am: t.am || [],
            pm: t.pm || []
          })),
          stations: (r.stations || []).map(s => ({
            name: s.name,
            isTerminal: s.origin === 'all' || s.origin === true
          }))
        };
      })
    }))
  };

  const outPath = resolve(__dirname, '..', 'data', 'routes.json');
  await writeFile(outPath, JSON.stringify(out, null, 2), 'utf8');

  const totalRoutes = out.complexes.reduce((s, c) => s + c.zones.length, 0);
  const totalStations = out.complexes.reduce(
    (s, c) => s + c.zones.reduce((ss, z) => ss + z.stations.length, 0), 0
  );
  console.log(`✓ wrote ${outPath}`);
  console.log(`  ${out.complexes.length} 산단 / ${totalRoutes} 노선 / ${totalStations} 정류장`);
  for (const c of out.complexes) {
    console.log(`  - ${c.name}: ${c.zones.map(z => z.name).join(', ')}`);
  }
};

main().catch(err => { console.error(err); process.exit(1); });
