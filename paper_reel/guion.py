"""Borrador del guion con un modelo de lenguaje (Gemini): escenas por capítulo, cada una con plantilla, parámetros y citas.
El borrador SIEMPRE pasa por verificar.py antes de grabar voces: el modelo puede equivocarse en una cifra."""
import json, subprocess, sys, urllib.request
from pathlib import Path
from .config import clave, opcion, RAIZ

INSTRUCCIONES = """Eres guionista de videos explicativos animados de artículos científicos, al estilo de los reels de divulgación
(una ilustración que cambia con cada frase, narración cercana y clara). Lee el artículo y escribe el guion completo en {idioma}.

Reglas:
- Explica el artículo entero, en el orden de sus secciones: pregunta y contexto, datos y métodos, resultados, discusión y límites, conclusión.
  Usa entre {min_e} y {max_e} escenas; cada escena es una o dos frases habladas (15 a 40 palabras).
- Cada cifra que se diga o se muestre debe estar en el texto del artículo; cítala en "citas" con su página.
  Si es un cálculo tuyo (por ejemplo una resta), decláralo con "calculo". No inventes cifras ni valores de ejes.
- Explica cada término técnico la primera vez que aparece, con palabras simples.
- No digas "para el parcial", "para el examen" ni frases de relleno; no termines con moralejas.
- Para cada escena elige UNA plantilla del catálogo y llena sus parámetros según su esquema. Los parámetros de tipo
  "palabra" deben ser palabras que aparecen literalmente en el texto de esa escena (ahí ocurre el evento animado).
  Para mostrar una figura del artículo usa la plantilla figura_paper con "figura" igual a un id de la lista de figuras.
- hud: "cap" es un título corto del capítulo (2 a 5 palabras) y "datos" 1 o 2 líneas cortas con cifras verificadas.
- claves: palabras del texto que conviene enmarcar en el subtítulo.
- fondo: uno de {fondos}.

Devuelve solo JSON con esta forma:
{{"titulo": str, "fuente": "Autor et al. año, Revista", "idioma": "{idioma}", "pronunciacion": {{"SIGLA": "cómo se lee"}},
  "escenas": [{{"capitulo": str, "texto": str, "hud": {{"cap": str, "datos": [str]}}, "claves": [str], "fondo": str,
               "plantilla": str, "params": {{}}, "citas": [{{"dato": str, "pagina": int}}]}}]}}

CATÁLOGO DE PLANTILLAS:
{catalogo}

FIGURAS DISPONIBLES (id, página):
{figuras}

ARTÍCULO (texto por página):
{texto}
"""


def catalogo():
    salida = subprocess.run([sys.executable, str(RAIZ / 'biblioteca' / 'catalogo.py')], capture_output=True, text=True, encoding='utf-8', check=True)
    return salida.stdout


def borrador(proyecto, idioma='es', min_e=24, max_e=32):
    proyecto = Path(proyecto)
    texto = (proyecto / 'texto.txt').read_text(encoding='utf-8')
    figs = json.loads((proyecto / 'figuras.json').read_text(encoding='utf-8')) if (proyecto / 'figuras.json').exists() else []
    cat = catalogo()
    fondos = ', '.join(json.loads(cat).get('fondos', [])) if cat.strip().startswith('{') else 'noche, pizarra, terracota, morado, bosque, indigo'
    prompt = INSTRUCCIONES.format(idioma=idioma, min_e=min_e, max_e=max_e, fondos=fondos, catalogo=cat,
                                  figuras='\n'.join(f"{f['id']} (p. {f['pagina']})" for f in figs), texto=texto)
    modelo = opcion('LLM_MODELO', 'gemini-3.5-flash')
    cuerpo = {'contents': [{'parts': [{'text': prompt}]}], 'generationConfig': {'responseMimeType': 'application/json', 'temperature': 0.4}}
    req = urllib.request.Request(f'https://generativelanguage.googleapis.com/v1beta/models/{modelo}:generateContent',
                                 data=json.dumps(cuerpo).encode(), headers={'x-goog-api-key': clave('GEMINI_API_KEY'), 'Content-Type': 'application/json'})
    r = json.load(urllib.request.urlopen(req, timeout=600))
    g = json.loads(r['candidates'][0]['content']['parts'][0]['text'])
    (proyecto / 'guion.json').write_text(json.dumps(g, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'borrador: {len(g["escenas"])} escenas -> {proyecto / "guion.json"}. Revísalo y corre "verificar" antes de grabar voces.')
    return g
