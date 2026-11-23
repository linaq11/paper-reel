"""Paso de voz: una pista WAV (PCM 16 bits, 24 kHz, mono) por escena, con Gemini TTS, ElevenLabs o las voces
neuronales de Microsoft (edge-tts).
Reglas aprendidas: no anteponer instrucciones de estilo (los modelos las leen en voz alta), usar un solo modelo y una
sola voz por video para que no cambie el timbre, y revisar cada pista: Whisper detecta si la voz leyó de más, y la
duración detecta audios cortados. La pronunciación se ajusta con un diccionario (GEDI -> Yédai) solo en el texto hablado."""
import asyncio, base64, json, re, subprocess, time, unicodedata, urllib.error, urllib.request, wave
from pathlib import Path
from .config import clave, opcion

MAX_PPM = 220  # una pista más rápida que esto casi seguro salió cortada


def _gemini(texto, salida, voz, modelo, ritmo=None):
    cuerpo = {'contents': [{'parts': [{'text': texto}]}],
              'generationConfig': {'responseModalities': ['AUDIO'],
                                   'speechConfig': {'voiceConfig': {'prebuiltVoiceConfig': {'voiceName': voz}}}}}
    for intento in range(6):
        req = urllib.request.Request(f'https://generativelanguage.googleapis.com/v1beta/models/{modelo}:generateContent',
                                     data=json.dumps(cuerpo).encode(), headers={'x-goog-api-key': clave('GEMINI_API_KEY'), 'Content-Type': 'application/json'})
        try:
            r = json.load(urllib.request.urlopen(req, timeout=300)); break
        except urllib.error.HTTPError as e:
            cuerpo_err = e.read().decode('utf-8', 'ignore')
            if e.code == 429 and 'PerDay' in cuerpo_err:
                raise SystemExit(f'{modelo}: cuota diaria agotada. Las voces ya grabadas se conservan; vuelve a correr '
                                 f'`voces` cuando se renueve, o usa otro proveedor (ver README).')
            if e.code not in (429, 500, 503):
                raise
            time.sleep(int(e.headers.get('Retry-After') or 0) or 20 * (intento + 1))
    else:
        raise SystemExit(f'{modelo}: sin respuesta tras varios intentos')
    datos = base64.b64decode(r['candidates'][0]['content']['parts'][0]['inlineData']['data'])
    if datos[:4] == b'RIFF':
        Path(salida).write_bytes(datos)
    else:
        with wave.open(str(salida), 'wb') as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(datos)


def _elevenlabs(texto, salida, voz, modelo, ritmo=None):
    req = urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{voz}?output_format=pcm_24000',
                                 data=json.dumps({'text': texto, 'model_id': modelo,
                                                  'voice_settings': {'stability': 0.5, 'similarity_boost': 0.75}}).encode(),
                                 headers={'xi-api-key': clave('ELEVENLABS_API_KEY'), 'Content-Type': 'application/json'})
    pcm = urllib.request.urlopen(req, timeout=300).read()
    with wave.open(str(salida), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(pcm)


def _edge(texto, salida, voz, modelo=None, ritmo=None):
    """Voces neuronales de Microsoft por el servicio de lectura en voz alta de Edge (paquete edge-tts).
    No pide clave ni tiene cuota, pero no es una API oficial y el texto se envía a Microsoft."""
    import edge_tts
    mp3 = Path(salida).with_suffix('.mp3')
    for intento in range(3):
        try:
            asyncio.run(edge_tts.Communicate(texto, voz, rate=ritmo or '+0%').save(str(mp3))); break
        except Exception as err:  # el servicio a veces corta la conexión
            print(f'  edge-tts: reintento ({err})', flush=True); time.sleep(5)
    else:
        raise SystemExit('edge-tts: el servicio no respondió tras 3 intentos')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(mp3), '-ar', '24000', '-ac', '1', '-c:a', 'pcm_s16le', str(salida)], check=True)
    mp3.unlink(missing_ok=True)


# proveedor: (función, voz por defecto, modelo por defecto)
PROVEEDORES = {
    'gemini': (_gemini, 'Algenib', 'gemini-3.8-flash-tts'),
    'elevenlabs': (_elevenlabs, None, 'eleven_multilingual_v2'),
    'edge': (_edge, 'es-CO-GonzaloNeural', None),
}


def hablado(texto, pronunciacion):
    for k, v in (pronunciacion or {}).items():
        texto = re.sub(rf'\b{re.escape(k)}\b', v, texto)
    return texto


def _norm(s):
    s = unicodedata.normalize('NFD', s.lower())
    return re.sub(r'[^a-z ]', '', ''.join(c for c in s if unicodedata.category(c) != 'Mn'))


def _duracion(wav):
    with wave.open(str(wav)) as w:
        return w.getnframes() / w.getframerate()


def voces(proyecto, guion):
    """Genera las voces que falten. Una escena puede declarar 'voz_existente' (ruta a un WAV ya grabado) para reutilizarlo.
    El guion puede fijar su voz: "tts": {"proveedor": "edge", "voz": "es-CO-GonzaloNeural", "ritmo": "-10%"}."""
    from faster_whisper import WhisperModel
    proyecto = Path(proyecto); d = proyecto / 'voces'; d.mkdir(exist_ok=True)
    tts = guion.get('tts') or {}
    prov = tts.get('proveedor') or opcion('TTS_PROVEEDOR', 'gemini')
    if prov not in PROVEEDORES:
        raise SystemExit(f'proveedor de voz desconocido: {prov} (opciones: {", ".join(PROVEEDORES)})')
    fn, voz_def, modelo_def = PROVEEDORES[prov]
    voz = tts.get('voz') or guion.get('voz') or opcion('TTS_VOZ', voz_def)
    modelo = tts.get('modelo') or opcion('TTS_MODELO', modelo_def)
    ritmo = tts.get('ritmo') or opcion('TTS_RITMO')
    if not voz:
        raise SystemExit(f'{prov}: falta la voz (TTS_VOZ en .env o "tts": {{"voz": ...}} en el guion)')
    whisper = WhisperModel('small', device='cpu', compute_type='int8')
    for i, e in enumerate(guion['escenas']):
        wav = d / f'e{i:03d}.wav'
        if e.get('voz_existente') and not wav.exists():
            wav.write_bytes(Path(e['voz_existente']).read_bytes())
        if wav.exists():
            continue
        texto = hablado(e['texto'], guion.get('pronunciacion'))
        n = len(texto.split())
        for intento in range(3):
            fn(texto, wav, voz, modelo, ritmo)
            if _duracion(wav) >= n / MAX_PPM * 60:
                break
            print(f'  escena {i}: el audio salió cortado ({_duracion(wav):.1f} s para {n} palabras), lo pido de nuevo', flush=True)
        else:
            wav.unlink()
            raise SystemExit(f'escena {i}: el audio sigue saliendo cortado tras 3 intentos')
        segs, _ = whisper.transcribe(str(wav), language=guion.get('idioma', 'es'))
        oido = ' '.join(s.text for s in segs)
        if len(_norm(oido).split()) > 1.6 * len(_norm(texto).split()) + 5:
            wav.unlink()
            raise SystemExit(f'escena {i}: la voz dijo mucho más que el guion (¿leyó una instrucción?): {oido[:120]}')
        print(f'voz {i}: ok | {oido.strip()[:70]}', flush=True)
