# paper-reel

Convierte un artículo científico en PDF en un video explicativo animado, con narración, subtítulo palabra por palabra e ilustraciones que cambian con cada frase. El estilo se inspira en los reels de divulgación de ilustración plana: fondos de color apagado, contadores y barras que se llenan, etiquetas de datos en letra monoespaciada.

Cada cifra que el video dice o muestra se comprueba contra el texto del artículo antes de grabar la voz. Si una cifra no aparece en el paper ni está declarada como cálculo propio, el proceso se detiene.

## Cómo funciona

| Paso | Comando | Qué hace |
|---|---|---|
| 1 | `extraer` | Texto por página y figuras del PDF (PyMuPDF). |
| 2 | `borrador` | Un modelo de lenguaje (Gemini) escribe el guion: escenas por capítulo, cada una con una plantilla de animación, sus parámetros y las citas de página de cada cifra. |
| 3 | `verificar` | Toda cifra dicha o mostrada debe estar en el texto del paper. Se detiene si no. |
| 4 | `voces` | Una pista de voz por escena (Gemini TTS o ElevenLabs), comprobada con Whisper. |
| 5 | `tiempos` | Segundo exacto de cada palabra, para sincronizar subtítulo y animación. |
| 6 | `render` | Cuadro por cuadro con Playwright y ffmpeg: MP4 en 1920x1080 (o vertical con `--vertical`). |

El paso 2 produce un `guion.json` que se puede revisar y editar a mano antes de grabar. Es el paso donde conviene leer con calma.

## Animación: enfoque híbrido

- **Plantillas** (`paper_reel/biblioteca/biblioteca.js`): 14 escenas reutilizables para cualquier disciplina: pregunta inicial, cifra protagonista, barras comparativas, dispersión con contador de R², curva con techo o umbral, serie temporal, cuadrícula que se llena, flujo de pasos, antes y después, capas, puntos sobre un mapa esquemático, figura del paper con acercamiento, fichas de repaso y composición de personajes.
- **Personajes y objetos** (`DIBUJO`): satélite, avión, estación espacial, árbol, bosque, láser, globo, lupa, persona, documento, matraz, microscopio, engranaje y otros.
- **Escenas a la medida**: un guion puede mezclar plantillas con escenas escritas a mano para un artículo concreto (`ejemplos/`).

El modelo de lenguaje elige plantilla y parámetros; la plantilla nunca inventa valores: solo muestra las cifras que recibe.

## Instalación

```bash
pip install -r requirements.txt
python -m playwright install chromium
```

También hacen falta `ffmpeg` y `node` en el PATH.

Copia `.env.example` como `.env` y pon tu clave de Gemini (o la ruta a un archivo que la contenga). Las claves nunca se suben al repositorio.

## Uso

```bash
python -m paper_reel todo articulo.pdf proyectos/mi_paper
```

O paso por paso, revisando el guion antes de grabar:

```bash
python -m paper_reel extraer articulo.pdf proyectos/mi_paper
python -m paper_reel borrador proyectos/mi_paper
python -m paper_reel verificar proyectos/mi_paper
python -m paper_reel tiempos proyectos/mi_paper --prueba     # tiempos aproximados para revisar cuadros sin gastar voz
python -m paper_reel render proyectos/mi_paper --cuadros 5,30,60
python -m paper_reel voces proyectos/mi_paper
python -m paper_reel tiempos proyectos/mi_paper
python -m paper_reel render proyectos/mi_paper
```

## Lo que conviene saber

- **Cuota de voz.** El plan gratuito de Gemini TTS permite pocas solicitudes diarias por modelo; un video de 30 escenas puede tomar dos o tres días. Con una clave de pago o con ElevenLabs se hace en una sesión.
- **Un modelo por video.** Si las escenas salen de modelos de voz distintos, el timbre cambia a mitad del video.
- **Sin instrucciones de estilo en el texto hablado.** Los modelos de voz las leen en voz alta.
- **Pronunciación.** Las siglas se ajustan en `guion.json` con `"pronunciacion": {"GEDI": "Yédai"}`; el subtítulo conserva la sigla.
- **Derechos.** No subas PDFs ni figuras de artículos al repositorio. Un video que muestre figuras de un paper debe citarlo, y para publicarlo conviene revisar la licencia del artículo.
- **Revisión humana.** La verificación atrapa cifras inventadas, no errores de interpretación. Lee el guion antes de grabar.

## Ejemplos

`ejemplos/` trae las escenas a la medida de dos artículos usados para desarrollar la herramienta: Chen et al. (2025), sobre productos de LAI de alta resolución, y Dubayah et al. (2020), sobre la misión GEDI.
