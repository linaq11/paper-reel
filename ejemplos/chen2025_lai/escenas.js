// Escenas animadas del video Chen2025_LAI (Chen et al. 2025, Ecological Informatics).
// Cifras en pantalla: solo las verificadas en radar/out/L1_guia.html y L1_notas.html.
// Todo el tiempo depende de H.at (palabra de la voz) y de dur; CL.at da un respaldo si la palabra no aparece.
const CL = (() => {
  const f = x => (+x).toFixed(1);
  const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const at = (i, w, fb, n) => { for (const x of [].concat(w)) { const t = H.at(i, x, n || 1); if (t > 0) return t; } return fb; };
  const bo = x => { x = cl(x); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const gauss = r => { const u = r() || 1e-6, v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, x) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, k) => Math.round(v + (B[k] - v) * cl(x))).join(',')})`; };
  const ramp = v => { v = cl(v); return v < .5 ? mix('#3b2f22', '#3f8f4a', v * 2) : mix('#3f8f4a', '#c6f26b', (v - .5) * 2); };
  // etiqueta monoespaciada sobre recuadro oscuro
  function tag(x, y, txt, o = {}) {
    const fs = o.fs || 26, col = o.col || '#e9ecf3', bg = o.bg || '#0d1020', op = o.op == null ? 1 : o.op, an = o.anchor || 'start';
    if (op <= 0.005) return '';
    const w = txt.length * fs * .6 + 24, h = fs + 16, x0 = an === 'middle' ? x - w / 2 : an === 'end' ? x - w : x;
    const bd = o.border ? ` stroke="${o.border}" stroke-width="2"` : '';
    return `<g opacity="${cl(op).toFixed(2)}"><rect x="${f(x0)}" y="${f(y - h / 2)}" width="${f(w)}" height="${h}" rx="6" fill="${bg}"${bd}/><text x="${f(x0 + 12)}" y="${f(y + fs * .36)}" font-family="JetBrains Mono" font-size="${fs}" font-weight="700" fill="${col}">${txt}</text></g>`;
  }
  const tree = (x, y, s, rot, c1 = '#46a35e', c2 = '#2f7d49') =>
    `<g transform="translate(${f(x)},${f(y)}) rotate(${f(rot)}) scale(${s.toFixed(3)})"><rect x="-6" y="-60" width="12" height="60" rx="3" fill="#6b4a33"/><circle cx="0" cy="-92" r="42" fill="${c2}"/><circle cx="-26" cy="-74" r="30" fill="${c1}"/><circle cx="24" cy="-78" r="32" fill="${c1}"/><circle cx="2" cy="-112" r="28" fill="${c1}"/></g>`;
  const pine = (x, y, s, rot, c = '#2e6b4c') =>
    `<g transform="translate(${f(x)},${f(y)}) rotate(${f(rot)}) scale(${s.toFixed(3)})"><rect x="-5" y="-30" width="10" height="30" fill="#5a3d2b"/><path d="M0 -150L-28 -95H28Z M0 -122L-40 -62H40Z M0 -94L-50 -28H50Z" fill="${c}"/></g>`;
  const plane = (x, y, s) => `<g transform="translate(${f(x)},${f(y)}) scale(${s})">
    <path d="M-30 -8L-62 -42H-44L2 -8Z" fill="#aab4c8"/>
    <path d="M-150 -4Q-150 -22 -128 -22H70Q118 -22 142 -2Q118 14 70 14H-128Q-150 14 -150 -4Z" fill="#eef1f6"/>
    <path d="M-138 -20L-166 -66H-140L-104 -20Z" fill="#5c7bd9"/>
    <rect x="-112" y="-12" width="176" height="7" rx="3.5" fill="#5c7bd9" opacity=".75"/>
    <path d="M114 -15Q130 -11 136 -4H108Z" fill="#2b3a5c"/>
    <path d="M-28 4L-82 60H-52L32 4Z" fill="#c9d1e0"/>
    <rect x="-46" y="12" width="56" height="11" rx="5" fill="#f2a65a"/></g>`;
  const sat = (x, y, s, rot) => `<g transform="translate(${f(x)},${f(y)}) rotate(${f(rot)}) scale(${s})">
    <line x1="-52" y1="0" x2="52" y2="0" stroke="#c9d1e0" stroke-width="5"/>
    <rect x="-150" y="-22" width="100" height="44" fill="#3d63c9" stroke="#9fb6ff" stroke-width="2"/><rect x="50" y="-22" width="100" height="44" fill="#3d63c9" stroke="#9fb6ff" stroke-width="2"/>
    <path d="M-125 -22V22M-100 -22V22M-75 -22V22M75 -22V22M100 -22V22M125 -22V22M-150 0H-50M50 0H150" stroke="#9fb6ff" stroke-width="1.5" opacity=".7"/>
    <rect x="-28" y="-34" width="56" height="66" rx="5" fill="#d9a441"/><rect x="-14" y="32" width="28" height="12" fill="#6cc4ff"/></g>`;
  const iss = (x, y, s) => {
    let p = '';
    for (const px of [-150, -96, 96, 150]) p += `<rect x="${px - 18}" y="-74" width="36" height="62" fill="#4f6fcf" stroke="#9fb6ff" stroke-width="1.5"/><rect x="${px - 18}" y="12" width="36" height="62" fill="#4f6fcf" stroke="#9fb6ff" stroke-width="1.5"/>`;
    return `<g transform="translate(${f(x)},${f(y)}) scale(${s})"><rect x="-172" y="-5" width="344" height="10" fill="#c9d1e0"/>${p}<rect x="-44" y="-15" width="88" height="30" rx="13" fill="#e8ecf3"/><rect x="-11" y="-36" width="22" height="72" rx="9" fill="#d6dbe6"/><rect x="-9" y="16" width="18" height="16" rx="3" fill="#ff6b6b"/></g>`;
  };
  const dia = (cx, cy, a, b) => `${f(cx - a)},${f(cy)} ${f(cx)},${f(cy - b)} ${f(cx + a)},${f(cy)} ${f(cx)},${f(cy + b)}`;
  function slab(cx, cy, a, b, th, top, sl, sr, op = 1, stroke = '') {
    const st = stroke ? ` stroke="${stroke}" stroke-width="3"` : '';
    return `<g opacity="${cl(op).toFixed(2)}"><polygon points="${f(cx - a)},${f(cy)} ${f(cx)},${f(cy + b)} ${f(cx)},${f(cy + b + th)} ${f(cx - a)},${f(cy + th)}" fill="${sl}"/><polygon points="${f(cx)},${f(cy + b)} ${f(cx + a)},${f(cy)} ${f(cx + a)},${f(cy + th)} ${f(cx)},${f(cy + b + th)}" fill="${sr}"/><polygon points="${dia(cx, cy, a, b)}" fill="${top}"${st}/></g>`;
  }
  // nube de huellas para las escenas 3 y 4: 19 sitios x 8 huellas (esquemática, sin valores)
  const nube = (() => {
    const r = H.rnd(77), pts = [], sites = [];
    const refl = (x, a, b) => cl(x < a ? a + (a - x) : x > b ? b - (x - b) : x, a, b);
    for (let s = 0; s < 19; s++) {
      const q = (s + .5) / 19, u = .07 + .5 * q + (r() - .5) * .05, w = u + .03 + (r() - .5) * .14;
      for (let k = 0; k < 8; k++) pts.push({ s, u: refl(u + gauss(r) * .07, .015, .72), w: refl(w + gauss(r) * .21, .02, .97), n: gauss(r), d: r() });
    }
    for (let s = 0; s < 19; s++) {
      const my = pts.filter(p => p.s === s), mu = my.reduce((a, p) => a + p.u, 0) / 8, mw = my.reduce((a, p) => a + p.w, 0) / 8;
      const su = Math.sqrt(my.reduce((a, p) => a + (p.u - mu) ** 2, 0) / 8), sw = Math.sqrt(my.reduce((a, p) => a + (p.w - mw) ** 2, 0) / 8);
      sites.push({ u: mu, w: mw, su: su * .5, sw: sw * .5 });
    }
    const n = sites.length, mx = sites.reduce((a, p) => a + p.u, 0) / n, my = sites.reduce((a, p) => a + p.w, 0) / n;
    const b = sites.reduce((a, p) => a + (p.u - mx) * (p.w - my), 0) / sites.reduce((a, p) => a + (p.u - mx) ** 2, 0);
    return { pts, sites, b, a: my - b * mx };
  })();
  return { f, cl, at, bo, gauss, mix, ramp, tag, tree, pine, plane, sat, iss, dia, slab, nube };
})();

const ESCENAS = [
// ---------------------------------------------------------------- 0. Tres sensores, un bosque
{
  bg: 'linear-gradient(180deg,#111830 0%,#1b2747 55%,#22365a 100%)',
  hud: { cap: 'Tres sensores, un bosque', datos: ['Chen et al. 2025', 'NIS · S2 · GEDI'] },
  claves: ['sensores', 'bosque', 'mapas', 'foliar', 'sorprender'],
  draw(lt, dur, i) {
    const { f, tag, tree, pine, plane, sat, iss, ramp, bo } = CL;
    const t3 = CL.at(i, 'tres', dur * .42), tB = CL.at(i, 'bosque', dur * .53), tM = CL.at(i, 'mapas', dur * .74),
      tF = CL.at(i, 'foliar', dur * .79), tS = CL.at(i, 'sorprender', dur * .91);
    let s = `<circle cx="950" cy="150" r="${f(44 + 2 * Math.sin(lt * 1.5))}" fill="#f4e9c8" opacity=".9"/><circle cx="968" cy="138" r="40" fill="#1a2444" opacity=".55"/>`;
    for (let k = 0; k < 4; k++) {
      const x = ((k * 330 + lt * (10 + k * 4)) % 1400) - 160, y = 150 + k * 75;
      s += `<g opacity=".14" fill="#fff"><ellipse cx="${f(x)}" cy="${y}" rx="95" ry="22"/><ellipse cx="${f(x + 50)}" cy="${y - 15}" rx="52" ry="20"/></g>`;
    }
    s += `<path d="M0 765Q270 738 540 758T1080 750V1060H0Z" fill="#1c3a2c"/><path d="M0 800Q300 785 600 805T1080 798V1060H0Z" fill="#163024"/>`;
    const xs = [55, 150, 245, 335, 430, 525, 625, 720, 815, 910, 1010];
    xs.forEach((x, k) => {
      const g = bo(H.pl(lt, .1 + k * .13, .7 + k * .13)), rot = 2.2 * Math.sin(lt * 1.3 + k);
      if (g > 0.01) s += k % 3 === 1 ? pine(x, 772 + (k % 2) * 6, 1.15 * g, rot) : tree(x, 772 + (k % 2) * 6, (1.25 + .15 * (k % 2)) * g, rot);
    });
    // sensores
    const pP = H.p(lt, t3 - .2, t3 + 1.0), pS = H.p(lt, t3 + .2, t3 + 1.4), pI = H.p(lt, t3 + .5, t3 + 1.7);
    const px = H.lerp(-280, 255, pP) + 6 * Math.sin(lt * 1.2), py = 330 + 8 * Math.sin(lt * 1.6);
    const sx = H.lerp(1320, 860, pS), sy = 305 + 7 * Math.sin(lt * 1.3 + 1);
    const ix = 540 + 10 * Math.sin(lt * .4), iy = H.lerp(-170, 185, pI);
    const bm = H.p(lt, tM - .2, tM + .6);
    if (bm > 0) {
      const scan = (lt * .8) % 1;
      s += `<path d="M${f(px - 18)} ${f(py + 22)}L${f(px - 120)} 762L${f(px + 80)} 762Z" fill="#f2a65a" opacity="${(.22 * bm).toFixed(2)}"/>`;
      s += `<line x1="${f(px - 120 + scan * 200)}" y1="745" x2="${f(px - 120 + scan * 200)}" y2="770" stroke="#f2a65a" stroke-width="4" opacity="${bm.toFixed(2)}"/>`;
      s += `<path d="M${f(sx)} ${f(sy + 44)}L${f(sx - 130)} 758L${f(sx + 130)} 758Z" fill="#6cc4ff" opacity="${(.18 * bm).toFixed(2)}"/>`;
      s += `<line x1="${f(ix)}" y1="${f(iy + 32)}" x2="${f(ix)}" y2="752" stroke="#ff6b6b" stroke-width="3" opacity="${(.8 * bm).toFixed(2)}"/>`;
      for (let k = 0; k < 3; k++) { const yy = iy + 32 + ((lt * 1.3 + k / 3) % 1) * (752 - iy - 32); s += `<circle cx="${f(ix)}" cy="${f(yy)}" r="7" fill="#ffb3b3" opacity="${bm.toFixed(2)}"/>`; }
      s += `<ellipse cx="${f(ix)}" cy="754" rx="${f(26 + 6 * Math.sin(lt * 6))}" ry="8" fill="#ff6b6b" opacity="${(.5 * bm).toFixed(2)}"/>`;
    }
    if (pP > 0) s += plane(px, py, 1) + tag(px, py + 92, 'NIS · avión', { anchor: 'middle', col: '#f2a65a', op: pP });
    if (pS > 0) s += sat(sx, sy, .9, 8 * Math.sin(lt * .5)) + tag(sx, sy + 78, 'Sentinel-2', { anchor: 'middle', col: '#6cc4ff', op: pS });
    if (pI > 0) s += iss(ix, iy, .82) + tag(ix, iy + 100, 'GEDI · lidar', { anchor: 'middle', col: '#ff6b6b', op: pI });
    // signo de pregunta
    const q = H.p(lt, tB - .2, tB + .5) * (1 - H.p(lt, tM - .4, tM + .1));
    if (q > 0) s += `<text x="540" y="${f(640 + 10 * Math.sin(lt * 3))}" text-anchor="middle" font-family="Inter" font-weight="800" font-size="${f(190 * CL.bo(q))}" fill="#ffd166" opacity="${q.toFixed(2)}">?</text>`;
    // tres mapas distintos
    const tiles = [[60, '#f2a65a', 'NIS', v => v * .55], [400, '#6cc4ff', 'Sentinel-2', v => Math.min(v, .5) * 1.1], [740, '#ff6b6b', 'GEDI', null]];
    const r = H.rnd(5), field = [];
    for (let rr = 0; rr < 4; rr++) for (let c = 0; c < 8; c++) field.push(.5 + .32 * Math.sin(c * .9 + rr * 1.4) + .18 * (r() - .5));
    tiles.forEach(([x0, col, nom, fn], k) => {
      const p = H.p(lt, tF - .3 + k * .25, tF + .3 + k * .25);
      if (p <= 0) return;
      const y0 = 845 + 30 * (1 - p);
      let g = `<rect x="${x0}" y="${f(y0)}" width="280" height="150" rx="8" fill="#141a2b"/>`;
      if (fn) field.forEach((v, j) => { const c = j % 8, rr = Math.floor(j / 8); g += `<rect x="${f(x0 + c * 35)}" y="${f(y0 + rr * 37.5)}" width="35.5" height="38" fill="${ramp(fn(v))}"/>`; });
      else for (let m = 0; m < 6; m++) { const cx = x0 + 30 + m * 44, cy = y0 + 125 - m * 20, v = field[(m * 5) % 32]; g += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(15 + 2 * Math.sin(lt * 4 + m))}" fill="${ramp(v * 1.15)}" stroke="#ff6b6b" stroke-width="2"/>`; }
      s += `<g opacity="${p.toFixed(2)}">${g}<rect x="${x0}" y="${f(y0)}" width="280" height="150" rx="8" fill="none" stroke="${col}" stroke-width="3"/></g>`;
      s += tag(x0 + 140, 1030, nom, { anchor: 'middle', col, op: p });
    });
    const ne = H.p(lt, tS - .3, tS + .3);
    if (ne > 0) for (const x of [370, 710]) s += `<text x="${x}" y="945" text-anchor="middle" font-family="Inter" font-weight="800" font-size="${f(70 * (1 + .08 * Math.sin(lt * 6)))}" fill="#ffd166" opacity="${ne.toFixed(2)}">≠</text>`;
    return `<svg viewBox="0 0 1080 1060">${s}</svg>`;
  }
},
// ---------------------------------------------------------------- 1. Qué es el LAI
{
  bg: 'linear-gradient(180deg,#5a3732 0%,#7a4a3d 100%)',
  estrellas: false,
  hud: { cap: 'Qué es el LAI', datos: ['m² hoja / m² suelo', 'una sola cara'] },
  claves: ['lai', 'hoja', 'cara', 'suelo'],
  draw(lt, dur, i) {
    const { f, tag, tree, slab, dia, bo } = CL;
    const tL = CL.at(i, 'LAI', dur * .4), tH = CL.at(i, 'hoja', dur * .49), tU = CL.at(i, 'una', dur * .54),
      tM = CL.at(i, 'metro', dur * .63), tSu = CL.at(i, 'suelo', dur * .69), tL2 = CL.at(i, 'LAI', dur * .74, 2),
      t1 = CL.at(i, 'tres', dur * .77), t2 = CL.at(i, 'tres', dur * .8, 2), tH2 = CL.at(i, 'hoja', dur * .87, 2), tSu2 = CL.at(i, 'suelo', dur * .94, 2);
    let s = '';
    const gx = 720, gy = 905, a = 200, b = 100, ly = [gy - 112, gy - 222, gy - 332];
    // suelo de 1 m²
    const hs = H.p(lt, tM - .2, tM + .4), pul = .5 + .5 * Math.sin(lt * 5);
    s += slab(gx, gy, a, b, 22, '#8a6a4a', '#5e4632', '#4d3828', 1, hs > 0 ? `rgba(255,209,102,${(hs * (.6 + .4 * pul)).toFixed(2)})` : '');
    s += `<polygon points="${dia(gx, gy, a * .82, b * .82)}" fill="none" stroke="#a5835f" stroke-dasharray="8 10" opacity=".7"/>`;
    // árbol
    const rot = 2 * Math.sin(lt * 1.1);
    s += tree(220, 1000, 2.25, rot, '#4fae63', '#2f7d49');
    const pal = H.p(lt, tL - .3, tL + .3);
    // hojas que vuelan a la capa 1
    const r = H.rnd(11);
    const leaf = (x, y, ro, sc, op) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(15 * sc)}" ry="${f(7 * sc)}" transform="rotate(${f(ro)} ${f(x)} ${f(y)})" fill="#8fe07a" stroke="#2f7d49" stroke-width="1.5" opacity="${op.toFixed(2)}"/>`;
    const L1 = H.p(lt, tH + .7, tH + 1.4);
    if (L1 > 0) s += slab(gx, ly[0], a, b, 12, 'rgba(92,196,111,.55)', '#2f7d49', '#24683b', L1, '#bdf5a4') + tag(gx + a + 18, ly[0] + 6, 'capa 1', { fs: 22, op: L1, col: '#bdf5a4' });
    for (let k = 0; k < 24; k++) {
      const ang = r() * Math.PI * 2, rad = 20 + r() * 150, sx = 220 + Math.cos(ang) * rad * .9 + rot * 3, sy = 790 + Math.sin(ang) * rad * .55;
      const u = ((k % 6) + .5) / 3 - 1 + (r() - .5) * .2, v = (Math.floor(k / 6) + .5) / 2 - 1 + (r() - .5) * .2;
      const tx = gx + (u - v) * a / 2 * .9, ty = ly[0] + (u + v) * b / 2 * .9;
      const pk = H.eio(H.pl(lt, tH + k * .03, tH + .9 + k * .03));
      const x = H.lerp(sx, tx, pk), y = H.lerp(sy, ty, pk) - 140 * Math.sin(Math.PI * pk);
      const ro = pk < 1 ? 20 * Math.sin(lt * 4 + k) + 540 * pk : 25 + (k * 37) % 60;
      s += leaf(x, y, ro, 1, pk > 0 ? 1 : .85);
    }
    // hojas que caen (ambiente)
    for (let k = 0; k < 4; k++) {
      const ph = (lt * .22 + k / 4) % 1;
      s += leaf(120 + k * 70 + 25 * Math.sin(lt * 2 + k), 820 + ph * 200, lt * 90 + k * 50, .8, (1 - ph) * .8);
    }
    // capas
    const caps = [L1, H.p(lt, t1 - .1, t1 + .5), H.p(lt, t2 - .1, t2 + .5)];
    let capas = '';
    caps.forEach((p, k) => {
      if (p <= 0 || k === 0) return;
      const y = ly[k] - 220 * (1 - p);
      capas += slab(gx, y, a, b, 12, 'rgba(92,196,111,.9)', '#2f7d49', '#24683b', p, '#bdf5a4');
      for (let m = 0; m < 10; m++) {
        const u = ((m % 5) + .5) / 2.5 - 1, v = (Math.floor(m / 5) + .5) - 1;
        const x = gx + (u - v) * a / 2 * .85, yy = y + (u + v) * b / 2 * .85;
        capas += leaf(x, yy, 25 + m * 23, 1, p);
      }
      capas += tag(gx + a + 18, y + 6, `capa ${k + 1}`, { fs: 22, op: p, col: '#bdf5a4' });
    });
    s += capas;
    // hoja que gira: una sola cara
    const pf = H.p(lt, tU - .4, tU + .1), fl = H.eio(H.pl(lt, tU, tU + 1.1));
    if (pf > 0) {
      const sc = Math.cos(fl * Math.PI * 2), fc = sc >= 0 ? '#5cc46f' : '#b5e39d', dim = 1 - .45 * H.p(lt, tSu + .8, tSu + 1.5);
      s += `<g opacity="${(pf * dim).toFixed(2)}" transform="translate(220,330) rotate(${f(-25 + 4 * Math.sin(lt * 2))}) scale(${f(Math.max(.04, Math.abs(sc)) * 1.6)},1.6)"><path d="M0 -70C46 -44 46 44 0 74C-46 44 -46 -44 0 -70Z" fill="${fc}" stroke="#1f5e33" stroke-width="3"/><path d="M0 -60V66M0 -20L22 -38M0 10L24 -8M0 -20L-22 -38M0 10L-24 -8" stroke="#1f5e33" stroke-width="2.5" fill="none"/></g>`;
      s += tag(220, 485, 'una sola cara', { anchor: 'middle', col: '#ffd166', op: H.p(lt, tU + .9, tU + 1.3) * dim });
    }
    // medidas del suelo
    if (hs > 0) {
      s += tag(gx - a / 2 - 40, gy + b / 2 + 40, '1 m', { anchor: 'middle', op: hs, fs: 22 });
      s += tag(gx + a / 2 + 40, gy + b / 2 + 40, '1 m', { anchor: 'middle', op: hs, fs: 22 });
      const s2p = H.p(lt, tSu2 - .2, tSu2 + .3);
      s += tag(gx, 1030, '1 m² de suelo', { anchor: 'middle', col: '#ffd166', op: hs, border: s2p > 0 ? `rgba(255,209,102,${(s2p * pul).toFixed(2)})` : '' });
    }
    // llave 3 m² de hoja
    const ph = H.p(lt, tH2 - .3, tH2 + .3);
    if (ph > 0) {
      s += `<path d="M${gx - a - 22} ${ly[2]}V${ly[0] + 12}" stroke="#ffd166" stroke-width="4" fill="none" opacity="${ph.toFixed(2)}"/><path d="M${gx - a - 32} ${ly[2]}H${gx - a - 12}M${gx - a - 32} ${ly[0] + 12}H${gx - a - 12}" stroke="#ffd166" stroke-width="4" opacity="${ph.toFixed(2)}"/>`;
      s += tag(gx, ly[2] - b - 50, '3 m² de hoja', { anchor: 'middle', col: '#ffd166', op: ph });
    }
    // contador LAI
    if (pal > 0) {
      const n = (L1 > .5 ? 1 : 0) + (caps[1] > .5 ? 1 : 0) + (caps[2] > .5 ? 1 : 0);
      const pop = n === 3 ? 1 + .12 * (1 - H.p(lt, t2 + .3, t2 + .9)) : 1;
      s += `<g opacity="${pal.toFixed(2)}" transform="translate(720,250) scale(${f(pop)})"><text x="0" y="0" text-anchor="middle" font-family="Inter" font-weight="800" font-size="120" fill="#fff">LAI<tspan fill="#ffd166">${n ? ' = ' + n : ''}</tspan></text></g>`;
    }
    return `<svg viewBox="0 0 1080 1060">${s}</svg>`;
  }
},
// ---------------------------------------------------------------- 2. 19 sitios y tres lentes
{
  bg: 'linear-gradient(180deg,#262e3d 0%,#38435a 100%)',
  estrellas: false,
  hud: { cap: 'Los datos', datos: ['19 sitios NEON', '3 productos de LAI'] },
  claves: ['neon', 'nis', 'sentinel', 'gedi', 'huellas', 'productos'],
  draw(lt, dur, i) {
    const { f, tag, bo, ramp } = CL;
    const t19 = CL.at(i, ['19', 'diecinueve'], dur * .4), tNe = CL.at(i, 'NEON', dur * .5), tPr = CL.at(i, 'productos', dur * .56),
      tN = CL.at(i, 'NIS', dur * .65), tS = CL.at(i, 'Sentinel', dur * .7), tV = CL.at(i, 'veinte', dur * .78),
      tG = CL.at(i, 'GEDI', dur * .85), t25 = CL.at(i, 'veinticinco', dur * .92);
    const P = (lo, la) => [192 + (lo + 125) * 12, 132 + (49.5 - la) * 13.8];
    const US = [[-124.7, 48.4], [-124, 46], [-124.2, 42], [-122.4, 37.8], [-120.5, 34.5], [-117.1, 32.5], [-111, 31.3], [-108.2, 31.3], [-106.5, 31.8], [-103, 29], [-99.5, 27.5], [-97.1, 25.9], [-97.4, 27.8], [-94, 29.6], [-89.6, 29.9], [-85, 29.6], [-83, 29], [-82.7, 27.5], [-81, 25.1], [-80, 26.5], [-80.5, 28.5], [-81.4, 30.7], [-79, 33.8], [-75.5, 35.2], [-76, 37], [-74, 40.5], [-70, 41.5], [-70.6, 43], [-67, 44.8], [-68.8, 47.3], [-71.5, 45], [-75, 45], [-79, 43.3], [-82.5, 41.7], [-82.4, 43], [-84.5, 46.5], [-88, 48.3], [-95, 49], [-123, 49]];
    const pts = US.map(([a, b]) => P(a, b).map(v => v.toFixed(0)).join(',')).join(' ');
    const SIT = [[-122.3, 45.9], [-122.1, 44], [-119.2, 37], [-111.8, 40.9], [-105.6, 40.1], [-89.6, 45.6], [-93.2, 45.4], [-86.5, 44.8], [-72.2, 42.5], [-71.3, 44.2], [-78.1, 38.9], [-78.1, 37.3], [-84.3, 36], [-80.4, 35.4], [-87.4, 32.9], [-88.4, 31.3], [-82, 29.7], [-84.5, 31.6], [-96.6, 39.1]];
    let s = '';
    const pm = H.pl(lt, .15, 2.6), dimMap = 1 - .35 * H.p(lt, tPr - .3, tPr + .5);
    s += `<g opacity="${dimMap.toFixed(2)}"><rect x="120" y="118" width="840" height="380" rx="22" fill="#1b2230"/>`;
    s += `<polygon points="${pts}" fill="#2f4a3a" fill-opacity="${(.9 * H.p(lt, 1.2, 2.8)).toFixed(2)}" stroke="#7fb08e" stroke-width="3" stroke-dasharray="3000" stroke-dashoffset="${f(3000 * (1 - pm))}"/>`;
    const sw = (lt * .35) % 1.4 - .2;
    if (sw > 0 && sw < 1) s += `<rect x="${f(120 + sw * 840)}" y="118" width="40" height="380" fill="#fff" opacity=".05"/>`;
    let cnt = 0;
    SIT.forEach(([lo, la], k) => {
      const t0 = t19 - .25 + k * .09, p = bo(H.pl(lt, t0, t0 + .45));
      if (p <= 0) return;
      if (H.pl(lt, t0, t0 + .2) >= 1) cnt++;
      const [x, y] = P(lo, la), yb = y - 3 * Math.sin(lt * 3 + k);
      s += `<g transform="translate(${f(x)},${f(yb)}) scale(${p.toFixed(2)})"><path d="M0 0C-4 -9 -14 -16 -14 -27A14 14 0 1 1 14 -27C14 -16 4 -9 0 0Z" fill="#7CFFB2" stroke="#0d1020" stroke-width="2"/><circle cx="0" cy="-27" r="5" fill="#0d1020"/></g>`;
    });
    const pc = H.p(lt, t19 - .3, t19 + .2);
    if (pc > 0) s += `<text x="945" y="478" text-anchor="end" font-family="Inter" font-weight="800" font-size="104" fill="#ffd166" opacity="${pc.toFixed(2)}">${cnt}</text>`;
    s += tag(140, 470, 'sitios forestales NEON', { fs: 22, col: '#7CFFB2', op: H.p(lt, tNe - .3, tNe + .2) });
    s += `</g>`;
    // tres lentes sobre el mismo parche de bosque (escala 4 px = 1 m)
    const r = H.rnd(21), cr = [];
    for (let k = 0; k < 44; k++) cr.push([r() * 300, r() * 300, 13 + r() * 20, k % 3]);
    const cov = (x0, y0, w) => { let c = 0; for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) { const x = x0 + (a + .5) * w / 4, y = y0 + (b + .5) * w / 4; if (cr.some(q => (q[0] - x) ** 2 + (q[1] - y) ** 2 < q[2] ** 2)) c++; } return c / 16; };
    const greens = ['#3f9b5b', '#2f7d49', '#5cb86e'];
    const crowns = op => `<rect width="300" height="300" fill="#3a3324"/>` + cr.map(q => `<circle cx="${f(q[0])}" cy="${f(q[1])}" r="${f(q[2])}" fill="${greens[q[3]]}" opacity="${op}"/>`).join('');
    const PX = [30, 390, 750], PY = 585;
    let defs = `<pattern id="g1m" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M4 0H0V4" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="1"/></pattern>`;
    const fr = H.p(lt, tPr - .3, tPr + .4);
    const ent = [H.p(lt, tN - .35, tN + .25), H.p(lt, tS - .35, tS + .25), H.p(lt, tG - .35, tG + .25)];
    const cols = ['#f2a65a', '#6cc4ff', '#ff6b6b'], nom = ['NIS · avión', 'Sentinel-2', 'GEDI · lidar'], res = ['píxel 1 m', 'píxel 10 y 20 m', 'huella 25 m'];
    for (let k = 0; k < 3; k++) {
      defs += `<clipPath id="cp${k}"><rect width="300" height="300" rx="16"/></clipPath>`;
      if (fr <= 0) continue;
      const e = ent[k], y = PY + 40 * (1 - fr);
      let g = '';
      if (e > 0) {
        g += crowns(1);
        if (k === 0) {
          g += `<rect width="300" height="300" fill="url(#g1m)" opacity="${e.toFixed(2)}"/>`;
          const lx = 150 + 90 * Math.cos(lt * .8), ly = 150 + 90 * Math.sin(lt * 1.1);
          g += `<circle cx="${f(lx)}" cy="${f(ly)}" r="34" fill="none" stroke="#f2a65a" stroke-width="3" opacity="${e.toFixed(2)}"/>`;
        }
        if (k === 1) {
          const m10 = e * (1 - H.p(lt, tV - .1, tV + .5)), m20 = e * H.p(lt, tV - .1, tV + .5);
          if (m10 > 0) for (let a = 0; a < 8; a++) for (let b = 0; b < 8; b++) g += `<rect x="${a * 40}" y="${b * 40}" width="40" height="40" fill="${ramp(.15 + .8 * cov(a * 40, b * 40, 40))}" stroke="#1b2230" stroke-width="1" opacity="${m10.toFixed(2)}"/>`;
          if (m20 > 0) for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) g += `<rect x="${a * 80}" y="${b * 80}" width="80" height="80" fill="${ramp(.15 + .8 * cov(a * 80, b * 80, 80))}" stroke="#1b2230" stroke-width="2" opacity="${m20.toFixed(2)}"/>`;
        }
        if (k === 2) {
          g += `<rect width="300" height="300" fill="#0d1020" opacity="${(.35 * e).toFixed(2)}"/><line x1="-20" y1="320" x2="320" y2="-20" stroke="#ff6b6b" stroke-width="2" stroke-dasharray="6 8" opacity="${e.toFixed(2)}"/>`;
          [[65, 235], [235, 65]].forEach(([cx, cy], m) => {
            const pm2 = H.p(lt, tG + m * .3, tG + .5 + m * .3), ring = (lt * 1.2 + m * .5) % 1;
            g += `<circle cx="${cx}" cy="${cy}" r="50" fill="rgba(255,107,107,.18)" stroke="#ff6b6b" stroke-width="4" opacity="${pm2.toFixed(2)}"/><circle cx="${cx}" cy="${cy}" r="${f(50 * ring)}" fill="none" stroke="#ffb3b3" stroke-width="3" opacity="${(pm2 * (1 - ring)).toFixed(2)}"/>`;
          });
          const pd = H.p(lt, t25 - .2, t25 + .3);
          if (pd > 0) g += `<line x1="15" y1="292" x2="115" y2="292" stroke="#ffd166" stroke-width="4" opacity="${pd.toFixed(2)}"/><path d="M15 282V300M115 282V300" stroke="#ffd166" stroke-width="4" opacity="${pd.toFixed(2)}"/>`;
        }
      } else {
        g += `<rect width="300" height="300" fill="#1b2230"/>`;
      }
      s += `<g transform="translate(${PX[k]},${f(y)})" opacity="${fr.toFixed(2)}"><g clip-path="url(#cp${k})">${g}</g><rect width="300" height="300" rx="16" fill="none" stroke="${e > 0 ? cols[k] : '#56607a'}" stroke-width="${e > 0 ? 4 : 2}" ${e > 0 ? '' : 'stroke-dasharray="10 10"'}/></g>`;
      s += tag(PX[k] + 150, PY + 340, nom[k], { anchor: 'middle', col: cols[k], op: e, fs: 24 });
      s += tag(PX[k] + 150, PY + 390, res[k], { anchor: 'middle', col: '#ffd166', op: k === 2 ? H.p(lt, t25 - .3, t25 + .3) : e, fs: 24 });
    }
    return `<svg viewBox="0 0 1080 1060"><defs>${defs}</defs>${s}</svg>`;
  }
},
// ---------------------------------------------------------------- 3. Huella por huella
{
  bg: 'linear-gradient(180deg,#231d36 0%,#352b52 100%)',
  estrellas: false,
  hud: { cap: 'Huella por huella', datos: ['GEDI-S2   R² 0,31', 'GEDI-NIS  R² 0,12'] },
  claves: ['huella', 'coinciden', 'gedi', 'sentinel', 'nis'],
  draw(lt, dur, i) {
    const { f, tag, nube, cl } = CL;
    const tH = CL.at(i, 'huella', dur * .41), tC = CL.at(i, 'coinciden', dur * .47), tGS = CL.at(i, 'Sentinel', dur * .6),
      tR = CL.at(i, 'cuadrado', dur * .73), t31 = CL.at(i, ['0,31', 'treinta'], dur * .76), tNI = CL.at(i, 'NIS', dur * .86), t12 = CL.at(i, ['0,12', 'doce'], dur * .94);
    const X = u => 280 + u * 520, Y = w => 650 - w * 520;
    let s = '';
    s += `<rect x="280" y="130" width="520" height="520" fill="#1d1830" rx="4"/>`;
    for (let k = 1; k < 4; k++) s += `<path d="M${280 + k * 130} 130V650M280 ${130 + k * 130}H800" stroke="#fff" stroke-opacity=".05"/>`;
    s += `<path d="M280 130V650H800" stroke="#c9cfe0" stroke-width="3" fill="none"/>`;
    s += `<line x1="280" y1="650" x2="800" y2="130" stroke="#fff" stroke-opacity=".45" stroke-width="2.5" stroke-dasharray="10 9"/>`;
    s += `<text x="785" y="160" text-anchor="end" font-family="JetBrains Mono" font-size="24" fill="#c9cfe0" opacity=".7">1:1</text>`;
    const m = H.p(lt, tNI - .2, tNI + .9);
    s += `<text x="248" y="390" text-anchor="middle" transform="rotate(-90 248 390)" font-family="JetBrains Mono" font-weight="700" font-size="26" fill="#ff6b6b">LAI GEDI</text>`;
    s += `<text x="540" y="694" text-anchor="middle" font-family="JetBrains Mono" font-weight="700" font-size="26" fill="#6cc4ff" opacity="${(1 - m).toFixed(2)}">LAI Sentinel-2</text>`;
    s += `<text x="540" y="694" text-anchor="middle" font-family="JetBrains Mono" font-weight="700" font-size="26" fill="#f2a65a" opacity="${m.toFixed(2)}">LAI NIS</text>`;
    const win = Math.max(1.2, Math.min(4.5, tH - 1)), jit = H.p(lt, tC - .3, tC + .3);
    const N = nube.pts.length;
    nube.pts.forEach((p, k) => {
      const t0 = .2 + (k / N) * win, pk = H.p(lt, t0, t0 + .5);
      if (pk <= 0) return;
      const u = cl(p.u * (1 - .35 * m) + p.d * .25 * m, .01, .9), w = cl(p.w + p.n * .1 * m, .02, .98);
      const x = X(u) + jit * 5 * Math.sin(lt * 9 + k * 1.7), y = H.lerp(60, Y(w), pk) + jit * 5 * Math.cos(lt * 8 + k * 2.3);
      s += `<circle cx="${f(x)}" cy="${f(y)}" r="7" fill="${m > .5 ? '#f7c18e' : '#dfe6ff'}" opacity="${(.78 * pk).toFixed(2)}"/>`;
    });
    s += tag(785, 610, 'no coinciden', { anchor: 'end', col: '#ff8a8a', op: jit * (1 - H.p(lt, tR - .5, tR)), border: '#ff6b6b' });
    // contador R²
    const v1 = .31 * H.p(lt, tR - .2, t31), v2 = .12 * H.p(lt, tNI + .2, t12), sh2 = H.p(lt, tNI - .1, tNI + .3);
    const pc = H.p(lt, tGS - .3, tGS + .3);
    if (pc > 0) {
      s += `<text x="1040" y="200" text-anchor="end" font-family="JetBrains Mono" font-weight="700" font-size="34" fill="#c9cfe0" opacity="${pc.toFixed(2)}">R²</text>`;
      s += `<text x="1040" y="290" text-anchor="end" font-family="Inter" font-weight="800" font-size="84" fill="#ffd166" opacity="${(pc * (1 - sh2)).toFixed(2)}">${H.num(v1, 2)}</text>`;
      if (sh2 > 0) s += `<text x="1040" y="290" text-anchor="end" font-family="Inter" font-weight="800" font-size="84" fill="#ffd166" opacity="${sh2.toFixed(2)}">${H.num(v2, 2)}</text>`;
    }
    // barras de R²
    const rows = [[790, 'GEDI frente a Sentinel-2', '#6cc4ff', v1, pc], [900, 'GEDI frente a NIS', '#f2a65a', v2, sh2]];
    rows.forEach(([y, lab, col, v, op]) => {
      if (op <= 0) return;
      s += `<g opacity="${op.toFixed(2)}"><text x="110" y="${y - 22}" font-family="JetBrains Mono" font-weight="700" font-size="26" fill="${col}">${lab}</text>`;
      s += `<rect x="110" y="${y}" width="700" height="32" rx="16" fill="#ffffff" fill-opacity=".1"/><rect x="110" y="${y}" width="${f(Math.max(32, 700 * v))}" height="32" rx="16" fill="${col}" opacity="${v > 0 ? 1 : 0}"/>`;
      if (v > .005) s += `<text x="830" y="${y + 28}" font-family="Inter" font-weight="800" font-size="40" fill="#ffd166">R² ${H.num(v, 2)}</text>`;
      s += `</g>`;
    });
    if (pc > 0) s += `<text x="810" y="${990}" text-anchor="end" font-family="JetBrains Mono" font-size="22" fill="#c9cfe0" opacity="${(.7 * pc).toFixed(2)}">R² = 1 sería acuerdo perfecto</text>`;
    return `<svg viewBox="0 0 1080 1060">${s}</svg>`;
  }
},
// ---------------------------------------------------------------- 4. Por sitio
{
  bg: 'linear-gradient(180deg,#1f2440 0%,#30365c 100%)',
  estrellas: false,
  hud: { cap: 'Por sitio', datos: ['R² 0,69 · N = 19', 'sesgo −0,17'] },
  claves: ['promedias', 'sitio', 'cambia', 'gedi', 'sentinel'],
  draw(lt, dur, i) {
    const { f, tag, nube } = CL;
    const tP = CL.at(i, 'promedias', dur * .52), tCa = CL.at(i, 'cambia', dur * .61), tR = CL.at(i, 'cuadrado', dur * .84), t69 = CL.at(i, ['0,69', 'sesenta'], dur * .9);
    const X = u => 280 + u * 520, Y = w => 650 - w * 520;
    let s = '';
    s += `<rect x="280" y="130" width="520" height="520" fill="#191c33" rx="4"/>`;
    for (let k = 1; k < 4; k++) s += `<path d="M${280 + k * 130} 130V650M280 ${130 + k * 130}H800" stroke="#fff" stroke-opacity=".05"/>`;
    s += `<path d="M280 130V650H800" stroke="#c9cfe0" stroke-width="3" fill="none"/>`;
    const g1 = H.p(lt, tCa - .2, tCa + .4);
    s += `<line x1="280" y1="650" x2="800" y2="130" stroke="${g1 > .5 ? '#ffd166' : '#fff'}" stroke-opacity="${(.45 + .4 * g1).toFixed(2)}" stroke-width="${f(2.5 + 2 * g1)}" stroke-dasharray="10 9"/>`;
    s += `<text x="785" y="160" text-anchor="end" font-family="JetBrains Mono" font-size="24" fill="#c9cfe0" opacity=".7">1:1</text>`;
    s += `<text x="248" y="390" text-anchor="middle" transform="rotate(-90 248 390)" font-family="JetBrains Mono" font-weight="700" font-size="26" fill="#ff6b6b">LAI GEDI</text>`;
    s += `<text x="540" y="694" text-anchor="middle" font-family="JetBrains Mono" font-weight="700" font-size="26" fill="#6cc4ff">LAI Sentinel-2</text>`;
    const colr = H.p(lt, .3, 2.2), av = H.eio(H.pl(lt, tP, tP + 1.4));
    const hue = sidx => `hsl(${(sidx * 360 / 19 + 190) % 360},75%,68%)`;
    nube.pts.forEach((p, k) => {
      const st = nube.sites[p.s];
      const x = H.lerp(X(p.u), X(st.u), av), y = H.lerp(Y(p.w), Y(st.w), av);
      const rr = 7 + .8 * Math.sin(lt * 3 + k);
      s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rr)}" fill="${colr > .02 ? hue(p.s) : '#dfe6ff'}" opacity="${(.75 * (1 - .6 * H.p(lt, tP + 1.2, tP + 1.6))).toFixed(2)}"/>`;
    });
    const big = H.p(lt, tP + 1.1, tP + 1.6);
    if (big > 0) nube.sites.forEach((st, k) => {
      const x = X(st.u), y = Y(st.w), dx = st.su * 520, dy = st.sw * 520;
      s += `<g opacity="${big.toFixed(2)}"><path d="M${f(x - dx)} ${f(y)}H${f(x + dx)}M${f(x)} ${f(y - dy)}V${f(y + dy)}" stroke="${hue(k)}" stroke-width="2.5" opacity=".7"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(11 + 1.5 * Math.sin(lt * 3 + k))}" fill="${hue(k)}" stroke="#0d1020" stroke-width="2.5"/></g>`;
    });
    // recta de regresión
    const rg = H.p(lt, tCa, tCa + 1);
    if (rg > 0) {
      const x0 = .03, x1 = .72, y0 = nube.a + nube.b * x0, y1 = nube.a + nube.b * x1;
      const xe = H.lerp(x0, x1, rg), ye = H.lerp(y0, y1, rg);
      s += `<line x1="${f(X(x0))}" y1="${f(Y(y0))}" x2="${f(X(xe))}" y2="${f(Y(ye))}" stroke="#ffffff" stroke-width="4"/>`;
    }
    s += tag(300, 172, 'N = 19 sitios', { fs: 24, col: '#7CFFB2', op: big });
    // contador R²
    const v = .31 + .38 * H.p(lt, tR - .2, t69), pop = H.p(lt, t69, t69 + .4);
    s += `<text x="1040" y="200" text-anchor="end" font-family="JetBrains Mono" font-weight="700" font-size="34" fill="#c9cfe0">R²</text>`;
    s += `<text x="1040" y="290" text-anchor="end" font-family="Inter" font-weight="800" font-size="${f(84 * (1 + .15 * Math.sin(Math.PI * pop)))}" fill="#ffd166">${H.num(v, 2)}</text>`;
    // barras
    const rows = [[790, 'por huella', '#c9cfe0', .31], [900, 'por sitio', '#7CFFB2', v]];
    rows.forEach(([y, lab, col, vv]) => {
      s += `<text x="110" y="${y - 22}" font-family="JetBrains Mono" font-weight="700" font-size="26" fill="${col}">${lab}</text>`;
      s += `<rect x="110" y="${y}" width="700" height="32" rx="16" fill="#fff" fill-opacity=".1"/><rect x="110" y="${y}" width="${f(700 * vv)}" height="32" rx="16" fill="${col}"/>`;
      s += `<text x="830" y="${y + 28}" font-family="Inter" font-weight="800" font-size="40" fill="#ffd166">R² ${H.num(vv, 2)}</text>`;
    });
    s += `<text x="110" y="1000" font-family="JetBrains Mono" font-size="22" fill="#c9cfe0" opacity=".75">GEDI frente a Sentinel-2 de 20 m</text>`;
    return `<svg viewBox="0 0 1080 1060">${s}</svg>`;
  }
},
// ---------------------------------------------------------------- 5. Saturación
{
  bg: 'linear-gradient(180deg,#18302f 0%,#264845 100%)',
  estrellas: false,
  hud: { cap: 'La trampa: saturación', datos: ['S2 casi no pasa de 3', 'GEDI llega a 8'] },
  claves: ['satura', 'dosel', 'láser', 'gedi', 'sentinel', 'óptico'],
  draw(lt, dur, i) {
    const { f, tag, slab, sat, iss, mix, cl } = CL;
    const tS = CL.at(i, 'Sentinel', dur * .5), t3 = CL.at(i, ['3', 'tres'], dur * .65), tG = CL.at(i, 'GEDI', dur * .7), t8 = CL.at(i, ['8', 'ocho'], dur * .76),
      tSa = CL.at(i, 'satura', dur * .85), tLa = CL.at(i, 'láser', dur * .93);
    const F = 1 + 2 * H.p(lt, tS, t3 + .3) + 5 * H.p(lt, tG - .1, t8 + .2);
    const s2 = 3 * Math.tanh(F / 2.2) / Math.tanh(8 / 2.2);
    const cx = 540, gy = 945, a = 190, b = 78, U = 50;
    let s = '';
    // suelo
    s += slab(cx, gy, a + 20, b + 8, 20, '#5b4a35', '#43362a', '#382d22');
    // pisos de hojas
    const nf = Math.ceil(F - 1e-6);
    for (let k = 1; k <= Math.min(8, nf); k++) {
      const pk = cl(F - (k - 1)), y = gy - k * U - 30 * (1 - pk);
      const top = mix('#2f7d49', '#7ed38a', k / 8);
      s += slab(cx, y, a, b, 12, top, mix('#1e5232', '#3a8f52', k / 8), mix('#18452a', '#2f7d49', k / 8), pk * .95);
    }
    const yTop = gy - F * U;
    // satélite y luz reflejada (solo de la capa de arriba)
    const sx = 220, sy = 215 + 6 * Math.sin(lt * 1.4);
    s += sat(sx, sy, .85, -10 + 4 * Math.sin(lt * .6));
    for (let k = 0; k < 4; k++) {
      const x0 = cx - 120 + k * 70, y0 = yTop + 10 + Math.abs(k - 1.5) * 12;
      s += `<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(sx + 10)}" y2="${f(sy + 46)}" stroke="#6cc4ff" stroke-width="3" stroke-dasharray="10 12" stroke-dashoffset="${f(lt * 60)}" opacity=".75"/>`;
    }
    const sat3 = H.p(lt, tSa - .3, tSa + .3);
    // ISS y láser que atraviesa todos los pisos
    const ix = 840, iy = 165 + 6 * Math.sin(lt * 1.1);
    s += iss(ix, iy, .7);
    const gx2 = 590, gy2 = gy + 4;
    s += `<line x1="${ix}" y1="${f(iy + 26)}" x2="${gx2}" y2="${gy2}" stroke="#ff6b6b" stroke-width="4" opacity=".85"/>`;
    for (let k = 0; k < 4; k++) { const ph = (lt * 1.1 + k / 4) % 1; s += `<circle cx="${f(H.lerp(ix, gx2, ph))}" cy="${f(H.lerp(iy + 26, gy2, ph))}" r="7" fill="#ffd0d0"/>`; }
    for (let k = 1; k <= Math.min(8, nf); k++) {
      const yk = gy - k * U, ph = (yk - iy - 26) / (gy2 - iy - 26), hx = H.lerp(ix, gx2, ph), fl = .5 + .5 * Math.sin(lt * 6 - k);
      s += `<circle cx="${f(hx)}" cy="${f(yk)}" r="${f(6 + 4 * fl)}" fill="#ff6b6b" opacity="${(.4 + .4 * fl).toFixed(2)}"/>`;
    }
    const pl = H.p(lt, tLa - .3, tLa + .3);
    s += `<ellipse cx="${gx2}" cy="${gy2}" rx="${f(22 + 8 * Math.sin(lt * 5))}" ry="9" fill="#ff6b6b" opacity="${(.5 + .5 * pl).toFixed(2)}"/>`;
    // techo de Sentinel-2
    const yc = gy - 3 * U, pt = H.p(lt, t3 - .3, t3 + .3);
    s += `<line x1="60" y1="${yc}" x2="1020" y2="${yc}" stroke="#ff8a5c" stroke-width="3" stroke-dasharray="14 10" opacity="${(pt * (.6 + .4 * sat3 * (.5 + .5 * Math.sin(lt * 6)))).toFixed(2)}"/>`;
    // medidores
    const meter = (x, v, col, lbl, an) => {
      let g = `<rect x="${x}" y="${gy - 8 * U}" width="50" height="${8 * U}" rx="10" fill="#0d1020" opacity=".7"/>`;
      g += `<rect x="${x + 6}" y="${f(gy - v * U)}" width="38" height="${f(Math.max(0, v * U - 6))}" rx="7" fill="${col}"/>`;
      return g;
    };
    s += meter(60, s2, sat3 > .5 ? '#ff8a5c' : '#6cc4ff');
    s += meter(970, F, '#ff6b6b');
    s += `<text x="85" y="${gy - 8 * U - 22}" text-anchor="middle" font-family="Inter" font-weight="800" font-size="76" fill="#ffd166">${Math.round(s2)}</text>`;
    s += `<text x="995" y="${gy - 8 * U - 22}" text-anchor="middle" font-family="Inter" font-weight="800" font-size="76" fill="#ffd166">${Math.round(F)}</text>`;
    s += tag(30, gy - 8 * U - 135, 'Sentinel-2', { col: '#6cc4ff', fs: 24 });
    s += tag(1050, gy - 8 * U - 135, 'GEDI', { col: '#ff6b6b', fs: 24, anchor: 'end' });
    s += `<text x="122" y="${yc + 10}" font-family="JetBrains Mono" font-weight="700" font-size="28" fill="#ff8a5c" opacity="${pt.toFixed(2)}">3</text>`;
    s += `<text x="958" y="${gy - 8 * U + 10}" text-anchor="end" font-family="JetBrains Mono" font-weight="700" font-size="28" fill="#ff6b6b" opacity="${H.p(lt, t8 - .2, t8 + .2).toFixed(2)}">8</text>`;
    s += tag(130, yc - 40, 'satura', { col: '#ff8a5c', op: sat3, border: '#ff8a5c' });
    s += tag(gx2 + 40, 1035, 'llega al suelo', { col: '#ff6b6b', op: pl });
    return `<svg viewBox="0 0 1080 1060">${s}</svg>`;
  }
},
// ---------------------------------------------------------------- 6. Contra las fotos hemisféricas
{
  bg: 'linear-gradient(180deg,#1c2040 0%,#2b2e56 100%)',
  estrellas: false,
  hud: { cap: 'Contra el campo', datos: ['10 sitios con DHP', 'GEDI R² 0,57 total'] },
  claves: ['hemisféricas', 'campo', 'cortos', 'gedi', 'total'],
  draw(lt, dur, i) {
    const { f, tag, bo } = CL;
    const tF = CL.at(i, 'hemisf', dur * .48), tC = CL.at(i, 'campo', dur * .56), tP = CL.at(i, 'productos', dur * .62),
      tCo = CL.at(i, 'cortos', dur * .69), tG = CL.at(i, 'GEDI', dur * .74), tT = CL.at(i, 'total', dur * .9);
    let s = '';
    // foto hemisférica: el dosel visto desde abajo con ojo de pez
    const cx = 640, cy = 280, R = 195, g0 = H.p(lt, .1, 1.6), rot = lt * 4;
    let fe = `<defs><radialGradient id="cielo"><stop offset="0" stop-color="#f4f8ff"/><stop offset=".7" stop-color="#a9cdf2"/><stop offset="1" stop-color="#6d9fd6"/></radialGradient><clipPath id="ojo"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath></defs>`;
    fe += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#cielo)"/><g clip-path="url(#ojo)"><g transform="rotate(${f(rot)} ${cx} ${cy})">`;
    const r = H.rnd(31);
    for (let k = 0; k < 11; k++) {
      const an = k / 11 * Math.PI * 2 + r() * .3;
      fe += `<line x1="${f(cx + Math.cos(an) * R * 1.05)}" y1="${f(cy + Math.sin(an) * R * 1.05)}" x2="${f(cx + Math.cos(an) * R * (1 - .55 * g0))}" y2="${f(cy + Math.sin(an) * R * (1 - .55 * g0))}" stroke="#1b2a1f" stroke-width="${f(14 - k % 3 * 3)}" stroke-linecap="round"/>`;
    }
    for (let k = 0; k < 22; k++) {
      const an = k / 22 * Math.PI * 2 + r() * .4, rr = R * (.62 + r() * .4), sz = (28 + r() * 34) * g0;
      fe += `<circle cx="${f(cx + Math.cos(an) * rr)}" cy="${f(cy + Math.sin(an) * rr)}" r="${f(sz)}" fill="${k % 2 ? '#1f3a26' : '#2a4d31'}"/>`;
    }
    fe += `</g></g><circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#0d1020" stroke-width="10"/>`;
    s += fe;
    // persona con cámara
    const px = 250, py = 470;
    s += `<g transform="translate(${px},${py})"><path d="M-30 0Q0 -12 30 0V-70Q0 -86 -30 -70Z" fill="#5c7bd9"/><rect x="-7" y="-86" width="14" height="10" fill="#d9a07c"/><circle cx="0" cy="-102" r="19" fill="#e8b48f"/><path d="M-19 -106Q-16 -126 0 -124Q16 -126 19 -106Q10 -116 0 -116Q-10 -116 -19 -106Z" fill="#3a2a22"/><path d="M-30 -66L-20 -148M30 -66L20 -148" stroke="#e8b48f" stroke-width="10" stroke-linecap="round"/><rect x="-24" y="-170" width="48" height="24" rx="5" fill="#0d1020"/><circle cx="0" cy="-172" r="10" fill="#6cc4ff" stroke="#0d1020" stroke-width="3"/></g>`;
    const cone = (lt * 40) % 22;
    s += `<path d="M${px} ${py - 170}L${cx - R * .9} ${cy - 40}M${px} ${py - 170}L${cx - R * .6} ${cy + 140}" stroke="#ffd166" stroke-width="2.5" stroke-dasharray="8 14" stroke-dashoffset="${f(-cone)}" opacity=".7"/>`;
    s += tag(cx, cy + R + 36, 'foto hemisférica · ojo de pez', { anchor: 'middle', fs: 22, op: H.p(lt, tF - .3, tF + .3), col: '#ffd166' });
    // sesgo frente al LAI total de campo
    const yC = 625, K = 82, pc = H.p(lt, tC - .3, tC + .4);
    s += tag(60, 575, 'sesgo frente al LAI total de campo', { fs: 22, op: pc });
    if (pc > 0) {
      s += `<line x1="200" y1="${yC}" x2="${f(200 + 800 * pc)}" y2="${yC}" stroke="#ffd166" stroke-width="4" stroke-dasharray="14 8"/>`;
      s += tag(60, yC, 'campo', { fs: 24, col: '#ffd166', op: pc });
    }
    const PR = [['NIS', '#f2a65a', -1.95, .38], ['S2', '#6cc4ff', -1.41, .40], ['GEDI', '#ff6b6b', -1.72, .57]];
    PR.forEach(([n, col, bias, r2], k) => {
      const x = 380 + k * 240, ap = bo(H.pl(lt, tP - .2 + k * .15, tP + .3 + k * .15)), dr = H.eio(H.pl(lt, tCo - .2 + k * .2, tCo + .6 + k * .2));
      if (ap <= 0) return;
      const y = yC - bias * K * dr;
      s += `<line x1="${x}" y1="${yC}" x2="${x}" y2="${f(y)}" stroke="${col}" stroke-width="4" opacity="${(dr).toFixed(2)}"/><path d="M${x - 10} ${f(y - 16)}L${x} ${f(y - 2)}L${x + 10} ${f(y - 16)}" stroke="${col}" stroke-width="4" fill="none" opacity="${dr.toFixed(2)}"/>`;
      s += `<circle cx="${x}" cy="${f(y)}" r="${f(15 * ap)}" fill="${col}" stroke="#0d1020" stroke-width="3"/>`;
      s += `<text x="${x + 26}" y="${f(y + 10)}" font-family="JetBrains Mono" font-weight="700" font-size="28" fill="#ffd166" opacity="${H.p(lt, tCo + .4 + k * .2, tCo + .8 + k * .2).toFixed(2)}">${H.num(bias, 2).replace('-', '−')}</text>`;
      s += tag(x, 815, n, { anchor: 'middle', col, fs: 24, op: ap });
    });
    // R² con el LAI total
    const pr = H.p(lt, tG - .3, tG + .3);
    s += tag(60, 872, 'R² con el LAI total', { fs: 22, op: pr });
    const hi = H.p(lt, tT - .2, tT + .3);
    PR.forEach(([n, col, bias, r2], k) => {
      const y = 915 + k * 52, fill = r2 * H.p(lt, tG + k * .25, tG + .9 + k * .25);
      if (pr <= 0) return;
      const glow = k === 2 ? hi : 0;
      s += `<g opacity="${pr.toFixed(2)}"><text x="60" y="${y + 24}" font-family="JetBrains Mono" font-weight="700" font-size="26" fill="${col}">${n}</text>`;
      s += `<rect x="190" y="${y}" width="640" height="32" rx="16" fill="#fff" fill-opacity=".1"/><rect x="190" y="${y}" width="${f(Math.max(0, 640 * fill))}" height="32" rx="16" fill="${col}" ${glow > 0 ? `stroke="#ffd166" stroke-width="${f(4 * glow)}"` : ''}/>`;
      if (fill > .005) s += `<text x="850" y="${y + 28}" font-family="Inter" font-weight="800" font-size="36" fill="#ffd166">${H.num(fill, 2)}</text>`;
      s += `</g>`;
    });
    s += tag(1040, 1019, 'mejor', { anchor: 'end', col: '#ffd166', op: hi, fs: 22, border: '#ffd166' });
    return `<svg viewBox="0 0 1080 1060">${s}</svg>`;
  }
},
// ---------------------------------------------------------------- 7. Fenología
{
  bg: 'linear-gradient(180deg,#2a303d 0%,#3b4252 100%)',
  estrellas: false,
  hud: { cap: 'En el tiempo', datos: ['11 de 13 sitios', 'NSE ≥ 0,7'] },
  claves: ['tiempo', 'juntos', 'hojas', 'nse', 'suben', 'bajan'],
  draw(lt, dur, i) {
    const { f, tag, bo, tree } = CL;
    const tT = CL.at(i, 'tiempo', dur * .43), tSu = CL.at(i, 'suben', dur * .54), tE = CL.at(i, 'época', dur * .64), tHo = CL.at(i, 'hojas', dur * .66),
      t11 = CL.at(i, ['11', 'once'], dur * .71), tN = CL.at(i, 'NSE', dur * .86);
    const X0 = 90, X1 = 860, YB = 470, M = 45, X = m => X0 + (X1 - X0) * m / M, Yv = v => YB - v * 300;
    const leaf = m => { const ph = ((m % 12) + 12) % 12; return ph >= 1 && ph <= 7 ? Math.pow(Math.sin(Math.PI * (ph - 1) / 6), .7) : 0; };
    let s = '';
    s += `<rect x="${X0}" y="120" width="${X1 - X0}" height="350" fill="#1f2430" rx="4"/>`;
    for (const y0 of [0, 12, 24, 36]) s += `<rect x="${f(X(y0 + 1))}" y="120" width="${f(X(y0 + 7) - X(y0 + 1))}" height="350" fill="#8b93a6" opacity=".22"/>`;
    s += `<path d="M${X0} 120V${YB}H${X1}" stroke="#c9cfe0" stroke-width="3" fill="none"/>`;
    s += `<text x="${X0}" y="${YB + 36}" font-family="JetBrains Mono" font-size="24" fill="#c9cfe0">2019</text><text x="${X1}" y="${YB + 36}" text-anchor="end" font-family="JetBrains Mono" font-size="24" fill="#c9cfe0">2023</text>`;
    s += `<text x="${X0 - 18}" y="300" text-anchor="middle" transform="rotate(-90 ${X0 - 18} 300)" font-family="JetBrains Mono" font-weight="700" font-size="22" fill="#c9cfe0">LAI</text>`;
    const cur = M * H.pl(lt, .3, Math.max(4, tHo + .3));
    // Sentinel-2 en azul
    let d = '';
    for (let m = 0; m <= cur + 1e-6; m += .5) { const v = .14 + .62 * leaf(m) + .02 * Math.sin(m * 3.1); d += (d ? 'L' : 'M') + f(X(m)) + ' ' + f(Yv(v)); }
    if (d) s += `<path d="${d}" stroke="#6cc4ff" stroke-width="5" fill="none" stroke-linejoin="round"/>`;
    // GEDI en rojo (huellas sueltas)
    const r = H.rnd(41);
    for (let k = 0; k < 70; k++) {
      const m = k * .64 + r() * .5, v = .12 + .8 * leaf(m) + (r() - .5) * .16;
      if (m > cur) continue;
      const fresh = H.pl(cur - m, 0, 1.5);
      s += `<circle cx="${f(X(m))}" cy="${f(Yv(Math.max(.03, v)))}" r="${f(6 + 4 * (1 - fresh))}" fill="#ff6b6b" opacity=".9"/>`;
    }
    s += `<line x1="${f(X(cur))}" y1="120" x2="${f(X(cur))}" y2="${YB}" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>`;
    s += tag(X(1) + 6, 148, 'época con hoja', { fs: 20, op: H.p(lt, tE - .3, tE + .3), col: '#e9ecf3' });
    s += `<circle cx="380" cy="${YB + 28}" r="8" fill="#ff6b6b"/><text x="396" y="${YB + 36}" font-family="JetBrains Mono" font-weight="700" font-size="24" fill="#ff6b6b">GEDI</text>`;
    s += `<line x1="520" y1="${YB + 28}" x2="556" y2="${YB + 28}" stroke="#6cc4ff" stroke-width="5"/><text x="566" y="${YB + 36}" font-family="JetBrains Mono" font-weight="700" font-size="24" fill="#6cc4ff">Sentinel-2</text>`;
    // árbol que gana y pierde hojas según el cursor
    const lv = leaf(cur), rot = 2 * Math.sin(lt * 1.2);
    s += `<g transform="translate(965,${360}) rotate(${f(rot)})"><rect x="-7" y="-10" width="14" height="80" rx="3" fill="#6b4a33"/><path d="M0 -10L-34 -70M0 0L36 -60M-18 -40L-30 -95M18 -30L40 -90" stroke="#6b4a33" stroke-width="7" stroke-linecap="round"/><g opacity="${lv.toFixed(2)}"><circle cx="0" cy="-70" r="${f(30 + 30 * lv)}" fill="#46a35e"/><circle cx="-34" cy="-50" r="${f(20 + 20 * lv)}" fill="#3f9b5b"/><circle cx="34" cy="-55" r="${f(20 + 20 * lv)}" fill="#5cb86e"/></g></g>`;
    s += tag(965, 465, lv > .3 ? 'con hoja' : 'sin hoja', { anchor: 'middle', fs: 20, col: lv > .3 ? '#7CFFB2' : '#c9cfe0' });
    // 13 sitios y su NSE (Fig. 8)
    const SI = [['BLAN', .97], ['LENO', .94], ['SCBI', .93], ['UNDE', .90], ['CHEQ', .89], ['TALL', .89], ['TREE', .88], ['HARV', .85], ['ABBY', .79], ['REDB', .77], ['MCRA', .71], ['NIWO', .52], ['WREF', .43]];
    let cnt = 0;
    const ph = H.p(lt, t11 - 1.7, t11 - 1.2);
    SI.forEach(([c, v], j) => {
      const t0 = t11 - 1.45 + j * .1, p = bo(H.pl(lt, t0, t0 + .35));
      if (p <= 0) return;
      const ok = v >= .7; if (ok && p > .6) cnt++;
      const col = j % 5, row = Math.floor(j / 5), x = 66 + col * 192, y = 660 + row * 108;
      s += `<g transform="translate(${x + 90},${y + 48}) scale(${p.toFixed(2)}) translate(-90,-48)"><rect width="180" height="96" rx="12" fill="#151a26" stroke="${ok ? '#7CFFB2' : '#ff6b6b'}" stroke-width="${ok ? 2.5 : 2}" stroke-opacity="${ok ? .8 : .7}"/>`;
      s += `<text x="14" y="40" font-family="Inter" font-weight="700" font-size="26" fill="#fff">${c}</text><text x="168" y="40" text-anchor="end" font-family="JetBrains Mono" font-weight="700" font-size="22" fill="${ok ? '#7CFFB2' : '#ff8a8a'}">${H.num(v, 2)}</text>`;
      s += `<rect x="16" y="62" width="148" height="12" rx="6" fill="#fff" fill-opacity=".12"/><rect x="16" y="62" width="${f(148 * v)}" height="12" rx="6" fill="${ok ? '#7CFFB2' : '#ff6b6b'}"/><line x1="${f(16 + 148 * .7)}" y1="56" x2="${f(16 + 148 * .7)}" y2="80" stroke="#ffd166" stroke-width="3"/></g>`;
    });
    if (ph > 0) {
      const pn = H.p(lt, tN - .2, tN + .3);
      s += `<g opacity="${ph.toFixed(2)}"><text x="66" y="622" font-family="Inter" font-weight="800" font-size="74" fill="#ffd166">${cnt} de 13</text>`;
      s += `<text x="${66 + 330}" y="612" font-family="JetBrains Mono" font-weight="700" font-size="28" fill="#e9ecf3">sitios con <tspan fill="#ffd166" font-size="${f(28 + 6 * pn)}">NSE ≥ 0,7</tspan></text></g>`;
    }
    s += `<text x="1014" y="1008" text-anchor="end" font-family="JetBrains Mono" font-size="20" fill="#c9cfe0" opacity="${(.7 * ph).toFixed(2)}">línea amarilla = 0,7</text>`;
    return `<svg viewBox="0 0 1080 1060">${s}</svg>`;
  }
},
// ---------------------------------------------------------------- 8. Fusión
{
  bg: 'linear-gradient(180deg,#261c3a 0%,#40305c 100%)',
  hud: { cap: 'En resumen', datos: ['láser + óptico', '= fusión'] },
  claves: ['láser', 'estructura', 'óptico', 'continuo', 'fusionarlos', 'satura'],
  draw(lt, dur, i) {
    const { f, tag, ramp, cl } = CL;
    const tL = CL.at(i, 'láser', dur * .5), tE = CL.at(i, 'estructura', dur * .53), tO = CL.at(i, 'óptico', dur * .58), tSa = CL.at(i, 'satura', dur * .61),
      tMa = CL.at(i, 'mapa', dur * .71), tFa = CL.at(i, 'falta', dur * .8), tFu = CL.at(i, 'fusion', dur * .92);
    const mg = H.eio(H.pl(lt, tFu - .5, tFu + .7));
    const N = 10, A = 330, B = 150, cx = 540;
    const L = H.lerp(330, 560, mg) + 6 * Math.sin(lt * 1.3) * (1 - mg), O = H.lerp(765, 560, mg) + 6 * Math.sin(lt * 1.3 + 2) * (1 - mg);
    const P = (u, v, cy) => [cx + (u - v) * A / N, cy - B + (u + v) * B / N];
    const r = H.rnd(53), val = [];
    for (let u = 0; u < N; u++) for (let v = 0; v < N; v++) val.push(cl(.45 + .35 * Math.sin(u * .7 + 1) * Math.cos(v * .6 - .5) + .25 * (r() - .5) + (u > 5 && v < 5 ? .3 : 0)));
    let s = '';
    // capa óptica: mapa continuo
    const sat = H.p(lt, tSa - .3, tSa + .3), fix = H.p(lt, tFu + .2, tFu + 1.2), scan = H.p(lt, tMa - .3, tMa + 1.4);
    let opt = '';
    for (let u = 0; u < N; u++) for (let v = 0; v < N; v++) {
      const w = val[u * N + v], capd = w > .62 ? H.lerp(w, .62, sat * (1 - fix)) : w;
      const p0 = P(u, v, O), p1 = P(u + 1, v, O), p2 = P(u + 1, v + 1, O), p3 = P(u, v + 1, O);
      const hl = scan > 0 && scan < 1 && Math.abs((u + v) / (2 * N) - scan) < .06 ? ' stroke="#fff" stroke-width="2"' : ' stroke="#1b1530" stroke-width="1"';
      opt += `<polygon points="${p0.map(f)} ${p1.map(f)} ${p2.map(f)} ${p3.map(f)}" fill="${ramp(capd)}"${hl}/>`;
    }
    const tb = 18;
    s += `<polygon points="${f(cx - A)},${f(O)} ${f(cx)},${f(O + B)} ${f(cx)},${f(O + B + tb)} ${f(cx - A)},${f(O + tb)}" fill="#2a2140"/><polygon points="${f(cx)},${f(O + B)} ${f(cx + A)},${f(O)} ${f(cx + A)},${f(O + tb)} ${f(cx)},${f(O + B + tb)}" fill="#211a35"/>`;
    s += opt;
    if (sat * (1 - fix) > 0) { const [x, y] = P(8, 2.5, O); s += tag(x + 40, y - 60, 'satura', { col: '#ff8a5c', op: sat * (1 - fix), border: '#ff8a5c' }); }
    // capa láser: muestras con estructura vertical
    const lay = 1 - mg;
    if (lay > 0) {
      s += `<g opacity="${(.85 * lay).toFixed(2)}"><polygon points="${CL.dia(cx, L, A, B)}" fill="#120e22" fill-opacity=".55" stroke="#ff6b6b" stroke-opacity=".5" stroke-width="2"/>`;
      for (let k = 1; k < N; k++) { const a0 = P(k, 0, L), a1 = P(k, N, L), b0 = P(0, k, L), b1 = P(N, k, L); s += `<path d="M${a0.map(f)}L${a1.map(f)}M${b0.map(f)}L${b1.map(f)}" stroke="#fff" stroke-opacity=".08"/>`; }
      s += `</g>`;
      const pf = H.p(lt, tFa - .3, tFa + .3);
      if (pf > 0) [[1, 7], [4, 1], [8, 7], [6, 4], [2, 3]].forEach(([u, v], k) => { const [x, y] = P(u + .5, v + .5, L); s += `<text x="${f(x)}" y="${f(y + 10)}" text-anchor="middle" font-family="Inter" font-weight="800" font-size="30" fill="#ffd166" opacity="${(pf * lay * (.6 + .4 * Math.sin(lt * 5 + k))).toFixed(2)}">?</text>`; });
    }
    const gr = H.p(lt, tL - .2, tE + .6);
    const FP = [[1.5, .5], [2.5, 2.2], [3.5, 3.9], [4.5, 5.6], [5.5, 7.3], [6.5, 9], [5.6, .6], [6.6, 2.3], [7.6, 4], [8.6, 5.7], [9.5, 7.4]];
    FP.forEach(([u, v], k) => {
      const yy = H.lerp(L, O, mg), [x, y] = P(u, v, yy), w = val[Math.min(N - 1, Math.floor(u)) * N + Math.min(N - 1, Math.floor(v))];
      const h = (40 + 110 * w) * gr * (1 - .6 * mg), ph = (lt * .9 + k * .13) % 1;
      s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="20" ry="9" fill="#ff6b6b" fill-opacity=".35" stroke="#ff6b6b" stroke-width="2.5"/>`;
      if (h > 1) s += `<line x1="${f(x)}" y1="${f(y)}" x2="${f(x)}" y2="${f(y - h)}" stroke="#ff6b6b" stroke-width="5" stroke-linecap="round"/><circle cx="${f(x)}" cy="${f(y - h * ph)}" r="5" fill="#ffd0d0"/>`;
    });
    // etiquetas
    s += tag(cx, 145, 'láser · estructura', { anchor: 'middle', col: '#ff6b6b', op: H.p(lt, tL - .3, tL + .3) * (1 - mg), border: H.p(lt, tE - .2, tE + .2) > .5 && lt < tO ? '#ff6b6b' : '' });
    s += tag(cx, 975, 'óptico · mapa continuo', { anchor: 'middle', col: '#7CFFB2', op: H.p(lt, tO - .3, tO + .3) * (1 - mg), border: scan > 0 && scan < 1 ? '#7CFFB2' : '' });
    // fusión
    const fw = H.p(lt, tFu - .1, tFu + .6);
    if (fw > 0) {
      const sc = CL.bo(fw), pul = 1 + .03 * Math.sin(lt * 4);
      s += `<g transform="translate(540,900) scale(${f(sc * pul)})" opacity="${fw.toFixed(2)}"><text x="0" y="0" text-anchor="middle" font-family="Inter" font-weight="800" font-size="140" fill="#ffd166">fusión</text></g>`;
      s += tag(540, 965, 'láser + óptico', { anchor: 'middle', op: H.p(lt, tFu + .5, tFu + .9), fs: 24 });
    }
    return `<svg viewBox="0 0 1080 1060">${s}</svg>`;
  }
}
];
