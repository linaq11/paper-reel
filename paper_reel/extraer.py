"""Paso 1: texto por página y figuras de un PDF."""
from pathlib import Path
import json
import fitz


def extraer(pdf, proyecto):
    proyecto = Path(proyecto); (proyecto / 'figuras').mkdir(parents=True, exist_ok=True)
    d = fitz.open(pdf)
    paginas = [p.get_text() for p in d]
    (proyecto / 'texto.txt').write_text(''.join(f'\n=== p{i + 1}\n{t}' for i, t in enumerate(paginas)), encoding='utf-8')
    figs = []
    for i, p in enumerate(d):
        for j, im in enumerate(p.get_images(full=True)):
            pix = fitz.Pixmap(d, im[0])
            if pix.width < 300 or pix.height < 200:
                continue
            if pix.n - pix.alpha >= 4:
                pix = fitz.Pixmap(fitz.csRGB, pix)
            nombre = f'p{i + 1:02d}_{j}.png'
            pix.save(proyecto / 'figuras' / nombre)
            figs.append({'id': nombre[:-4], 'pagina': i + 1, 'ancho': pix.width, 'alto': pix.height})
    (proyecto / 'figuras.json').write_text(json.dumps(figs, indent=1), encoding='utf-8')
    print(f'{len(paginas)} páginas, {len(figs)} figuras -> {proyecto}')
    return paginas, figs
