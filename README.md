# English for Tourism · Sitio web del programa

**Publicado en:** https://gvalladares-hash.github.io/curso-ingles/
**Repositorio:** https://github.com/gvalladares-hash/curso-ingles

Sitio estático del programa de inglés para el turismo del Valle del Río Hurtado
(Ilustre Municipalidad de Río Hurtado · Departamento de Turismo).

No necesita servidor, base de datos ni conexión a internet: son archivos HTML, CSS y
JavaScript que se abren en cualquier navegador y se pueden publicar tal cual.

---

## 1. Cómo verlo

- **En el computador:** abra `index.html` con doble clic (o arrástrelo a Chrome, Safari o Edge).
- **En el celular:** publique la carpeta (ver punto 4) y abra la dirección desde el teléfono.

El menú superior, los buscadores, las pestañas de la malla, el calendario y el copiado de
frases funcionan sin conexión.

## 2. Qué contiene la carpeta

```
sitio-web/
├── index.html                     Página completa del curso
├── assets/
│   ├── estilos.css                Diseño: colores, tipografías, grillas y responsive
│   ├── app.js                     Menú móvil, filtros, buscadores, copiado, formulario
│   ├── logo-curso-emblema.png     Escudo del curso (barra superior y ficha)
│   ├── logo-curso-emblema-180.png Escudo del curso para apple-touch-icon
│   ├── logo-curso-horizontal.png  Logo horizontal claro (pie de página)
│   └── favicon-curso-32.png       Icono de la pestaña del navegador
├── descargas/
│   └── programa_ingles_b1.docx    Programa oficial en Word (40 clases)
├── materiales/
│   ├── clase_01/                  Material publicado de la sesión 1
│   └── clase_02/                  Material publicado de la sesión 2
└── README.md                      Este archivo
```

Los logotipos se obtuvieron del sitio institucional (riohurtado.cl) y se usan únicamente
con fines institucionales. Si el municipio entrega una versión oficial en alta resolución,
basta reemplazar los archivos manteniendo los nombres.

## 3. Cómo actualizarlo

### 3.1 Cambios de texto pequeños (sin conocimientos técnicos)

1. Abra `index.html` con un editor de texto (Visual Studio Code, Sublime, o incluso
   TextEdit en modo texto plano).
2. Use Ctrl+F / Cmd+F para buscar el texto que quiere cambiar.
3. Modifique solo lo que está entre las etiquetas, por ejemplo:

```html
<h2>Veinte sesiones, cuatro módulos</h2>
```

4. Guarde y recargue el navegador (Cmd+R / F5).

> Consejo: antes de editar, haga una copia de la carpeta completa con la fecha
> (`sitio-web-2027-03`). Así siempre puede volver atrás.

### 3.2 Cambios masivos de contenido (recomendado si se actualiza el programa)

El sitio y el documento Word se generan desde un mismo archivo de datos:
`contenido.py`, en la carpeta superior. Ahí están los 4 módulos, las 20 sesiones, los
grupos, el calendario, el vocabulario, las frases y la rúbrica.

```bash
# desde la carpeta TAREAS_ESTUDIO
python3 build_docx.py     # regenera el Word
python3 build_site.py     # regenera el sitio (y actualiza la copia descargable)
```

Requiere Python 3 y la librería `python-docx` (solo para el Word).

### 3.3 Marca del sitio

Las cuatro piezas de `assets/` **no se editan aquí**: `build_site.py` las copia en cada
compilación desde `/Users/Geraldo/Desktop/TAREAS_ESTUDIO/assets/` (logo del curso). Para
cambiarlas se trabaja en la skill `identidad-visual-curso` y se regeneran los PNG.

## 3.4 Datos de contacto del curso

| Dato | Dónde está | Valor actual (referencial) |
|---|---|---|
| Correo del curso | `build_site.py`, sección `#inscripcion` y `assets/app.js` | `ingles.riohurtado2026@gmail.com` |
| WhatsApp del grupo | `build_site.py`, sección `#inscripcion` | `+56 9 5705 0087` (`wa.me/56957050087`) |
| Sedes por definir | `index.html`, sección `#calendario` | Salón Azul (confirmada) |
| Fechas de clases | `index.html`, tabla del calendario | Propuesta desde el 18 de noviembre de 2026 |

### 3.4 Publicar el material de una clase

La sección «Material» del sitio se arma sola. `build_site.py` recorre
`../curso_ingles_emprendedores/clases_generadas/clase_NN/`, copia los archivos
publicables a `sitio-web/materiales/clase_NN/` y enlaza cada clase con su título y
su módulo.

- Se publican: `.html`, `.pdf`, `.mp3`, `.docx` y `.pptx`.
- No se publican: `.md`, imágenes de previsualización ni archivos ocultos.
- El guion de la clase (`clase_NN.docx`) es del docente: no se publica, aunque esté en
  la carpeta. Los demás `.docx` (diálogos, fichas) sí.
- Para sumar una clase: deje sus archivos en `clases_generadas/clase_NN/` y ejecute
  `python3 build_site.py`. No hay que editar el HTML a mano.
- El sitio refleja la carpeta: si un archivo se retira de la clase, desaparece del
  sitio en la siguiente compilación.

El formulario de inscripción **no envía datos a ningún servidor**: arma un correo con la
información (incluido el grupo al que postula) y lo abre en la aplicación de correo del
usuario. Si el municipio tiene un formulario institucional (Google Forms, Microsoft Forms
u otro), basta con reemplazar el bloque `<form>` por el enlace correspondiente.


## 3.5 Inscripciones

El formulario de `#inscripcion` pide seis datos obligatorios: nombre completo, grupo al que
postula, oficina o emprendimiento, localidad, correo electrónico y WhatsApp. La lógica vive en
`assets/inscripcion.js` (estático, no lo genera el build).

- **Validación**: cada campo tiene su mensaje; el correo se revisa con formato y el WhatsApp se
  normaliza a `+56 9 XXXX XXXX`.
- **Guardado**: si `INSCRIPCION.ENDPOINT` tiene la URL del Web App, cada envío agrega una fila a
  la hoja de Google y dispara un correo de aviso a `ingles.riohurtado2026@gmail.com`. Además
  siempre se guarda una copia en `localStorage` del dispositivo, con lo que el registro y los
  indicadores funcionan sin internet.
- **Panel de registro**: cuenta inscritos, municipales, emprendedores y localidades; permite
  agrupar por localidad, grupo o emprendimiento y filtrar la tabla. Por defecto muestra lo
  registrado en ese dispositivo; con la **clave del curso** («Cargar de la planilla») lee la hoja
  completa y la clave queda guardada en el navegador. La clave vive solo en el script de Google,
  nunca en este repositorio.
- **Exportación**: `Descargar CSV` (UTF-8 con BOM y separador `;`, abre en Excel y Sheets) y
  `Descargar Excel` (hoja XML, abre directo en Excel).
- **Sin endpoint**: el formulario funciona en modo local y ofrece enviar los datos por correo,
  así no se pierde ninguna inscripción mientras se configura la planilla.

### Conectar la planilla (una sola vez)

1. Crear una planilla en <https://sheets.new> y llamarla «Inscripciones Inglés Río Hurtado 2026».
2. Menú **Extensiones → Apps Script** y pegar el contenido de
   `TAREAS_ESTUDIO/apps_script_inscripciones.gs`.
3. **Implementar → Nueva implementación → Aplicación web**: ejecutar como «Yo», acceso
   «Cualquier persona». Autorizar los permisos (hoja y envío de correo) y copiar la URL `/exec`.
4. Pegar esa URL en `sitio-web/assets/inscripcion.js`, constante `INSCRIPCION.ENDPOINT`, y en
   `INSCRIPCION.HOJA` la URL de la planilla. Volver a publicar.

Si se quiere un resumen diario automático, ejecutar una vez `programarResumenDiario` en el editor
de Apps Script: envía el conteo por grupo, localidad y emprendimiento todos los días a las 20:00.

## 4. Cómo publicarlo

Cualquiera de estas opciones sirve, sin costo:

1. **Sitio municipal:** copiar el contenido de `sitio-web/` a una carpeta del servidor
   del municipio, por ejemplo `riohurtado.cl/turismo/ingles/`.
2. **GitHub Pages:** subir la carpeta a un repositorio y activar Pages en la rama
   principal. Queda una dirección del tipo `usuario.github.io/programa-ingles`.
3. **Netlify / Vercel:** arrastrar la carpeta en el panel del servicio; entrega una
   dirección pública en segundos.
4. **Entrega en terreno:** la carpeta completa funciona desde un pendrive abriendo
   `index.html`, sin internet.

Al publicar, verifique que la descarga del Word siga funcionando (`descargas/programa_ingles_b1.docx`).

## 5. Accesibilidad y uso en terreno

- Contraste alto, tipografía grande y navegación por teclado.
- Los botones de frase copian el texto al portapapeles para pegarlo en WhatsApp.
- La hoja de estilos incluye reglas de impresión: use Ctrl+P / Cmd+P para obtener una
  versión limpia de la malla, del vocabulario o del calendario.
- Respeta la preferencia del sistema «reducir movimiento».

## 6. Ideas para la siguiente versión

- Fotos reales del valle, de los grupos y de la feria final.
- Audios de cada frase y de cada léxico, grabados por el docente y por los participantes.
- Versión en inglés del sitio para difusión internacional.
- Calendario editable conectado a Google Calendar.
- Registro de egresados y directorio de negocios «English-friendly» con filtro por
  localidad.
- Traducción de la carta del menú y de los letreros descargables en PDF.

---

Programa desarrollado por Geraldo Valladares Bugueño para el Departamento de Turismo de
la Ilustre Municipalidad de Río Hurtado. Contenido basado en fuentes públicas: SERNATUR
Coquimbo («Destination Río Hurtado», 2023), Municipalidad de Río Hurtado, CONAF y
Censo 2017.
