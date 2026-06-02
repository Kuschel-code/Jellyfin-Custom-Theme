# Jellyfin Custom Theme

A Netflix-inspired skin for **Jellyfin 10.11+**. Install the plugin and the theme is applied automatically — all settings live on the server, so they follow you to every device. No manual CSS, no client tweaks.

![Jellyfin](https://img.shields.io/badge/Jellyfin-10.11+-00A4DC?logo=jellyfin&logoColor=white)
[![Build](https://github.com/Kuschel-code/Jellyfin-Custom-Theme/actions/workflows/build.yml/badge.svg)](https://github.com/Kuschel-code/Jellyfin-Custom-Theme/actions/workflows/build.yml)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## How it works

The plugin generates a complete stylesheet from your settings and writes it to Jellyfin's built-in **Custom CSS** (branding) configuration. Because the entire theme is plain CSS:

- it works on **every client** that loads the web CSS — no per-device setup;
- there is **no client-side JavaScript runtime** driving the look;
- changing a setting regenerates and re-applies the CSS instantly.

The plugin also injects a small script that adds a **palette settings button** in the header and the **hover autoplay preview** on cards. This is **fully self-contained** — a built-in ASP.NET middleware injects it into `index.html` at serve time, so **no File Transformation plugin is required** (works on Docker / read-only installs too). The CSS theme always works regardless.

> **Bundled File Transformation:** this plugin also *provides* the File Transformation service to other plugins. So companion plugins like the [Jellyfin Media Bar](https://github.com/IAmParadox27/jellyfin-plugin-media-bar) (the big hero banner) work **without** installing the separate File Transformation plugin — Custom Theme applies their `index.html` transformations for them. (If you already run the real File Transformation plugin, turn this off in the settings to avoid two providers.)

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

> The header button and previews are injected by the plugin's own middleware — nothing else to install. If you prefer, you can turn the built-in injection off in the settings and use the separate [File Transformation plugin](https://github.com/IAmParadox27/jellyfin-plugin-file-transformation) instead.

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

To package a release zip manually, bundle the built DLL together with `meta.json`.

### Releasing (maintainers)

Every push and pull request to `main` is built by the
[Build workflow](.github/workflows/build.yml). Pushing a `vX.Y.Z` tag additionally
builds the plugin, packages `custom-theme-vX.Y.Z.zip`, and creates a matching
GitHub release. The workflow prints the zip's MD5 in the job summary — copy it
into the corresponding version entry in `manifest.json` so the plugin catalog can
verify the download.

```bash
git tag v2.0.1 && git push origin v2.0.1
```

## Project structure

```
Plugin.cs                  # Plugin entry; serves configPage.html and headerButton.js
PluginConfiguration.cs     # Every setting, with defaults — fully consumed by CssGenerator
CssGenerator.cs            # Builds the stylesheet from config (base CSS + :root overrides + option rules)
EntryPoint.cs              # Hosted service: applies CSS, sets up injection on startup
IndexInjectionMiddleware.cs# Built-in middleware: injects the script + applies other plugins' transformations
ThemeTransformation.cs     # Builds/strips the inline headerButton.js injection
FileTransformation/        # Bundled File Transformation provider (separate CustomTheme.FileTransformation.dll)
ServiceRegistrator.cs      # Registers the services with Jellyfin's DI container
netflix.css                # Base skin stylesheet (embedded resource)
configPage.html            # Dashboard settings page
headerButton.js            # Header button + slide-in settings panel + hero/preview/Top 10
manifest.json              # Plugin repository manifest
meta.json                  # Plugin metadata (shipped inside the zip)
LICENSE                    # MIT license
.github/workflows/build.yml # CI: build on push/PR, package & release on tags
```

## Requirements

- Jellyfin 10.11+
- *(optional)* [Jellyfin Media Bar](https://github.com/IAmParadox27/jellyfin-plugin-media-bar) — for the big Netflix-style hero banner; works without the separate File Transformation plugin because Custom Theme provides that service
- No File Transformation plugin required (it is bundled/provided by this plugin)
- .NET 9 SDK (only to build from source)

## License

[MIT](LICENSE) © Kuschel-code
