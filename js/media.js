/* ═══════════════════════════════════════════════════
   MEDIA HUB v3 — SCRIPTS
   ═══════════════════════════════════════════════════ */

/* === 1. GLOBAL NAV === */
function switchPage(page) {
    document.querySelectorAll('.nav-link').forEach(function(l) { l.classList.remove('active'); });
    var link = document.querySelector('.nav-link[data-page="' + page + '"]');
    if (link) link.classList.add('active');
    document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
    var target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    var nav = document.getElementById('navMenu');
    var tog = document.querySelector('.mobile-toggle');
    if (nav) nav.classList.remove('active');
    if (tog) tog.classList.remove('active');
    var input = target ? target.querySelector('.search-input') : null;
    if (input) { input.value = ''; filterCards(input); }
}
function toggleMobileNav() {
    var nav = document.getElementById('navMenu');
    var tog = document.querySelector('.mobile-toggle');
    if (nav) nav.classList.toggle('active');
    if (tog) tog.classList.toggle('active');
}
function scrollToPageTop(e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function toggleTheme() {
    var html = document.documentElement;
    var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    try { localStorage.setItem('mediahub-theme', next); } catch(e) {}
}
function openTrailer(btn) {
    var url = btn.getAttribute('data-trailer-url');
    if (!url) { alert('Set data-trailer-url to a YouTube embed URL'); return; }
    var modal = document.getElementById('trailerModal');
    var video = document.getElementById('tmVideo');
    video.innerHTML = '<iframe src="' + url + '?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/* === 2. DOM READY === */
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    generateBeatCards();
    generateFilmCards();
    initBadges();
    initSearch();
    initFavorites();
    initNowPlaying();
    initTrailerModal();
    initLightbox();
    initProgressBackToTop();
    initPlaceholderAutoHide();
    initCloseMobileOnResize();
    initCarousels();
    initCarousels();
});

/* === 3. THEME === */
function initTheme() {
    try { var s = localStorage.getItem('mediahub-theme'); if (s) document.documentElement.setAttribute('data-theme', s); } catch(e) {}
}

/* === 4. SVG ICON TEMPLATES === */
var ICONS = {
    favHeart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    musicNote: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
    filmReel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="2"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>',
    tvIcon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>',
    playBtn: '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
    spotify: '<svg viewBox="0 0 24 24"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>',
    apple: '<svg viewBox="0 0 24 24"><path d="M23.994 6.124a9.23 9.23 0 0 0-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043A5.022 5.022 0 0 0 19.32.028C18.408-.036 17.496.012 16.584.012c-3.456 0-6.912 0-10.368.012-1.128 0-2.268-.072-3.372.36C1.392.876.6 1.86.204 3.312a8.73 8.73 0 0 0-.18 1.548C-.012 6.168 0 7.476 0 8.784v6.432c0 1.308-.012 2.616.024 3.924.024.828.108 1.644.36 2.436.48 1.488 1.452 2.448 2.916 2.964.636.228 1.308.288 1.98.3 1.308.024 2.616.012 3.924.012h6.432c1.308 0 2.616.012 3.924-.024.828-.024 1.644-.108 2.436-.36 1.488-.48 2.448-1.452 2.964-2.916.228-.636.288-1.308.3-1.98.048-2.616.024-5.232.024-7.848-.012-1.308 0-2.616-.012-3.924zM17.4 16.476a.84.84 0 0 1-.84.84h-.024a.84.84 0 0 1-.816-.864V9.756L8.88 11.34v5.4c0 .06 0 .12-.012.18a.84.84 0 0 1-.852.72.84.84 0 0 1-.828-.852V8.868c0-.264.12-.504.324-.672a.898.898 0 0 1 .54-.18c.048 0 .108 0 .156.012l7.68-1.8c.288-.06.564 0 .78.18.228.192.36.48.36.78l-.024.012v9.276h.396z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24"><path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm4.872 13.344l-6.336 4.08c-.456.312-1.08.024-1.08-.528V7.104c0-.552.624-.84 1.08-.528l6.336 4.08c.408.264.408.888 0 1.152v.536z"/></svg>'
};

/* === 5. GENERATE BEAT CARDS (DRY) === */
function generateBeatCards() {
    var genres = [
        { id: 'pop-beats', border: 'pop', genre: 'pop' },
        { id: 'rnb-beats', border: 'rnb', genre: 'rnb' },
        { id: 'rock-beats', border: 'rock', genre: 'rock' }
    ];
    genres.forEach(function(g) {
        var grid = document.getElementById('grid-' + g.id);
        if (grid) grid.innerHTML = makeBeatCard(g) + makeBeatCard(g);
    });
}

function makeBeatCard(g) {
    return '<div class="beat-card genre-border-' + g.border + '" data-genre="' + g.genre + '">' +
        '<button class="card-favorite" aria-label="Favorite">' + ICONS.favHeart + '</button>' +
        '<div class="card-image"><img src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'400\'%3E%3Crect fill=\'%23d4cfca\' width=\'400\' height=\'400\'/%3E%3C/svg%3E" alt="Placeholder"><div class="placeholder-overlay"><div class="placeholder-icon">' + ICONS.musicNote + '</div><div class="placeholder-label">Replace Image Here</div></div></div>' +
        '<div class="card-body">' +
            '<a href="#REPLACE_ARTIST_LINK" class="artist-name" target="_blank" rel="noopener">Artist Name Here</a>' +
            '<a href="#REPLACE_SONG_LINK" class="song-title" target="_blank" rel="noopener">Song Title Here</a>' +
            '<div class="song-info">Brief description of the song. Edit freely.</div>' +
            '<div class="source-links"><span class="source-label">Listen on</span><div class="source-icons">' +
                '<a href="#REPLACE_SPOTIFY_LINK" target="_blank" rel="noopener" class="source-btn spotify" title="Spotify">' + ICONS.spotify + '</a>' +
                '<a href="#REPLACE_APPLE_LINK" target="_blank" rel="noopener" class="source-btn apple" title="Apple Music">' + ICONS.apple + '</a>' +
                '<a href="#REPLACE_YT_LINK" target="_blank" rel="noopener" class="source-btn youtube" title="YouTube Music">' + ICONS.youtube + '</a>' +
            '</div></div>' +
            '<div class="audio-player"><div class="placeholder-audio-label">Replace audio src with your .mp3 link</div><audio controls preload="none"><source src="#REPLACE_WITH_AUDIO_URL" type="audio/mpeg"></audio></div>' +
        '</div></div>';
}

/* === 6. GENERATE FILM / TV CARDS (DRY) === */
function generateFilmCards() {
    var movieGenres = [
        { id: 'comedy-movies', genre: 'comedy', tag1: 'Comedy', tag2: '2024', border: 'comedy' },
        { id: 'romance-movies', genre: 'romance', tag1: 'Romance', tag2: '2024', border: 'romance' },
        { id: 'action-movies', genre: 'action', tag1: 'Action', tag2: '2024', border: 'action' },
        { id: 'scifi-movies', genre: 'scifi', tag1: 'Sci-Fi', tag2: 'Thriller', border: 'scifi' }
    ];
    var tvGenres = [
        { id: 'cartoons-tv', genre: 'cartoon', tag1: 'Cartoon', tag2: '4 Seasons', border: 'kdrama' },
        { id: 'action-tv', genre: 'action', tag1: 'Action', tag2: 'Season 1', border: 'action' },
        { id: 'animated-tv', genre: 'animated', tag1: 'Animated', tag2: 'Season 1', border: 'romance' },
        { id: 'thriller-tv', genre: 'thriller', tag1: 'Drama', tag2: 'Thriller', border: 'thriller' }
    ];

    movieGenres.forEach(function(g) {
        var grid = document.getElementById('grid-' + g.id);
        if (grid && grid.children.length === 0) grid.innerHTML = makeFilmCard(g, false) + makeFilmCard(g, false);
    });
    tvGenres.forEach(function(g) {
        var grid = document.getElementById('grid-' + g.id);
        if (grid && grid.children.length === 0) grid.innerHTML = makeFilmCard(g, true) + makeFilmCard(g, true);
    });
}

function makeFilmCard(g, isTV) {
    var title = isTV ? 'TV Show Title Here' : 'Movie Title Here';
    var posterIcon = isTV ? ICONS.tvIcon : ICONS.filmReel;
    return '<div class="film-card genre-border-' + g.border + '" data-genre="' + g.genre + '" data-title="' + title + '">' +
        '<button class="card-favorite" aria-label="Favorite">' + ICONS.favHeart + '</button>' +
        '<div class="card-poster"><img src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'600\'%3E%3Crect fill=\'%23d4cfca\' width=\'400\' height=\'600\'/%3E%3C/svg%3E" alt="Poster"><div class="placeholder-overlay"><div class="placeholder-icon">' + posterIcon + '</div><div class="placeholder-label">Replace Poster Here</div></div></div>' +
        '<div class="card-body">' +
            '<a href="#REPLACE_TITLE_LINK" class="film-title-link" target="_blank" rel="noopener">' + title + '</a>' +
            '<div class="film-meta"><span class="meta-tag">' + g.tag1 + '</span><span class="meta-tag">' + g.tag2 + '</span></div>' +
            '<div class="synopsis">Write a short synopsis here. 2-3 sentences about the plot.</div>' +
            '<div class="personal-review"><span class="review-label">My Take:</span> <span class="review-text">Write your personal one-liner review here</span></div>' +
            '<div class="credits"><strong>Director:</strong> Director Name Here<br><strong>Stars:</strong> Actor 1, Actor 2, Actor 3</div>' +
            '<div class="watch-sources"><span class="watch-label">Where to watch:</span>' +
                '<a href="#REPLACE_LINK" class="watch-btn" target="_blank" rel="noopener">Netflix</a>' +
                '<a href="#REPLACE_LINK" class="watch-btn" target="_blank" rel="noopener">Disney+</a>' +
                '<a href="#REPLACE_LINK" class="watch-btn" target="_blank" rel="noopener">Prime</a>' +
            '</div>' +
            '<button class="trailer-btn" data-trailer-url="" onclick="openTrailer(this)">' + ICONS.playBtn + ' Watch Trailer</button>' +
        '</div></div>';
}

/* === 7. NAV BADGES === */
function initBadges() {
    var b = document.querySelectorAll('#page-beats .beat-card').length;
    var m = document.querySelectorAll('#page-movies .film-card').length;
    var t = document.querySelectorAll('#page-tvshows .film-card').length;
    var e1 = document.getElementById('badge-beats');
    var e2 = document.getElementById('badge-movies');
    var e3 = document.getElementById('badge-tvshows');
    if (e1) e1.textContent = b;
    if (e2) e2.textContent = m;
    if (e3) e3.textContent = t;
}

/* === 8. SEARCH === */
function initSearch() {
    document.querySelectorAll('.search-input').forEach(function(input) {
        input.addEventListener('input', function() { filterCards(this); });
    });
}
function filterCards(input) {
    var q = input.value.toLowerCase().trim();
    var page = document.getElementById('page-' + input.getAttribute('data-target'));
    if (!page) return;
    page.querySelectorAll('.beat-card, .film-card').forEach(function(card) {
        var text = card.textContent.toLowerCase();
        var genre = (card.getAttribute('data-genre') || '').toLowerCase();
        card.classList.toggle('search-hidden', q && text.indexOf(q) === -1 && genre.indexOf(q) === -1);
    });
    page.querySelectorAll('.genre-section').forEach(function(sec) {
        var vis = sec.querySelectorAll('.beat-card:not(.search-hidden), .film-card:not(.search-hidden)');
        sec.classList.toggle('search-hidden', vis.length === 0 && q.length > 0);
    });
}

/* === 9. FAVORITES === */
function initFavorites() {
    var favs = {};
    try { favs = JSON.parse(localStorage.getItem('mediahub-favs') || '{}'); } catch(e) {}
    document.querySelectorAll('.card-favorite').forEach(function(btn, idx) {
        var key = 'fav-' + idx;
        if (favs[key]) btn.classList.add('active');
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            this.classList.toggle('active');
            favs[key] = this.classList.contains('active');
            try { localStorage.setItem('mediahub-favs', JSON.stringify(favs)); } catch(e) {}
        });
    });
}

/* === 10. NOW PLAYING === */
function initNowPlaying() {
    var bar = document.getElementById('nowPlaying');
    if (!bar) return;
    var npTitle = document.getElementById('npTitle');
    var npArtist = document.getElementById('npArtist');
    var npCover = document.getElementById('npCover');
    var npClose = document.getElementById('npClose');

    document.querySelectorAll('.beat-card audio').forEach(function(audio) {
        audio.addEventListener('play', function() {
            document.querySelectorAll('.beat-card audio').forEach(function(a) { if (a !== audio) a.pause(); });
            var card = audio.closest('.beat-card');
            if (card) {
                var t = card.querySelector('.song-title');
                var a = card.querySelector('.artist-name');
                var img = card.querySelector('.card-image img');
                if (npTitle && t) npTitle.textContent = t.textContent;
                if (npArtist && a) npArtist.textContent = a.textContent;
                if (npCover && img) npCover.src = img.src;
            }
            bar.classList.add('active');
        });
        audio.addEventListener('ended', function() { bar.classList.remove('active'); });
    });
    if (npClose) npClose.addEventListener('click', function() {
        bar.classList.remove('active');
        document.querySelectorAll('.beat-card audio').forEach(function(a) { a.pause(); });
    });
}

/* === 11. TRAILER MODAL === */
function initTrailerModal() {
    var modal = document.getElementById('trailerModal');
    if (!modal) return;
    var close = document.getElementById('tmClose');
    var backdrop = modal.querySelector('.tm-backdrop');
    var video = document.getElementById('tmVideo');
    function cl() { modal.classList.remove('active'); document.body.style.overflow = ''; setTimeout(function() { video.innerHTML = ''; }, 300); }
    if (close) close.addEventListener('click', cl);
    if (backdrop) backdrop.addEventListener('click', cl);
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape' && modal.classList.contains('active')) cl(); });
}

/* === 12. LIGHTBOX === */
function initLightbox() {
    var lb = document.getElementById('lightbox');
    if (!lb) {
        document.body.insertAdjacentHTML('beforeend', '<div id="lightbox" class="lightbox"><button class="lightbox-close" aria-label="Close">&times;</button><div class="lightbox-content"></div><div class="lightbox-caption"></div></div>');
        lb = document.getElementById('lightbox');
    }
    var content = lb.querySelector('.lightbox-content');
    var caption = lb.querySelector('.lightbox-caption');
    var closeBtn = lb.querySelector('.lightbox-close');

    document.querySelectorAll('.beat-card .card-image, .film-card .card-poster').forEach(function(trigger) {
        trigger.style.cursor = 'pointer';
        trigger.addEventListener('click', function() {
            var img = this.querySelector('img');
            if (!img || (img.src || '').indexOf('data:image/svg+xml') !== -1) return;
            content.innerHTML = '<img src="' + img.src + '" alt="Preview">';
            var card = this.closest('.beat-card, .film-card');
            var cap = '';
            if (card) {
                var t = card.querySelector('.song-title, .film-title-link');
                var a = card.querySelector('.artist-name');
                if (t) cap = t.textContent;
                if (a) cap = a.textContent + ' — ' + cap;
            }
            if (caption) caption.textContent = cap;
            lb.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });
    function cl() { lb.classList.remove('active'); document.body.style.overflow = ''; setTimeout(function() { content.innerHTML = ''; if (caption) caption.textContent = ''; }, 300); }
    if (closeBtn) closeBtn.addEventListener('click', cl);
    lb.addEventListener('click', function(e) { if (e.target === lb) cl(); });
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape') cl(); });
}

/* === 13. PROGRESS BACK TO TOP === */
function initProgressBackToTop() {
    var wrap = document.getElementById('progressWrap');
    if (!wrap) return;
    var path = wrap.querySelector('path');
    if (!path) return;
    var len = path.getTotalLength();
    path.style.transition = 'none';
    path.style.strokeDasharray = len + ' ' + len;
    path.style.strokeDashoffset = len;
    path.getBoundingClientRect();
    path.style.transition = 'stroke-dashoffset 10ms linear';
    function update() { var s = window.scrollY; var h = document.documentElement.scrollHeight - window.innerHeight; if (h <= 0) return; path.style.strokeDashoffset = len - (s * len / h); }
    update();
    window.addEventListener('scroll', update);
    window.addEventListener('scroll', function() { wrap.classList.toggle('active-progress', window.scrollY > 100); });
    wrap.addEventListener('click', function(e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
}

/* === 14. PLACEHOLDER AUTO-HIDE === */
function initPlaceholderAutoHide() {
    document.querySelectorAll('.card-image, .card-poster').forEach(function(c) {
        var img = c.querySelector('img');
        var ov = c.querySelector('.placeholder-overlay');
        if (!img || !ov) return;
        var src = img.getAttribute('src') || '';
        // Hide overlay immediately if it's already a real image (not SVG placeholder)
        if (!src.startsWith('data:image/svg+xml')) {
            ov.style.display = 'none';
        }
        // Also hide overlay once a real image loads successfully
        img.addEventListener('load', function() {
            var currentSrc = img.getAttribute('src') || '';
            if (!currentSrc.startsWith('data:image/svg+xml')) ov.style.display = 'none';
        });
    });
    document.querySelectorAll('.audio-player').forEach(function(p) {
        var src = p.querySelector('audio source');
        var label = p.querySelector('.placeholder-audio-label');
        if (src && label) { var s = src.getAttribute('src') || ''; if (s && !s.startsWith('#')) label.style.display = 'none'; }
    });
}

/* === 15. MOBILE RESIZE === */
function initCloseMobileOnResize() {
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            var nav = document.getElementById('navMenu');
            var tog = document.querySelector('.mobile-toggle');
            if (nav) nav.classList.remove('active');
            if (tog) tog.classList.remove('active');
        }
    });
}

/* === 16. CAROUSEL === */
function initCarousels() {
    document.querySelectorAll('.card-grid').forEach(function(grid) {
        var cards = Array.from(grid.querySelectorAll('.film-card, .beat-card'));
        if (cards.length < 4) return;

        grid.classList.add('is-carousel');

        /* Build nav row */
        var nav = document.createElement('div');
        nav.className = 'carousel-nav';

        var prevBtn = document.createElement('button');
        prevBtn.className = 'carousel-btn carousel-prev';
        prevBtn.setAttribute('aria-label', 'Previous');
        prevBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';

        var dotsWrap = document.createElement('div');
        dotsWrap.className = 'carousel-dots';

        var nextBtn = document.createElement('button');
        nextBtn.className = 'carousel-btn carousel-next';
        nextBtn.setAttribute('aria-label', 'Next');
        nextBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';

        /* Create one dot per card */
        var dots = cards.map(function(_, i) {
            var dot = document.createElement('button');
            dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
            dot.addEventListener('click', function() { scrollTo(i); });
            dotsWrap.appendChild(dot);
            return dot;
        });

        nav.appendChild(prevBtn);
        nav.appendChild(dotsWrap);
        nav.appendChild(nextBtn);

        /* Insert nav after the grid (but before the back-to-top link) */
        grid.parentNode.insertBefore(nav, grid.nextSibling);

        function cardWidth() {
            var gap = parseFloat(getComputedStyle(grid).gap) || 40;
            return (cards[0] ? cards[0].offsetWidth : 320) + gap;
        }

        function currentIndex() {
            return Math.round(grid.scrollLeft / cardWidth());
        }

        function scrollTo(idx) {
            idx = Math.max(0, Math.min(cards.length - 1, idx));
            grid.scrollTo({ left: idx * cardWidth(), behavior: 'smooth' });
        }

        function updateState() {
            var idx = currentIndex();
            dots.forEach(function(d, i) { d.classList.toggle('active', i === idx); });
            prevBtn.disabled = idx === 0;
            nextBtn.disabled = idx >= cards.length - 1;
        }

        prevBtn.addEventListener('click', function() { scrollTo(currentIndex() - 1); });
        nextBtn.addEventListener('click', function() { scrollTo(currentIndex() + 1); });
        grid.addEventListener('scroll', updateState, { passive: true });
        updateState();
    });
}

/* === 16. CAROUSEL === */
function initCarousels() {
    document.querySelectorAll('.carousel-wrap[data-carousel]').forEach(function(wrap) {
        var track = wrap.querySelector('.carousel-track');
        var prevBtn = wrap.querySelector('.carousel-btn.prev');
        var nextBtn = wrap.querySelector('.carousel-btn.next');
        var dotsWrap = wrap.nextElementSibling;
        if (!track) return;

        var cards = track.querySelectorAll('.film-card');
        var total = cards.length;
        var current = 0;

        function getPerPage() {
            if (window.innerWidth >= 1025) return 3;
            if (window.innerWidth >= 769) return 2;
            return 1;
        }

        function maxIndex() {
            return Math.max(0, total - getPerPage());
        }

        function buildDots() {
            if (!dotsWrap || !dotsWrap.classList.contains('carousel-dots')) return;
            dotsWrap.innerHTML = '';
            var steps = maxIndex() + 1;
            for (var i = 0; i < steps; i++) {
                var dot = document.createElement('button');
                dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
                dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
                (function(idx) {
                    dot.addEventListener('click', function() { goTo(idx); });
                })(i);
                dotsWrap.appendChild(dot);
            }
        }

        function updateDots() {
            if (!dotsWrap || !dotsWrap.classList.contains('carousel-dots')) return;
            dotsWrap.querySelectorAll('.carousel-dot').forEach(function(d, i) {
                d.classList.toggle('active', i === current);
            });
        }

        function goTo(idx) {
            current = Math.max(0, Math.min(idx, maxIndex()));
            var card = track.querySelector('.film-card');
            if (!card) return;
            var slideW = card.offsetWidth + 24; // 24px gap
            track.style.transform = 'translateX(-' + (current * slideW) + 'px)';
            if (prevBtn) prevBtn.disabled = current === 0;
            if (nextBtn) nextBtn.disabled = current >= maxIndex();
            updateDots();
        }

        if (prevBtn) prevBtn.addEventListener('click', function() { goTo(current - 1); });
        if (nextBtn) nextBtn.addEventListener('click', function() { goTo(current + 1); });

        // Touch / swipe support
        var touchStartX = 0;
        track.addEventListener('touchstart', function(e) {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });
        track.addEventListener('touchend', function(e) {
            var diff = touchStartX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 48) goTo(diff > 0 ? current + 1 : current - 1);
        });

        // Keyboard navigation when focused inside
        wrap.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowRight') goTo(current + 1);
            if (e.key === 'ArrowLeft') goTo(current - 1);
        });

        var resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                buildDots();
                goTo(Math.min(current, maxIndex()));
            }, 120);
        });

        buildDots();
        goTo(0);
    });
}