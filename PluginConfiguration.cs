using MediaBrowser.Model.Plugins;

namespace Jellyfin.Plugin.CustomTheme
{
    public class PluginConfiguration : BasePluginConfiguration
    {
        // --- Colors ---
        public string AccentColor { get; set; } = "#E50914";
        public string BgColor { get; set; } = "#141414";
        public string TextColor { get; set; } = "#FFFFFF";
        public string MutedColor { get; set; } = "#B3B3B3";
        public string ProgressColor { get; set; } = "red"; // red, green, blue, purple

        // --- Logo ---
        public string LogoStyle { get; set; } = "netflix"; // netflix, jellyfin, letter, custom, none
        public string LogoLetter { get; set; } = "N";
        public string CustomLogoUrl { get; set; } = "";

        // --- Elements visibility ---
        public bool ShowBadges { get; set; } = true;
        public bool ShowPlayed { get; set; } = true;
        public bool ShowBackdrop { get; set; } = true;
        public bool RoundCast { get; set; } = true;
        public bool ShowDescription { get; set; } = true;
        public bool ShowTags { get; set; } = true;
        public bool ShowExternalLinks { get; set; } = true;
        public bool ShowSimilar { get; set; } = true;
        public bool SpoilerMode { get; set; } = false;

        // --- Header ---
        public bool HeaderBlur { get; set; } = false;
        public bool AutoHideHeader { get; set; } = false;
        public bool ShowClock { get; set; } = false;

        // --- Buttons ---
        public bool ShowBtnWatched { get; set; } = true;
        public bool ShowBtnFavorite { get; set; } = true;
        public bool ShowBtnMore { get; set; } = true;

        // --- Layout ---
        public string FontFamily { get; set; } = "inter";
        public string FontSize { get; set; } = "normal"; // small, normal, large
        public int CardRadius { get; set; } = 4;
        public string CardSize { get; set; } = "normal"; // small, normal, large
        public string CardStyle { get; set; } = "mixed"; // mixed, portrait, landscape
        public bool CardHoverScale { get; set; } = true;
        public bool CardInfoOverlay { get; set; } = true;
        public string GradientStrength { get; set; } = "medium"; // light, medium, heavy
        public string TitleSize { get; set; } = "large"; // small, large, huge
        public string AnimSpeed { get; set; } = "normal"; // fast, normal, slow, off
        public bool SidebarCompact { get; set; } = false;
        public bool AmbientGlow { get; set; } = false;
        public bool HeroBillboard { get; set; } = false;

        // --- Theme preset ---
        public string SeasonalTheme { get; set; } = "default"; // default, christmas, halloween, summer, ocean
    }
}
