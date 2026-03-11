// Section creation, free-position canvas, resize, collision

// ── Section-level Undo Stack ──────────────────────────────────────────────────
const sectionHistory = [];
const MAX_HISTORY    = 30;

const CANVAS_W       = 760;
const CANVAS_PADDING = 16;
const MIN_SEC_W      = 160;
const MIN_SEC_H      = 48;

function snapshotSections() {
  return [...document.querySelectorAll('#editor-sections .editor-section')].map(w => ({
    type:    w.dataset.type,
    x:       parseInt(w.dataset.x)  || 0,
    y:       parseInt(w.dataset.y)  || 0,
    w:       parseInt(w.dataset.w)  || CANVAS_W - CANVAS_PADDING * 2,
    h:       parseInt(w.dataset.h)  || MIN_SEC_H,
    content: (() => {
      if (w.dataset.type === 'image') {
        const b = w.querySelector('.section-image');
        return b?.dataset.imageUrl || b?.querySelector('img')?.src || '';
      }
      if (w.dataset.type === 'divider') return '';
      const b = w.querySelector('[contenteditable]');
      return b ? b.innerHTML : '';
    })()
  }));
}

function pushHistory(label) {
  sectionHistory.push({ label, snap: snapshotSections() });
  if (sectionHistory.length > MAX_HISTORY) sectionHistory.shift();
}

function undoSectionAction() {
  if (sectionHistory.length === 0) { showToast('Nothing to undo.', 'warn'); return; }
  const { snap } = sectionHistory.pop();
  const container = document.getElementById('editor-sections');
  container.innerHTML = '';
  snap.forEach(sec => addSection(sec, false));
  if (typeof markDirty === 'function') markDirty();
  showToast('Undone.', 'info');
}

document.addEventListener('DOMContentLoaded', () => {
  bindSectionButtons();
  ensureCanvasHeight();

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      const active = document.activeElement;
      if (!active || active.getAttribute('contenteditable') !== 'true') {
        e.preventDefault();
        undoSectionAction();
      }
    }
    if (e.key === 'Tab') {
      const active = document.activeElement;
      const sec = active?.closest('.editor-section');
      if (!sec) return;
      e.preventDefault();
      const sections = [...document.querySelectorAll('#editor-sections .editor-section')];
      sections.sort((a, b) => (parseInt(a.dataset.y) || 0) - (parseInt(b.dataset.y) || 0));
      const idx    = sections.indexOf(sec);
      const target = e.shiftKey ? sections[idx - 1] : sections[idx + 1];
      const ed     = target?.querySelector('[contenteditable="true"]');
      if (ed) {
        ed.focus();
        const r = document.createRange(), s = window.getSelection();
        r.selectNodeContents(ed); r.collapse(false);
        s.removeAllRanges(); s.addRange(r);
      }
    }
  });

  // Toolbar dim
  document.addEventListener('focusin', (e) => {
    const inSection = e.target?.closest('#editor-sections');
    const toolbar   = document.querySelector('.editor-toolbar-top');
    if (toolbar) toolbar.classList.toggle('toolbar-active', !!inSection);
  });
  document.addEventListener('focusout', () => {
    setTimeout(() => {
      const focused   = document.activeElement;
      const inSection = focused?.closest('#editor-sections');
      const inToolbar = focused?.closest('.editor-toolbar-top');
      const toolbar   = document.querySelector('.editor-toolbar-top');
      if (toolbar) toolbar.classList.toggle('toolbar-active', !!(inSection || inToolbar));
    }, 100);
  });
});

// ─── Bind Buttons ─────────────────────────────────────────────────────────────

function bindSectionButtons() {
  const map = {
    'btn-add-title':     { type: 'title',    content: 'Section Title' },
    'btn-add-text':      { type: 'text',     content: '<p>Write your text here...</p>' },
    'btn-add-paragraph': { type: 'paragraph',content: '<p>A new paragraph. Click to edit.</p>' },
    'btn-add-quote':     { type: 'quote',    content: 'A beautiful thought goes here...' },
    'btn-add-divider':   { type: 'divider',  content: '' },
    'btn-add-image':     { type: 'image',    content: '' },
  };
  Object.entries(map).forEach(([id, sec]) => {
    document.getElementById(id)?.addEventListener('click', () => {
      pushHistory('add-' + sec.type);
      addSection({ ...sec });
    });
  });
}

// ─── Canvas helpers ───────────────────────────────────────────────────────────

function ensureCanvasHeight() {
  const container = document.getElementById('editor-sections');
  if (!container) return;
  const sections = [...container.querySelectorAll('.editor-section')];
  if (!sections.length) { container.style.minHeight = '500px'; return; }
  const maxBottom = Math.max(...sections.map(s =>
    (parseInt(s.dataset.y) || 0) + Math.max(s.offsetHeight, parseInt(s.dataset.h) || MIN_SEC_H)
  ));
  container.style.minHeight = (maxBottom + 80) + 'px';
}

function findFreePosition(newW, newH) {
  const container = document.getElementById('editor-sections');
  const sections  = [...container.querySelectorAll('.editor-section')];
  let x = CANVAS_PADDING, y = CANVAS_PADDING;
  for (let attempts = 0; attempts < 200; attempts++) {
    const clash = sections.find(s => rectsOverlap(
      { x, y, w: newW, h: newH },
      { x: parseInt(s.dataset.x)||0, y: parseInt(s.dataset.y)||0, w: parseInt(s.dataset.w)||200, h: parseInt(s.dataset.h)||MIN_SEC_H }
    ));
    if (!clash) break;
    y = (parseInt(clash.dataset.y)||0) + (parseInt(clash.dataset.h)||MIN_SEC_H) + 12;
  }
  return { x, y };
}

function rectsOverlap(a, b) {
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
}

function resolveCollisions(movedEl) {
  const container = document.getElementById('editor-sections');
  const all = [...container.querySelectorAll('.editor-section')];
  let changed = true, passes = 0;
  while (changed && passes < 20) {
    changed = false; passes++;
    for (const other of all) {
      if (other === movedEl) continue;
      if (rectsOverlap(getRect(movedEl), getRect(other))) {
        const newY = (parseInt(movedEl.dataset.y)||0) + Math.max(movedEl.offsetHeight, parseInt(movedEl.dataset.h)||MIN_SEC_H) + 12;
        other.dataset.y = newY;
        other.style.top = newY + 'px';
        changed = true;
        movedEl = other;
      }
    }
  }
  ensureCanvasHeight();
}

function getRect(el) {
  return {
    x: parseInt(el.dataset.x)||0, y: parseInt(el.dataset.y)||0,
    w: parseInt(el.dataset.w)||200,
    h: Math.max(el.offsetHeight, parseInt(el.dataset.h)||MIN_SEC_H),
  };
}

// ─── Add Section ──────────────────────────────────────────────────────────────

function addSection(sec, record = true) {
  const container = document.getElementById('editor-sections');
  if (!container) return;

  const noMsg       = document.getElementById('no-post-msg');
  const canvasInner = document.getElementById('editor-canvas-inner');
  if (noMsg)       noMsg.style.display       = 'none';
  if (canvasInner) canvasInner.style.display = 'block';

  container.style.position = 'relative';

  const defaultW = CANVAS_W - CANVAS_PADDING * 2;
  const defaultH = sec.type === 'divider' ? 24 : MIN_SEC_H;
  const w = sec.w != null ? parseInt(sec.w) : defaultW;
  const h = sec.h != null ? parseInt(sec.h) : defaultH;

  let x = sec.x != null ? parseInt(sec.x) : null;
  let y = sec.y != null ? parseInt(sec.y) : null;
  if (x == null || y == null) { const p = findFreePosition(w, h); x = p.x; y = p.y; }

  const wrapper = document.createElement('div');
  wrapper.className      = 'editor-section';
  wrapper.dataset.type   = sec.type;
  wrapper.dataset.x      = x; wrapper.dataset.y = y;
  wrapper.dataset.w      = w; wrapper.dataset.h = h;
  wrapper.style.cssText  = `position:absolute;left:${x}px;top:${y}px;width:${w}px;min-height:${h}px;box-sizing:border-box;`;

  // ── Drag handle ────────────────────────────────────────────────────────────
  const handle = document.createElement('div');
  handle.className = 'section-handle';
  handle.title     = 'Drag to move';
  handle.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" opacity="0.7">
    <circle cx="9" cy="5" r="1.8"/><circle cx="15" cy="5" r="1.8"/>
    <circle cx="9" cy="12" r="1.8"/><circle cx="15" cy="12" r="1.8"/>
    <circle cx="9" cy="19" r="1.8"/><circle cx="15" cy="19" r="1.8"/>
  </svg>`;

  // ── Side controls ──────────────────────────────────────────────────────────
  const sideCtrls = document.createElement('div');
  sideCtrls.className = 'section-controls-side';
  sideCtrls.innerHTML = `
    <button class="section-btn-side section-btn-up" title="Bring forward">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
    </button>
    <button class="section-btn-side section-btn-down" title="Send backward">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
    </button>
    <button class="section-btn-side section-btn-del" title="Delete">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;

  // ── Content block ──────────────────────────────────────────────────────────
  const block = document.createElement('div');
  switch (sec.type) {
    case 'title':
      block.className = 'section-title-block';
      block.setAttribute('contenteditable', 'true');
      block.setAttribute('data-placeholder', 'Section title...');
      block.innerHTML = sec.content || 'Section Title';
      break;
    case 'text':
    case 'paragraph':
      block.className = `section-${sec.type}`;
      block.setAttribute('contenteditable', 'true');
      block.setAttribute('data-placeholder', 'Write something...');
      block.innerHTML = sec.content || '';
      break;
    case 'quote':
      block.className = 'section-quote';
      block.setAttribute('contenteditable', 'true');
      block.setAttribute('data-placeholder', 'A quote...');
      block.innerHTML = sec.content || '';
      break;
    case 'image':
      block.className = 'section-image';
      if (sec.content) {
        block.innerHTML = `<img src="${sec.content}" alt="Post image" style="width:100%;border-radius:var(--radius-md);border:var(--border-width) solid var(--warm-beige);">`;
        block.dataset.imageUrl = sec.content;
      } else {
        block.innerHTML = `<div class="section-image-placeholder">Click to upload an image</div>`;
        block.querySelector('.section-image-placeholder')?.addEventListener('click', () => {
          window._pendingImageBlock = block;
          document.getElementById('image-upload-input')?.click();
        });
      }
      break;
    case 'divider':
      block.innerHTML = `<div class="section-divider-line"></div>`;
      break;
    default:
      block.className = 'section-text';
      block.setAttribute('contenteditable', 'true');
      block.innerHTML = sec.content || '';
  }

  wrapper.appendChild(handle);
  wrapper.appendChild(block);
  wrapper.appendChild(sideCtrls);

  // ── Resize handles ─────────────────────────────────────────────────────────
  if (sec.type !== 'divider') {
    ['sec-resize-e', 'sec-resize-s', 'sec-resize-se'].forEach(cls => {
      const rh = document.createElement('div');
      rh.className = `sec-resize ${cls}`;
      wrapper.appendChild(rh);
    });
  }

  container.appendChild(wrapper);
  ensureCanvasHeight();

  // ── Wire up interactions ───────────────────────────────────────────────────
  setupDragMove(wrapper, handle, container);
  if (sec.type !== 'divider') {
    wrapper.querySelector('.sec-resize-e')  && setupResize(wrapper, wrapper.querySelector('.sec-resize-e'),  container, 'e');
    wrapper.querySelector('.sec-resize-s')  && setupResize(wrapper, wrapper.querySelector('.sec-resize-s'),  container, 's');
    wrapper.querySelector('.sec-resize-se') && setupResize(wrapper, wrapper.querySelector('.sec-resize-se'), container, 'se');
  }

  sideCtrls.querySelector('.section-btn-del').addEventListener('click', () => {
    pushHistory('delete');
    wrapper.remove();
    ensureCanvasHeight();
    if (typeof markDirty === 'function') markDirty();
    updateWordCount();
    showToast('Section deleted — Ctrl+Z to undo', 'info');
  });
  sideCtrls.querySelector('.section-btn-up').addEventListener('click', () => {
    if (wrapper.nextElementSibling) { pushHistory('zorder'); container.appendChild(wrapper); if (typeof markDirty === 'function') markDirty(); }
  });
  sideCtrls.querySelector('.section-btn-down').addEventListener('click', () => {
    if (wrapper.previousElementSibling) { pushHistory('zorder'); container.insertBefore(wrapper, container.firstElementChild); if (typeof markDirty === 'function') markDirty(); }
  });

  if (block.getAttribute('contenteditable') === 'true') {
    setTimeout(() => block.focus(), 50);
    block.addEventListener('input', () => {
      wrapper.dataset.h = Math.max(wrapper.offsetHeight, MIN_SEC_H);
      ensureCanvasHeight();
      if (typeof markDirty === 'function') markDirty();
      updateWordCount();
    });
  }
}

// ─── Drag to Move ─────────────────────────────────────────────────────────────

function setupDragMove(wrapper, handle, container) {
  handle.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const startMX = e.clientX,  startMY = e.clientY;
    const startX  = parseInt(wrapper.dataset.x)||0;
    const startY  = parseInt(wrapper.dataset.y)||0;
    const w       = parseInt(wrapper.dataset.w)||200;
    wrapper.classList.add('is-dragging');
    wrapper.style.zIndex = 100;

    function onMove(ev) {
      const contW = container.getBoundingClientRect().width;
      const newX = Math.max(0, Math.min(contW - w - CANVAS_PADDING, startX + ev.clientX - startMX));
      const newY = Math.max(0, startY + ev.clientY - startMY);
      wrapper.dataset.x  = Math.round(newX);
      wrapper.dataset.y  = Math.round(newY);
      wrapper.style.left = newX + 'px';
      wrapper.style.top  = newY + 'px';
    }
    function onUp() {
      wrapper.classList.remove('is-dragging');
      wrapper.style.zIndex = '';
      resolveCollisions(wrapper);
      pushHistory('drag');
      if (typeof markDirty === 'function') markDirty();
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  });
}

// ─── Resize ───────────────────────────────────────────────────────────────────

function setupResize(wrapper, handle, container, dir) {
  handle.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    const startMX = e.clientX, startMY = e.clientY;
    const startW  = parseInt(wrapper.dataset.w)||200;
    const startH  = Math.max(wrapper.offsetHeight, parseInt(wrapper.dataset.h)||MIN_SEC_H);
    const contW   = container.getBoundingClientRect().width;
    wrapper.classList.add('is-resizing');
    wrapper.style.zIndex = 100;

    function onMove(ev) {
      const dx = ev.clientX - startMX;
      const dy = ev.clientY - startMY;
      if (dir === 'e' || dir === 'se') {
        const maxW = contW - (parseInt(wrapper.dataset.x)||0) - CANVAS_PADDING;
        const newW = Math.max(MIN_SEC_W, Math.min(maxW, startW + dx));
        wrapper.dataset.w   = Math.round(newW);
        wrapper.style.width = newW + 'px';
      }
      if (dir === 's' || dir === 'se') {
        const newH = Math.max(MIN_SEC_H, startH + dy);
        wrapper.dataset.h       = Math.round(newH);
        wrapper.style.minHeight = newH + 'px';
      }
    }
    function onUp() {
      wrapper.classList.remove('is-resizing');
      wrapper.style.zIndex = '';
      resolveCollisions(wrapper);
      pushHistory('resize');
      if (typeof markDirty === 'function') markDirty();
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  });
}

// ─── Gather Sections ──────────────────────────────────────────────────────────

function gatherSections() {
  const sections = [];
  document.querySelectorAll('#editor-sections .editor-section').forEach(wrapper => {
    const type  = wrapper.dataset.type;
    const block = wrapper.querySelector('[contenteditable], .section-image, .section-divider-line');
    let   content = '';
    if (type === 'image') {
      const b = wrapper.querySelector('.section-image');
      content = b?.dataset.imageUrl || b?.querySelector('img')?.src || '';
    } else if (type !== 'divider' && block) {
      content = block.innerHTML;
    }
    sections.push({
      type, content,
      x: parseInt(wrapper.dataset.x)||0,
      y: parseInt(wrapper.dataset.y)||0,
      w: parseInt(wrapper.dataset.w)||(CANVAS_W - CANVAS_PADDING * 2),
      h: Math.max(wrapper.offsetHeight, parseInt(wrapper.dataset.h)||MIN_SEC_H),
    });
  });
  return sections;
}