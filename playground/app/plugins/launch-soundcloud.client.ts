import { defineNuxtPlugin } from 'nuxt/app'

export default defineNuxtPlugin({
  name: 'app-soundcloud-playground-launch',
  dependsOn: ['desktop-app-soundcloud-register'],
  setup(nuxtApp) {
    autoStartPlaygroundApps(nuxtApp, [
      { id: 'org.owdproject.soundcloud', entry: 'soundcloud --new --no-check', windowModel: 'main' },
    ])
  },
})
