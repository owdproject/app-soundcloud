<p align="center">
  <img width="160" height="160" src="https://avatars.githubusercontent.com/u/65117737?s=160&v=4" />
</p>
<h1 align="center">SoundCloud</h1>
<h3 align="center">
  SoundCloud App for Open Web Desktop.
</h3>

<br />

## Overview

This app for Open Web Desktop provides a SoundCloud player with a rotating featured gallery on the dashboard.

[Demo](https://owdproject.github.io/app-soundcloud/) · [Documentation](https://owdproject.github.io/docs/) · [Support](https://github.com/sponsors/owdproject)

## Installation

```bash
pnpm desktop add @owdproject/app-soundcloud
```

## Usage

#### Available commands

```
soundcloud <track-url>
soundcloud <track-url> --new
soundcloud <track-url> --autoplay
soundcloud <track-url> --no-check
```

## Configuration

Add the app to your `desktop.config.ts` and customize the featured gallery:

```ts
import { defineDesktopConfig } from '@owdproject/core'

export default defineDesktopConfig({
  apps: [
    '@owdproject/app-soundcloud'
  ],
  'org.owdproject.soundcloud': {
    galleryRotateIntervalMs: 8000,
    recommendedStreams: [
      { url: 'https://soundcloud.com/chillhopmusic/chillhop-essentials-summer-2023', title: 'Chillhop Essentials Summer' },
      { url: 'https://soundcloud.com/lofigirl/sets/lofi-hip-hop-radio-beats-to', title: 'Lofi Hip Hop Radio Playlist' },
    ]
  }
})
```

Each stream supports an optional `thumbnail` URL. Covers are fetched automatically via oEmbed when omitted. The dashboard shows a 2×2 gallery; every `galleryRotateIntervalMs` milliseconds one tile cycles to the next featured stream. Click a tile to play.

## License

This application is released under the [MIT License](LICENSE).
