// Escenas animadas: Dubayah et al. (2020), GEDI. Nueve escenas, una por frase del guion.
// Todo depende de lt (segundos locales), de H.at (palabras de la voz) y de dur. Sin estado.

/* ---------- ayudas comunes ---------- */
const G = (() => {
  const F = (x, d = 1) => (+x).toFixed(d);
  const at = (i, w, n, fb) => { const v = H.at(i, w, n || 1); return v > 0 ? v : fb; };
  const bo = x => { x = H.clamp(x); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const pop = (lt, t, d = 0.4) => (lt < t ? 0 : bo((lt - t) / d));
  // grupo que aparece con rebote alrededor de (x,y)
  const pg = (s, x, y, cont) => s <= 0.001 ? '' :
    `<g transform="translate(${F(x)} ${F(y)}) scale(${F(s, 3)}) translate(${F(-x)} ${F(-y)})" opacity="${F(Math.min(1, s * 1.6), 2)}">${cont}</g>`;
  // etiqueta monoespaciada sobre recuadro oscuro
  function lab(x, y, txt, o = {}) {
    const op = o.op == null ? 1 : o.op; if (op <= 0.01) return '';
    const fs = o.fs || 24, w = [...txt].length * fs * 0.6 + 28, h = fs + 18;
    const x0 = o.anc === 's' ? x : o.anc === 'e' ? x - w : x - w / 2;
    const t = txt.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<g opacity="${F(op, 2)}"><rect x="${F(x0)}" y="${F(y - h / 2)}" width="${F(w)}" height="${h}" rx="7" fill="${o.bg || '#0d1020'}" fill-opacity="${o.bgop || 0.92}"${o.bd ? ` stroke="${o.bd}" stroke-width="2.5"` : ''}/>` +
      `<text x="${F(x0 + w / 2)}" y="${F(y + fs * 0.36)}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="700" font-size="${fs}" fill="${o.col || '#e9ecf3'}">${t}</text></g>`;
  }
  // etiqueta que entra con rebote en el instante t
  const lp = (lt, t, x, y, txt, o = {}) => pg(pop(lt, t), x, y, lab(x, y, txt, o));
  // Estación Espacial con el módulo GEDI (verde) abajo
  function iss(x, y, s, rot = 0) {
    let p = '';
    for (const px of [-112, -84, 62, 90]) {
      p += `<rect x="${px}" y="-60" width="22" height="50" fill="#4c63c9" stroke="#9fb2ff" stroke-width="2"/><rect x="${px}" y="10" width="22" height="50" fill="#4c63c9" stroke="#9fb2ff" stroke-width="2"/>` +
        `<line x1="${px}" y1="-35" x2="${px + 22}" y2="-35" stroke="#9fb2ff" stroke-width="1.5"/><line x1="${px}" y1="35" x2="${px + 22}" y2="35" stroke="#9fb2ff" stroke-width="1.5"/>`;
    }
    return `<g transform="translate(${F(x)} ${F(y)}) rotate(${F(rot)}) scale(${F(s, 3)})"><rect x="-118" y="-5" width="236" height="10" rx="3" fill="#aeb8c9"/>${p}` +
      `<rect x="-40" y="-13" width="80" height="26" rx="12" fill="#e3e8f1"/><rect x="-12" y="-27" width="24" height="54" rx="9" fill="#c9d1e0"/>` +
      `<rect x="-50" y="14" width="16" height="30" fill="#f1f3f8" opacity=".85"/><rect x="34" y="14" width="16" height="30" fill="#f1f3f8" opacity=".85"/>` +
      `<rect x="-8" y="26" width="16" height="10" rx="2" fill="#7CFFB2"/></g>`;
  }
  // árbol de perfil (base en x,y)
  function arbol(x, y, h, c1 = '#2f8a4c', c2 = '#256e3d') {
    return `<g transform="translate(${F(x)} ${F(y)})"><rect x="${F(-h * 0.05)}" y="${F(-h * 0.55)}" width="${F(h * 0.1)}" height="${F(h * 0.55)}" fill="#5a3d2b"/>` +
      `<circle cx="${F(-h * 0.17)}" cy="${F(-h * 0.5)}" r="${F(h * 0.24)}" fill="${c2}"/><circle cx="${F(h * 0.19)}" cy="${F(-h * 0.52)}" r="${F(h * 0.23)}" fill="${c2}"/>` +
      `<circle cx="0" cy="${F(-h * 0.7)}" r="${F(h * 0.3)}" fill="${c1}"/></g>`;
  }
  return { F, at, bo, pop, pg, lab, lp, iss, arbol };
})();

/* ---------- datos precalculados ---------- */
// Escena 0: textura de la Tierra en coordenadas de una esfera de radio 300, periodo horizontal 1200
const _S0 = (() => {
  const land = `<path d="M-560 -230 C-500 -270 -420 -250 -400 -200 C-380 -150 -430 -120 -440 -80 C-420 -40 -380 -20 -360 30 C-340 90 -380 160 -420 230 C-440 260 -470 240 -470 200 C-480 130 -500 80 -500 30 C-520 -20 -560 -60 -580 -120 C-600 -170 -590 -210 -560 -230 Z" fill="#3f9b5b"/>` +
    `<path d="M-120 -250 C-60 -270 20 -250 40 -210 C60 -170 20 -150 10 -120 C60 -110 100 -60 90 0 C80 60 40 120 10 180 C-10 220 -40 220 -50 180 C-60 120 -70 60 -100 20 C-150 -10 -170 -60 -150 -110 C-140 -160 -170 -220 -120 -250 Z" fill="#3f9b5b"/>` +
    `<path d="M140 -260 C230 -290 360 -270 420 -220 C470 -180 450 -120 400 -100 C350 -80 330 -40 290 -30 C250 -20 220 -60 180 -80 C140 -100 110 -150 120 -200 Z" fill="#3f9b5b"/>` +
    `<path d="M330 90 C380 70 450 90 460 140 C470 180 420 200 370 190 C330 180 300 120 330 90 Z" fill="#8f9a4e"/>` +
    `<path d="M-90 -40 C-50 -60 10 -40 30 0 C10 40 -40 50 -80 20 Z" fill="#2f7d4a"/><path d="M-470 -20 C-440 -40 -400 -10 -400 40 C-420 80 -460 60 -470 20 Z" fill="#2f7d4a"/>` +
    `<ellipse cx="0" cy="-300" rx="700" ry="40" fill="#e8eef7" opacity=".85"/><ellipse cx="0" cy="300" rx="700" ry="40" fill="#e8eef7" opacity=".85"/>`;
  const trees = [[-460, -150], [-430, 40], [-470, 150], [-80, -30], [-30, 60], [20, 120], [-110, -180], [300, -120], [390, 140], [200, -90], [-440, -60], [-10, -10]];
  const r = H.rnd(21); const horiz = [];
  for (let j = 0; j < 30; j++) horiz.push({ b: j / 30, h: 48 + r() * 52, c: r() < 0.5 ? '#2f8a4c' : '#3c9c58' });
  return { land, trees, horiz };
})();

// Escena 1: mapa de la franja tropical (lon -95..155, lat 32..-32)
const _S1 = (() => {
  const X = lon => 70 + (lon + 95) * 3.76, Y = lat => 460 - lat * 5;
  const polys = [
    [[-77, 8], [-72, 12], [-62, 10.5], [-52, 5], [-35, -5], [-39, -15], [-41, -22], [-48, -26], [-53, -34], [-58, -38], [-65, -40], [-71, -40], [-73, -30], [-70, -18], [-76, -14], [-81, -5], [-80, 0]],
    [[-97, 32], [-97, 26], [-90, 21], [-87, 21], [-88, 16], [-83, 10], [-77, 8], [-80, 9], [-86, 12], [-92, 15], [-105, 20], [-112, 30], [-115, 32]],
    [[-17, 21], [-16, 14], [-12, 8], [-5, 5], [5, 6], [9, 4], [10, -2], [13, -12], [12, -17], [15, -27], [18, -34], [25, -34], [33, -26], [40, -16], [40, -10], [39, -4], [44, 0], [51, 11], [43, 12], [37, 22], [33, 31], [20, 32], [10, 33], [0, 33], [-10, 30]],
    [[35, 32], [43, 13], [52, 16], [59, 22], [55, 26], [50, 30]],
    [[68, 24], [73, 19], [77, 8], [80, 13], [87, 21], [92, 22], [90, 28], [75, 32]],
    [[92, 22], [98, 16], [99, 8], [103, 1], [104, 10], [109, 12], [108, 21], [120, 23], [122, 32], [100, 32]],
    [[95, 5], [106, -6], [103, -5], [96, 2]], [[109, 1], [117, 7], [119, 1], [116, -4], [110, -3]],
    [[131, -1], [141, -3], [150, -10], [141, -9], [132, -4]], [[44, -25], [47, -25], [50, -15], [49, -12], [44, -17]],
    [[113, -22], [122, -17], [130, -12], [137, -12], [142, -11], [146, -19], [153, -28], [155, -34], [113, -34]]
  ];
  const d = polys.map(p => 'M' + p.map(q => X(q[0]).toFixed(1) + ' ' + Y(q[1]).toFixed(1)).join('L') + 'Z');
  const inside = (x, y, p) => { let c = false; for (let a = 0, b = p.length - 1; a < p.length; b = a++) { const [xa, ya] = p[a], [xb, yb] = p[b]; if ((ya > y) !== (yb > y) && x < (xb - xa) * (y - ya) / (yb - ya) + xa) c = !c; } return c; };
  const r = H.rnd(11), pts = []; let g = 0;
  while (pts.length < 150 && g++ < 30000) { const lon = -95 + r() * 250, lat = -30 + r() * 60; if (polys.some(p => inside(lon, lat, p))) pts.push([X(lon), Y(lat)]); }
  const r2 = H.rnd(5), crowns = [];
  for (let k = 0; k < 46; k++) crowns.push([(r2() - 0.5) * 340, (r2() - 0.5) * 340, 16 + r2() * 14, r2() < 0.5 ? '#2c7a45' : '#3a9254']);
  return { d, pts, crowns, Y };
})();

// Escena 3: copas vistas desde arriba (periodo vertical 1300)
const _S3 = (() => {
  const r = H.rnd(33), c = [];
  for (let k = 0; k < 64; k++) c.push([r() * 1080, r() * 1300, 34 + r() * 30, ['#1f5e37', '#277043', '#2f8a4c', '#1b5231'][Math.floor(r() * 4)]]);
  return c;
})();

// Escena 4: forma de onda esquemática (energía frente a altura), sin unidades
const _S4 = (() => {
  const gs = [[290, 0.5, 30], [360, 0.85, 40], [450, 0.6, 45], [530, 0.3, 30], [820, 0.18, 15], [880, 1.1, 11]];
  const E = y => gs.reduce((s, g) => s + g[1] * Math.exp(-0.5 * ((y - g[0]) / g[2]) ** 2), 0);
  const ys = [], es = []; for (let y = 190; y <= 905; y += 5) { ys.push(y); es.push(E(y)); }
  const emax = Math.max(...es);
  const cum = new Array(ys.length).fill(0); // energía acumulada desde abajo
  let tot = 0; for (let k = ys.length - 1; k >= 0; k--) { tot += es[k]; cum[k] = tot; }
  for (let k = 0; k < cum.length; k++) cum[k] /= tot;
  const yAt = f => { for (let k = ys.length - 1; k >= 0; k--) if (cum[k] >= f) return ys[k]; return ys[0]; };
  let yTop = ys[0]; for (let k = 0; k < ys.length; k++) if (es[k] / emax > 0.03) { yTop = ys[k]; break; }
  return { ys, es, emax, cum, yAt, yTop, yRh: yAt(0.98) };
})();

// Escena 6: continentes aproximados (lat, lon)
const _S6 = [
  [[65, -165], [70, -140], [72, -110], [70, -80], [58, -62], [50, -56], [43, -70], [35, -76], [26, -81], [29, -90], [26, -97], [20, -97], [16, -90], [9, -83], [8, -80], [15, -92], [20, -105], [30, -115], [40, -124], [49, -125], [58, -135], [60, -150], [62, -165]],
  [[8, -77], [12, -72], [10.5, -62], [5, -52], [-5, -35], [-15, -39], [-22, -41], [-26, -48], [-34, -53], [-38, -58], [-42, -65], [-52, -68], [-55, -70], [-50, -74], [-40, -73], [-30, -71], [-18, -70], [-14, -76], [-5, -81], [0, -80]],
  [[21, -17], [14, -16], [8, -12], [5, -5], [6, 5], [4, 9], [-2, 10], [-12, 13], [-17, 12], [-27, 15], [-34, 18], [-34, 25], [-26, 33], [-16, 40], [-10, 40], [-4, 39], [0, 44], [11, 51], [12, 43], [22, 37], [31, 33], [32, 20], [33, 10], [37, 10], [36, -6], [30, -10]],
  [[36, -10], [43, -9], [48, -2], [52, 5], [58, 10], [60, 20], [70, 25], [68, 40], [70, 60], [73, 80], [77, 100], [72, 130], [70, 160], [66, 180], [60, 170], [58, 160], [52, 142], [44, 140], [42, 130], [32, 122], [23, 120], [21, 108], [12, 109], [10, 104], [1, 103], [8, 99], [16, 98], [22, 92], [21, 87], [13, 80], [8, 77], [19, 73], [24, 68], [22, 59], [16, 52], [13, 43], [32, 35], [37, 28], [40, 22], [40, 15], [44, 10], [43, 3], [36, -5]],
  [[-22, 113], [-17, 122], [-12, 130], [-12, 137], [-11, 142], [-19, 146], [-28, 153], [-37, 150], [-38, 140], [-32, 132], [-34, 124], [-34, 115]],
  [[60, -55], [60, -45], [70, -20], [80, -20], [82, -60], [78, -72], [70, -60]],
  [[1, 109], [7, 117], [1, 119], [-4, 116], [-3, 110]], [[5, 95], [-6, 106], [-5, 103], [2, 96]], [[-1, 131], [-3, 141], [-10, 150], [-9, 141], [-4, 132]]
];

// Escena 7: cuadrícula de 8 x 8 celdas de 1 km y trazas diagonales de huellas
const _S7 = (() => {
  const N = 8, C = 88, X0 = 188, Y0 = 150, dx = 0.42;
  const starts = [40, 180, 320, 460, 600, 740, 880]; // 51 de 64 celdas con huellas, cerca del 80 %
  const lines = starts.map(x => { const p = []; for (let y = Y0 - 10; y <= Y0 + N * C + 10; y += 24) p.push([x + (y - Y0) * dx, y]); return p.filter(q => q[0] > X0 - 8 && q[0] < X0 + N * C + 8); });
  const hitLine = new Array(N * N).fill(-1), hitPos = new Array(N * N).fill(2);
  lines.forEach((ln, li) => ln.forEach((q, k) => {
    const cx = Math.floor((q[0] - X0) / C), cy = Math.floor((q[1] - Y0) / C);
    if (cx < 0 || cy < 0 || cx >= N || cy >= N) return;
    const id = cy * N + cx, f = k / Math.max(1, ln.length - 1);
    if (hitLine[id] < 0 || li < hitLine[id] || (li === hitLine[id] && f < hitPos[id])) { hitLine[id] = li; hitPos[id] = f; }
  }));
  const empty = []; for (let id = 0; id < N * N; id++) if (hitLine[id] < 0) empty.push(id);
  const near = empty.map(id => { const ex = id % N, ey = Math.floor(id / N); let best = -1, bd = 1e9; for (let j = 0; j < N * N; j++) if (hitLine[j] >= 0) { const d = (j % N - ex) ** 2 + (Math.floor(j / N) - ey) ** 2; if (d < bd) { bd = d; best = j; } } return best; });
  const r = H.rnd(77), shade = []; for (let k = 0; k < N * N; k++) shade.push(r());
  const pix = []; for (let k = 0; k < N * N * 9; k++) pix.push(r());
  return { N, C, X0, Y0, lines, hitLine, hitPos, empty, near, shade, pix };
})();

// Escena 8: huellas sobre la Ciénaga Grande (esquema, no es el mapa real)
const _S8 = (() => {
  const pts = []; const r = H.rnd(91);
  for (let x0 = -330; x0 < 1100; x0 += 92) for (let y = 270; y <= 820; y += 15) { const x = x0 + (y - 270) * 0.42 + (r() - 0.5) * 3; if (x > 60 && x < 1020) pts.push([x, y]); }
  return pts;
})();

/* ---------- escenas ---------- */
const ESCENAS = [

/* 0 · La pregunta y el láser en la Estación Espacial */
{
  bg: 'linear-gradient(180deg,#121830,#232b4f)',
  hud: { cap: 'Un láser en órbita', datos: ['GEDI va en la ISS', 'desde dic. de 2018'] },
  claves: ['láser', 'gedi', 'bosques'],
  draw(lt, dur, i) {
    const F = G.F;
    const tBos = G.at(i, 'bosques', 1, 1.2), tPla = G.at(i, 'planeta', 1, 2), tLas = G.at(i, 'láser', 1, 3), tEst = G.at(i, 'Estación', 1, 4), tGedi = G.at(i, 'GEDI', 1, 5);
    const z = H.eio(H.pl(lt, tLas - 0.4, tLas + 1.1));
    const cx = 540, cy = H.lerp(600, 1720, z), r = H.lerp(270, 1170, z), k = r / 300;
    const s = (lt * 34) % 1200;
    let trees = '';
    _S0.trees.forEach((p, j) => {
      const q = G.bo(H.pl(lt, tBos + j * 0.05, tBos + j * 0.05 + 0.4));
      if (q > 0) trees += `<g transform="translate(${p[0]} ${p[1]}) scale(${F(q, 2)})"><path d="M0 -30 L15 0 H-15 Z" fill="#1f6b3a"/><path d="M0 -44 L12 -16 H-12 Z" fill="#2f8a4c"/><rect x="-2.5" y="0" width="5" height="8" fill="#6b4a32"/></g>`;
    });
    const tex = _S0.land + trees;
    const globe = `<g transform="translate(${cx} ${F(cy)}) scale(${F(k, 4)})"><circle r="300" fill="url(#s0o)"/><g clip-path="url(#s0c)"><g transform="translate(${F(-s)} 0)">${tex}</g><g transform="translate(${F(1200 - s)} 0)">${tex}</g></g>` +
      `<circle r="300" fill="url(#s0sh)"/><circle r="306" fill="none" stroke="#7cc4ff" stroke-opacity=".3" stroke-width="7" vector-effect="non-scaling-stroke"/></g>`;
    // superficie con bosque cuando se acerca la cámara
    let horiz = '';
    const zh = H.clamp((z - 0.55) / 0.4);
    if (zh > 0.01) {
      horiz += `<circle cx="${cx}" cy="${F(cy)}" r="${F(r)}" fill="url(#s0g)" opacity="${F(zh, 2)}"/>`;
      _S0.horiz.forEach(t => {
        let th = ((t.b - lt * 0.035) % 1 + 1) % 1; th = (th - 0.5) * 1.15;
        const x = cx + r * Math.sin(th), y = cy - r * Math.cos(th);
        horiz += `<g transform="translate(${F(x)} ${F(y)}) rotate(${F(th * 57.3)})" opacity="${F(zh, 2)}">${G.arbol(0, 4, t.h, t.c, '#256e3d')}</g>`;
      });
    }
    // anillo "todo el planeta"
    let ring = '';
    const qp = H.pl(lt, tPla, tPla + 1.3);
    if (qp > 0 && qp < 1 && z < 0.4) ring = `<circle cx="${cx}" cy="${F(cy)}" r="${F(r + 10 + 90 * qp)}" fill="none" stroke="#ffd166" stroke-width="5" opacity="${F((1 - qp) * 0.8, 2)}"/>`;
    // la Estación: en órbita y luego arriba, grande
    const a = lt * 0.45 + 0.6;
    const ox = 540 + 400 * Math.cos(a), oy = 600 + 105 * Math.sin(a);
    const ix = H.lerp(ox, 540, z), iy = H.lerp(oy, 240, z) + Math.sin(lt * 1.4) * 6 * z, isc = H.lerp(0.42, 1.1, z);
    const front = Math.sin(a) > 0 || z > 0.25;
    const issG = G.iss(ix, iy, isc, -10 * (1 - z) + Math.sin(lt * 0.9) * 2);
    // haz láser
    const hb = H.p(lt, tLas, tLas + 0.5);
    let beam = '';
    if (hb > 0.01) {
      const bx = ix, by = iy + 36 * isc, gx = 540, gy = cy - r + 4;
      beam += `<polygon points="${F(bx - 4)},${F(by)} ${F(bx + 4)},${F(by)} ${F(gx + 40)},${F(gy)} ${F(gx - 40)},${F(gy)}" fill="url(#s0b)" opacity="${F(hb, 2)}"/>`;
      beam += `<line x1="${F(bx)}" y1="${F(by)}" x2="${gx}" y2="${F(gy)}" stroke="#7CFFB2" stroke-width="3" opacity="${F(hb, 2)}"/>`;
      for (let q = 0; q < 4; q++) { const u = (lt * 1.5 + q / 4) % 1; beam += `<circle cx="${F(H.lerp(bx, gx, u))}" cy="${F(H.lerp(by, gy, u))}" r="6" fill="#d9ffe9" opacity="${F(hb * (1 - u * 0.5), 2)}"/>`; }
      if (z > 0.6) {
        beam += `<ellipse cx="${gx}" cy="${F(gy)}" rx="44" ry="12" fill="#7CFFB2" fill-opacity=".3" stroke="#7CFFB2" stroke-width="3" opacity="${F(hb, 2)}"/>`;
        for (let q = 0; q < 2; q++) { const u = (lt * 1.1 + q * 0.5) % 1; beam += `<ellipse cx="${gx}" cy="${F(gy)}" rx="${F(44 + 90 * u)}" ry="${F(12 + 22 * u)}" fill="none" stroke="#7CFFB2" stroke-width="3" opacity="${F((1 - u) * 0.6 * hb, 2)}"/>`; }
      }
    }
    const labs = G.lp(lt, tEst, ix, iy - 105 * isc, 'Estación Espacial', { fs: 26 }) +
      G.lp(lt, tLas + 0.6, 760, 400, 'pulso láser', { col: '#7CFFB2' }) +
      G.lp(lt, tGedi, ix + 230, iy + 50, 'GEDI', { fs: 34, col: '#7CFFB2', bd: '#7CFFB2' });
    return `<svg viewBox="0 0 1080 1060" xmlns="http://www.w3.org/2000/svg"><defs>
      <radialGradient id="s0o" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#4f8fdb"/><stop offset="1" stop-color="#1b3f7a"/></radialGradient>
      <radialGradient id="s0sh" cx="38%" cy="30%" r="75%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#050a1a" stop-opacity=".6"/></radialGradient>
      <clipPath id="s0c"><circle r="300"/></clipPath>
      <linearGradient id="s0g" gradientUnits="userSpaceOnUse" x1="0" y1="${F(cy - r)}" x2="0" y2="${F(cy - r + 420)}"><stop offset="0" stop-color="#3a8a4f"/><stop offset="1" stop-color="#13301f"/></linearGradient>
      <linearGradient id="s0b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7CFFB2" stop-opacity=".75"/><stop offset="1" stop-color="#7CFFB2" stop-opacity=".12"/></linearGradient>
      <linearGradient id="s0fg" gradientUnits="userSpaceOnUse" x1="0" y1="860" x2="0" y2="1055"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
      <mask id="s0f"><rect width="1080" height="1060" fill="url(#s0fg)"/></mask>
    </defs>${front ? '' : issG}<g mask="url(#s0f)">${globe}${ring}${horiz}</g>${beam}${front ? issG : ''}${labs}</svg>`;
  }
},

/* 1 · El vacío: pocos disparos de ICESat sobre los trópicos */
{
  bg: 'linear-gradient(180deg,#4a2f2a,#6b4337)',
  estrellas: false,
  hud: { cap: 'El vacío', datos: ['ICESat: ≈ 5 M y 3 M', 'disparos en trópicos'] },
  claves: ['icesat', 'pocos', 'biomasa', 'detalle'],
  draw(lt, dur, i) {
    const F = G.F;
    const tMap = G.at(i, 'mapas', 1, 0.6), tCin = G.at(i, 'cinco', 1, 1.6), tTre = G.at(i, 'tres', 1, 2.4), tIce = G.at(i, 'ICESat', 1, 3.2), tPoc = G.at(i, 'pocos', 1, 4), tDet = G.at(i, 'detalle', 1, 4.8);
    const pA = H.p(lt, tMap - 0.2, tCin + 0.5), pB = H.p(lt, tTre - 0.1, tIce + 0.4);
    const pL = G.bo(H.pl(lt, tPoc - 0.35, tPoc + 0.35));
    const map0 = H.p(lt, 0, 0.6);
    let o = `<g opacity="${F(map0, 2)}"><rect x="70" y="300" width="940" height="320" rx="18" fill="#1d3447"/>` +
      `<g clip-path="url(#s1c)">${_S1.d.map(d => `<path d="${d}" fill="#4b8a52" stroke="#6fb174" stroke-width="1.5"/>`).join('')}</g>` +
      `<line x1="70" y1="460" x2="1010" y2="460" stroke="#fff" stroke-opacity=".18" stroke-dasharray="4 8"/>` +
      `<line x1="70" y1="${F(_S1.Y(23.4))}" x2="1010" y2="${F(_S1.Y(23.4))}" stroke="#ffd166" stroke-opacity=".35" stroke-dasharray="10 8"/>` +
      `<line x1="70" y1="${F(_S1.Y(-23.4))}" x2="1010" y2="${F(_S1.Y(-23.4))}" stroke="#ffd166" stroke-opacity=".35" stroke-dasharray="10 8"/>` +
      `<text x="996" y="${F(_S1.Y(23.4) - 10)}" text-anchor="end" font-family="JetBrains Mono" font-size="20" fill="#ffd166" opacity=".7">trópicos</text></g>`;
    // puntos de ICESat
    const nA = 94, nB = 56;
    _S1.pts.forEach((p, k) => {
      let show, col, fr;
      if (k < nA) { fr = pA * nA - k; col = '#ffd166'; } else { fr = pB * nB - (k - nA); col = '#6cc4ff'; }
      show = fr > 0; if (!show) return;
      const big = H.clamp(1 - fr / 6);
      o += `<circle cx="${F(p[0])}" cy="${F(p[1])}" r="${F(4 + 6 * big)}" fill="${col}" opacity="${F(0.95 - 0.3 * big, 2)}"/>`;
    });
    // satélite ICESat pasando
    const sx = 70 + ((lt * 0.3) % 1) * 940, sy = 258;
    o += `<line x1="${F(sx)}" y1="${sy + 10}" x2="${F(sx)}" y2="420" stroke="#ffd166" stroke-width="2" opacity=".55" stroke-dasharray="6 6" stroke-dashoffset="${F(-lt * 30)}"/>` +
      `<g transform="translate(${F(sx)} ${sy})"><rect x="-14" y="-10" width="28" height="20" rx="3" fill="#dfe5ef"/><rect x="-44" y="-6" width="26" height="12" fill="#4c63c9"/><rect x="18" y="-6" width="26" height="12" fill="#4c63c9"/></g>` +
      (sx < 860 ? G.lab(sx + 60, sy - 2, 'ICESat', { fs: 18, anc: 's', op: map0 }) : G.lab(sx - 60, sy - 2, 'ICESat', { fs: 18, anc: 'e', op: map0 }));
    // fichas con contadores
    const card = (x, nom, col, tot, p) => {
      const v = p > 0.995 ? String(tot) : H.num(tot * p, 1);
      return `<rect x="${x}" y="680" width="430" height="175" rx="16" fill="#0d1020" fill-opacity=".6"/><circle cx="${x + 34}" cy="${718}" r="9" fill="${col}"/>` +
        `<text x="${x + 56}" y="727" font-family="Inter" font-weight="700" font-size="26" fill="#e9ecf3">${nom}</text>` +
        `<text x="${x + 28}" y="800" font-family="JetBrains Mono" font-weight="700" font-size="56" fill="${col}">≈ ${v} M</text>` +
        `<text x="${x + 300}" y="798" font-family="Inter" font-size="24" fill="#cfd6e4">disparos</text>` +
        `<rect x="${x + 28}" y="825" width="374" height="9" rx="4" fill="#fff" fill-opacity=".12"/><rect x="${x + 28}" y="825" width="${F(374 * p * tot / 5)}" height="9" rx="4" fill="${col}"/>`;
    };
    o += `<g opacity="${F(H.p(lt, tMap - 0.4, tMap + 0.2), 2)}">${card(90, 'Saatchi 2011', '#ffd166', 5, pA)}</g>`;
    o += `<g opacity="${F(H.p(lt, tTre - 0.4, tTre + 0.2), 2)}">${card(560, 'Baccini 2012', '#6cc4ff', 3, pB)}</g>`;
    // lupa: muy pocos para ver el detalle
    if (pL > 0.001) {
      const LX = 505, LY = 455, R = 165;
      let lens = `<rect x="-200" y="-200" width="400" height="400" fill="#173a26"/>`;
      _S1.crowns.forEach(c => { lens += `<circle cx="${F(c[0])}" cy="${F(c[1] + Math.sin(lt * 1.5 + c[0]) * 2)}" r="${F(c[2])}" fill="${c[3]}"/>`; });
      const dz = H.p(lt, tDet - 0.2, tDet + 0.4);
      for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) {
        const x = -160 + a * 80, y = -160 + b * 80;
        const lleno = a === 1 && b === 2;
        lens += `<rect x="${x + 3}" y="${y + 3}" width="74" height="74" fill="none" stroke="${lleno ? '#ffd166' : '#ff5a5f'}" stroke-width="3" stroke-dasharray="${lleno ? '0' : '8 6'}" opacity="${F(dz * (lleno ? 0.9 : 0.5 + 0.4 * Math.sin(lt * 6)), 2)}"/>`;
      }
      lens += `<circle cx="-40" cy="40" r="9" fill="#ffd166"/><circle cx="-40" cy="40" r="${F(9 + 14 * ((lt * 1.2) % 1))}" fill="none" stroke="#ffd166" stroke-width="2" opacity="${F(1 - (lt * 1.2) % 1, 2)}"/>`;
      o += `<rect x="70" y="300" width="940" height="320" rx="18" fill="#000" opacity="${F(0.4 * H.clamp(pL), 2)}"/>`;
      o += `<g transform="translate(${LX} ${LY}) scale(${F(pL, 3)})"><g clip-path="url(#s1l)">${lens}</g><circle r="${R}" fill="none" stroke="#e9ecf3" stroke-width="12"/>` +
        `<line x1="${F(R * 0.72)}" y1="${F(R * 0.72)}" x2="${F(R * 0.72 + 95)}" y2="${F(R * 0.72 + 95)}" stroke="#e9ecf3" stroke-width="22" stroke-linecap="round"/></g>`;
      o += G.lp(lt, tPoc, LX + 330, LY + 10, 'muy pocos', { fs: 28, col: '#ff5a5f', bd: '#ff5a5f' });
      o += G.lp(lt, tDet, LX + 330, LY + 75, 'escala < 10 km', { fs: 24, col: '#ffd166' });
    }
    return `<svg viewBox="0 0 1080 1060" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="s1c"><rect x="70" y="300" width="940" height="320" rx="18"/></clipPath><clipPath id="s1l"><circle r="165"/></clipPath></defs>${o}</svg>`;
  }
},

/* 2 · Tres láseres, cuatro haces, ocho trazas */
{
  bg: 'linear-gradient(180deg,#10182c,#1c2a47)',
  hud: { cap: '3 láseres, 8 trazas', datos: ['franja de 4,2 km', '600 m entre trazas'] },
  claves: ['láseres', 'cobertura', 'potencia', 'trazas'],
  draw(lt, dur, i) {
    const F = G.F;
    const tLas = G.at(i, 'láseres', 1, 1.0), tDiv = G.at(i, 'divide', 1, 1.8), tCob = G.at(i, 'cobertura', 1, 2.4), tPot = G.at(i, 'potencia', 1, 3.0),
      tMov = G.at(i, 'Moviéndose', 1, 4.0), tOch = G.at(i, 'ocho', 1, 5.0), tKm = G.at(i, '4,2', 1, 5.8);
    const Y = v => 500 + 390 * v, HW = v => 290 + 200 * v, TX = (k, v) => 540 + ((k - 3.5) / 3.5) * HW(v) * 0.9;
    const vH = 0.05, dt = 0.16, sp = 0.13;
    let o = `<polygon points="230,500 850,500 1040,890 40,890" fill="url(#s2g)"/>`;
    // textura del suelo en movimiento (el suelo pasa bajo la Estación)
    for (let j = 0; j < 10; j++) { const v = ((j / 10) + lt * sp) % 1; o += `<line x1="${F(540 - HW(v) - 10)}" y1="${F(Y(v))}" x2="${F(540 + HW(v) + 10)}" y2="${F(Y(v))}" stroke="#fff" stroke-opacity="${F(0.03 + 0.05 * v, 3)}" stroke-width="2"/>`; }
    const rr = H.rnd(4);
    for (let j = 0; j < 46; j++) { const u = rr() * 2.1 - 1.05, b = rr(), v = (b + lt * sp) % 1; o += `<circle cx="${F(540 + u * HW(v))}" cy="${F(Y(v))}" r="${F(4 + 9 * v)}" fill="#1e5a35" opacity=".8"/>`; }
    // trazas punteadas y numeradas
    const pO = H.p(lt, tOch - 0.2, tOch + 0.5);
    if (pO > 0) for (let k = 0; k < 8; k++) {
      o += `<line x1="${F(TX(k, 0))}" y1="${F(Y(0))}" x2="${F(TX(k, 1))}" y2="${F(Y(1))}" stroke="#e9ecf3" stroke-opacity="${F(0.35 * pO, 2)}" stroke-width="2" stroke-dasharray="10 10"/>`;
      o += G.pg(G.pop(lt, tOch + k * 0.07), TX(k, 1), 918, `<text x="${F(TX(k, 1))}" y="926" text-anchor="middle" font-family="JetBrains Mono" font-weight="700" font-size="24" fill="#e9ecf3">${k + 1}</text>`);
    }
    // huellas: cada haz alterna entre sus dos trazas en disparos sucesivos
    const tipo = b => (b < 2 ? '#8fd3ff' : '#7CFFB2');
    for (let b = 0; b < 4; b++) {
      const off = b * dt * 0.25, nHi = Math.floor((lt - tMov - off) / dt);
      if (nHi < 0) continue;
      const nLo = Math.max(0, Math.ceil((lt - tMov - off - (1 - vH) / sp) / dt));
      for (let n = nLo; n <= nHi; n++) {
        const tc = tMov + off + n * dt, v = vH + sp * (lt - tc), k = 2 * b + (n % 2), rx = 6 + 7 * v, nuevo = H.clamp(1 - (lt - tc) / 0.2);
        o += `<ellipse cx="${F(TX(k, v))}" cy="${F(Y(v))}" rx="${F(rx + 6 * nuevo)}" ry="${F((rx + 6 * nuevo) * 0.5)}" fill="${tipo(b)}" fill-opacity="${F(0.35 + 0.5 * nuevo, 2)}" stroke="${tipo(b)}" stroke-width="2"/>`;
      }
    }
    // instrumento y haces
    const EX = [440, 540, 640], EY = 230;
    const on = [0, 1, 2].map(k => H.p(lt, tLas + 0.18 * k - 0.35, tLas + 0.18 * k));
    const split = H.p(lt, tDiv, tDiv + 0.6), dith = H.p(lt, tMov, tMov + 0.3), potW = H.p(lt, tPot, tPot + 0.5);
    const tgt = b => { const off = b * dt * 0.25; const n = Math.floor((lt - tMov - off) / dt); const par = n >= 0 ? n % 2 : 0.5; return TX(H.lerp(2 * b + 0.5, 2 * b + par, dith), vH); };
    const haz = (x1, y1, x2, col, w, op) => {
      if (op < 0.01) return '';
      let h = `<line x1="${F(x1)}" y1="${F(y1)}" x2="${F(x2)}" y2="${F(Y(vH))}" stroke="${col}" stroke-width="${F(w * 3.2)}" opacity="${F(0.18 * op, 2)}"/><line x1="${F(x1)}" y1="${F(y1)}" x2="${F(x2)}" y2="${F(Y(vH))}" stroke="${col}" stroke-width="${F(w)}" opacity="${F(op, 2)}"/>`;
      const u = (lt * 2.2 + x2 * 0.003) % 1; h += `<circle cx="${F(H.lerp(x1, x2, u))}" cy="${F(H.lerp(y1, Y(vH), u))}" r="${F(w * 1.2)}" fill="#fff" opacity="${F(op * 0.8, 2)}"/>`;
      h += `<ellipse cx="${F(x2)}" cy="${F(Y(vH))}" rx="12" ry="6" fill="${col}" opacity="${F(op * (0.6 + 0.4 * Math.sin(lt * 20)), 2)}"/>`;
      return h;
    };
    // láser 1 (cobertura): un haz que se divide en dos
    const cobMid = TX(1.5, vH);
    if (split < 0.01) o += haz(EX[0], EY + 14, cobMid, '#8fd3ff', 3.5, on[0]);
    else {
      o += `<line x1="${EX[0]}" y1="${EY + 14}" x2="${EX[0]}" y2="300" stroke="#8fd3ff" stroke-width="4" opacity="${F(on[0], 2)}"/>`;
      for (const b of [0, 1]) o += haz(EX[0], 300, H.lerp(cobMid, tgt(b), split), '#8fd3ff', 3.5, on[0]);
      o += `<g transform="translate(${EX[0]} 300) rotate(45) scale(${F(split, 2)})"><rect x="-11" y="-11" width="22" height="22" fill="#e9ecf3"/></g>`;
    }
    o += haz(EX[1], EY + 14, tgt(2), '#7CFFB2', 3.5 + 3 * potW, on[1]);
    o += haz(EX[2], EY + 14, tgt(3), '#7CFFB2', 3.5 + 3 * potW, on[2]);
    o += `<rect x="370" y="122" width="340" height="108" rx="16" fill="#c9d1e0"/><rect x="384" y="136" width="312" height="40" rx="8" fill="#9aa6bb"/>` +
      `<text x="540" y="165" text-anchor="middle" font-family="Inter" font-weight="800" font-size="28" fill="#1a2236">GEDI</text>`;
    EX.forEach((x, k) => {
      const col = k === 0 ? '#8fd3ff' : '#7CFFB2';
      o += `<circle cx="${x}" cy="${EY}" r="17" fill="#1a2236" stroke="${on[k] > 0.5 ? col : '#5b6478'}" stroke-width="4"/><circle cx="${x}" cy="${EY}" r="${F(8 * on[k])}" fill="${col}"/>` +
        `<text x="${x}" y="${EY - 30}" text-anchor="middle" font-family="JetBrains Mono" font-weight="700" font-size="20" fill="#1a2236">${k + 1}</text>`;
    });
    // etiquetas
    o += G.lp(lt, tCob, 250, 360, 'cobertura', { col: '#8fd3ff', bd: '#8fd3ff' });
    o += G.lp(lt, tPot, 860, 360, 'potencia completa', { col: '#7CFFB2', bd: '#7CFFB2' });
    o += G.lp(lt, tLas, 930, 140, '3 láseres', { col: '#ffd166' });
    o += G.lp(lt, tPot + 0.5, 930, 192, '4 haces', { col: '#ffd166' });
    o += G.lp(lt, tOch, 930, 244, '8 trazas', { col: '#ffd166' });
    // cotas
    const pK = H.p(lt, tKm - 0.1, tKm + 0.5);
    if (pK > 0) {
      const x0 = TX(0, 1), x1 = TX(7, 1), xm = 540, w = (x1 - x0) / 2 * pK;
      o += `<g opacity="${F(pK, 2)}"><line x1="${F(xm - w)}" y1="962" x2="${F(xm + w)}" y2="962" stroke="#ffd166" stroke-width="3"/><line x1="${F(xm - w)}" y1="948" x2="${F(xm - w)}" y2="976" stroke="#ffd166" stroke-width="3"/><line x1="${F(xm + w)}" y1="948" x2="${F(xm + w)}" y2="976" stroke="#ffd166" stroke-width="3"/></g>`;
      o += G.lp(lt, tKm, 540, 962, '4,2 km', { fs: 28, col: '#ffd166' });
      const pS = H.p(lt, tKm + 0.5, tKm + 1.0);
      if (pS > 0) {
        const a = TX(3, 0.5), b = TX(4, 0.5), yy = Y(0.5);
        o += `<g opacity="${F(pS, 2)}"><line x1="${F(a)}" y1="${F(yy)}" x2="${F(b)}" y2="${F(yy)}" stroke="#ffd166" stroke-width="3"/><line x1="${F(a)}" y1="${F(yy - 12)}" x2="${F(a)}" y2="${F(yy + 12)}" stroke="#ffd166" stroke-width="3"/><line x1="${F(b)}" y1="${F(yy - 12)}" x2="${F(b)}" y2="${F(yy + 12)}" stroke="#ffd166" stroke-width="3"/></g>`;
        o += G.lp(lt, tKm + 0.5, 540, yy - 36, '600 m', { col: '#ffd166' });
      }
    }
    return `<svg viewBox="0 0 1080 1060" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="s2g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#173a28"/><stop offset="1" stop-color="#2a5c3a"/></linearGradient></defs>${o}</svg>`;
  }
},

/* 3 · Huellas de 25 m separadas 60 m a lo largo de la traza */
{
  bg: 'linear-gradient(180deg,#10241b,#1b3a2c)',
  estrellas: false,
  hud: { cap: 'La huella', datos: ['huella de ~25 m', '60 m entre centros'] },
  claves: ['huella', 'veinticinco', 'sesenta', 'traza'],
  draw(lt, dur, i) {
    const F = G.F;
    const S = 240, V = 300, yF = 250, tau = 0.35;
    const tHu = G.at(i, 'huella', 1, 1.0), tVe = G.at(i, 'veinticinco', 1, 1.6), tTr = G.at(i, 'traza', 1, 2.6), tSe = G.at(i, 'sesenta', 1, 3.2);
    const tF = tVe - 0.2;
    const off = t => { if (t < tF) return V * t; const d = t - tF; return V * tF + 0.1 * V * d + 0.9 * V * tau * (1 - Math.exp(-d / tau)); };
    const oo = off(lt);
    let o = '';
    // copas que pasan por debajo
    _S3.forEach(c => {
      const y = ((c[1] + oo) % 1300 + 1300) % 1300 - 120, sw = 1 + 0.03 * Math.sin(lt * 2 + c[0]);
      o += `<circle cx="${F(c[0])}" cy="${F(y)}" r="${F(c[2] * sw)}" fill="${c[3]}"/><circle cx="${F(c[0] - c[2] * 0.25)}" cy="${F(y - c[2] * 0.25)}" r="${F(c[2] * 0.5)}" fill="#fff" opacity=".07"/>`;
    });
    o += `<rect x="0" y="0" width="1080" height="1060" fill="#0b1a12" opacity=".25"/>`;
    // traza
    o += `<line x1="540" y1="${yF}" x2="540" y2="1060" stroke="#e9ecf3" stroke-opacity=".45" stroke-width="3" stroke-dasharray="14 12" stroke-dashoffset="${F(-oo)}"/>`;
    // huellas ya disparadas
    const jHi = Math.floor(oo / S), jLo = Math.floor((oo - (1060 - yF + 60)) / S);
    for (let j = Math.max(jLo, -50); j <= jHi; j++) {
      const y = yF + oo - j * S, edad = (oo - j * S) / 60;
      o += `<circle cx="540" cy="${F(y)}" r="50" fill="#7CFFB2" fill-opacity="${F(0.2 + 0.4 * Math.exp(-edad), 2)}" stroke="#7CFFB2" stroke-width="4"/>`;
      if (edad < 3) o += `<circle cx="540" cy="${F(y)}" r="${F(50 + edad * 22)}" fill="none" stroke="#7CFFB2" stroke-width="3" opacity="${F(1 - edad / 3, 2)}"/>`;
    }
    // haz y pulso que cae
    const dy = oo - jHi * S, flash = Math.exp(-dy / 50), q = dy / S;
    o += `<line x1="540" y1="0" x2="540" y2="${yF}" stroke="#7CFFB2" stroke-width="${F(3 + 12 * flash)}" opacity="${F(0.25 + 0.7 * flash, 2)}"/>`;
    o += `<rect x="530" y="${F(q * yF - 30)}" width="20" height="40" rx="10" fill="#d9ffe9" opacity="${F(0.9 * (1 - flash), 2)}"/>`;
    // etiquetas ancladas a huellas fijas
    const jA = Math.floor(off(tHu + 0.2) / S), yA = yF + oo - jA * S;
    if (yA < 1000) o += G.lp(lt, tHu, 610, yA - 78, 'huella', { anc: 's', col: '#7CFFB2' });
    const jV = Math.floor(off(tVe + 0.5) / S), yV = yF + oo - jV * S;
    const pV = H.p(lt, tVe, tVe + 0.4);
    if (pV > 0 && yV < 1040) {
      o += `<g opacity="${F(pV, 2)}"><line x1="490" y1="${F(yV)}" x2="590" y2="${F(yV)}" stroke="#ffd166" stroke-width="4"/><line x1="490" y1="${F(yV - 14)}" x2="490" y2="${F(yV + 14)}" stroke="#ffd166" stroke-width="4"/><line x1="590" y1="${F(yV - 14)}" x2="590" y2="${F(yV + 14)}" stroke="#ffd166" stroke-width="4"/></g>`;
      o += G.lp(lt, tVe, 622, yV, '25 m', { fs: 32, anc: 's', col: '#ffd166' });
    }
    const pS = H.p(lt, tSe, tSe + 0.4);
    if (pS > 0) {
      const y1 = yV, y2 = yV + S * pS;
      o += `<line x1="440" y1="${F(y1)}" x2="440" y2="${F(y2)}" stroke="#ffd166" stroke-width="4"/><line x1="426" y1="${F(y1)}" x2="520" y2="${F(y1)}" stroke="#ffd166" stroke-width="2" stroke-dasharray="6 6"/><line x1="426" y1="${F(y2)}" x2="520" y2="${F(y2)}" stroke="#ffd166" stroke-width="2" stroke-dasharray="6 6"/>`;
      o += G.lp(lt, tSe, 420, yV + S / 2, '60 m', { fs: 32, anc: 'e', col: '#ffd166' });
      const pG = H.p(lt, tSe + 0.6, tSe + 1.0);
      if (pG > 0) {
        o += `<g opacity="${F(pG, 2)}"><line x1="650" y1="${F(yV + 50)}" x2="650" y2="${F(yV + S - 50)}" stroke="#ff5a5f" stroke-width="4"/><line x1="638" y1="${F(yV + 50)}" x2="662" y2="${F(yV + 50)}" stroke="#ff5a5f" stroke-width="4"/><line x1="638" y1="${F(yV + S - 50)}" x2="662" y2="${F(yV + S - 50)}" stroke="#ff5a5f" stroke-width="4"/></g>`;
        o += G.lp(lt, tSe + 0.6, 672, yV + S / 2, '35 m sin medir', { fs: 22, anc: 's', col: '#ff8a8d' });
      }
    }
    o += G.lp(lt, tTr, 600, 935, 'traza', { anc: 's', fs: 22 });
    return `<svg viewBox="0 0 1080 1060" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="s3fg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1060"><stop offset="0" stop-color="#000"/><stop offset=".09" stop-color="#fff"/><stop offset=".88" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient><mask id="s3f"><rect width="1080" height="1060" fill="url(#s3fg)"/></mask></defs><g mask="url(#s3f)">${o}</g></svg>`;
  }
},

/* 4 · La forma de onda completa: suelo, altura y rh98 */
{
  bg: 'linear-gradient(180deg,#262b36,#3a4252)',
  estrellas: false,
  hud: { cap: 'Forma de onda', datos: ['L2A: suelo, altura, RH', 'RH: desde el suelo'] },
  claves: ['onda', 'suelo', 'dosel', 'rh98', 'energía'],
  draw(lt, dur, i) {
    const F = G.F, D = _S4;
    const tOnd = G.at(i, 'onda', 1, 0.8), tSu1 = G.at(i, 'suelo', 1, 3), tSu2 = G.at(i, 'suelo', 2, tSu1 + 1.5), tAlt = G.at(i, 'altura', 1, tSu2 + 0.6), tRh = G.at(i, 'rh98', 1, tAlt + 1.2);
    const tA = 0.4, tB = Math.max(tA + 2.2, tSu1 + 0.1);
    const yP = H.lerp(150, 890, H.pl(lt, tA, tB));
    const GX = 610, GW = 380, ex = e => GX + GW * e / D.emax;
    let o = '';
    // suelo y árbol
    o += `<rect x="40" y="880" width="500" height="70" rx="6" fill="#5b4636"/><rect x="40" y="880" width="500" height="10" fill="#6f5642"/>`;
    o += `<ellipse cx="150" cy="862" rx="60" ry="32" fill="#2a6e3e"/><ellipse cx="430" cy="866" rx="55" ry="26" fill="#2a6e3e"/>`;
    const sw = Math.sin(lt * 1.2) * 4;
    o += `<g transform="translate(${F(sw * 0.5)} 0)"><path d="M276 880 L284 480 L300 480 L310 880 Z" fill="#5a3d2b"/><path d="M290 560 L230 470 M296 600 L360 500" stroke="#5a3d2b" stroke-width="12" stroke-linecap="round"/>` +
      `<circle cx="220" cy="470" r="70" fill="#256e3d"/><circle cx="370" cy="470" r="70" fill="#256e3d"/><circle cx="215" cy="370" r="72" fill="#2f8a4c"/><circle cx="370" cy="370" r="72" fill="#2f8a4c"/>` +
      `<circle cx="292" cy="410" r="85" fill="#2f8a4c"/><circle cx="292" cy="${F(D.yTop + 52)}" r="55" fill="#3c9c58"/><circle cx="292" cy="330" r="62" fill="#3c9c58"/></g>`;
    // ejes de la gráfica (sin números)
    o += `<line x1="${GX}" y1="905" x2="${GX}" y2="170" stroke="#cfd6e4" stroke-width="3"/><path d="M${GX - 9} 182 L${GX} 164 L${GX + 9} 182 Z" fill="#cfd6e4"/>` +
      `<line x1="${GX}" y1="905" x2="1030" y2="905" stroke="#cfd6e4" stroke-width="3"/><path d="M1020 896 L1038 905 L1020 914 Z" fill="#cfd6e4"/>` +
      `<text x="${GX - 14}" y="540" transform="rotate(-90 ${GX - 14} 540)" text-anchor="middle" font-family="JetBrains Mono" font-size="22" fill="#cfd6e4">altura</text>` +
      `<text x="820" y="942" text-anchor="middle" font-family="JetBrains Mono" font-size="22" fill="#cfd6e4">energía que vuelve</text>`;
    // curva trazada hasta donde va el pulso
    let pts = `${GX},${D.ys[0]}`, n = 0;
    for (let k = 0; k < D.ys.length; k++) { if (D.ys[k] > yP) break; pts += ` ${F(ex(D.es[k]))},${D.ys[k]}`; n = k; }
    o += `<polygon points="${pts} ${GX},${D.ys[n]}" fill="#7CFFB2" fill-opacity=".14"/><polyline points="${pts}" fill="none" stroke="#7CFFB2" stroke-width="4" stroke-linejoin="round"/>`;
    // energía acumulada desde abajo hasta rh98
    const qR = H.p(lt, tRh - 0.3, tRh + 0.9);
    if (qR > 0) {
      const yC = D.yAt(0.98 * qR);
      let pc = `${GX},905`;
      for (let k = D.ys.length - 1; k >= 0; k--) { if (D.ys[k] < yC) break; pc += ` ${F(ex(D.es[k]))},${D.ys[k]}`; }
      pc += ` ${GX},${yC}`;
      o += `<polygon points="${pc}" fill="#ffd166" fill-opacity=".45"/>`;
      o += G.lab(820, 998, `energía acumulada ${Math.round(98 * qR)} %`, { fs: 22, col: '#ffd166', op: H.clamp(qR * 3) });
      if (qR > 0.95) {
        const pr = H.p(lt, tRh + 0.9, tRh + 1.3);
        o += `<line x1="60" y1="${D.yRh}" x2="1010" y2="${D.yRh}" stroke="#ffd166" stroke-width="3" stroke-dasharray="12 8" opacity="${F(pr, 2)}"/>`;
        o += G.pg(G.bo(pr), 1010, D.yRh + 32, G.lab(1010, D.yRh + 32, 'rh98', { fs: 30, anc: 'e', col: '#ffd166', bd: '#ffd166' }));
      }
    }
    // pulso que baja por el árbol
    const desc = lt < tB + 0.2;
    const yy = desc ? yP : H.lerp(150, 890, ((lt - tB) / 2.6) % 1);
    const op = desc ? 1 : 0.4;
    if (yy < 895) {
      o += `<rect x="110" y="${F(yy - 9)}" width="370" height="18" rx="9" fill="#7CFFB2" opacity="${F(0.35 * op, 2)}"/><rect x="110" y="${F(yy - 3)}" width="370" height="6" rx="3" fill="#d9ffe9" opacity="${F(op, 2)}"/>`;
      if (desc) { const ix = ex(D.es[Math.min(D.ys.length - 1, Math.max(0, Math.round((yy - 190) / 5)))]); o += `<line x1="485" y1="${F(yy)}" x2="${F(ix)}" y2="${F(yy)}" stroke="#7CFFB2" stroke-width="2" stroke-dasharray="4 6" opacity=".7"/><circle cx="${F(ix)}" cy="${F(yy)}" r="8" fill="#d9ffe9"/>`; }
    }
    // marcas
    const pS = H.p(lt, tSu2 - 0.1, tSu2 + 0.4);
    if (pS > 0) {
      o += `<line x1="40" y1="880" x2="${F(40 + 990 * pS)}" y2="880" stroke="#e9ecf3" stroke-width="3" stroke-dasharray="10 8"/>`;
      o += G.lp(lt, tSu2, 290, 990, 'suelo', { col: '#e9ecf3', fs: 26 });
      o += `<text x="1030" y="836" text-anchor="end" font-family="JetBrains Mono" font-size="18" fill="#cfd6e4" opacity="${F(pS, 2)}">eco del suelo</text>`;
    }
    const pA = H.p(lt, tAlt - 0.1, tAlt + 0.6);
    if (pA > 0) {
      const yt = H.lerp(880, D.yTop, pA);
      o += `<line x1="505" y1="880" x2="505" y2="${F(yt)}" stroke="#ff5a5f" stroke-width="5"/><path d="M493 ${F(yt + 16)} L505 ${F(yt)} L517 ${F(yt + 16)} Z" fill="#ff5a5f"/>`;
      o += `<line x1="230" y1="${D.yTop}" x2="1010" y2="${D.yTop}" stroke="#ff5a5f" stroke-width="2" stroke-dasharray="6 8" opacity="${F(H.clamp(pA * 2 - 1), 2)}"/>`;
      o += G.lp(lt, tAlt + 0.4, 300, D.yTop - 40, 'altura del dosel', { col: '#ff8a8d', fs: 24 });
    }
    o += G.lp(lt, tOnd, 820, 150, 'forma de onda completa', { fs: 22, col: '#7CFFB2', bd: '#7CFFB2' });
    return `<svg viewBox="0 0 1080 1060" xmlns="http://www.w3.org/2000/svg">${o}</svg>`;
  }
},

/* 5 · Potencia frente a cobertura: ver el suelo bajo un dosel cerrado */
{
  bg: 'linear-gradient(180deg,#221a35,#382b52)',
  estrellas: false,
  hud: { cap: 'Ver el suelo', datos: ['15 mJ → dosel de 98 %', '4,5 mJ → dosel de 95 %'] },
  claves: ['potencia', 'cobertura', 'suelo', 'dosel'],
  draw(lt, dur, i) {
    const F = G.F;
    const t98 = G.at(i, '98', 1, 4), t95 = G.at(i, '95', 1, 7), tPot = G.at(i, 'potencia', 1, 0.8), tCob = G.at(i, 'cobertura', 2, t98 + 1);
    const cL = H.lerp(0.9, 0.98, H.p(lt, 0.4, t98)), cR = H.lerp(0.9, 0.95, H.p(lt, Math.min(t98, t95 - 0.6), t95));
    const panel = (xc, titulo, mj, col, c, meta, tMeta, nPart, rp, seed, tTit) => {
      const N = 40, x0 = xc - 200, no = Math.round(N * (1 - c));
      const r = H.rnd(seed), perm = [...Array(N).keys()];
      for (let k = N - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1)); [perm[k], perm[j]] = [perm[j], perm[k]]; }
      const open = new Set(perm.slice(0, Math.max(no, 1)));
      const listo = lt >= tMeta;
      let o = `<text x="${xc}" y="140" text-anchor="middle" font-family="Inter" font-weight="800" font-size="32" fill="#fff">${titulo}</text>`;
      o += G.lp(lt, tTit, xc, 188, mj, { fs: 26, col, bd: col });
      // emisor y cono del haz
      o += `<rect x="${xc - 22}" y="222" width="44" height="22" rx="5" fill="#c9d1e0"/>`;
      o += `<polygon points="${xc - 6},244 ${xc + 6},244 ${xc + 190},430 ${xc - 190},430" fill="${col}" opacity="${F(0.1 + 0.04 * Math.sin(lt * 8), 3)}"/>`;
      // rayos que pasan por los huecos
      open.forEach(k => { const x = x0 + k * 10; o += `<rect x="${x + 2}" y="430" width="6" height="312" fill="${col}" opacity="${F(0.25 + 0.15 * Math.sin(lt * 9 + k), 2)}"/>`; });
      // dosel
      for (let k = 0; k < N; k++) {
        if (open.has(k)) continue;
        const x = x0 + k * 10, sh = (k * 7) % 3;
        o += `<rect x="${x}" y="440" width="10" height="70" fill="${['#1f5e37', '#277043', '#2f8a4c'][sh]}"/>`;
        if (k % 2 === 0) o += `<circle cx="${x + 5}" cy="${F(440 + Math.sin(lt * 2 + k) * 2)}" r="11" fill="#2f8a4c"/>`;
      }
      // partículas de luz
      const r2 = H.rnd(seed + 9), ol = [...open];
      for (let k = 0; k < nPart; k++) {
        const ph0 = r2(), dx = r2(), sp = r2();
        const s = (lt / 1.5 + ph0) % 1;
        let xt = xc + (dx - 0.5) * 380; const slot = Math.floor((xt - x0) / 10);
        let pasa = open.has(slot);
        if (k % 5 === 0 && ol.length) { xt = x0 + ol[k % ol.length] * 10 + 5; pasa = true; }
        let x, y, op = 1;
        if (s < 0.4) { x = H.lerp(xc, xt, s / 0.4); y = H.lerp(244, 432, s / 0.4); }
        else if (!pasa) { const u = (s - 0.4) / 0.3; if (u > 1) continue; x = xt + (sp - 0.5) * 70 * u; y = 432 - 110 * u; op = 1 - u; }
        else if (s < 0.65) { x = xt; y = H.lerp(432, 742, (s - 0.4) / 0.25); }
        else { x = H.lerp(xt, xc, (s - 0.65) / 0.35); y = H.lerp(742, 250, (s - 0.65) / 0.35); op = 0.75; }
        o += `<circle cx="${F(x)}" cy="${F(y)}" r="${rp}" fill="${pasa && s >= 0.65 ? '#ffffff' : col}" opacity="${F(op, 2)}"/>`;
      }
      // suelo
      o += `<rect x="${x0 - 10}" y="742" width="420" height="30" rx="5" fill="#5b4636"/>`;
      open.forEach(k => { const x = x0 + k * 10 + 5; o += `<ellipse cx="${x}" cy="744" rx="${F(16 + 6 * Math.sin(lt * 10))}" ry="6" fill="${col}" opacity=".8"/>`; });
      if (listo) o += G.lp(lt, tMeta + 0.2, xc, 806, 've el suelo', { fs: 22, col, bd: col });
      // barra de cobertura del dosel
      o += `<text x="${xc}" y="866" text-anchor="middle" font-family="JetBrains Mono" font-size="20" fill="#cfd6e4">cobertura del dosel</text>`;
      o += `<rect x="${xc - 180}" y="882" width="360" height="16" rx="8" fill="#fff" fill-opacity=".12"/><rect x="${xc - 180}" y="882" width="${F(360 * c)}" height="16" rx="8" fill="${col}"/>`;
      o += `<line x1="${F(xc - 180 + 360 * meta)}" y1="874" x2="${F(xc - 180 + 360 * meta)}" y2="906" stroke="#ffd166" stroke-width="3"/>`;
      o += `<text x="${xc}" y="968" text-anchor="middle" font-family="JetBrains Mono" font-weight="700" font-size="58" fill="${listo ? '#ffd166' : '#e9ecf3'}">${Math.round(c * 100)} %</text>`;
      return o;
    };
    let o = panel(290, 'potencia completa', '15 mJ', '#7CFFB2', cL, 0.98, t98, 36, 5, 3, tPot);
    o += `<line x1="540" y1="120" x2="540" y2="990" stroke="#fff" stroke-opacity=".12" stroke-width="2"/>`;
    o += panel(790, 'cobertura', '4,5 mJ', '#8fd3ff', cR, 0.95, t95, 14, 3.5, 8, tCob);
    return `<svg viewBox="0 0 1080 1060" xmlns="http://www.w3.org/2000/svg">${o}</svg>`;
  }
},

/* 6 · Dónde mide: entre 51,6° N y S; cerca del 4 % en dos años */
{
  bg: 'linear-gradient(180deg,#0f1428,#1e2648)',
  hud: { cap: 'Dónde mide', datos: ['51,6° N a 51,6° S', '≈ 4 % en 2 años'] },
  claves: ['norte', 'sur', 'superficie', 'estación'],
  draw(lt, dur, i) {
    const F = G.F, D = Math.PI / 180;
    const t51 = G.at(i, '51,6', 1, 2.5), tAn = G.at(i, 'años', 1, 5), t4 = G.at(i, '4', 1, tAn + 1);
    const cx = 540, cy = 410, R = 280, lon0 = -75 + lt * 10, inc = 51.6;
    const P = (lat, lon) => { const f = lat * D, l = (lon - lon0) * D; return [Math.cos(f) * Math.sin(l), Math.sin(f), Math.cos(f) * Math.cos(l)]; };
    let o = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#s6o)"/><g clip-path="url(#s6c)">`;
    _S6.forEach(poly => {
      const q = poly.map(p => P(p[0], p[1]));
      if (q.every(v => v[2] < 0)) return;
      o += `<path d="M${q.map(v => { let x = v[0], y = v[1]; if (v[2] < 0) { const n = Math.hypot(x, y) || 1; x /= n; y /= n; } return F(cx + R * x) + ' ' + F(cy - R * y); }).join('L')}Z" fill="#3f9b5b" stroke="#57b06e" stroke-width="1.5"/>`;
    });
    // casquetes fuera del alcance
    const yN = cy - R * Math.sin(inc * D), yS = cy + R * Math.sin(inc * D), hw = R * Math.cos(inc * D);
    const pB = H.p(lt, t51 - 0.3, t51 + 0.4);
    o += `<rect x="${cx - R}" y="${cy - R}" width="${2 * R}" height="${F(yN - cy + R)}" fill="#05070f" opacity="${F(0.15 + 0.5 * pB, 2)}"/><rect x="${cx - R}" y="${F(yS)}" width="${2 * R}" height="${F(cy + R - yS)}" fill="#05070f" opacity="${F(0.15 + 0.5 * pB, 2)}"/>`;
    // trazas de la ISS (círculos máximos con inclinación de 51,6°)
    const nT = Math.min(14, Math.floor((lt - 0.2) / 1.1) + 1);
    for (let n = 0; n < nT; n++) {
      const t0 = 0.2 + n * 1.1, um = H.clamp((lt - t0) / 3) * 2 * Math.PI, Om = -40 + n * 27;
      let d = '', pen = false, head = null;
      for (let s = 0; s <= 72; s++) {
        const u = um * s / 72;
        const lat = Math.asin(Math.sin(inc * D) * Math.sin(u)) / D, lon = Om + Math.atan2(Math.cos(inc * D) * Math.sin(u), Math.cos(u)) / D;
        const v = P(lat, lon);
        if (v[2] > 0) { d += (pen ? 'L' : 'M') + F(cx + R * v[0]) + ' ' + F(cy - R * v[1]); pen = true; } else pen = false;
        if (s === 72) head = v;
      }
      const nuevo = n === nT - 1;
      if (d) o += `<path d="${d}" fill="none" stroke="#7CFFB2" stroke-width="${nuevo ? 3.5 : 2.2}" opacity="${nuevo ? 0.95 : 0.55}"/>`;
      if (nuevo && head && head[2] > 0 && um < 2 * Math.PI) o += `<circle cx="${F(cx + R * head[0])}" cy="${F(cy - R * head[1])}" r="12" fill="#7CFFB2" opacity=".35"/><circle cx="${F(cx + R * head[0])}" cy="${F(cy - R * head[1])}" r="6" fill="#fff"/>`;
    }
    o += `</g><circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#s6sh)"/><circle cx="${cx}" cy="${cy}" r="${R + 5}" fill="none" stroke="#7cc4ff" stroke-opacity=".3" stroke-width="7"/>`;
    // límites de latitud
    if (pB > 0) {
      const gl = 0.6 + 0.4 * Math.sin(lt * 5);
      o += `<line x1="${F(cx - hw * pB)}" y1="${F(yN)}" x2="${F(cx + hw * pB)}" y2="${F(yN)}" stroke="#ffd166" stroke-width="4" opacity="${F(gl, 2)}"/><line x1="${F(cx - hw * pB)}" y1="${F(yS)}" x2="${F(cx + hw * pB)}" y2="${F(yS)}" stroke="#ffd166" stroke-width="4" opacity="${F(gl, 2)}"/>`;
      o += G.lp(lt, t51, cx + hw + 14, yN, '51,6° N', { anc: 's', col: '#ffd166' }) + G.lp(lt, t51 + 0.3, cx + hw + 14, yS, '51,6° S', { anc: 's', col: '#ffd166' });
      o += G.lp(lt, t51 + 0.6, cx, cy - R + 26, 'fuera de alcance', { fs: 18, col: '#cfd6e4' });
    }
    // contador del 4 % y cuadrícula de 100 celdas
    const pC = H.p(lt, tAn - 0.5, tAn), p4 = H.p(lt, tAn - 0.1, t4 + 0.4);
    if (pC > 0) {
      o += `<g opacity="${F(pC, 2)}"><rect x="70" y="718" width="940" height="276" rx="20" fill="#0d1020" fill-opacity=".6"/>` +
        `<text x="290" y="843" text-anchor="middle" font-family="JetBrains Mono" font-weight="700" font-size="96" fill="#ffd166">≈ ${Math.round(4 * p4)} %</text>` +
        `<text x="290" y="898" text-anchor="middle" font-family="Inter" font-size="28" fill="#e9ecf3">de la superficie</text>` +
        `<text x="290" y="938" text-anchor="middle" font-family="Inter" font-weight="700" font-size="28" fill="#e9ecf3">en 2 años</text>`;
      const lit = [13, 47, 58, 82];
      for (let k = 0; k < 100; k++) {
        const x = 650 + (k % 10) * 25, y = 732 + Math.floor(k / 10) * 25, li = lit.indexOf(k), on = li >= 0 ? H.clamp(p4 * 4 - li) : 0;
        o += `<rect x="${x}" y="${y}" width="21" height="21" rx="3" fill="${on > 0 ? '#ffd166' : '#ffffff'}" opacity="${F(on > 0 ? 0.4 + 0.6 * on : 0.12, 2)}"/>`;
      }
      o += `</g>`;
    }
    return `<svg viewBox="0 0 1080 1060" xmlns="http://www.w3.org/2000/svg"><defs>
      <radialGradient id="s6o" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#4f8fdb"/><stop offset="1" stop-color="#1b3f7a"/></radialGradient>
      <radialGradient id="s6sh" cx="38%" cy="30%" r="75%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#050a1a" stop-opacity=".55"/></radialGradient>
      <clipPath id="s6c"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath></defs>${o}</svg>`;
  }
},

/* 7 · La meta: biomasa en al menos el 80 % de las celdas de 1 km */
{
  bg: 'linear-gradient(180deg,#1e2a33,#2e404d)',
  estrellas: false,
  hud: { cap: 'La meta', datos: ['≥ 80 % de celdas de 1 km', '±20 MgC/ha o 20 %'] },
  claves: ['biomasa', 'landsat', 'radar', 'kilómetro', 'huellas'],
  draw(lt, dur, i) {
    const F = G.F, S = _S7, N = S.N, C = S.C, X0 = S.X0, Y0 = S.Y0;
    const t80 = G.at(i, '80', 1, 3.5), tFal = G.at(i, 'faltan', 1, t80 + 1), tCal = G.at(i, 'calibran', 1, tFal + 1), tLan = G.at(i, 'Landsat', 1, tCal + 0.6), tRad = G.at(i, 'radar', 1, tLan + 1);
    const tA = 0.4, Ld = 1.2, nl = S.lines.length, dl = Math.max(0.2, (t80 - tA - Ld) / (nl - 1));
    const tAp = (li, f) => tA + li * dl + f * Ld;
    const nR = 3, emp = S.empty, rad = new Set(emp.slice(-nR));
    let o = `<rect x="${X0}" y="${Y0}" width="${N * C}" height="${N * C}" fill="#14202a"/>`;
    // relleno de celdas
    for (let id = 0; id < N * N; id++) {
      const x = X0 + (id % N) * C, y = Y0 + Math.floor(id / N) * C, sh = S.shade[id];
      const col = `rgb(${F(40 + 30 * sh, 0)},${F(110 + 60 * sh, 0)},${F(60 + 20 * sh, 0)})`;
      if (S.hitLine[id] >= 0) {
        const f = H.p(lt, tAp(S.hitLine[id], S.hitPos[id]), tAp(S.hitLine[id], S.hitPos[id]) + 0.35);
        if (f > 0) o += `<rect x="${x}" y="${y}" width="${C}" height="${C}" fill="${col}" opacity="${F(0.8 * f, 2)}"/>`;
      } else {
        const esR = rad.has(id), t0 = esR ? tRad + 0.3 : tLan + 0.2 + emp.indexOf(id) * 0.06, f = H.p(lt, t0, t0 + 0.4);
        if (f > 0) for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
          const pv = S.pix[id * 9 + a * 3 + b];
          const pc = esR ? `rgb(${F(90 + 40 * pv, 0)},${F(80 + 40 * pv, 0)},${F(150 + 50 * pv, 0)})` : `rgb(${F(50 + 50 * pv, 0)},${F(105 + 60 * pv, 0)},${F(70 + 30 * pv, 0)})`;
          o += `<rect x="${F(x + a * C / 3)}" y="${F(y + b * C / 3)}" width="${F(C / 3)}" height="${F(C / 3)}" fill="${pc}" opacity="${F(0.85 * f, 2)}"/>`;
        }
        const pF = H.p(lt, tFal - 0.1, tFal + 0.3) * (1 - H.p(lt, t0, t0 + 0.4));
        if (pF > 0) o += `<rect x="${x + 5}" y="${y + 5}" width="${C - 10}" height="${C - 10}" fill="none" stroke="#ff5a5f" stroke-width="4" stroke-dasharray="10 7" opacity="${F(pF * (0.6 + 0.4 * Math.sin(lt * 7)), 2)}"/>`;
      }
    }
    // líneas de la cuadrícula
    for (let k = 0; k <= N; k++) o += `<line x1="${X0 + k * C}" y1="${Y0}" x2="${X0 + k * C}" y2="${Y0 + N * C}" stroke="#e9ecf3" stroke-opacity=".22" stroke-width="2"/><line x1="${X0}" y1="${Y0 + k * C}" x2="${X0 + N * C}" y2="${Y0 + k * C}" stroke="#e9ecf3" stroke-opacity=".22" stroke-width="2"/>`;
    // huellas que caen en trazas diagonales
    S.lines.forEach((ln, li) => ln.forEach((q, k) => {
      const ta = tAp(li, k / Math.max(1, ln.length - 1)), u = H.pl(lt, ta - 0.25, ta);
      if (u <= 0) return;
      const ring = H.clamp((lt - ta) / 0.5);
      o += `<circle cx="${F(q[0])}" cy="${F(q[1] - 40 * (1 - u))}" r="6" fill="#7CFFB2" opacity="${F(u, 2)}" stroke="#0d1020" stroke-width="1.5"/>`;
      if (ring > 0 && ring < 1) o += `<circle cx="${F(q[0])}" cy="${F(q[1])}" r="${F(6 + 14 * ring)}" fill="none" stroke="#7CFFB2" stroke-width="2" opacity="${F(1 - ring, 2)}"/>`;
    }));
    // las huellas cercanas calibran: flechas hacia las celdas vacías
    const pK = H.p(lt, tCal - 0.2, tCal + 0.4) * (1 - H.p(lt, tRad + 0.8, tRad + 1.4));
    if (pK > 0) emp.forEach((id, k) => {
      const nb = S.near[k]; if (nb < 0) return;
      const ax = X0 + (nb % N + 0.5) * C, ay = Y0 + (Math.floor(nb / N) + 0.5) * C, bx = X0 + (id % N + 0.5) * C, by = Y0 + (Math.floor(id / N) + 0.5) * C;
      o += `<line x1="${F(ax)}" y1="${F(ay)}" x2="${F(H.lerp(ax, bx, pK))}" y2="${F(H.lerp(ay, by, pK))}" stroke="#ffd166" stroke-width="4" stroke-dasharray="8 6" stroke-dashoffset="${F(-lt * 40)}" opacity=".9"/><circle cx="${F(H.lerp(ax, bx, pK))}" cy="${F(H.lerp(ay, by, pK))}" r="7" fill="#ffd166"/>`;
    });
    // satélites: Landsat y radar
    const pLs = H.p(lt, tLan - 0.3, tLan + 0.4);
    if (pLs > 0) {
      const x = H.lerp(1150, 980, pLs);
      o += `<g transform="translate(${F(x)} 220)"><rect x="-18" y="-24" width="36" height="48" rx="5" fill="#dfe5ef"/><rect x="-62" y="-10" width="40" height="20" fill="#4c63c9"/><line x1="0" y1="24" x2="0" y2="60" stroke="#8fd3ff" stroke-width="3" stroke-dasharray="5 5" stroke-dashoffset="${F(-lt * 30)}"/></g>`;
      o += G.lp(lt, tLan, 975, 290, 'Landsat', { fs: 22, col: '#8fd3ff' });
    }
    const pRd = H.p(lt, tRad - 0.3, tRad + 0.4);
    if (pRd > 0) {
      const x = H.lerp(1150, 980, pRd);
      o += `<g transform="translate(${F(x)} 470)"><rect x="-18" y="-18" width="36" height="36" rx="5" fill="#dfe5ef"/><rect x="-70" y="-6" width="52" height="12" fill="#a78bfa"/></g>`;
      for (let q = 0; q < 3; q++) { const u = (lt * 0.9 + q / 3) % 1; o += `<path d="M${F(x - 30 - 60 * u)} ${F(470 - 50 - 50 * u)} Q${F(x - 60 - 90 * u)} 470 ${F(x - 30 - 60 * u)} ${F(470 + 50 + 50 * u)}" fill="none" stroke="#a78bfa" stroke-width="4" opacity="${F((1 - u) * pRd, 2)}"/>`; }
      o += G.lp(lt, tRad, 975, 540, 'radar', { fs: 22, col: '#c4b5fd' });
    }
    // etiqueta de 1 km
    o += `<line x1="${X0 + 7 * C}" y1="${Y0 - 14}" x2="${X0 + 8 * C}" y2="${Y0 - 14}" stroke="#e9ecf3" stroke-width="3"/>` + G.lab(X0 + 7.5 * C, Y0 - 40, '1 km', { fs: 22 });
    // barra de la meta
    const pBar = H.p(lt, tA, t80 + 0.2), xb = X0, wb = N * C;
    o += `<text x="${xb}" y="912" font-family="Inter" font-weight="700" font-size="26" fill="#e9ecf3">celdas de 1 km con biomasa</text>` +
      `<text x="${xb + wb}" y="912" text-anchor="end" font-family="JetBrains Mono" font-weight="700" font-size="34" fill="#ffd166">${Math.round(80 * pBar)} %</text>` +
      `<rect x="${xb}" y="930" width="${wb}" height="22" rx="11" fill="#fff" fill-opacity=".12"/>` +
      `<rect x="${xb}" y="930" width="${F(wb * 0.8 * pBar)}" height="22" rx="11" fill="#7CFFB2"/>`;
    const pX = H.p(lt, tLan, tRad + 1.2);
    if (pX > 0) o += `<rect x="${F(xb + wb * 0.8 - 6)}" y="930" width="${F(wb * 0.2 * pX + 6)}" height="22" rx="11" fill="#8fd3ff" opacity=".85"/>`;
    o += `<line x1="${F(xb + wb * 0.8)}" y1="922" x2="${F(xb + wb * 0.8)}" y2="962" stroke="#ffd166" stroke-width="4"/>` + G.lab(xb + wb * 0.8, 994, 'meta ≥ 80 %', { fs: 22, col: '#ffd166' });
    return `<svg viewBox="0 0 1080 1060" xmlns="http://www.w3.org/2000/svg">${o}</svg>`;
  }
},

/* 8 · En clase: 3.624 huellas sobre el manglar de la Ciénaga Grande, y repaso */
{
  bg: 'linear-gradient(180deg,#14282a,#1f3d3d)',
  estrellas: false,
  hud: { cap: 'Repaso', datos: ['clase: 3.624 huellas', 'manglar CGSM · rh98'] },
  claves: ['manglar', 'láseres', 'trazas', 'onda', 'huellas'],
  draw(lt, dur, i) {
    const F = G.F;
    const t36 = G.at(i, '3.600', 1, 2.5), tCie = G.at(i, 'Ciénaga', 1, 3.5), tPar = G.at(i, 'resumen', 1, 5), tTre = G.at(i, 'tres', 1, tPar + 0.6),
      tOch = G.at(i, 'ocho', 1, tTre + 1), tVei = G.at(i, 'veinticinco', 1, tOch + 1), tFor = G.at(i, 'forma', 1, tVei + 1.2);
    const pOut = H.p(lt, tPar - 0.2, tPar + 0.6);
    let o = '';
    // mapa esquemático de la Ciénaga Grande
    if (pOut < 0.99) {
      const mang = `<path d="M80 300 C250 280 420 300 560 292 C700 284 850 300 1000 290 L1000 326 C850 336 700 320 560 330 C420 338 250 318 80 338 Z"/>` +
        `<path d="M200 360 C300 340 380 380 380 420 C355 445 345 470 340 520 C330 620 400 690 500 740 C450 790 300 790 240 720 C180 650 170 500 200 360 Z"/>` +
        `<path d="M500 740 C600 790 760 760 820 680 C860 720 840 800 760 830 C660 860 540 840 500 740 Z"/>` +
        `<path d="M800 410 C860 380 920 400 940 460 C960 560 900 640 820 680 C880 600 880 460 800 410 Z"/>`;
      let m = `<path d="M0 110 H1080 V270 C900 300 700 260 540 285 C380 310 200 270 0 295 Z" fill="url(#s8s)"/>`;
      for (let w = 0; w < 4; w++) { const y = 150 + w * 30, dx = (lt * 40 + w * 60) % 120; m += `<path d="M${F(-120 + dx)} ${y} q30 -10 60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0" fill="none" stroke="#8fd3ff" stroke-opacity=".25" stroke-width="3"/>`; }
      m += `<g fill="#2f7d4a">${mang}</g>`;
      for (const [tx, ty, th] of [[150, 330, 34], [330, 322, 30], [700, 318, 32], [900, 318, 30], [240, 470, 40], [235, 640, 38], [905, 500, 36], [700, 835, 34]]) m += `<g transform="rotate(${F(Math.sin(lt * 1.6 + tx) * 3)} ${tx} ${ty})">${G.arbol(tx, ty, th, '#3c9c58', '#2a7a45')}</g>`;
      m += `<path d="M380 420 C460 360 700 350 800 410 C880 460 880 600 820 680 C760 760 600 790 500 740 C400 690 330 620 340 520 C345 470 355 445 380 420 Z" fill="#3f7fa8"/>`;
      for (let w = 0; w < 3; w++) { const u = (lt * 0.4 + w / 3) % 1; m += `<ellipse cx="600" cy="560" rx="${F(60 + 180 * u)}" ry="${F(40 + 120 * u)}" fill="none" stroke="#bfe3ff" stroke-width="2" opacity="${F(0.3 * (1 - u), 2)}"/>`; }
      // huellas que caen solo sobre el manglar (recorte)
      const pH = H.p(lt, 0.3, t36 + 0.2), nH = Math.floor(_S8.length * pH);
      let h = '';
      for (let k = 0; k < nH; k++) { const p = _S8[k], nuevo = (nH - k) < 12; h += `<circle cx="${F(p[0])}" cy="${F(p[1])}" r="${nuevo ? 7 : 4.5}" fill="${nuevo ? '#ffffff' : '#7CFFB2'}" opacity=".95"/>`; }
      m += `<g clip-path="url(#s8m)">${h}</g>`;
      const cnt = Math.round(3624 * pH);
      m += `<rect x="90" y="870" width="900" height="150" rx="18" fill="#0d1020" fill-opacity=".65"/>` +
        `<text x="130" y="920" font-family="Inter" font-weight="700" font-size="28" fill="#e9ecf3">huellas GEDI sobre manglar</text>` +
        `<text x="130" y="995" font-family="JetBrains Mono" font-weight="700" font-size="68" fill="#ffd166">${H.num(cnt)}</text>`;
      m += G.lp(lt, t36 + 0.3, 830, 920, 'rh98', { fs: 24, col: '#7CFFB2', bd: '#7CFFB2' }) + G.lp(lt, t36 + 0.6, 830, 980, '2024 y 2025', { fs: 22 });
      m += G.lp(lt, tCie, 600, 560, 'Ciénaga Grande', { fs: 26 }) + G.lp(lt, tCie + 0.4, 250, 600, 'manglar', { fs: 22, col: '#7CFFB2' });
      o += `<g opacity="${F(1 - pOut, 2)}" transform="translate(0 ${F(-80 * pOut)})">${m}</g>`;
    }
    // fichas de repaso
    const ficha = (x, y, t, titulo, sub, dib) => {
      const s = G.pop(lt, t, 0.5);
      if (s <= 0) return '';
      const c = `<rect x="${x}" y="${y}" width="440" height="390" rx="22" fill="#0d1020" fill-opacity=".8" stroke="#7CFFB2" stroke-opacity=".5" stroke-width="2"/>` +
        `<text x="${x + 220}" y="${y + 58}" text-anchor="middle" font-family="Inter" font-weight="800" font-size="34" fill="#fff">${titulo}</text>` + dib(x, y) +
        `<text x="${x + 220}" y="${y + 360}" text-anchor="middle" font-family="JetBrains Mono" font-weight="700" font-size="21" fill="#ffd166">${sub}</text>`;
      return G.pg(s, x + 220, y + 195, c);
    };
    if (pOut > 0) {
      o += G.lp(lt, tPar, 780, 100, 'en resumen', { fs: 24, col: '#ffd166', bd: '#ffd166' });
      o += ficha(80, 160, tTre, '3 láseres', '1 cobertura + 2 potencia', (x, y) => {
        let d = ''; const E = [x + 120, x + 220, x + 320];
        E.forEach((ex, k) => {
          const col = k === 0 ? '#8fd3ff' : '#7CFFB2';
          d += `<circle cx="${ex}" cy="${y + 110}" r="16" fill="#1a2236" stroke="${col}" stroke-width="4"/>`;
          const tg = k === 0 ? [ex - 45, ex + 45] : [ex];
          tg.forEach(tx => { const sy = k === 0 ? y + 170 : y + 126; if (k === 0) d += `<line x1="${ex}" y1="${y + 126}" x2="${ex}" y2="${sy}" stroke="${col}" stroke-width="3"/>`; d += `<line x1="${ex}" y1="${sy}" x2="${tx}" y2="${y + 300}" stroke="${col}" stroke-width="${k === 0 ? 3 : 6}"/>`; const u = (lt * 1.8 + k * 0.3) % 1; d += `<circle cx="${F(H.lerp(ex, tx, u))}" cy="${F(H.lerp(sy, y + 300, u))}" r="5" fill="#fff"/>`; });
        });
        return d;
      });
      o += ficha(560, 160, tOch, '8 trazas', '4 haces · 600 m', (x, y) => {
        let d = '';
        for (let k = 0; k < 8; k++) {
          const tx = x + 80 + k * 40, col = k < 4 ? '#8fd3ff' : '#7CFFB2';
          d += `<line x1="${tx}" y1="${y + 95}" x2="${tx}" y2="${y + 315}" stroke="#e9ecf3" stroke-opacity=".3" stroke-width="2" stroke-dasharray="6 6"/>`;
          for (let j = 0; j < 5; j++) { const yy = y + 95 + ((j / 5 + lt * 0.35 + (k % 2) * 0.1) % 1) * 220; d += `<circle cx="${tx}" cy="${F(yy)}" r="7" fill="${col}" opacity=".9"/>`; }
        }
        return d;
      });
      o += ficha(80, 580, tVei, 'huellas de 25 m', '60 m entre huellas', (x, y) => {
        let d = `<line x1="${x + 40}" y1="${y + 205}" x2="${x + 400}" y2="${y + 205}" stroke="#e9ecf3" stroke-opacity=".35" stroke-width="2" stroke-dasharray="8 8"/>`;
        const act = Math.floor(lt * 1.5) % 3;
        for (let k = 0; k < 3; k++) { const cxk = x + 85 + k * 135; d += `<circle cx="${cxk}" cy="${y + 205}" r="28" fill="#7CFFB2" fill-opacity="${k === act ? 0.6 : 0.2}" stroke="#7CFFB2" stroke-width="3"/>`; }
        d += `<line x1="${x + 57}" y1="${y + 150}" x2="${x + 113}" y2="${y + 150}" stroke="#ffd166" stroke-width="3"/><text x="${x + 85}" y="${y + 138}" text-anchor="middle" font-family="JetBrains Mono" font-size="20" fill="#ffd166">25 m</text>`;
        d += `<line x1="${x + 85}" y1="${y + 262}" x2="${x + 220}" y2="${y + 262}" stroke="#ffd166" stroke-width="3"/><text x="${x + 152}" y="${y + 292}" text-anchor="middle" font-family="JetBrains Mono" font-size="20" fill="#ffd166">60 m</text>`;
        return d;
      });
      o += ficha(560, 580, tFor, 'forma de onda', 'copa → suelo · rh98', (x, y) => {
        const D = _S4, sx = v => x + 70 + 300 * v / D.emax, sy = yy => y + 90 + (yy - 190) * 0.32;
        const u = (lt * 0.5) % 1, lim = 190 + 715 * Math.min(1, u * 1.4);
        let p = '';
        for (let k = 0; k < D.ys.length; k++) { if (D.ys[k] > lim) break; p += `${F(sx(D.es[k]))},${F(sy(D.ys[k]))} `; }
        return `<line x1="${x + 70}" y1="${y + 85}" x2="${x + 70}" y2="${y + 325}" stroke="#cfd6e4" stroke-width="2"/>` +
          `<polyline points="${p}" fill="none" stroke="#7CFFB2" stroke-width="4"/>` +
          `<line x1="${x + 60}" y1="${F(sy(D.yRh))}" x2="${x + 400}" y2="${F(sy(D.yRh))}" stroke="#ffd166" stroke-width="2" stroke-dasharray="6 6"/>` +
          `<text x="${x + 400}" y="${F(sy(D.yRh) - 8)}" text-anchor="end" font-family="JetBrains Mono" font-size="18" fill="#ffd166">rh98</text>`;
      });
    }
    return `<svg viewBox="0 0 1080 1060" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="s8s" gradientUnits="userSpaceOnUse" x1="0" y1="110" x2="0" y2="200"><stop offset="0" stop-color="#1d4f73" stop-opacity="0"/><stop offset="1" stop-color="#1d4f73"/></linearGradient><clipPath id="s8m">
      <path d="M80 300 C250 280 420 300 560 292 C700 284 850 300 1000 290 L1000 326 C850 336 700 320 560 330 C420 338 250 318 80 338 Z"/>
      <path d="M200 360 C300 340 380 380 380 420 C355 445 345 470 340 520 C330 620 400 690 500 740 C450 790 300 790 240 720 C180 650 170 500 200 360 Z"/>
      <path d="M500 740 C600 790 760 760 820 680 C860 720 840 800 760 830 C660 860 540 840 500 740 Z"/>
      <path d="M800 410 C860 380 920 400 940 460 C960 560 900 640 820 680 C880 600 880 460 800 410 Z"/></clipPath></defs>${o}</svg>`;
  }
}
];
