"""Paso de voz: una pista WAV por escena, con Gemini TTS o ElevenLabs.
Reglas aprendidas: no anteponer instrucciones de estilo (los modelos las leen en voz alta) y usar un solo modelo por video
para que no cambie el timbre. La pronunciación se ajusta con un diccionario (por ejemplo GEDI -> Yédai) solo en el texto hablado."""
import base64, json, re, time, unicodedata, urllib.error, urllib.request, wave
from pathlib import Path
from .config import clave, opcion


def _gemini(texto, salida, voz, modelo):
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
                raise SystemExit(f'{modelo}: cuota diaria agotada. Prueba otro modelo (TTS_MODELO) o espera a que se renueve.')
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


def _elevenlabs(texto, salida, voz, modelo):
    req = urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{voz}?output_format=pcm_24000',
                                 data=json.dumps({'text': texto, 'model_id': modelo,
                                                  'voice_settings': {'stability': 0.5, 'similarity_boost': 0.75}}).encode(),
                                 headers={'xi-api-key': clave('ELEVENLABS_API_KEY'), 'Content-Type': 'application/json'})
    pcm = urllib.request.urlopen(req, timeout=300).read()
    with wave.open(str(salida), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(pcm)


def hablado(texto, pronunciacion):
    for k, v in (pronunciacion or {}).items():
        texto = re.sub(rf'\b{re.escape(k)}\b', v, texto)
    return texto


def _norm(s):
    s = unicodedata.normalize('NFD', s.lower())
    return re.sub(r'[^a-z ]', '', ''.join(c for c in s if unicodedata.category(c) != 'Mn'))


def voces(proyecto, guion):
    """Genera las voces que falten. Las escenas pueden declarar 'voz_existente' (ruta a un WAV ya grabado) para reutilizarlo."""
    from faster_whisper import WhisperModel
    proyecto = Path(proyecto); d = proyecto / 'voces'; d.mkdir(exist_ok=True)
    # el guion puede fijar su propia voz: "tts": {"proveedor": "elevenlabs", "voz": "<voice_id>", "modelo": "eleven_multilingual_v2"}
    tts = guion.get('tts') or {}
    prov = tts.get('proveedor') or opcion('TTS_PROVEEDOR', 'gemini')
    voz = tts.get('voz') or guion.get('voz') or opcion('TTS_VOZ', 'Algenib')
    modelo = tts.get('modelo') or opcion('TTS_MODELO', 'gemini-3.8-flash-tts' if prov == 'gemini' else 'eleven_multilingual_v2')
    whisper = WhisperModel('small', device='cpu', compute_type='int8')
    for i, e in enumerate(guion['escenas']):
        wav = d / f'e{i:03d}.wav'
        if e.get('voz_existente') and not wav.exists():
            wav.write_bytes(Path(e['voz_existente']).read_bytes())
        if wav.exists():
            continue
        texto = hablado(e['texto'], guion.get('pronunciacion'))
        (_gemini if prov == 'gemini' else _elevenlabs)(texto, wav, voz, modelo)
        segs, _ = whisper.transcribe(str(wav), language=guion.get('idioma', 'es'))
        oido = ' '.join(s.text for s in segs)
        if len(_norm(oido).split()) > 1.6 * len(_norm(texto).split()) + 5:
            wav.unlink()
            raise SystemExit(f'escena {i}: la voz dijo mucho más que el guion (¿leyó una instrucción?): {oido[:120]}')
        print(f'voz {i}: ok | {oido.strip()[:70]}', flush=True)
