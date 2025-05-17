import { isValidSoundcloudUrl } from './utils/utilSoundcloud'

export default {
  id: 'org.owdproject.soundcloud',
  title: 'SoundCloud',
  singleton: true,
  icon: 'simple-icons:soundcloud',
  windows: {
    main: {
      component: () => import('./components/Window/WindowSoundcloud.vue'),
      resizable: false,
      size: {
        width: 'auto',
        height: 'auto',
      },
      position: {
        x: 400,
        y: 240,
        z: 0,
      },
    },
  },
  entries: {
    soundcloud: {
      command: 'soundcloud --new --no-check',
    },
  },
  commands: {
    soundcloud: (app: IApplicationController, args: any) => {
      const doNotCheckUrlValidity = args?.includes('--no-check')
      const forceNewWindow = args?.includes('--new')
      const soundcloudUrl = args?.[args.length - 1] || ''
      const soundcloudAutoplay = args?.includes('--autoplay')

      // validate input: must be a valid youtube url or a direct video id
      if (
        !doNotCheckUrlValidity &&
        !isValidSoundcloudUrl(soundcloudUrl) &&
        !/^[a-zA-Z0-9_-]{11}$/.test(soundcloudUrl)
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
        existingWindow.meta.url = soundcloudUrl
        existingWindow.meta.autoplay = soundcloudAutoplay

        existingWindow.unminimize()
        existingWindow.focus()
        return
      }

      // open a new window if no reusable one exists or --new was passed
      app.openWindow('main', undefined, {
        url: soundcloudUrl,
        autoplay: soundcloudAutoplay,
      })
    },
  },
}
