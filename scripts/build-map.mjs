// Builds assets/map.svg: the site's pixel map as a self-playing README image. The avatar tours a few nodes,
// each lights up with its skill wires, and an RPG dialog line describes it. GitHub strips scripts from README
// images, so every motion here is a CSS keyframe on one shared loop.
//
//   node scripts/build-map.mjs                       # reads content from the live site
//   node scripts/build-map.mjs <site.json> <portrait.png>   # or from local files
import fs from 'node:fs';

const SITE = 'https://blacktea3250106.github.io';
const RAW = 'https://raw.githubusercontent.com/blacktea3250106/blacktea3250106.github.io/main/src/data/site.json';
const [dataArg, portraitArg] = process.argv.slice(2);
const data = dataArg ? JSON.parse(fs.readFileSync(dataArg, 'utf8')) : await (await fetch(RAW)).json();
const portraitBuf = portraitArg ? fs.readFileSync(portraitArg) : Buffer.from(await (await fetch(SITE + '/portrait.png')).arrayBuffer());
const PORTRAIT = 'data:image/png;base64,' + portraitBuf.toString('base64');

// ---- tour: where the avatar stops and what the dialog says (facts from site.json) ----
const TOUR = [
  ['root', 'Hao-Fu Chang · AI Product Engineer', 'Backend engineer building LLM products end to end. Click to explore ▶'],
  ['maiagent', 'MaiAgent · Backend Engineer, 2024–26', 'RAG document pipeline, 10M+ record Celery jobs, 103-class multi-tenant RBAC'],
  ['lumi-ai-customer-service', 'lumi-ai-customer-service', 'Claude tool-use agent: product search, verified order lookup, human handoff'],
  ['vocab-pipeline', 'vocab-pipeline', 'Book photos → Claude vision extraction via Batch API, then a validation layer'],
  ['agent-workflow', 'agent-workflow', 'Claude and Codex workers in isolated worktrees, gated by health checks'],
];
const DWELL = 3.2, SPEED = 330;   // seconds per stop, world units per second

// ---- palette + geometry shared with the site ----
const C = { bg: '#0b0f17', panel: '#111827', line: '#1f2a3d', fg: '#e9eef7', muted: '#95a3ba', bar: '#1f4f86', shadow: 'rgba(0,0,0,.55)',
  orange: ['#ff9f43', '#ffc489', '#8a5320'], green: ['#5fd68a', '#a6f0c0', '#23683f'], blue: ['#5aa9ff', '#a9d2ff', '#1f4f86'], archive: ['#8d9bb3', '#c3cddd', '#3a465c'] };
const SIZE = { root: [250, 76], hub: [150, 48], item: [320, 56] };
const nodes = data.nodes.filter((n) => !n.hidden);
const skills = data.skills.map(([id, label], i) => ({ id: 's-' + id, skill: id, kind: 'skill', sec: 'blue', lane: i, x: 1030, y: 92 + i * 56, label }));
const byId = Object.fromEntries([...nodes, ...skills].map((n) => [n.id, n]));
const anchor = (n, side) => n.kind === 'skill' ? [n.x + (side === 'r' ? 9 : -9), n.y] : [n.x + (side === 'r' ? 1 : -1) * SIZE[n.kind][0] / 2, n.y];
function wire(from, to, kind) {
  const a = byId[from], b = byId[to];
  const [sx, sy] = anchor(a, 'r'), [tx, ty] = anchor(b, 'l');
  const mx = kind === 'skill' ? sx + 40 + b.lane * 9 : Math.round((sx + tx) / 2);
  return [[sx, sy], [mx, sy], [mx, ty], [tx, ty]];
}
const d = (pts) => 'M' + pts.map((p) => p.join(' ')).join(' L');
const notch = (x, y, w, h, n = 5) => `M${x + n} ${y}H${x + w - n}V${y + n}H${x + w}V${y + h - n}H${x + w - n}V${y + h}H${x + n}V${y + h - n}H${x}V${y + n}H${x + n}Z`;
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ICONS = {
  case: ['..####..', '..#..#..', '########', '########', '###..###', '########', '########', '........'],
  chip: ['.#.##.#.', '########', '.#....#.', '##.##.##', '##.##.##', '.#....#.', '########', '.#.##.#.'],
  disk: ['#######.', '#.####.#', '#.####.#', '#......#', '########', '##....##', '##....##', '########'],
};
const icon = (rows, s, ox, oy) => rows.map((r, y) => [...r].map((ch, x) => ch === '#' ? `M${ox + x * s} ${oy + y * s}h${s}v${s}h${-s}z` : '').join('')).join('');

// ---- avatar sprite (same pixels as the site) ----
const PAL = { O: '#1b1424', H: '#4b2e22', h: '#7a4b33', S: '#f3c9a1', s: '#d79c78', E: '#2a1a14', B: '#4f7bd6', b: '#38589f', l: '#7ea2ee', P: '#8a5a3c', p: '#6c4430', G: '#a7adb6', g: '#5d636c' };
const HEAD = {
  down: ['...O.OOOOO.O....', '..OHOHHHHHHOHO..', '.OHHHHHHHHHHHHO.', '.OHHhHHHHHhHHHO.', '.OHHHHHHHHHHHHO.', '.OHHHHHHHHSSHHO.', '.OHHSSSSSSSSHHO.', '.OHSSESSSSESSHO.', '.OSSSSSSSSSSSSO.', '..OSSSSssSSSSO..', '...OOsSSSSsOO...', '....OOSSSSOO....'],
  up: ['...O.OOOOO.O....', '..OHOHHHHHHOHO..', '.OHHHHHHHHHHHHO.', '.OHHhHHHHHhHHHO.', '.OHHHHHHHHHHHHO.', '.OHHHHHHHHHHHHO.', '.OHHHHHHHHHHHHO.', '.OHHHHHHhHHHHHO.', '.OSHHHHHHHHHHSO.', '..OHHHHHHHHHHO..', '...OOHHHHHHOO...', '....OOSSSSOO....'],
  side: ['......OOOO......', '....OOHHHHOO....', '...OHHHHHHHHO...', '..OHHhHHHHHHHO..', '..OHHHHHHHHHHHO.', '..OHHHHHHSSSSO..', '..OHHHHHSSSSSO..', '..OHHHHSSSESSO..', '..OHHHSSSSSSSSO.', '...OHHSSSSsSO...', '....OOSSSSOO....', '.....OSSSSO.....'],
};
const BODY = {
  front: ['..OOBBBBBBBBOO..', '.OBBBBlBBlBBBBO.', '.OBBBBBBBBBBBBO.', '.ObBBBBBBBBBBbO.', '.ObBBBBBBBBBBbO.', '.OSbBBBBBBBBbSO.', '..OObBBBBBBbOO..'],
  side: ['....OBBBBBBO....', '...OBBBBlBBBO...', '...OBBBBBBBBO...', '...ObBBBBBBBO...', '...ObBBBBBBBO...', '...ObBSSBBBbO...', '....OObbbbOO....'],
};
const LEGS = {
  front: [['...OPPPPPPPPO...', '...OPPPPPPPPO...', '...OPPPOOPPPO...', '...OGGGOOGGGO...', '...OgggOOgggO...'], ['...OPPPPPPPPO...', '...OPPPOOPPPO...', '...OPPPOOGGGO...', '...OGGGOOgggO...', '...OgggO.OOO....']],
  side: [['.....OPPPPO.....', '.....OPPPPO.....', '.....OPPPPO.....', '.....OGGGGGO....', '.....OgggggO....'], ['....OPPPPPPO....', '...OPPPOOPPPO...', '..OPPPO..OPPPO..', '.OGGGO....OGGGGO', '.OgggO....OggggO']],
};
const PX = 3;
function sprite(rows) {   // merged horizontal runs, origin at the feet (bottom centre)
  let out = '';
  rows.forEach((r, y) => {
    for (let x = 0; x < r.length;) {
      const ch = r[x]; let n = 1;
      while (x + n < r.length && r[x + n] === ch) n++;
      if (PAL[ch]) out += `<rect x="${(x - 8) * PX}" y="${(y - 24) * PX}" width="${n * PX}" height="${PX}" fill="${PAL[ch]}"/>`;
      x += n;
    }
  });
  return out;
}
const SETS = {
  side: [sprite([...HEAD.side, ...BODY.side, ...LEGS.side[0]]), sprite([...HEAD.side, ...BODY.side, ...LEGS.side[1]])],
  down: [sprite([...HEAD.down, ...BODY.front, ...LEGS.front[0]]), sprite([...HEAD.down, ...BODY.front, ...LEGS.front[1]])],
  up: [sprite([...HEAD.up, ...BODY.front, ...LEGS.front[0]]), sprite([...HEAD.up, ...BODY.front, ...LEGS.front[1]])],
};

// ---- route the tour along tree wires ----
const chain = (id) => { const out = []; for (let n = byId[id]; n; n = byId[n.parent]) out.push(n.id); return out; };
function hops(a, b) {   // up from a to the common ancestor, then down to b
  const ca = chain(a), cb = chain(b), lca = ca.find((id) => cb.includes(id));
  const up = ca.slice(0, ca.indexOf(lca) + 1), down = cb.slice(0, cb.indexOf(lca)).reverse();
  const seq = [...up, ...down], out = [];
  for (let i = 1; i < seq.length; i++) {
    const x = seq[i - 1], y = seq[i], fwd = byId[y].parent === x;
    out.push({ to: y, fwd, pts: fwd ? wire(x, y) : wire(y, x).reverse() });
  }
  return out;
}
const station = (n, side) => { const [x, y] = anchor(n, side); return [x + (side === 'l' ? -26 : 26), y]; };

const keys = [];         // [t, x, y] avatar waypoints
const moves = [];        // [t0, t1, dir, flip] walking segments
const stops = [];        // [arrive, leave, tourIndex]
let t = 0, pos = station(byId.root, 'r');
keys.push([0, ...pos]);
TOUR.forEach((stop, i) => {
  if (i > 0) {
    const hs = hops(TOUR[i - 1][0], stop[0]);
    const pts = hs.flatMap((hh) => hh.pts);
    const last = hs.at(-1);
    pts[pts.length - 1] = station(byId[last.to], last.fwd ? 'l' : 'r');
    for (const p of pts) {
      const len = Math.hypot(p[0] - pos[0], p[1] - pos[1]);
      if (len < 0.5) continue;
      const dx = p[0] - pos[0], dy = p[1] - pos[1], dur = len / SPEED;
      moves.push([t, t + dur, Math.abs(dx) > Math.abs(dy) ? 'side' : dy > 0 ? 'down' : 'up', dx < 0]);
      t += dur; pos = p; keys.push([t, ...pos]);
    }
  }
  stops.push([t, t + DWELL, i]);
  t += DWELL; keys.push([t, ...pos]);
});
{ // walk home so the loop closes
  const hs = hops(TOUR.at(-1)[0], 'root'), pts = hs.flatMap((hh) => hh.pts);
  pts[pts.length - 1] = station(byId.root, 'r');
  for (const p of pts) {
    const len = Math.hypot(p[0] - pos[0], p[1] - pos[1]);
    if (len < 0.5) continue;
    const dx = p[0] - pos[0], dy = p[1] - pos[1], dur = len / SPEED;
    moves.push([t, t + dur, Math.abs(dx) > Math.abs(dy) ? 'side' : dy > 0 ? 'down' : 'up', dx < 0]);
    t += dur; pos = p; keys.push([t, ...pos]);
  }
}
const T = t;
const pct = (s) => +(s / T * 100).toFixed(3);
function windows(name, prop, on, off, spans) {   // sharp on/off keyframes over the loop
  const pts = [[0, off]];
  spans.forEach(([a, b]) => { pts.push([Math.max(0, pct(a) - 0.01), off], [pct(a), on], [pct(b), on], [Math.min(100, pct(b) + 0.01), off]); });
  pts.push([100, off]);
  return `@keyframes ${name}{${pts.map(([p, v]) => `${p}%{${prop}:${v}}`).join('')}}`;
}
let css = '';
css += `@keyframes walkpath{${keys.map(([s, x, y]) => `${pct(s)}%{transform:translate(${x.toFixed(1)}px,${y.toFixed(1)}px)}`).join('')}}`;
for (const dir of ['side', 'down', 'up']) css += windows('w-' + dir, 'opacity', 1, 0, moves.filter((m) => m[2] === dir).map((m) => [m[0], m[1]]));
css += windows('w-idle', 'opacity', 1, 0, stops.map(([a, b]) => [a, b]));
css += windows('w-flip', 'transform', 'scaleX(-1)', 'scaleX(1)', moves.filter((m) => m[2] === 'side' && m[3]).map((m) => [m[0], m[1]]));
stops.forEach(([a, b, i]) => {
  const next = stops[i + 1] ? stops[i + 1][0] : T;
  css += windows('hl' + i, 'opacity', 1, 0, [[a, b]]);
  css += windows('say' + i, 'opacity', 1, 0, i === 0 ? [[0, next]] : [[a, next]]);
  css += windows('bang' + i, 'opacity', 1, 0, [[a, Math.min(b, a + 0.6)]]);
});

// ---- draw ----
const W = 880, H = 594, K = 0.66, OX = 14, OY = 54;
const col = (n) => C[n.sec];
let map = '';
const tree = nodes.filter((n) => n.parent).map((n) => ({ from: n.parent, to: n.id }));
tree.forEach((e) => { map += `<path d="${d(wire(e.from, e.to))}" fill="none" stroke="${col(byId[e.to])[2]}" stroke-width="2.5"/>`; });
stops.forEach(([, , i]) => {   // each stop's skill wires, shown while the avatar is there
  const n = byId[TOUR[i][0]];
  if (!n.skills) return;
  map += `<g class="hl${i}">${n.skills.map((k) => `<path d="${d(wire(n.id, 's-' + k, 'skill'))}" fill="none" stroke="${C.blue[0]}" stroke-width="2.5"/>`).join('')}</g>`;
});
nodes.forEach((n) => {
  const [w, h] = SIZE[n.kind], x = n.x - w / 2, y = n.y - h / 2, [c, , cd] = col(n);
  map += `<path d="${notch(x + 6, y + 6, w, h)}" fill="${C.shadow}"/>`;
  map += `<path d="${notch(x, y, w, h)}" fill="${n.kind === 'hub' ? c : C.panel}" stroke="${c}" stroke-width="2.5"/>`;
  if (n.kind === 'root') {
    map += `<image href="${PORTRAIT}" x="${x + 12}" y="${n.y - 24}" width="48" height="48" style="image-rendering:pixelated"/>`;
    map += `<text x="${x + 72}" y="${n.y - 2}" class="lbl" fill="${col(n)[1]}" font-size="18">${esc(n.label)}</text><text x="${x + 72}" y="${n.y + 20}" class="sub" fill="${c}">${esc(n.sub)}</text>`;
  } else if (n.kind === 'hub') {
    map += `<path d="${icon(ICONS[n.icon], 2.5, x + 16, n.y - 10)}" fill="${C.bg}"/><text x="${x + 46}" y="${n.y + 7}" class="lbl" fill="${C.bg}">${esc(n.label)}</text>`;
  } else {
    map += `<path d="${icon(ICONS[n.icon], 2.5, x + 14, n.y - 10)}" fill="${c}"/><text x="${x + 46}" y="${n.y - 3}" class="lbl" fill="${C.fg}">${esc(n.label)}</text><text x="${x + 46}" y="${n.y + 19}" class="sub" fill="${C.muted}">${esc(n.sub)}</text>`;
  }
  const ti = TOUR.findIndex(([id]) => id === n.id);
  if (ti >= 0) map += `<path class="hl${ti}" d="${notch(x - 4, y - 4, w + 8, h + 8, 6)}" fill="none" stroke="${col(n)[1]}" stroke-width="3"/>`;
});
const uses = (id) => nodes.concat(data.nodes.filter((n) => n.hidden)).filter((n) => (n.skills ?? []).includes(id)).length;
skills.forEach((s) => {
  const u = uses(s.skill);
  map += `<path d="${notch(s.x - 8, s.y - 8, 16, 16, 3)}" fill="${C.bg}" stroke="${C.blue[0]}" stroke-width="2.5"/><rect x="${s.x - 3}" y="${s.y - 3}" width="6" height="6" fill="${C.blue[0]}"/>`;
  map += `<text x="${s.x + 18}" y="${s.y + 7}" class="lbl" fill="${C.blue[1]}">${esc(s.label)}</text>`;
  for (let i = 0; i < 6; i++) map += `<rect x="${s.x + 18 + i * 10}" y="${s.y - 21}" width="7" height="7" fill="${i < u ? C.blue[0] : C.line}"/>`;
});
const avatar = `<g class="walker"><rect x="-14" y="-3" width="28" height="5" fill="#000" opacity=".45"/>
${['side', 'down', 'up'].map((dir) => `<g class="w-${dir}"><g class="${dir === 'side' ? 'flip' : ''}"><g class="fa">${SETS[dir][0]}</g><g class="fb">${SETS[dir][1]}</g></g></g>`).join('')}
<g class="w-idle">${SETS.down[0]}</g>
${stops.map(([, , i]) => `<text class="bang${i}" x="-6" y="-80" fill="${C.orange[1]}" font-size="26" font-weight="700">!</text>`).join('')}
</g>`;

const BY = H - 104;   // dialog box
const dialog = `<path d="${notch(16, BY, W - 32, 88, 6)}" fill="${C.panel}" stroke="${C.orange[0]}" stroke-width="3"/>
<image href="${PORTRAIT}" x="30" y="${BY + 14}" width="60" height="60" style="image-rendering:pixelated"/>
<rect x="30" y="${BY + 14}" width="60" height="60" fill="none" stroke="${C.orange[0]}" stroke-width="2"/>
<text x="106" y="${BY + 22}" class="who" fill="${C.orange[0]}">HAO-FU</text>
${TOUR.map(([id, title, line], i) => `<g class="say${i}"><text x="106" y="${BY + 46}" class="dt" fill="${col(byId[id])[1]}">${esc(title)}</text><text x="106" y="${BY + 70}" class="dl" fill="${C.fg}">${esc(line)}</text></g>`).join('')}
<text x="${W - 34}" y="${BY + 78}" class="next" fill="${C.orange[0]}">▼</text>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Pixel map of Hao-Fu Chang's work, builds and skills. A small avatar walks to MaiAgent, lumi-ai-customer-service, vocab-pipeline and agent-workflow while a dialog box describes each.">
<style>
text{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;white-space:pre}
.lbl{font-size:16px;font-weight:700}.sub{font-size:13px}.title{font-size:15px}.cmd{font-size:17px}
.who{font-size:13px;font-weight:700;letter-spacing:.1em}.dt{font-size:17px;font-weight:700}.dl{font-size:15px}
@keyframes blink{50%{opacity:0}}
@keyframes stepA{0%,49.9%{opacity:1}50%,100%{opacity:0}}
@keyframes stepB{0%,49.9%{opacity:0}50%,100%{opacity:1}}
.cursor,.next{animation:blink 1s steps(1) infinite}
.fa{animation:stepA .36s infinite}.fb{animation:stepB .36s infinite}
.walker{animation:walkpath ${T.toFixed(2)}s linear infinite}
.w-side{animation:w-side ${T.toFixed(2)}s infinite}.w-down{animation:w-down ${T.toFixed(2)}s infinite}.w-up{animation:w-up ${T.toFixed(2)}s infinite}.w-idle{animation:w-idle ${T.toFixed(2)}s infinite}
.flip{transform-box:fill-box;transform-origin:center;animation:w-flip ${T.toFixed(2)}s infinite}
${stops.map(([, , i]) => `.hl${i}{animation:hl${i} ${T.toFixed(2)}s infinite}.say${i}{animation:say${i} ${T.toFixed(2)}s infinite}.bang${i}{animation:bang${i} ${T.toFixed(2)}s infinite}`).join('')}
${css}
@media (prefers-reduced-motion:reduce){.walker,.w-side,.w-down,.w-up,.w-idle,.flip,.fa,.fb,.cursor,.next,[class^=hl],[class^=say],[class^=bang]{animation:none}.w-side,.w-down,.w-up,[class^=hl],[class^=bang],${TOUR.slice(1).map((_, i) => '.say' + (i + 1)).join(',')}{opacity:0}.walker{transform:translate(${station(byId.root, 'r').join('px,')}px)}}
</style>
<defs><pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse"><rect x="11" y="11" width="2" height="2" fill="${C.line}"/></pattern></defs>
<rect width="${W}" height="${H}" fill="${C.bg}"/>
<rect width="${W}" height="${H}" fill="url(#dots)"/>
<rect width="${W}" height="34" fill="${C.bar}"/>
<rect x="14" y="11" width="12" height="12" fill="${C.bg}"/><rect x="14" y="11" width="12" height="3" fill="${C.blue[1]}"/><rect x="14" y="21" width="12" height="2" fill="${C.orange[0]}"/>
<text class="title" x="36" y="23" fill="${C.fg}">C:\\Users\\haofu\\blueprint.exe</text>
<text class="title" x="${W - 16}" y="23" fill="${C.blue[1]}" text-anchor="end">▶ click to play · blacktea3250106.github.io</text>
<text class="cmd" x="24" y="64" fill="${C.orange[0]}">C:\\Users\\haofu&gt;<tspan fill="${C.fg}">start blueprint.exe</tspan></text>
<rect class="cursor" x="${24 + 34 * 10.2 + 2}" y="50" width="10" height="18" fill="${C.orange[0]}"/>
<g transform="translate(${OX} ${OY}) scale(${K})">${map}${avatar}</g>
${dialog}
</svg>
`;
fs.writeFileSync(new URL('../assets/map.svg', import.meta.url), svg);
console.log(`assets/map.svg ${(svg.length / 1024).toFixed(1)} KB · loop ${T.toFixed(1)}s`);
