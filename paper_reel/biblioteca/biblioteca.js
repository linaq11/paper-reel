// biblioteca.js: plantillas animadas de paper-reel (contrato en docs/plantillas.md).
// JavaScript plano, sin dependencias. Se inserta en motor.html o motor_h.html antes de la especificación de escenas.
// H (ayudas del motor) y FIGURAS solo se leen dentro de las funciones draw; el archivo se puede cargar con node
// (require) para leer el catálogo sin que exista H.
// Lienzo de cada escena: SVG 1080 x 1060. Zona segura: nada importante en x<420 e y<110 (etiqueta de capítulo)
// ni en y>1000. Las plantillas solo muestran cifras que reciben en los params.

/* ====================================================================== ayudas privadas */
const _PR = (() => {
  const f = (x, d = 1) => (+x).toFixed(d);
  const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, x) => a + (b - a) * x;
  const eo = x => 1 - Math.pow(1 - cl(x), 3);
  const eio = x => { x = cl(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const pg = (lt, a, b) => eo((lt - a) / ((b - a) || 1e-6));
  const pl = (lt, a, b) => cl((lt - a) / ((b - a) || 1e-6));
  const bo = x => { x = cl(x); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const pop = (lt, t, d = .45) => (lt < t ? 0 : bo((lt - t) / d));
  const rnd = seed => { let s = Math.floor(seed) % 2147483647; if (s <= 0) s += 2147483646; return () => (s = s * 16807 % 2147483647) / 2147483647; };
  const gauss = r => Math.sqrt(-2 * Math.log(r() || 1e-6)) * Math.cos(2 * Math.PI * r());
  const num = (x, dec = 0) => (+x).toLocaleString('es-CO', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const len = s => [...String(s == null ? '' : s)].length;
  const tw = (txt, fs, k = .6) => len(txt) * fs * k;                        // ancho aproximado de un texto
  const fit = (txt, fs, maxW, k = .6) => Math.min(fs, maxW / Math.max(1, len(txt) * k));
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, x) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, k) => Math.round(v + (B[k] - v) * cl(x))).join(',')})`; };
  const PAL = ['#6cc4ff', '#ffd166', '#ff6b6b', '#7CFFB2', '#f2a65a', '#a78bfa'];
  const FT = 'Inter, Arial, sans-serif', FM = 'JetBrains Mono, Consolas, monospace';
  const _memo = new Map();
  const memo = (k, fn) => { if (!_memo.has(k)) { if (_memo.size > 200) _memo.clear(); _memo.set(k, fn()); } return _memo.get(k); };
  // segundo local del evento: palabra de la voz (o lista de alternativas) o fracción de la escena
  const cu = (i, w, frac, dur) => {
    if (typeof H !== 'undefined' && H.cuando) return H.cuando(i, w, frac, dur);
    return frac * dur;
  };
  const V = (p, k, d) => (p && p[k] != null && p[k] !== '' ? p[k] : d);
  const wrap = (txt, maxC) => {
    const ws = String(txt == null ? '' : txt).split(/\s+/).filter(Boolean), L = []; let cur = '';
    for (const w of ws) { if (!cur) cur = w; else if (len(cur + ' ' + w) <= maxC) cur += ' ' + w; else { L.push(cur); cur = w; } }
    if (cur) L.push(cur);
    return L;
  };
  // parte un texto en como mucho maxL líneas que quepan en maxW, bajando la letra si hace falta
  function bloque(txt, maxW, fs0, maxL, k = .6, fsMin = 24) {
    for (let fs = fs0; fs >= fsMin; fs -= 2) {
      const mc = Math.max(4, Math.floor(maxW / (fs * k))), lines = wrap(txt, mc);
      if (lines.length <= maxL && lines.every(l => len(l) <= mc)) return { lines, fs };
    }
    const mc = Math.max(4, Math.floor(maxW / (fsMin * k)));
    let lines = wrap(txt, mc);
    if (lines.length > maxL) { lines = lines.slice(0, maxL); lines[maxL - 1] += '...'; }
    return { lines, fs: fsMin };
  }
  // etiqueta monoespaciada sobre recuadro oscuro
  function tag(x, y, txt, o = {}) {
    const op = o.op == null ? 1 : o.op;
    if (op <= .005 || txt == null || txt === '') return '';
    let fs = o.fs || 26;
    if (o.max) fs = Math.min(fs, fit(txt, fs, o.max - 26, .6));
    const w = tw(txt, fs) + 26, h = fs + 16, an = o.anchor || 'middle';
    const x0 = an === 'middle' ? x - w / 2 : an === 'end' ? x - w : x;
    const bd = o.borde ? ` stroke="${o.borde}" stroke-width="2.5"` : '';
    return `<g opacity="${f(cl(op), 2)}"><rect x="${f(x0)}" y="${f(y - h / 2)}" width="${f(w)}" height="${f(h)}" rx="6" fill="${o.fondo || '#0d1020'}" fill-opacity="${o.fop || .92}"${bd}/>` +
      `<text x="${f(x0 + w / 2)}" y="${f(y + fs * .36)}" text-anchor="middle" font-family="${FM}" font-weight="700" font-size="${f(fs)}" fill="${o.color || '#e9ecf3'}">${esc(txt)}</text></g>`;
  }
  // texto suelto (Inter); o.max limita el ancho
  function txt(x, y, t, o = {}) {
    const op = o.op == null ? 1 : o.op;
    if (op <= .005 || t == null || t === '') return '';
    let fs = o.fs || 30;
    if (o.max) fs = Math.min(fs, fit(t, fs, o.max, o.k || (o.mono ? .6 : .58)));
    const tr = o.rot ? ` transform="rotate(${o.rot} ${f(x)} ${f(y)})"` : '';
    return `<text x="${f(x)}" y="${f(y)}"${tr} text-anchor="${o.anchor || 'start'}" font-family="${o.mono ? FM : FT}" font-weight="${o.peso || 700}" font-size="${f(fs)}" fill="${o.color || '#e9ecf3'}" opacity="${f(cl(op), 2)}">${esc(t)}</text>`;
  }
  // partículas que suben despacio: garantizan movimiento en todos los cuadros
  function polvo(lt, seed = 1, n = 18, col = '#ffffff', op = .16) {
    const r = rnd(seed); let s = '';
    for (let k = 0; k < n; k++) {
      const x0 = r() * 1080, y0 = r(), sp = .012 + r() * .03, rad = 1.6 + r() * 2.8, ph = r() * 6.28;
      const y = 120 + ((((y0 - lt * sp) % 1) + 1) % 1) * 870, x = x0 + 14 * Math.sin(lt * .5 + ph);
      s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rad)}" fill="${col}" opacity="${f(op * (.55 + .45 * Math.sin(lt * 1.3 + ph)), 2)}"/>`;
    }
    return s;
  }
  const svg = (s, defs = '') => `<svg viewBox="0 0 1080 1060" xmlns="http://www.w3.org/2000/svg" font-family="${FT}">${defs ? `<defs>${defs}</defs>` : ''}${s}</svg>`;
  // losa isométrica (capas, suelos)
  const dia = (cx, cy, a, b) => `${f(cx - a)},${f(cy)} ${f(cx)},${f(cy - b)} ${f(cx + a)},${f(cy)} ${f(cx)},${f(cy + b)}`;
  function slab(cx, cy, a, b, th, top, sl, sr, op = 1, stroke = '') {
    if (op <= .005) return '';
    const st = stroke ? ` stroke="${stroke}" stroke-width="3"` : '';
    return `<g opacity="${f(cl(op), 2)}"><polygon points="${f(cx - a)},${f(cy)} ${f(cx)},${f(cy + b)} ${f(cx)},${f(cy + b + th)} ${f(cx - a)},${f(cy + th)}" fill="${sl}"/>` +
      `<polygon points="${f(cx)},${f(cy + b)} ${f(cx + a)},${f(cy)} ${f(cx + a)},${f(cy + th)} ${f(cx)},${f(cy + b + th)}" fill="${sr}"/><polygon points="${dia(cx, cy, a, b)}" fill="${top}"${st}/></g>`;
  }
  const inPoly = (x, y, P) => { let c = false; for (let a = 0, b = P.length - 1; a < P.length; b = a++) { const [xa, ya] = P[a], [xb, yb] = P[b]; if ((ya > y) !== (yb > y) && x < (xb - xa) * (y - ya) / (yb - ya) + xa) c = !c; } return c; };
  // decimales de un número tal como viene escrito
  const decs = v => { const s = String(v); const m = s.match(/\.(\d+)$/); return m ? Math.min(3, m[1].length) : 0; };
  // fondos que tocan los bordes del lienzo (suelo, agua, nubes, Tierra) se desvanecen abajo y, en el motor
  // horizontal, también a los lados: allí el escenario no ocupa toda la pantalla y el borde se vería como una caja
  function fundido(id, s) {
    const horiz = typeof window !== 'undefined' && window.innerWidth > window.innerHeight;
    let d = `<linearGradient id="${id}v" x1="0" x2="0" y1="0" y2="1"><stop offset=".86" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>` +
      `<mask id="${id}mv" maskUnits="userSpaceOnUse" x="-200" y="-200" width="1480" height="1460"><rect x="-200" y="-200" width="1480" height="1260" fill="#fff"/><rect x="-200" y="0" width="1480" height="1060" fill="url(#${id}v)"/></mask>`;
    let g = s;
    if (horiz) {
      d += `<linearGradient id="${id}h" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#000"/><stop offset=".16" stop-color="#fff"/><stop offset=".84" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>` +
        `<mask id="${id}mh" maskUnits="userSpaceOnUse" x="-200" y="-200" width="1480" height="1460"><rect x="0" y="-200" width="1080" height="1460" fill="url(#${id}h)"/></mask>`;
      g = `<g mask="url(#${id}mh)">${g}</g>`;
    }
    return `<defs>${d}</defs><g mask="url(#${id}mv)">${g}</g>`;
  }
  return { f, cl, lerp, eo, eio, pg, pl, bo, pop, rnd, gauss, num, esc, len, tw, fit, mix, PAL, FT, FM, memo, cu, V, wrap, bloque, tag, txt, polvo, svg, dia, slab, inPoly, decs, fundido };
})();

/* ====================================================================== fondos */
const FONDOS = {
  noche: 'linear-gradient(180deg,#121830 0%,#1d2747 55%,#26365a 100%)',
  pizarra: 'linear-gradient(180deg,#3a4150 0%,#4b5364 100%)',
  terracota: 'linear-gradient(180deg,#5a3732 0%,#7a4a3d 100%)',
  morado: 'linear-gradient(180deg,#231d36 0%,#352b52 100%)',
  bosque: 'linear-gradient(180deg,#18302f 0%,#264845 100%)',
  indigo: 'linear-gradient(180deg,#1f2440 0%,#30365c 100%)',
  oceano: 'linear-gradient(180deg,#0f2a3d 0%,#174a5e 100%)',
  grafito: 'linear-gradient(180deg,#1c1d22 0%,#2c2e36 100%)'
};

/* ====================================================================== dibujos
   Firma común: DIBUJO.nombre(x, y, s, t, o) -> texto SVG.
   (x, y) es el centro del objeto, salvo arbol, persona y bosque, que se anclan en la base (pie o raíz).
   A escala s = 1 cada objeto ocupa unos 200 px. t es el tiempo en segundos (anima luces, giros, burbujas).
   o son opciones propias de cada dibujo (color, rot, etc.). */
const DIBUJO = (() => {
  const { f, cl, rnd, tag, num, fit, tw, bo, esc, FT } = _PR;
  const grp = (x, y, k, rot, inner, sx) => `<g transform="translate(${f(x)},${f(y)})${rot ? ` rotate(${f(rot)})` : ''} scale(${f((sx || 1) * k, 3)},${f(k, 3)})">${inner}</g>`;
  const LAND = `<path d="M-560 -230 C-500 -270 -420 -250 -400 -200 C-380 -150 -430 -120 -440 -80 C-420 -40 -380 -20 -360 30 C-340 90 -380 160 -420 230 C-440 260 -470 240 -470 200 C-480 130 -500 80 -500 30 C-520 -20 -560 -60 -580 -120 C-600 -170 -590 -210 -560 -230 Z" fill="#3f9b5b"/>` +
    `<path d="M-120 -250 C-60 -270 20 -250 40 -210 C60 -170 20 -150 10 -120 C60 -110 100 -60 90 0 C80 60 40 120 10 180 C-10 220 -40 220 -50 180 C-60 120 -70 60 -100 20 C-150 -10 -170 -60 -150 -110 C-140 -160 -170 -220 -120 -250 Z" fill="#3f9b5b"/>` +
    `<path d="M140 -260 C230 -290 360 -270 420 -220 C470 -180 450 -120 400 -100 C350 -80 330 -40 290 -30 C250 -20 220 -60 180 -80 C140 -100 110 -150 120 -200 Z" fill="#3f9b5b"/>` +
    `<path d="M330 90 C380 70 450 90 460 140 C470 180 420 200 370 190 C330 180 300 120 330 90 Z" fill="#8f9a4e"/>` +
    `<path d="M-90 -40 C-50 -60 10 -40 30 0 C10 40 -40 50 -80 20 Z" fill="#2f7d4a"/><path d="M-470 -20 C-440 -40 -400 -10 -400 40 C-420 80 -460 60 -470 20 Z" fill="#2f7d4a"/>` +
    `<ellipse cx="0" cy="-300" rx="700" ry="40" fill="#e8eef7" opacity=".85"/><ellipse cx="0" cy="300" rx="700" ry="40" fill="#e8eef7" opacity=".85"/>`;
  const CLOUDS = `<g fill="#ffffff" opacity=".5"><ellipse cx="-420" cy="-120" rx="90" ry="16"/><ellipse cx="-80" cy="90" rx="120" ry="18"/><ellipse cx="260" cy="-40" rx="80" ry="14"/><ellipse cx="480" cy="160" rx="100" ry="15"/></g>`;
  const D = {
    satelite(x, y, s = 1, t = 0, o = {}) {
      const k = s * .66, blink = (t * 1.3) % 1 < .5 ? 1 : .25, gl = (t * .35) % 1, pan = o.panel || '#3d63c9';
      return grp(x, y, k, o.rot || 0,
        `<line x1="-52" y1="0" x2="52" y2="0" stroke="#c9d1e0" stroke-width="5"/>` +
        `<rect x="-150" y="-22" width="100" height="44" fill="${pan}" stroke="#9fb6ff" stroke-width="2"/><rect x="50" y="-22" width="100" height="44" fill="${pan}" stroke="#9fb6ff" stroke-width="2"/>` +
        `<path d="M-125 -22V22M-100 -22V22M-75 -22V22M75 -22V22M100 -22V22M125 -22V22M-150 0H-50M50 0H150" stroke="#9fb6ff" stroke-width="1.5" opacity=".7"/>` +
        `<rect x="${f(-150 + gl * 286)}" y="-22" width="14" height="44" fill="#fff" opacity=".2"/>` +
        `<rect x="-28" y="-34" width="56" height="66" rx="5" fill="${o.color || '#d9a441'}"/><rect x="-14" y="32" width="28" height="12" fill="#6cc4ff"/>` +
        `<line x1="0" y1="-34" x2="0" y2="-56" stroke="#c9d1e0" stroke-width="3"/><circle cx="0" cy="-60" r="6" fill="#ff6b6b" opacity="${blink}"/>`);
    },
    avion(x, y, s = 1, t = 0, o = {}) {
      const k = s * .65, bl = (t * 1.1) % 1 < .3 ? 1 : .2;
      return grp(x, y, k, o.rot || 0,
        `<path d="M-30 -8L-62 -42H-44L2 -8Z" fill="#aab4c8"/>` +
        `<path d="M-150 -4Q-150 -22 -128 -22H70Q118 -22 142 -2Q118 14 70 14H-128Q-150 14 -150 -4Z" fill="#eef1f6"/>` +
        `<path d="M-138 -20L-166 -66H-140L-104 -20Z" fill="${o.color || '#5c7bd9'}"/>` +
        `<rect x="-112" y="-12" width="176" height="7" rx="3.5" fill="${o.color || '#5c7bd9'}" opacity=".75"/>` +
        `<path d="M114 -15Q130 -11 136 -4H108Z" fill="#2b3a5c"/>` +
        `<path d="M-28 4L-82 60H-52L32 4Z" fill="#c9d1e0"/><rect x="-46" y="12" width="56" height="11" rx="5" fill="#f2a65a"/>` +
        `<circle cx="-80" cy="58" r="5" fill="#ff6b6b" opacity="${bl}"/><circle cx="-164" cy="-64" r="4" fill="#ffffff" opacity="${1.2 - bl}"/>`, o.dir === -1 ? -1 : 1);
    },
    estacion_espacial(x, y, s = 1, t = 0, o = {}) {
      const k = s * .58, bl = .45 + .55 * Math.abs(Math.sin(t * 2.2));
      let p = '';
      for (const px of [-150, -96, 96, 150]) p += `<rect x="${px - 18}" y="-74" width="36" height="62" fill="#4f6fcf" stroke="#9fb6ff" stroke-width="1.5"/><rect x="${px - 18}" y="12" width="36" height="62" fill="#4f6fcf" stroke="#9fb6ff" stroke-width="1.5"/>`;
      return grp(x, y, k, o.rot || 0, `<rect x="-172" y="-5" width="344" height="10" fill="#c9d1e0"/>${p}<rect x="-44" y="-15" width="88" height="30" rx="13" fill="#e8ecf3"/><rect x="-11" y="-36" width="22" height="72" rx="9" fill="#d6dbe6"/><rect x="-9" y="16" width="18" height="16" rx="3" fill="${o.modulo || '#7CFFB2'}" opacity="${f(bl, 2)}"/>`);
    },
    arbol(x, y, s = 1, t = 0, o = {}) {
      const tipo = o.tipo || 'redondo', rot = o.rot != null ? o.rot : 2.2 * Math.sin(t * 1.2 + x * .013);
      let inner, k;
      if (tipo === 'pino') { k = s * 1.33; inner = `<rect x="-5" y="-30" width="10" height="30" fill="#5a3d2b"/><path d="M0 -150L-28 -95H28Z M0 -122L-40 -62H40Z M0 -94L-50 -28H50Z" fill="${o.color || '#2e6b4c'}"/>`; }
      else if (tipo === 'manglar') {
        k = s * 1.45; const c1 = o.color || '#4fae63', c2 = o.color2 || '#2f7d49';
        inner = `<path d="M-4 -44Q-32 -40 -46 0M-2 -40Q-16 -30 -22 0M2 -40Q16 -30 24 0M4 -44Q32 -40 46 0" stroke="#6b4a33" stroke-width="4" fill="none"/><rect x="-5" y="-84" width="10" height="44" rx="3" fill="#6b4a33"/>` +
          `<ellipse cx="0" cy="-100" rx="54" ry="28" fill="${c2}"/><ellipse cx="-26" cy="-92" rx="32" ry="20" fill="${c1}"/><ellipse cx="24" cy="-96" rx="34" ry="22" fill="${c1}"/><ellipse cx="0" cy="-118" rx="30" ry="18" fill="${c1}"/>`;
      } else {
        k = s * 1.43; const c1 = o.color || '#46a35e', c2 = o.color2 || '#2f7d49';
        inner = `<rect x="-6" y="-60" width="12" height="60" rx="3" fill="#6b4a33"/><circle cx="0" cy="-92" r="42" fill="${c2}"/><circle cx="-26" cy="-74" r="30" fill="${c1}"/><circle cx="24" cy="-78" r="32" fill="${c1}"/><circle cx="2" cy="-112" r="28" fill="${c1}"/>`;
      }
      return grp(x, y, k, rot, inner);
    },
    bosque(x, y, s = 1, t = 0, o = {}) {
      const ancho = o.ancho || 640 * s, n = o.n || Math.max(3, Math.round(ancho / (92 * s))), r = rnd(o.semilla || 3), cre = o.crecer == null ? 1 : o.crecer;
      let out = '';
      if (o.suelo !== false) out += `<path d="M${f(x - ancho / 2 - 40)} ${f(y + 6)}Q${f(x)} ${f(y - 16 * s)} ${f(x + ancho / 2 + 40)} ${f(y + 6)}V${f(y + 40 * s)}H${f(x - ancho / 2 - 40)}Z" fill="${o.colorSuelo || '#1c3a2c'}"/>`;
      for (let k = 0; k < n; k++) {
        const jx = r(), js = r(), jt = r();
        const xk = x - ancho / 2 + (k + .5) * ancho / n + (jx - .5) * 22 * s, sk = s * (.62 + js * .32);
        const tipo = (!o.tipo || o.tipo === 'mixto') ? (jt < .33 ? 'pino' : 'redondo') : o.tipo;
        const gk = bo(cl((cre - k / n * .6) / .4));
        if (gk > .01) out += D.arbol(xk, y + (k % 2) * 4 * s, sk * gk, t + k * .7, { tipo, color: o.color, color2: o.color2 });
      }
      return out;
    },
    laser(x, y, s = 1, t = 0, o = {}) {
      const [x2, y2] = o.hasta || [x, y + 400 * s], col = o.color || '#7CFFB2', op = o.op == null ? 1 : o.op, pr = o.progreso == null ? 1 : cl(o.progreso);
      if (op <= .01 || pr <= .01) return '';
      const ex = x + (x2 - x) * pr, ey = y + (y2 - y) * pr, dx = ex - x, dy = ey - y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, w = (o.ancho || 36) * s * pr;
      let out = `<polygon points="${f(x + nx * 3)},${f(y + ny * 3)} ${f(x - nx * 3)},${f(y - ny * 3)} ${f(ex - nx * w / 2)},${f(ey - ny * w / 2)} ${f(ex + nx * w / 2)},${f(ey + ny * w / 2)}" fill="${col}" opacity=".22"/>`;
      out += `<line x1="${f(x)}" y1="${f(y)}" x2="${f(ex)}" y2="${f(ey)}" stroke="${col}" stroke-width="${f(3 * s)}"/>`;
      for (let q = 0; q < 4; q++) { const u = (t * 1.5 + q / 4) % 1; if (u <= pr) out += `<circle cx="${f(x + (x2 - x) * u)}" cy="${f(y + (y2 - y) * u)}" r="${f(6 * s)}" fill="#f2fff7"/>`; }
      if (o.huella !== false && pr >= .99) {
        const rw = (o.ancho || 36) * s * .9;
        out += `<ellipse cx="${f(x2)}" cy="${f(y2)}" rx="${f(rw)}" ry="${f(rw * .3)}" fill="${col}" fill-opacity=".3" stroke="${col}" stroke-width="3"/>`;
        for (let q = 0; q < 2; q++) { const u = (t * 1.1 + q * .5) % 1; out += `<ellipse cx="${f(x2)}" cy="${f(y2)}" rx="${f(rw * (1 + 1.6 * u))}" ry="${f(rw * .3 * (1 + 1.6 * u))}" fill="none" stroke="${col}" stroke-width="2.5" opacity="${f((1 - u) * .6, 2)}"/>`; }
      }
      return `<g opacity="${f(op, 2)}">${out}</g>`;
    },
    globo(x, y, s = 1, t = 0, o = {}) {
      const R = 100 * s, k = R / 300, id = 'gl' + Math.round(x) + '_' + Math.round(y), sh = ((t * (o.vel == null ? 34 : o.vel)) % 1200 + 1200) % 1200, sc = ((t * 55) % 1200 + 1200) % 1200;
      return `<g transform="translate(${f(x)},${f(y)}) scale(${f(k, 4)})"><defs>` +
        `<radialGradient id="${id}o" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#4f8fdb"/><stop offset="1" stop-color="#1b3f7a"/></radialGradient>` +
        `<radialGradient id="${id}s" cx="38%" cy="30%" r="75%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#050a1a" stop-opacity=".6"/></radialGradient>` +
        `<clipPath id="${id}c"><circle r="300"/></clipPath></defs>` +
        `<circle r="330" fill="#7cc4ff" opacity=".08"/><circle r="300" fill="url(#${id}o)"/>` +
        `<g clip-path="url(#${id}c)"><g transform="translate(${f(-sh)} 0)">${LAND}</g><g transform="translate(${f(1200 - sh)} 0)">${LAND}</g>` +
        `<g transform="translate(${f(-sc)} 0)">${CLOUDS}</g><g transform="translate(${f(1200 - sc)} 0)">${CLOUDS}</g></g>` +
        `<circle r="300" fill="url(#${id}s)"/><circle r="306" fill="none" stroke="#7cc4ff" stroke-opacity=".35" stroke-width="7"/></g>`;
    },
    lupa(x, y, s = 1, t = 0, o = {}) {
      const r = 70 * s, cx = x - 20 * s, cy = y - 20 * s, id = 'lp' + Math.round(x) + '_' + Math.round(y), a = -2.4 + .25 * Math.sin(t * 1.4);
      const h1 = [cx + r * .72, cy + r * .72], h2 = [cx + r * 1.75, cy + r * 1.75];
      let out = `<line x1="${f(h1[0])}" y1="${f(h1[1])}" x2="${f(h2[0])}" y2="${f(h2[1])}" stroke="#6b4a33" stroke-width="${f(18 * s)}" stroke-linecap="round"/>` +
        `<line x1="${f(h1[0])}" y1="${f(h1[1])}" x2="${f(h1[0] + 16 * s)}" y2="${f(h1[1] + 16 * s)}" stroke="#aeb8c9" stroke-width="${f(22 * s)}"/>`;
      out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${o.fondo || 'rgba(160,210,255,.16)'}"/>`;
      if (o.contenido) out += `<defs><clipPath id="${id}"><circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}"/></clipPath></defs><g clip-path="url(#${id})">${o.contenido}</g>`;
      out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="none" stroke="${o.color || '#d9dee8'}" stroke-width="${f(10 * s)}"/>`;
      out += `<path d="M${f(cx + Math.cos(a) * r * .72)} ${f(cy + Math.sin(a) * r * .72)}A${f(r * .72)} ${f(r * .72)} 0 0 1 ${f(cx + Math.cos(a + .8) * r * .72)} ${f(cy + Math.sin(a + .8) * r * .72)}" stroke="#ffffff" stroke-width="${f(6 * s)}" stroke-linecap="round" fill="none" opacity=".55"/>`;
      return out;
    },
    persona(x, y, s = 1, t = 0, o = {}) {
      const col = o.color || '#6cc4ff', piel = o.piel || '#e9b98f', pelo = o.pelo || '#3b2a20', pose = o.pose || 'parado';
      const sw = pose === 'camina' ? Math.sin(t * 6) * 20 : 0, br = Math.sin(t * 2) * 2;
      const armR = pose === 'senala' ? -140 : pose === 'saluda' ? -150 + 22 * Math.sin(t * 7) : 8 + br - sw * .8;
      const armL = -8 - br + sw * .8, blink = (t % 3.3) < .14;
      const leg = (a, xo) => `<g transform="translate(${xo},-64) rotate(${f(a)})"><rect x="-8" y="0" width="16" height="64" rx="7" fill="#2b3550"/><rect x="-10" y="56" width="22" height="9" rx="4" fill="#1b2030"/></g>`;
      const arm = (a, xo, c) => `<g transform="translate(${xo},-128) rotate(${f(a)})"><rect x="-7" y="0" width="14" height="58" rx="7" fill="${c}"/><circle cx="0" cy="60" r="8" fill="${piel}"/></g>`;
      const cuerpo = o.bata ? `<rect x="-31" y="-140" width="62" height="86" rx="20" fill="#f1f3f8"/><path d="M0 -136V-56" stroke="#c9d1e0" stroke-width="3"/><rect x="-12" y="-138" width="24" height="18" rx="6" fill="${col}"/>` : `<rect x="-30" y="-140" width="60" height="84" rx="22" fill="${col}"/>`;
      const ojos = blink ? `<path d="M-11 -168H-5M5 -168H11" stroke="#1b2030" stroke-width="3"/>` : `<circle cx="-8" cy="-168" r="3.5" fill="#1b2030"/><circle cx="8" cy="-168" r="3.5" fill="#1b2030"/>`;
      const inner = `<ellipse cx="0" cy="2" rx="40" ry="8" fill="#000" opacity=".2"/>${leg(sw, -12)}${leg(-sw, 12)}${arm(armL, -30, o.bata ? '#f1f3f8' : col)}${cuerpo}${arm(armR, 30, o.bata ? '#f1f3f8' : col)}` +
        `<circle cx="0" cy="-166" r="27" fill="${piel}"/><path d="M-27 -170Q-26 -200 0 -199Q26 -200 27 -170Q16 -186 0 -184Q-16 -186 -27 -170Z" fill="${pelo}"/>${ojos}<path d="M-7 -154Q0 -149 7 -154" stroke="#7a4a3d" stroke-width="2.5" fill="none"/>`;
      return grp(x, y, s, o.rot || 0, inner);
    },
    documento(x, y, s = 1, t = 0, o = {}) {
      const rot = o.rot != null ? o.rot : 3 * Math.sin(t * .8), hl = Math.floor(t * .7) % 6, hw = ((t * .7) % 1);
      let inner = `<path d="M-75 -100H45L75 -70V100H-75Z" fill="#f4f1ea"/><path d="M45 -100V-70H75Z" fill="#d6d0c2"/><rect x="-60" y="-86" width="80" height="11" rx="3" fill="${o.color || '#3d63c9'}"/>`;
      if (o.titulo) { const fs = Math.min(16, fit(o.titulo, 16, 125, .6)); inner += `<text x="-60" y="-56" font-family="${FT}" font-weight="800" font-size="${f(fs)}" fill="#1d2233">${esc(o.titulo)}</text>`; }
      else inner += `<rect x="-60" y="-66" width="110" height="9" rx="3" fill="#1d2233" opacity=".8"/>`;
      for (let j = 0; j < 6; j++) {
        const w = j % 3 === 2 ? 78 : 120, yy = -42 + j * 13;
        if (j === hl) inner += `<rect x="-62" y="${yy - 3}" width="${f(w * hw + 4)}" height="12" rx="3" fill="#ffd166" opacity=".7"/>`;
        inner += `<rect x="-60" y="${yy}" width="${w}" height="6" rx="3" fill="#bdb6a6"/>`;
      }
      inner += `<rect x="-60" y="40" width="120" height="46" rx="3" fill="#e6e1d6"/>`;
      for (let j = 0; j < 6; j++) { const h = 10 + 26 * (.5 + .5 * Math.sin(t * 1.4 + j * 1.3)); inner += `<rect x="${-52 + j * 18}" y="${f(82 - h)}" width="12" height="${f(h)}" fill="${['#3d63c9', '#46a35e', '#f2a65a'][j % 3]}"/>`; }
      return grp(x, y, s, rot, inner);
    },
    matraz(x, y, s = 1, t = 0, o = {}) {
      const col = o.color || '#7CFFB2', nv = o.nivel == null ? .55 : cl(o.nivel), id = 'mz' + Math.round(x) + '_' + Math.round(y);
      const glass = 'M-22 -100V-40L-85 70Q-92 92 -70 92H70Q92 92 85 70L22 -40V-100Z';
      const ly = 92 - nv * 150, wv = 5 * Math.sin(t * 3);
      let liq = `<path d="M-100 ${f(ly + wv)}Q-50 ${f(ly - 8 - wv)} 0 ${f(ly + wv)}T100 ${f(ly + wv)}V100H-100Z" fill="${col}" opacity=".8"/>`;
      for (let q = 0; q < 6; q++) { const u = (t * .55 + q / 6) % 1, bx = -40 + q * 16 + 6 * Math.sin(t * 3 + q), by = 86 - u * (86 - ly); liq += `<circle cx="${f(bx)}" cy="${f(by)}" r="${f(3 + q % 3 * 2)}" fill="#ffffff" opacity="${f(.65 * (1 - u * .7), 2)}"/>`; }
      let vap = '';
      for (let q = 0; q < 2; q++) { const u = (t * .4 + q * .5) % 1; vap += `<path d="M${f(-6 + q * 12)} ${f(-112 - u * 70)}q10 -14 0 -28" stroke="#ffffff" stroke-width="4" fill="none" stroke-linecap="round" opacity="${f(.4 * (1 - u), 2)}"/>`; }
      return grp(x, y, s, o.rot || 0, `<defs><clipPath id="${id}"><path d="${glass}"/></clipPath></defs><path d="${glass}" fill="#ffffff" fill-opacity=".08"/><g clip-path="url(#${id})">${liq}</g>` +
        `<path d="${glass}" fill="none" stroke="#d9e4f0" stroke-width="5" stroke-linejoin="round"/><rect x="-30" y="-110" width="60" height="12" rx="5" fill="#d9e4f0"/>${vap}`);
    },
    microscopio(x, y, s = 1, t = 0, o = {}) {
      const lu = .45 + .4 * Math.sin(t * 3);
      return grp(x, y, s, o.rot || 0,
        `<rect x="-80" y="72" width="160" height="24" rx="8" fill="#3a4256"/><path d="M40 72V-10Q40 -60 0 -78" stroke="${o.color || '#d9dee8'}" stroke-width="22" fill="none" stroke-linecap="round"/>` +
        `<rect x="-70" y="22" width="110" height="10" rx="3" fill="#aeb8c9"/><circle cx="-18" cy="50" r="12" fill="#ffd166" opacity="${f(lu, 2)}"/><circle cx="-18" cy="50" r="${f(18 + 6 * lu)}" fill="#ffd166" opacity="${f(.2 * lu, 2)}"/>` +
        `<g transform="rotate(-22 -10 -50)"><rect x="-27" y="-110" width="34" height="110" rx="6" fill="#e8ecf3"/><rect x="-22" y="-128" width="24" height="22" rx="4" fill="#3a4256"/><rect x="-18" y="0" width="16" height="16" fill="#9aa5bd"/></g>` +
        `<rect x="-52" y="16" width="44" height="6" fill="#6cc4ff" opacity=".8"/>`);
    },
    engranaje(x, y, s = 1, t = 0, o = {}) {
      const n = o.dientes || 10, R = 80, Ri = 63, ang = (o.angulo || 0) + t * (o.vel == null ? 40 : o.vel), st = 2 * Math.PI / n;
      let d = '';
      for (let j = 0; j < n; j++) {
        const a = j * st, pts = [[Ri, a - st * .5], [Ri, a - st * .28], [R, a - st * .18], [R, a + st * .18], [Ri, a + st * .28]];
        pts.forEach(([rr, aa], m) => { d += (j === 0 && m === 0 ? 'M' : 'L') + f(rr * Math.cos(aa)) + ' ' + f(rr * Math.sin(aa)); });
      }
      d += 'Z M22 0A22 22 0 1 0 -22 0A22 22 0 1 0 22 0Z';
      return grp(x, y, s, ang, `<path d="${d}" fill="${o.color || '#9aa5bd'}" fill-rule="evenodd"/><circle r="40" fill="none" stroke="#000" stroke-opacity=".15" stroke-width="6"/>`);
    },
    flecha(x, y, s = 1, t = 0, o = {}) {
      const [x2, y2] = o.hasta || [x + 200 * s, y], pr = o.progreso == null ? 1 : cl(o.progreso), col = o.color || '#ffd166', op = o.op == null ? 1 : o.op;
      if (pr <= .01 || op <= .01) return '';
      const cv = o.curva || 0, mx = (x + x2) / 2, my = (y + y2) / 2, L = Math.hypot(x2 - x, y2 - y) || 1, cx = mx - (y2 - y) / L * cv, cy = my + (x2 - x) / L * cv;
      const Q = u => [(1 - u) * (1 - u) * x + 2 * (1 - u) * u * cx + u * u * x2, (1 - u) * (1 - u) * y + 2 * (1 - u) * u * cy + u * u * y2];
      const N = 24; let d = '';
      for (let j = 0; j <= N; j++) { const [px, py] = Q(pr * j / N); d += (j ? 'L' : 'M') + f(px) + ' ' + f(py); }
      const [ex, ey] = Q(pr), [bx, by] = Q(Math.max(0, pr - .04)), an = Math.atan2(ey - by, ex - bx), hs = 20 * s;
      const dash = o.flujo ? ` stroke-dasharray="${f(16 * s)} ${f(12 * s)}" stroke-dashoffset="${f(-t * 50 * s)}"` : '';
      return `<g opacity="${f(op, 2)}"><path d="${d}" stroke="${col}" stroke-width="${f(6 * s)}" fill="none" stroke-linecap="round"${dash}/>` +
        `<polygon points="${f(ex + Math.cos(an) * hs * .4)},${f(ey + Math.sin(an) * hs * .4)} ${f(ex + Math.cos(an + 2.5) * hs)},${f(ey + Math.sin(an + 2.5) * hs)} ${f(ex + Math.cos(an - 2.5) * hs)},${f(ey + Math.sin(an - 2.5) * hs)}" fill="${col}"/></g>`;
    },
    etiqueta(x, y, s = 1, t = 0, o = {}) {
      const bd = o.pulso ? `rgba(255,209,102,${f(.4 + .6 * Math.abs(Math.sin(t * 3)), 2)})` : o.borde;
      return tag(x, y, o.texto, { fs: (o.fs || 26) * s, color: o.color, borde: bd, anchor: o.anchor || 'middle', op: o.op, max: o.max, fondo: o.fondo });
    },
    contador(x, y, s = 1, t = 0, o = {}) {
      const pr = o.progreso == null ? 1 : cl(o.progreso), val = +o.valor || 0, dec = o.dec || 0, fs0 = (o.fs || 140) * s, suf = o.sufijo || '', pre = o.prefijo || '';
      const op = o.op == null ? 1 : o.op;
      if (op <= .01) return '';
      const fin = pre + num(val, dec), w = tw(fin, fs0, .62) + (suf ? tw(' ' + suf, fs0 * .42, .6) : 0);
      const fs = o.max ? Math.min(fs0, fs0 * o.max / Math.max(1, w)) : fs0, sc = 1 + (o.pop || 0) * .12;
      const sufT = suf ? `<tspan font-size="${f(fs * .42)}" font-weight="700" fill="${o.colorSufijo || '#e9ecf3'}" dx="${f(fs * .1)}">${esc(suf)}</tspan>` : '';
      return `<g transform="translate(${f(x)},${f(y)}) scale(${f(sc, 3)})" opacity="${f(op, 2)}"><text x="0" y="0" text-anchor="${o.anchor || 'middle'}" font-family="${FT}" font-weight="800" font-size="${f(fs)}" fill="${o.color || '#ffd166'}" style="font-variant-numeric:tabular-nums">${esc(pre + num(val * pr, dec))}${sufT}</text></g>`;
    },
    // (x, y) es la esquina superior izquierda de la pista
    barra(x, y, s = 1, t = 0, o = {}) {
      const W = (o.ancho || 600) * s, h = (o.alto || 34) * s, val = Math.abs(+o.valor || 0), mx = o.max || val || 1, pr = o.progreso == null ? 1 : cl(o.progreso), op = o.op == null ? 1 : o.op;
      if (op <= .01) return '';
      const col = o.color || '#6cc4ff', w = pr > 0 ? Math.max(h, W * cl(val / mx) * pr) : 0;
      let out = `<rect x="${f(x)}" y="${f(y)}" width="${f(W)}" height="${f(h)}" rx="${f(h / 2)}" fill="#ffffff" fill-opacity=".1"/>`;
      if (o.resaltar) out += `<rect x="${f(x - 6)}" y="${f(y - 6)}" width="${f(w + 12)}" height="${f(h + 12)}" rx="${f(h / 2 + 6)}" fill="none" stroke="#ffd166" stroke-width="3" opacity="${f(.4 + .6 * Math.abs(Math.sin(t * 3)), 2)}"/>`;
      if (w > 0) {
        out += `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(h / 2)}" fill="${col}"/>`;
        if (w > h * 1.6) { const u = (t * .45) % 1; out += `<rect x="${f(x + h / 2 + u * (w - h * 1.4))}" y="${f(y + h * .18)}" width="${f(h * .4)}" height="${f(h * .64)}" rx="${f(h * .2)}" fill="#ffffff" opacity=".22"/>`; }
      }
      if (o.rotulo) out += `<text x="${f(x)}" y="${f(y - 14 * s)}" font-family="${_PR.FM}" font-weight="700" font-size="${f(Math.min(26 * s, fit(o.rotulo, 26 * s, o.maxRotulo || W + 200, .6)))}" fill="${o.colorRotulo || '#e9ecf3'}">${esc(o.rotulo)}</text>`;
      const vt = o.texto != null ? o.texto : (pr > 0 ? num(val * pr, o.dec || 0) + (o.unidad || '') : '');
      if (vt !== '' && pr > 0) {
        const fsv = o.fsValor || 40 * s, lim = o.limite || 1020, vw = tw(vt, fsv, .62);
        if (x + w + 18 * s + vw <= lim) out += `<text x="${f(x + w + 18 * s)}" y="${f(y + h / 2 + fsv * .36)}" font-family="${FT}" font-weight="800" font-size="${f(fsv)}" fill="${o.colorValor || '#ffd166'}">${esc(vt)}</text>`;
        else { const fsi = Math.min(fsv, h * .8, fit(vt, fsv, Math.max(40, w - 24), .62)); out += `<text x="${f(x + w - 14 * s)}" y="${f(y + h / 2 + fsi * .36)}" text-anchor="end" font-family="${FT}" font-weight="800" font-size="${f(fsi)}" fill="#0d1020">${esc(vt)}</text>`; }
      }
      return `<g opacity="${f(op, 2)}">${out}</g>`;
    },
    nube(x, y, s = 1, t = 0, o = {}) {
      return grp(x + 10 * Math.sin(t * .3), y, s, 0, `<g fill="${o.color || '#ffffff'}" opacity="${o.op == null ? .85 : o.op}"><ellipse cx="0" cy="10" rx="95" ry="26"/><ellipse cx="-30" cy="-6" rx="42" ry="30"/><ellipse cx="22" cy="-16" rx="48" ry="38"/></g>`);
    },
    pin(x, y, s = 1, t = 0, o = {}) {
      const b = 4 * Math.sin(t * 3 + x * .05);
      return grp(x, y - b * s, s * 1.6, 0, `<path d="M0 0C-4 -9 -14 -16 -14 -27A14 14 0 1 1 14 -27C14 -16 4 -9 0 0Z" fill="${o.color || '#7CFFB2'}" stroke="#0d1020" stroke-width="2"/><circle cx="0" cy="-27" r="5" fill="#0d1020"/>`);
    }
  };
  return D;
})();

/* objeto de DIBUJO centrado en (x, y), sea cual sea su ancla */
const _OBJ = (() => {
  const BASE = { arbol: 1, persona: 1 };
  return function obj(nombre, x, y, s, t, o = {}) {
    const fn = DIBUJO[nombre];
    if (!fn) return _PR.tag(x, y, String(nombre == null ? '?' : nombre), { fs: 26 * s });
    if (nombre === 'laser') return fn(x, y - 110 * s, s, t, Object.assign({ hasta: [x, y + 110 * s] }, o));
    if (nombre === 'flecha') return fn(x - 100 * s, y, s, t, Object.assign({ hasta: [x + 100 * s, y] }, o));
    if (nombre === 'bosque') return fn(x, y + 75 * s, s * .8, t, Object.assign({ ancho: 300 * s }, o));
    if (nombre === 'barra') return fn(x - 150 * s, y - 17 * s, s, t, Object.assign({ ancho: 300 }, o));
    if (nombre === 'contador') return fn(x, y + 45 * s, s, t, o);
    if (BASE[nombre]) return fn(x, y + 100 * s, s, t, o);
    return fn(x, y, s, t, o);
  };
})();

/* ====================================================================== plantillas */
const PLANTILLAS = (() => {
  const { f, cl, lerp, eo, eio, pg, pl, bo, pop, rnd, gauss, num, esc, len, tw, fit, mix, PAL, FT, FM, memo, cu, V, wrap, bloque, tag, txt, polvo, svg, slab, inPoly, decs, fundido } = _PR;
  const obj = _OBJ;
  // momento de un elemento k de una lista: su palabra si la tiene; si no, escalonado desde t0
  const tk = (i, dur, w, t0, k, paso) => { const fb = Math.min(dur * .92, t0 + k * paso); return w ? cu(i, w, fb / dur, dur) : fb; };

  return {
    /* ------------------------------------------------------------------ titulo_pregunta */
    titulo_pregunta: {
      descripcion: 'Gancho inicial: entran de 1 a 3 objetos (sensores, documentos, personas...) sobre un escenario y luego aparece en grande la pregunta que el video va a responder.',
      params: {
        pregunta: { tipo: 'texto', requerido: true, descripcion: 'Pregunta gancho, idealmente menos de 60 caracteres.', ejemplo: '¿Ven la misma cantidad de hojas?' },
        destacar: { tipo: 'texto', requerido: false, descripcion: 'Palabra de la pregunta que se pinta en amarillo.', ejemplo: 'hojas' },
        objetos: { tipo: 'lista', requerido: false, descripcion: 'De 1 a 3 nombres de DIBUJO que entran en escena.', ejemplo: ['avion', 'satelite', 'estacion_espacial'] },
        rotulos: { tipo: 'lista', requerido: false, descripcion: 'Rótulo corto bajo cada objeto, en el mismo orden.', ejemplo: ['avión', 'Sentinel-2', 'GEDI'] },
        escenario: { tipo: 'texto', requerido: false, descripcion: 'paisaje (colinas y bosque), espacio (Tierra abajo), laboratorio (mesa) o vacio.', ejemplo: 'paisaje' },
        palabra_objetos: { tipo: 'palabra', requerido: false, descripcion: 'Palabra de la voz en la que entran los objetos.', ejemplo: 'avión' },
        palabra_pregunta: { tipo: 'palabra', requerido: false, descripcion: 'Palabra de la voz en la que aparece la pregunta.', ejemplo: 'misma' }
      },
      ejemplo: { pregunta: '¿Ven la misma cantidad de hojas?', destacar: 'hojas', objetos: ['avion', 'satelite', 'estacion_espacial'], rotulos: ['avión', 'Sentinel-2', 'GEDI'], escenario: 'paisaje', palabra_objetos: 'avión', palabra_pregunta: 'misma' },
      narracion_ejemplo: 'Un avión, un satélite y un láser en órbita miran el mismo bosque. Pero, ¿ven la misma cantidad de hojas?',
      draw(lt, dur, i, p = {}) {
        const objs = V(p, 'objetos', []).slice(0, 3), rots = V(p, 'rotulos', []), escn = V(p, 'escenario', 'vacio');
        const tO = cu(i, p.palabra_objetos, .1, dur), tQ = cu(i, p.palabra_pregunta, .55, dur);
        let s = polvo(lt, 11, 22);
        let yo = 600, fo = '';
        if (escn === 'paisaje') {
          yo = 520;
          for (let k = 0; k < 3; k++) { const x = ((k * 420 + lt * (12 + k * 5)) % 1400) - 160; fo += DIBUJO.nube(x, 440 + k * 60, .9 - k * .15, lt, { op: .1 }); }
          fo += `<path d="M0 820Q270 790 540 812T1080 805V1060H0Z" fill="#1c3a2c"/><path d="M0 872Q300 852 600 874T1080 866V1060H0Z" fill="#163024"/>`;
          fo += DIBUJO.bosque(540, 885, .72, lt, { ancho: 1040, semilla: 4, crecer: pg(lt, .05, 1.5), suelo: false });
        } else if (escn === 'espacio') {
          fo += DIBUJO.globo(540, 1300, 4.95, lt, { vel: 20 });
        } else if (escn === 'laboratorio') {
          fo += `<rect x="0" y="866" width="1080" height="200" fill="#262a35"/><rect x="0" y="852" width="1080" height="16" fill="#3a4050"/>`;
          s += `<rect x="70" y="760" width="200" height="10" rx="3" fill="#3a4050" opacity=".7"/>` + DIBUJO.matraz(120, 806, .4, lt, { color: '#a78bfa' }) + DIBUJO.matraz(210, 806, .32, lt + 1, { color: '#6cc4ff', nivel: .35 });
        }
        if (fo) s = fundido('tqf', fo) + s;
        const n = objs.length, xs = n === 1 ? [540] : n === 2 ? [320, 760] : [200, 540, 880], sc = n === 3 ? .82 : 1;
        objs.forEach((nm, k) => {
          const t0 = tO + k * .35, e = pop(lt, t0, .6);
          if (e <= .01) return;
          const yy = lerp(yo + 170, yo, eo((lt - t0) / .6)) + 9 * Math.sin(lt * 1.3 + k * 1.7);
          s += `<g opacity="${f(cl(e * 1.5), 2)}">${obj(nm, xs[k], yy, sc * e, lt + k)}</g>`;
          if (rots[k]) s += tag(xs[k], yo + 138 * sc, rots[k], { fs: 26, op: pg(lt, t0 + .3, t0 + .7), color: PAL[k % PAL.length], max: n === 3 ? 330 : 470 });
        });
        const q = String(V(p, 'pregunta', '')), qa = pg(lt, tQ - .15, tQ + .45);
        if (q && qa > 0) {
          const B = bloque(q, 940, 70, 3, .56, 36), lh = B.fs * 1.16, dst = String(V(p, 'destacar', '')).toLowerCase();
          s += `<text x="${f(540 + 14 * Math.sin(lt * .7))}" y="${f(330 + 8 * Math.sin(lt))}" text-anchor="middle" font-family="${FT}" font-weight="800" font-size="320" fill="#ffd166" opacity="${f(.07 * qa, 2)}">?</text>`;
          B.lines.forEach((ln, j) => {
            const e = pop(lt, tQ + j * .12, .5); if (e <= .01) return;
            const y = 175 + B.fs + j * lh;
            const sp = ln.split(' ').map(w => (dst && w.toLowerCase().includes(dst)) ? `<tspan fill="#ffd166">${esc(w)}</tspan>` : esc(w)).join(' ');
            s += `<g transform="translate(540,${f(y)}) scale(${f(e, 3)})" opacity="${f(cl(e), 2)}"><text x="0" y="0" text-anchor="middle" font-family="${FT}" font-weight="800" font-size="${f(B.fs)}" fill="#ffffff">${sp}</text></g>`;
          });
        }
        return svg(s);
      }
    },

    /* ------------------------------------------------------------------ contador_grande */
    contador_grande: {
      descripcion: 'Una cifra protagonista del artículo que cuenta desde cero, con su unidad, un rótulo y un objeto alusivo encima.',
      params: {
        valor: { tipo: 'numero', requerido: true, descripcion: 'La cifra tal como la da el artículo.', ejemplo: 10 },
        decimales: { tipo: 'numero', requerido: false, descripcion: 'Decimales que se muestran (por defecto, los del valor).', ejemplo: 0 },
        prefijo: { tipo: 'texto', requerido: false, descripcion: 'Texto antes de la cifra, por ejemplo ≈ o +.', ejemplo: '' },
        unidad: { tipo: 'texto', requerido: false, descripcion: 'Unidad corta tras la cifra.', ejemplo: 'm' },
        rotulo: { tipo: 'texto', requerido: true, descripcion: 'Qué es la cifra, en pocas palabras.', ejemplo: 'tamaño del píxel de Sentinel-2' },
        nota: { tipo: 'texto', requerido: false, descripcion: 'Aclaración pequeña bajo el rótulo.', ejemplo: 'bandas visibles e infrarrojo cercano' },
        objeto: { tipo: 'texto', requerido: false, descripcion: 'Nombre de DIBUJO que acompaña la cifra.', ejemplo: 'satelite' },
        opciones: { tipo: 'lista', requerido: false, descripcion: 'Objeto de opciones para el DIBUJO (por ejemplo {"tipo":"manglar"}).', ejemplo: {} },
        color: { tipo: 'texto', requerido: false, descripcion: 'Color de la cifra.', ejemplo: '#ffd166' },
        palabra: { tipo: 'palabra', requerido: false, descripcion: 'Palabra de la voz en que arranca el conteo (puede ser lista de alternativas).', ejemplo: ['10', 'diez'] }
      },
      ejemplo: { valor: 10, unidad: 'm', rotulo: 'tamaño del píxel de Sentinel-2', nota: 'bandas visibles e infrarrojo cercano', objeto: 'satelite', palabra: ['10', 'diez'] },
      narracion_ejemplo: 'Sentinel-2 ve el bosque en píxeles de 10 metros de lado, en sus bandas visibles y del infrarrojo cercano.',
      draw(lt, dur, i, p = {}) {
        const tP = cu(i, p.palabra, .3, dur), col = V(p, 'color', '#ffd166'), val = +V(p, 'valor', 0), dec = V(p, 'decimales', decs(V(p, 'valor', 0)));
        let s = polvo(lt, 23, 20);
        for (let q = 0; q < 3; q++) { const u = (lt * .4 + q / 3) % 1; s += `<circle cx="540" cy="330" r="${f(110 + 190 * u)}" fill="none" stroke="${col}" stroke-width="3" opacity="${f((1 - u) * .22, 2)}"/>`; }
        const e = pop(lt, .1, .6);
        if (e > .01) s += obj(V(p, 'objeto', 'documento'), 540, 330 + 10 * Math.sin(lt * 1.2), 1.15 * e, lt, V(p, 'opciones', {}));
        const pr = eio(pl(lt, tP - .05, tP + 1.3)), done = pg(lt, tP + 1.3, tP + 1.5) * (1 - pg(lt, tP + 1.5, tP + 2.2));
        s += DIBUJO.contador(540, 700, 1, lt, { valor: val, dec, progreso: pr, prefijo: V(p, 'prefijo', ''), sufijo: V(p, 'unidad', ''), max: 960, fs: 180, pop: done, color: col, op: pg(lt, tP - .1, tP + .25) });
        const bu = pl(lt, tP + 1.3, tP + 2.1);
        if (bu > 0 && bu < 1) for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6, r1 = 200 + 120 * eo(bu), r2 = r1 + 40; s += `<line x1="${f(540 + Math.cos(a) * r1)}" y1="${f(640 + Math.sin(a) * r1 * .55)}" x2="${f(540 + Math.cos(a) * r2)}" y2="${f(640 + Math.sin(a) * r2 * .55)}" stroke="${col}" stroke-width="5" stroke-linecap="round" opacity="${f(1 - bu, 2)}"/>`; }
        s += tag(540, 800, V(p, 'rotulo', ''), { fs: 32, max: 960, op: pg(lt, tP + .3, tP + .8) });
        const nt = V(p, 'nota', '');
        if (nt) { const B = bloque(nt, 900, 26, 2, .6, 20); B.lines.forEach((ln, j) => { s += txt(540, 876 + j * B.fs * 1.3, ln, { mono: true, fs: B.fs, anchor: 'middle', color: '#c9cfe0', op: .8 * pg(lt, tP + .7, tP + 1.2), peso: 500 }); }); }
        return svg(s);
      }
    },

    /* ------------------------------------------------------------------ comparacion_barras */
    comparacion_barras: {
      descripcion: 'Compara de 2 a 6 valores con barras horizontales que crecen; una barra se resalta en el momento justo de la voz.',
      params: {
        barras: { tipo: 'lista', requerido: true, descripcion: 'De 2 a 6 objetos {rotulo, valor, texto?, color?, palabra?}. valor no negativo; texto reemplaza la cifra mostrada al final.', ejemplo: [{ rotulo: 'GEDI frente a Sentinel-2', valor: 0.31 }, { rotulo: 'GEDI frente a NIS', valor: 0.12 }, { rotulo: 'promedio por sitio', valor: 0.69 }] },
        titulo: { tipo: 'texto', requerido: false, descripcion: 'Qué se compara (con su métrica).', ejemplo: 'R² entre productos de LAI' },
        unidad: { tipo: 'texto', requerido: false, descripcion: 'Unidad pegada a cada cifra.', ejemplo: '' },
        decimales: { tipo: 'numero', requerido: false, descripcion: 'Decimales (por defecto, los de los valores).', ejemplo: 2 },
        maximo: { tipo: 'numero', requerido: false, descripcion: 'Valor que llena la barra completa (por defecto, el mayor). Usar 1 para R² o 100 para porcentajes.', ejemplo: 1 },
        resaltar: { tipo: 'numero', requerido: false, descripcion: 'Índice (desde 0) o rótulo de la barra que se resalta.', ejemplo: 2 },
        palabra_inicio: { tipo: 'palabra', requerido: false, descripcion: 'Palabra en que empiezan a crecer las barras.', ejemplo: 'compara' },
        palabra_resaltar: { tipo: 'palabra', requerido: false, descripcion: 'Palabra en que se resalta la barra elegida.', ejemplo: 'sitio' }
      },
      ejemplo: { titulo: 'R² entre productos de LAI', barras: [{ rotulo: 'GEDI frente a Sentinel-2', valor: 0.31 }, { rotulo: 'GEDI frente a NIS', valor: 0.12 }, { rotulo: 'promedio por sitio', valor: 0.69 }], decimales: 2, maximo: 1, resaltar: 2, palabra_inicio: 'compara', palabra_resaltar: 'sitio' },
      narracion_ejemplo: 'Si se compara huella por huella, el acuerdo es bajo con los dos sensores; pero al promediar por sitio sube con fuerza.',
      draw(lt, dur, i, p = {}) {
        const B = V(p, 'barras', []).slice(0, 6), n = B.length;
        let s = polvo(lt, 31, 16);
        if (!n) return svg(s);
        const dec = V(p, 'decimales', Math.max(...B.map(b => decs(b.valor)))), uni = V(p, 'unidad', '');
        const mx = V(p, 'maximo', Math.max(...B.map(b => Math.abs(+b.valor || 0))) || 1);
        let hi = V(p, 'resaltar', -1);
        if (typeof hi === 'string') hi = B.findIndex(b => String(b.rotulo).toLowerCase() === hi.toLowerCase());
        const tI = cu(i, p.palabra_inicio, .12, dur), tR = cu(i, p.palabra_resaltar, .68, dur), hl = hi >= 0 ? pg(lt, tR - .2, tR + .4) : 0;
        const tit = V(p, 'titulo', '');
        if (tit) s += tag(540, 165, tit, { fs: 32, max: 960, op: pg(lt, .1, .6), color: '#ffd166' });
        const top0 = tit ? 240 : 170, bot = 975, rowH = Math.min(175, (bot - top0) / n), barH = Math.min(48, rowH * .34), top = top0 + (bot - top0 - n * rowH) / 2;
        B.forEach((b, k) => {
          const y0 = top + k * rowH + (rowH - (barH + 48)) / 2, yL = y0 + 30, yB = yL + 16;
          const t0 = tk(i, dur, b.palabra, tI, k, .3), prog = eio(pl(lt, t0, t0 + 1.1)), ap = pg(lt, t0 - .25, t0 + .25);
          const dim = hi >= 0 && k !== hi ? 1 - .6 * hl : 1, isH = k === hi;
          const base = b.color || PAL[0], col = isH ? mix(base.startsWith('#') && base.length === 7 ? base : '#6cc4ff', '#ffd166', hl) : base;
          s += txt(110, yL, b.rotulo, { mono: true, fs: 27, max: 900, op: ap * dim, color: isH && hl > .5 ? '#ffd166' : '#e9ecf3' });
          const vt = prog >= 1 && b.texto != null ? b.texto : num(Math.abs(+b.valor || 0) * prog, dec) + uni;
          s += DIBUJO.barra(110, yB, 1, lt + k * .3, { ancho: 640, alto: barH, valor: Math.abs(+b.valor || 0), max: mx, progreso: prog, color: col, texto: vt, resaltar: isH && hl > .5, op: ap * dim, fsValor: Math.min(44, barH * 1.05) });
          if (isH && hl > 0) { const bx = 78 + 8 * Math.sin(lt * 5), by = yB + barH / 2; s += `<polygon points="${f(bx)},${f(by)} ${f(bx - 22)},${f(by - 14)} ${f(bx - 22)},${f(by + 14)}" fill="#ffd166" opacity="${f(hl, 2)}"/>`; }
        });
        return svg(s);
      }
    },

    /* ------------------------------------------------------------------ dispersion */
    dispersion: {
      descripcion: 'Gráfico de dispersión esquemático: los puntos caen sobre el plano, con línea 1:1 o de ajuste opcional, un contador de la métrica (R², r, RMSE...) y la opción de agregarlos en pocos puntos promedio.',
      params: {
        eje_x: { tipo: 'texto', requerido: true, descripcion: 'Rótulo del eje horizontal (sin números).', ejemplo: 'LAI Sentinel-2' },
        eje_y: { tipo: 'texto', requerido: true, descripcion: 'Rótulo del eje vertical.', ejemplo: 'LAI GEDI' },
        metrica: { tipo: 'texto', requerido: false, descripcion: 'Nombre de la métrica que se cuenta.', ejemplo: 'R²' },
        valor: { tipo: 'numero', requerido: false, descripcion: 'Valor final de la métrica, del artículo.', ejemplo: 0.69 },
        valor_inicial: { tipo: 'numero', requerido: false, descripcion: 'Valor previo de la métrica (por ejemplo el de los puntos sin agregar); se muestra primero y luego cambia a valor.', ejemplo: 0.31 },
        decimales: { tipo: 'numero', requerido: false, descripcion: 'Decimales de la métrica (por defecto, los del valor).', ejemplo: 2 },
        n_puntos: { tipo: 'numero', requerido: false, descripcion: 'Cantidad de puntos del esquema (10 a 200). Es visual: no se muestra.', ejemplo: 152 },
        fuerza: { tipo: 'numero', requerido: false, descripcion: 'De 0 a 1, qué tan pegados a la recta se ven los puntos (visual).', ejemplo: 0.55 },
        relacion: { tipo: 'texto', requerido: false, descripcion: 'positiva o negativa.', ejemplo: 'positiva' },
        linea_1a1: { tipo: 'booleano', requerido: false, descripcion: 'Dibuja la diagonal 1:1.', ejemplo: true },
        linea_ajuste: { tipo: 'booleano', requerido: false, descripcion: 'Dibuja la recta de ajuste cuando aparece la métrica.', ejemplo: true },
        agregar: { tipo: 'booleano', requerido: false, descripcion: 'Los puntos se agrupan en n_grupos promedios con barras de dispersión.', ejemplo: true },
        n_grupos: { tipo: 'numero', requerido: false, descripcion: 'Número de grupos al agregar.', ejemplo: 19 },
        rotulo_grupos: { tipo: 'texto', requerido: false, descripcion: 'Etiqueta que aparece al agregar.', ejemplo: 'N = 19 sitios' },
        nota: { tipo: 'texto', requerido: false, descripcion: 'Aclaración bajo el gráfico.', ejemplo: 'cada punto es una huella de 25 m' },
        palabra_puntos: { tipo: 'palabra', requerido: false, descripcion: 'Palabra en que caen los puntos.', ejemplo: 'punto' },
        palabra_agregar: { tipo: 'palabra', requerido: false, descripcion: 'Palabra en que se agregan.', ejemplo: 'promedias' },
        palabra_metrica: { tipo: 'palabra', requerido: false, descripcion: 'Palabra en que la métrica llega a su valor final.', ejemplo: 'cuadrado' }
      },
      ejemplo: { eje_x: 'LAI Sentinel-2', eje_y: 'LAI GEDI', metrica: 'R²', valor: 0.69, valor_inicial: 0.31, decimales: 2, n_puntos: 152, fuerza: 0.55, relacion: 'positiva', linea_1a1: true, linea_ajuste: true, agregar: true, n_grupos: 19, rotulo_grupos: 'N = 19 sitios', nota: 'cada punto es una huella de 25 m', palabra_puntos: 'punto', palabra_agregar: 'promedias', palabra_metrica: 'cuadrado' },
      narracion_ejemplo: 'Cada punto es una huella de GEDI comparada con Sentinel-2. Si promedias por sitio, la nube se ordena y el R cuadrado sube.',
      draw(lt, dur, i, p = {}) {
        const n = Math.round(cl(+V(p, 'n_puntos', 80), 10, 200)), fz = cl(+V(p, 'fuerza', .6)), neg = V(p, 'relacion', 'positiva') === 'negativa';
        const ng = Math.round(cl(+V(p, 'n_grupos', 8), 2, 40)), agr = !!V(p, 'agregar', false);
        const D = memo('disp' + [n, fz, neg, ng].join('|'), () => {
          const r = rnd(17 + n), line = u => neg ? .9 - .8 * u : .08 + .82 * u, G = [];
          for (let g = 0; g < ng; g++) { const u = .08 + .8 * (g + .5) / ng + (r() - .5) * .06; G.push({ u, w: cl(line(u) + gauss(r) * (1 - fz) * .14, .05, .95) }); }
          const P = [];
          for (let k = 0; k < n; k++) {
            const g = k % ng, u = cl(G[g].u + gauss(r) * .07, .02, .96);
            P.push({ g, u, w: cl(G[g].w + (u - G[g].u) * (neg ? -.8 : .82) * .5 + gauss(r) * (.05 + (1 - fz) * .2), .02, .97) });
          }
          const M = G.map((_, g) => { const q = P.filter(z => z.g === g), mu = q.reduce((a, z) => a + z.u, 0) / q.length, mw = q.reduce((a, z) => a + z.w, 0) / q.length; return { u: mu, w: mw, su: Math.sqrt(q.reduce((a, z) => a + (z.u - mu) ** 2, 0) / q.length) * .5, sw: Math.sqrt(q.reduce((a, z) => a + (z.w - mw) ** 2, 0) / q.length) * .5 }; });
          const fitL = Q => { const mx = Q.reduce((a, z) => a + z.u, 0) / Q.length, my = Q.reduce((a, z) => a + z.w, 0) / Q.length, b = Q.reduce((a, z) => a + (z.u - mx) * (z.w - my), 0) / (Q.reduce((a, z) => a + (z.u - mx) ** 2, 0) || 1); return { a: my - b * mx, b }; };
          return { P, M, LP: fitL(P), LM: fitL(M) };
        });
        const X = u => 200 + u * 560, Y = w => 710 - w * 560;
        const tP = cu(i, p.palabra_puntos, .1, dur), tA = cu(i, p.palabra_agregar, .5, dur), tM = cu(i, p.palabra_metrica, .75, dur);
        let s = `<rect x="200" y="150" width="560" height="560" rx="4" fill="#000" fill-opacity=".18"/>`;
        for (let k = 1; k < 4; k++) s += `<path d="M${200 + k * 140} 150V710M200 ${150 + k * 140}H760" stroke="#fff" stroke-opacity=".05"/>`;
        s += `<path d="M200 150V710H760" stroke="#c9cfe0" stroke-width="3" fill="none"/>`;
        if (V(p, 'linea_1a1', false)) s += `<line x1="200" y1="710" x2="760" y2="150" stroke="#fff" stroke-opacity=".4" stroke-width="2.5" stroke-dasharray="10 9"/>` + txt(748, 182, '1:1', { mono: true, fs: 24, anchor: 'end', color: '#c9cfe0', op: .7, peso: 500 });
        s += txt(165, 430, V(p, 'eje_y', ''), { mono: true, fs: 27, max: 540, anchor: 'middle', rot: -90, color: '#ff8a8a' });
        s += txt(480, 760, V(p, 'eje_x', ''), { mono: true, fs: 27, max: 560, anchor: 'middle', color: '#6cc4ff' });
        const av = agr ? eio(pl(lt, tA, tA + 1.3)) : 0, fade = agr ? 1 - .7 * pg(lt, tA + 1.1, tA + 1.6) : 1, win = Math.max(1, Math.min(2, (tA - tP) * .6));
        D.P.forEach((z, k) => {
          const t0 = tP - .2 + (k / n) * win, pk = pg(lt, t0, t0 + .5);
          if (pk <= 0) return;
          const m = D.M[z.g], x = lerp(X(z.u), X(m.u), av) + 1.6 * Math.sin(lt * 2.1 + k), y = lerp(lerp(110, Y(z.w), pk), Y(m.w), av) + 1.6 * Math.cos(lt * 1.8 + k * 1.3);
          s += `<circle cx="${f(x)}" cy="${f(y)}" r="7" fill="${agr ? `hsl(${(z.g * 360 / ng + 190) % 360},70%,72%)` : '#dfe6ff'}" opacity="${f(.78 * pk * fade, 2)}"/>`;
        });
        const big = agr ? pg(lt, tA + 1.1, tA + 1.6) : 0;
        if (big > 0) D.M.forEach((m, g) => {
          const x = X(m.u), y = Y(m.w), dx = m.su * 560, dy = m.sw * 560, hc = `hsl(${(g * 360 / ng + 190) % 360},70%,72%)`;
          s += `<g opacity="${f(big, 2)}"><path d="M${f(x - dx)} ${f(y)}H${f(x + dx)}M${f(x)} ${f(y - dy)}V${f(y + dy)}" stroke="${hc}" stroke-width="2.5" opacity=".7"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(11 + 1.5 * Math.sin(lt * 3 + g))}" fill="${hc}" stroke="#0d1020" stroke-width="2.5"/></g>`;
        });
        if (agr) s += tag(214, 182, V(p, 'rotulo_grupos', ''), { fs: 24, anchor: 'start', color: '#7CFFB2', op: big, max: 530 });
        if (V(p, 'linea_ajuste', false)) {
          const rg = pg(lt, tM - .2, tM + .9), L = agr ? D.LM : D.LP;
          if (rg > 0) { const x0 = .03, x1 = .95, ys = u => cl(L.a + L.b * u, 0, 1); const xe = lerp(x0, x1, rg); s += `<line x1="${f(X(x0))}" y1="${f(Y(ys(x0)))}" x2="${f(X(xe))}" y2="${f(Y(ys(xe)))}" stroke="#ffffff" stroke-width="4"/>`; }
        }
        const val = V(p, 'valor', null);
        if (val != null) {
          const dec = V(p, 'decimales', decs(val)), v0 = V(p, 'valor_inicial', null), met = V(p, 'metrica', '');
          let v, op;
          if (v0 != null) { const a1 = pg(lt, tP + .6, tP + 1.6), a2 = eio(pl(lt, tM - .2, tM + .9)); v = lerp(+v0 * a1, +val, a2); op = pg(lt, tP + .4, tP + 1); }
          else { v = +val * eio(pl(lt, tM - .2, tM + 1)); op = pg(lt, tM - .5, tM); }
          const fin = num(val, dec), fsv = Math.min(96, 250 / (len(fin) * .62)), popv = pg(lt, tM + .9, tM + 1.1) * (1 - pg(lt, tM + 1.1, tM + 1.6));
          s += txt(1020, 240, met, { mono: true, fs: 36, anchor: 'end', color: '#c9cfe0', op, max: 250 });
          s += `<g transform="translate(1020,340) scale(${f(1 + .12 * popv, 3)})" opacity="${f(op, 2)}"><text x="0" y="0" text-anchor="end" font-family="${FT}" font-weight="800" font-size="${f(fsv)}" fill="#ffd166">${num(v, dec)}</text></g>`;
        }
        const nt = V(p, 'nota', '');
        if (nt) { const B = bloque(nt, 900, 26, 2, .6, 20); B.lines.forEach((ln, j) => { s += txt(540, 850 + j * B.fs * 1.3, ln, { mono: true, fs: B.fs, anchor: 'middle', color: '#c9cfe0', op: .8 * pg(lt, tP + .5, tP + 1), peso: 500 }); }); }
        return svg(s);
      }
    },

    /* ------------------------------------------------------------------ curva */
    curva: {
      descripcion: 'Una o dos curvas que se dibujan sobre ejes esquemáticos, con un techo (saturación) o un umbral marcados. Sirve para saturación, crecimiento, decaimiento o dosis-respuesta.',
      params: {
        eje_x: { tipo: 'texto', requerido: true, descripcion: 'Rótulo del eje horizontal (sin números).', ejemplo: 'hojas reales (LAI)' },
        eje_y: { tipo: 'texto', requerido: true, descripcion: 'Rótulo del eje vertical.', ejemplo: 'LAI estimado' },
        curvas: { tipo: 'lista', requerido: true, descripcion: '1 o 2 objetos {rotulo, forma, valores?, color?}. forma: saturacion, lineal, exponencial, sigmoide, campana o decreciente. Si se pasa valores (lista de números), la curva los sigue normalizados (no se muestran).', ejemplo: [{ rotulo: 'Sentinel-2 (óptico)', forma: 'saturacion' }, { rotulo: 'GEDI (láser)', forma: 'lineal' }] },
        techo: { tipo: 'lista', requerido: false, descripcion: 'Objeto {rotulo, curva}: línea en el máximo de esa curva (índice desde 0).', ejemplo: { rotulo: 'se satura cerca de 3', curva: 0 } },
        umbral: { tipo: 'lista', requerido: false, descripcion: 'Objeto {posicion, rotulo}: línea vertical en la posición 0 a 1 del eje x.', ejemplo: null },
        palabra_curva: { tipo: 'palabra', requerido: false, descripcion: 'Palabra en que se dibuja la primera curva.', ejemplo: 'Sentinel' },
        palabra_segunda: { tipo: 'palabra', requerido: false, descripcion: 'Palabra en que se dibuja la segunda curva.', ejemplo: 'láser' },
        palabra_techo: { tipo: 'palabra', requerido: false, descripcion: 'Palabra en que aparece el techo.', ejemplo: 'satura' },
        palabra_umbral: { tipo: 'palabra', requerido: false, descripcion: 'Palabra en que aparece el umbral.', ejemplo: '' }
      },
      ejemplo: { eje_x: 'hojas reales (LAI)', eje_y: 'LAI estimado', curvas: [{ rotulo: 'Sentinel-2 (óptico)', forma: 'saturacion' }, { rotulo: 'GEDI (láser)', forma: 'lineal', color: '#ff6b6b' }], techo: { rotulo: 'se satura cerca de 3', curva: 0 }, palabra_curva: 'Sentinel', palabra_techo: 'satura', palabra_segunda: 'láser' },
      narracion_ejemplo: 'El índice de Sentinel crece al principio y luego se satura, mientras el láser sigue subiendo cuando hay más hojas.',
      draw(lt, dur, i, p = {}) {
        const C = V(p, 'curvas', []).slice(0, 2), N = 60;
        const FORM = { saturacion: u => .8 * (1 - Math.exp(-4.5 * u)), lineal: u => .08 + .74 * u, exponencial: u => .06 + .8 * (Math.exp(3 * u) - 1) / (Math.exp(3) - 1), sigmoide: u => .06 + .78 / (1 + Math.exp(-10 * (u - .5))), campana: u => .08 + .74 * Math.exp(-(((u - .5) / .2) ** 2)), decreciente: u => .08 + .76 * Math.exp(-3 * u) };
        const X = u => 150 + u * 780, Y = v => 740 - v * 560;
        const curvaPts = c => {
          if (Array.isArray(c.valores) && c.valores.length > 1) {
            const vs = c.valores.map(Number), mn = Math.min(...vs), mx = Math.max(...vs), rg = (mx - mn) || 1;
            return Array.from({ length: N + 1 }, (_, j) => { const q = j / N * (vs.length - 1), a = Math.floor(q), b = Math.min(vs.length - 1, a + 1); return [j / N, .08 + .76 * ((lerp(vs[a], vs[b], q - a) - mn) / rg)]; });
          }
          const fn = FORM[c.forma] || FORM.lineal; return Array.from({ length: N + 1 }, (_, j) => [j / N, fn(j / N)]);
        };
        const PTS = C.map(curvaPts), cols = C.map((c, k) => c.color || ['#6cc4ff', '#ff6b6b'][k]);
        const tC = [cu(i, p.palabra_curva, .12, dur), cu(i, p.palabra_segunda, .55, dur)], tT = cu(i, p.palabra_techo, .45, dur), tU = cu(i, p.palabra_umbral, .6, dur);
        let s = polvo(lt, 41, 14);
        s += `<rect x="150" y="180" width="780" height="560" fill="#000" fill-opacity=".12"/>`;
        s += `<path d="M150 170V740H950" stroke="#c9cfe0" stroke-width="3" fill="none"/><path d="M140 186L150 166L160 186M934 730L954 740L934 750" stroke="#c9cfe0" stroke-width="3" fill="none"/>`;
        s += txt(110, 460, V(p, 'eje_y', ''), { mono: true, fs: 27, max: 540, anchor: 'middle', rot: -90, color: '#c9cfe0' });
        s += txt(540, 792, V(p, 'eje_x', ''), { mono: true, fs: 27, max: 780, anchor: 'middle', color: '#c9cfe0' });
        const te = V(p, 'techo', null);
        if (te && PTS[te.curva || 0]) {
          const tp = pg(lt, tT - .2, tT + .5), vt = Math.max(...PTS[te.curva || 0].map(z => z[1])), yT = Y(vt);
          if (tp > 0) {
            s += `<rect x="150" y="180" width="780" height="${f(yT - 180)}" fill="#ff6b6b" opacity="${f(.08 * tp, 2)}"/>`;
            s += `<line x1="150" y1="${f(yT)}" x2="${f(150 + 780 * tp)}" y2="${f(yT)}" stroke="#ffd166" stroke-width="3" stroke-dasharray="12 10" stroke-dashoffset="${f(-lt * 20)}"/>`;
            s += tag(160, yT - 34, te.rotulo, { fs: 25, anchor: 'start', color: '#ffd166', op: tp, max: 760 });
          }
        }
        const um = V(p, 'umbral', null);
        if (um && um.posicion != null) {
          const up = pg(lt, tU - .2, tU + .5), xU = X(cl(+um.posicion));
          if (up > 0) {
            s += `<line x1="${f(xU)}" y1="740" x2="${f(xU)}" y2="${f(740 - 560 * up)}" stroke="#a78bfa" stroke-width="3" stroke-dasharray="10 8"/>`;
            const w = Math.min(tw(um.rotulo, 25) + 26, 760); s += tag(cl(xU, 150 + w / 2, 930 - w / 2), 212, um.rotulo, { fs: 25, color: '#a78bfa', op: up, max: 760 });
          }
        }
        PTS.forEach((P, k) => {
          const c = eio(pl(lt, tC[k], tC[k] + 1.8));
          if (c <= 0) return;
          let d = '';
          for (let j = 0; j <= N; j++) { const u = j / N; if (u > c) { const a = P[j - 1], b = P[j], q = (c - a[0]) / (b[0] - a[0]); d += `L${f(X(c))} ${f(Y(lerp(a[1], b[1], q)))}`; break; } d += (j ? 'L' : 'M') + f(X(P[j][0])) + ' ' + f(Y(P[j][1])); }
          s += `<path d="${d}" stroke="${cols[k]}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
          const hu = c < 1 ? c : (lt * .22 + k * .5) % 1, hj = Math.min(N, Math.round(hu * N)), hp = P[hj];
          s += `<circle cx="${f(X(hp[0]))}" cy="${f(Y(hp[1]))}" r="${f(12 + 3 * Math.sin(lt * 5))}" fill="${cols[k]}" opacity=".35"/><circle cx="${f(X(hp[0]))}" cy="${f(Y(hp[1]))}" r="8" fill="#ffffff"/>`;
          const ly = 860 + k * 58, lo = pg(lt, tC[k], tC[k] + .5);
          s += `<g opacity="${f(lo, 2)}"><line x1="150" y1="${ly - 9}" x2="200" y2="${ly - 9}" stroke="${cols[k]}" stroke-width="7" stroke-linecap="round"/></g>` + txt(218, ly, C[k].rotulo, { mono: true, fs: 27, max: 800, color: '#e9ecf3', op: lo });
        });
        return svg(s);
      }
    },

    /* ------------------------------------------------------------------ serie_temporal */
    serie_temporal: {
      descripcion: 'Series en el tiempo que avanzan con un cursor de izquierda a derecha, con franjas de periodos (sequías, campañas, eventos) y marcas puntuales.',
      params: {
        series: { tipo: 'lista', requerido: true, descripcion: '1 a 3 objetos {rotulo, valores, color?}. valores: lista de números en orden temporal, del artículo.', ejemplo: [{ rotulo: 'NDVI del manglar', valores: [0.62, 0.64, 0.61, 0.55, 0.58, 0.63, 0.66, 0.65, 0.67, 0.6, 0.62, 0.68, 0.7] }] },
        inicio: { tipo: 'texto', requerido: true, descripcion: 'Rótulo del inicio del eje temporal (por ejemplo el año).', ejemplo: '2013' },
        fin: { tipo: 'texto', requerido: true, descripcion: 'Rótulo del final del eje temporal.', ejemplo: '2025' },
        eje_y: { tipo: 'texto', requerido: false, descripcion: 'Rótulo del eje vertical (sin números).', ejemplo: 'NDVI' },
        escala: { tipo: 'texto', requerido: false, descripcion: 'compartida (misma escala para todas) o propia (cada serie normalizada; usar si tienen unidades distintas).', ejemplo: 'compartida' },
        periodos: { tipo: 'lista', requerido: false, descripcion: 'Objetos {desde, hasta, rotulo, color?, palabra?}. desde y hasta: posición 0 a 1 del eje, o el año si inicio y fin son años.', ejemplo: [{ desde: 2015, hasta: 2016, rotulo: 'El Niño', color: '#ff6b6b', palabra: 'Niño' }] },
        marcas: { tipo: 'lista', requerido: false, descripcion: 'Objetos {en, rotulo, palabra?}: línea vertical puntual en la posición o año en.', ejemplo: [] },
        mostrar_ultimo: { tipo: 'booleano', requerido: false, descripcion: 'Muestra el último valor de cada serie al terminar.', ejemplo: true },
        decimales: { tipo: 'numero', requerido: false, descripcion: 'Decimales del último valor.', ejemplo: 2 },
        unidad: { tipo: 'texto', requerido: false, descripcion: 'Unidad del último valor.', ejemplo: '' },
        palabra_inicio: { tipo: 'palabra', requerido: false, descripcion: 'Palabra en que arranca el cursor.', ejemplo: 'desde' }
      },
      ejemplo: { series: [{ rotulo: 'NDVI del manglar', valores: [0.62, 0.64, 0.61, 0.55, 0.58, 0.63, 0.66, 0.65, 0.67, 0.6, 0.62, 0.68, 0.7], color: '#7CFFB2' }, { rotulo: 'NDVI del bosque seco', valores: [0.48, 0.5, 0.45, 0.38, 0.44, 0.49, 0.51, 0.47, 0.52, 0.46, 0.5, 0.53, 0.55], color: '#f2a65a' }], inicio: '2013', fin: '2025', eje_y: 'NDVI', periodos: [{ desde: 2015, hasta: 2016, rotulo: 'El Niño', color: '#ff6b6b', palabra: 'Niño' }], mostrar_ultimo: true, decimales: 2, palabra_inicio: 'desde' },
      narracion_ejemplo: 'Desde 2013 el verdor sube y baja; con El Niño de 2015 cae en los dos bosques, y luego se recupera hasta 2025.',
      draw(lt, dur, i, p = {}) {
        const S = V(p, 'series', []).slice(0, 3).filter(z => Array.isArray(z.valores) && z.valores.length > 1);
        let s = polvo(lt, 53, 14);
        const X0 = 130, X1 = 950, YT = 210, YB = 700, X = u => X0 + u * (X1 - X0);
        const a0 = +V(p, 'inicio', NaN), a1 = +V(p, 'fin', NaN), anios = isFinite(a0) && isFinite(a1) && a1 > a0;
        const pos = v => { v = +v; return (v > 1 && anios) ? cl((v - a0) / (a1 - a0)) : cl(v); };
        const prop = V(p, 'escala', 'compartida') === 'propia';
        const all = S.flatMap(z => z.valores.map(Number)), gmn = Math.min(...all), gmx = Math.max(...all);
        const Ys = S.map(z => { const vs = z.valores.map(Number), mn = prop ? Math.min(...vs) : gmn, mx = prop ? Math.max(...vs) : gmx, pad = ((mx - mn) || 1) * .12; return v => YB - (v - mn + pad) / ((mx - mn) + 2 * pad || 1) * (YB - YT); });
        const tS = cu(i, p.palabra_inicio, .1, dur), span = Math.max(3, dur * .6), c = pl(lt, tS, tS + span);
        s += `<rect x="${X0}" y="${YT - 20}" width="${X1 - X0}" height="${YB - YT + 20}" fill="#000" fill-opacity=".12"/>`;
        for (let k = 1; k < 4; k++) s += `<line x1="${X0}" y1="${YT - 20 + k * (YB - YT + 20) / 4}" x2="${X1}" y2="${YT - 20 + k * (YB - YT + 20) / 4}" stroke="#fff" stroke-opacity=".05"/>`;
        V(p, 'periodos', []).forEach((pe, k) => {
          const u0 = pos(pe.desde), u1 = Math.max(u0 + .01, pos(pe.hasta)), te = pe.palabra ? cu(i, pe.palabra, (tS + span * u0) / dur, dur) : tS + span * u0, a = pg(lt, te - .2, te + .4);
          if (a <= 0) return;
          const col = pe.color || PAL[(k + 2) % PAL.length], x0 = X(u0), w = X(u1) - x0;
          s += `<rect x="${f(x0)}" y="${YT - 20}" width="${f(w * a)}" height="${YB - YT + 20}" fill="${col}" opacity="${f(.18 + .05 * Math.sin(lt * 3), 2)}"/>`;
          const lw = Math.max(w, 160); s += tag(cl(x0 + w / 2, X0 + lw / 2, X1 - lw / 2), YT + 8, pe.rotulo, { fs: 24, color: col, op: a, max: Math.max(lw, 300) });
        });
        V(p, 'marcas', []).forEach((m, k) => {
          const u = pos(m.en), te = m.palabra ? cu(i, m.palabra, (tS + span * u) / dur, dur) : tS + span * u, a = pg(lt, te - .2, te + .4);
          if (a <= 0) return;
          s += `<line x1="${f(X(u))}" y1="${YB}" x2="${f(X(u))}" y2="${f(YB - (YB - YT + 20) * a)}" stroke="#a78bfa" stroke-width="3" stroke-dasharray="8 7"/>` + tag(cl(X(u), X0 + 120, X1 - 120), YT + 56 + 44 * (k % 2), m.rotulo, { fs: 22, color: '#a78bfa', op: a, max: 300 });
        });
        s += `<path d="M${X0} ${YT - 30}V${YB}H${X1 + 10}" stroke="#c9cfe0" stroke-width="3" fill="none"/>`;
        s += txt(X0, YB + 44, V(p, 'inicio', ''), { mono: true, fs: 26, color: '#c9cfe0', max: 360 }) + txt(X1, YB + 44, V(p, 'fin', ''), { mono: true, fs: 26, anchor: 'end', color: '#c9cfe0', max: 360 });
        if (p.eje_y) s += txt(96, (YT + YB) / 2, p.eje_y, { mono: true, fs: 26, max: 480, anchor: 'middle', rot: -90, color: '#c9cfe0' });
        const ends = [];
        S.forEach((z, k) => {
          if (c <= 0) return;
          const vs = z.valores.map(Number), m = vs.length - 1, col = z.color || PAL[k % PAL.length], Yf = Ys[k];
          let d = '';
          for (let j = 0; j <= m; j++) { const u = j / m; if (u > c) { const q = (c - (j - 1) / m) * m; d += `L${f(X(c))} ${f(Yf(lerp(vs[j - 1], vs[j], q)))}`; break; } d += (j ? 'L' : 'M') + f(X(u)) + ' ' + f(Yf(vs[j])); }
          s += `<path d="${d}" stroke="${col}" stroke-width="6" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`;
          const jj = Math.min(m, Math.floor(c * m)), q = c * m - jj, hv = jj >= m ? vs[m] : lerp(vs[jj], vs[jj + 1], q), hx = X(c), hy = Yf(hv);
          s += `<circle cx="${f(hx)}" cy="${f(hy)}" r="${f(13 + 3 * Math.sin(lt * 5 + k))}" fill="${col}" opacity=".3"/><circle cx="${f(hx)}" cy="${f(hy)}" r="8" fill="${col}" stroke="#0d1020" stroke-width="2"/>`;
          ends.push({ y: Yf(vs[m]), t: num(vs[m], V(p, 'decimales', decs(vs[m]))) + V(p, 'unidad', ''), col });
          const ly = 830 + k * 52; s += `<line x1="${X0}" y1="${ly - 9}" x2="${X0 + 44}" y2="${ly - 9}" stroke="${col}" stroke-width="6" stroke-linecap="round"/>` + txt(X0 + 60, ly, z.rotulo, { mono: true, fs: 26, max: 780, color: '#e9ecf3' });
        });
        if (c > 0 && c < 1) s += `<line x1="${f(X(c))}" y1="${YT - 20}" x2="${f(X(c))}" y2="${YB}" stroke="#ffffff" stroke-width="2" opacity=".55"/>`;
        if (V(p, 'mostrar_ultimo', false) && c >= 1) {
          const a = pg(lt, tS + span, tS + span + .5);
          ends.sort((u, v) => u.y - v.y);
          for (let k = 1; k < ends.length; k++) if (ends[k].y - ends[k - 1].y < 46) ends[k].y = ends[k - 1].y + 46;
          ends.forEach(e => { s += tag(1016, e.y, e.t, { fs: 26, anchor: 'end', color: e.col, op: a, max: 200 }); });
        }
        return svg(s);
      }
    },

    /* ------------------------------------------------------------------ cuadricula */
    cuadricula: {
      descripcion: 'Cuadrícula de celdas (cuadros, círculos, personas o árboles) que se llenan hasta un porcentaje, con el contador al lado. Para proporciones: cobertura, prevalencia, aciertos.',
      params: {
        porcentaje: { tipo: 'numero', requerido: true, descripcion: 'Porcentaje del artículo, de 0 a 100.', ejemplo: 80 },
        rotulo: { tipo: 'texto', requerido: true, descripcion: 'Qué representa el porcentaje.', ejemplo: 'celdas de 1 km con al menos una huella' },
        filas: { tipo: 'numero', requerido: false, descripcion: 'Filas de la cuadrícula (por defecto 10).', ejemplo: 10 },
        columnas: { tipo: 'numero', requerido: false, descripcion: 'Columnas (por defecto 10).', ejemplo: 10 },
        forma: { tipo: 'texto', requerido: false, descripcion: 'cuadro, circulo, persona o arbol.', ejemplo: 'cuadro' },
        color: { tipo: 'texto', requerido: false, descripcion: 'Color de las celdas llenas.', ejemplo: '#7CFFB2' },
        decimales: { tipo: 'numero', requerido: false, descripcion: 'Decimales del porcentaje.', ejemplo: 0 },
        palabra: { tipo: 'palabra', requerido: false, descripcion: 'Palabra en que empiezan a llenarse.', ejemplo: ['80', 'ochenta'] }
      },
      ejemplo: { porcentaje: 80, rotulo: 'celdas de 1 km con al menos una huella', forma: 'cuadro', color: '#7CFFB2', palabra: ['80', 'ochenta'] },
      narracion_ejemplo: 'Tras dos años, cerca del 80 por ciento de las celdas de un kilómetro tenía al menos una huella de GEDI.',
      draw(lt, dur, i, p = {}) {
        const R = Math.round(cl(+V(p, 'filas', 10), 2, 20)), Cn = Math.round(cl(+V(p, 'columnas', 10), 2, 20)), pct = cl(+V(p, 'porcentaje', 0), 0, 100);
        const col = V(p, 'color', '#7CFFB2'), forma = V(p, 'forma', 'cuadro'), N = R * Cn, nf = Math.round(N * pct / 100);
        const cell = Math.min(640 / Cn, 600 / R), gw = cell * Cn, gh = cell * R, x0 = 540 - gw / 2, y0 = 150;
        const tP = cu(i, p.palabra, .25, dur), fillT = 1.8;
        let s = polvo(lt, 61, 14);
        for (let k = 0; k < N; k++) {
          const r = Math.floor(k / Cn), c = k % Cn, cx = x0 + (c + .5) * cell, cy = y0 + gh - (r + .5) * cell, filled = k < nf;
          const t0 = tP + (nf ? k / nf : 0) * fillT, e = filled ? pop(lt, t0, .35) : 0, sh = .82 + .18 * Math.sin(lt * 3 - k * .23);
          const z = cell * .4;
          const base = forma === 'circulo' ? `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(z)}"` : `<rect x="${f(cx - z)}" y="${f(cy - z)}" width="${f(2 * z)}" height="${f(2 * z)}" rx="${f(z * .25)}"`;
          if (forma === 'persona' || forma === 'arbol') {
            const ic = (sc, fill, op) => forma === 'persona' ? `<g transform="translate(${f(cx)},${f(cy)}) scale(${f(sc, 3)})" opacity="${f(op, 2)}"><circle cx="0" cy="-14" r="9" fill="${fill}"/><rect x="-12" y="-2" width="24" height="22" rx="10" fill="${fill}"/></g>`
              : `<g transform="translate(${f(cx)},${f(cy)}) scale(${f(sc, 3)})" opacity="${f(op, 2)}"><rect x="-3" y="4" width="6" height="16" fill="${fill}"/><circle cx="0" cy="-6" r="14" fill="${fill}"/></g>`;
            const sc = cell / 64;
            s += ic(sc, '#ffffff', .14);
            if (e > .01) s += ic(sc * e, col, sh);
          } else {
            s += `${base} fill="none" stroke="#ffffff" stroke-opacity=".18" stroke-width="2"/>`;
            if (e > .01) s += forma === 'circulo' ? `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(z * e)}" fill="${col}" opacity="${f(sh, 2)}"/>` : `<rect x="${f(cx - z * e)}" y="${f(cy - z * e)}" width="${f(2 * z * e)}" height="${f(2 * z * e)}" rx="${f(z * .25)}" fill="${col}" opacity="${f(sh, 2)}"/>`;
          }
        }
        const pr = eio(pl(lt, tP, tP + fillT + .3)), dn = pg(lt, tP + fillT + .3, tP + fillT + .5) * (1 - pg(lt, tP + fillT + .5, tP + fillT + 1.1));
        s += DIBUJO.contador(540, y0 + gh + 140, 1, lt, { valor: pct, dec: V(p, 'decimales', decs(pct)), progreso: pr, sufijo: '%', fs: 130, max: 900, pop: dn, color: col, op: pg(lt, tP - .1, tP + .25) });
        s += tag(540, y0 + gh + 210, V(p, 'rotulo', ''), { fs: 28, max: 980, op: pg(lt, tP + .4, tP + .9) });
        return svg(s);
      }
    },

    /* ------------------------------------------------------------------ flujo_pasos */
    flujo_pasos: {
      descripcion: 'De 3 a 6 cajas que entran en secuencia unidas por flechas: pasos de un método, cadena de productos o etapas de un proceso.',
      params: {
        pasos: { tipo: 'lista', requerido: true, descripcion: 'De 3 a 6 objetos {titulo, detalle?, icono?, palabra?}. icono: nombre de DIBUJO; palabra: cuándo entra la caja.', ejemplo: [{ titulo: 'Descargar imágenes', detalle: 'Sentinel-1 y Sentinel-2', icono: 'satelite', palabra: 'descarga' }, { titulo: 'Calcular índices', detalle: 'NDVI y VV/VH', icono: 'engranaje', palabra: 'calcula' }, { titulo: 'Entrenar el modelo', detalle: 'bosque aleatorio', icono: 'arbol', palabra: 'entrena' }, { titulo: 'Validar en campo', detalle: 'parcelas de control', icono: 'persona', palabra: 'valida' }] },
        titulo: { tipo: 'texto', requerido: false, descripcion: 'Título corto sobre las cajas.', ejemplo: 'Método' },
        palabra_inicio: { tipo: 'palabra', requerido: false, descripcion: 'Si los pasos no traen palabra, entran escalonados desde esta.', ejemplo: 'primero' }
      },
      ejemplo: { titulo: 'Método', pasos: [{ titulo: 'Descargar imágenes', detalle: 'Sentinel-1 y Sentinel-2', icono: 'satelite', palabra: 'descarga' }, { titulo: 'Calcular índices', detalle: 'NDVI y VV/VH', icono: 'engranaje', palabra: 'calcula' }, { titulo: 'Entrenar el modelo', detalle: 'bosque aleatorio', icono: 'arbol', palabra: 'entrena' }, { titulo: 'Validar en campo', detalle: 'parcelas de control', icono: 'persona', palabra: 'valida' }], palabra_inicio: 'primero' },
      narracion_ejemplo: 'Primero se descarga cada imagen, luego se calcula cada índice, se entrena el clasificador y al final se valida en campo.',
      draw(lt, dur, i, p = {}) {
        const P = V(p, 'pasos', []).slice(0, 6), n = P.length, tit = V(p, 'titulo', '');
        let s = polvo(lt, 71, 14);
        if (!n) return svg(s);
        if (tit) s += tag(540, 160, tit, { fs: 32, color: '#ffd166', max: 900, op: pg(lt, .1, .5) });
        const top = tit ? 215 : 150, bot = 985, gap = 44, bh = Math.min(132, (bot - top - gap * (n - 1)) / n), tot = n * bh + (n - 1) * gap, y0 = top + (bot - top - tot) / 2;
        const tI = cu(i, p.palabra_inicio, .08, dur), paso = Math.max(.6, (dur * .78 - tI) / n);
        const T = P.map((z, k) => tk(i, dur, z.palabra, tI, k, paso));
        let act = -1; T.forEach((t, k) => { if (lt >= t) act = k; });
        // un mismo tamaño de título para todas las cajas (el del título que menos cabe)
        const br0 = Math.min(34, bh * .3), xt0 = 150 + 2 * br0 + 46;
        const fsT = Math.max(22, Math.min(38, bh * .32, ...P.map(z => fit(z.titulo, 38, (z.icono && DIBUJO[z.icono] ? 630 : 750) - (xt0 - 150), .52))));
        P.forEach((z, k) => {
          const e = pg(lt, T[k] - .1, T[k] + .5); if (e <= 0) return;
          const y = y0 + k * (bh + gap), dx = 90 * (1 - e), on = k === act, cy = y + bh / 2, col = PAL[k % PAL.length];
          if (k > 0) { const ya = y - gap + 4, yb = y - 6; s += DIBUJO.flecha(540, ya, 1, lt, { hasta: [540, yb], progreso: e, color: '#c9cfe0', op: .8 }); for (let q = 0; q < 2; q++) { const u = (lt * 1.2 + q / 2) % 1; s += `<circle cx="540" cy="${f(lerp(ya, yb - 10, u))}" r="4" fill="#ffffff" opacity="${f(.6 * e * (1 - u), 2)}"/>`; } }
          s += `<g transform="translate(${f(dx)},0)" opacity="${f(e, 2)}">`;
          s += `<rect x="150" y="${f(y)}" width="780" height="${f(bh)}" rx="16" fill="#0d1020" fill-opacity=".82" stroke="${on ? col : '#56607a'}" stroke-width="${on ? 4 : 2}"/>`;
          const br = Math.min(34, bh * .3);
          s += `<circle cx="${f(150 + br + 22)}" cy="${f(cy)}" r="${f(br * (on ? 1 + .06 * Math.sin(lt * 5) : 1))}" fill="${on ? col : '#2a3046'}"/>` + txt(150 + br + 22, cy + br * .38, String(k + 1), { fs: br * 1.05, anchor: 'middle', peso: 800, color: on ? '#0d1020' : '#e9ecf3' });
          const xt = 150 + 2 * br + 46, ic = z.icono && DIBUJO[z.icono], wt = (ic ? 780 - 150 : 780 - 30) - (xt - 150);
          const fs = Math.min(fsT, fit(z.titulo, 38, wt, .52));
          s += txt(xt, cy + (z.detalle ? -bh * .06 : fs * .36), z.titulo, { fs, peso: 800, color: '#ffffff' });
          if (z.detalle) s += txt(xt, cy + bh * .26, z.detalle, { mono: true, fs: Math.min(24, bh * .2), max: wt, color: '#c9cfe0', peso: 500 });
          if (ic) { const sc = Math.min(.55, bh * .78 / 200); s += obj(z.icono, 930 - 75, cy + 3 * Math.sin(lt * 1.5 + k), sc, lt + k, z.opciones || {}); }
          s += `</g>`;
        });
        return svg(s);
      }
    },

    /* ------------------------------------------------------------------ antes_despues */
    antes_despues: {
      descripcion: 'Dos paneles que se contrastan (antes y después, con y sin tratamiento, sitio A y sitio B): cada uno con objetos repetidos, una cifra y una nota.',
      params: {
        antes: { tipo: 'lista', requerido: true, descripcion: 'Objeto {rotulo, objeto?, cantidad? (1 a 12 copias del dibujo, visual), opciones?, cifra?, unidad?, decimales?, nota?, color?, palabra?}.', ejemplo: { rotulo: 'antes del dragado', objeto: 'arbol', cantidad: 9, opciones: { tipo: 'manglar' }, cifra: 52, unidad: 'km²', nota: 'manglar en pie', palabra: 'antes' } },
        despues: { tipo: 'lista', requerido: true, descripcion: 'Mismo formato que antes.', ejemplo: { rotulo: 'después', objeto: 'arbol', cantidad: 4, opciones: { tipo: 'manglar' }, cifra: 38, unidad: 'km²', nota: 'manglar en pie', palabra: 'después' } }
      },
      ejemplo: { antes: { rotulo: 'antes del dragado', objeto: 'arbol', cantidad: 9, opciones: { tipo: 'manglar' }, cifra: 52, unidad: 'km²', nota: 'manglar en pie', color: '#7CFFB2', palabra: 'antes' }, despues: { rotulo: 'después', objeto: 'arbol', cantidad: 4, opciones: { tipo: 'manglar' }, cifra: 38, unidad: 'km²', nota: 'manglar en pie', color: '#ff6b6b', palabra: 'después' } },
      narracion_ejemplo: 'Antes del dragado había 52 kilómetros cuadrados de manglar; después quedaban apenas 38.',
      draw(lt, dur, i, p = {}) {
        const A = V(p, 'antes', {}), Bp = V(p, 'despues', {});
        const tA = cu(i, A.palabra, .08, dur), tB = cu(i, Bp.palabra, .5, dur);
        let s = polvo(lt, 81, 16);
        const panel = (Pn, x0, t0, k, dim) => {
          const e = pg(lt, t0 - .15, t0 + .5); if (e <= 0) return '';
          const W = 470, cx = x0 + W / 2, col = Pn.color || (k ? '#ff6b6b' : '#7CFFB2');
          let g = `<rect x="${x0}" y="140" width="${W}" height="830" rx="22" fill="#ffffff" fill-opacity=".05" stroke="${col}" stroke-opacity=".5" stroke-width="2"/>`;
          g += tag(cx, 195, Pn.rotulo, { fs: 28, color: col, max: W - 30 });
          const nC = Math.round(cl(+(Pn.cantidad || 1), 1, 12)), cols = nC === 1 ? 1 : nC <= 4 ? 2 : 3, rows = Math.ceil(nC / cols), sc = nC === 1 ? 1.15 : nC <= 4 ? .72 : nC <= 9 ? .5 : .42;
          const cw = (W - 60) / cols, rh = 380 / rows;
          for (let j = 0; j < nC; j++) {
            const r = Math.floor(j / cols), c = j % cols, ox = x0 + 30 + (c + .5) * cw + (r % 2 ? 10 : -10) * (cols > 1 ? 1 : 0), oy = 250 + (r + .5) * rh;
            const ej = pop(lt, t0 + .1 + j * .08, .45); if (ej <= .01) continue;
            g += obj(Pn.objeto || 'arbol', ox, oy + 4 * Math.sin(lt * 1.4 + j), sc * ej, lt + j * .6, Pn.opciones || {});
          }
          if (Pn.cifra != null) { const pr = eio(pl(lt, t0 + .4, t0 + 1.6)); g += DIBUJO.contador(cx, 770, 1, lt, { valor: +Pn.cifra, dec: Pn.decimales != null ? Pn.decimales : decs(Pn.cifra), progreso: pr, sufijo: Pn.unidad || '', fs: 100, max: W - 40, color: col, op: pg(lt, t0 + .35, t0 + .6) }); }
          if (Pn.nota) { const B = bloque(Pn.nota, W - 50, 24, 2, .6, 18); B.lines.forEach((ln, j) => { g += txt(cx, 850 + j * B.fs * 1.3, ln, { mono: true, fs: B.fs, anchor: 'middle', color: '#c9cfe0', peso: 500 }); }); }
          return `<g transform="translate(${f(k ? 80 * (1 - e) : -80 * (1 - e))},0)" opacity="${f(e * dim, 2)}">${g}</g>`;
        };
        const dB = pg(lt, tB - .2, tB + .5);
        s += panel(A, 50, tA, 0, 1 - .4 * dB) + panel(Bp, 560, tB, 1, 1);
        if (dB > 0) { const ax = 540 + 6 * Math.sin(lt * 4); s += `<circle cx="540" cy="470" r="${f(30 * bo(dB))}" fill="#0d1020" stroke="#ffd166" stroke-width="3"/><path d="M${f(ax - 10)} 456L${f(ax + 10)} 470L${f(ax - 10)} 484" stroke="#ffd166" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${f(dB, 2)}"/>`; }
        return svg(s);
      }
    },

    /* ------------------------------------------------------------------ capas */
    capas: {
      descripcion: 'Pila de 2 a 6 capas isométricas que se separan (o se apilan una a una) con su rótulo: estratos del suelo, capas del dosel, niveles de un modelo, capas de datos.',
      params: {
        capas: { tipo: 'lista', requerido: true, descripcion: 'De 2 a 6 objetos {rotulo, color?, detalle?, palabra?}, de arriba hacia abajo.', ejemplo: [{ rotulo: 'dosel superior', color: '#7ed38a' }, { rotulo: 'sotobosque', color: '#4fae63' }, { rotulo: 'hojarasca', color: '#a5835f' }, { rotulo: 'suelo', color: '#6b4a33' }] },
        modo: { tipo: 'texto', requerido: false, descripcion: 'separar (la pila se abre) o apilar (las capas caen una a una desde la de abajo).', ejemplo: 'separar' },
        haz: { tipo: 'booleano', requerido: false, descripcion: 'Un haz (láser, radar, luz) atraviesa las capas desde arriba.', ejemplo: true },
        color_haz: { tipo: 'texto', requerido: false, descripcion: 'Color del haz.', ejemplo: '#ff6b6b' },
        titulo: { tipo: 'texto', requerido: false, descripcion: 'Título corto.', ejemplo: '' },
        palabra_inicio: { tipo: 'palabra', requerido: false, descripcion: 'Palabra en que aparece la pila.', ejemplo: 'bosque' },
        palabra_separar: { tipo: 'palabra', requerido: false, descripcion: 'Palabra en que se separan las capas (modo separar).', ejemplo: 'capas' }
      },
      ejemplo: { capas: [{ rotulo: 'dosel superior', color: '#7ed38a' }, { rotulo: 'sotobosque', color: '#4fae63' }, { rotulo: 'hojarasca', color: '#a5835f' }, { rotulo: 'suelo', color: '#6b4a33', detalle: 'aquí rebota el último eco' }], modo: 'separar', haz: true, color_haz: '#ff6b6b', palabra_inicio: 'bosque', palabra_separar: 'capas' },
      narracion_ejemplo: 'Un bosque no es una sola superficie: el láser atraviesa sus capas, del dosel hasta el suelo.',
      draw(lt, dur, i, p = {}) {
        const C = V(p, 'capas', []).slice(0, 6), n = C.length, modo = V(p, 'modo', 'separar');
        let s = polvo(lt, 91, 14);
        if (!n) return svg(s);
        const tit = V(p, 'titulo', '');
        if (tit) s += tag(540, 160, tit, { fs: 30, color: '#ffd166', max: 900, op: pg(lt, .1, .5) });
        const cx = 380, a = 200, b = 80, th = 22, yBot = 880, yTop = tit ? 300 : 250, gap = n > 1 ? Math.min(150, (yBot - yTop) / (n - 1)) : 0;
        const tI = cu(i, p.palabra_inicio, .08, dur), tS = cu(i, p.palabra_separar, .4, dur);
        const sep = modo === 'separar' ? eio(pl(lt, tS, tS + 1.2)) : 1;
        const ys = [];
        let out = '';
        const LBL = [];
        for (let k = n - 1; k >= 0; k--) {
          const z = C[k], col = z.color || PAL[k % PAL.length], ySep = yBot - (n - 1 - k) * gap, yStk = yBot - (n - 1 - k) * (th + 6);
          let y = lerp(yStk, ySep, sep), op;
          if (modo === 'apilar') { const t0 = tk(i, dur, z.palabra, tI, n - 1 - k, .55), e = eo((lt - t0) / .7); op = cl(e * 2); y = lerp(80, ySep, cl(e)); if (e <= 0) { ys[k] = null; continue; } }
          else op = pg(lt, tI - .2 + (n - 1 - k) * .12, tI + .3 + (n - 1 - k) * .12);
          y += 3 * Math.sin(lt * 1.2 + k);
          ys[k] = y;
          out += slab(cx, y, a, b, th, col, mix(col.length === 7 ? col : '#4fae63', '#000000', .3), mix(col.length === 7 ? col : '#4fae63', '#000000', .45), op, mix(col.length === 7 ? col : '#4fae63', '#ffffff', .35));
          const lo = (modo === 'separar' ? pg(lt, tS + .5 + (n - 1 - k) * .12, tS + 1 + (n - 1 - k) * .12) : pg(lt, 0, .4) * op);
          LBL.push([k, y, lo]);
        }
        // el haz va detrás de las losas (se ve en los huecos) y los impactos encima de cada superficie
        let haz = '', imp = '';
        if (V(p, 'haz', false)) {
          const th0 = Math.max(tI, modo === 'separar' ? tS + .9 : tI + 1), hb = pg(lt, th0, th0 + .4), hc = V(p, 'color_haz', '#ff6b6b'), hx = cx + 30;
          const vis = ys.filter(y => y != null), yEnd = vis.length ? Math.max(...vis) : yBot;
          if (hb > 0) {
            haz = DIBUJO.laser(hx, 140, 1, lt, { hasta: [hx, yEnd + 4], color: hc, op: hb, progreso: hb, ancho: 18, huella: false });
            // tramos visibles: de la punta inferior de una losa a la cara superior de la siguiente, y desde arriba hasta la primera
            const ord = ys.map((y, k) => [y, k]).filter(z => z[0] != null).sort((u, v) => u[0] - v[0]);
            const seg = (y1, y2) => y2 - y1 > 4 ? `<line x1="${hx}" y1="${f(y1)}" x2="${hx}" y2="${f(y2)}" stroke="${hc}" stroke-width="4" opacity="${f(hb, 2)}"/><line x1="${hx}" y1="${f(y1)}" x2="${hx}" y2="${f(y2)}" stroke="${hc}" stroke-width="12" opacity="${f(.2 * hb, 2)}"/>` : '';
            if (ord.length) imp += seg(140, ord[0][0]);
            for (let q = 0; q + 1 < ord.length; q++) imp += seg(ord[q][0] + b * (1 - Math.abs(hx - cx) / a) + th, ord[q + 1][0]);
            ys.forEach((y, k) => { if (y == null) return; const u = (lt * 1.4 + k * .27) % 1; imp += `<ellipse cx="${hx}" cy="${f(y)}" rx="${f(16 + 40 * u)}" ry="${f(6 + 16 * u)}" fill="none" stroke="${hc}" stroke-width="3" opacity="${f(hb * (1 - u), 2)}"/><ellipse cx="${hx}" cy="${f(y)}" rx="9" ry="4" fill="#ffd0d0" opacity="${f(hb, 2)}"/>`; });
          }
        }
        s += haz + out + imp;
        LBL.forEach(([k, y, lo]) => {
          if (lo <= .01) return;
          const z = C[k], col = z.color || PAL[k % PAL.length];
          s += `<line x1="${cx + a + 6}" y1="${f(y)}" x2="${cx + a + 50}" y2="${f(y)}" stroke="${col}" stroke-width="2.5" opacity="${f(lo, 2)}"/>`;
          // rótulo largo: dos líneas antes que una letra ilegible
          const mw = 1030 - (cx + a + 58), L = fit(z.rotulo, 26, mw - 26, .6) >= 21 ? [z.rotulo] : bloque(z.rotulo, mw - 26, 24, 2, .6, 18).lines;
          L.forEach((ln, j) => { s += tag(cx + a + 58, y + (j - (L.length - 1) / 2) * 40, ln, { fs: L.length > 1 ? 22 : 26, anchor: 'start', color: '#e9ecf3', op: lo, max: mw, borde: col }); });
          if (z.detalle && gap > 70) s += txt(cx + a + 62, y + 22 + 22 * L.length, z.detalle, { mono: true, fs: 21, max: 1030 - (cx + a + 62), color: '#c9cfe0', op: lo * .85, peso: 500 });
        });
        return svg(s);
      }
    },

    /* ------------------------------------------------------------------ mapa_puntos */
    mapa_puntos: {
      descripcion: 'Puntos de muestreo que aparecen sobre un contorno esquemático (sin geografía real salvo que se pase el contorno), por grupos o en total, con contador.',
      params: {
        grupos: { tipo: 'lista', requerido: false, descripcion: 'Objetos {rotulo, n, color?, palabra?}: categorías de puntos con su cantidad del artículo.', ejemplo: [{ rotulo: 'manglar', n: 120, color: '#7CFFB2', palabra: 'manglar' }, { rotulo: 'agua', n: 60, color: '#6cc4ff', palabra: 'agua' }, { rotulo: 'otras', n: 40, color: '#f2a65a', palabra: 'otras' }] },
        n_puntos: { tipo: 'numero', requerido: false, descripcion: 'Total de puntos si no hay grupos.', ejemplo: 220 },
        total: { tipo: 'numero', requerido: false, descripcion: 'Total que muestra el contador cuando hay grupos, tal como lo da el artículo (la plantilla no suma los grupos). Sin él y con grupos no hay contador.', ejemplo: 220 },
        contorno: { tipo: 'lista', requerido: false, descripcion: 'Polígono [[x,y],...] normalizado 0 a 1 (x a la derecha, y hacia abajo). Sin él se dibuja una forma esquemática.', ejemplo: null },
        puntos: { tipo: 'lista', requerido: false, descripcion: 'Posiciones reales [[x,y],...] normalizadas 0 a 1; si faltan, se reparten dentro del contorno.', ejemplo: null },
        rotulo: { tipo: 'texto', requerido: false, descripcion: 'Qué son los puntos.', ejemplo: 'puntos de muestreo 2025' },
        mostrar_contador: { tipo: 'booleano', requerido: false, descripcion: 'Cuenta los puntos a medida que aparecen.', ejemplo: true },
        forma_punto: { tipo: 'texto', requerido: false, descripcion: 'punto o pin.', ejemplo: 'punto' },
        palabra: { tipo: 'palabra', requerido: false, descripcion: 'Palabra en que empiezan a aparecer (si los grupos no traen palabra).', ejemplo: 'muestreo' }
      },
      ejemplo: { grupos: [{ rotulo: 'manglar', n: 120, color: '#7CFFB2', palabra: 'manglar' }, { rotulo: 'agua', n: 60, color: '#6cc4ff', palabra: 'agua' }, { rotulo: 'otras', n: 40, color: '#f2a65a', palabra: 'otras' }], total: 220, rotulo: 'puntos de muestreo 2025', mostrar_contador: true, forma_punto: 'punto', palabra: 'muestreo' },
      narracion_ejemplo: 'Para el muestreo se marcaron puntos de manglar, de agua y de otras coberturas en toda la ciénaga.',
      draw(lt, dur, i, p = {}) {
        const MX = 110, MY = 140, MW = 860, MH = 640;
        let G = V(p, 'grupos', null), totC = V(p, 'total', null);
        if (!Array.isArray(G) || !G.length) { G = [{ rotulo: '', n: +V(p, 'n_puntos', 50), color: '#7CFFB2' }]; if (totC == null && p.n_puntos != null) totC = +p.n_puntos; }
        const tot = G.reduce((a, g) => a + Math.max(0, Math.round(+g.n || 0)), 0), nDraw = Math.min(tot, 400);
        const cont = V(p, 'contorno', null);
        const D = memo('mapa' + JSON.stringify([cont, V(p, 'puntos', null), G.map(g => g.n)]), () => {
          let P = Array.isArray(cont) && cont.length > 2 ? cont.map(([x, y]) => [+x, +y]) : null;
          if (!P) { P = []; for (let j = 0; j < 64; j++) { const t = j / 64 * 2 * Math.PI, r = .4 + .05 * Math.sin(3 * t + 1) + .035 * Math.sin(5 * t + 2) + .025 * Math.sin(8 * t); P.push([.5 + r * Math.cos(t) * .98, .5 + r * Math.sin(t) * .92]); } }
          const r = rnd(97), pts = [], given = V(p, 'puntos', null);
          let idx = 0;
          for (let gI = 0; gI < G.length; gI++) {
            const m = Math.round((Math.max(0, +G[gI].n || 0) / (tot || 1)) * nDraw);
            for (let j = 0; j < m; j++, idx++) {
              if (Array.isArray(given) && given[idx]) { pts.push([+given[idx][0], +given[idx][1], gI, j / Math.max(1, m)]); continue; }
              let x, y, g = 0; do { x = r(); y = r(); g++; } while (!inPoly(x, y, P) && g < 200);
              pts.push([x, y, gI, j / Math.max(1, m)]);
            }
          }
          return { P, pts };
        });
        const SX = x => MX + x * MW, SY = y => MY + y * MH;
        const tP = cu(i, p.palabra, .12, dur), win = 1.4;
        const tG = G.map((g, k) => g.palabra ? cu(i, g.palabra, (tP + k * 1.2) / dur, dur) : tP + k * 1.2);
        let s = `<rect x="${MX}" y="${MY}" width="${MW}" height="${MH}" rx="22" fill="#0d1020" fill-opacity=".35"/>`;
        for (let k = 1; k < 6; k++) s += `<line x1="${MX + k * MW / 6}" y1="${MY}" x2="${MX + k * MW / 6}" y2="${MY + MH}" stroke="#fff" stroke-opacity=".05"/>`;
        for (let k = 1; k < 4; k++) s += `<line x1="${MX}" y1="${MY + k * MH / 4}" x2="${MX + MW}" y2="${MY + k * MH / 4}" stroke="#fff" stroke-opacity=".05"/>`;
        const dp = 'M' + D.P.map(([x, y]) => f(SX(x)) + ' ' + f(SY(y))).join('L') + 'Z', dr = pl(lt, .1, 1.6);
        s += `<path d="${dp}" fill="#2f4a3a" fill-opacity="${f(.85 * pg(lt, .8, 2), 2)}" stroke="#7fb08e" stroke-width="3" stroke-dasharray="4000" stroke-dashoffset="${f(4000 * (1 - dr))}"/>`;
        const sw = ((lt * .25) % 1.3) - .15;
        if (sw > 0 && sw < 1) s += `<rect x="${f(MX + sw * MW)}" y="${MY}" width="46" height="${MH}" fill="#ffffff" opacity=".05"/>`;
        let cnt = 0;
        const pin = V(p, 'forma_punto', 'punto') === 'pin';
        D.pts.forEach(([x, y, gI, q], k) => {
          const t0 = tG[gI] + q * win, e = pop(lt, t0, .4); if (e <= .01) return;
          if (lt >= t0 + .1) cnt++;
          const col = G[gI].color || PAL[(gI + 3) % PAL.length], px = SX(x), py = SY(y);
          if (pin) s += DIBUJO.pin(px, py, .7 * e, lt, { color: col });
          else {
            s += `<circle cx="${f(px)}" cy="${f(py)}" r="${f(7 * e + .8 * Math.sin(lt * 3 + k))}" fill="${col}" stroke="#0d1020" stroke-width="1.5"/>`;
            const u = pl(lt, t0, t0 + .8); if (u > 0 && u < 1) s += `<circle cx="${f(px)}" cy="${f(py)}" r="${f(7 + 22 * u)}" fill="none" stroke="${col}" stroke-width="2" opacity="${f(1 - u, 2)}"/>`;
          }
        });
        // el contador sube con los puntos que van apareciendo y termina exactamente en el total recibido
        const shown = nDraw && totC != null ? Math.round(cnt / nDraw * +totC) : 0;
        if (V(p, 'mostrar_contador', true) && totC != null) s += DIBUJO.contador(970, 900, 1, lt, { valor: shown, fs: 96, anchor: 'end', color: '#ffd166', op: cnt > 0 ? pg(lt, tG[0], tG[0] + .3) : 0, max: 420 });
        s += tag(MX, 870, V(p, 'rotulo', ''), { fs: 26, anchor: 'start', op: pg(lt, .3, .8), max: 470 });
        let lx = MX;
        G.forEach((g, k) => {
          if (!g.rotulo) return;
          const a = pg(lt, tG[k] - .1, tG[k] + .4), col = g.color || PAL[(k + 3) % PAL.length], w = tw(g.rotulo, 24) + 26;
          if (lx + 30 + w > 760) return;
          s += `<circle cx="${lx + 10}" cy="935" r="9" fill="${col}" opacity="${f(a, 2)}"/>` + txt(lx + 28, 944, g.rotulo, { mono: true, fs: 24, color: '#e9ecf3', op: a });
          lx += 50 + w;
        });
        return svg(s);
      }
    },

    /* ------------------------------------------------------------------ figura_paper */
    figura_paper: {
      descripcion: 'Muestra una figura del artículo (FIGURAS[id]) con acercamiento lento a una región y recuadros de resaltado que aparecen sincronizados con la voz.',
      params: {
        figura: { tipo: 'figura', requerido: true, descripcion: 'id de la figura en FIGURAS (data URI, o {src, ancho, alto}).', ejemplo: 'fig1' },
        aspecto: { tipo: 'numero', requerido: false, descripcion: 'Ancho/alto de la imagen (se ignora si FIGURAS[id] trae ancho y alto).', ejemplo: 1.5 },
        zoom: { tipo: 'lista', requerido: false, descripcion: 'Región {x, y, ancho, alto} normalizada 0 a 1 a la que se acerca la cámara.', ejemplo: { x: 0.5, y: 0.05, ancho: 0.48, alto: 0.7 } },
        recuadros: { tipo: 'lista', requerido: false, descripcion: 'Objetos {x, y, ancho, alto (normalizados), rotulo, palabra?, color?}.', ejemplo: [{ x: 0.6, y: 0.18, ancho: 0.16, alto: 0.32, rotulo: 'pico de 2015', palabra: 'pico', color: '#ffd166' }] },
        pie: { tipo: 'texto', requerido: false, descripcion: 'Pie con la fuente de la figura.', ejemplo: 'Figura 3 · Autor et al. 2025' },
        palabra_zoom: { tipo: 'palabra', requerido: false, descripcion: 'Palabra en que empieza el acercamiento.', ejemplo: 'derecha' }
      },
      ejemplo: { figura: 'fig1', aspecto: 1.5, zoom: { x: 0.5, y: 0.05, ancho: 0.48, alto: 0.7 }, recuadros: [{ x: 0.6, y: 0.18, ancho: 0.16, alto: 0.32, rotulo: 'pico de 2015', palabra: 'pico', color: '#ffd166' }], pie: 'Figura 3 · Autor et al. 2025', palabra_zoom: 'derecha' },
      narracion_ejemplo: 'En la figura del artículo, mira el panel de la derecha: el pico marca el año más seco de la serie.',
      draw(lt, dur, i, p = {}) {
        const FX = 60, FY = 130, FW = 960, FH = 790;
        const id = V(p, 'figura', ''), fig = (typeof FIGURAS !== 'undefined' && FIGURAS) ? FIGURAS[id] : null;
        const src = fig && typeof fig === 'object' ? fig.src : fig, asp = fig && typeof fig === 'object' && fig.ancho && fig.alto ? fig.ancho / fig.alto : +V(p, 'aspecto', 1.4);
        let w, h; if (asp >= FW / FH) { w = FW; h = FW / asp; } else { h = FH; w = FH * asp; }
        const fcx = FX + FW / 2, fcy = FY + FH / 2;
        const zr = V(p, 'zoom', null), tZ = cu(i, p.palabra_zoom, .35, dur), z = zr ? eio(pl(lt, tZ - .2, tZ + 1.8)) : 0;
        let kz = 1, zx = .5, zy = .5;
        if (zr) { kz = Math.min(3.2, FW / (zr.ancho * w), FH / (zr.alto * h)); zx = zr.x + zr.ancho / 2; zy = zr.y + zr.alto / 2; }
        const kb = 1 + .035 * pl(lt, 0, dur), k = lerp(1, kz, z) * kb, ccx = lerp(.5, zx, z) + .004 * Math.sin(lt * .4), ccy = lerp(.5, zy, z) + .004 * Math.cos(lt * .33);
        const SX = u => fcx + (u - ccx) * w * k, SY = v => fcy + (v - ccy) * h * k;
        const e = pg(lt, 0, .6);
        let s = `<defs><clipPath id="fpclip"><rect x="${FX}" y="${FY}" width="${FW}" height="${FH}" rx="14"/></clipPath></defs>`;
        s += `<rect x="${FX - 6}" y="${FY - 6}" width="${FW + 12}" height="${FH + 12}" rx="18" fill="#0d1020" fill-opacity=".55"/>`;
        let inner = `<rect x="${FX}" y="${FY}" width="${FW}" height="${FH}" fill="#f4f1ea"/>`;
        if (src) inner += `<image href="${src}" x="${f(SX(0))}" y="${f(SY(0))}" width="${f(w * k)}" height="${f(h * k)}" preserveAspectRatio="none" opacity="${f(e, 2)}"/>`;
        else { inner += `<rect x="${f(SX(0))}" y="${f(SY(0))}" width="${f(w * k)}" height="${f(h * k)}" fill="#e6e1d6" stroke="#bdb6a6" stroke-width="3" stroke-dasharray="14 10"/>` + txt(fcx, fcy, 'figura no disponible: ' + id, { mono: true, fs: 30, anchor: 'middle', color: '#6b6457', max: 800 }); }
        const R = V(p, 'recuadros', []);
        const TR = R.map((r, j) => cu(i, r.palabra, Math.min(.9, (tZ + 1.8 + j * 1.2) / dur), dur));
        let act = -1; TR.forEach((t, j) => { if (lt >= t) act = j; });
        if (act >= 0) {
          const r = R[act], a = pg(lt, TR[act], TR[act] + .5) * .3, x0 = SX(r.x), y0 = SY(r.y), x1 = SX(r.x + r.ancho), y1 = SY(r.y + r.alto);
          inner += `<path d="M${FX} ${FY}H${FX + FW}V${FY + FH}H${FX}Z M${f(x0)} ${f(y0)}V${f(y1)}H${f(x1)}V${f(y0)}Z" fill="#0d1020" fill-rule="evenodd" opacity="${f(a, 2)}"/>`;
        }
        s += `<g clip-path="url(#fpclip)">${inner}</g>`;
        R.forEach((r, j) => {
          const a = pg(lt, TR[j] - .1, TR[j] + .6); if (a <= 0) return;
          const col = r.color || '#ffd166', x0 = cl(SX(r.x), FX + 4, FX + FW - 4), y0 = cl(SY(r.y), FY + 4, FY + FH - 4), x1 = cl(SX(r.x + r.ancho), FX + 4, FX + FW - 4), y1 = cl(SY(r.y + r.alto), FY + 4, FY + FH - 4);
          const per = 2 * ((x1 - x0) + (y1 - y0)), pu = .5 + .5 * Math.sin(lt * 4);
          s += `<rect x="${f(x0)}" y="${f(y0)}" width="${f(x1 - x0)}" height="${f(y1 - y0)}" rx="8" fill="none" stroke="${col}" stroke-width="${f(5 + (j === act ? 2 * pu : 0))}" stroke-dasharray="${f(per)}" stroke-dashoffset="${f(per * (1 - a))}"/>`;
          const lw = Math.min(tw(r.rotulo, 26) + 26, FW - 20), lx = cl((x0 + x1) / 2, FX + lw / 2 + 8, FX + FW - lw / 2 - 8), ly = y0 - 34 > FY + 30 ? y0 - 34 : y1 + 34 < FY + FH - 20 ? y1 + 34 : y0 + 34;
          s += tag(lx, ly, r.rotulo, { fs: 26, color: col, op: pg(lt, TR[j] + .3, TR[j] + .7), max: FW - 20, borde: col });
        });
        s += txt(540, 962, V(p, 'pie', ''), { mono: true, fs: 23, anchor: 'middle', color: '#c9cfe0', max: 960, peso: 500, op: .85 * e });
        return svg(s);
      }
    },

    /* ------------------------------------------------------------------ lista_repaso */
    lista_repaso: {
      descripcion: 'Cierre: de 3 a 6 fichas con las ideas clave que aparecen una por una, cada una en la palabra que la nombra.',
      params: {
        items: { tipo: 'lista', requerido: true, descripcion: 'De 3 a 6 textos cortos (menos de 50 caracteres) u objetos {texto, palabra}.', ejemplo: [{ texto: 'Tres sensores miden distinto el mismo bosque', palabra: 'sensores' }, { texto: 'Huella por huella casi no coinciden', palabra: 'huella' }, { texto: 'Por sitio el acuerdo sube a R² 0,69', palabra: 'sitio' }, { texto: 'El óptico se satura cerca de LAI 3', palabra: 'satura' }] },
        titulo: { tipo: 'texto', requerido: false, descripcion: 'Título de la lista.', ejemplo: 'En resumen' },
        color: { tipo: 'texto', requerido: false, descripcion: 'Color de acento.', ejemplo: '#7CFFB2' },
        palabra_inicio: { tipo: 'palabra', requerido: false, descripcion: 'Si los items no traen palabra, aparecen escalonados desde esta.', ejemplo: 'repasemos' }
      },
      ejemplo: { titulo: 'En resumen', items: [{ texto: 'Tres sensores miden distinto el mismo bosque', palabra: 'sensores' }, { texto: 'Huella por huella casi no coinciden', palabra: 'huella' }, { texto: 'Por sitio el acuerdo sube a R² 0,69', palabra: 'sitio' }, { texto: 'El óptico se satura cerca de LAI 3', palabra: 'satura' }], color: '#7CFFB2', palabra_inicio: 'repasemos' },
      narracion_ejemplo: 'Repasemos: tres sensores distintos, poca coincidencia huella por huella, mejor acuerdo por sitio y un óptico que se satura.',
      draw(lt, dur, i, p = {}) {
        const I = V(p, 'items', []).slice(0, 6).map(z => typeof z === 'string' ? { texto: z } : z), n = I.length, col = V(p, 'color', '#7CFFB2'), tit = V(p, 'titulo', '');
        let s = polvo(lt, 101, 26, col, .18);
        if (!n) return svg(s);
        const tI = cu(i, p.palabra_inicio, .08, dur), paso = Math.max(.7, (dur * .8 - tI) / n), T = I.map((z, k) => tk(i, dur, z.palabra, tI + .4, k, paso));
        if (tit) { const e = pop(lt, .1, .5); s += `<g transform="translate(540,190) scale(${f(Math.max(.01, e), 3)})">${txt(0, 0, tit, { fs: 56, peso: 800, anchor: 'middle', color: '#ffffff', max: 900, op: cl(e) })}</g>`; }
        const top = tit ? 240 : 150, bot = 985, gap = 18, ch = Math.min(140, (bot - top - gap * (n - 1)) / n), tot = n * ch + (n - 1) * gap, y0 = top + (bot - top - tot) / 2;
        let act = -1; T.forEach((t, k) => { if (lt >= t) act = k; });
        I.forEach((z, k) => {
          const e = pg(lt, T[k] - .1, T[k] + .45); if (e <= 0) return;
          const y = y0 + k * (ch + gap) + 3 * Math.sin(lt * 1.3 + k), on = k === act, br = Math.min(32, ch * .28), bx = 120 + br + 24, cy = y + ch / 2;
          const B = bloque(z.texto, 960 - (bx + br + 30) - 24, Math.min(38, ch * .34), 2, .54, 22);
          let g = `<rect x="120" y="${f(y)}" width="840" height="${f(ch)}" rx="18" fill="#0d1020" fill-opacity=".8" stroke="${on ? col : '#3a4256'}" stroke-width="${on ? 3.5 : 2}"/>`;
          const ck = pl(lt, T[k] + .3, T[k] + .7);
          g += `<circle cx="${f(bx)}" cy="${f(cy)}" r="${f(br)}" fill="${ck > 0 ? col : '#2a3046'}"/>`;
          if (ck > 0) g += `<path d="M${f(bx - br * .45)} ${f(cy)}L${f(bx - br * .1)} ${f(cy + br * .35)}L${f(bx + br * .5)} ${f(cy - br * .35)}" stroke="#0d1020" stroke-width="${f(br * .22)}" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${f(br * 2)}" stroke-dashoffset="${f(br * 2 * (1 - ck))}"/>`;
          else g += txt(bx, cy + br * .38, String(k + 1), { fs: br * 1.05, anchor: 'middle', peso: 800 });
          const lh = B.fs * 1.18, ty = cy - (B.lines.length - 1) * lh / 2 + B.fs * .36;
          B.lines.forEach((ln, j) => { g += txt(bx + br + 30, ty + j * lh, ln, { fs: B.fs, peso: 700, color: on ? '#ffffff' : '#d5dae6' }); });
          s += `<g transform="translate(${f(-120 * (1 - e))},0)" opacity="${f(e, 2)}">${g}</g>`;
        });
        return svg(s);
      }
    },

    /* ------------------------------------------------------------------ escena_objetos */
    escena_objetos: {
      descripcion: 'Composición libre de 1 a 4 dibujos con rótulos y movimientos simples (entrar, flotar, disparar un haz, girar, caminar, aparecer). Para explicar un instrumento, un experimento o un fenómeno con personajes.',
      params: {
        objetos: { tipo: 'lista', requerido: true, descripcion: 'De 1 a 4 objetos {dibujo, x, y (0 a 1, centro del objeto en el escenario), escala?, rotulo?, movimiento? (entrar, flotar, disparar, girar, caminar, aparecer), palabra?, desde? (izquierda, derecha, arriba, abajo), objetivo? (índice del objeto al que apunta el haz), color_haz?, opciones?}.', ejemplo: [{ dibujo: 'estacion_espacial', x: 0.7, y: 0.14, escala: 0.8, rotulo: 'GEDI', movimiento: 'disparar', palabra: 'dispara', objetivo: 1 }, { dibujo: 'arbol', x: 0.62, y: 0.7, escala: 1.2, rotulo: 'dosel', movimiento: 'aparecer', palabra: 'dosel' }, { dibujo: 'persona', x: 0.22, y: 0.72, escala: 1, rotulo: 'equipo de campo', movimiento: 'caminar', desde: 'izquierda', palabra: 'campo', opciones: { bata: true } }] },
        suelo: { tipo: 'texto', requerido: false, descripcion: 'pasto, agua, mesa o ninguno.', ejemplo: 'pasto' },
        nubes: { tipo: 'booleano', requerido: false, descripcion: 'Nubes que pasan al fondo.', ejemplo: true }
      },
      ejemplo: { objetos: [{ dibujo: 'estacion_espacial', x: 0.7, y: 0.14, escala: 0.8, rotulo: 'GEDI', movimiento: 'disparar', palabra: 'dispara', objetivo: 1 }, { dibujo: 'arbol', x: 0.62, y: 0.7, escala: 1.2, rotulo: 'dosel', movimiento: 'aparecer', palabra: 'dosel' }, { dibujo: 'persona', x: 0.22, y: 0.72, escala: 1, rotulo: 'equipo de campo', movimiento: 'caminar', desde: 'izquierda', palabra: 'campo', opciones: { bata: true } }], suelo: 'pasto', nubes: true },
      narracion_ejemplo: 'Desde la estación, GEDI dispara un pulso hacia el dosel, mientras en campo alguien mide los mismos árboles a mano.',
      draw(lt, dur, i, p = {}) {
        const O = V(p, 'objetos', []).slice(0, 4), suelo = V(p, 'suelo', 'ninguno');
        let s = polvo(lt, 111, 14), fo = '';
        if (V(p, 'nubes', false)) for (let k = 0; k < 3; k++) { const x = ((k * 430 + lt * (14 + k * 6)) % 1400) - 160; fo += DIBUJO.nube(x, 220 + k * 90, .8 - k * .12, lt, { op: .14 }); }
        const GY = 900;
        if (suelo === 'pasto') fo += `<path d="M0 ${GY - 14}Q270 ${GY - 34} 540 ${GY - 16}T1080 ${GY - 20}V1060H0Z" fill="#1c3a2c"/><path d="M0 ${GY + 30}Q300 ${GY + 14} 600 ${GY + 34}T1080 ${GY + 26}V1060H0Z" fill="#163024"/>`;
        else if (suelo === 'agua') { fo += `<rect x="0" y="${GY - 10}" width="1080" height="200" fill="#174a5e"/>`; for (let k = 0; k < 3; k++) { let d = `M0 ${GY - 10 + k * 26}`; for (let x = 0; x <= 1080; x += 40) d += `L${x} ${f(GY - 10 + k * 26 + 6 * Math.sin(x * .02 + lt * 2 + k))}`; fo += `<path d="${d}" stroke="#6cc4ff" stroke-width="3" fill="none" opacity="${.5 - k * .12}"/>`; } }
        else if (suelo === 'mesa') fo += `<rect x="0" y="${GY}" width="1080" height="200" fill="#262a35"/><rect x="0" y="${GY - 14}" width="1080" height="16" fill="#3a4050"/>`;
        if (fo) s += fundido('eof', fo);
        const POS = O.map(o => [60 + cl(+V(o, 'x', .5)) * 960, 140 + cl(+V(o, 'y', .5)) * 760]);
        const TT = O.map((o, k) => cu(i, o.palabra, Math.min(.85, .08 + k * .15), dur));
        const BASE = { arbol: 1, persona: 1 };
        const cur = O.map((o, k) => {
          const [x, y] = POS[k], sc = +V(o, 'escala', 1), mv = V(o, 'movimiento', 'aparecer'), t0 = mv === 'disparar' ? Math.min(.3, TT[k]) : TT[k];
          let px = x, py = y, e = 1, rot = 0, lleg = t0 + .3;
          if (mv === 'entrar' || mv === 'caminar') {
            // entra desde 320 px (no desde fuera del lienzo: en el motor horizontal se vería cortado por el borde del escenario)
            const d = V(o, 'desde', 'izquierda'), u = mv === 'caminar' ? eio(pl(lt, t0 - .2, t0 + 2.2)) : eo((lt - t0) / 1.1);
            const sx = d === 'derecha' ? x + 320 : d === 'izquierda' ? x - 320 : x, sy = d === 'arriba' ? y - 260 : d === 'abajo' ? y + 260 : y;
            px = lerp(sx, x, u); py = lerp(sy, y, u); e = cl(u * 3);
            lleg = mv === 'caminar' ? t0 + 1.9 : t0 + .8;
          } else e = pop(lt, t0, .5);
          if (mv === 'flotar' || mv === 'disparar' || mv === 'entrar') py += 9 * Math.sin(lt * 1.3 + k);
          if (mv === 'girar' && o.dibujo !== 'globo' && o.dibujo !== 'engranaje') rot = (lt - t0) * 40;  // globo y engranaje ya giran por dentro
          return { px, py, e, rot, sc, mv, lleg, x, y };
        });
        // haces primero, debajo de los objetos
        O.forEach((o, k) => {
          const c = cur[k]; if (c.mv !== 'disparar' || c.e <= .01) return;
          const hb = pg(lt, TT[k], TT[k] + .6); if (hb <= 0) return;
          let tx = c.px, ty = GY - 10;
          const ob = V(o, 'objetivo', null);
          if (ob != null && cur[ob]) { tx = cur[ob].px; ty = cur[ob].py - (BASE[O[ob].dibujo] ? 60 * cur[ob].sc : 0); }
          s += DIBUJO.laser(c.px, c.py + 30 * c.sc, 1, lt, { hasta: [tx, ty], progreso: hb, color: V(o, 'color_haz', '#7CFFB2'), ancho: 40 });
        });
        O.forEach((o, k) => {
          const c = cur[k]; if (c.e <= .01) return;
          const op = Object.assign({}, V(o, 'opciones', {}));
          if (c.mv === 'caminar' && o.dibujo === 'persona') op.pose = pl(lt, TT[k] - .2, TT[k] + 2.2) < 1 ? 'camina' : (op.pose || 'parado');
          const desliza = c.mv === 'entrar' || c.mv === 'caminar';
          let g = obj(o.dibujo, c.px, c.py, c.sc * (desliza ? 1 : c.e), lt + k, op);
          if (c.rot) g = `<g transform="rotate(${f(c.rot)} ${f(c.px)} ${f(c.py)})">${g}</g>`;
          s += desliza ? `<g opacity="${f(c.e, 2)}">${g}</g>` : g;
          // el rótulo va en la posición final y aparece cuando el objeto ya llegó
          if (o.rotulo) { const yb = c.y + 120 * c.sc + 16, yl = yb > 975 ? c.y - 120 * c.sc - 20 : yb; s += tag(cl(c.x, 160, 920), yl, o.rotulo, { fs: 26, color: PAL[k % PAL.length], op: pg(lt, c.lleg, c.lleg + .5), max: 420 }); }
        });
        return svg(s);
      }
    }
  };
})();

if (typeof module !== 'undefined') module.exports = { DIBUJO, FONDOS, PLANTILLAS };
