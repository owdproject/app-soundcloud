import { isValidSoundcloudUrl } from './utils/utilSoundcloud'

export default {
  id: 'org.owdproject.soundcloud',
  title: 'SoundCloud',
  singleton: true,
  icon: 'simple-icons:soundcloud',
  recommendedStreams: [
    { url: 'https://soundcloud.com/chillhopmusic/chillhop-essentials-summer-2023', title: 'Chillhop Essentials Summer' },
    { url: 'https://soundcloud.com/lofigirl/sets/lofi-hip-hop-radio-beats-to', title: 'Lofi Hip Hop Radio Playlist' }
  ],
  windows: {
    main: {
      component: () => import('./components/Window/WindowSoundcloud.vue'),
      resizable: true,
      size: {
        width: 600,
        height: 'auto',
        minWidth: 400,
        minHeight: 280,
        maxHeight: 520,
      },
      position: {
        x: 350,
        y: 180,
        z: 0,
      },
    },
  },
  entries: {
    soundcloud: {
      command: 'soundcloud --new --no-check',
    },
  },
  terminal: {
    soundcloud: {
      description: 'Open SoundCloud player',
      usage: 'soundcloud [url]',
      args: [
        {
          name: 'url',
          description: 'SoundCloud track or playlist URL',
        },
      ],
    },
  },
  commands: {
    soundcloud: (app: IApplicationController, args: any) => {
      const url = args?._[1] || ''
      const forceNewWindow = args.new
      const doNotCheckUrlValidity = args.noCheck
      const autoplay = args.autoplay

      // validate input: must be a valid soundcloud url
      if (
        url &&
        !doNotCheckUrlValidity &&
        !isValidSoundcloudUrl(url) &&
        !/^[a-zA-Z0-9_-]{11}$/.test(url)
      ) {
        return {
          message: 'SoundCloud URL or ID is not valid',
        }
      }

      // if --new is not passed, try to reuse an existing window of the same type
      const existingWindow = !forceNewWindow
        ? app.getFirstWindowByModel('main')
        : null

      if (existingWindow) {
        // update metadata of existing window
        existingWindow.meta.url = url
        existingWindow.meta.autoplay = url

        existingWindow.unminimize()
        existingWindow.focus()
        return
      }

      // open a new window if no reusable one exists or --new was passed
      app.openWindow('main', undefined, {
        url,
        autoplay,
      })
    },
  },
}
