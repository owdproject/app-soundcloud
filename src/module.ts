import {
  defineNuxtModule,
  createResolver,
  addComponentsDir,
  addPlugin,
} from '@nuxt/kit'
import { registerTailwindPath } from '@owdproject/kit-tailwind/kit/registerTailwindPath'

export default defineNuxtModule({
  meta: {
    name: 'desktop-app-soundcloud',
    configKey: 'soundcloud',
  },
  defaults: {
    galleryRotateIntervalMs: 8000,
    recommendedStreams: [
      { url: 'https://soundcloud.com/chillhopmusic/chillhop-essentials-summer-2023', title: 'Chillhop Essentials Summer' },
      { url: 'https://soundcloud.com/lofigirl/sets/lofi-hip-hop-radio-beats-to', title: 'Lofi Hip Hop Radio' },
      { url: 'https://soundcloud.com/steezyasfuck/sets/chill', title: 'Chill Vibes' },
      { url: 'https://soundcloud.com/ambientsoundscapes/sets/deep-focus', title: 'Deep Focus Ambient' },
      { url: 'https://soundcloud.com/chillhopdotcom/chillhop-raw-cut', title: 'Chillhop Raw Cut' },
    ],
  },
  async setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    nuxt.options.runtimeConfig.public.desktop ??= {}
    nuxt.options.runtimeConfig.public.desktop.soundcloud = options

    addComponentsDir({
      path: resolve('./runtime/components'),
    })

    addPlugin(resolve('./runtime/plugin'))

    registerTailwindPath(
      nuxt,
      resolve('./runtime/components/**/*.{vue,mjs,ts}'),
    )
  },
})
