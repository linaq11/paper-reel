# A Paper to Reel

Convierte un artículo científico en PDF en un video explicativo animado, con narración, subtítulo palabra por palabra e ilustraciones que cambian con cada frase. El estilo se inspira en los reels de divulgación de ilustración plana: fondos de color apagado, contadores y barras que se llenan, etiquetas de datos en letra monoespaciada.

Cada cifra que el video dice o muestra se comprueba contra el texto del artículo antes de grabar la voz. Si una cifra no aparece en el paper ni está declarada como cálculo propio, el proceso se detiene.

## Cómo funciona

| Paso | Comando | Qué hace |
|---|---|---|
| 1 | `extraer` | Texto por página y figuras del PDF (PyMuPDF). |
| 2 | `borrador` | Un modelo de lenguaje (Gemini) escribe el guion: escenas por capítulo, cada una con una plantilla de animación, sus parámetros y las citas de página de cada cifra. |
| 3 | `verificar` | Toda cifra dicha o mostrada debe estar en el texto del paper, y cada animación debe encontrar en el texto la palabra que la dispara. Se detiene si no. |
| 4 | `voces` | Una pista de voz por escena (Gemini TTS, ElevenLabs o voces de Microsoft), comprobada con Whisper y por duración. |
| 5 | `tiempos` | Segundo exacto de cada palabra, para sincronizar subtítulo y animación. |
| 6 | `render` | Cuadro por cuadro con Playwright y ffmpeg: MP4 en 1920x1080 (o vertical con `--vertical`). Antes revisa que los tiempos correspondan a las voces grabadas. |

El paquete de Python se sigue llamando `paper_reel`, así que los comandos no cambian: `python -m paper_reel ...`.

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

## Voces

| Proveedor | Clave | Límite | Nota |
|---|---|---|---|
| `gemini` (por defecto) | `GEMINI_API_KEY` | Plan gratuito: pocas voces por día y por modelo | Voces como Algenib; con facturación activada no hay límite diario. |
| `elevenlabs` | `ELEVENLABS_API_KEY` | Plan gratuito: 10.000 caracteres al mes | Un video de 30 escenas usa unos 6.000 a 8.000. |
| `edge` | ninguna | sin cuota | Voces neuronales de Microsoft con acentos regionales (por ejemplo `es-CO-GonzaloNeural`, `es-CO-SalomeNeural`). Usa el servicio de lectura en voz alta de Edge, que no es una API oficial: el texto se envía a Microsoft. Requiere `pip install edge-tts`. |

Cada guion puede fijar su voz:

```json
"tts": {"proveedor": "edge", "voz": "es-CO-GonzaloNeural", "ritmo": "-10%"}
```

`ritmo` solo aplica a `edge` y sirve cuando la voz habla demasiado rápido.

## Lo que conviene saber

- **Cuota de voz.** El plan gratuito de Gemini TTS permite pocas solicitudes diarias por modelo; un video de 30 escenas puede tomar dos o tres días. Las voces ya grabadas se conservan y `voces` sigue desde donde quedó.
- **Acento.** Escucha una muestra antes de grabar todo el video. Algunos modelos multilingües leen el español con un acento fijo (por ejemplo, de España) aunque se les dé una voz de referencia con otro acento.
- **Audios cortados.** Algunos servicios devuelven a veces el audio incompleto. `voces` mide la duración de cada pista y la pide de nuevo si sale más rápida de 220 palabras por minuto.
- **Un modelo por video.** Si las escenas salen de modelos de voz distintos, el timbre cambia a mitad del video.
- **Sin instrucciones de estilo en el texto hablado.** Los modelos de voz las leen en voz alta.
- **Pronunciación.** Las siglas se ajustan en `guion.json` con `"pronunciacion": {"GEDI": "Yédai"}`; el subtítulo conserva la sigla. La escritura que funciona cambia de una voz a otra: pruébala con una frase corta.
- **Tiempos al día.** `tiempos --prueba` sirve para revisar cuadros sin voz, pero el video final necesita `tiempos` después de `voces`. Si no, `render` se detiene y lo indica.
- **Archivos con BOM.** El guion se puede editar en el Bloc de notas o guardar desde PowerShell: la marca BOM de UTF-8 se acepta.
- **Derechos.** No subas PDFs ni figuras de artículos al repositorio. Un video que muestre figuras de un paper debe citarlo, y para publicarlo conviene revisar la licencia del artículo.
- **Revisión humana.** La verificación atrapa cifras inventadas, no errores de interpretación. Lee el guion antes de grabar.

## Ejemplos

`ejemplos/` trae las escenas a la medida de dos artículos usados para desarrollar la herramienta: Chen et al. (2025), sobre productos de LAI de alta resolución, y Dubayah et al. (2020), sobre la misión GEDI.

## Licencia

MIT. Ver `LICENSE`.
