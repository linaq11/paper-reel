"""Arma la página de animación: motor + biblioteca de plantillas + escenas a la medida + especificación del guion."""
import base64, json
from pathlib import Path
from .config import MOTOR, BIBLIOTECA


def componer(proyecto, guion, tiempos, horizontal=True):
    proyecto = Path(proyecto)
    html = (MOTOR / ('motor_h.html' if horizontal else 'motor.html')).read_text(encoding='utf-8')
    # figuras del paper usadas por las plantillas
    figuras = {}
    for e in guion['escenas']:
        f = (e.get('params') or {}).get('figura')
        if f and f not in figuras:
            ruta = proyecto / 'figuras' / (f if f.endswith('.png') else f + '.png')
            figuras[f] = 'data:image/png;base64,' + base64.b64encode(ruta.read_bytes()).decode()
    # escenas a la medida: cada archivo se encierra en una función para que sus constantes no choquen
    archivos = []
    for e in guion['escenas']:
        a = (e.get('a_medida') or {}).get('archivo')
        if a and a not in archivos:
            archivos.append(a)
    medida = ''
    for k, a in enumerate(archivos):
        ruta = Path(a) if Path(a).is_absolute() else (proyecto / a)
        medida += f'const AM_{k} = (function(){{\n{ruta.read_text(encoding="utf-8")}\nreturn ESCENAS;}})();\n'
    spec = []
    for e in guion['escenas']:
        s = {k: e.get(k) for k in ('hud', 'claves', 'fondo', 'plantilla', 'params')}
        if e.get('a_medida'):
            s['am'] = [archivos.index(e['a_medida']['archivo']), e['a_medida']['indice']]
        spec.append(s)
    js = (BIBLIOTECA.read_text(encoding='utf-8') + '\n'
          + f'const FIGURAS = {json.dumps(figuras)};\n' + medida
          + f'const SPEC = {json.dumps(spec, ensure_ascii=False)};\n'
          + '''const ESCENAS = SPEC.map(s => {
  if (s.am) { const base = eval('AM_' + s.am[0])[s.am[1]];
    return Object.assign({}, base, s.hud ? {hud: s.hud} : {}, s.claves ? {claves: s.claves} : {}); }
  const pl = PLANTILLAS[s.plantilla];
  if (!pl) throw new Error('plantilla desconocida: ' + s.plantilla);
  return {bg: FONDOS[s.fondo] || s.fondo || FONDOS.noche, hud: s.hud, claves: s.claves || [],
          draw: (lt, dur, i) => pl.draw(lt, dur, i, s.params || {})};
});
''')
    html = (html.replace('/*TIEMPOS*/', json.dumps(tiempos, ensure_ascii=False))
                .replace('/*META*/', '{}')
                .replace('/*FUENTE*/', guion.get('fuente', ''))
                .replace('/*MARCA*/', guion.get('marca', ''))
                .replace('/*ESCENAS*/', js))
    salida = proyecto / ('animacion_h.html' if horizontal else 'animacion_v.html')
    salida.write_text(html, encoding='utf-8')
    return salida
