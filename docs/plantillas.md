# Contrato de la biblioteca de plantillas

La biblioteca vive en `paper_reel/biblioteca/biblioteca.js` y es JavaScript plano que se inserta en el motor (`paper_reel/motor/motor.html` o `motor_h.html`) junto con la especificación de escenas que produce el modelo de lenguaje.

## Lo que define biblioteca.js

```js
const DIBUJO = { ... };      // personajes y objetos reutilizables: funciones que devuelven texto SVG
const FONDOS = { ... };      // nombre -> fondo CSS (colores apagados): noche, pizarra, terracota, morado, bosque, indigo, oceano, grafito
const PLANTILLAS = {
  nombre: {
    descripcion: 'cuándo usarla, en una o dos frases',
    params: {                // esquema que el modelo de lenguaje debe llenar
      param: {tipo: 'texto|numero|palabra|lista|figura|booleano', requerido: true, descripcion: '...', ejemplo: ...}
    },
    ejemplo: {...},          // parámetros completos de ejemplo (sirven para las pruebas y para el catálogo)
    draw(lt, dur, i, p) { return `<svg viewBox="0 0 1080 1060">...</svg>` }
  }
};
if (typeof module !== 'undefined') module.exports = {DIBUJO, FONDOS, PLANTILLAS};
```

## Reglas de las plantillas

- `draw` es función pura del tiempo: sin `Math.random` sin semilla (usar `H.rnd(semilla)`), sin estado.
- Sincronización con la voz: los parámetros de tipo `palabra` son palabras de la narración en las que ocurre un evento. Se resuelven con `H.cuando(i, p.palabra, fraccion, dur)`, que devuelve el segundo local en que se dice la palabra o, si no aparece, la fracción indicada de la escena. Nunca tiempos fijos largos.
- Ayudas del motor: `H.p(lt,a,b)` progreso suavizado, `H.pl` lineal, `H.lerp`, `H.eio`, `H.num(x,dec)` en formato es-CO, `H.rnd(semilla)`, `H.at`, `H.cuando`.
- Las figuras del paper llegan como `FIGURAS[id]` (data URI) y la plantilla las usa con `<image href="...">`.
- Movimiento siempre: en cada cuadro algo se mueve (deriva lenta, partículas, pulso, acercamiento).
- Zona segura del SVG 1080x1060: no poner nada importante en x<420 e y<110 (lo tapa la etiqueta del capítulo) ni en y>1000.
- Cifras: la plantilla solo muestra los números que recibe en los parámetros; nunca inventa valores de ejes. Los ejes esquemáticos van sin números.
- Menos de unos 1.500 elementos SVG por cuadro. Fuentes: Inter (texto) y JetBrains Mono (etiquetas). Sin emojis.
- Textos visibles en el idioma de los parámetros (por defecto español).
