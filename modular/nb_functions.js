/*
    Libretas de Notas
    Copyright (C) 2025  Daniel Horacio Braga

    Autoría:
    - Concepción, idea original, definición de funcionalidades, dirección
      iterativa del desarrollo, pruebas y criterio estético: Daniel Horacio Braga
    - Escritura del código (HTML, CSS, JavaScript) mediante conversaciones
      de desarrollo asistido por IA: Claude (Anthropic) — https://www.anthropic.com

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program. If not, see <https://www.gnu.org/licenses/>.
*/


marked.use({ gfm: true, breaks: true });

const storage = (() => {
    try { 
        localStorage.setItem('_test', '1'); 
        localStorage.removeItem('_test'); 
        return localStorage; 
    } catch(e) { 
        const m = {}; 
        return { 
            getItem: k => m[k] || null, 
            setItem: (k,v) => { m[k] = v; }, 
            removeItem: k => { delete m[k]; }, 
            clear: () => { for(let k in m) delete m[k]; } 
        }; 
    }
})();

const defaultData = {
    notebooks: [
        { id: 1, name: 'General', color: '#4A90D9' },
        { id: 2, name: 'Ideas', color: '#10b981' }
    ],
    notes: {
        1: {
            id: 1,
            notebookId: 1,
            title: 'Bienvenido',
            author: 'Sistema',
            content: '# ¡Bienvenido!\n\nSistema de **libretas de notas**.\n\n- 📝 Notas Markdown\n- 🔍 Búsqueda global\n- 💾 Exportación',
            tags: ['bienvenida'],
            createdAt: Date.now(),
            updatedAt: Date.now()
        }
    },
    nextNotebookId: 3,
    nextNoteId: 2
};

let appData = JSON.parse(storage.getItem('notebooksData')) || defaultData;
let currentNotebookId = null; // null = todas las notas
let currentNoteId = null;
let activeSearch = '';
let activeTagFilter = '';
let sidebarOpen = false;
let relatedViewNotebookId = null; // si estamos en vista de relacionadas, guarda el nbId raíz

function saveData() {
    storage.setItem('notebooksData', JSON.stringify(appData));
    const badge = document.getElementById('unsavedBadge');
    if (badge) badge.style.display = 'inline';
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(ts) {
    return new Date(ts).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(ts) {
    return new Date(ts).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `show ${type}`;
    setTimeout(() => { t.className = ''; }, 2500);
}

function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
    document.getElementById('sidebar').classList.toggle('open', sidebarOpen);
    document.getElementById('sidebarOverlay').classList.toggle('show', sidebarOpen);
}

function toggleSection(header) {
    const content = header.nextElementSibling;
    const toggle = header.querySelector('.section-toggle');
    const isExpanded = content.classList.contains('expanded');
    
    document.querySelectorAll('.section-content.expanded').forEach(c => {
        c.classList.remove('expanded');
        c.previousElementSibling.querySelector('.section-toggle').textContent = '▼';
    });
    
    if (!isExpanded) {
        content.classList.add('expanded');
        toggle.textContent = '▲';
    }
}

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return {r,g,b};
}

function darkenHex(hex, factor=0.6) {
    const {r,g,b} = hexToRgb(hex);
    const d = v => Math.round(v * factor).toString(16).padStart(2,'0');
    return `#${d(r)}${d(g)}${d(b)}`;
}

function getNotebookSVG(color) {
    const dark = darkenHex(color, 0.62);
    return `<svg width="230" height="300" viewBox="0 0 230 300" xmlns="http://www.w3.org/2000/svg">
        <rect fill="${dark}" height="266" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.5" transform="matrix(.99963 -.02708 .02708 .99963 0 -752)" width="198" x="-7.5" y="767.9"/>
        <path d="m13.3,16l193.9,0.1l7.2,265.9l-194,-0.1l-7.1,-265.9z" fill="#ffffff" stroke="#c3c3c3"/>
        <path d="m12.3,17.5l192.4,0.2l7.6,265.9l-192.8,-0.2l-7.2,-265.9z" fill="#ffffff" stroke="#c3c3c3"/>
        <path d="m11.3,18l190.9,1.1l7.2,265.9l-191,-1.1l-7.1,-265.9z" fill="#ffffff" stroke="#c3c3c3"/>
        <path d="m12.2,15.4l186.9,2.6l7.2,269.9l-189,-4.6l-5.1,-267.9z" fill="${color}" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.5"/>
        <path d="m77.6,105c17.8,0.2 34.8,0.3 53.3,-0.2c21.8,-0.1 26.5,-3.6 27,18l0.7,33.2c1.5,19.3 -6.9,16.4 -26.1,16.1c-18.9,-0.3 -36.7,-0.5 -53.4,-0.3c-21.5,0 -26,0.6 -26.6,-17.5l-1,-32.8c-1,-19.2 7.2,-16.7 26.1,-16.5z" fill="#ffffff" stroke="#696969" stroke-width="2"/>
        <line stroke="#000" x1="64.7" x2="145.4" y1="123" y2="123"/>
        <line stroke="#000" x1="64.1" x2="144.9" y1="138" y2="138"/>
        <line stroke="#000" x1="64.6" x2="145.4" y1="152" y2="152"/>
    </svg>`;
}

function renderNotebooks() {
    const container = document.getElementById('notebooksList');
    container.innerHTML = '';
    
    appData.notebooks.forEach(nb => {
        const count = Object.values(appData.notes).filter(n => n.notebookId === nb.id).length;
        const links = nb.links || [];
        const isLinked = links.length > 0;
        
        const div = document.createElement('div');
        div.className = `notebook-item ${currentNotebookId === nb.id ? 'active' : ''}`;
        
        div.onclick = (e) => {
            if (e.target.closest('.notebook-actions')) return;
            if (e.target.closest('.color-grid-popup')) return;
            selectNotebook(nb.id);
            toggleSidebar();
        };
        
        // Grilla 4x4 de 16 colores básicos compatibles con TTY

        const palette = ['#000000', '#800000', '#008000', '#808000', '#000080', '#800080', '#008080', '#C0C0C0', '#555555', '#FF0000', '#00FF00', '#FFFF00', '#0000FF', '#FF00FF', '#00FFFF', '#FFFFFF'];
        const swatches = palette.map(c => 
            `<div class="color-swatch" style="background:${c}" onclick="event.stopPropagation();changeColor(${nb.id},'${c}');closeColorGrid(${nb.id})" title="${c}"></div>`
        ).join('');
        
        div.innerHTML = `
            <div class="notebook-icon">
                ${getNotebookSVG(nb.color)}
            </div>
            <div class="notebook-info">
                <div class="notebook-title">${nb.name}</div>
                <div class="notebook-count">${count} nota${count !== 1 ? 's' : ''}</div>
            </div>
            <div class="notebook-actions">
                <div class="notebook-actions-row">
                    <div class="color-btn-wrapper btn-icon" title="Cambiar color" onclick="event.stopPropagation();toggleColorGrid(${nb.id})" id="colorBtn_${nb.id}">
                        <div class="color-btn-display" style="background:${nb.color}"></div>
                        <div class="color-grid-popup" id="colorGrid_${nb.id}" onclick="event.stopPropagation()">
                            ${swatches}
                        </div>
                    </div>
                    <button class="btn-icon btn-link ${isLinked ? 'linked' : ''}" onclick="event.stopPropagation();openLinkModal(${nb.id})" title="${isLinked ? 'Enlazada con: '+links.map(id=>{const n=appData.notebooks.find(x=>x.id===id);return n?n.name:'?';}).join(', ') : 'Enlazar con otra libreta'}">🔗</button>
                </div>
                <div class="notebook-actions-row">
                    <button class="btn-icon" onclick="event.stopPropagation();renameNotebook(${nb.id})" title="Renombrar">✎</button>
                    <button class="btn-icon btn-delete" onclick="event.stopPropagation();deleteNotebook(${nb.id})" title="Eliminar">🗑</button>
                </div>
            </div>
        `;
        
        container.appendChild(div);
    });
}

function toggleColorGrid(nbId) {
    const grid = document.getElementById(`colorGrid_${nbId}`);
    const allGrids = document.querySelectorAll('.color-grid-popup.open');
    allGrids.forEach(g => { if (g.id !== `colorGrid_${nbId}`) g.classList.remove('open'); });
    grid.classList.toggle('open');
    if (grid.classList.contains('open')) {
        // Cerrar al hacer clic fuera
        setTimeout(() => {
            document.addEventListener('click', function closeGrid(e) {
                if (!grid.contains(e.target)) {
                    grid.classList.remove('open');
                    document.removeEventListener('click', closeGrid);
                }
            });
        }, 10);
    }
}

function closeColorGrid(nbId) {
    const grid = document.getElementById(`colorGrid_${nbId}`);
    if (grid) grid.classList.remove('open');
}

let linkModalNotebookId = null;

function openLinkModal(nbId) {
    linkModalNotebookId = nbId;
    const nb = appData.notebooks.find(n => n.id === nbId);
    const currentLinks = nb.links || [];
    const list = document.getElementById('linkModalList');
    
    list.innerHTML = appData.notebooks
        .filter(n => n.id !== nbId)
        .map(n => {
            const checked = currentLinks.includes(n.id);
            return `<label class="link-modal-item ${checked ? 'selected' : ''}">
                <input type="checkbox" value="${n.id}" ${checked ? 'checked' : ''}
                    onchange="this.closest('.link-modal-item').classList.toggle('selected',this.checked)">
                <span style="color:${n.color}">🕮</span>
                <span>${n.name}</span>
            </label>`;
        }).join('');
    
    if (appData.notebooks.length < 2) {
        list.innerHTML = '<div style="opacity:0.6;font-size:0.85rem;padding:8px;">No hay otras libretas.</div>';
    }
    
    // Mostrar botón "Ver fichas" solo si ya hay relaciones guardadas
    document.getElementById('linkModalViewBtn').style.display = currentLinks.length > 0 ? 'block' : 'none';
    
    document.getElementById('linkModalBackdrop').classList.add('open');
}

function viewLinkedAndClose() {
    const nbId = linkModalNotebookId;
    closeLinkModal();
    toggleSidebar();
    openRelatedNotebooks(nbId);
}

function closeLinkModal() {
    document.getElementById('linkModalBackdrop').classList.remove('open');
    linkModalNotebookId = null;
}

function saveLinkModal() {
    if (!linkModalNotebookId) return;
    const nb = appData.notebooks.find(n => n.id === linkModalNotebookId);
    if (!nb) return;
    
    const checked = [...document.querySelectorAll('#linkModalList input[type=checkbox]:checked')].map(cb => parseInt(cb.value));
    
    // Bidireccional: sincronizar ambas partes
    const oldLinks = nb.links || [];
    
    // Quitar vínculo de las que se deslinkaron
    oldLinks.forEach(otherId => {
        if (!checked.includes(otherId)) {
            const other = appData.notebooks.find(n => n.id === otherId);
            if (other) other.links = (other.links || []).filter(id => id !== linkModalNotebookId);
        }
    });
    
    // Agregar vínculo a las nuevas
    checked.forEach(otherId => {
        const other = appData.notebooks.find(n => n.id === otherId);
        if (other) {
            if (!other.links) other.links = [];
            if (!other.links.includes(linkModalNotebookId)) other.links.push(linkModalNotebookId);
        }
    });
    
    nb.links = checked;
    saveData();
    closeLinkModal();
    renderNotebooks();
    showToast(checked.length > 0 ? `Enlazada con ${checked.length} libreta${checked.length>1?'s':''}` : 'Enlaces eliminados');
}

function selectNotebook(id) {
    currentNotebookId = id;
    relatedViewNotebookId = null;
    // NO limpiar filtros al cambiar de libreta
    showNotesView();
    renderNotebooks();
    renderNotes();
    updateViewInfo();
}

function showAllNotes() {
    currentNotebookId = null;
    relatedViewNotebookId = null;
    showNotesView();
    renderNotebooks();
    renderNotes();
    updateViewInfo();
}

// Filtros de búsqueda y etiqueta SIEMPRE globales; libreta solo filtra si no hay otros filtros activos
function renderNotes() {
    const container = document.getElementById('notesGrid');
    
    // 1. Empezar con TODAS las notas del sistema
    let allNotes = Object.values(appData.notes);
    
    const hasActiveFilters = activeSearch || activeTagFilter;

    // 2. Si hay filtros activos (búsqueda o etiqueta), son GLOBALES: ignorar libreta seleccionada
    // Si no hay filtros, respetar la libreta seleccionada
    let notesToShow = allNotes;
    if (!hasActiveFilters && currentNotebookId) {
        notesToShow = allNotes.filter(n => n.notebookId === currentNotebookId);
    }

    // 3. Aplicar búsqueda GLOBAL
    if (activeSearch) {
        const s = activeSearch.toLowerCase();
        notesToShow = notesToShow.filter(n => 
            n.title.toLowerCase().includes(s) ||
            n.author.toLowerCase().includes(s) ||
            n.content.toLowerCase().includes(s) ||
            n.tags.some(t => t.toLowerCase().includes(s))
        );
    }
    
    // 4. Aplicar filtro de etiqueta GLOBAL
    if (activeTagFilter) {
        notesToShow = notesToShow.filter(n => n.tags.includes(activeTagFilter));
    }
    
    // 5. Ordenar
    const sortType = document.getElementById('sortSelect').value;
    notesToShow.sort((a, b) => {
        switch(sortType) {
            case 'newest': return b.createdAt - a.createdAt;
            case 'oldest': return a.createdAt - b.createdAt;
            case 'title': return a.title.localeCompare(b.title);
            case 'titleDesc': return b.title.localeCompare(a.title);
            case 'size': return new Blob([b.content]).size - new Blob([a.content]).size;
            default: return 0;
        }
    });
    
    container.innerHTML = '';
    
    // Botón agregar solo si hay libreta seleccionada Y no hay filtros activos
    if (currentNotebookId && !hasActiveFilters) {
        const addBtn = document.createElement('div');
        addBtn.className = 'add-note-card';
        addBtn.innerHTML = '+';
        addBtn.onclick = () => openNoteModal();
        container.appendChild(addBtn);
    }
    
    // Mensaje si no hay notas
if (notesToShow.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.style.gridColumn = 'auto'; // no ocupa toda la fila
    empty.style.display = 'flex';
    empty.style.alignItems = 'center';
    empty.style.justifyContent = 'center';
    empty.style.opacity = '0.5';
    empty.style.minHeight = '160px';
    if (!currentNotebookId && !activeSearch && !activeTagFilter) {
        empty.innerHTML = '<div><h3>Selecciona una libreta</h3><p>Haz clic en ☰ para ver tus libretas</p></div>';
    } else if (activeSearch || activeTagFilter) {
        empty.innerHTML = '<div><h3>Sin coincidencias</h3><p>No hay notas que coincidan</p></div>';
    } else {
        empty.innerHTML = '<div><h3>Sin notas</h3><p>Crea una con el botón +</p></div>';
    }
    container.appendChild(empty);
    return;
}
    
    // Renderizar notas
    notesToShow.forEach(note => {
        const card = document.createElement('div');
        card.className = 'note-card';
        card.onclick = () => openPreview(note.id);
        
        const size = new Blob([note.content]).size;
        const notebook = appData.notebooks.find(n => n.id === note.notebookId);
        const links = notebook ? (notebook.links || []) : [];
        const hasLinks = links.length > 0;
        
        let nbBadge = '';
        if (notebook) {
            if (hasLinks) {
                const linkedNames = links.map(id => {
                    const nb = appData.notebooks.find(x => x.id === id);
                    return nb ? `<span style="color:${nb.color}">🕮 ${nb.name}</span>` : '';
                }).filter(Boolean).join('<br>');
                nbBadge = `<span class="note-nb-badge has-links" 
                    onclick="event.stopPropagation();openRelatedNotebooks(${note.notebookId})"
                    onmouseenter="showNbTooltip(event,${note.notebookId})"
                    onmouseleave="hideNbTooltip()">
                    <span style="color:${notebook.color}">🕮</span> ${notebook.name} 🔗
                </span>`;
            } else {
                nbBadge = `<span class="note-nb-badge" 
                    onclick="event.stopPropagation();selectNotebookFromCard(${notebook.id})"
                    title="Ver libreta: ${notebook.name}">
                    <span style="color:${notebook.color}">🕮</span> ${notebook.name}
                </span>`;
            }
        }
        
        card.innerHTML = `
            <div style="margin-bottom: 10px;">
                <div style="font-size: 1rem; font-weight: bold; margin-bottom: 6px; color: #888;text-shadow: 1px 1px 0 #000;">${note.title || 'Sin título'}</div>
                <div class="note-meta">
                    <span>${note.author || 'Sin autor'}</span>
                    ${nbBadge}
                </div>
                <div class="note-meta">
                    <span title="Creación">✦ ${formatDateTime(note.createdAt)}</span>
                    <span title="Modificación">✎ ${note.updatedAt ? formatDateTime(note.updatedAt) : '-'}</span>
                    <span>${formatBytes(size)}</span>
                </div>
            </div>
            <div class="note-tags">
                ${note.tags.map(t => `
                    <span class="tag ${t === 'urgente' ? 'tag-urgente' : t === 'importante' ? 'tag-importante' : ''}" 
                          onclick="event.stopPropagation(); filterTag('${t}')">${t}</span>
                `).join('')}
            </div>
            <div class="note-preview"></div>
        `;
        // Postprocesar checkboxes en la preview de la card (DOM)
        const previewEl = card.querySelector('.note-preview');
        previewEl.innerHTML = marked.parse(note.content);
        previewEl.querySelectorAll('input[type=checkbox]').forEach(cb => {
            const li = cb.closest('li');
            cb.setAttribute('disabled', '');
            if (li) {
                li.classList.add('task-list-item');
                if (cb.checked) li.classList.add('checked');
            }
        });
        
        container.appendChild(card);
    });
}

function updateViewInfo() {
    const info = document.getElementById('viewInfo');
    const title = document.getElementById('viewTitle');
    
    if (currentNotebookId) {
        const nb = appData.notebooks.find(n => n.id === currentNotebookId);
        info.style.display = 'flex';
        title.innerHTML = `<span style="color:${nb?.color || '#fff'}">🕮</span> ${nb?.name || 'Libreta'}`;
    } else {
        info.style.display = 'none';
    }
    
    updateFilterInfo();
}

function updateFilterInfo() {
    const info = document.getElementById('filterInfo');
    const badges = document.getElementById('filterBadges');
    
    let html = '';
    const hasActiveFilters = activeSearch || activeTagFilter;

    if (hasActiveFilters && currentNotebookId) {
        html += `<span style="opacity:0.7;font-size:0.8rem;">🌐 Búsqueda global</span>`;
    }
    if (activeSearch) {
        html += `<span class="filter-badge">🔍 "${activeSearch}"<button onclick="clearFilter('search')">✕</button></span>`;
    }
    if (activeTagFilter) {
        html += `<span class="filter-badge">🏷️ ${activeTagFilter}<button onclick="clearFilter('tag')">✕</button></span>`;
    }
    
    badges.innerHTML = html;
    info.style.display = html ? 'flex' : 'none';
}

function clearFilter(type) {
    if (type === 'search') activeSearch = '';
    if (type === 'tag') {
        activeTagFilter = '';
        document.getElementById('tagFilterBtn').classList.remove('active');
    }
    document.getElementById('searchInput').value = activeSearch;
    renderNotes();
    updateFilterInfo();
}

function showNbTooltip(e, nbId) {
    const nb = appData.notebooks.find(n => n.id === nbId);
    const links = nb ? (nb.links || []) : [];
    const names = links.map(id => {
        const n = appData.notebooks.find(x => x.id === id);
        return n ? `<span style="color:${n.color}">🕮 ${n.name}</span>` : '';
    }).filter(Boolean).join('<br>');
    const t = document.getElementById('globalTooltip');
    t.innerHTML = 'Enlazadas:<br>' + names;
    t.style.display = 'block';
    const rect = e.currentTarget.getBoundingClientRect();
    t.style.left = rect.left + 'px';
    t.style.top = (rect.top - t.offsetHeight - 8) + 'px';
    // Guardar referencia al badge activo para forzar ocultar
    t._activeBadge = e.currentTarget;
}

function hideNbTooltip() {
    document.getElementById('globalTooltip').style.display = 'none';
}

function selectNotebookFromCard(nbId) {
    currentNotebookId = nbId;
    relatedViewNotebookId = null;
    activeSearch = '';
    activeTagFilter = '';
    document.getElementById('searchInput').value = '';
    showNotesView();
    renderNotebooks();
    renderNotes();
    updateViewInfo();
    showToast('Libreta seleccionada');
}

function openRelatedNotebooks(nbId) {
    // Mostrar fichas de la libreta actual + todas sus relacionadas, agrupadas
    const nb = appData.notebooks.find(n => n.id === nbId);
    if (!nb) return;
    const links = nb.links || [];
    const allIds = [nbId, ...links];
    
    // Desactivar filtros, usar vista especial
    activeSearch = '';
    activeTagFilter = '';
    document.getElementById('searchInput').value = '';
    currentNotebookId = null; // sin filtro único
    relatedViewNotebookId = nbId;
    showNotesView();
    
    // Renderizar agrupado
    const container = document.getElementById('notesGrid');
    container.innerHTML = '';
    
    const sortType = document.getElementById('sortSelect').value;
    
    allIds.forEach(id => {
        const curNb = appData.notebooks.find(n => n.id === id);
        if (!curNb) return;
        let notes = Object.values(appData.notes).filter(n => n.notebookId === id);
        notes.sort((a, b) => {
            switch(sortType) {
                case 'newest': return b.createdAt - a.createdAt;
                case 'oldest': return a.createdAt - b.createdAt;
                case 'title': return a.title.localeCompare(b.title);
                case 'titleDesc': return b.title.localeCompare(a.title);
                case 'size': return new Blob([b.content]).size - new Blob([a.content]).size;
                default: return 0;
            }
        });
        
        // Cabecera de grupo
        const header = document.createElement('div');
        header.className = 'related-group-header';
        header.style.borderLeftColor = curNb.color;
        header.innerHTML = `<span style="color:${curNb.color}">🕮</span> ${curNb.name} <span style="font-weight:normal;opacity:0.6;">(${notes.length} nota${notes.length!==1?'s':''})</span>`;
        container.appendChild(header);
        
        notes.forEach(note => {
            const card = document.createElement('div');
            card.className = 'note-card';
            card.onclick = () => openPreview(note.id);
            const size = new Blob([note.content]).size;
            card.innerHTML = `
                <div style="margin-bottom:10px;">
                    <div style="font-size:1rem;font-weight:bold;margin-bottom:6px;color:#888;text-shadow:1px 1px 0 #000;">${note.title || 'Sin título'}</div>
                    <div class="note-meta">
                        <span>${note.author || 'Sin autor'}</span>
                    </div>
                    <div class="note-meta">
                        <span title="Creación">✦ ${formatDateTime(note.createdAt)}</span>
                        <span title="Modificación">✎ ${note.updatedAt ? formatDateTime(note.updatedAt) : '-'}</span>
                        <span>${formatBytes(size)}</span>
                    </div>
                </div>
                <div class="note-tags">${note.tags.map(t=>`<span class="tag ${t==='urgente'?'tag-urgente':t==='importante'?'tag-importante':''}" onclick="event.stopPropagation();filterTag('${t}')">${t}</span>`).join('')}</div>
                <div class="note-preview"></div>
            `;
            const rpv = card.querySelector('.note-preview');
            rpv.innerHTML = marked.parse(note.content);
            rpv.querySelectorAll('input[type=checkbox]').forEach(cb => {
                const li = cb.closest('li');
                cb.setAttribute('disabled', '');
                if (li) { li.classList.add('task-list-item'); if (cb.checked) li.classList.add('checked'); }
            });
            container.appendChild(card);
        });

        // Card agregar nota — siempre al final del grupo
        const addCard = document.createElement('div');
        addCard.className = 'add-note-card';
        addCard.innerHTML = '+';
        addCard.title = `Nueva nota en ${curNb.name}`;
        addCard.onclick = () => openNoteModal(null, curNb.id);
        container.appendChild(addCard);
    });
    
    // Actualizar view-info
    const info = document.getElementById('viewInfo');
    const title = document.getElementById('viewTitle');
    info.style.display = 'flex';
    title.innerHTML = `<span style="color:${nb.color}">🕮</span> ${nb.name} + enlazadas`;
    document.getElementById('filterInfo').style.display = 'none';
    renderNotebooks();
    showToast(`Vista: ${nb.name} + ${links.length} enlazada${links.length!==1?'s':''}`);
}

function openNewNotebookModal() {
    if (sidebarOpen) toggleSidebar();
    document.getElementById('newNotebookName').value = '';
    document.getElementById('newNotebookModal').classList.add('open');
    setTimeout(() => document.getElementById('newNotebookName').focus(), 100);
}

function closeNewNotebookModal() {
    document.getElementById('newNotebookModal').classList.remove('open');
}

// LIBRETAS
function addNotebook() {
    const name = document.getElementById('newNotebookName').value.trim();
    if (!name) return showToast('Nombre requerido', 'error');
    const id = appData.nextNotebookId++;
    appData.notebooks.push({ id, name, color: '#4A90D9' });
    document.getElementById('newNotebookName').value = '';
    closeNewNotebookModal();
    saveData();
    renderNotebooks();
    selectNotebook(id);
    showToast('Libreta creada');
}

function renameNotebook(id) {
    const nb = appData.notebooks.find(n => n.id === id);
    if (!nb) return;
    
    const newName = prompt('Nuevo nombre:', nb.name);
    if (newName && newName.trim()) {
        nb.name = newName.trim();
        saveData();
        renderNotebooks();
        if (currentNotebookId === id) updateViewInfo();
        showToast('Libreta renombrada');
    }
    
    if (document.getElementById('homeScreen').style.display !== 'none') {
    renderHomeScreen();
    }
}

function changeColor(id, color) {
    const nb = appData.notebooks.find(n => n.id === id);
    if (!nb) return;
    
    nb.color = color;
    saveData();
    renderNotebooks();
    if (currentNotebookId === id) updateViewInfo();
    showToast('Color actualizado');
    if (document.getElementById('homeScreen').style.display !== 'none') {
    renderHomeScreen();
    }
}

function deleteNotebook(id) {
    if (!confirm('¿Eliminar libreta y todas sus notas?')) return;
    
    appData.notebooks = appData.notebooks.filter(n => n.id !== id);
    Object.keys(appData.notes).forEach(k => {
        if (appData.notes[k].notebookId === id) delete appData.notes[k];
    });
    // Limpiar referencias bidireccionales
    appData.notebooks.forEach(nb => {
        if (nb.links) nb.links = nb.links.filter(lid => lid !== id);
    });
    
    if (currentNotebookId === id) currentNotebookId = null;
    
    saveData();
    renderNotebooks();
    renderNotes();
    updateViewInfo();
    showToast('Libreta eliminada'); {
    renderHomeScreen();
    }
}

// NOTAS
let _noteModalOriginal = null; // snapshot al abrir el modal

function _getNoteModalSnapshot() {
    return {
        title: document.getElementById('editNoteTitle').value,
        author: document.getElementById('editNoteAuthor').value,
        tags: document.getElementById('editNoteTags').value,
        content: document.getElementById('editNoteContent').value,
        notebookId: document.getElementById('editNoteNotebook').value
    };
}

function _noteModalHasChanges() {
    if (!_noteModalOriginal) return false;
    const cur = _getNoteModalSnapshot();
    return JSON.stringify(cur) !== JSON.stringify(_noteModalOriginal);
}

function openNoteModal(noteId = null, forceNotebookId = null) {
    const targetNotebookId = forceNotebookId || currentNotebookId;
    if (!noteId && !targetNotebookId) {
        showToast('Primero selecciona una libreta', 'error');
        toggleSidebar();
        return;
    }
    
    currentNoteId = noteId;
    const modal = document.getElementById('noteModal');
    
    const sel = document.getElementById('editNoteNotebook');
    sel.innerHTML = appData.notebooks.map(nb => 
        `<option value="${nb.id}" ${nb.id === (noteId ? appData.notes[noteId]?.notebookId : targetNotebookId) ? 'selected' : ''}>${nb.name}</option>`
    ).join('');
    
    if (noteId) {
        const n = appData.notes[noteId];
        document.getElementById('noteModalTitle').textContent = 'Editar Nota';
        document.getElementById('editNoteTitle').value = n.title;
        document.getElementById('editNoteAuthor').value = n.author;
        document.getElementById('editNoteTags').value = n.tags.join(', ');
        document.getElementById('editNoteContent').value = n.content;
    } else {
        document.getElementById('noteModalTitle').textContent = 'Nueva Nota';
        document.getElementById('editNoteTitle').value = '';
        document.getElementById('editNoteAuthor').value = '';
        document.getElementById('editNoteTags').value = '';
        document.getElementById('editNoteContent').value = '';
    }
    
    modal.classList.add('show');
    // Snapshot del estado inicial para detectar cambios
    setTimeout(() => { _noteModalOriginal = _getNoteModalSnapshot(); }, 0);
}

function saveNote() {
    const title = document.getElementById('editNoteTitle').value.trim() || 'Sin título';
    const author = document.getElementById('editNoteAuthor').value.trim();
    const tags = document.getElementById('editNoteTags').value.split(',').map(t => t.trim()).filter(t => t);
    const content = document.getElementById('editNoteContent').value;
    const notebookId = parseInt(document.getElementById('editNoteNotebook').value);
    
    if (!content.trim()) return showToast('Contenido vacío', 'error');
    
    if (currentNoteId) {
        appData.notes[currentNoteId] = {
            ...appData.notes[currentNoteId],
            title, author, tags, content, notebookId,
            updatedAt: Date.now()
        };
    } else {
        const id = appData.nextNoteId++;
        appData.notes[id] = { 
            id, notebookId, title, author, tags, content, 
            createdAt: Date.now(), updatedAt: Date.now() 
        };
        currentNoteId = id;
    }
    
    saveData();
    renderNotebooks();
    _noteModalOriginal = null;
    _noteModalOriginal = null;
    closeModal('noteModal');
    showToast('Nota guardada');
    if (relatedViewNotebookId) {
        openRelatedNotebooks(relatedViewNotebookId);
    } else {
        renderNotes();
    }
    openPreview(currentNoteId);
}

function deleteCurrentNote() {
    if (!currentNoteId || !confirm('¿Eliminar nota?')) return;
    delete appData.notes[currentNoteId];
    saveData();
    renderNotebooks();
    renderNotes();
    closeModal('noteModal');
    showToast('Nota eliminada');
}

function exportCurrentNote() {
    if (!currentNoteId) return;
    const note = appData.notes[currentNoteId];
    const blob = new Blob([`---\ntitle: ${note.title}\nauthor: ${note.author}\ntags: ${note.tags.join(', ')}\n---\n\n${note.content}`], {type: 'text/markdown'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${note.title.replace(/[^a-z0-9]/gi, '_')}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Nota exportada');
}

// PREVIEW
function openPreview(noteId) {
    currentNoteId = noteId;
    const note = appData.notes[noteId];
    const size = new Blob([note.content]).size;
    const notebook = appData.notebooks.find(n => n.id === note.notebookId);
    
    document.getElementById('previewTitle').textContent = note.title;
    // Renderizar body
    const previewBody = document.getElementById('previewBody');
    previewBody.innerHTML = marked.parse(note.content);
    // Postprocesar checkboxes en el DOM (evita problemas de regex sobre HTML)
    previewBody.querySelectorAll('input[type=checkbox]').forEach((cb, idx) => {
        const li = cb.closest('li');
        // Quitar disabled, habilitar interacción
        cb.removeAttribute('disabled');
        cb.style.cursor = 'pointer';
        // Aplicar clase y estilo verde si está marcado
        if (li) {
            li.classList.add('task-list-item');
            if (cb.checked) li.classList.add('checked');
        }
        cb.addEventListener('change', () => {
            const n = appData.notes[currentNoteId];
            let count = 0;
            n.content = n.content.replace(/- \[(x| )\] /g, (match) => {
                if (count === idx) { count++; return cb.checked ? '- [x] ' : '- [ ] '; }
                count++; return match;
            });
            n.updatedAt = Date.now();
            saveData();
            renderNotes();
            if (li) li.classList.toggle('checked', cb.checked);
        });
    });
    const notebookHtml = notebook ? (() => {
        const links = notebook.links || [];
        const hasLinks = links.length > 0;
        if (hasLinks) {
            const linkedNames = links.map(id => {
                const nb = appData.notebooks.find(x => x.id === id);
                return nb ? `${nb.name}` : '';
            }).filter(Boolean).join(', ');
            return `<div><div style="font-size:0.7rem;opacity:0.7;">Libreta</div><div style="font-weight:bold;color:${notebook.color};cursor:pointer;" onclick="closeModal('previewModal');openRelatedNotebooks(${notebook.id})" title="Ver enlazadas: ${linkedNames}">🕮 ${notebook.name} 🔗</div></div>`;
        }
        return `<div><div style="font-size:0.7rem;opacity:0.7;">Libreta</div><div style="font-weight:bold;color:${notebook.color};cursor:pointer;" onclick="closeModal('previewModal');selectNotebookFromCard(${notebook.id})">🕮 ${notebook.name}</div></div>`;
    })() : '';
    
    document.getElementById('previewMeta').innerHTML = `
        <div style="display: flex; flex-wrap: wrap; gap: 12px;">
            <div><div style="font-size:0.7rem;opacity:0.7;">Autor</div><div style="font-weight:bold;">${note.author || '-'}</div></div>
            <div><div style="font-size:0.7rem;opacity:0.7;">Creación</div><div style="font-weight:bold;">${formatDateTime(note.createdAt)}</div></div>
            <div><div style="font-size:0.7rem;opacity:0.7;">Modificación</div><div style="font-weight:bold;">${note.updatedAt ? formatDateTime(note.updatedAt) : '-'}</div></div>
            <div><div style="font-size:0.7rem;opacity:0.7;">Tamaño</div><div style="font-weight:bold;">${formatBytes(size)}</div></div>
            ${notebookHtml}
            <div style="flex:1;min-width:150px;"><div style="font-size:0.7rem;opacity:0.7;">Etiquetas</div><div>${note.tags.map(t => `<span class="tag" onclick="closeModal('previewModal'); filterTag('${t}')">${t}</span>`).join(' ')}</div></div>
        </div>
    `;
    document.getElementById('previewModal').classList.add('show');
    const pinBtn = document.getElementById('pinNoteBtn');
    pinBtn.style.opacity = note.pinned ? '1' : '0.4';
    pinBtn.title = note.pinned ? 'Desfijar nota' : 'Fijar nota';
}

function editFromPreview() {
    closeModal('previewModal');
    openNoteModal(currentNoteId);
}

function deleteFromPreview() {
    closeModal('previewModal');
    deleteCurrentNote();
}

function exportFromPreview() {
    if (!currentNoteId) return;
    const note = appData.notes[currentNoteId];
    const blob = new Blob([`---\ntitle: ${note.title}\nauthor: ${note.author}\ntags: ${note.tags.join(', ')}\n---\n\n${note.content}`], {type: 'text/markdown'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${note.title.replace(/[^a-z0-9]/gi, '_')}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Nota exportada');
}

function goHome() {
    currentNotebookId = null;
    relatedViewNotebookId = null;
    activeSearch = '';
    activeTagFilter = '';
    document.getElementById('searchInput').value = '';
    renderNotebooks();
    renderHomeScreen();
    updateViewInfo();
}

function renderHomeScreen() {
    document.getElementById('homeScreen').style.display = 'block';
    document.getElementById('notesView').style.display = 'none';
    const grid = document.getElementById('homeNotebooksGrid');
    grid.innerHTML = '';
    document.querySelector('#homeScreen h2').innerHTML =
        'Tus Libretas <button class="btn btn-ghost" onclick="showAllNotes()" style="width:auto;font-size:0.75rem;padding:4px 10px;vertical-align:middle;margin-left:10px;">Ver todas las notas</button>';

    // Notas fijadas
    const pinned = Object.values(appData.notes).filter(n => n.pinned);
    const pinnedSection = document.getElementById('homePinnedSection');
    if (pinned.length > 0) {
        pinnedSection.innerHTML = '<h3>📌 Notas fijadas</h3><div class="home-pinned-grid" id="homePinnedGrid"></div>';
        pinnedSection.style.display = 'block';
        const pg = document.getElementById('homePinnedGrid');
        pinned.forEach(note => {
            const card = document.createElement('div');
            card.className = 'home-pinned-card';
            card.textContent = note.title || 'Sin título';
            card.title = note.title;
            card.onclick = () => openPreview(note.id);
            pg.appendChild(card);
        });
    } else {
        pinnedSection.style.display = 'none';
    }

    appData.notebooks.forEach(nb => {
        const count = Object.values(appData.notes).filter(n => n.notebookId === nb.id).length;
        const card = document.createElement('div');
        card.className = 'home-nb-card';
        card.innerHTML = `
            <div class="home-nb-icon">${getNotebookSVG(nb.color)}</div>
            <div class="home-nb-name">${nb.name}</div>
            <div class="home-nb-count">${count} nota${count !== 1 ? 's' : ''}</div>
        `;
        card.onclick = () => { selectNotebook(nb.id); };
        grid.appendChild(card);
    });
    const addCard = document.createElement('div');
    addCard.className = 'home-nb-add';
    addCard.innerHTML = '+<span>Nueva libreta</span>';
    addCard.onclick = () => openNewNotebookModal();
    grid.appendChild(addCard);
}

function showNotesView() {
    document.getElementById('homeScreen').style.display = 'none';
    document.getElementById('notesView').style.display = 'block';
}

function togglePreviewMeta() {
    const meta = document.getElementById('previewMeta');
    const btn = document.getElementById('metaToggleBtn');
    const collapsed = meta.classList.toggle('collapsed');
    btn.textContent = collapsed ? '▶ Metadatos' : '▼ Metadatos';
}

// BÚSQUEDA Y FILTROS - SIEMPRE GLOBALES
function applySearch(val) {
    activeSearch = val.trim().toLowerCase();
    if (activeSearch) showNotesView();
    renderNotes();
    updateFilterInfo();
}

function clearSearch() {
    activeSearch = '';
    activeTagFilter = '';
    document.getElementById('searchInput').value = '';
    renderNotes();
    updateFilterInfo();
}

function filterTag(tag) {
    activeTagFilter = tag;
    document.getElementById('tagFilterBtn').classList.add('active');
    showNotesView();
    renderNotes();
    updateFilterInfo();
    showToast(`Filtrando: ${tag}`);
}

// TAGS DROPDOWN (montado en body, position:fixed para escapar overflow del modal)
function getAllTags() {
    const tagSet = new Set();
    Object.values(appData.notes).forEach(n => n.tags.forEach(t => tagSet.add(t)));
    return [...tagSet].sort();
}

function openTagsDropdown(rect) {
    const input = document.getElementById('editNoteTags');
    const dropdown = document.getElementById('tagsDropdown');
    const allTags = getAllTags();
    if (allTags.length === 0) { dropdown.style.display = 'none'; return; }

    const current = input.value.split(',').map(t => t.trim()).filter(Boolean);
    const filtered = allTags.filter(t => !current.includes(t));

    if (filtered.length === 0) { dropdown.style.display = 'none'; return; }

    dropdown.innerHTML = filtered.map(t => {
        const style = t === 'urgente' ? 'background:#7f1d1d;color:#fecaca;' :
                      t === 'importante' ? 'background:#14532d;color:#bbf7d0;' : 'color:#e0e0e0;';
        return `<div style="padding:7px 12px;cursor:pointer;font-size:0.82rem;${style}"
            onmousedown="event.preventDefault();addTagFromDropdown('${t}')"
            onmouseover="this.style.filter='brightness(1.3)'" onmouseout="this.style.filter=''">${t}</div>`;
    }).join('');

    dropdown.style.left = rect.left + 'px';
    dropdown.style.top = (rect.bottom + 4) + 'px';
    dropdown.style.width = 'auto';
    dropdown.style.minWidth = '160px';
    dropdown.style.display = 'block';
}

function toggleTagsDropdown() {
    const dropdown = document.getElementById('tagsDropdown');
    if (dropdown.style.display === 'block') { dropdown.style.display = 'none'; return; }
    const btn = document.getElementById('tagsDropdownBtn');
    const rect = btn.getBoundingClientRect();
    openTagsDropdown(rect);
}

function addTagFromDropdown(tag) {
    const input = document.getElementById('editNoteTags');
    const parts = input.value.split(',').map(t => t.trim()).filter(Boolean);
    const lastRaw = input.value.split(',').pop().trim();
    if (lastRaw && tag.toLowerCase().startsWith(lastRaw.toLowerCase())) {
        parts.pop();
    }
    if (!parts.includes(tag)) parts.push(tag);
    input.value = parts.join(', ') + ', ';
    document.getElementById('tagsDropdown').style.display = 'none';
    input.focus();
    input.selectionStart = input.selectionEnd = input.value.length;
}

document.addEventListener('click', (e) => {
    const dd = document.getElementById('tagsDropdown');
    if (!dd) return;
    const isToggleBtn = e.target.closest('button') && e.target.closest('button').getAttribute('onclick') === 'toggleTagsDropdown()';
    if (!isToggleBtn && e.target.id !== 'editNoteTags' && !dd.contains(e.target)) {
        dd.style.display = 'none';
    }
});

function togglePinNote() {
    if (!currentNoteId) return;
    const note = appData.notes[currentNoteId];
    note.pinned = !note.pinned;
    saveData();
    const btn = document.getElementById('pinNoteBtn');
    btn.style.opacity = note.pinned ? '1' : '0.4';
    btn.title = note.pinned ? 'Desfijar nota' : 'Fijar nota';
    showToast(note.pinned ? '📌 Nota fijada' : 'Nota desfijada');
}

function toggleTagFilterDropdown() {
    const dd = document.getElementById('tagFilterDropdown');
    if (dd.style.display === 'block') { dd.style.display = 'none'; return; }
    const allTags = [...new Set(Object.values(appData.notes).flatMap(n => n.tags))].sort();
    if (allTags.length === 0) { showToast('No hay etiquetas', 'error'); return; }
    dd.innerHTML = allTags.map(t => `
        <div class="tfd-item ${activeTagFilter === t ? 'active' : ''}" onclick="applyTagFilter('${t}')">
            <span class="tag ${t==='urgente'?'tag-urgente':t==='importante'?'tag-importante':''}" style="pointer-events:none;">${t}</span>
        </div>
    `).join('');
    const btn = document.getElementById('tagFilterBtn');
    const rect = btn.getBoundingClientRect();
    dd.style.top = (rect.bottom + 6) + 'px';
    dd.style.left = rect.left + 'px';
    dd.style.display = 'block';
    setTimeout(() => {
        document.addEventListener('click', function closeDd(e) {
            if (!dd.contains(e.target) && e.target.id !== 'tagFilterBtn') {
                dd.style.display = 'none';
                document.removeEventListener('click', closeDd);
            }
        });
    }, 10);
}

function applyTagFilter(tag) {
    document.getElementById('tagFilterDropdown').style.display = 'none';
    if (activeTagFilter === tag) {
        activeTagFilter = '';
        document.getElementById('tagFilterBtn').classList.remove('active');
    } else {
        activeTagFilter = tag;
        document.getElementById('tagFilterBtn').classList.add('active');
    }
    showNotesView();
    renderNotes();
    updateFilterInfo();
}

function insertMD(pre, post) {
    const el = document.getElementById('editNoteContent');
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const val = el.value;
    el.value = val.substring(0, start) + pre + val.substring(start, end) + post + val.substring(end);
    el.focus();
    el.selectionStart = el.selectionEnd = start + pre.length + (end - start);
}

function insertImgUrl() {
    const url = prompt('URL de la imagen:');
    if (!url || !url.trim()) return;
    const alt = prompt('Texto alternativo (opcional):') || 'imagen';
    insertMD(`![${alt}](${url.trim()})`, '');
}

function importMdFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        const text = ev.target.result;
        // Intentar extraer frontmatter YAML (---) si existe
        const fmMatch = text.match(/^---\n([\s\S]*?)\n---\n\n?([\s\S]*)$/);
        const el = document.getElementById('editNoteContent');
        if (fmMatch) {
            const fm = fmMatch[1];
            const body = fmMatch[2];
            const titleMatch  = fm.match(/^title:\s*(.+)$/m);
            const authorMatch = fm.match(/^author:\s*(.+)$/m);
            const tagsMatch   = fm.match(/^tags:\s*(.+)$/m);
            if (titleMatch)  document.getElementById('editNoteTitle').value  = titleMatch[1].trim();
            if (authorMatch) document.getElementById('editNoteAuthor').value = authorMatch[1].trim();
            if (tagsMatch)   document.getElementById('editNoteTags').value   = tagsMatch[1].trim();
            el.value = body;
        } else {
            el.value = text;
        }
        showToast('Archivo .md importado');
    };
    reader.readAsText(file);
    e.target.value = '';
}



// BACKUP
function exportData() {
    const d = new Date();
    const blob = new Blob([JSON.stringify(appData, null, 2)], {type: 'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `libretas_${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}_${d.getHours().toString().padStart(2,'0')}-${d.getMinutes().toString().padStart(2,'0')}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    _dataSnapshotOnLoad = JSON.stringify(appData);
    const badge = document.getElementById('unsavedBadge');
    if (badge) badge.style.display = 'none';
    showToast('Backup exportado');
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            if (data.notebooks && data.notes) {
                appData = data;
                saveData();
                currentNotebookId = null;
                activeSearch = '';
                activeTagFilter = '';
                renderNotebooks();
                renderNotes();
                updateViewInfo();
                showToast('Backup importado');
            } else throw new Error('Formato inválido');
        } catch (err) {
            showToast('Error al importar', 'error');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

function clearAllData() {
    if (!confirm('¿BORRAR TODO?')) return;
    appData = { notebooks: [], notes: {}, nextNotebookId: 1, nextNoteId: 1 };
    currentNotebookId = null;
    saveData();
    renderNotebooks();
    renderNotes();
    updateViewInfo();
    showToast('Datos eliminados');
}

// README - CORREGIDO
function openReadme() {
    document.getElementById('readmeModal').classList.add('show');
    switchReadmeTab('ES');
}

function switchReadmeTab(lang) {
    const content = document.getElementById(lang === 'EN' ? 'readme-en' : 'readme-es').textContent;
    document.getElementById('readmeContent').innerHTML = marked.parse(content);
    
    // Actualizar estilos de botones
    const esBtn = document.getElementById('tabES');
    const enBtn = document.getElementById('tabEN');
    
    if (lang === 'ES') {
        esBtn.style.background = '#4f46e5';
        esBtn.style.color = 'white';
        enBtn.style.background = '';
        enBtn.style.color = '';
    } else {
        enBtn.style.background = '#4f46e5';
        enBtn.style.color = 'white';
        esBtn.style.background = '';
        esBtn.style.color = '';
    }
}

function toggleTheme() {
    const isLight = document.body.classList.toggle('light');
    storage.setItem('theme', isLight ? 'light' : 'dark');
    document.getElementById('themeToggleBtn').textContent = isLight ? '🌙' : '☀️';
    renderNotebooks();
}

function applyTheme() {
    const theme = storage.getItem('theme') || 'dark';
    if (theme === 'light') {
        document.body.classList.add('light');
        document.getElementById('themeToggleBtn').textContent = '🌙';
    }
}

function closeModal(id) {
    if (id === 'noteModal' && _noteModalHasChanges()) {
        if (!confirm('Hay cambios sin guardar. ¿Cerrar sin guardar?')) return;
    }
    if (id === 'noteModal') _noteModalOriginal = null;
    document.getElementById(id).classList.remove('show');
    // Si la home está visible, refrescarla
    if (document.getElementById('homeScreen').style.display !== 'none') {
        renderHomeScreen();
    }
}

document.querySelectorAll('.modal').forEach(m => {
    m.addEventListener('click', (e) => { if (e.target === m) closeModal(m.id); });
});

// INICIALIZAR
applyTheme();
renderNotebooks();
renderHomeScreen(); // pantalla de inicio
updateViewInfo();

// Alerta al salir si hay cambios (backup)
let _dataSnapshotOnLoad = null;
setTimeout(() => { _dataSnapshotOnLoad = JSON.stringify(appData); }, 500);
window.addEventListener('beforeunload', (e) => {
    if (_dataSnapshotOnLoad && JSON.stringify(appData) !== _dataSnapshotOnLoad) {
        e.preventDefault();
        e.returnValue = '';
        return '';
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.show').forEach(m => closeModal(m.id));
        if (sidebarOpen) toggleSidebar();
    }
});

// Ocultar tooltip de libreta relacionada en cualquier clic o scroll
document.addEventListener('click', () => hideNbTooltip(), true);
document.addEventListener('scroll', () => hideNbTooltip(), true);
