<p align="center">
  <img width="160" height="160" src="https://avatars.githubusercontent.com/u/65117737?s=160&v=4" />
</p>
<h1 align="center">SoundCloud</h1>
<h3 align="center">
  SoundCloud App for Open Web Desktop.
</h3>

<br />

## Overview

This app for Open Web Desktop provides a SoundCloud player.

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

You can customize the list of recommended streams displayed on the initial dashboard inside your desktop configuration (`desktop.config.ts`):

```ts
import { defineDesktopConfig } from '@owdproject/core'

export default defineDesktopConfig({
  // ...
  'org.owdproject.soundcloud': {
    recommendedStreams: [
      { url: 'https://soundcloud.com/chillhopmusic/chillhop-essentials-summer-2023', title: 'Chillhop Essentials Summer' },
      { url: 'https://soundcloud.com/lofigirl/sets/lofi-hip-hop-radio-beats-to', title: 'Lofi Hip Hop Radio Playlist' }
    ]
  }
})
```

## License

The application is released under the [MIT License](LICENSE).
