"""A Paper to Reel: de un artículo científico (PDF) a un video explicativo animado.

Uso:
  python -m paper_reel extraer   articulo.pdf proyectos/mi_paper
  python -m paper_reel borrador  proyectos/mi_paper            (guion con Gemini; revísalo)
  python -m paper_reel verificar proyectos/mi_paper            (toda cifra debe estar en el paper)
  python -m paper_reel voces     proyectos/mi_paper
  python -m paper_reel tiempos   proyectos/mi_paper
  python -m paper_reel render    proyectos/mi_paper [--vertical] [--cuadros 5,20,40]
  python -m paper_reel todo      articulo.pdf proyectos/mi_paper   (los pasos en orden; se detiene si la verificación falla)
"""
import json, sys
from pathlib import Path


def _guion(p):
    return json.loads((Path(p) / 'guion.json').read_text(encoding='utf-8-sig'))


def main(a):
    if len(a) < 2:
        print(__doc__); return 1
    cmd = a[0]
    if cmd == 'extraer':
        from .extraer import extraer; extraer(a[1], a[2])
    elif cmd == 'borrador':
        from .guion import borrador; borrador(a[1])
    elif cmd == 'verificar':
        from .verificar import verificar; return 0 if verificar(a[1]) else 1
    elif cmd == 'voces':
        from .voz import voces; voces(a[1], _guion(a[1]))
    elif cmd == 'tiempos':
        from .tiempos import tiempos, tiempos_prueba
        (tiempos_prueba if '--prueba' in a else tiempos)(a[1], _guion(a[1]))
    elif cmd == 'render':
        from .render import render
        cuadros = [float(x) for x in a[a.index('--cuadros') + 1].split(',')] if '--cuadros' in a else None
        render(a[1], horizontal='--vertical' not in a, cuadros=cuadros)
    elif cmd == 'todo':
        from .extraer import extraer; from .guion import borrador; from .verificar import verificar
        from .voz import voces; from .tiempos import tiempos; from .render import render
        pdf, p = a[1], a[2]
        extraer(pdf, p)
        if not (Path(p) / 'guion.json').exists():
            borrador(p)
        if not verificar(p):
            print('La verificación encontró cifras sin respaldo. Corrige guion.json y vuelve a correr.'); return 1
        voces(p, _guion(p)); tiempos(p, _guion(p)); render(p, horizontal='--vertical' not in a)
    else:
        print(__doc__); return 1
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
