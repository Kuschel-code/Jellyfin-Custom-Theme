# Jellyfin Custom Theme

A Netflix-inspired custom skin plugin for **Jellyfin 10.11+** with server-side settings, 15 Google Fonts, and full customization. Install the plugin and everything works automatically.

![Jellyfin](https://img.shields.io/badge/Jellyfin-10.11+-00A4DC?logo=jellyfin&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- Netflix-style dark UI with backdrop gradients and smooth animations
- **Server-side settings** stored in plugin config (persist across all devices)
- **Dashboard settings page** at Plugins > Custom Theme > Einstellungen
- **15 Google Fonts** — Inter, Poppins, Montserrat, Roboto, Oswald, Raleway, Nunito, Bebas Neue, Lato, Source Sans, Ubuntu, Playfair Display, Quicksand, Comfortaa, Righteous
- **Logo options** — Jellyfin (default), Netflix N, custom letter, custom image URL, or none
- Round cast/crew images (Netflix-style)
- Detail page with full backdrop overlay and Netflix triple gradient
- Card hover zoom with shadow effects
- Toggle visibility of badges, tags, external links, description, similar titles
- Toggle detail page buttons (watched, favorite, more)
- Adjustable card rounding, gradient strength, title size, font size, card size
- Color customization (accent, background, text, muted text, progress bar)
- Spoiler mode (hide unplayed episode thumbnails)
- Ambient glow effect
- Seasonal theme presets (Christmas, Halloween, Summer, Ocean)
- Animation speed control
- CSS auto-generated from settings — no manual CSS needed

## Installation

### Via Plugin Repository (Recommended)

1. In Jellyfin, go to **Dashboard > Plugins > Repositories**
2. Add repository URL:
   ```
   https://raw.githubusercontent.com/Kuschel-code/Jellyfin-Custom-Theme/main/manifest.json
   ```
3. Go to **Catalog** and install **Custom Theme**
4. Restart Jellyfin
5. Done! The plugin automatically generates and applies the CSS.

### Settings

Go to **Dashboard > Plugins > Custom Theme > Einstellungen** to customize the theme.

| Section | Options |
|---------|---------|
| Colors | Accent, background, text, muted text, progress bar color |
| Logo | Jellyfin / Netflix N / Letter / Custom image / None |
| Elements | Badges, watched marks, backdrop, round cast, description, tags, external links, similar titles, spoiler mode |
| Buttons | Watched, favorite, more (detail page circle buttons) |
| Layout | 15 fonts, font size, card radius, card size, gradient strength, title size, animation speed, hover zoom, card info overlay, ambient glow |
| Theme | Default, Christmas, Halloween, Summer, Ocean |

### Optional: Header Settings Button

To get a settings button directly in the header (palette icon), the plugin needs write access to `index.html`. In Docker, mount the web directory as a volume:

```yaml
volumes:
  - /path/on/host/jellyfin-web:/jellyfin/jellyfin-web
```

Without this, the theme works fully — you just access settings through the Dashboard instead.

## Build from Source

```bash
dotnet build -c Release
# Output: bin/Release/net9.0/Jellyfin.Plugin.CustomTheme.dll
```

## Project Structure

```
Plugin.cs                  # Plugin entry, serves config page and JS as web pages
PluginConfiguration.cs     # All settings as properties with defaults
CssGenerator.cs            # Generates CSS from plugin config + base CSS
EntryPoint.cs              # IHostedService — applies CSS on startup, injects script
ServiceRegistrator.cs      # Registers EntryPoint with Jellyfin DI
headerButton.js            # Settings button for header (optional, needs index.html access)
configPage.html            # Dashboard settings page
netflix.css                # Base skin stylesheet
manifest.json              # Jellyfin plugin repository manifest
meta.json                  # Plugin metadata
```

## Requirements

- Jellyfin 10.11+
- .NET 9 (for building from source)

## License

MIT
