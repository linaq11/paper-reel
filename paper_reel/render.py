"""Paso final: la página de animación se dibuja cuadro por cuadro con Playwright y ffmpeg arma el MP4 con la voz.
Salida compatible con cualquier reproductor: H.264 yuv420p de rango limitado, AAC 48 kHz estéreo, índice al inicio."""
import json, subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
from .componer import componer
from .config import FPS
from .tiempos import PAUSA


def _tiempos_al_dia(proyecto, guion, tiempos):
    """Antes de grabar el video: tiempos.json debe salir de las voces actuales. Si son tiempos de prueba o de voces
    anteriores, la imagen y el audio se desfasan y ffmpeg corta el video a mitad (BrokenPipe)."""
    import wave
    if len(tiempos) != len(guion['escenas']):
        raise SystemExit(f'tiempos.json tiene {len(tiempos)} escenas y el guion {len(guion["escenas"])}: corre `tiempos` de nuevo')
    faltan = [k for k in range(len(tiempos)) if not (proyecto / 'voces' / f'e{k:03d}.wav').exists()]
    if faltan:
        raise SystemExit(f'faltan voces de las escenas {faltan[:10]}: corre `voces`')
    for k, t in enumerate(tiempos):
        with wave.open(str(proyecto / 'voces' / f'e{k:03d}.wav')) as w:
            d = w.getnframes() / w.getframerate()
        if abs(t['dur'] - (d + PAUSA)) > 0.5:
            raise SystemExit(f'escena {k}: tiempos.json dice {t["dur"]:.1f} s y la voz dura {d + PAUSA:.1f} s. '
                             'Son tiempos de prueba o de otra grabación: corre `tiempos` antes de `render`.')


def render(proyecto, horizontal=True, cuadros=None, salida=None):
    proyecto = Path(proyecto)
    guion = json.loads((proyecto / 'guion.json').read_text(encoding='utf-8-sig'))
    tiempos = json.loads((proyecto / 'tiempos.json').read_text(encoding='utf-8-sig'))
    pagina = componer(proyecto, guion, tiempos, horizontal)
    ancho, alto = (1920, 1080) if horizontal else (1080, 1920)
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': ancho, 'height': alto})
        errores = []; pg.on('pageerror', lambda e: errores.append(str(e)))
        pg.goto(pagina.as_uri()); pg.wait_for_timeout(1500); pg.evaluate('document.fonts.ready')
        if errores:
            raise SystemExit(f'errores en la página: {errores[:3]}')
        total = pg.evaluate('window.TOTAL')
        if cuadros:
            d = proyecto / 'revision'; d.mkdir(exist_ok=True)
            for t in cuadros:
                pg.evaluate(f'window.R({t})'); pg.screenshot(path=str(d / f'{"h" if horizontal else "v"}_{t:07.2f}.png'))
            b.close(); print(f'{len(cuadros)} cuadros de revisión en {d}; errores: {errores}'); return
        n = len(tiempos)
        _tiempos_al_dia(proyecto, guion, tiempos)
        voz = proyecto / 'voz.wav'
        filtros = ''.join(f'[{k}:a]apad=pad_dur={PAUSA}[a{k}];' for k in range(n))
        subprocess.run(['ffmpeg', '-y', '-v', 'error', *sum([['-i', str(proyecto / 'voces' / f'e{k:03d}.wav')] for k in range(n)], []),
                        '-filter_complex', filtros + ''.join(f'[a{k}]' for k in range(n)) + f'concat=n={n}:v=0:a=1[out]', '-map', '[out]', str(voz)], check=True)
        salida = Path(salida) if salida else proyecto / f'video_{"pantalla_completa" if horizontal else "celular"}.mp4'
        ff = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'image2pipe', '-framerate', str(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', str(voz),
                               '-vf', 'scale=in_range=full:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-profile:v', 'high', '-level', '4.1',
                               '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-color_range', 'tv',
                               '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-ac', '2', '-movflags', '+faststart', '-shortest', str(salida)],
                              stdin=subprocess.PIPE)
        total_c = int(total * FPS) + 1
        for k in range(total_c):
            pg.evaluate(f'window.R({k / FPS})')
            ff.stdin.write(pg.screenshot(type='jpeg', quality=90))
            if k % 480 == 0:
                print(f'cuadro {k}/{total_c}', flush=True)
        ff.stdin.close(); ff.wait(); b.close()
        if ff.returncode:
            raise SystemExit(f'ffmpeg terminó con error {ff.returncode}; el video {salida} quedó incompleto')
        if errores:
            print('errores durante el render:', errores[:3])
        print(f'video: {salida} ({total:.1f} s)')
        return salida
