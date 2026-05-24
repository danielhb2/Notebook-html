# 📚 Libretas de Notas
[README EN 🇬🇧](README_en.md)

Sistema de gestión de notas con libretas virtuales, editor Markdown, etiquetas, búsqueda global y exportación JSON.

Sin backend para facilitar el uso y la portabilidad, guarda los datos en el localStorage del navegador, pudiendo exportar todo el contenido a un archivo .json con fecha y hora en el nombre del archivo.

El sistema consta sólo de dos archivos: `notebook.html` y `marked.min.js`. Se incluye una copia local de `marked.min.js` para poder renderizar Markdown sin necesidad de conexión a internet.

## Versiones disponibles

Este repositorio incluye dos versiones funcionales idénticas de la aplicación:

**`standalone/`** — Archivo único autocontenido. Todo el CSS y el JavaScript están embebidos dentro del mismo `index.html`. Es la opción más portable: podés copiar la carpeta, compartirla o abrirla directamente desde el sistema de archivos sin ningún paso adicional.

**`modular/`** — Versión separada en tres archivos: `index.html`, `nb_style.css` y `nb_functions.js`. Es más cómoda para modificar o extender la app, ya que cada aspecto (estructura, estilos, lógica) está en su propio archivo. Requiere ser servida por un servidor web (local o remoto) para que el navegador cargue los archivos externos correctamente.

En ambos casos se necesita `marked.min.js` (incluido en cada carpeta) para el renderizado Markdown sin conexión a internet.

## Pantalla de inicio

Al abrir la app o hacer clic en el título "📚 Libretas de Notas" se muestra la **pantalla de inicio** con todas las libretas en una grilla visual. Hacé clic en cualquier libreta para ver sus notas, o usá el botón **+** para crear una nueva.

Las notas fijadas 📌 aparecen arriba de todo, antes de las libretas. Hacé clic en una para abrir su preview.

## Sidebar (☰)

El botón ☰ abre el panel lateral con:
- **➕ Nueva Libreta**: Crear libretas con nombre personalizado
- **💾 Backup**: Exportar e importar datos en JSON
- **📖 README**: Este manual

## Libretas

Cada libreta tiene botones para cambiar color (paleta de 16 colores), enlazar con otras (🔗), renombrar (✎) y eliminar (🗑).

## Notas

Las tarjetas muestran título, autor, libreta, fechas, tamaño y etiquetas. Clic en tarjeta → abre preview. El botón **+** grande crea una nueva nota en la libreta activa.

## Editor

Barra de herramientas: **Hn** (encabezados H1–H3), **B** (negrita), **I** (cursiva), **Cód** (bloque), **`** (inline), **List**, **☐** (checklist), **"** (cita), **🔗** (enlace), **🖼️** (imagen URL), **—** (separador).

También podés importar archivos .md (con o sin frontmatter YAML) y exportar como .md.

## Videos de YouTube

Usá el iframe de embed directamente en el Markdown:
```
<iframe width="560" height="315" src="https://www.youtube.com/embed/ID_VIDEO" allowfullscreen></iframe>
```
Reemplazá `ID_VIDEO` con los caracteres que aparecen después de `v=` en la URL del video.

## Vista previa

-   **Checklists** interactivos (marcar/desmarcar guarda el cambio)
    
-   **Tablas Markdown** con bordes y filas diferenciadas
    
-   **Metadatos** contraíbles en móvil (botón ▶ Metadatos)
    
-   Clic en etiqueta → filtra; clic en libreta → va a esa libreta
    
-   El botón 📌 fija/desfija la nota. Las notas fijadas aparecen en la pantalla de inicio.
    

## Filtros y búsqueda

-   **Búsqueda**: Busca en **todas las notas** (título, autor, contenido, etiquetas)
    
-   🏷️: El botón al lado de la búsqueda abre un dropdown con todas las etiquetas para filtrar globalmente.
    
-   **Etiquetas**: Filtran globalmente
    
-   **Libreta activa**: Solo filtra la vista cuando no hay búsqueda ni etiqueta activa
    
-   **Ver todas**: Desactiva el filtro de libreta
    

## Libretas enlazadas (🔗)

**💡 ¿Para qué sirve enlazar libretas?**  
Enlazar dos o más libretas crea una relación temática o estructural entre ellas. No es una simple etiqueta: es una forma de agrupar conjuntos de notas que pertenecen a un mismo proyecto, idea o contexto.

**Ejemplos prácticos:**

-   Si tienes una libreta "Poemas" y otra "Borradores de poemas", al enlazarlas podrás ver, desde cualquier nota de "Poemas", también todas las notas de "Borradores" (y viceversa).
    
-   Un proyecto de escritura: libretas "Investigación", "Personajes", "Capítulos". Enlázalas para tener una vista unificada.
    
-   Un diario personal: libretas "2023", "2024", "Reflexiones". Al enlazarlas, el badge 🔗 en cualquier nota te mostrará las notas de las tres.
    

**Comportamiento técnico:**

-   Los enlaces son **bidireccionales**: si enlazas A con B, automáticamente B queda enlazada con A.
    
-   Al hacer clic en el badge 🔗 que aparece en las notas pertenecientes a libretas enlazadas, se abre una **vista agrupada** especial: se muestran todas las notas de la libreta actual, seguidas de las notas de cada libreta enlazada, cada grupo con su cabecera de color. Puedes añadir nuevas notas a cualquier grupo desde esa misma vista.
    
-   No hay límite de cuántas libretas puedes enlazar.
    

**Consejo de uso:** Usa los enlaces para construir **contextos de trabajo** más amplios que una sola libreta, sin perder la organización por separado.

## Etiquetas especiales

-   `urgente` → rojo
    
-   `importante` → verde
    

## Backup y datos

-   **Exportar JSON**: Descarga backup completo
    
-   **Importar JSON**: Restaura desde backup
    
-   **Alerta al salir**: Si hubo cambios, al cerrar la página se ofrece hacer backup
    
-   **⚠️ Borrar Todo**: Elimina todo (con confirmación)
    

## Temas

El botón ☀️/🌙 alterna tema oscuro/claro. La preferencia se guarda.

---
## Autoría

- Concepción, idea original, definición de funcionalidades, dirección
  iterativa del desarrollo, pruebas y criterio estético: Daniel Horacio Braga
- Escritura del código (HTML, CSS, JavaScript) mediante conversaciones
  de desarrollo asistido por IA: Claude (Anthropic) — https://www.anthropic.com

---
## Licencia

Este proyecto se distribuye bajo la [GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.html).
