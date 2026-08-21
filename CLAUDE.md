# Jellyfin Custom Theme — server-side skin plugin

Jellyfin 10.11+ / .NET 9 plugin that generates a complete stylesheet from its settings and
writes it into Jellyfin's built-in Custom CSS, plus a small injected script for the header
palette button and hover previews. Plugin GUID `78b7b285-8d9e-4e4c-8e4d-7a71f76d4e2a`.

Two assemblies ship together: the plugin itself and a **bundled File Transformation
provider**, which other plugins (e.g. Jellyfin Media Bar) rely on instead of the standalone
one. `README.md` covers the feature set.

## Commands

```bash
dotnet build -c Release          # output: bin/Release/net9.0/
```

**There are no tests in this repo.** The only automated gate is that it compiles — so
anything about the rendered result has to be checked in a real Jellyfin.

## Releasing — read this before bumping anything

The README's release section is **out of date**: it describes pushing a `vX.Y.Z` tag and
copying the MD5 into `manifest.json` by hand. `.github/workflows/build.yml` does all of
that itself now.

1. Bump the version in **both** places, and keep them identical:
   `Jellyfin.Plugin.CustomTheme.csproj` (`Version`, `AssemblyVersion`, `FileVersion`) and
   **`meta.json`** — the workflow derives the tag from `meta.json`, not from the csproj.
2. Add the new entry to `manifest.json` **by hand, complete except the checksum**. The
   workflow's pinning step only *updates an existing* entry's `checksum`; it never creates
   one and never fills in `sourceUrl`, `timestamp` or `targetAbi`. A missing entry means
   the release exists but nobody can install it from the catalogue.
3. Merge to `main`. That is the release trigger — **do not tag manually**. The workflow
   builds, creates the tag and the GitHub release, attaches the zip, and pushes the pinned
   checksum back to `main` with `[skip ci]`.

## Things that will bite you

- **Merging plugin changes without bumping the version fails the build on purpose.** If a
  tag already exists and `main` has changed since it (ignoring `manifest.json`, `README.md`
  and `.github/**`), the release job errors with *"Shipped nothing — bump the version"*.
  That guard exists because **v2.5.37 was tagged before the language-flag work merged**, so
  that work was never packaged and v2.5.38 had to be cut to ship it.
- **The zip must contain both DLLs.** `Jellyfin.Plugin.CustomTheme.dll` *and*
  `CustomTheme.FileTransformation.dll`, plus `meta.json`. The provider is a separate
  assembly on purpose — Jellyfin discovers it by a filename containing
  `.FileTransformation`, which is why the csproj does `<Compile Remove="FileTransformation/**/*.cs" />`
  and references it as a project instead. Drop that DLL from the packaging step and the
  bundled provider vanishes silently: the theme still works, but Media Bar and anything else
  depending on it stops.
- **The release job runs under a `release-main` concurrency group.** Two version-bumping
  pushes landing close together used to race past the "does the tag exist" check —
  **v2.5.35's release was silently lost exactly that way.** Don't remove the group.
- **The checksum push-back can fail** (branch protection, a racing push). The workflow
  retries with a rebase and, if it still can't, warns instead of failing. The MD5 is in the
  job summary — check that `manifest.json` really got the checksum after a release, because
  Jellyfin refuses to install a version whose checksum doesn't match.
- **Injection is self-contained by design.** `IndexInjectionMiddleware` serves `index.html`
  with the script inlined at request time, so it works on read-only/Docker installs where
  patching on disk is impossible. Don't add an on-disk fallback.
- **The bundled provider can collide with the real thing.** If a user also runs the
  standalone File Transformation plugin, two providers apply transformations — the settings
  have a switch to turn ours off. Keep that path working.
- **Everything visual comes out of `CssGenerator`**, built from `PluginConfiguration`.
  A new setting is not done until `CssGenerator` consumes it — an unconsumed property is a
  switch in the UI that does nothing, which looks like a rendering bug.
- **`netflix.css`, `configPage.html` and `headerButton.js` are embedded resources.** Editing
  them requires a rebuild to take effect; a stale DLL looks exactly like a CSS that "didn't
  apply".
