using MediaBrowser.Model.Plugins;

namespace Jellyfin.Plugin.CustomTheme
{
    /// <summary>
    /// All theme settings. Every property is consumed by <see cref="CssGenerator"/>,
    /// so the generated stylesheet fully reflects this configuration. There is no
    /// client-side runtime behaviour — the entire theme is plain CSS.
    /// </summary>
    public class PluginConfiguration : BasePluginConfiguration
    {
        // --- Colors ---
        public string AccentColor { get; set; } = "#E50914";
        public string BgColor { get; set; } = "#141414";
        public string TextColor { get; set; } = "#FFFFFF";
        public string MutedColor { get; set; } = "#B3B3B3";

        /// <summary>Progress bar colour: accent, red, green, blue, purple.</summary>
        public string ProgressColor { get; set; } = "accent";

        /// <summary>Seasonal preset that overrides the four colours above: default, christmas, halloween, summer, ocean.</summary>
        public string SeasonalTheme { get; set; } = "default";

        // --- Logo ---
        /// <summary>jellyfin, netflix, letter, custom, none.</summary>
        public string LogoStyle { get; set; } = "jellyfin";
        public string LogoLetter { get; set; } = "N";
        public string CustomLogoUrl { get; set; } = string.Empty;

        // --- Header ---
        public bool HeaderBlur { get; set; }

        // --- Element visibility ---
        public bool ShowBadges { get; set; } = true;
        public bool ShowPlayed { get; set; } = true;
        public bool ShowBackdrop { get; set; } = true;
        public bool RoundCast { get; set; } = true;
        public bool ShowDescription { get; set; } = true;
        public bool ShowTags { get; set; } = true;
        public bool ShowExternalLinks { get; set; } = true;
        public bool ShowSimilar { get; set; } = true;
        public bool SpoilerMode { get; set; }

        // --- Detail page buttons ---
        public bool ShowBtnWatched { get; set; } = true;
        public bool ShowBtnFavorite { get; set; } = true;
        public bool ShowBtnMore { get; set; } = true;

        // --- Layout ---
        /// <summary>One of the keys in <see cref="CssGenerator"/>'s font map.</summary>
        public string FontFamily { get; set; } = "inter";

        /// <summary>small, normal, large.</summary>
        public string FontSize { get; set; } = "normal";

        public int CardRadius { get; set; } = 4;

        /// <summary>small, normal, large.</summary>
        public string CardSize { get; set; } = "normal";

        /// <summary>mixed, portrait, landscape.</summary>
        public string CardStyle { get; set; } = "mixed";

        public bool CardHoverScale { get; set; } = true;
        public bool CardInfoOverlay { get; set; } = true;

        /// <summary>light, medium, heavy.</summary>
        public string GradientStrength { get; set; } = "medium";

        /// <summary>small, large, huge.</summary>
        public string TitleSize { get; set; } = "large";

        /// <summary>fast, normal, slow, off.</summary>
        public string AnimSpeed { get; set; } = "normal";

        public bool SidebarCompact { get; set; }
        public bool AmbientGlow { get; set; }

        // --- Netflix features (need the injected script) ---
        /// <summary>
        /// Show our own simple hero banner on the home page. Off by default: if the
        /// Jellyfin Media Bar plugin is installed it already provides a richer hero,
        /// and our banner skips itself when an existing hero/media bar is detected.
        /// </summary>
        public bool HeroBillboard { get; set; }

        /// <summary>Play a muted ~30s clip from the middle of the title when hovering a card (streamed on the fly, nothing stored).</summary>
        public bool PreviewClips { get; set; } = true;
    }
}
