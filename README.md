# Jellyfin Custom Theme

A Netflix-inspired skin for **Jellyfin 10.11+**. Install the plugin and the theme is applied automatically — all settings live on the server, so they follow you to every device. No manual CSS, no client tweaks.

![Jellyfin](https://img.shields.io/badge/Jellyfin-10.11+-00A4DC?logo=jellyfin&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

## How it works

The plugin generates a complete stylesheet from your settings and writes it to Jellyfin's built-in **Custom CSS** (branding) configuration. Because the entire theme is plain CSS:

- it works on **every client** that loads the web CSS — no per-device setup;
- there is **no client-side JavaScript runtime** driving the look;
- changing a setting regenerates and re-applies the CSS instantly.

An optional palette button in the header opens a quick settings panel. It is injected into the web UI on the fly by middleware, so it works even on read-only / Docker installs **without any volume mount**.

## Features

- Netflix-style dark UI with backdrop gradients and smooth animations
- **Server-side settings** stored in the plugin configuration (persist across all devices)
- **Dashboard settings page** at *Plugins → Custom Theme*
- **Optional header settings button** (palette icon) with the same options
- **15 Google Fonts** — Inter, Poppins, Montserrat, Roboto, Oswald, Raleway, Nunito, Bebas Neue, Lato, Source Sans, Ubuntu, Playfair Display, Quicksand, Comfortaa, Righteous
- **Logo options** — Jellyfin (default), Netflix N, custom letter, custom image URL, or none
- **Seasonal presets** — Default, Christmas, Halloween, Summer, Ocean (override the colour palette)
- Color customization — accent, background, text, muted text, progress bar
- Round cast/crew images, full-backdrop detail page, card hover zoom
- Toggle visibility of badges, watched marks, backdrop, description, tags, external links, similar titles
- Toggle the detail-page circle buttons (watched, favorite, more)
- Adjustable card rounding, card size & shape, gradient strength, title size, font size
- Animation speed control, compact sidebar, ambient glow, spoiler mode

## Installation

### Via plugin repository (recommended)

1. In Jellyfin go to **Dashboard → Plugins → Repositories**.
2. Add the repository URL:
   ```
   https://raw.githubusercontent.com/Kuschel-code/Jellyfin-Custom-Theme/main/manifest.json
   ```
3. Open **Catalog** and install **Custom Theme**.
4. Restart Jellyfin. The theme is applied automatically.

### Manual

Download `custom-theme-vX.Y.Z.zip` from the [releases](https://github.com/Kuschel-code/Jellyfin-Custom-Theme/releases), extract it into `<config>/plugins/Custom Theme/`, and restart Jellyfin.

## Settings

Open **Dashboard → Plugins → Custom Theme**, or click the palette icon in the header.

| Section | Options |
|---------|---------|
| Colors | Theme preset, accent, background, text, muted text, progress bar |
| Logo & Header | Logo style (Jellyfin / Netflix N / letter / custom image / none), header blur |
| Elements | Badges, watched marks, backdrop, round cast, description, tags, external links, similar titles, spoiler mode |
| Detail buttons | Watched, favorite, more |
| Layout | 15 fonts, font size, card rounding, card size, card shape, hover zoom, info overlay, gradient strength, title size, animation speed, compact sidebar, ambient glow |

After saving, reload the web page to see the new theme.

## Build from source

Requires the **.NET 9 SDK**.

```bash
dotnet build -c Release
# Output: bin/Release/net9.0/Jellyfin.Plugin.CustomTheme.dll
```

To package a release zip, bundle the built DLL together with `meta.json`.

## Project structure

```
Plugin.cs                  # Plugin entry; serves configPage.html and headerButton.js
PluginConfiguration.cs     # Every setting, with defaults — fully consumed by CssGenerator
CssGenerator.cs            # Builds the stylesheet from config (base CSS + :root overrides + option rules)
EntryPoint.cs              # Hosted service: applies CSS on startup and whenever settings are saved
ScriptInjectionStartup.cs  # Middleware that injects the header button script into the web index
ServiceRegistrator.cs      # Registers the services with Jellyfin's DI container
netflix.css                # Base skin stylesheet (embedded resource)
configPage.html            # Dashboard settings page
headerButton.js            # Optional header button + slide-in settings panel
manifest.json              # Plugin repository manifest
meta.json                  # Plugin metadata (shipped inside the zip)
```

## Requirements

- Jellyfin 10.11+
- .NET 9 SDK (only to build from source)

## License

MIT
