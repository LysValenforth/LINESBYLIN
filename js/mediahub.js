// Load and render media items (beats, movies, tvshows)

document.addEventListener('DOMContentLoaded', () => {
  const category = document.body.dataset.mediahub;
  if (category && category !== 'beats') {
    loadMediaHubPage(category);
  }
  if (document.getElementById('mediahub-featured')) {
    loadMediaHubFeatured();
  }
});

async function loadMediaHubPage(category) {
  const grid        = document.getElementById('mediahub-grid');
  const searchInput = document.getElementById('search-input');
  if (!grid) return;

  grid.innerHTML = '<div class="loading"><div class="loading-spinner"></div><p>Loading...</p></div>';

  if (typeof getMediaHubByCategory !== 'function') {
    grid.innerHTML = '<p class="error-text">Firebase not configured.</p>';
    return;
  }

  let items = [];
  try {
    items = (await getMediaHubByCategory(category)).filter(i => i.category !== 'code');
  } catch (e) {
    grid.innerHTML = '<p class="error-text">Could not load items. Check Firebase config.</p>';
    return;
  }

  let activeGenre  = 'all';
  let activeStatus = 'all';
  let searchQuery  = '';

  const filterBar = document.createElement('div');
  filterBar.className = 'mh-filter-bar';
  grid.parentNode.insertBefore(filterBar, grid);

  function buildFilterBar(allItems) {
    const genres = ['all', ...new Set(
      allItems.map(i => (i.genre || '').split(',').map(g => g.trim())).flat().filter(Boolean)
    )];
    const statusLabels = { all: 'All', watched: 'Watched', watching: 'Watching', want: 'Want to Watch' };

    filterBar.innerHTML = `
      <div class="mh-filter-row">
        <div class="mh-filter-group">
          <span class="mh-filter-label">Genre</span>
          <div class="mh-pills" id="genre-pills">
            ${genres.map(g => `<button class="mh-pill${g === activeGenre ? ' active' : ''}" data-genre="${g}">${g === 'all' ? 'All' : g}</button>`).join('')}
          </div>
        </div>
        <div class="mh-filter-group">
          <span class="mh-filter-label">Status</span>
          <div class="mh-pills" id="status-pills">
            ${['all','watched','watching','want'].map(s => `<button class="mh-pill mh-pill-status${s === activeStatus ? ' active' : ''}" data-status="${s}">${statusLabels[s]}</button>`).join('')}
          </div>
        </div>
      </div>
      <div class="mh-results-count" id="mh-count"></div>
    `;

    filterBar.querySelectorAll('[data-genre]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeGenre = btn.dataset.genre;
        filterBar.querySelectorAll('[data-genre]').forEach(b => b.classList.toggle('active', b.dataset.genre === activeGenre));
        applyFilters();
      });
    });
    filterBar.querySelectorAll('[data-status]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeStatus = btn.dataset.status;
        filterBar.querySelectorAll('[data-status]').forEach(b => b.classList.toggle('active', b.dataset.status === activeStatus));
        applyFilters();
      });
    });
  }

  function applyFilters() {
    let list = items;
    if (searchQuery) {
      list = list.filter(i =>
        (i.title || '').toLowerCase().includes(searchQuery) ||
        (i.creator || '').toLowerCase().includes(searchQuery) ||
        (i.genre || '').toLowerCase().includes(searchQuery) ||
        (i.description || '').toLowerCase().includes(searchQuery)
      );
    }
    if (activeGenre !== 'all') {
      list = list.filter(i => (i.genre || '').split(',').map(g => g.trim()).includes(activeGenre));
    }
    if (activeStatus !== 'all') {
      list = list.filter(i => (i.status || '') === activeStatus);
    }
    renderGrid(list);
  }

  function renderGrid(list) {
    const countEl = document.getElementById('mh-count');
    if (countEl) {
      countEl.textContent = list.length === items.length
        ? `${items.length} ${items.length === 1 ? 'item' : 'items'}`
        : `${list.length} of ${items.length} items`;
    }
    if (list.length === 0) {
      grid.innerHTML = buildEmptyState(category, activeGenre, activeStatus, searchQuery);
      return;
    }
    grid.innerHTML = '';
    list.forEach(item => grid.appendChild(buildMediaCard(item, category)));
  }

  buildFilterBar(items);
  applyFilters();

  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => {
      searchQuery = searchInput.value.toLowerCase().trim();
      applyFilters();
    }, 200));
  }
}

function buildEmptyState(category, genre, status, query) {
  const catIcons = {
    movies:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M8 4v16M16 4v16M2 9h4M18 9h4M2 15h4M18 15h4"/></svg>`,
    tvshows: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M8 7L12 3l4 4"/><path d="M12 12v5M9 14.5h6"/></svg>`,
    beats:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 9l6 3-6 3V9z" fill="currentColor" stroke="none"/></svg>`,
  };
  const icon = catIcons[category] || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>`;

  let msg = '', sub = '';
  if (query) {
    msg = `No results for "${query}"`;
    sub = 'Try a different search term or clear the filters.';
  } else if (status !== 'all') {
    const labels = { watched: 'watched', watching: 'currently watching', want: 'on your want-to-watch list' };
    msg = `Nothing ${labels[status] || status} yet`;
    sub = genre !== 'all' ? 'Try removing the genre filter.' : 'Add something from the editor.';
  } else if (genre !== 'all') {
    msg = `No ${genre} titles yet`;
    sub = 'Try a different genre or add one from the editor.';
  } else {
    msg = 'Nothing here yet';
    sub = `Add your first ${category === 'tvshows' ? 'show' : category === 'movies' ? 'film' : 'item'} from the editor.`;
  }

  return `
    <div class="mh-empty-state">
      <div class="mh-empty-icon">${icon}</div>
      <p class="mh-empty-msg">${msg}</p>
      <p class="mh-empty-sub">${sub}</p>
    </div>`;
}

async function loadMediaHubFeatured() {
  const container = document.getElementById('mediahub-featured');
  if (!container) return;
  container.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';
  if (typeof getAllMediaHub !== 'function') { container.innerHTML = '<p class="error-text">Firebase not configured.</p>'; return; }
  try {
    const all = (await getAllMediaHub()).filter(i => i.category !== 'code');
    if (!all.length) { container.innerHTML = '<div class="empty-state"><p>No media added yet.</p></div>'; return; }
    container.innerHTML = '';
    const sections = [
      { key: 'movies',  label: 'Movies',  icon: 'assets/icons/movie.svg', items: all.filter(i => i.category === 'movies'),  href: 'movies.html',  gridCls: 'mhf-movie-grid', max: 6 },
      { key: 'tvshows', label: 'TV Shows', icon: 'assets/icons/tv.svg',    items: all.filter(i => i.category === 'tvshows'), href: 'tvshows.html', gridCls: 'mhf-movie-grid', max: 6 },
      { key: 'beats',   label: 'Beats',    icon: 'assets/icons/music.svg', items: all.filter(i => i.category === 'beats'),   href: 'beats.html',   gridCls: 'mhf-beats-grid', max: 9 },
    ];
    sections.forEach(({ key, label, icon, items, href, gridCls, max }) => {
      if (!items.length) return;
      const header = document.createElement('div');
      header.className = 'mhf-section-header';
      header.innerHTML = `<div class="mhf-section-title"><img src="${icon}" alt="" style="width:20px;height:20px;opacity:0.7;"><span>${label}</span></div><a href="${href}" class="mhf-view-all">View all →</a>`;
      container.appendChild(header);
      const g = document.createElement('div');
      g.className = gridCls;
      items.slice(0, max).forEach(item => g.appendChild(key === 'beats' ? buildBeatCard(item) : buildMovieCard(item, key)));
      container.appendChild(g);
    });
  } catch (e) {
    container.innerHTML = '<p class="error-text">Could not load media. Check Firebase config.</p>';
  }
}

function buildMediaCard(item, category) {
  if (category === 'code') return null;
  if (category === 'beats') return buildBeatCard(item);
  return buildMovieCard(item, category);
}

function buildMovieCard(item, category) {
  const card = document.createElement('div');
  card.className = 'media-card media-card-vertical';
  const statusMap = { watched:{label:'Watched',cls:'status-watched'}, watching:{label:'Watching',cls:'status-watching'}, want:{label:'Want to Watch',cls:'status-want'} };
  const si = statusMap[item.status];
  const badge = si ? `<span class="media-status-badge ${si.cls}">${si.label}</span>` : '';
  const poster = item.imageURL
    ? `<img class="media-card-poster" src="${item.imageURL}" alt="${item.title}" loading="lazy">`
    : `<div class="media-card-poster-placeholder"><img src="assets/icons/${category==='tvshows'?'tv':'movie'}.svg" style="width:48px;height:48px;opacity:0.3;" alt=""></div>`;
  const genres = (item.genre||'').split(',').map(g=>g.trim()).filter(Boolean).slice(0,2);
  const pills = genres.map(g=>`<span class="mc-genre-pill">${g}</span>`).join('');
  card.innerHTML = `
    <div class="mc-poster-wrap">
      ${poster}${badge}
      <div class="mc-poster-overlay"><span class="mc-view-hint">View Details</span></div>
    </div>
    <div class="mc-body">
      ${pills?`<div class="mc-genres">${pills}</div>`:''}
      <h3 class="mc-title">${item.title}</h3>
      ${item.creator?`<p class="mc-director"><span class="mc-meta-label">Dir.</span> ${item.creator.split(',')[0].trim()}</p>`:''}
      ${item.stars?`<p class="mc-stars-row"><span class="mc-meta-label">Stars</span> ${item.stars.split(',').slice(0,2).join(', ')}</p>`:''}
    </div>`;
  card.addEventListener('click', () => openMediaModal(item, category));
  return card;
}

function ensureMediaModal() {
  if (document.getElementById('media-detail-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'media-detail-modal';
  modal.className = 'mdm-backdrop';
  modal.innerHTML = `
    <div class="mdm-box" role="dialog" aria-modal="true">
      <button class="mdm-close" aria-label="Close">&times;</button>
      <div class="mdm-left" id="mdm-poster-col"></div>
      <div class="mdm-right" id="mdm-info-col"></div>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) closeMediaModal(); });
  modal.querySelector('.mdm-close').addEventListener('click', closeMediaModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMediaModal(); });
}

function openMediaModal(item, category) {
  ensureMediaModal();
  const modal     = document.getElementById('media-detail-modal');
  const posterCol = document.getElementById('mdm-poster-col');
  const infoCol   = document.getElementById('mdm-info-col');

  posterCol.innerHTML = item.imageURL
    ? `<img class="mdm-poster" src="${item.imageURL}" alt="${item.title}">`
    : `<div class="mdm-poster-fallback"><img src="assets/icons/${category==='tvshows'?'tv':'movie'}.svg" style="width:56px;opacity:0.3;" alt=""></div>`;

  const statusMap = { watched:{label:'Watched',cls:'status-watched'}, watching:{label:'Watching',cls:'status-watching'}, want:{label:'Want to Watch',cls:'status-want'} };
  const si    = statusMap[item.status];
  const badge = si ? `<span class="media-status-badge ${si.cls}" style="position:static;display:inline-block;margin-bottom:8px;">${si.label}</span>` : '';
  const genres = (item.genre||'').split(',').map(g=>g.trim()).filter(Boolean);
  const pills  = genres.map(g=>`<span class="mc-genre-pill">${g}</span>`).join('');
  const titleEl = item.infoLink
    ? `<a href="${item.infoLink}" target="_blank" rel="noopener noreferrer" class="mdm-title-link">${item.title}</a>`
    : item.title;
  let ratingHTML = '';
  if (item.rating) {
    const r = parseInt(item.rating);
    ratingHTML = `<div class="mdm-rating-row"><span class="mdm-section-label">My Rating</span><div class="mdm-stars">${Array.from({length:10},(_,i)=>`<span class="mdm-star${i<r?' filled':''}">★</span>`).join('')}</div><span class="mdm-rating-num">${r}/10</span></div>`;
  }

  infoCol.innerHTML = `
    ${badge}
    <h2 class="mdm-title">${titleEl}</h2>
    ${pills?`<div class="mc-genres" style="margin-bottom:6px;">${pills}</div>`:''}
    ${item.creator?`<p class="mdm-meta"><span class="mc-meta-label">${category==='tvshows'?'Creator':'Director'}</span> ${item.creator}</p>`:''}
    ${item.stars?`<p class="mdm-meta"><span class="mc-meta-label">Starring</span> ${item.stars}</p>`:''}
    ${ratingHTML}
    ${item.notes?`<div class="mdm-review-block"><span class="mdm-section-label">Why I Like It</span><p class="mdm-review-text">${item.notes}</p></div>`:''}
    ${item.videoURL?`<button class="mdm-trailer-btn" id="mdm-trailer-btn"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg> Watch Trailer</button><div class="mdm-trailer-embed hidden" id="mdm-trailer-embed"></div>`:''}`;

  if (item.videoURL) {
    const btn   = infoCol.querySelector('#mdm-trailer-btn');
    const embed = infoCol.querySelector('#mdm-trailer-embed');
    btn.addEventListener('click', () => {
      const isOpen = !embed.classList.contains('hidden');
      embed.innerHTML = isOpen ? '' : `<div class="video-embed"><iframe src="${item.videoURL}" allowfullscreen loading="lazy"></iframe></div>`;
      embed.classList.toggle('hidden', isOpen);
      btn.innerHTML = isOpen
        ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg> Watch Trailer`
        : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Close Trailer`;
    });
  }

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeMediaModal() {
  const modal = document.getElementById('media-detail-modal');
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
  const embed = document.getElementById('mdm-trailer-embed');
  if (embed) embed.innerHTML = '';
}

function buildBeatCard(item) {
  const card = document.createElement('article');
  card.className = 'mh-beat-card';
  const cover   = item.imageURL ? `<img class="mh-beat-cover" src="${item.imageURL}" alt="${item.title}">` : `<div class="mh-beat-cover-fallback">🎵</div>`;
  const titleEl = item.songLink ? `<a href="${item.songLink}" target="_blank" rel="noopener noreferrer" class="mh-beat-title">${item.title}</a>` : `<span class="mh-beat-title">${item.title}</span>`;
  const artistEl = item.creator
    ? (item.artistLink ? `<a href="${item.artistLink}" target="_blank" rel="noopener noreferrer" class="mh-beat-artist">${item.creator}</a>` : `<span class="mh-beat-artist">${item.creator}</span>`)
    : '';
  const audioEl = item.audioURL ? `<audio class="mh-beat-audio" controls preload="none" src="${item.audioURL}"></audio>` : '';
  card.innerHTML = `
    ${cover}
    <div class="mh-beat-body">
      ${item.genre?`<span class="mc-genre-pill" style="align-self:flex-start;">${item.genre}</span>`:''}
      <div class="mh-beat-title-row">${titleEl}${artistEl?`<span class="mh-beat-sep">·</span>${artistEl}`:''}</div>
      ${item.description?`<p class="mh-beat-desc">${item.description}</p>`:''}
      ${audioEl}
    </div>`;
  return card;
}