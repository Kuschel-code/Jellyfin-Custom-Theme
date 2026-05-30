(function () {
    'use strict';

    var PLUGIN_ID = '78b7b285-8d9e-4e4c-8e4d-7a71f76d4e2a';
    var CT_CONFIG = null;

    var FONTS = [
        ['inter', 'Inter'], ['poppins', 'Poppins'], ['montserrat', 'Montserrat'],
        ['roboto', 'Roboto'], ['oswald', 'Oswald'], ['raleway', 'Raleway'],
        ['nunito', 'Nunito'], ['bebas', 'Bebas Neue'], ['lato', 'Lato'],
        ['sourcesans', 'Source Sans'], ['ubuntu', 'Ubuntu'], ['playfair', 'Playfair Display'],
        ['quicksand', 'Quicksand'], ['comfortaa', 'Comfortaa'], ['righteous', 'Righteous']
    ];

    // Mirrors the dashboard configuration page.
    var SECTIONS = [
        ['Netflix Features', [
            ['HeroBillboard', 'toggle', 'Hero carousel (replaces Media Bar)'],
            ['GenreRows', 'toggle', 'Genre rows (replaces Home Sections)'],
            ['NavTabs', 'toggle', 'Top nav tabs (replaces Custom Tabs)'],
            ['HoverPreviewCard', 'toggle', 'Hover expand card'],
            ['PreviewClips', 'toggle', 'Autoplay preview on hover'],
            ['TopTenRow', 'toggle', 'Top 10 numbers (first row)'],
            ['MatchScore', 'toggle', 'Green "x% Match" rating'],
            ['GlassEffect', 'toggle', 'Glass blur'],
            ['OledBlack', 'toggle', 'OLED pure black']
        ]],
        ['Colors', [
            ['SeasonalTheme', 'select', 'Theme preset', [['default','Default'],['monochrome','Monochrome'],['colorful','Colorful'],['christmas','Christmas'],['halloween','Halloween'],['summer','Summer'],['ocean','Ocean']]],
            ['AccentColor', 'color', 'Accent color'],
            ['BgColor', 'color', 'Background'],
            ['TextColor', 'color', 'Text color'],
            ['MutedColor', 'color', 'Muted text'],
            ['ProgressColor', 'select', 'Progress bar', [['accent','Accent'],['red','Red'],['green','Green'],['blue','Blue'],['purple','Purple']]]
        ]],
        ['Logo & Header', [
            ['LogoStyle', 'select', 'Logo style', [['jellyfin','Jellyfin'],['netflix','Netflix N'],['letter','Letter'],['custom','Custom image'],['none','None']]],
            ['NavLeft', 'toggle', 'Left-aligned nav (Netflix)'],
            ['HeaderBlur', 'toggle', 'Header blur effect']
        ]],
        ['Elements', [
            ['ShowBadges', 'toggle', 'Unplayed badges'],
            ['ShowPlayed', 'toggle', 'Watched checkmarks'],
            ['ShowBackdrop', 'toggle', 'Backdrop image'],
            ['RoundCast', 'toggle', 'Round cast images'],
            ['ShowDescription', 'toggle', 'Description'],
            ['ShowTags', 'toggle', 'Tags'],
            ['ShowExternalLinks', 'toggle', 'External links'],
            ['ShowSimilar', 'toggle', 'Similar titles'],
            ['SpoilerMode', 'toggle', 'Spoiler mode']
        ]],
        ['Detail Buttons', [
            ['ShowBtnWatched', 'toggle', 'Watched'],
            ['ShowBtnFavorite', 'toggle', 'Favorite'],
            ['ShowBtnMore', 'toggle', 'More']
        ]],
        ['Layout', [
            ['FontFamily', 'select', 'Font', FONTS],
            ['FontSize', 'select', 'Font size', [['small','Small'],['normal','Normal'],['large','Large']]],
            ['CardRadius', 'select', 'Card rounding', [['0','Square'],['4','Light'],['8','Medium'],['16','Round']]],
            ['CardSize', 'select', 'Card size', [['small','Small'],['normal','Normal'],['large','Large']]],
            ['CardStyle', 'select', 'Card shape', [['mixed','Mixed'],['portrait','Portrait'],['landscape','Landscape']]],
            ['CardHoverScale', 'toggle', 'Card hover zoom'],
            ['CardInfoOverlay', 'toggle', 'Card info overlay'],
            ['GradientStrength', 'select', 'Gradient', [['light','Light'],['medium','Medium'],['heavy','Heavy']]],
            ['TitleSize', 'select', 'Title size', [['small','Small'],['large','Large'],['huge','Huge']]],
            ['AnimSpeed', 'select', 'Animations', [['fast','Fast'],['normal','Normal'],['slow','Slow'],['off','Off']]],
            ['SidebarCompact', 'toggle', 'Compact sidebar'],
            ['AmbientGlow', 'toggle', 'Ambient glow']
        ]]
    ];

    var INT_KEYS = { CardRadius: true };

    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function cfg(key, def) {
        if (!CT_CONFIG || CT_CONFIG[key] === undefined || CT_CONFIG[key] === null) return def;
        return CT_CONFIG[key];
    }

    // ============ Header settings button ============
    function addButton() {
        if (document.querySelector('.ct-settings-btn')) return;
        var hr = document.querySelector('.headerRight');
        if (!hr) return;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ct-settings-btn headerButton headerButtonRight';
        btn.title = 'Theme settings';
        btn.innerHTML = '<span class="material-icons" style="font-size:24px" aria-hidden="true">palette</span>';
        btn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); togglePanel(); });
        var userBtn = hr.querySelector('.headerUserButton');
        if (userBtn) hr.insertBefore(btn, userBtn);
        else hr.appendChild(btn);
    }

    function togglePanel() {
        if (document.querySelector('.ct-overlay')) { closePanel(); return; }

        var bg = document.createElement('div');
        bg.className = 'ct-overlay-bg';
        bg.addEventListener('click', closePanel);

        var panel = document.createElement('div');
        panel.className = 'ct-overlay';
        panel.innerHTML = '<div class="ct-header"><h2>Theme Settings</h2><button type="button" class="ct-close" aria-label="Close">&times;</button></div>'
            + '<div class="ct-body"><p style="color:#888">Loading…</p></div>';

        document.body.appendChild(bg);
        document.body.appendChild(panel);
        panel.querySelector('.ct-close').addEventListener('click', closePanel);
        requestAnimationFrame(function () { panel.classList.add('open'); bg.classList.add('open'); });

        loadConfig(panel);
    }

    function closePanel() {
        var panel = document.querySelector('.ct-overlay');
        var bg = document.querySelector('.ct-overlay-bg');
        if (panel) { panel.classList.remove('open'); setTimeout(function () { panel.remove(); }, 300); }
        if (bg) { bg.classList.remove('open'); setTimeout(function () { bg.remove(); }, 300); }
    }

    function loadConfig(panel) {
        if (typeof ApiClient === 'undefined' || !ApiClient.getPluginConfiguration) {
            panel.querySelector('.ct-body').innerHTML = '<p style="color:#E50914">Settings unavailable here. Use Dashboard &gt; Plugins &gt; Custom Theme.</p>';
            return;
        }
        ApiClient.getPluginConfiguration(PLUGIN_ID).then(function (config) {
            CT_CONFIG = config;
            renderPanel(panel, config);
        }).catch(function (err) {
            panel.querySelector('.ct-body').innerHTML = '<p style="color:#E50914">Error: ' + esc(err) + '</p>';
        });
    }

    function renderPanel(panel, config) {
        var html = '';
        SECTIONS.forEach(function (section) {
            html += '<div class="ct-sec"><div class="ct-sec-title">' + section[0] + '</div>';
            section[1].forEach(function (f) {
                var key = f[0], type = f[1], label = f[2];
                html += '<div class="ct-row"><span>' + label + '</span>';
                if (type === 'toggle') {
                    html += '<label class="ct-switch"><input type="checkbox" data-key="' + key + '"' + (config[key] !== false ? ' checked' : '') + '><span class="ct-slider"></span></label>';
                } else if (type === 'color') {
                    html += '<input type="color" data-key="' + key + '" value="' + esc(config[key] || '#000000') + '">';
                } else {
                    html += '<select data-key="' + key + '">';
                    f[3].forEach(function (o) {
                        html += '<option value="' + o[0] + '"' + (String(config[key]) === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
                    });
                    html += '</select>';
                }
                html += '</div>';
            });
            html += '</div>';
        });
        html += '<button type="button" class="ct-save-btn">Save &amp; Apply</button><div class="ct-save-status"></div>';

        var body = panel.querySelector('.ct-body');
        body.innerHTML = html;
        body.querySelector('.ct-save-btn').addEventListener('click', function () { saveConfig(panel, config); });
    }

    function saveConfig(panel, config) {
        panel.querySelectorAll('[data-key]').forEach(function (el) {
            var key = el.dataset.key;
            if (el.type === 'checkbox') config[key] = el.checked;
            else if (INT_KEYS[key]) config[key] = parseInt(el.value, 10);
            else config[key] = el.value;
        });

        var status = panel.querySelector('.ct-save-status');
        status.textContent = 'Saving…';
        status.style.color = '#aaa';

        ApiClient.updatePluginConfiguration(PLUGIN_ID, config).then(function () {
            status.textContent = '✓ Saved — reloading…';
            status.style.color = '#46d369';
            setTimeout(function () { location.reload(); }, 1200);
        }).catch(function (err) {
            status.textContent = 'Error: ' + err;
            status.style.color = '#E50914';
        });
    }

    // ============ Top nav tabs (header) — replaces Custom Tabs ============
    var navViews = null;
    var navFetching = false;

    function navRouteFor(v) {
        var ct = (v.CollectionType || '').toLowerCase();
        if (ct === 'tvshows') return '#/tv.html?topParentId=' + v.Id;
        if (ct === 'movies') return '#/movies.html?topParentId=' + v.Id;
        if (ct === 'music') return '#/music.html?topParentId=' + v.Id;
        if (ct === 'livetv') return '#/livetv.html';
        return '#/list.html?topParentId=' + v.Id;
    }

    function navIsActive(href) {
        var hash = (location.hash || '').toLowerCase();
        var base = href.replace('#', '').toLowerCase().split('?')[0];
        if (base.indexOf('home') !== -1) return hash === '' || hash === '#/' || hash.indexOf('home') !== -1;
        return base !== '' && hash.indexOf(base) !== -1;
    }

    function renderNavTabs() {
        if (cfg('NavTabs', true) !== true) {
            document.querySelectorAll('.nf-nav-tabs').forEach(function (n) { n.remove(); });
            return;
        }
        var anchor = document.querySelector('.headerLeft');
        if (!anchor || !navViews) return;

        var existing = anchor.querySelector('.nf-nav-tabs');
        if (existing) {
            existing.querySelectorAll('.nf-nav-tab').forEach(function (a) {
                a.classList.toggle('active', navIsActive(a.getAttribute('href')));
            });
            return;
        }

        var tabs = [['Startseite', '#/home.html']];
        navViews.forEach(function (v) { tabs.push([v.Name, navRouteFor(v)]); });
        var nav = document.createElement('div');
        nav.className = 'nf-nav-tabs';
        nav.innerHTML = tabs.map(function (t) {
            return '<a class="nf-nav-tab' + (navIsActive(t[1]) ? ' active' : '') + '" href="' + t[1] + '">' + esc(t[0]) + '</a>';
        }).join('');
        anchor.appendChild(nav);
    }

    function setupNavTabs() {
        try {
            if (cfg('NavTabs', true) !== true) {
                document.querySelectorAll('.nf-nav-tabs').forEach(function (n) { n.remove(); });
                return;
            }
            if (typeof ApiClient === 'undefined' || !ApiClient.getUserViews || !ApiClient.getCurrentUserId) return;
            if (!document.querySelector('.headerLeft')) return;
            if (navViews) { renderNavTabs(); return; }
            if (navFetching) return;
            navFetching = true;
            ApiClient.getUserViews({ UserId: ApiClient.getCurrentUserId() }).then(function (res) {
                navFetching = false;
                navViews = (res && res.Items) || [];
                renderNavTabs();
            }).catch(function () { navFetching = false; });
        } catch (e) {}
    }

    // ============ Hero billboard carousel (home page) ============
    var heroBusy = false;
    var HERO_INTERVAL = 8000;
    var HERO_MAX = 6;

    function isHomePage() {
        var h = (location.hash || '').toLowerCase();
        return h === '' || h === '#/' || h.indexOf('home.html') !== -1 || h.indexOf('/home') !== -1;
    }

    function activeHomeContainer() {
        var pages = document.querySelectorAll('.homeSectionsContainer');
        for (var i = 0; i < pages.length; i++) {
            if (pages[i].offsetParent !== null) return pages[i];
        }
        return null;
    }

    function removeHero() {
        document.querySelectorAll('.nf-hero').forEach(function (h) {
            if (h._timer) { clearInterval(h._timer); h._timer = null; }
            h.remove();
        });
    }

    // We are the hero now: hide a detected external billboard (e.g. the Jellyfin
    // Media Bar) and undo the top margin it adds to the home container, so there is
    // never a double hero. Lets our hero fully replace Media Bar without uninstalling it.
    function suppressExternalHero(container) {
        var ext = document.querySelectorAll('#slides-container, [id*="slideshow" i], [class*="mediabar" i]');
        if (!ext.length) return;
        ext.forEach(function (el) { if (!el.closest || !el.closest('.nf-hero')) el.style.display = 'none'; });
        if (container) { container.style.marginTop = '0px'; }
    }

    function setupHero() {
        try {
            if (cfg('HeroBillboard', true) !== true) { removeHero(); return; }
            if (!isHomePage()) { removeHero(); return; }
            suppressExternalHero(activeHomeContainer());
            if (heroBusy) return;
            if (typeof ApiClient === 'undefined' || !ApiClient.getItems || !ApiClient.getCurrentUserId) return;
            var container = activeHomeContainer();
            if (!container || container.querySelector('.nf-hero')) return;

            var userId = ApiClient.getCurrentUserId();
            if (!userId) return;

            heroBusy = true;
            ApiClient.getItems(userId, {
                SortBy: 'Random',
                IncludeItemTypes: 'Movie,Series',
                Recursive: true,
                ImageTypes: 'Backdrop',
                Limit: 30,
                Fields: 'Overview,Genres,ProductionYear,CommunityRating'
            }).then(function (res) {
                heroBusy = false;
                var items = ((res && res.Items) || []).filter(function (i) {
                    return i.BackdropImageTags && i.BackdropImageTags.length;
                }).slice(0, HERO_MAX);
                if (!items.length || !isHomePage()) return;
                var c = activeHomeContainer();
                if (c && !c.querySelector('.nf-hero')) renderHero(c, items);
            }).catch(function () { heroBusy = false; });
        } catch (e) { heroBusy = false; }
    }

    function heroSlideHtml(item, active) {
        var bg = ApiClient.getScaledImageUrl(item.Id, { type: 'Backdrop', maxWidth: 1920, tag: item.BackdropImageTags[0] });
        var serverId = item.ServerId || (ApiClient.serverId && ApiClient.serverId());
        var detailUrl = '#/details?id=' + item.Id + (serverId ? '&serverId=' + serverId : '');

        var titleHtml;
        if (item.ImageTags && item.ImageTags.Logo) {
            var logo = ApiClient.getScaledImageUrl(item.Id, { type: 'Logo', maxWidth: 480, tag: item.ImageTags.Logo });
            titleHtml = '<img class="nf-hero-logo" src="' + logo + '" alt="' + esc(item.Name) + '">';
        } else {
            titleHtml = '<div class="nf-hero-title">' + esc(item.Name || '') + '</div>';
        }

        var match = item.CommunityRating ? '<span class="nf-hero-match">' + Math.round(item.CommunityRating * 10) + '% Match</span>' : '';
        var year = item.ProductionYear ? '<span>' + item.ProductionYear + '</span>' : '';
        var rating = item.OfficialRating ? '<span class="nf-hero-rating">' + esc(item.OfficialRating) + '</span>' : '';
        var genres = (item.Genres || []).slice(0, 3).map(esc).join(' • ');
        var meta = '<div class="nf-hero-meta">' + match + year + rating + (genres ? '<span>' + genres + '</span>' : '') + '</div>';
        var overview = item.Overview ? '<div class="nf-hero-overview">' + esc(item.Overview) + '</div>' : '';

        return '<div class="nf-hero-slide' + (active ? ' active' : '') + '">' +
            '<div class="nf-hero-bg" style="background-image:url(\'' + bg + '\')"></div>' +
            '<div class="nf-hero-content">' + titleHtml + meta + overview +
                '<div class="nf-hero-actions">' +
                    '<a class="nf-hero-btn nf-hero-play" href="' + detailUrl + '"><span class="material-icons" aria-hidden="true">play_arrow</span> Abspielen</a>' +
                    '<a class="nf-hero-btn nf-hero-info" href="' + detailUrl + '"><span class="material-icons" aria-hidden="true">info</span> Mehr Infos</a>' +
                    '<button type="button" class="nf-hero-btn nf-hero-list" data-id="' + item.Id + '" title="Meine Liste"><span class="material-icons" aria-hidden="true">add</span></button>' +
                '</div>' +
            '</div></div>';
    }

    function renderHero(container, items) {
        var hero = document.createElement('div');
        hero.className = 'nf-hero';
        var slides = items.map(function (it, i) { return heroSlideHtml(it, i === 0); }).join('');
        var dots = items.map(function (_, i) { return '<span class="nf-hero-dot' + (i === 0 ? ' active' : '') + '" data-idx="' + i + '"></span>'; }).join('');
        hero.innerHTML = slides +
            '<div class="nf-hero-controls">' +
                '<button type="button" class="nf-hero-ctrl nf-hero-pause" title="Pause"><span class="material-icons" aria-hidden="true">pause</span></button>' +
                '<div class="nf-hero-dots">' + dots + '</div>' +
            '</div>';
        container.insertBefore(hero, container.firstChild);

        var cur = 0, paused = false;
        var slideEls = hero.querySelectorAll('.nf-hero-slide');
        var dotEls = hero.querySelectorAll('.nf-hero-dot');
        function go(n) {
            cur = (n + slideEls.length) % slideEls.length;
            for (var i = 0; i < slideEls.length; i++) { slideEls[i].classList.toggle('active', i === cur); }
            for (var j = 0; j < dotEls.length; j++) { dotEls[j].classList.toggle('active', j === cur); }
        }

        if (slideEls.length > 1) {
            hero._timer = setInterval(function () { if (!paused) go(cur + 1); }, HERO_INTERVAL);
            dotEls.forEach(function (el) {
                el.addEventListener('click', function () { go(+el.getAttribute('data-idx')); });
            });
            var pauseBtn = hero.querySelector('.nf-hero-pause');
            pauseBtn.addEventListener('click', function () {
                paused = !paused;
                this.querySelector('.material-icons').textContent = paused ? 'play_arrow' : 'pause';
            });
        } else {
            var ctrls = hero.querySelector('.nf-hero-controls');
            if (ctrls) { ctrls.style.display = 'none'; }
        }

        // "+ Meine Liste" toggles the Jellyfin favorite flag (Netflix My List).
        hero.querySelectorAll('.nf-hero-list').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                var id = btn.getAttribute('data-id');
                var uid = ApiClient.getCurrentUserId && ApiClient.getCurrentUserId();
                if (!id || !uid || !ApiClient.updateFavoriteStatus) return;
                var nowFav = !btn.classList.contains('active');
                ApiClient.updateFavoriteStatus(uid, id, nowFav).then(function () {
                    btn.classList.toggle('active', nowFav);
                    btn.querySelector('.material-icons').textContent = nowFav ? 'check' : 'add';
                }).catch(function () {});
            });
        });
    }

    // ============ Curated genre rows (home page) — replaces Home Screen Sections ============
    var genreBusy = false;
    var GENRE_MAX_ROWS = 6;

    function buildCardHtml(item, sid) {
        var ptag = item.ImageTags && item.ImageTags.Primary;
        var img = ptag ? ApiClient.getScaledImageUrl(item.Id, { type: 'Primary', fillWidth: 300, quality: 96, tag: ptag }) : '';
        var href = '#/details?id=' + item.Id + (sid ? '&serverId=' + sid : '');
        return '<div data-id="' + item.Id + '" data-serverid="' + (sid || '') + '" data-type="' + item.Type + '" data-mediatype="Video" data-isfolder="false" class="card overflowPortraitCard card-hoverable card-withuserdata nf-card">' +
            '<div class="cardBox"><div class="cardScalable"><div class="cardPadder cardPadder-overflowPortrait"></div>' +
            '<a href="' + href + '" data-action="link" class="cardImageContainer cardContent itemAction" aria-label="' + esc(item.Name) + '" style="background-image:url(\'' + img + '\')"></a>' +
            '<div class="cardOverlayContainer"></div></div></div></div>';
    }

    function setupGenreRows() {
        try {
            if (cfg('GenreRows', true) !== true) { return; }
            if (!isHomePage()) { return; }
            if (genreBusy) { return; }
            if (typeof ApiClient === 'undefined' || !ApiClient.getItems || !ApiClient.getCurrentUserId) { return; }
            var container = activeHomeContainer();
            // Build once per freshly-rendered home container.
            if (!container || container.getAttribute('data-nf-rows') === '1') { return; }
            var userId = ApiClient.getCurrentUserId();
            if (!userId) { return; }

            genreBusy = true;
            container.setAttribute('data-nf-rows', '1');
            var sid = ApiClient.serverId && ApiClient.serverId();

            ApiClient.getItems(userId, {
                IncludeItemTypes: 'Movie,Series', Recursive: true, Fields: 'Genres', Limit: 400
            }).then(function (res) {
                genreBusy = false;
                var items = (res && res.Items) || [];
                var counts = {};
                items.forEach(function (it) {
                    (it.Genres || []).forEach(function (g) { counts[g] = (counts[g] || 0) + 1; });
                });
                var genres = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, GENRE_MAX_ROWS);
                genres.forEach(function (g) {
                    ApiClient.getItems(userId, {
                        IncludeItemTypes: 'Movie,Series', Recursive: true, Genres: g,
                        SortBy: 'Random', Limit: 20, ImageTypeLimit: 1, EnableImageTypes: 'Primary'
                    }).then(function (r) {
                        var its = ((r && r.Items) || []).filter(function (x) { return x.ImageTags && x.ImageTags.Primary; });
                        if (!its.length || !isHomePage()) { return; }
                        var c = activeHomeContainer();
                        if (!c || c.getAttribute('data-nf-rows') !== '1') { return; }
                        var sec = document.createElement('div');
                        sec.className = 'verticalSection nf-genre-section';
                        sec.innerHTML = '<h2 class="sectionTitle sectionTitle-cards">' + esc(g) + '</h2>' +
                            '<div class="nf-row-scroll"><div class="nf-row-track">' +
                            its.map(function (it) { return buildCardHtml(it, sid); }).join('') +
                            '</div></div>';
                        c.appendChild(sec);
                    }).catch(function () {});
                });
            }).catch(function () { genreBusy = false; });
        } catch (e) { genreBusy = false; }
    }

    // ============ Hover autoplay preview clips ============
    // Streams a muted ~30s clip from the middle of the real title on the fly. Nothing is stored.
    var previewCard = null;
    var previewTimer = null;
    var PREVIEW_SECONDS = 30;
    var HOVER_DELAY = 1200;

    function clearPreview() {
        if (previewTimer) { clearTimeout(previewTimer); previewTimer = null; }
        document.querySelectorAll('.ct-preview-video').forEach(function (v) {
            try { v.pause(); v.removeAttribute('src'); v.load(); } catch (e) {}
            if (v._stopTimer) clearTimeout(v._stopTimer);
            v.remove();
        });
        previewCard = null;
    }

    function eligibleCard(card) {
        if (!card || !card.getAttribute) return false;
        if (card.classList.contains('personCard')) return false;
        var id = card.getAttribute('data-id');
        if (!id) return false;
        var type = (card.getAttribute('data-type') || '').toLowerCase();
        var mediaType = (card.getAttribute('data-mediatype') || '').toLowerCase();
        if (type === 'person' || type === 'photo' || type === 'musicalbum' || type === 'audio') return false;
        if (mediaType && mediaType !== 'video') return false;
        return true;
    }

    function startPreview(card) {
        if (typeof ApiClient === 'undefined' || !ApiClient.getItem) return;
        var id = card.getAttribute('data-id');
        var holder = card.querySelector('.cardImageContainer') || card.querySelector('.cardScalable');
        if (!id || !holder) return;
        var userId = ApiClient.getCurrentUserId && ApiClient.getCurrentUserId();

        ApiClient.getItem(userId, id).then(function (item) {
            if (previewCard !== card || !item) return;
            var ticks = item.RunTimeTicks || 0;
            if (ticks < 1200000000) return; // < ~2 min: skip
            var startTicks = Math.floor(ticks * 0.4); // mid-ish, past most intros

            var url = ApiClient.serverAddress() + '/Videos/' + id + '/stream.mp4'
                + '?Static=false&videoCodec=h264&audioCodec=aac&maxWidth=640&videoBitRate=2000000'
                + '&startTimeTicks=' + startTicks
                + '&api_key=' + ApiClient.accessToken();

            var video = document.createElement('video');
            video.className = 'ct-preview-video';
            video.muted = true;
            video.defaultMuted = true;
            video.autoplay = true;
            video.setAttribute('playsinline', '');
            video.setAttribute('preload', 'auto');
            video.src = url;
            holder.appendChild(video);

            var play = video.play();
            if (play && play.catch) { play.catch(function () {}); }

            video._stopTimer = setTimeout(function () {
                video.style.opacity = '0';
                setTimeout(function () { if (video.parentNode) video.remove(); }, 400);
            }, PREVIEW_SECONDS * 1000);
        }).catch(function () {});
    }

    function setupCardPreviews() {
        document.body.addEventListener('mouseover', function (e) {
            if (cfg('PreviewClips', true) === false) return;
            var card = e.target.closest && e.target.closest('.card');
            if (!card || card === previewCard) return;
            if (!eligibleCard(card)) return;
            clearPreview();
            previewCard = card;
            previewTimer = setTimeout(function () {
                if (previewCard === card) startPreview(card);
            }, HOVER_DELAY);
        });
        document.body.addEventListener('mouseout', function (e) {
            if (!previewCard) return;
            var to = e.relatedTarget;
            if (to && previewCard.contains && previewCard.contains(to)) return;
            clearPreview();
        });
    }

    // ============ Top 10 rank numbers ============
    function setupTopTen() {
        try {
            if (cfg('TopTenRow', false) !== true) return;
            if (!isHomePage()) return;
            var container = activeHomeContainer();
            if (!container) return;
            // First content row that isn't the library ("My Media") section.
            var sections = container.querySelectorAll('.verticalSection');
            var target = null;
            for (var s = 0; s < sections.length; s++) {
                var firstCard = sections[s].querySelector('.card');
                if (!firstCard) continue;
                var t = (firstCard.getAttribute('data-type') || '').toLowerCase();
                if (t === 'collectionfolder' || t === 'userview') continue;
                target = sections[s];
                break;
            }
            if (!target) return;
            var cards = target.querySelectorAll('.card');
            for (var i = 0; i < Math.min(10, cards.length); i++) {
                if (cards[i].querySelector('.ct-rank')) continue;
                cards[i].classList.add('ct-rank-card');
                var rank = document.createElement('div');
                rank.className = 'ct-rank';
                rank.textContent = String(i + 1);
                cards[i].insertBefore(rank, cards[i].firstChild);
            }
        } catch (e) {}
    }

    // ============ Green "x% Match" rating ============
    function setupMatchScore() {
        try {
            if (cfg('MatchScore', true) !== true) return;
            document.querySelectorAll('.starRatingValue').forEach(function (el) {
                if (el.dataset.ctMatch) return;
                var n = parseFloat((el.textContent || '').replace(',', '.'));
                if (isNaN(n) || n < 0 || n > 10) return;
                el.dataset.ctMatch = '1';
                el.textContent = Math.round(n * 10) + '% Match';
            });
        } catch (e) {}
    }

    // ============ Init ============
    function applyDynamic() {
        addButton();
        setupNavTabs();
        setupHero();
        setupGenreRows();
        setupTopTen();
        setupMatchScore();
    }

    function init() {
        setupCardPreviews();
        applyDynamic();
        window.addEventListener('hashchange', function () { clearPreview(); setupHero(); renderNavTabs(); });

        // Coalesce the SPA's mutation bursts into one applyDynamic per frame so
        // EVERY feature (nav tabs, hero, genre rows, ...) gets retried as the
        // home page renders asynchronously — not just on the single init() pass.
        var dynScheduled = false;
        function scheduleDynamic() {
            if (dynScheduled) return;
            dynScheduled = true;
            requestAnimationFrame(function () { dynScheduled = false; applyDynamic(); });
        }
        new MutationObserver(scheduleDynamic).observe(document.body, { childList: true, subtree: true });

        // Load feature flags (hero / previews) once, then refresh.
        if (typeof ApiClient !== 'undefined' && ApiClient.getPluginConfiguration) {
            ApiClient.getPluginConfiguration(PLUGIN_ID).then(function (c) {
                CT_CONFIG = c;
                if (cfg('HeroBillboard', true) !== true) removeHero();
                else setupHero();
                applyDynamic();
            }).catch(function () {});
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
