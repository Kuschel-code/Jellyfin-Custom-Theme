using System;
using System.IO;
using System.Reflection;

namespace Jellyfin.Plugin.CustomTheme
{
    /// <summary>
    /// Shape the File Transformation plugin deserializes its <c>{ "contents": "..." }</c>
    /// payload into. The plugin matches the property by name (case-insensitive).
    /// </summary>
    public class FileTransformationPayload
    {
        public string Contents { get; set; } = string.Empty;
    }

    /// <summary>
    /// Callback invoked by the File Transformation plugin every time <c>index.html</c>
    /// is served. It injects the header button / hero script inline so no extra request,
    /// MIME sniffing or auth is involved. Registration happens in <see cref="EntryPoint"/>.
    /// </summary>
    public static class ThemeTransformation
    {
        private const string Marker = "custom-theme-script";
        private static string? _cachedScript;

        public static string IndexHtml(FileTransformationPayload payload)
        {
            var html = payload?.Contents ?? string.Empty;
            if (string.IsNullOrEmpty(html)
                || html.Contains(Marker, StringComparison.Ordinal)
                || !html.Contains("</body>", StringComparison.OrdinalIgnoreCase))
            {
                return html;
            }

            var script = LoadScript();
            if (string.IsNullOrEmpty(script))
            {
                return html;
            }

            var tag = $"<script id=\"{Marker}\">\n{script}\n</script>\n</body>";
            return html.Replace("</body>", tag, StringComparison.OrdinalIgnoreCase);
        }

        private static string LoadScript()
        {
            if (_cachedScript != null)
            {
                return _cachedScript;
            }

            var assembly = typeof(ThemeTransformation).Assembly;
            using var stream = assembly.GetManifestResourceStream("Jellyfin.Plugin.CustomTheme.headerButton.js");
            if (stream == null)
            {
                _cachedScript = string.Empty;
                return _cachedScript;
            }

            using var reader = new StreamReader(stream);
            _cachedScript = reader.ReadToEnd();
            return _cachedScript;
        }
    }
}
