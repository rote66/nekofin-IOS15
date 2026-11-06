# Nekofin iOS 15.1+ Edition

[简体中文](README.md) · [English](README.en.md)

<div align="center">
  <img src="docs/images/readme-banner.png" width="640" height="320" alt="Nekofin banner" />
  <p><strong>Your self-hosted media library in your pocket.</strong></p>
  <p>An iOS and Android client for Jellyfin and Emby · Expo · React Native · MPV</p>
</div>

Nekofin connects to your self-hosted media servers so you can browse movies and shows, search your library, explore details, and pick up where you left off with MPV. It also supports multiple server accounts, synced playback progress, audio and subtitle track selection, danmaku (on-screen comments), and light and dark themes.

This fork backports Nekofin for iOS 15.1 and later, targeting iOS 15.1–16.4. If you are using another iOS version, the upstream version is recommended.

## App preview

Take a look around the app. Posters and library content depend on the media server you connect to.

<div align="center">
<table width="100%">
  <tbody>
    <tr>
      <td align="center" valign="top" width="25%"><img src="docs/screenshots/home.webp" width="180" alt="Library home in the light theme" /><br /><sub>Library · Light</sub></td>
      <td align="center" valign="top" width="25%"><img src="docs/screenshots/home-dark.webp" width="180" alt="Library home in the dark theme" /><br /><sub>Library · Dark</sub></td>
      <td align="center" valign="top" width="25%"><img src="docs/screenshots/detail.webp" width="180" alt="Series details and continue watching" /><br /><sub>Series details</sub></td>
      <td align="center" valign="top" width="25%"><img src="docs/screenshots/movie.webp" width="180" alt="Movie details" /><br /><sub>Movie details</sub></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="25%"><img src="docs/screenshots/servers.webp" width="180" alt="Managing multiple server accounts" /><br /><sub>Server management</sub></td>
      <td align="center" valign="top" width="25%"><img src="docs/screenshots/favorite.webp" width="180" alt="Favorite movies and shows" /><br /><sub>Favorites</sub></td>
      <td align="center" valign="top" width="25%"><img src="docs/screenshots/search.webp" width="180" alt="Search across connected servers" /><br /><sub>Cross-server search</sub></td>
      <td align="center" valign="top" width="25%"><img src="docs/screenshots/player.webp" width="180" alt="MPV player in landscape mode" /><br /><sub>MPV player</sub></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="25%"><img src="docs/screenshots/settings.webp" width="180" alt="App settings and theme options" /><br /><sub>Settings</sub></td>
      <td align="center" valign="top" width="25%"><img src="docs/screenshots/transcoding.webp" width="180" alt="Playback orientation and video transcoding options" /><br /><sub>Transcoding settings</sub></td>
      <td align="center" valign="top" width="25%"><img src="docs/screenshots/danmaku.webp" width="180" alt="Danmaku display, layout, and timing settings" /><br /><sub>Danmaku settings</sub></td>
      <td align="center" valign="top" width="25%"><img src="docs/screenshots/cache.webp" width="180" alt="Media cache categories and cleanup" /><br /><sub>Cache management</sub></td>
    </tr>
  </tbody>
</table>
</div>

## Features

- **Connect your library**: Manage multiple Jellyfin and Emby accounts, and browse movies, shows, favorites, and continue watching
- **Find something to watch**: Search the current server or all connected media servers
- **Explore details**: View movie, show, and episode information, and manage favorites and watched status
- **Continue watching**: Sync playback progress with the MPV player, and choose audio tracks, subtitles, playback speed, and aspect ratio
- **Customize danmaku**: Search for on-screen comments and adjust the font, opacity, speed, display area, and density
- **Choose your theme**: Use a light or dark theme, or follow your system settings

> The default danmaku API provides Chinese-language comments only.

## Getting started

Download an available build from [GitHub Releases](https://github.com/rote66/nekofin-IOS15/releases). Add your Jellyfin or Emby account, then open a library to browse and search. Open a movie or show to start or resume playback.

## Local development

Requires Bun, plus Xcode for iOS builds. Xcode 27 or later is recommended: apps built with older Xcode versions may have compatibility issues on iOS 27. The project includes a native player and Expo native modules, so use a development client to build and run it.

```sh
bun install
bun run ios:dev
```

Android picture-in-picture requires rebuilding the native app; an OTA update alone cannot enable it.

Run checks:

```sh
bun run typecheck
bun run test
```

## Tech stack

React Native · Expo · Expo Router · MPV · TypeScript

## Downloads

- **Stable**: [Latest release](https://github.com/rote66/nekofin-IOS15/releases/latest)

## Acknowledgments

[Streamyfin](https://github.com/streamyfin/streamyfin) · [Jellyfin](https://jellyfin.org/) · [Dandanplay](https://www.dandanplay.com/) · [expo-libvlc-player](https://github.com/cornejobarraza/expo-libvlc-player)

## License

[MPL-2.0](LICENSE)
