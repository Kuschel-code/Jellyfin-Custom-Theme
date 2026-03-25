using System.Collections.Generic;
using System.IO;
using System.Reflection;
using System.Text;

namespace Jellyfin.Plugin.CustomTheme
{
    public static class CssGenerator
    {
        private static readonly Dictionary<string, string> ProgressColors = new()
        {
            ["red"] = "#E50914",
            ["green"] = "#46d369",
            ["blue"] = "#0078D4",
            ["purple"] = "#9B59B6"
        };

        private static readonly Dictionary<string, (string accent, string bg, string text, string muted)> SeasonalPresets = new()
        {
            ["christmas"] = ("#C41E3A", "#1B2A1B", "#F0E6D3", "#8B9A7B"),
            ["halloween"] = ("#FF6600", "#1A1A0A", "#F5E6C8", "#8B8B6B"),
            ["summer"] = ("#FF9500", "#1A1520", "#FFF5E6", "#C4A882"),
            ["ocean"] = ("#0099CC", "#0A1628", "#E0F0FF", "#7BA3C4")
        };

        public static string Generate(PluginConfiguration config)
        {
            // Load base CSS from embedded resource
            var assembly = Assembly.GetExecutingAssembly();
            using var stream = assembly.GetManifestResourceStream("Jellyfin.Plugin.CustomTheme.netflix.css");
            if (stream == null) return string.Empty;

            using var reader = new StreamReader(stream);
            var baseCss = reader.ReadToEnd();

            // Strip the old JS loader section if present
            var loaderIdx = baseCss.IndexOf("/* === JS LOADER");
            if (loaderIdx > 0) baseCss = baseCss.Substring(0, loaderIdx).TrimEnd();
            var endIdx = baseCss.IndexOf("/* === END OF CUSTOM THEME CSS === */");
            if (endIdx > 0) baseCss = baseCss.Substring(0, endIdx).TrimEnd();

            // Resolve colors (seasonal theme overrides manual colors)
            var accent = config.AccentColor;
            var bg = config.BgColor;
            var text = config.TextColor;
            var muted = config.MutedColor;

            if (config.SeasonalTheme != "default" && SeasonalPresets.ContainsKey(config.SeasonalTheme))
            {
                var preset = SeasonalPresets[config.SeasonalTheme];
                accent = preset.accent;
                bg = preset.bg;
                text = preset.text;
                muted = preset.muted;
            }

            // Replace CSS variable defaults with user values
            baseCss = baseCss.Replace("--accent-red: #E50914", "--accent-red: " + accent);
            baseCss = baseCss.Replace("--bg-dark: #141414", "--bg-dark: " + bg);
            baseCss = baseCss.Replace("--text-main: #FFFFFF", "--text-main: " + text);
            baseCss = baseCss.Replace("--text-muted: #B3B3B3", "--text-muted: " + muted);
            baseCss = baseCss.Replace("--card-radius: 4px", "--card-radius: " + config.CardRadius + "px");

            // Progress bar color
            var progressHex = ProgressColors.GetValueOrDefault(config.ProgressColor, accent);
            baseCss = baseCss.Replace("var(--progress-color, var(--accent-red))", progressHex);

            // Font family
            var fontMap = new Dictionary<string, string>
            {
                ["inter"] = "'Inter', 'Helvetica Neue', Arial, sans-serif",
                ["poppins"] = "'Poppins', sans-serif",
                ["montserrat"] = "'Montserrat', sans-serif",
                ["roboto"] = "'Roboto', sans-serif",
                ["oswald"] = "'Oswald', sans-serif",
                ["raleway"] = "'Raleway', sans-serif",
                ["nunito"] = "'Nunito', sans-serif",
                ["bebas"] = "'Bebas Neue', sans-serif",
                ["lato"] = "'Lato', sans-serif",
                ["sourcesans"] = "'Source Sans 3', sans-serif",
                ["ubuntu"] = "'Ubuntu', sans-serif",
                ["playfair"] = "'Playfair Display', serif",
                ["quicksand"] = "'Quicksand', sans-serif",
                ["comfortaa"] = "'Comfortaa', sans-serif",
                ["righteous"] = "'Righteous', sans-serif"
            };
            var font = fontMap.GetValueOrDefault(config.FontFamily, fontMap["inter"]);
            baseCss = baseCss.Replace("--font-netflix: 'Inter', 'Helvetica Neue', Arial, sans-serif", "--font-netflix: " + font);

            // Build conditional CSS rules
            var sb = new StringBuilder();
            sb.AppendLine(baseCss);
            sb.AppendLine();
            sb.AppendLine("/* === GENERATED FROM PLUGIN SETTINGS === */");

            // Logo
            switch (config.LogoStyle)
            {
                case "jellyfin":
                    sb.AppendLine(@".headerLeft::before {
    content: '' !important;
    background-image: url('data:image/svg+xml,%3Csvg xmlns=""http://www.w3.org/2000/svg"" viewBox=""0 0 512 512""%3E%3Cdefs%3E%3ClinearGradient id=""g"" x1=""0%25"" y1=""0%25"" x2=""100%25"" y2=""100%25""%3E%3Cstop offset=""0%25"" stop-color=""%23aa5cc3""/%3E%3Cstop offset=""100%25"" stop-color=""%2300a4dc""/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d=""M256 70c-54 0-103 28-140 72-37 44-56 102-56 152 0 36 22 72 56 100 37 30 86 48 140 48s103-18 140-48c34-28 56-64 56-100 0-50-19-108-56-152-37-44-86-72-140-72zm0 62c34 0 66 18 90 48 24 28 38 66 38 98 0 18-12 38-32 54-22 18-52 30-96 30s-74-12-96-30c-20-16-32-36-32-54 0-32 14-70 38-98 24-30 56-48 90-48zm0 84c-16 0-28 8-36 20-8 10-12 24-12 36 0 14 10 28 26 28s28-8 36-20c8-10 12-24 12-36 0-14-10-28-26-28z"" fill=""url(%23g)""/%3E%3C/svg%3E') !important;
    background-size: contain !important; background-repeat: no-repeat !important;
    width: 36px !important; height: 36px !important; display: inline-block !important;
    text-shadow: none !important; font-size: 0 !important; }");
                    break;
                case "letter":
                    sb.AppendLine($@".headerLeft::before {{
    content: '{config.LogoLetter}' !important; color: var(--accent-red) !important;
    font-weight: 900 !important; font-size: 2.6rem !important; letter-spacing: -2px !important;
    text-shadow: 0 0 15px rgba(229,9,20,0.4) !important; display: flex !important;
    align-items: center !important; transform: scaleY(1.1) !important;
    font-family: var(--font-netflix) !important; width: auto !important; height: auto !important;
    background: none !important; }}");
                    break;
                case "custom" when !string.IsNullOrEmpty(config.CustomLogoUrl):
                    sb.AppendLine($@".headerLeft::before {{
    content: '' !important; background-image: url({config.CustomLogoUrl}) !important;
    background-size: contain !important; background-repeat: no-repeat !important;
    width: 40px !important; height: 30px !important; display: inline-block !important; }}");
                    break;
                case "none":
                    sb.AppendLine(".headerLeft::before { display: none !important; }");
                    break;
                // "netflix" = default N, already in base CSS
            }

            // Element visibility
            if (!config.ShowBadges)
                sb.AppendLine(".indicator:not(.indicatorIcon) { display: none !important; }");
            if (!config.ShowPlayed)
                sb.AppendLine(".indicatorIcon { display: none !important; }");
            if (!config.ShowBackdrop)
                sb.AppendLine(".backdropContainer { opacity: 0 !important; } .backgroundContainer.withBackdrop { background-image: none !important; background-color: var(--bg-dark) !important; }");
            if (!config.RoundCast)
                sb.AppendLine(".personCard .cardScalable { border-radius: 8px !important; } .personCard .cardImageContainer { border-radius: 8px !important; }");
            if (!config.ShowDescription)
                sb.AppendLine(".overview-text, .itemOverview { display: none !important; }");
            if (!config.ShowTags)
                sb.AppendLine(".itemTags { display: none !important; }");
            if (!config.ShowExternalLinks)
                sb.AppendLine(".itemExternalLinks { display: none !important; }");
            if (!config.ShowSimilar)
                sb.AppendLine(".similarSection { display: none !important; }");

            // Spoiler mode
            if (config.SpoilerMode)
            {
                sb.AppendLine(@".overview-text, .itemOverview { filter: blur(8px) !important; cursor: pointer !important; }
.overview-text:hover, .itemOverview:hover { filter: none !important; }
.card:not(:has(.indicatorIcon)) .cardImageContainer { filter: blur(10px) brightness(0.6) !important; }
.card:not(:has(.indicatorIcon)) .cardImageContainer:hover { filter: none !important; }");
            }

            // Header
            if (config.HeaderBlur)
                sb.AppendLine(".skinHeader { backdrop-filter: blur(12px) !important; -webkit-backdrop-filter: blur(12px) !important; }");

            // Buttons
            if (!config.ShowBtnWatched)
                sb.AppendLine(".btnPlaystate { display: none !important; }");
            if (!config.ShowBtnFavorite)
                sb.AppendLine(".btnUserRating { display: none !important; }");
            if (!config.ShowBtnMore)
                sb.AppendLine(".btnMoreCommands { display: none !important; }");

            // Font size
            if (config.FontSize == "small")
                sb.AppendLine("body { font-size: 14px !important; }");
            else if (config.FontSize == "large")
                sb.AppendLine("body { font-size: 18px !important; }");

            // Title size
            if (config.TitleSize == "small")
                sb.AppendLine(".itemName { font-size: 1.8rem !important; }");
            else if (config.TitleSize == "huge")
                sb.AppendLine(".itemName { font-size: 4.5rem !important; }");

            // Card size
            if (config.CardSize == "small")
                sb.AppendLine(".homeSectionsContainer .card.overflowPortraitCard:not(.personCard) { min-width: 120px !important; } .homeSectionsContainer .card.overflowBackdropCard { min-width: 240px !important; }");
            else if (config.CardSize == "large")
                sb.AppendLine(".homeSectionsContainer .card.overflowPortraitCard:not(.personCard) { min-width: 200px !important; } .homeSectionsContainer .card.overflowBackdropCard { min-width: 420px !important; }");

            // Card style
            if (config.CardStyle == "portrait")
                sb.AppendLine(".card.overflowBackdropCard .cardPadder { padding-bottom: 150% !important; }");
            else if (config.CardStyle == "landscape")
                sb.AppendLine(".card.overflowPortraitCard:not(.personCard) .cardPadder { padding-bottom: 56.25% !important; }");

            // Card hover
            if (!config.CardHoverScale)
                sb.AppendLine(".card:hover { transform: none !important; box-shadow: none !important; }");

            // Gradient
            if (config.GradientStrength == "light")
                sb.AppendLine(".backgroundContainer.withBackdrop { background-image: linear-gradient(to top, var(--bg-dark) 0%, rgba(20,20,20,0.4) 15%, transparent 40%), linear-gradient(to right, rgba(20,20,20,0.5) 0%, transparent 25%) !important; }");
            else if (config.GradientStrength == "heavy")
                sb.AppendLine(".backgroundContainer.withBackdrop { background-image: linear-gradient(to top, var(--bg-dark) 0%, rgba(20,20,20,0.85) 30%, rgba(20,20,20,0.5) 60%), linear-gradient(to right, rgba(20,20,20,0.95) 0%, transparent 45%), linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 20%) !important; }");

            // Animation speed
            if (config.AnimSpeed == "fast")
                sb.AppendLine(".card, .skinHeader, .cardOverlayContainer { transition-duration: 0.12s !important; }");
            else if (config.AnimSpeed == "slow")
                sb.AppendLine(".card, .skinHeader, .cardOverlayContainer { transition-duration: 0.6s !important; }");
            else if (config.AnimSpeed == "off")
                sb.AppendLine(".card, .skinHeader, .cardOverlayContainer { transition-duration: 0s !important; } .card:hover { transform: none !important; } .view-transition { animation: none !important; }");

            // Sidebar
            if (config.SidebarCompact)
                sb.AppendLine(".mainDrawer { width: 60px !important; } .navMenuOption .navMenuOptionText { display: none !important; } .navMenuOption { justify-content: center !important; padding: 12px 0 !important; } .sidebarHeader { display: none !important; }");

            // Ambient glow
            if (config.AmbientGlow)
                sb.AppendLine("body::after { content: ''; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(ellipse at 50% 0%, rgba(229,9,20,0.06) 0%, transparent 60%); pointer-events: none; z-index: 0; }");

            // Settings overlay styles (for headerButton.js)
            sb.AppendLine(@"
/* Settings Panel Overlay */
.ct-overlay-bg { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 9998; opacity: 0; transition: opacity 0.3s ease; }
.ct-overlay-bg.open { opacity: 1; }
.ct-overlay { position: fixed; top: 0; right: -420px; width: 400px; max-width: 90vw; height: 100vh; background: #1a1a1a; z-index: 9999; overflow-y: auto; transition: right 0.3s ease; box-shadow: -4px 0 20px rgba(0,0,0,0.5); }
.ct-overlay.open { right: 0; }
.ct-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #333; position: sticky; top: 0; background: #1a1a1a; z-index: 1; }
.ct-header h2 { margin: 0; font-size: 1.2rem; color: #fff; }
.ct-close { background: none; border: none; color: #aaa; font-size: 28px; cursor: pointer; padding: 0; line-height: 1; }
.ct-close:hover { color: #fff; }
.ct-body { padding: 12px 20px 40px; }
.ct-sec { margin-bottom: 20px; }
.ct-sec-title { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #2a2a2a; }
.ct-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; font-size: 0.9rem; color: #ddd; }
.ct-row select { background: #333; color: #fff; border: 1px solid #555; border-radius: 4px; padding: 4px 8px; font-size: 0.8rem; }
.ct-row input[type=color] { width: 36px; height: 28px; border: 2px solid #555; border-radius: 4px; cursor: pointer; padding: 0; }
.ct-switch { position: relative; width: 40px; height: 22px; flex-shrink: 0; }
.ct-switch input { opacity: 0; width: 0; height: 0; }
.ct-slider { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: #555; border-radius: 22px; cursor: pointer; transition: 0.2s; }
.ct-slider::before { content: ''; position: absolute; width: 16px; height: 16px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: 0.2s; }
.ct-switch input:checked + .ct-slider { background: #E50914; }
.ct-switch input:checked + .ct-slider::before { transform: translateX(18px); }
.ct-save-btn { width: 100%; padding: 12px; background: #E50914; color: #fff; border: none; border-radius: 4px; font-size: 1rem; font-weight: 700; cursor: pointer; margin-top: 16px; }
.ct-save-btn:hover { background: #ff0a16; }
.ct-save-status { text-align: center; margin-top: 8px; font-size: 0.85rem; min-height: 20px; }
");

            sb.AppendLine("/* === END GENERATED === */");

            return sb.ToString();
        }
    }
}
