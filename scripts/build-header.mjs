// Builds assets/header.svg: a cmd window that types a short intro while the pixel avatar walks along the bottom.
// GitHub renders README images without scripts, so all motion is CSS inside the SVG. Run: node scripts/build-header.mjs
import fs from 'node:fs';

const W = 880, H = 356, PX = 3;
const C = { bg: '#0b0f17', bar: '#1f4f86', fg: '#e9eef7', muted: '#95a3ba', orange: '#ff9f43', orangeHi: '#ffc489', green: '#5fd68a', blue: '#a9d2ff', line: '#1f2a3d' };

// same sprite as the site: 16×24, side view, two stride frames
const PAL = { O: '#1b1424', H: '#4b2e22', h: '#7a4b33', S: '#f3c9a1', s: '#d79c78', E: '#2a1a14', B: '#4f7bd6', b: '#38589f', l: '#7ea2ee', P: '#8a5a3c', p: '#6c4430', G: '#a7adb6', g: '#5d636c' };
const HEAD = ['......OOOO......', '....OOHHHHOO....', '...OHHHHHHHHO...', '..OHHhHHHHHHHO..', '..OHHHHHHHHHHHO.', '..OHHHHHHSSSSO..', '..OHHHHHSSSSSO..', '..OHHHHSSSESSO..', '..OHHHSSSSSSSSO.', '...OHHSSSSsSO...', '....OOSSSSOO....', '.....OSSSSO.....'];
const BODY = ['....OBBBBBBO....', '...OBBBBlBBBO...', '...OBBBBBBBBO...', '...ObBBBBBBBO...', '...ObBBBBBBBO...', '...ObBSSBBBbO...', '....OObbbbOO....'];
const LEGS = [
  ['.....OPPPPO.....', '.....OPPPPO.....', '.....OPPPPO.....', '.....OGGGGGO....', '.....OgggggO....'],
  ['....OPPPPPPO....', '...OPPPOOPPPO...', '..OPPPO..OPPPO..', '.OGGGO....OGGGGO', '.OgggO....OggggO'],
];
function sprite(rows) {   // merge horizontal runs of one color into a single rect
  let out = '';
  rows.forEach((r, y) => {
    for (let x = 0; x < r.length;) {
      const ch = r[x]; let n = 1;
      while (x + n < r.length && r[x + n] === ch) n++;
      if (PAL[ch]) out += `<rect x="${x * PX}" y="${y * PX}" width="${n * PX}" height="${PX}" fill="${PAL[ch]}"/>`;
      x += n;
    }
  });
  return out;
}

const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const PROMPT = 'C:\\Users\\haofu>';
// [prompt?, text, color]; each line types in after the previous one
const LINES = [
  [true, 'whoami', C.fg],
  [false, 'Hao-Fu Chang · AI Product Engineer', C.orangeHi],
  [false, 'Backend for enterprise AI · RAG / LLM infra · agents & evals', C.fg],
  [true, 'dir build', C.fg],
  [false, 'lumi-ai-customer-service  dream-journal  vocab-pipeline', C.green],
  [false, 'agent-workflow  pet-to-character', C.green],
  [true, 'start blueprint.exe', C.fg],
];
const CH = 10.2, LH = 27, X0 = 28, Y0 = 72;   // monospace 17px ≈ 10.2px per glyph
let t = 0.4, text = '', clips = '', css = '';
LINES.forEach(([prompt, s, color], i) => {
  const y = Y0 + i * LH;
  const full = (prompt ? PROMPT : '') + s;
  const typed = prompt ? s.length : full.length;   // prompts appear at once, commands type out
  const x = X0 + (prompt ? PROMPT.length * CH : 0);
  const dur = prompt ? typed * 0.06 : 0.25;
  clips += `<clipPath id="c${i}"><rect class="r${i}" x="${x}" y="${y - 20}" height="28" width="${(typed * CH).toFixed(1)}"/></clipPath>`;
  css += `.r${i}{transform-origin:${x}px 0;animation:type ${dur.toFixed(2)}s steps(${prompt ? typed : 1}) ${t.toFixed(2)}s both}`;
  css += `.l${i}{animation:show 0s ${(t - (prompt ? 0.35 : 0)).toFixed(2)}s both}`;
  if (prompt) text += `<text class="l${i}" x="${X0}" y="${y}" fill="${C.orange}">${esc(PROMPT)}</text>`;
  text += `<text class="l${i}" x="${x}" y="${y}" fill="${color}" clip-path="url(#c${i})">${esc(s)}</text>`;
  t += dur + (prompt ? 0.35 : 0.15);
});
const lastY = Y0 + (LINES.length - 1) * LH;
const cursorX = X0 + (PROMPT.length + LINES.at(-1)[1].length) * CH + 4;

const groundY = H - 26, spriteH = 24 * PX;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Command prompt typing: Hao-Fu Chang, AI Product Engineer. A pixel avatar walks across the bottom.">
<style>
text{font:17px ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;white-space:pre}
.title{font-size:15px}
@keyframes type{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes show{from{opacity:0}to{opacity:1}}
@keyframes blink{50%{opacity:0}}
@keyframes walk{from{transform:translateX(-60px)}to{transform:translateX(${W + 10}px)}}
@keyframes stepA{0%,49.9%{opacity:1}50%,100%{opacity:0}}
@keyframes stepB{0%,49.9%{opacity:0}50%,100%{opacity:1}}
.cursor{animation:show 0s ${t.toFixed(2)}s both,blink 1s steps(1) ${t.toFixed(2)}s infinite}
.walker{animation:walk 11s linear infinite}
.fa{animation:stepA .42s infinite}.fb{animation:stepB .42s infinite}
${css}
@media (prefers-reduced-motion:reduce){*{animation-duration:0s!important;animation-delay:0s!important;animation-iteration-count:1!important}.walker{transform:translateX(${W - 120}px)}}
</style>
<defs>${clips}<pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse"><rect x="11" y="11" width="2" height="2" fill="${C.line}"/></pattern></defs>
<rect width="${W}" height="${H}" fill="${C.bg}"/>
<rect width="${W}" height="${H}" fill="url(#dots)"/>
<rect width="${W}" height="34" fill="${C.bar}"/>
<rect x="14" y="11" width="12" height="12" fill="${C.bg}"/><rect x="14" y="11" width="12" height="3" fill="${C.blue}"/><rect x="14" y="21" width="12" height="2" fill="${C.orange}"/>
<text class="title" x="36" y="23" fill="${C.fg}">C:\\Users\\haofu\\blueprint.exe</text>
<text class="title" x="${W - 16}" y="23" fill="${C.blue}" text-anchor="end">blacktea3250106.github.io</text>
${text}
<rect class="cursor" x="${cursorX.toFixed(1)}" y="${lastY - 15}" width="10" height="19" fill="${C.orange}"/>
<rect x="0" y="${groundY}" width="${W}" height="3" fill="${C.line}"/>
<g class="walker"><g transform="translate(0 ${groundY - spriteH})">
<rect x="6" y="${spriteH - 4}" width="36" height="5" fill="#000" opacity=".45"/>
<g class="fa">${sprite([...HEAD, ...BODY, ...LEGS[0]])}</g>
<g class="fb">${sprite([...HEAD, ...BODY, ...LEGS[1]])}</g>
</g></g>
</svg>
`;
fs.writeFileSync(new URL('../assets/header.svg', import.meta.url), svg);
console.log('assets/header.svg', svg.length, 'bytes');
