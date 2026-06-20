import { defineDesktopConfig } from '@owdproject/core'

export default defineDesktopConfig({
  theme: '@owdproject/theme-nova',
  apps: ['@owdproject/app-soundcloud'],
  systemBar: { enabled: true, startButton: true },
  about: {
    title: 'SoundCloud (playground)',
    subtitle: 'app-soundcloud · theme-nova',
    href: 'https://github.com/owdproject/app-soundcloud',
    versionText: 'Nuxt Desktop',
    icons: [
      {
        title: 'Open Web Desktop',
        name: 'mdi:hexagon-multiple-outline',
        size: 24,
      },
      {
        title: 'Nuxt.js',
        name: 'simple-icons:nuxt',
        size: 25,
        style: 'margin-top: -1px',
      },
    ],
  },
  'org.owdproject.soundcloud': {
    galleryRotateIntervalMs: 8000,
    recommendedStreams: [
      { url: 'https://soundcloud.com/chillhopmusic/chillhop-essentials-summer-2023', title: 'Chillhop Essentials Summer' },
      { url: 'https://soundcloud.com/lofigirl/sets/lofi-hip-hop-radio-beats-to', title: 'Lofi Hip Hop Radio Playlist' },
      { url: 'https://soundcloud.com/chillhopdotcom/chillhop-raw-cut', title: 'Chillhop Raw Cut' },
      { url: 'https://soundcloud.com/steezyasfuck/sets/chill', title: 'Chill Vibes Playlist' },
      { url: 'https://soundcloud.com/ambientsoundscapes/sets/deep-focus', title: 'Deep Focus Ambient' },
      { url: 'https://soundcloud.com/insomniacore/sets/lofi-beats', title: 'Lofi Beats to Relax' },
    ],
  },
})
