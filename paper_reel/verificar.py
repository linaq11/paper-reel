"""Paso de verificación: toda cifra que se dice o se muestra debe estar en el texto del paper.
Se aceptan cifras derivadas solo si la escena declara el cálculo en 'citas' ({"dato": "4,2", "calculo": "7 x 600 m"})."""
import json, re, sys
from pathlib import Path

NUM = re.compile(r'(?<![\w.,])[-−]?\d[\d.,]*')
TRIVIALES = {0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 10.0, 100.0}   # conteos pequeños que se escriben en palabras o son genéricos


def _valores(tok):
    """Interpreta un número en formato español (3.624 / 0,31) y en inglés (3,624 / 0.31); devuelve las lecturas posibles."""
    tok = tok.replace('−', '-').strip('.,')
    if not tok or not any(c.isdigit() for c in tok):
        return set()
    out = set()
    for mil, dec in (('.', ','), (',', '.')):
        t = tok
        if dec in t and t.count(dec) == 1:
            ent, frac = t.split(dec)
            ent = ent.replace(mil, '')
            t = ent + '.' + frac
        else:
            t = t.replace(mil, '')
        try:
            out.add(round(float(t), 6))
        except ValueError:
            pass
    return out


def numeros_paper(texto):
    s = set()
    for t in NUM.findall(texto):
        s |= _valores(t)
    return s


# claves de encuadre y estilo: son posiciones o tamaños en pantalla, no cifras del artículo
GEOMETRIA = {'x', 'y', 'cx', 'cy', 'x0', 'y0', 'x1', 'y1', 'ancho', 'alto', 'aspecto', 'escala', 'zoom', 'r', 'radio', 'rot', 'giro',
             'dx', 'dy', 'pos', 'posicion', 'region', 'recuadro', 'recuadros', 'semilla', 'color', 'colores', 'fondo', 'velocidad', 'opacidad'}


def _cadenas(obj):
    if isinstance(obj, str):
        yield obj
    elif isinstance(obj, (int, float)) and not isinstance(obj, bool):
        yield str(obj)
    elif isinstance(obj, dict):
        for k, v in obj.items():
            if k in GEOMETRIA or k in ('palabra', 'plantilla', 'figura', 'id') or k.startswith('palabra'):
                # dentro de un recuadro puede ir un rótulo visible: ese sí se revisa
                if isinstance(v, (dict, list)) and k in ('recuadro', 'recuadros', 'region'):
                    yield from (s for s in _cadenas(v) if not s.replace('.', '', 1).replace('-', '', 1).isdigit())
                continue
            yield from _cadenas(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from _cadenas(v)


def _palabras_clave(o):
    """Palabras que disparan una animación de plantilla (campos palabra, palabra_inicio, ...). Devuelve grupos:
    un campo con una lista son alternativas, y basta que el texto diga una."""
    if isinstance(o, dict):
        for k, v in o.items():
            if k.startswith('palabra'):
                if isinstance(v, str):
                    yield [v]
                elif isinstance(v, list) and v:
                    yield [str(x) for x in v]
            else:
                yield from _palabras_clave(v)
    elif isinstance(o, list):
        for v in o:
            yield from _palabras_clave(v)


def _sin_tildes(s):
    import unicodedata
    s = unicodedata.normalize('NFD', s.lower())
    return ''.join(c for c in s if unicodedata.category(c) != 'Mn')


def verificar(proyecto):
    proyecto = Path(proyecto)
    texto = (proyecto / 'texto.txt').read_text(encoding='utf-8')
    g = json.loads((proyecto / 'guion.json').read_text(encoding='utf-8-sig'))
    validos = numeros_paper(texto) | TRIVIALES
    problemas, avisos = [], []
    for i, e in enumerate(g['escenas']):
        declarados = {}
        for c in e.get('citas', []):
            for v in _valores(str(c.get('dato', ''))):
                declarados[v] = c
        campos = [e.get('texto', ''), e.get('hud', {}), e.get('params', {})]
        for s in _cadenas(campos):
            for tok in NUM.findall(s):
                vals = _valores(tok)
                if not vals or vals & validos:
                    continue
                c = next((declarados[v] for v in vals if v in declarados), None)
                if c and c.get('calculo'):
                    avisos.append(f'escena {i}: {tok} es cálculo propio ({c["calculo"]})')
                elif c and c.get('fuente'):
                    avisos.append(f'escena {i}: {tok} viene de fuera del paper ({c["fuente"]})')
                else:
                    problemas.append(f'escena {i}: "{tok}" no aparece en el paper ni está declarado como cálculo')
        # si el texto se reescribe, una animación puede quedar esperando una palabra que la voz ya no dice
        texto_n = ' ' + re.sub(r'[^\w,.]', ' ', _sin_tildes(e.get('texto', ''))) + ' '
        for grupo in _palabras_clave(e.get('params')):
            if not any(re.sub(r'[^\w,.]', ' ', _sin_tildes(w)).strip() in texto_n for w in grupo):
                problemas.append(f'escena {i}: la animación espera la palabra "{" o ".join(grupo)}", que no está en el texto')
    rep = proyecto / 'verificacion.txt'
    rep.write_text('\n'.join(['PROBLEMAS'] + problemas + ['', 'AVISOS'] + avisos), encoding='utf-8')
    print(f'verificación: {len(problemas)} problemas, {len(avisos)} avisos -> {rep}')
    for p in problemas[:30]:
        print('  ', p)
    return not problemas


if __name__ == '__main__':
    sys.exit(0 if verificar(sys.argv[1]) else 1)
