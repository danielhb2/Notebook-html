# 📚 Notebooks
[README ES 🇦🇷](README.md)

Note management system with virtual notebooks, Markdown editor, tags, global search, and JSON export.  

Without a backend for ease of use and portability, it saves data to the browser's localStorage, allowing you to export all content to a .json file with the date and time embedded in the filename.

The system consists of only two files: `notebook.html` and `marked.min.js`. A local copy of `marked.min.js` is included to enable rendering Markdown without an internet connection.

## Available versions

This repository includes two functionally identical versions of the app:

**`standalone/`** — Single self-contained file. All CSS and JavaScript are embedded inside the `index.html` file itself. This is the most portable option: you can copy the folder, share it, or open it directly from the file system with no extra steps.

**`modular/`** — Version split into three files: `index.html`, `nb_style.css` and `nb_functions.js`. This is more convenient for modifying or extending the app, since each concern (structure, styles, logic) lives in its own file. It requires being served by a web server (local or remote) for the browser to load the external files correctly.

Both versions require `marked.min.js` (included in each folder) to render Markdown without an internet connection.

## Home Screen

Opening the app or clicking "📚 Libretas de Notas" shows the **home screen** with all notebooks in a visual grid. Click any notebook to see its notes, or use the **+** button to create a new one.

Pinned notes 📌 appear at the top, before the notebooks. Click on one to open a preview.

## Sidebar (☰)

The ☰ button opens the side panel with:

-   **➕ New Notebook**: Create notebooks with a custom name
-   **💾 Backup**: Export and import data as JSON
-   **📖 README**: This manual

## Notebooks

Each notebook has buttons to change color (16-color palette), link to others (🔗), rename (✎), and delete (🗑).

## Notes

Note cards show title, author, notebook, dates, size, and tags. Click a card to open the preview. The large **+** card creates a new note in the active notebook.

## Editor

Toolbar: **Hn** (headings H1–H3), **B** (bold), **I** (italic), **Cód** (code block), **`** (inline code), **List**, **☐** (checklist), **"** (blockquote), **🔗** (link), **🖼️** (image URL), **—** (horizontal rule).

You can also import .md files (with or without YAML frontmatter) and export notes as .md.

## YouTube Videos

Use the embed iframe directly in Markdown:
```
<iframe width="560" height="315" src="https://www.youtube.com/embed/VIDEO_ID" allowfullscreen></iframe>
```

Replace `VIDEO_ID` with the characters after `v=` in the video URL.

## Preview

-   Interactive **checklists** (checking/unchecking saves the change)
    
-   **Markdown tables** with borders and alternating rows
    
-   **Metadata** collapsible on mobile (▶ Metadatos button)
    
-   Click tag → filter; click notebook name → go to that notebook
    
-   The 📌 button pin/unpin the note. Fixed notes appear on the home screen.
    

## Filters & Search

-   **Search**: Searches **all notes** (title, author, content, tags)
    
-   🏷️: The button next to the search opens a dropdown with all the tags to filter globally.
    
-   **Tags**: Filter globally across all notebooks
    
-   **Active notebook**: Only filters the view when no search or tag filter is active
    
-   **View all**: Clears notebook filter
    

## Linked Notebooks (🔗)

**💡 What is the purpose of linking notebooks?**  
Linking two or more notebooks creates a thematic or structural relationship between them. It is not just a tag; it is a way to group sets of notes that belong to the same project, idea, or context.

**Practical examples:**

-   If you have a notebook "Poems" and another "Drafts of poems", linking them allows you to see, from any note in "Poems", all notes in "Drafts" (and vice versa).
    
-   A writing project: notebooks "Research", "Characters", "Chapters". Link them to have a unified view.
    
-   A personal journal: notebooks "2023", "2024", "Reflections". When linked, the 🔗 badge on any note will show you notes from all three.
    

**Technical behavior:**

-   Links are **bidirectional**: if you link A with B, B automatically becomes linked with A.
    
-   Clicking the 🔗 badge that appears on notes belonging to linked notebooks opens a special **grouped view**: all notes from the current notebook are shown, followed by notes from each linked notebook, each group with its colored header. You can add new notes to any group from that same view.
    
-   There is no limit on how many notebooks you can link.
    

**Usage tip:** Use links to build **broader working contexts** that go beyond a single notebook, without losing separate organization.

## Special Tags

-   `urgente` → red
    
-   `importante` → green
    

## Backup & Data

-   **Export JSON**: Download full backup
    
-   **Import JSON**: Restore from backup
    
-   **Leave alert**: If there are unsaved changes, closing the page offers a backup
    
-   **⚠️ Delete All**: Clears all data (with confirmation)
    

## Themes

The ☀️/🌙 button toggles dark/light theme. Preference is saved.

---
## Authorship

- Concept, original idea, feature definition, iterative direction of development,
  testing and aesthetic criteria: Daniel Horacio Braga
- Code writing (HTML, CSS, JavaScript) through AI-assisted development
  conversations: Claude (Anthropic) — https://www.anthropic.com

---
## License

This project is distributed under the [GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.html).
