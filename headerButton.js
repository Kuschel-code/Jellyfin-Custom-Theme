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
            ['HoverPreviewCard', 'toggle', 'Hover expand card'],
            ['PreviewClips', 'toggle', 'Autoplay preview on hover'],
            ['TopTenRow', 'toggle', 'Top 10 numbers (first row)'],
            ['MatchScore', 'toggle', 'Green "x% Match" rating'],
            ['GlassEffect', 'toggle', 'Glass blur'],
            ['OledBlack', 'toggle', 'OLED pure black'],
            ['HeroBillboard', 'toggle', 'Built-in hero (off if Media Bar)']
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

    // ============ Hero billboard (home page) ============
    var heroBusy = false;

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
        document.querySelectorAll('.nf-hero').forEach(function (h) { h.remove(); });
    }

    // Detects a hero/billboard from another tool (e.g. the Jellyfin Media Bar) so we don't duplicate it.
    function externalHeroPresent() {
        return !!document.querySelector(
            '#slideshowContainer, .slideshowContainer, #mediabar, .mediabar, ' +
            '[id*="slideshow" i], [class*="slideshow" i], [class*="mediabar" i]'
        );
    }

    function setupHero() {
        try {
            if (cfg('HeroBillboard', false) !== true) { removeHero(); return; }
            if (externalHeroPresent()) { removeHero(); return; }
            if (!isHomePage()) { removeHero(); return; }
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
                Limit: 1,
                Fields: 'Overview'
            }).then(function (res) {
                heroBusy = false;
                var item = res && res.Items && res.Items[0];
                if (!item || !isHomePage()) return;
                var c = activeHomeContainer();
                if (c && !c.querySelector('.nf-hero')) renderHero(c, item);
            }).catch(function () { heroBusy = false; });
        } catch (e) { heroBusy = false; }
    }

    function renderHero(container, item) {
        var backdropTag = item.BackdropImageTags && item.BackdropImageTags[0];
        var bg = backdropTag
            ? ApiClient.getScaledImageUrl(item.Id, { type: 'Backdrop', maxWidth: 1920, tag: backdropTag })
            : '';
        var serverId = item.ServerId || (ApiClient.serverId && ApiClient.serverId());
        var detailUrl = '#/details?id=' + item.Id + (serverId ? '&serverId=' + serverId : '');

        var titleHtml;
        if (item.ImageTags && item.ImageTags.Logo) {
            var logo = ApiClient.getScaledImageUrl(item.Id, { type: 'Logo', maxWidth: 480, tag: item.ImageTags.Logo });
            titleHtml = '<img class="nf-hero-logo" src="' + logo + '" alt="' + esc(item.Name) + '">';
        } else {
            titleHtml = '<div class="nf-hero-title">' + esc(item.Name || '') + '</div>';
        }

        var overview = item.Overview ? '<div class="nf-hero-overview">' + esc(item.Overview) + '</div>' : '';

        var hero = document.createElement('div');
        hero.className = 'nf-hero';
        hero.innerHTML =
            '<div class="nf-hero-bg"' + (bg ? ' style="background-image:url(\'' + bg + '\')"' : '') + '></div>' +
            '<div class="nf-hero-content">' + titleHtml + overview +
                '<div class="nf-hero-actions">' +
                    '<a class="nf-hero-btn nf-hero-play" href="' + detailUrl + '"><span class="material-icons" aria-hidden="true">play_arrow</span> Play</a>' +
                    '<a class="nf-hero-btn nf-hero-info" href="' + detailUrl + '"><span class="material-icons" aria-hidden="true">info</span> More Info</a>' +
                '</div>' +
            '</div>';
        container.insertBefore(hero, container.firstChild);
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
        setupHero();
        setupTopTen();
        setupMatchScore();
    }

    function init() {
        setupCardPreviews();
        applyDynamic();
        window.addEventListener('hashchange', function () { clearPreview(); setupHero(); });
        new MutationObserver(function () {
            if (!document.querySelector('.ct-settings-btn')) addButton();
            setupHero();
        }).observe(document.body, { childList: true, subtree: true });

        // Load feature flags (hero / previews) once, then refresh.
        if (typeof ApiClient !== 'undefined' && ApiClient.getPluginConfiguration) {
            ApiClient.getPluginConfiguration(PLUGIN_ID).then(function (c) {
                CT_CONFIG = c;
                if (cfg('HeroBillboard', false) !== true) removeHero();
                else setupHero();
            }).catch(function () {});
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
