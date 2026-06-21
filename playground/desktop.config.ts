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
    ],
  },
})
