"""Catálogo de la biblioteca de plantillas de A Paper to Reel, en JSON.

Lee biblioteca.js con node y saca, sin las funciones draw:
  plantillas: [{nombre, descripcion, params, ejemplo, narracion_ejemplo}]
  dibujos:    nombres de DIBUJO (para los params que piden un objeto o icono)
  fondos:     nombres de FONDOS
Lo usa el paso que le pide al modelo de lenguaje elegir plantillas y llenar sus params.

Uso:  python catalogo.py [ruta/a/biblioteca.js] > catalogo.json
"""
import json
import subprocess
import sys
from pathlib import Path

BIB = Path(__file__).resolve().parent / 'biblioteca.js'

JS = r"""
const b = require(process.argv[1]);
const plantillas = Object.entries(b.PLANTILLAS).map(([nombre, p]) => ({
  nombre, descripcion: p.descripcion, params: p.params, ejemplo: p.ejemplo, narracion_ejemplo: p.narracion_ejemplo || ''
}));
console.log(JSON.stringify({plantillas, dibujos: Object.keys(b.DIBUJO), fondos: Object.keys(b.FONDOS)}));
"""


def catalogo(ruta=BIB):
    r = subprocess.run(['node', '-e', JS, str(Path(ruta).resolve())], capture_output=True, text=True, encoding='utf-8')
    if r.returncode != 0:
        raise RuntimeError('node no pudo leer %s:\n%s' % (ruta, r.stderr))
    return json.loads(r.stdout)


if __name__ == '__main__':
    datos = catalogo(sys.argv[1] if len(sys.argv) > 1 else BIB)
    sys.stdout.reconfigure(encoding='utf-8')
    print(json.dumps(datos, ensure_ascii=False, indent=1))
