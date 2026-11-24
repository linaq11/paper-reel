"""Paso de tiempos: segundo exacto de cada palabra del guion. Whisper da los tiempos de la voz y difflib los alinea con el guion;
las palabras que Whisper oye distinto (cifras, siglas) se interpolan entre las vecinas."""
import difflib, json, re, unicodedata, wave
from pathlib import Path

PAUSA = 0.7  # silencio entre escenas (cambio de párrafo)


def _norm(w):
    w = unicodedata.normalize('NFD', w.lower())
    return re.sub(r'[^a-z0-9ñ]', '', ''.join(c for c in w if unicodedata.category(c) != 'Mn'))


def tiempos_prueba(proyecto, guion, ppm=150):
    """Tiempos aproximados sin audio (ppm palabras por minuto), solo para revisar cuadros antes de grabar voces."""
    salida, t0 = [], 0.0
    for i, e in enumerate(guion['escenas']):
        ps = e['texto'].split(); paso = 60 / ppm; t = t0 + 0.4; pal = []
        for w in ps:
            pal.append([w, round(t, 3), round(t + paso * 0.9, 3)]); t += paso * (1.6 if w[-1] in '.,:;?' else 1)
        d = t - t0 + 0.3
        salida.append({'i': i, 'inicio': round(t0, 3), 'dur': round(d, 3), 'palabras': pal}); t0 += d
    Path(proyecto, 'tiempos.json').write_text(json.dumps(salida, ensure_ascii=False), encoding='utf-8')
    print(f'tiempos de prueba: {len(salida)} escenas, {t0:.1f} s (aproximados, sin audio)')
    return salida


def tiempos(proyecto, guion):
    from faster_whisper import WhisperModel
    proyecto = Path(proyecto)
    modelo = WhisperModel('small', device='cpu', compute_type='int8')
    salida, t0 = [], 0.0
    for i, e in enumerate(guion['escenas']):
        wav = proyecto / 'voces' / f'e{i:03d}.wav'
        with wave.open(str(wav)) as w:
            d = w.getnframes() / w.getframerate()
        segs, _ = modelo.transcribe(str(wav), language=guion.get('idioma', 'es'), word_timestamps=True)
        ww = [(x.word.strip(), x.start, x.end) for s in segs for x in s.words]
        guion_p = e['texto'].split()
        a, b = [_norm(x) for x in guion_p], [_norm(x[0]) for x in ww]
        ts = [None] * len(guion_p)
        for blk in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
            for k in range(blk.size):
                ts[blk.a + k] = (ww[blk.b + k][1], ww[blk.b + k][2])
        ini, fin = (ww[0][1], ww[-1][2]) if ww else (0.0, d)
        ts[0] = ts[0] or (ini, ini + 0.2)
        ts[-1] = ts[-1] or (fin - 0.3, fin)
        k = 0
        while k < len(ts):
            if ts[k] is None:
                j = k
                while ts[j] is None:
                    j += 1
                s0, s1 = ts[k - 1][1], ts[j][0]
                pesos = [len(x) for x in guion_p[k:j]]; acc = 0
                for m in range(k, j):
                    a0 = s0 + (s1 - s0) * acc / sum(pesos); acc += pesos[m - k]
                    ts[m] = (a0, s0 + (s1 - s0) * acc / sum(pesos))
                k = j
            k += 1
        salida.append({'i': i, 'inicio': round(t0, 3), 'dur': round(d + PAUSA, 3),
                       'palabras': [[g, round(t0 + s, 3), round(t0 + f, 3)] for g, (s, f) in zip(guion_p, ts)]})
        t0 += d + PAUSA
    (proyecto / 'tiempos.json').write_text(json.dumps(salida, ensure_ascii=False), encoding='utf-8')
    print(f'tiempos: {len(salida)} escenas, {t0:.1f} s')
    return salida
