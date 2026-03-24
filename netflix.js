(function() {
    'use strict';

    // =============================================
    // NETFLIX SKIN — SETTINGS MODULE
    // =============================================

    const STORAGE_KEY = 'netflix-skin-settings';

    // --- i18n ---
    var STRINGS = {
        en: {
            title: 'Skin Settings',
            colors: 'Colors', accentColor: 'Accent Color', background: 'Background', textColor: 'Text Color', mutedText: 'Muted Text',
            elements: 'Show / Hide', unplayedBadges: 'Unplayed Badges', unplayedDesc: 'Red numbers on cards',
            watchedMark: 'Watched Mark', watchedDesc: 'Checkmark on watched items',
            backdrop: 'Backdrop Image', backdropDesc: 'Background image on detail pages',
            roundCast: 'Round Cast Images', roundCastDesc: 'Cast shown as circles',
            description: 'Description', descriptionDesc: 'Synopsis on detail page',
            tags: 'Tags', tagsDesc: 'Genre tags below description',
            extLinks: 'External Links', extLinksDesc: 'IMDb, TMDB links',
            similar: 'Similar Titles', similarDesc: '"Similar" section',
            headerLogo: 'Header & Logo', logo: 'Logo', logoJellyfin: 'Jellyfin', logoNetflix: 'Netflix N', logoLetter: 'Letter', logoCustom: 'Custom Image', logoNone: 'None',
            letter: 'Letter', logoUrl: 'Logo URL', headerBlur: 'Header Blur', headerBlurDesc: 'Glass effect in header',
            buttons: 'Buttons (Detail Page)',
            watchedBtn: 'Watched Button', watchedBtnDesc: 'Checkmark circle button',
            favoriteBtn: 'Favorite Button', favoriteBtnDesc: 'Heart circle button',
            moreBtn: 'More Button', moreBtnDesc: 'Three-dots circle button',
            layout: 'Layout',
            cardHover: 'Card Hover Zoom', cardHoverDesc: 'Cards enlarge on hover',
            fontSize: 'Font Size', fontSmall: 'Small', fontNormal: 'Normal', fontLarge: 'Large',
            cardRadius: 'Card Rounding', radiusSquare: 'Square', radiusLight: 'Light', radiusMedium: 'Medium', radiusRound: 'Round',
            gradient: 'Gradient Strength', gradientLight: 'Light', gradientMedium: 'Medium', gradientHeavy: 'Heavy',
            titleSize: 'Title Size', titleSmall: 'Small', titleLarge: 'Large', titleHuge: 'Huge',
            fontFamily: 'Font', fontDefault: 'Inter (Default)',
            language: 'Language', langEn: 'English', langDe: 'Deutsch',
            reset: 'Reset to defaults',
            tooltipWatched: 'Watched', tooltipFavorite: 'Favorite', tooltipMore: 'More',
            // v1.2.0
            heroBillboard: 'Hero Billboard', heroBillboardDesc: 'Featured item banner on homepage',
            autoHideHeader: 'Auto-Hide Header', autoHideHeaderDesc: 'Header hides on scroll down',
            cardInfoOverlay: 'Card Info Overlay', cardInfoOverlayDesc: 'Show info on card hover',
            progressColor: 'Progress Bar', progressRed: 'Red', progressGreen: 'Green', progressBlue: 'Blue', progressPurple: 'Purple',
            cardSize: 'Card Size', cardSizeSmall: 'Small', cardSizeNormal: 'Normal', cardSizeLarge: 'Large',
            ambientGlow: 'Ambient Glow', ambientGlowDesc: 'Subtle color glow effect',
            animSpeed: 'Animation Speed', animFast: 'Fast', animNormal: 'Normal', animSlow: 'Slow', animOff: 'Off',
            sidebarCompact: 'Compact Sidebar', sidebarCompactDesc: 'Icons only in sidebar',
            showClock: 'Clock in Header', showClockDesc: 'Show current time',
            seasonalTheme: 'Theme Preset', themeDefault: 'Default', themeChristmas: 'Christmas', themeHalloween: 'Halloween', themeSummer: 'Summer', themeOcean: 'Ocean',
            cardStyle: 'Card Style', cardMixed: 'Mixed', cardPortrait: 'Portrait', cardLandscape: 'Landscape',
            spoilerMode: 'Spoiler Mode', spoilerModeDesc: 'Blur unwatched content'
        },
        de: {
            title: 'Skin Einstellungen',
            colors: 'Farben', accentColor: 'Akzentfarbe', background: 'Hintergrund', textColor: 'Textfarbe', mutedText: 'Gedaempfter Text',
            elements: 'Elemente ein/aus', unplayedBadges: 'Unplayed Badges', unplayedDesc: 'Rote Zahlen auf Cards',
            watchedMark: 'Gesehen-Markierung', watchedDesc: 'Checkmark auf gesehenen Items',
            backdrop: 'Backdrop Bild', backdropDesc: 'Hintergrundbild auf Detail-Seiten',
            roundCast: 'Runde Cast-Bilder', roundCastDesc: 'Besetzung als Kreise',
            description: 'Beschreibung', descriptionDesc: 'Inhaltsangabe auf Detail-Seite',
            tags: 'Tags / Markierungen', tagsDesc: 'Genre-Tags unter Beschreibung',
            extLinks: 'Externe Links', extLinksDesc: 'IMDb, TMDB Links',
            similar: 'Aehnliche Titel', similarDesc: '"Aehnliches" Section',
            headerLogo: 'Header & Logo', logo: 'Logo', logoJellyfin: 'Jellyfin', logoNetflix: 'Netflix N', logoLetter: 'Buchstabe', logoCustom: 'Eigenes Bild', logoNone: 'Kein Logo',
            letter: 'Buchstabe', logoUrl: 'Logo URL', headerBlur: 'Header Blur', headerBlurDesc: 'Glaseffekt im Header',
            buttons: 'Buttons (Detail-Seite)',
            watchedBtn: 'Gesehen-Button', watchedBtnDesc: 'Checkmark Circle-Button',
            favoriteBtn: 'Favorit-Button', favoriteBtnDesc: 'Herz Circle-Button',
            moreBtn: 'Mehr-Button', moreBtnDesc: 'Drei-Punkte Circle-Button',
            layout: 'Layout',
            cardHover: 'Card Hover-Zoom', cardHoverDesc: 'Cards vergroessern beim Hover',
            fontSize: 'Schriftgroesse', fontSmall: 'Klein', fontNormal: 'Normal', fontLarge: 'Gross',
            cardRadius: 'Card Rundung', radiusSquare: 'Eckig', radiusLight: 'Leicht', radiusMedium: 'Mittel', radiusRound: 'Rund',
            gradient: 'Gradient Staerke', gradientLight: 'Leicht', gradientMedium: 'Mittel', gradientHeavy: 'Stark',
            titleSize: 'Titel Groesse', titleSmall: 'Klein', titleLarge: 'Gross', titleHuge: 'Riesig',
            fontFamily: 'Schriftart', fontDefault: 'Inter (Standard)',
            language: 'Sprache', langEn: 'English', langDe: 'Deutsch',
            reset: 'Auf Standard zuruecksetzen',
            tooltipWatched: 'Gesehen', tooltipFavorite: 'Favorit', tooltipMore: 'Mehr',
            // v1.2.0
            heroBillboard: 'Hero Banner', heroBillboardDesc: 'Grosses Banner auf Startseite',
            autoHideHeader: 'Header ausblenden', autoHideHeaderDesc: 'Verschwindet beim Scrollen',
            cardInfoOverlay: 'Card Info-Overlay', cardInfoOverlayDesc: 'Info beim Hover',
            progressColor: 'Fortschrittsbalken', progressRed: 'Rot', progressGreen: 'Gruen', progressBlue: 'Blau', progressPurple: 'Lila',
            cardSize: 'Card Groesse', cardSizeSmall: 'Klein', cardSizeNormal: 'Normal', cardSizeLarge: 'Gross',
            ambientGlow: 'Umgebungslicht', ambientGlowDesc: 'Dezentes Farbglimmen',
            animSpeed: 'Animationen', animFast: 'Schnell', animNormal: 'Normal', animSlow: 'Langsam', animOff: 'Aus',
            sidebarCompact: 'Kompakte Sidebar', sidebarCompactDesc: 'Nur Icons',
            showClock: 'Uhr im Header', showClockDesc: 'Aktuelle Uhrzeit',
            seasonalTheme: 'Farbschema', themeDefault: 'Standard', themeChristmas: 'Weihnachten', themeHalloween: 'Halloween', themeSummer: 'Sommer', themeOcean: 'Ozean',
            cardStyle: 'Card Stil', cardMixed: 'Gemischt', cardPortrait: 'Hochformat', cardLandscape: 'Querformat',
            spoilerMode: 'Spoiler-Modus', spoilerModeDesc: 'Ungesehenes unscharf'
        }
    };

    function detectLang() {
        var saved = localStorage.getItem('netflix-skin-lang');
        if (saved) return saved;
        var nav = (navigator.language || 'en').toLowerCase();
        return nav.startsWith('de') ? 'de' : 'en';
    }
    var currentLang = detectLang();
    function t(key) { return (STRINGS[currentLang] || STRINGS.en)[key] || (STRINGS.en)[key] || key; }

    const DEFAULTS = {
        // Farben
        accentColor: '#E50914',
        bgColor: '#141414',
        textColor: '#FFFFFF',
        mutedColor: '#B3B3B3',
        // Elemente
        showBadges: true,
        showBackdrop: true,
        showPlayed: true,
        roundCast: true,
        showDescription: true,
        showTags: true,
        showExternalLinks: true,
        showSimilar: true,
        // Header
        showNetflixN: true,
        headerBlur: false,
        // Buttons
        showBtnGesehen: true,
        showBtnFavorit: true,
        showBtnMehr: true,
        // Layout
        cardRadius: 4,
        fontSize: 'normal',
        gradientStrength: 'medium',
        cardHoverScale: true,
        scrollButtonStyle: 'arrows',
        navHeight: 68,
        // Detail Page
        detailPaddingTop: 35,
        titleSize: 'large',
        // Hover
        cardHoverOutline: false,
        // Logo
        logoStyle: 'jellyfin',
        customLogoUrl: '',
        logoLetter: 'N',
        // Font
        fontFamily: 'inter',
        // v1.2.0
        cardSize: 'normal',
        progressColor: 'red',
        ambientGlow: false,
        animSpeed: 'normal',
        sidebarCompact: false,
        cardStyle: 'mixed',
        spoilerMode: false,
        cardInfoOverlay: true,
        seasonalTheme: 'default',
        autoHideHeader: false,
        showClock: false,
        heroBillboard: false
    };

    // --- Load / Save ---
    function loadSettings() {
        try {
            var saved = localStorage.getItem(STORAGE_KEY);
            return saved ? Object.assign({}, DEFAULTS, JSON.parse(saved)) : Object.assign({}, DEFAULTS);
        } catch (e) {
            return Object.assign({}, DEFAULTS);
        }
    }

    function saveSettings(settings) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }

    var currentSettings = loadSettings();

    // --- Apply Settings to DOM ---
    function applySettings(settings) {
        var root = document.documentElement;
        var body = document.body;
        if (!body) return;

        // CSS Custom Properties
        root.style.setProperty('--accent-red', settings.accentColor);
        root.style.setProperty('--bg-dark', settings.bgColor);
        root.style.setProperty('--text-main', settings.textColor);
        root.style.setProperty('--text-muted', settings.mutedColor);
        root.style.setProperty('--nav-height', settings.navHeight + 'px');

        // Body toggle classes
        body.classList.toggle('nf-hide-badges', !settings.showBadges);
        body.classList.toggle('nf-hide-backdrop', !settings.showBackdrop);
        body.classList.toggle('nf-hide-played', !settings.showPlayed);
        body.classList.toggle('nf-square-cast', !settings.roundCast);
        body.classList.toggle('nf-hide-description', !settings.showDescription);
        body.classList.toggle('nf-hide-tags', !settings.showTags);
        body.classList.toggle('nf-hide-extlinks', !settings.showExternalLinks);
        body.classList.toggle('nf-hide-similar', !settings.showSimilar);
        body.classList.toggle('nf-hide-netflix-n', !settings.showNetflixN);
        body.classList.toggle('nf-header-blur', settings.headerBlur);
        body.classList.toggle('nf-hide-btn-gesehen', !settings.showBtnGesehen);
        body.classList.toggle('nf-hide-btn-favorit', !settings.showBtnFavorit);
        body.classList.toggle('nf-hide-btn-mehr', !settings.showBtnMehr);
        body.classList.toggle('nf-no-card-hover', !settings.cardHoverScale);
        body.classList.toggle('nf-no-card-outline', !settings.cardHoverOutline);

        // Title size
        body.classList.remove('nf-title-small', 'nf-title-huge');
        if (settings.titleSize === 'small') body.classList.add('nf-title-small');
        if (settings.titleSize === 'huge') body.classList.add('nf-title-huge');

        // Logo
        var headerLeft = document.querySelector('.headerLeft');
        if (headerLeft) {
            body.classList.remove('nf-logo-jellyfin', 'nf-logo-custom', 'nf-logo-none', 'nf-logo-letter');
            if (settings.logoStyle === 'jellyfin') {
                body.classList.add('nf-logo-jellyfin');
            } else if (settings.logoStyle === 'letter') {
                body.classList.add('nf-logo-letter');
                root.style.setProperty('--logo-letter', "'" + (settings.logoLetter || 'N') + "'");
            } else if (settings.logoStyle === 'custom' && settings.customLogoUrl) {
                body.classList.add('nf-logo-custom');
                root.style.setProperty('--custom-logo-url', 'url(' + settings.customLogoUrl + ')');
            } else if (settings.logoStyle === 'none') {
                body.classList.add('nf-logo-none');
            }
            // default 'netflix' = no extra class needed (shows 'N')
        }

        // Font size
        body.classList.remove('nf-font-small', 'nf-font-large');
        if (settings.fontSize === 'small') body.classList.add('nf-font-small');
        if (settings.fontSize === 'large') body.classList.add('nf-font-large');

        // Card radius
        root.style.setProperty('--card-radius', settings.cardRadius + 'px');

        // Gradient strength
        body.classList.remove('nf-gradient-light', 'nf-gradient-heavy');
        if (settings.gradientStrength === 'light') body.classList.add('nf-gradient-light');
        if (settings.gradientStrength === 'heavy') body.classList.add('nf-gradient-heavy');

        // Font family
        body.classList.remove('nf-font-bebas', 'nf-font-poppins', 'nf-font-montserrat', 'nf-font-roboto', 'nf-font-oswald', 'nf-font-raleway', 'nf-font-nunito');
        if (settings.fontFamily && settings.fontFamily !== 'inter') {
            body.classList.add('nf-font-' + settings.fontFamily);
        }

        // --- v1.2.0 features ---

        // Card size
        body.classList.remove('nf-cards-small', 'nf-cards-large');
        if (settings.cardSize === 'small') body.classList.add('nf-cards-small');
        if (settings.cardSize === 'large') body.classList.add('nf-cards-large');

        // Progress bar color
        var progressColors = { red: '#E50914', green: '#46d369', blue: '#0078D4', purple: '#9B59B6' };
        root.style.setProperty('--progress-color', progressColors[settings.progressColor] || settings.accentColor);

        // Ambient glow
        body.classList.toggle('nf-ambient-glow', !!settings.ambientGlow);

        // Animation speed
        body.classList.remove('nf-anim-fast', 'nf-anim-slow', 'nf-anim-off');
        if (settings.animSpeed === 'fast') body.classList.add('nf-anim-fast');
        if (settings.animSpeed === 'slow') body.classList.add('nf-anim-slow');
        if (settings.animSpeed === 'off') body.classList.add('nf-anim-off');

        // Compact sidebar
        body.classList.toggle('nf-sidebar-compact', !!settings.sidebarCompact);

        // Card style
        body.classList.remove('nf-cards-portrait', 'nf-cards-landscape');
        if (settings.cardStyle === 'portrait') body.classList.add('nf-cards-portrait');
        if (settings.cardStyle === 'landscape') body.classList.add('nf-cards-landscape');

        // Spoiler mode
        body.classList.toggle('nf-spoiler-mode', !!settings.spoilerMode);

        // Card info overlay
        body.classList.toggle('nf-card-info-overlay', !!settings.cardInfoOverlay);

        // Auto-hide header
        body.classList.toggle('nf-autohide-header', !!settings.autoHideHeader);
        setupAutoHideHeader(settings.autoHideHeader);

        // Seasonal themes — override colors
        var PRESETS = {
            christmas: { accent: '#C41E3A', bg: '#1B2A1B', text: '#F0E6D3', muted: '#8B9A7B' },
            halloween: { accent: '#FF6600', bg: '#1A1A0A', text: '#F5E6C8', muted: '#8B8B6B' },
            summer:    { accent: '#FF9500', bg: '#1A1520', text: '#FFF5E6', muted: '#C4A882' },
            ocean:     { accent: '#0099CC', bg: '#0A1628', text: '#E0F0FF', muted: '#7BA3C4' }
        };
        if (settings.seasonalTheme && settings.seasonalTheme !== 'default' && PRESETS[settings.seasonalTheme]) {
            var p = PRESETS[settings.seasonalTheme];
            root.style.setProperty('--accent-red', p.accent);
            root.style.setProperty('--bg-dark', p.bg);
            root.style.setProperty('--text-main', p.text);
            root.style.setProperty('--text-muted', p.muted);
            root.style.setProperty('--progress-color', p.accent);
        }

        // Hero billboard
        body.classList.toggle('nf-hero-billboard', !!settings.heroBillboard);
        if (settings.heroBillboard) setupBillboard();

        // Clock
        setupClock(settings.showClock);
    }

    // --- Auto-hide header scroll listener ---
    var _scrollListener = null;
    var _lastScrollY = 0;
    function setupAutoHideHeader(enabled) {
        if (enabled && !_scrollListener) {
            _lastScrollY = window.scrollY;
            _scrollListener = function() {
                var y = window.scrollY;
                if (y > _lastScrollY && y > 80) {
                    document.body.classList.add('nf-header-hidden');
                } else {
                    document.body.classList.remove('nf-header-hidden');
                }
                _lastScrollY = y;
            };
            window.addEventListener('scroll', _scrollListener, { passive: true });
        } else if (!enabled && _scrollListener) {
            window.removeEventListener('scroll', _scrollListener);
            _scrollListener = null;
            document.body.classList.remove('nf-header-hidden');
        }
    }

    // --- Clock ---
    var _clockInterval = null;
    function setupClock(enabled) {
        if (enabled) {
            if (!document.querySelector('.nf-clock')) {
                var clock = document.createElement('span');
                clock.className = 'nf-clock';
                clock.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                var hr = document.querySelector('.headerRight');
                var sb = hr ? hr.querySelector('.nf-settings-btn') : null;
                if (sb) hr.insertBefore(clock, sb);
                else if (hr) hr.appendChild(clock);
            }
            if (!_clockInterval) {
                _clockInterval = setInterval(function() {
                    var c = document.querySelector('.nf-clock');
                    if (c) c.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }, 30000);
            }
        } else {
            var c = document.querySelector('.nf-clock');
            if (c) c.remove();
            if (_clockInterval) { clearInterval(_clockInterval); _clockInterval = null; }
        }
    }

    // --- Hero Billboard ---
    function setupBillboard() {
        if (document.querySelector('.nf-billboard')) return;
        if (!window.location.hash.includes('/home')) return;
        var container = document.querySelector('.homeSectionsContainer');
        if (!container) return;

        try {
            var userId = window.ApiClient.getCurrentUserId();
            window.ApiClient.getItems(userId, {
                SortBy: 'Random', Limit: 1, Recursive: true,
                IncludeItemTypes: 'Series,Movie',
                ImageTypes: 'Backdrop',
                EnableTotalRecordCount: false
            }).then(function(result) {
                if (!result.Items || !result.Items.length) return;
                var item = result.Items[0];
                var serverId = window.ApiClient._serverInfo.Id;
                var backdropUrl = window.ApiClient.getScaledImageUrl(item.Id, { type: 'Backdrop', maxWidth: 1920, quality: 80 });
                var detailUrl = '#/details?id=' + item.Id + '&serverId=' + serverId;

                var billboard = document.createElement('div');
                billboard.className = 'nf-billboard';
                billboard.innerHTML =
                    '<div class="nf-billboard-bg" style="background-image:url(\'' + backdropUrl + '\')"></div>' +
                    '<div class="nf-billboard-gradient"></div>' +
                    '<div class="nf-billboard-content">' +
                        '<div class="nf-billboard-title">' + (item.Name || '') + '</div>' +
                        '<div class="nf-billboard-overview">' + (item.Overview || '').substring(0, 200) + '</div>' +
                        '<div class="nf-billboard-actions">' +
                            '<a class="nf-billboard-play" href="' + detailUrl + '"><span class="material-icons" style="font-size:20px">play_arrow</span> Play</a>' +
                            '<a class="nf-billboard-info" href="' + detailUrl + '"><span class="material-icons" style="font-size:20px">info_outline</span> Info</a>' +
                        '</div>' +
                    '</div>';

                container.insertBefore(billboard, container.firstChild);
            });
        } catch (e) { /* ApiClient not ready */ }
    }

    // --- Select HTML helper ---
    function sel(key, label, opts) {
        var h = '<div class="nf-setting-row"><div class="nf-setting-label">' + label + '</div><select class="nf-select" data-setting="' + key + '">';
        for (var i = 0; i < opts.length; i++) {
            h += '<option value="' + opts[i][0] + '"' + (currentSettings[key] == opts[i][0] ? ' selected' : '') + '>' + opts[i][1] + '</option>';
        }
        return h + '</select></div>';
    }

    // --- Toggle HTML helper ---
    function makeToggle(key, label, desc) {
        return '<div class="nf-setting-row">' +
            '<div>' +
                '<div class="nf-setting-label">' + label + '</div>' +
                (desc ? '<div class="nf-setting-desc">' + desc + '</div>' : '') +
            '</div>' +
            '<label class="nf-toggle">' +
                '<input type="checkbox" data-setting="' + key + '"' + (currentSettings[key] ? ' checked' : '') + '>' +
                '<span class="nf-toggle-slider"></span>' +
            '</label>' +
        '</div>';
    }

    // --- Create Settings Panel ---
    function createSettingsPanel() {
        var backdrop = document.createElement('div');
        backdrop.className = 'nf-settings-backdrop';
        backdrop.addEventListener('click', closeSettings);

        var panel = document.createElement('div');
        panel.className = 'nf-settings-overlay';
        panel.innerHTML =
            '<div class="nf-settings-header">' +
                '<h2>' + t('title') + '</h2>' +
                '<button class="nf-settings-close" title="Close">&times;</button>' +
            '</div>' +

            '<div class="nf-settings-section">' +
                '<h3>' + t('language') + '</h3>' +
                '<div class="nf-setting-row"><div class="nf-setting-label">' + t('language') + '</div><select class="nf-select nf-lang-select"><option value="en"' + (currentLang === 'en' ? ' selected' : '') + '>' + t('langEn') + '</option><option value="de"' + (currentLang === 'de' ? ' selected' : '') + '>' + t('langDe') + '</option></select></div>' +
            '</div>' +

            '<div class="nf-settings-section">' +
                '<h3>' + t('colors') + '</h3>' +
                sel('seasonalTheme', t('seasonalTheme'), [['default',t('themeDefault')],['christmas',t('themeChristmas')],['halloween',t('themeHalloween')],['summer',t('themeSummer')],['ocean',t('themeOcean')]]) +
                '<div class="nf-setting-row"><div class="nf-setting-label">' + t('accentColor') + '</div><input type="color" class="nf-color-picker" data-setting="accentColor" value="' + currentSettings.accentColor + '"></div>' +
                '<div class="nf-setting-row"><div class="nf-setting-label">' + t('background') + '</div><input type="color" class="nf-color-picker" data-setting="bgColor" value="' + currentSettings.bgColor + '"></div>' +
                '<div class="nf-setting-row"><div class="nf-setting-label">' + t('textColor') + '</div><input type="color" class="nf-color-picker" data-setting="textColor" value="' + currentSettings.textColor + '"></div>' +
                '<div class="nf-setting-row"><div class="nf-setting-label">' + t('mutedText') + '</div><input type="color" class="nf-color-picker" data-setting="mutedColor" value="' + currentSettings.mutedColor + '"></div>' +
                sel('progressColor', t('progressColor'), [['red',t('progressRed')],['green',t('progressGreen')],['blue',t('progressBlue')],['purple',t('progressPurple')]]) +
            '</div>' +

            '<div class="nf-settings-section">' +
                '<h3>' + t('elements') + '</h3>' +
                makeToggle('showBadges', t('unplayedBadges'), t('unplayedDesc')) +
                makeToggle('showPlayed', t('watchedMark'), t('watchedDesc')) +
                makeToggle('showBackdrop', t('backdrop'), t('backdropDesc')) +
                makeToggle('roundCast', t('roundCast'), t('roundCastDesc')) +
                makeToggle('showDescription', t('description'), t('descriptionDesc')) +
                makeToggle('showTags', t('tags'), t('tagsDesc')) +
                makeToggle('showExternalLinks', t('extLinks'), t('extLinksDesc')) +
                makeToggle('showSimilar', t('similar'), t('similarDesc')) +
                makeToggle('spoilerMode', t('spoilerMode'), t('spoilerModeDesc')) +
            '</div>' +

            '<div class="nf-settings-section">' +
                '<h3>' + t('headerLogo') + '</h3>' +
                sel('logoStyle', t('logo'), [['jellyfin',t('logoJellyfin')],['netflix',t('logoNetflix')],['letter',t('logoLetter')],['custom',t('logoCustom')],['none',t('logoNone')]]) +
                '<div class="nf-setting-row" id="nf-letter-logo-row" style="' + (currentSettings.logoStyle === 'letter' ? '' : 'display:none') + '">' +
                    '<div class="nf-setting-label">' + t('letter') + '</div>' +
                    '<select class="nf-select" data-setting="logoLetter">' +
                    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(function(c) { return '<option value="' + c + '"' + (currentSettings.logoLetter === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') +
                    '</select>' +
                '</div>' +
                '<div class="nf-setting-row" id="nf-custom-logo-row" style="' + (currentSettings.logoStyle === 'custom' ? '' : 'display:none') + '">' +
                    '<div class="nf-setting-label">' + t('logoUrl') + '</div>' +
                    '<input type="text" class="nf-select" data-setting="customLogoUrl" value="' + (currentSettings.customLogoUrl || '') + '" placeholder="https://..." style="width:160px;font-size:0.8rem">' +
                '</div>' +
                makeToggle('headerBlur', t('headerBlur'), t('headerBlurDesc')) +
                makeToggle('autoHideHeader', t('autoHideHeader'), t('autoHideHeaderDesc')) +
                makeToggle('showClock', t('showClock'), t('showClockDesc')) +
            '</div>' +

            '<div class="nf-settings-section">' +
                '<h3>' + t('buttons') + '</h3>' +
                makeToggle('showBtnGesehen', t('watchedBtn'), t('watchedBtnDesc')) +
                makeToggle('showBtnFavorit', t('favoriteBtn'), t('favoriteBtnDesc')) +
                makeToggle('showBtnMehr', t('moreBtn'), t('moreBtnDesc')) +
            '</div>' +

            '<div class="nf-settings-section">' +
                '<h3>' + t('layout') + '</h3>' +
                makeToggle('cardHoverScale', t('cardHover'), t('cardHoverDesc')) +
                sel('fontSize', t('fontSize'), [['small',t('fontSmall')],['normal',t('fontNormal')],['large',t('fontLarge')]]) +
                sel('cardRadius', t('cardRadius'), [['0',t('radiusSquare')],['4',t('radiusLight')],['8',t('radiusMedium')],['16',t('radiusRound')]]) +
                sel('gradientStrength', t('gradient'), [['light',t('gradientLight')],['medium',t('gradientMedium')],['heavy',t('gradientHeavy')]]) +
                sel('titleSize', t('titleSize'), [['small',t('titleSmall')],['large',t('titleLarge')],['huge',t('titleHuge')]]) +
                sel('fontFamily', t('fontFamily'), [['inter',t('fontDefault')],['poppins','Poppins'],['montserrat','Montserrat'],['roboto','Roboto'],['oswald','Oswald'],['raleway','Raleway'],['nunito','Nunito'],['bebas','Bebas Neue']]) +
                sel('cardSize', t('cardSize'), [['small',t('cardSizeSmall')],['normal',t('cardSizeNormal')],['large',t('cardSizeLarge')]]) +
                sel('cardStyle', t('cardStyle'), [['mixed',t('cardMixed')],['portrait',t('cardPortrait')],['landscape',t('cardLandscape')]]) +
                sel('animSpeed', t('animSpeed'), [['fast',t('animFast')],['normal',t('animNormal')],['slow',t('animSlow')],['off',t('animOff')]]) +
                makeToggle('cardInfoOverlay', t('cardInfoOverlay'), t('cardInfoOverlayDesc')) +
                makeToggle('sidebarCompact', t('sidebarCompact'), t('sidebarCompactDesc')) +
                makeToggle('ambientGlow', t('ambientGlow'), t('ambientGlowDesc')) +
                makeToggle('heroBillboard', t('heroBillboard'), t('heroBillboardDesc')) +
            '</div>' +

            '<div class="nf-settings-section">' +
                '<button class="nf-reset-btn">' + t('reset') + '</button>' +
            '</div>';

        // Close button
        panel.querySelector('.nf-settings-close').addEventListener('click', closeSettings);

        // Toggle switches
        var toggles = panel.querySelectorAll('.nf-toggle input');
        for (var i = 0; i < toggles.length; i++) {
            toggles[i].addEventListener('change', function() {
                currentSettings[this.dataset.setting] = this.checked;
                saveSettings(currentSettings);
                applySettings(currentSettings);
            });
        }

        // Color pickers
        var colors = panel.querySelectorAll('.nf-color-picker');
        for (var j = 0; j < colors.length; j++) {
            colors[j].addEventListener('input', function() {
                currentSettings[this.dataset.setting] = this.value;
                saveSettings(currentSettings);
                applySettings(currentSettings);
            });
        }

        // Select dropdowns + text inputs
        var selects = panel.querySelectorAll('.nf-select');
        for (var k = 0; k < selects.length; k++) {
            selects[k].addEventListener('change', function() {
                var val = this.dataset.setting === 'cardRadius' ? parseInt(this.value) : this.value;
                currentSettings[this.dataset.setting] = val;
                saveSettings(currentSettings);
                applySettings(currentSettings);
                // Show/hide logo sub-options
                if (this.dataset.setting === 'logoStyle') {
                    var customRow = panel.querySelector('#nf-custom-logo-row');
                    var letterRow = panel.querySelector('#nf-letter-logo-row');
                    if (customRow) customRow.style.display = this.value === 'custom' ? '' : 'none';
                    if (letterRow) letterRow.style.display = this.value === 'letter' ? '' : 'none';
                }
            });
            // Also handle text input (customLogoUrl)
            selects[k].addEventListener('input', function() {
                if (this.dataset.setting === 'customLogoUrl') {
                    currentSettings.customLogoUrl = this.value;
                    saveSettings(currentSettings);
                    applySettings(currentSettings);
                }
            });
        }

        // Language switch
        var langSelect = panel.querySelector('.nf-lang-select');
        if (langSelect) {
            langSelect.addEventListener('change', function() {
                currentLang = this.value;
                localStorage.setItem('netflix-skin-lang', currentLang);
                closeSettings();
                setTimeout(openSettings, 350);
            });
        }

        // Reset button
        panel.querySelector('.nf-reset-btn').addEventListener('click', function() {
            currentSettings = Object.assign({}, DEFAULTS);
            saveSettings(currentSettings);
            applySettings(currentSettings);
            closeSettings();
            setTimeout(openSettings, 350);
        });

        document.body.appendChild(backdrop);
        document.body.appendChild(panel);

        return { backdrop: backdrop, panel: panel };
    }

    var settingsPanel = null;
    var settingsBackdrop = null;

    function openSettings() {
        if (settingsPanel) {
            settingsPanel.remove();
            settingsBackdrop.remove();
        }
        var result = createSettingsPanel();
        settingsBackdrop = result.backdrop;
        settingsPanel = result.panel;
        requestAnimationFrame(function() {
            settingsPanel.classList.add('open');
            settingsBackdrop.classList.add('open');
        });
    }

    function closeSettings() {
        if (settingsPanel) {
            settingsPanel.classList.remove('open');
            settingsBackdrop.classList.remove('open');
            setTimeout(function() {
                if (settingsPanel) settingsPanel.remove();
                if (settingsBackdrop) settingsBackdrop.remove();
                settingsPanel = null;
                settingsBackdrop = null;
            }, 300);
        }
    }

    // --- Settings Gear Button in Header ---
    function injectSettingsButton() {
        if (document.querySelector('.nf-settings-btn')) return;

        var headerRight = document.querySelector('.headerRight');
        if (!headerRight) return;

        var btn = document.createElement('button');
        btn.className = 'nf-settings-btn headerButton';
        btn.title = 'Skin Einstellungen';
        btn.innerHTML = '<span class="material-icons" style="font-size:24px">tune</span>';
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openSettings();
        });

        var userBtn = headerRight.querySelector('.headerUserButton');
        if (userBtn) {
            headerRight.insertBefore(btn, userBtn);
        } else {
            headerRight.appendChild(btn);
        }
    }

    // --- Init ---
    function init() {
        applySettings(currentSettings);
        injectSettingsButton();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Re-inject button on SPA navigation
    var observer = new MutationObserver(function() {
        if (!document.querySelector('.nf-settings-btn')) {
            injectSettingsButton();
        }
    });

    observer.observe(document.body || document.documentElement, { childList: true, subtree: true });

    console.log('[Netflix Skin] Settings module loaded');

})();
