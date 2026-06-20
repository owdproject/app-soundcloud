<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { isValidSoundcloudUrl } from '../../utils/utilSoundcloud'
import { formatWatchedAt, normalizeLegacyDate } from '../../utils/utilFormat'
import { useRotatingGallery } from '../../composables/useRotatingGallery'
import FeaturedGallery from '../FeaturedGallery/FeaturedGallery.vue'

import { useRuntimeConfig } from '#imports'

interface StreamItem {
  url: string
  title: string
  thumbnail?: string
}

interface HistoryItem {
  url: string
  title: string
  watchedAt: number
}

const DEFAULT_STREAMS: StreamItem[] = [
  { url: 'https://soundcloud.com/chillhopmusic/chillhop-essentials-summer-2023', title: 'Chillhop Essentials Summer' },
  { url: 'https://soundcloud.com/lofigirl/sets/lofi-hip-hop-radio-beats-to', title: 'Lofi Hip Hop Radio Playlist' },
  { url: 'https://soundcloud.com/chillhopdotcom/chillhop-raw-cut', title: 'Chillhop Raw Cut' },
  { url: 'https://soundcloud.com/steezyasfuck/sets/chill', title: 'Chill Vibes Playlist' },
  { url: 'https://soundcloud.com/ambientsoundscapes/sets/deep-focus', title: 'Deep Focus Ambient' },
  { url: 'https://soundcloud.com/insomniacore/sets/lofi-beats', title: 'Lofi Beats to Relax' },
]

const props = defineProps<{
  window: IWindowController
}>()

const runtimeConfig = useRuntimeConfig()
const soundcloudConfig = computed(
  () => runtimeConfig.public.desktop?.['org.owdproject.soundcloud'] || {},
)
const inputUrl = ref('')
const history = ref<HistoryItem[]>([])
const thumbnailByUrl = ref<Record<string, string>>({})

const featuredPool = computed(() => soundcloudConfig.value.recommendedStreams || DEFAULT_STREAMS)
const rotateIntervalMs = computed(() => soundcloudConfig.value.galleryRotateIntervalMs ?? 8000)

const { slots: gallerySlots } = useRotatingGallery(featuredPool, {
  intervalMs: rotateIntervalMs,
  getKey: item => item.url,
  getThumbnail: item => item.thumbnail || thumbnailByUrl.value[item.url],
})

const galleryTiles = computed(() =>
  gallerySlots.value.map(slot => ({
    key: slot.key,
    title: slot.item.title,
    thumbnail: slot.item.thumbnail || thumbnailByUrl.value[slot.item.url],
  })),
)

const showPlayer = computed(() => !!(props.window.meta.url))

async function resolveThumbnail(url: string, preset?: string) {
  if (preset) {
    thumbnailByUrl.value[url] = preset
    return
  }
  if (thumbnailByUrl.value[url]) return

  try {
    const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`)
    if (response.ok) {
      const data = await response.json()
      if (data?.thumbnail_url) {
        thumbnailByUrl.value[url] = data.thumbnail_url
      }
    }
  } catch (e) {
    console.error('Failed to fetch SoundCloud thumbnail:', e)
  }
}

watch(
  featuredPool,
  (streams) => {
    for (const stream of streams) {
      resolveThumbnail(stream.url, stream.thumbnail)
    }
  },
  { immediate: true, deep: true },
)

watch(
  gallerySlots,
  (slots) => {
    for (const slot of slots) {
      resolveThumbnail(slot.item.url, slot.item.thumbnail)
    }
  },
  { deep: true },
)

onMounted(() => {
  const stored = localStorage.getItem('owd_soundcloud_history')
  if (!stored) return

  try {
    const parsed = JSON.parse(stored) as Array<HistoryItem & { date?: string }>
    history.value = parsed.map((item) => ({
      url: item.url,
      title: item.title,
      watchedAt: item.watchedAt ?? normalizeLegacyDate(item.date) ?? Date.now(),
    }))
  } catch {
    history.value = []
  }
})

function persistHistory() {
  localStorage.setItem('owd_soundcloud_history', JSON.stringify(history.value))
}

function saveToHistory(url: string, title: string) {
  history.value = history.value.filter(item => item.url !== url)

  let trackTitle = title
  if (!trackTitle || trackTitle.startsWith('SoundCloud')) {
    try {
      const parts = new URL(url).pathname.split('/').filter(Boolean)
      if (parts.length >= 2) {
        trackTitle = parts[parts.length - 1]
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase())
      } else if (parts.length === 1) {
        trackTitle = parts[0].replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      }
    } catch {
      trackTitle = 'SoundCloud Track'
    }
  }

  history.value.unshift({
    url,
    title: trackTitle || 'SoundCloud Track',
    watchedAt: Date.now(),
  })
  if (history.value.length > 12) {
    history.value.pop()
  }
  persistHistory()
}

function clearHistory() {
  history.value = []
  localStorage.removeItem('owd_soundcloud_history')
}

async function fetchSoundcloudTitle(url: string): Promise<string | null> {
  try {
    const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`)
    if (response.ok) {
      const data = await response.json()
      if (data?.title) {
        return data.title
      }
    }
  } catch (e) {
    console.error('Failed to fetch SoundCloud title:', e)
  }
  return null
}

function playTrack(url: string, title?: string) {
  if (isValidSoundcloudUrl(url)) {
    props.window.meta.url = url
    props.window.meta.autoplay = true
    saveToHistory(url, title || '')

    if (!title) {
      fetchSoundcloudTitle(url).then((fetchedTitle) => {
        if (fetchedTitle) {
          saveToHistory(url, fetchedTitle)
        }
      })
    }
  }
}

function playGalleryTile(index: number) {
  const slot = gallerySlots.value[index]
  if (slot) {
    playTrack(slot.item.url, slot.item.title)
  }
}

function playFeatured(item: StreamItem) {
  playTrack(item.url, item.title)
}

function handleInputSubmit() {
  const value = inputUrl.value.trim()
  if (!value) return
  if (isValidSoundcloudUrl(value)) {
    playTrack(value)
    inputUrl.value = ''
  } else {
    alert('Please enter a valid SoundCloud track or playlist URL.')
  }
}

function closeTrack() {
  props.window.meta.url = ''
  props.window.meta.autoplay = false
}

function thumbFor(url: string, custom?: string) {
  return custom || thumbnailByUrl.value[url]
}
</script>

<template>
  <DesktopWindow v-bind="$props" :content="{ padded: false }">
    <template #nav-append>
      <DesktopWindowNavButton
        v-if="showPlayer"
        rounded
        title="Back to home"
        @click="closeTrack"
      >
        <Icon name="mdi:arrow-left" />
      </DesktopWindowNavButton>
    </template>

    <div class="soundcloud-app">
      <DesktopCoreSplash icon="simple-icons:soundcloud" title="SoundCloud Client" />

      <div v-show="showPlayer && props.window.meta.url" class="soundcloud-player">
        <div class="soundcloud-player__frame-container">
          <iframe
            v-if="props.window.meta.url"
            width="100%"
            height="100%"
            scrolling="no"
            frameborder="no"
            allow="autoplay"
            :src="`https://w.soundcloud.com/player/?url=${encodeURIComponent(props.window.meta.url)}&color=%23ff5500&auto_play=true&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`"
          />
        </div>
      </div>

      <div v-show="!showPlayer" class="soundcloud-home">
        <header class="soundcloud-home__toolbar">
          <div class="soundcloud-home__brand">
            <Icon name="simple-icons:soundcloud" class="soundcloud-home__logo" />
            <span class="soundcloud-home__wordmark">SoundCloud</span>
          </div>

          <form class="soundcloud-home__search" @submit.prevent="handleInputSubmit">
            <InputText
              v-model="inputUrl"
              placeholder="Paste a track or playlist URL..."
              autocomplete="off"
              spellcheck="false"
            />
            <Button type="submit" severity="warn" aria-label="Play">
              <Icon name="mdi:play" />
            </Button>
          </form>
        </header>

        <div class="soundcloud-home__body">
          <aside class="soundcloud-home__featured">
            <h3 class="soundcloud-home__heading">
              <Icon name="mdi:television-play" />
              Featured
            </h3>
            <FeaturedGallery
              v-if="galleryTiles.length"
              fill
              :tiles="galleryTiles"
              brand-icon="simple-icons:soundcloud"
              @play="playGalleryTile"
            />
          </aside>

          <main class="soundcloud-home__feed">
            <div class="soundcloud-home__feed-header">
              <h3 class="soundcloud-home__heading">
                <Icon :name="history.length ? 'mdi:history' : 'mdi:compass-outline'" />
                {{ history.length ? 'Listening history' : 'Recommended for you' }}
              </h3>
              <button
                v-if="history.length"
                type="button"
                class="soundcloud-home__clear"
                @click="clearHistory"
              >
                Clear all
              </button>
            </div>

            <div v-if="history.length" class="soundcloud-home__list">
              <article
                v-for="item in history"
                :key="item.url"
                class="track-row"
                @click="playTrack(item.url, item.title)"
              >
                <div class="track-row__thumb">
                  <img
                    v-if="thumbFor(item.url)"
                    :src="thumbFor(item.url)"
                    :alt="item.title"
                    loading="lazy"
                  >
                  <div v-else class="track-row__thumb-fallback">
                    <Icon name="simple-icons:soundcloud" />
                  </div>
                  <Icon name="mdi:play-circle" class="track-row__play" />
                </div>
                <div class="track-row__info">
                  <h4 class="track-row__title">{{ item.title }}</h4>
                  <p class="track-row__meta">Played {{ formatWatchedAt(item.watchedAt) }}</p>
                </div>
              </article>
            </div>

            <div v-else class="soundcloud-home__list">
              <article
                v-for="item in featuredPool"
                :key="item.url"
                class="track-row"
                @click="playFeatured(item)"
              >
                <div class="track-row__thumb">
                  <img
                    v-if="thumbFor(item.url, item.thumbnail)"
                    :src="thumbFor(item.url, item.thumbnail)"
                    :alt="item.title"
                    loading="lazy"
                  >
                  <div v-else class="track-row__thumb-fallback">
                    <Icon name="simple-icons:soundcloud" />
                  </div>
                  <Icon name="mdi:play-circle" class="track-row__play" />
                </div>
                <div class="track-row__info">
                  <h4 class="track-row__title">{{ item.title }}</h4>
                  <p class="track-row__meta">Featured stream</p>
                </div>
              </article>
            </div>
          </main>
        </div>
      </div>
    </div>
  </DesktopWindow>
</template>

<style scoped lang="scss">
.soundcloud-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  color: inherit;
  background: transparent;
}

.soundcloud-player {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;

  &__frame-container {
    flex: 1;
    min-height: 0;

    iframe {
      border: 0;
      width: 100%;
      height: 100%;
    }
  }
}

.soundcloud-home {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__toolbar {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
    border-bottom: 1px solid color-mix(in srgb, currentColor 10%, transparent);
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  &__logo {
    font-size: 26px;
    color: #ff5500;
  }

  &__wordmark {
    font-size: 1.125rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  &__search {
    flex: 1;
    display: flex;
    gap: 8px;
    min-width: 0;

    :deep(.p-inputtext) {
      flex: 1;
      border-radius: 999px;
      padding-left: 16px;
    }

    :deep(.p-button) {
      border-radius: 999px;
      width: 40px;
      padding: 0;
      flex-shrink: 0;
    }
  }

  &__body {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 0;
  }

  &__featured {
    min-height: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    padding: 14px 12px 14px 16px;
    border-right: 1px solid color-mix(in srgb, currentColor 10%, transparent);
  }

  &__feed {
    min-height: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    padding: 14px 16px 14px 12px;
    overflow: hidden;
  }

  &__feed-header {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  &__heading {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 10px;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: -0.01em;

    .soundcloud-home__feed-header & {
      margin-bottom: 0;
    }
  }

  &__clear {
    padding: 0;
    border: 0;
    background: none;
    font-size: 12px;
    color: inherit;
    opacity: 0.55;
    cursor: pointer;

    &:hover {
      opacity: 0.9;
      text-decoration: underline;
    }
  }

  &__list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-right: 2px;
  }
}

.track-row {
  display: flex;
  gap: 12px;
  padding: 8px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: color-mix(in srgb, currentColor 7%, transparent);

    .track-row__play {
      opacity: 1;
    }
  }

  &__thumb {
    position: relative;
    flex-shrink: 0;
    width: 72px;
    height: 72px;
    border-radius: 8px;
    overflow: hidden;
    background: color-mix(in srgb, currentColor 10%, transparent);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  }

  &__thumb-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    font-size: 28px;
    opacity: 0.35;
  }

  &__play {
    position: absolute;
    inset: 0;
    margin: auto;
    width: 36px;
    height: 36px;
    font-size: 36px;
    color: #fff;
    opacity: 0;
    filter: drop-shadow(0 2px 6px rgb(0 0 0 / 55%));
    transition: opacity 0.15s ease;
    pointer-events: none;
  }

  &__info {
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
  }

  &__title {
    margin: 0;
    font-size: 13px;
    font-weight: 500;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__meta {
    margin: 0;
    font-size: 11px;
    opacity: 0.5;
  }
}
</style>
