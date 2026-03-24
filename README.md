# Jellyfin Custom Theme

A Netflix-inspired custom skin for **Jellyfin 10.11.6** with a built-in settings panel, multiple fonts, i18n support, and full customization.

![Jellyfin](https://img.shields.io/badge/Jellyfin-10.11.6-00A4DC?logo=jellyfin&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- Netflix-style dark UI with backdrop gradients and smooth animations
- **Settings panel** with 20+ customizable options (click the tune icon in the header)
- **i18n** — English & German with auto-detection
- **Logo options** — Jellyfin, Netflix N, custom letter (A-Z), custom image URL, or none
- **8 Google Fonts** — Inter, Poppins, Montserrat, Roboto, Oswald, Raleway, Nunito, Bebas Neue
- Round cast/crew images (Netflix-style)
- Detail page with full backdrop overlay and Netflix triple gradient
- Card hover zoom with shadow effects
- Toggle visibility of badges, tags, external links, description, similar titles
- Toggle detail page buttons (watched, favorite, more)
- Adjustable card rounding, gradient strength, title size, font size
- Color customization (accent, background, text, muted text)
- Settings persist in localStorage across sessions
- Responsive design for mobile and desktop

## Installation

### From Release (Recommended)

1. Download the latest release ZIP from [Releases](https://github.com/Kuschel-code/Jellyfin-Custom-Theme/releases)
2. Extract and copy the files into your Jellyfin plugins directory:
   ```
   /config/plugins/NetflixSkin/
     Jellyfin.Plugin.NetflixSkin.dll
     manifest.json
   ```
3. Restart Jellyfin
4. Done — the plugin automatically injects CSS and JS. No manual steps needed.

### Docker Example

```bash
# Create plugin directory
docker exec jellyfin mkdir -p /config/plugins/NetflixSkin

# Copy plugin files
docker cp Jellyfin.Plugin.NetflixSkin.dll jellyfin:/config/plugins/NetflixSkin/
docker cp manifest.json jellyfin:/config/plugins/NetflixSkin/

# Restart
docker restart jellyfin
```

### Build from Source

```bash
dotnet build -c Release
# Output: bin/Release/net9.0/Jellyfin.Plugin.NetflixSkin.dll
```

### CSS Only (No Settings Panel)

If you only want the visual theme without the settings panel:

1. Go to **Dashboard > General > Branding**
2. Paste the contents of `netflix.css` into **Custom CSS**
3. Save

## Project Structure

```
Jellyfin.Plugin.NetflixSkin.csproj  # .NET 9 plugin project
Plugin.cs                           # Plugin entry point, serves CSS/JS as web pages
ScriptInjector.cs                   # Injects <script> tag into index.html at startup
netflix.css                         # Main skin stylesheet (~1300 lines)
netflix.js                          # Settings panel module with i18n
manifest.json                       # Jellyfin plugin manifest
```

## Settings Panel

Click the **tune** icon (slider icon) in the header to open the settings panel.

| Section | Options |
|---------|---------|
| Language | English, Deutsch |
| Colors | Accent, background, text, muted text |
| Header & Logo | Jellyfin / Netflix N / Letter A-Z / Custom image / None, header blur |
| Elements | Badges, watched marks, backdrop, round cast, description, tags, external links, similar titles |
| Buttons | Watched, favorite, more (detail page circle buttons) |
| Layout | Hover zoom, font size, card rounding, gradient strength, title size, font family |

## Requirements

- Jellyfin 10.11.x
- .NET 9 SDK (for building the plugin)

## License

MIT
