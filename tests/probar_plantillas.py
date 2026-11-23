"""Prueba visual de la biblioteca de plantillas de A Paper to Reel.

Inserta biblioteca.js y una especificación de prueba (una escena por plantilla, con sus params de ejemplo)
en motor_h.html (1920x1080) y motor.html (1080x1920), arma tiempos falsos de 9 a 14 s por escena con las
palabras de la narración de ejemplo de cada plantilla y guarda PNG de 3 instantes por plantilla en tests/salida/.

Además revisa cada instante con el DOM:
  - textos del escenario fuera del lienzo, bajo y=1000 o dentro de la zona de la etiqueta (x<420, y<110);
  - textos del escenario que se cruzan con el subtítulo o con la etiqueta de capítulo (HUD);
  - textos del escenario que se solapan entre sí;
  - escena estática (el SVG no cambia en 0,1 s);
  - más de 1.500 elementos SVG.

Uso:  python tests/probar_plantillas.py [--solo h|v] [--plantillas nombre1,nombre2]
"""
import argparse
import base64
import io
import json
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
BIB = RAIZ / 'paper_reel' / 'biblioteca' / 'biblioteca.js'
MOTOR = {'h': RAIZ / 'paper_reel' / 'motor' / 'motor_h.html', 'v': RAIZ / 'paper_reel' / 'motor' / 'motor.html'}
TAM = {'h': (1920, 1080), 'v': (1080, 1920)}
SALIDA = Path(__file__).resolve().parent / 'salida'
FRACS = [0.3, 0.62, 0.95]
FONDOS_PRUEBA = ['noche', 'pizarra', 'terracota', 'morado', 'bosque', 'indigo', 'oceano', 'grafito']


def leer_plantillas():
    js = ("const b=require(process.argv[1]);const o={};"
          "for(const[k,v]of Object.entries(b.PLANTILLAS))o[k]={narracion:v.narracion_ejemplo||''};"
          "console.log(JSON.stringify(o));")
    r = subprocess.run(['node', '-e', js, str(BIB)], capture_output=True, text=True, encoding='utf-8')
    if r.returncode != 0:
        sys.exit('node no pudo leer biblioteca.js:\n' + r.stderr)
    return json.loads(r.stdout)


def figura_prueba():
    """PNG simple de 1200x800 que imita una figura de artículo con dos paneles."""
    from PIL import Image, ImageDraw
    im = Image.new('RGB', (1200, 800), 'white')
    d = ImageDraw.Draw(im)
    for k, x0 in enumerate([60, 640]):
        d.rectangle([x0, 60, x0 + 500, 700], outline='black', width=3)
        d.text((x0 + 10, 20), '(%s)' % 'ab'[k], fill='black')
        pts = [(x0 + 20 + j * 40, 600 - (j * 31 % 7) * 50 - (220 if (k == 1 and j == 5) else 0)) for j in range(12)]
        d.line(pts, fill=('#1f77b4', '#d62728')[k], width=5)
        for p in pts:
            d.ellipse([p[0] - 6, p[1] - 6, p[0] + 6, p[1] + 6], fill=('#1f77b4', '#d62728')[k])
    buf = io.BytesIO()
    im.save(buf, 'PNG')
    return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()


def tiempos(info):
    T, ini = [], 0.0
    for nombre, d in info.items():
        ws = d['narracion'].split() or ['(sin', 'narración)']
        dur = max(9.0, min(14.0, len(ws) * 0.42))
        paso = (dur - 1.6) / len(ws)
        T.append({'inicio': round(ini, 3), 'dur': round(dur, 3),
                  'palabras': [[w, round(ini + 0.4 + k * paso, 3)] for k, w in enumerate(ws)]})
        ini += dur
    return T


# Casos de borde que los ejemplos no cubren: (plantilla, params, narración)
VARIANTES = {
    'var_titulo_espacio': ('titulo_pregunta', {'pregunta': '¿Cuánto carbono guardan los bosques tropicales del planeta entero?', 'destacar': 'carbono', 'objetos': ['estacion_espacial'], 'rotulos': ['GEDI'], 'escenario': 'espacio', 'palabra_objetos': 'estación', 'palabra_pregunta': 'cuánto'},
                         'Desde la estación espacial surge una pregunta: ¿cuánto carbono guardan los bosques tropicales?'),
    'var_titulo_lab': ('titulo_pregunta', {'pregunta': '¿Funciona el fármaco?', 'objetos': ['matraz', 'microscopio'], 'rotulos': ['ensayo', 'muestra'], 'escenario': 'laboratorio', 'palabra_pregunta': 'funciona'},
                     'En el laboratorio todo empieza con una duda: ¿funciona el fármaco en estas células o no?'),
    'var_barras_6': ('comparacion_barras', {'titulo': 'Exactitud global por clasificador y sensor combinado', 'barras': [{'rotulo': 'Bosque aleatorio con Sentinel-1 y Sentinel-2 combinados', 'valor': 91.4}, {'rotulo': 'SVM', 'valor': 88.2}, {'rotulo': 'Red neuronal convolucional U-Net', 'valor': 93.7, 'texto': '93,7 % ± 1,2'}, {'rotulo': 'k vecinos', 'valor': 80.1}, {'rotulo': 'Máxima verosimilitud', 'valor': 74.5}, {'rotulo': 'Umbral NDVI', 'valor': 61.0}], 'unidad': ' %', 'maximo': 100, 'resaltar': 'Red neuronal convolucional U-Net', 'palabra_resaltar': 'red'},
                   'Seis métodos compiten y la red neuronal gana por poco al bosque aleatorio en exactitud global.'),
    'var_pasos_6': ('flujo_pasos', {'pasos': [{'titulo': 'Muestreo en campo con GPS diferencial'}, {'titulo': 'Corrección atmosférica', 'detalle': 'Sen2Cor', 'icono': 'satelite'}, {'titulo': 'Índices', 'icono': 'engranaje'}, {'titulo': 'Segmentación', 'detalle': 'SAM', 'icono': 'lupa'}, {'titulo': 'Clasificación', 'icono': 'arbol', 'opciones': {'tipo': 'manglar'}}, {'titulo': 'Validación cruzada espacial por bloques', 'icono': 'documento'}]},
                  'El método tiene seis pasos que van desde el campo hasta la validación cruzada espacial por bloques.'),
    'var_capas_apilar': ('capas', {'capas': [{'rotulo': 'producto final', 'color': '#ffd166'}, {'rotulo': 'modelo', 'color': '#a78bfa'}, {'rotulo': 'índices espectrales derivados de las bandas', 'color': '#6cc4ff'}], 'modo': 'apilar', 'titulo': 'Cadena de datos'},
                       'Sobre los índices se monta el modelo y sobre el modelo, el producto final que se publica.'),
    'var_cuadricula_personas': ('cuadricula', {'porcentaje': 37.5, 'decimales': 1, 'filas': 8, 'columnas': 8, 'forma': 'persona', 'rotulo': 'participantes con respuesta al tratamiento', 'color': '#f2a65a', 'palabra': 'respondió'},
                              'De todos los participantes, el 37,5 por ciento respondió al tratamiento en la primera semana.'),
    'var_curva_umbral': ('curva', {'eje_x': 'dosis', 'eje_y': 'respuesta', 'curvas': [{'rotulo': 'medida en laboratorio', 'valores': [0.1, 0.12, 0.2, 0.45, 0.8, 0.95, 0.98]}], 'umbral': {'posicion': 0.45, 'rotulo': 'dosis eficaz media'}, 'palabra_umbral': 'eficaz'},
                       'La respuesta sube despacio, se dispara en la mitad y la dosis eficaz media marca el punto de giro.'),
    'var_objetos_agua': ('escena_objetos', {'objetos': [{'dibujo': 'satelite', 'x': 0.25, 'y': 0.12, 'movimiento': 'disparar', 'rotulo': 'Sentinel-1', 'palabra': 'radar', 'color_haz': '#6cc4ff'}, {'dibujo': 'globo', 'x': 0.75, 'y': 0.3, 'escala': 0.9, 'movimiento': 'girar', 'rotulo': 'Tierra'}, {'dibujo': 'engranaje', 'x': 0.55, 'y': 0.55, 'escala': 0.6, 'movimiento': 'entrar', 'desde': 'derecha', 'rotulo': 'procesamiento', 'palabra': 'procesa'}], 'suelo': 'agua'},
                       'Sentinel-1 lanza su radar sobre el agua mientras la Tierra gira y en tierra se procesa cada imagen.'),
    'var_figura_ausente': ('figura_paper', {'figura': 'no_existe', 'pie': 'Figura 2 · sin imagen'},
                         'Aquí iría la figura dos del artículo, pero no llegó la imagen.'),
    'var_serie_propia': ('serie_temporal', {'series': [{'rotulo': 'lluvia (mm)', 'valores': [120, 80, 60, 200, 310, 150, 90]}, {'rotulo': 'nivel de la ciénaga (m)', 'valores': [1.1, 1.0, 0.9, 1.2, 1.6, 1.4, 1.2]}, {'rotulo': 'salinidad', 'valores': [30, 34, 36, 28, 20, 24, 27]}], 'inicio': 'enero', 'fin': 'julio', 'escala': 'propia', 'periodos': [{'desde': 0.45, 'hasta': 0.75, 'rotulo': 'temporada de lluvias'}], 'marcas': [{'en': 0.15, 'rotulo': 'dragado'}], 'mostrar_ultimo': True},
                       'De enero a julio la lluvia sube en la temporada de lluvias, el nivel la sigue y la salinidad baja tras el dragado.'),
}


# Escena con defectos a propósito: el detector tiene que señalarlos todos o la prueba no vale.
AUTOPRUEBA = '_autoprueba'
DEFECTOS = (
    'const _DEFECTOS = () => `<svg viewBox="0 0 1080 1060"><text x="-80" y="500" font-size="40" fill="#fff">fuera izquierda</text>'
    '<text x="300" y="1040" font-size="40" fill="#fff">bajo el borde</text><text x="80" y="70" font-size="34" fill="#fff">zona etiqueta</text>'
    '<text x="500" y="600" font-size="40" fill="#fff">AAAAAA</text><text x="510" y="606" font-size="40" fill="#fff">BBBBBB</text></svg>`;\n'
)
# Galería con todos los DIBUJO centrados en una cuadrícula, para revisarlos a ojo.
GALERIA = '_galeria_dibujos'
DEFECTOS += (
    'const _GALERIA = (lt) => { const ns = Object.keys(DIBUJO); let s = "";\n'
    '  const op = {laser: {hasta: null}, contador: {valor: 42, sufijo: "%"}, barra: {valor: 0.7, max: 1, rotulo: "barra", dec: 1},\n'
    '    etiqueta: {texto: "etiqueta", pulso: true}, flecha: {flujo: true, curva: 30}, documento: {titulo: "Autor 2025"},\n'
    '    persona: {pose: "saluda", bata: true}, lupa: {contenido: DIBUJO.arbol(195, 690, .5, lt)}};\n'
    '  ns.forEach((n, k) => { const c = k % 5, r = Math.floor(k / 5), x = 108 + c * 216, y = 205 + r * 205;\n'
    '    const o = Object.assign({}, op[n] || {}); if (n === "lupa") o.contenido = DIBUJO.arbol(x - 11, y + 40, .45, lt);\n'
    '    if (n === "laser") delete o.hasta;\n'
    '    s += _OBJ(n, x, y - 10, .62, lt, o) + _PR.tag(x, y + 82, n, {fs: 18, max: 210}); });\n'
    '  return `<svg viewBox="0 0 1080 1060">${s}</svg>`; };\n'
)
ESPERADOS = ['fuera del lienzo', 'bajo y=1000', 'zona de la etiqueta', 'textos solapados', 'escena estática']


def armar_html(orient, info, T, fig):
    motor = MOTOR[orient].read_text(encoding='utf-8')
    nombres = list(info)
    spec = (
        'const FIGURAS = {fig1: %s};\n' % json.dumps(fig) +
        'const _N = %s, _F = %s, _V = %s;\n' % (json.dumps(nombres), json.dumps(FONDOS_PRUEBA), json.dumps({k: [v[0], v[1]] for k, v in VARIANTES.items()}, ensure_ascii=False)) +
        'const ESCENAS = _N.map((n, k) => ({bg: FONDOS[_F[k % _F.length]], estrellas: _F[k % _F.length] === "noche",\n'
        '  hud: {cap: n, datos: ["dato de prueba", "segunda línea"]}, claves: [],\n'
        '  draw: n === "_autoprueba" ? _DEFECTOS : n === "_galeria_dibujos" ? _GALERIA\n'
        '      : _V[n] ? (lt, dur, i) => PLANTILLAS[_V[n][0]].draw(lt, dur, i, _V[n][1])\n'
        '      : (lt, dur, i) => PLANTILLAS[n].draw(lt, dur, i, PLANTILLAS[n].ejemplo)}));\n'
    )
    html = motor.replace('/*TIEMPOS*/', json.dumps(T, ensure_ascii=False), 1)
    html = html.replace('/*META*/', '{}', 1).replace('/*FUENTE*/', 'prueba de plantillas', 1).replace('/*MARCA*/', 'PAPER-REEL', 1)
    spec = DEFECTOS + spec
    return html.replace('/*ESCENAS*/', BIB.read_text(encoding='utf-8') + '\n' + spec, 1)


REVISAR = r"""
(t) => {
  const W = innerWidth, Hh = innerHeight;
  window.R(t);
  const st = document.getElementById('stage');
  const a = st.innerHTML; window.R(t + 0.1); const b = st.innerHTML; window.R(t);
  const sv = st.querySelector('svg');  // después del último R: R reemplaza el svg y una referencia vieja mide cero
  const sr = sv.getBoundingClientRect(), k = sr.width / 1080;
  const toS = r => ({x: (r.left - sr.left) / k, y: (r.top - sr.top) / k, w: r.width / k, h: r.height / k});
  const vis = el => { let o = 1; for (let e = el; e && e !== sv; e = e.parentElement) { const v = e.getAttribute && e.getAttribute('opacity'); if (v != null) o *= +v; } return o; };
  const avisos = [];
  const capIn = document.querySelector('#cap > div'), cap = capIn && capIn.textContent.trim() ? capIn.getBoundingClientRect() : null;
  const hudR = [...document.querySelectorAll('#hud .chip, #hud .dat')].map(e => e.getBoundingClientRect());
  const inter = (p, q) => Math.max(0, Math.min(p.right, q.right) - Math.max(p.left, q.left)) * Math.max(0, Math.min(p.bottom, q.bottom) - Math.max(p.top, q.top));
  const texts = [...sv.querySelectorAll('text')].filter(e => vis(e) > 0.15 && e.textContent.trim());
  const cajas = texts.map(e => ({e, r: e.getBoundingClientRect()}));
  for (const {e, r} of cajas) {
    const s = toS(r), t0 = e.textContent.trim().slice(0, 40);
    if (s.x < -2 || s.x + s.w > 1082 || s.y < -2) avisos.push(`fuera del lienzo: "${t0}" x=${s.x.toFixed(0)}..${(s.x + s.w).toFixed(0)} y=${s.y.toFixed(0)}`);
    if (s.y + s.h > 1004) avisos.push(`bajo y=1000: "${t0}" (y hasta ${(s.y + s.h).toFixed(0)})`);
    if (s.x < 420 && s.y < 110) avisos.push(`zona de la etiqueta: "${t0}" x=${s.x.toFixed(0)} y=${s.y.toFixed(0)}`);
    if (r.left < 0 || r.right > W || r.top < 0 || r.bottom > Hh) avisos.push(`fuera de la pantalla: "${t0}"`);
    if (cap && inter(r, cap) > 4) avisos.push(`toca el subtítulo: "${t0}"`);
    for (const hr of hudR) if (inter(r, hr) > 4) avisos.push(`toca el HUD: "${t0}"`);
  }
  for (let m = 0; m < cajas.length; m++) for (let n = m + 1; n < cajas.length; n++) {
    const p = cajas[m].r, q = cajas[n].r, ar = inter(p, q), mn = Math.min(p.width * p.height, q.width * q.height);
    if (mn > 0 && ar / mn > 0.2) avisos.push(`textos solapados: "${cajas[m].e.textContent.trim().slice(0, 25)}" / "${cajas[n].e.textContent.trim().slice(0, 25)}"`);
  }
  return {estatica: a === b, elementos: sv.querySelectorAll('*').length, avisos};
}
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--solo', choices=['h', 'v'])
    ap.add_argument('--plantillas', default='')
    args = ap.parse_args()
    from playwright.sync_api import sync_playwright

    info = leer_plantillas()
    for k, v in VARIANTES.items():
        info[k] = {'narracion': v[2]}
    info[GALERIA] = {'narracion': 'galería con todos los dibujos de la biblioteca para revisarlos a ojo uno por uno'}
    info[AUTOPRUEBA] = {'narracion': 'escena de autoprueba con defectos puestos a propósito para comprobar el detector'}
    T = tiempos(info)
    auto = {}
    fig = figura_prueba()
    SALIDA.mkdir(parents=True, exist_ok=True)
    filtro = [x for x in args.plantillas.split(',') if x]
    orients = [args.solo] if args.solo else ['h', 'v']
    informe, errores_js, total_avisos = {}, [], 0
    with sync_playwright() as pw:
        nav = pw.chromium.launch()
        for o in orients:
            w, h = TAM[o]
            pg = nav.new_page(viewport={'width': w, 'height': h})
            pg.on('pageerror', lambda e, o=o: errores_js.append(f'[{o}] {e}'))
            pg.on('console', lambda m, o=o: errores_js.append(f'[{o}] consola: {m.text}') if m.type == 'error' and 'fonts' not in m.text else None)
            pg.set_content(armar_html(o, info, T, fig), wait_until='domcontentloaded')
            pg.evaluate("() => Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 4000))])")
            for k, nombre in enumerate(info):
                if nombre == AUTOPRUEBA:
                    res = pg.evaluate(REVISAR, T[k]['inicio'] + 0.5 * T[k]['dur'])
                    auto[o] = res['avisos'] + (['escena estática'] if res['estatica'] else [])
                    continue
                if filtro and nombre not in filtro:
                    continue
                for j, fr in enumerate(FRACS):
                    t = T[k]['inicio'] + fr * T[k]['dur']
                    try:
                        res = pg.evaluate(REVISAR, t)
                    except Exception as e:  # error dentro de draw
                        errores_js.append(f'[{o}] {nombre} t={fr}: {e}')
                        continue
                    archivo = SALIDA / f'{o}_{k:02d}_{nombre}_{"abc"[j]}.png'
                    pg.screenshot(path=str(archivo))
                    av = list(dict.fromkeys(res['avisos']))
                    if res['estatica']:
                        av.append('escena estática en este instante')
                    if res['elementos'] > 1500:
                        av.append(f'{res["elementos"]} elementos SVG (más de 1.500)')
                    informe[archivo.name] = {'elementos': res['elementos'], 'avisos': av}
                    total_avisos += len(av)
            pg.close()
        nav.close()

    (SALIDA / 'informe.json').write_text(json.dumps(informe, ensure_ascii=False, indent=1), encoding='utf-8')
    for nombre, r in informe.items():
        estado = 'ok' if not r['avisos'] else f'{len(r["avisos"])} aviso(s)'
        print(f'{nombre:52s} {r["elementos"]:5d} elem  {estado}')
        for a in r['avisos']:
            print('    - ' + a)
    for e in errores_js:
        print('ERROR JS ' + e)
    # el detector tiene que haber visto cada defecto sembrado en la escena de autoprueba
    fallos_detector = [f'[{o}] no detecta: {e}' for o, avs in auto.items() for e in ESPERADOS if not any(e in a for a in avs)]
    for fd in fallos_detector:
        print('ERROR DETECTOR ' + fd)
    print(f'\nautoprueba del detector: {"ok" if not fallos_detector else "FALLA"} ({", ".join(f"{o}: {len(a)} avisos" for o, a in auto.items())})')
    print(f'{len(informe)} PNG en {SALIDA}; {total_avisos} avisos; {len(errores_js)} errores JS')
    return 1 if errores_js or fallos_detector else 0


if __name__ == '__main__':
    sys.exit(main())
