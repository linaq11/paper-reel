"""Rutas y claves. Las claves nunca van en el repositorio: se leen de variables de entorno o de un archivo indicado en .env."""
import os
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
MOTOR = RAIZ / 'motor'
BIBLIOTECA = RAIZ / 'biblioteca' / 'biblioteca.js'
FPS = 24


def _env():
    """Lee un .env simple (CLAVE=valor) en el directorio actual o en la raíz del repositorio."""
    vals = {}
    for p in (Path.cwd() / '.env', RAIZ.parent / '.env'):
        if p.exists():
            for linea in p.read_text(encoding='utf-8').splitlines():
                if '=' in linea and not linea.strip().startswith('#'):
                    k, v = linea.split('=', 1)
                    vals[k.strip()] = v.strip().strip('"').strip("'")
    return vals


def clave(nombre):
    """Busca NOMBRE en el entorno o en .env; si el valor es una ruta a un archivo existente, devuelve su contenido."""
    v = os.environ.get(nombre) or _env().get(nombre)
    if not v:
        raise SystemExit(f'Falta {nombre}: defínela como variable de entorno o en .env (ver .env.example).')
    if Path(v).exists():
        v = Path(v).read_text(encoding='utf-8').strip()
    return v


def opcion(nombre, defecto=None):
    return os.environ.get(nombre) or _env().get(nombre) or defecto
