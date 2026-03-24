(function() {
    'use strict';
    var PLUGIN_ID = '78b7b285-8d9e-4e4c-8e4d-7a71f76d4e2a';

    function addSettingsBtn() {
        if (document.querySelector('.ct-settings-btn')) return;
        var hr = document.querySelector('.headerRight');
        if (!hr) return;
        var btn = document.createElement('button');
        btn.className = 'ct-settings-btn headerButton headerButtonRight';
        btn.title = 'Theme Settings';
        btn.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;cursor:pointer;background:none;border:none;color:inherit;padding:0 8px;';
        btn.innerHTML = '<span class="material-icons" style="font-size:24px">palette</span>';
        btn.onclick = function(e) { e.preventDefault(); e.stopPropagation(); openSettings(); };
        var ub = hr.querySelector('.headerUserButton');
        if (ub) hr.insertBefore(btn, ub);
        else hr.appendChild(btn);
    }

    function openSettings() {
        if (document.querySelector('.ct-overlay')) { closeSettings(); return; }

        var backdrop = document.createElement('div');
        backdrop.className = 'ct-overlay-bg';
        backdrop.onclick = closeSettings;

        var panel = document.createElement('div');
        panel.className = 'ct-overlay';
        panel.innerHTML = '<div class="ct-header"><h2>Theme Settings</h2><button class="ct-close">&times;</button></div><div class="ct-body"><p style="color:#888">Loading...</p></div>';

        document.body.appendChild(backdrop);
        document.body.appendChild(panel);
        panel.querySelector('.ct-close').onclick = closeSettings;

        requestAnimationFrame(function() { panel.classList.add('open'); backdrop.classList.add('open'); });

        loadConfig(panel);
    }

    function closeSettings() {
        var p = document.querySelector('.ct-overlay');
        var b = document.querySelector('.ct-overlay-bg');
        if (p) { p.classList.remove('open'); setTimeout(function() { p.remove(); }, 300); }
        if (b) { b.classList.remove('open'); setTimeout(function() { b.remove(); }, 300); }
    }

    function loadConfig(panel) {
        if (typeof ApiClient === 'undefined') {
            panel.querySelector('.ct-body').innerHTML = '<p style="color:#E50914">ApiClient not available. Use Dashboard > Plugins > Custom Theme instead.</p>';
            return;
        }
        ApiClient.getPluginConfiguration(PLUGIN_ID).then(function(config) {
            renderSettings(panel, config);
        }).catch(function(err) {
            panel.querySelector('.ct-body').innerHTML = '<p style="color:#E50914">Error: ' + err + '</p>';
        });
    }

    function renderSettings(panel, config) {
        var body = panel.querySelector('.ct-body');
        body.innerHTML =
            sec('Farben',
                color('AccentColor', 'Akzentfarbe', config) +
                color('BgColor', 'Hintergrund', config) +
                color('TextColor', 'Textfarbe', config) +
                color('MutedColor', 'Gedämpfter Text', config) +
                sel('ProgressColor', 'Fortschrittsbalken', config, [['red','Rot'],['green','Grün'],['blue','Blau'],['purple','Lila']])
            ) +
            sec('Logo & Header',
                sel('LogoStyle', 'Logo', config, [['jellyfin','Jellyfin'],['netflix','Netflix N'],['letter','Buchstabe'],['custom','Eigenes Bild'],['none','Keins']]) +
                tog('HeaderBlur', 'Header Blur-Effekt', config)
            ) +
            sec('Elemente',
                tog('ShowBadges', 'Ungesehen-Badges', config) +
                tog('ShowPlayed', 'Gesehen-Markierung', config) +
                tog('ShowBackdrop', 'Backdrop-Bild', config) +
                tog('RoundCast', 'Runde Cast-Bilder', config) +
                tog('ShowDescription', 'Beschreibung', config) +
                tog('ShowTags', 'Tags', config) +
                tog('ShowExternalLinks', 'Externe Links', config) +
                tog('ShowSimilar', 'Ähnliche Titel', config) +
                tog('SpoilerMode', 'Spoiler-Modus', config)
            ) +
            sec('Buttons',
                tog('ShowBtnWatched', 'Gesehen ✓', config) +
                tog('ShowBtnFavorite', 'Favorit ♥', config) +
                tog('ShowBtnMore', 'Mehr ⋯', config)
            ) +
            sec('Layout',
                sel('FontFamily', 'Schriftart', config, [['inter','Inter'],['poppins','Poppins'],['montserrat','Montserrat'],['roboto','Roboto'],['oswald','Oswald'],['raleway','Raleway'],['nunito','Nunito'],['bebas','Bebas Neue'],['lato','Lato'],['sourcesans','Source Sans'],['ubuntu','Ubuntu'],['playfair','Playfair Display'],['quicksand','Quicksand'],['comfortaa','Comfortaa'],['righteous','Righteous']]) +
                sel('FontSize', 'Schriftgröße', config, [['small','Klein'],['normal','Normal'],['large','Groß']]) +
                sel('CardRadius', 'Card-Rundung', config, [['0','Eckig'],['4','Leicht'],['8','Mittel'],['16','Rund']]) +
                sel('CardSize', 'Card-Größe', config, [['small','Klein'],['normal','Normal'],['large','Groß']]) +
                sel('GradientStrength', 'Gradient', config, [['light','Leicht'],['medium','Mittel'],['heavy','Stark']]) +
                sel('TitleSize', 'Titelgröße', config, [['small','Klein'],['large','Groß'],['huge','Riesig']]) +
                sel('AnimSpeed', 'Animationen', config, [['fast','Schnell'],['normal','Normal'],['slow','Langsam'],['off','Aus']]) +
                tog('CardHoverScale', 'Card Hover-Zoom', config) +
                tog('CardInfoOverlay', 'Card Info-Overlay', config) +
                tog('AmbientGlow', 'Ambient Glow', config)
            ) +
            '<button class="ct-save-btn" id="ctSaveBtn">Speichern & Anwenden</button>' +
            '<div class="ct-save-status" id="ctSaveStatus"></div>';

        // Bind save
        body.querySelector('#ctSaveBtn').onclick = function() { saveConfig(panel, config); };
    }

    function saveConfig(panel, config) {
        var body = panel.querySelector('.ct-body');
        // Collect values
        body.querySelectorAll('[data-key]').forEach(function(el) {
            var key = el.dataset.key;
            if (el.type === 'checkbox') config[key] = el.checked;
            else if (el.type === 'color') config[key] = el.value;
            else if (key === 'CardRadius') config[key] = parseInt(el.value);
            else config[key] = el.value;
        });

        var status = body.querySelector('#ctSaveStatus');
        status.textContent = 'Speichern...';
        status.style.color = '#aaa';

        ApiClient.updatePluginConfiguration(PLUGIN_ID, config).then(function() {
            status.textContent = '✓ Gespeichert! Seite wird neu geladen...';
            status.style.color = '#46d369';
            setTimeout(function() { location.reload(); }, 1500);
        }).catch(function(err) {
            status.textContent = 'Fehler: ' + err;
            status.style.color = '#E50914';
        });
    }

    // Helper builders
    function sec(title, content) {
        return '<div class="ct-sec"><div class="ct-sec-title">' + title + '</div>' + content + '</div>';
    }
    function tog(key, label, config) {
        return '<div class="ct-row"><span>' + label + '</span><label class="ct-switch"><input type="checkbox" data-key="' + key + '"' + (config[key] ? ' checked' : '') + '><span class="ct-slider"></span></label></div>';
    }
    function sel(key, label, config, opts) {
        var h = '<div class="ct-row"><span>' + label + '</span><select data-key="' + key + '">';
        opts.forEach(function(o) { h += '<option value="' + o[0] + '"' + (String(config[key]) === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; });
        return h + '</select></div>';
    }
    function color(key, label, config) {
        return '<div class="ct-row"><span>' + label + '</span><input type="color" data-key="' + key + '" value="' + (config[key] || '#000000') + '"></div>';
    }

    // Init
    function init() {
        addSettingsBtn();
        new MutationObserver(function() {
            if (!document.querySelector('.ct-settings-btn')) addSettingsBtn();
        }).observe(document.body, { childList: true, subtree: true });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
