<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { isValidSoundcloudUrl } from '../../utils/utilSoundcloud'

import { useRuntimeConfig } from '#imports'

const props = defineProps<{
  window: IWindowController
}>()

const runtimeConfig = useRuntimeConfig()
const soundcloudConfig = runtimeConfig.public.desktop?.['org.owdproject.soundcloud'] || {}
const inputUrl = ref('')
const history = ref<{ url: string; title: string; date: string }[]>([])
const favorites = ref<{ url: string; title: string }[]>(
  soundcloudConfig.recommendedStreams || [
    { url: 'https://soundcloud.com/chillhopmusic/chillhop-essentials-summer-2023', title: 'Chillhop Essentials Summer' },
    { url: 'https://soundcloud.com/lofigirl/sets/lofi-hip-hop-radio-beats-to', title: 'Lofi Hip Hop Radio Playlist' }
  ]
)
// showPlayer is derived per-window from meta — no global state
const showPlayer = computed(() => !!(props.window.meta.url))

onMounted(() => {
  const stored = localStorage.getItem('owd_soundcloud_history')
  if (stored) {
    try {
      history.value = JSON.parse(stored)
    } catch (e) {
      history.value = []
    }
  }
})

function saveToHistory(url: string, title: string) {
  history.value = history.value.filter(item => item.url !== url)
  const now = new Date()
  const dateStr = now.toLocaleDateString()
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  
  // Try to generate a clean title from the SoundCloud URL path
  let trackTitle = title
  if (!trackTitle || trackTitle.startsWith('SoundCloud')) {
    try {
      const parts = new URL(url).pathname.split('/').filter(Boolean)
      if (parts.length >= 2) {
        // user/track-name -> Track Name (prettified)
        trackTitle = parts[parts.length - 1]
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase())
      } else if (parts.length === 1) {
        trackTitle = parts[0].replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      }
    } catch (e) {
      trackTitle = 'SoundCloud Track'
    }
  }

  history.value.unshift({
    url,
    title: trackTitle || `SoundCloud Track`,
    date: `${dateStr} alle ${timeStr}`
  })
  if (history.value.length > 10) {
    history.value.pop()
  }
  localStorage.setItem('owd_soundcloud_history', JSON.stringify(history.value))
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
      if (data && data.title) {
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
    // showPlayer updates automatically via computed
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
  // showPlayer updates automatically via computed
}
</script>

<template>
  <DesktopWindow v-bind="$props" :content="{ padded: false }">
    <template #nav-append>
      <DesktopWindowNavButton
        v-if="showPlayer"
        rounded
        title="Back to Dashboard"
        @click="closeTrack"
      >
        <Icon name="mdi:arrow-left" />
      </DesktopWindowNavButton>
    </template>

    <div class="soundcloud-app">
      <!-- Splash Loading Component -->
      <DesktopCoreSplash icon="simple-icons:soundcloud" title="SoundCloud Client" />

      <!-- Player View (persistent via v-show to keep iframe running in background) -->
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

      <!-- Initial Dashboard View -->
      <div v-show="!showPlayer" class="soundcloud-dashboard">
        <div class="soundcloud-dashboard__hero">
          <Icon name="simple-icons:soundcloud" class="soundcloud-dashboard__logo" />
          <h2 class="soundcloud-dashboard__title">SoundCloud Player</h2>
          <p class="soundcloud-dashboard__subtitle">Stream music and playlists directly</p>
        </div>

        <form class="soundcloud-dashboard__form" @submit.prevent="handleInputSubmit">
          <InputText
            v-model="inputUrl"
            placeholder="Paste SoundCloud Track or Playlist URL here..."
            autocomplete="off"
            spellcheck="false"
          />
          <Button type="submit">Play Music</Button>
        </form>

        <div class="soundcloud-dashboard__content">
          <!-- Favorites -->
          <div class="soundcloud-dashboard__section">
            <h4 class="soundcloud-dashboard__section-title">
              Recommended Streams
            </h4>
            <div class="soundcloud-dashboard__list">
              <div
                v-for="fav in favorites"
                :key="fav.url"
                class="soundcloud-dashboard__card"
                @click="playTrack(fav.url, fav.title)"
              >
                <div class="soundcloud-dashboard__card-info">
                  <span class="soundcloud-dashboard__card-title">{{ fav.title }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- History -->
          <div class="soundcloud-dashboard__section">
            <div class="soundcloud-dashboard__section-header">
              <h4 class="soundcloud-dashboard__section-title">
                Recent Tracks
              </h4>
              <a v-if="history.length > 0" class="soundcloud-dashboard__clear-btn" @click="clearHistory">Clear</a>
            </div>
            
            <div v-if="history.length === 0" class="soundcloud-dashboard__empty">
              No recently played tracks
            </div>
            <div v-else class="soundcloud-dashboard__list">
              <div
                v-for="item in history"
                :key="item.url"
                class="soundcloud-dashboard__card"
                @click="playTrack(item.url, item.title)"
              >
                <div class="soundcloud-dashboard__card-info">
                  <span class="soundcloud-dashboard__card-title">{{ item.title }}</span>
                  <span class="soundcloud-dashboard__card-meta">Played: {{ item.date }}</span>
                </div>
              </div>
            </div>
          </div>
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
  background: var(--paper-bg, #ececee);
  color: var(--paper-text, #2c2c30);
  font-family: var(--paper-font, sans-serif);
}

// Player Styles
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

// Dashboard Styles
.soundcloud-dashboard {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;

  &__hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin-bottom: 8px;
  }

  &__logo {
    font-size: 48px;
    color: #ff5500;
    margin-bottom: 8px;
  }

  &__title {
    font-size: 20px;
    font-weight: 700;
    margin: 0;
  }

  &__subtitle {
    font-size: 13px;
    color: var(--paper-text-secondary, #68686f);
    margin: 4px 0 0 0;
  }

  &__form {
    display: flex;
    gap: 8px;
    width: 100%;

    :deep(.p-inputtext) {
      flex: 1;
    }
  }

  &__content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;

    @media (max-width: 600px) {
      grid-template-columns: 1fr;
    }
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__section-title {
    font-size: 14px;
    font-weight: 600;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--paper-text, #2c2c30);
  }

  &__clear-btn {
    font-size: 12px;
    color: var(--paper-accent, #3b6fd4);
    cursor: pointer;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  &__empty {
    font-size: 13px;
    color: var(--paper-text-tertiary, #98989f);
    padding: 16px;
    text-align: center;
    border: 1px dashed var(--paper-border, #d1d1d6);
    border-radius: var(--paper-radius, 6px);
    background: var(--paper-surface, #f4f4f6);
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    background: var(--paper-surface, #f4f4f6);
    border: 1px solid var(--paper-border, #d1d1d6);
    border-radius: var(--paper-radius, 6px);
    cursor: pointer;
    transition: all 0.15s ease-in-out;

    &:hover {
      background: color-mix(in srgb, var(--paper-surface) 95%, var(--paper-text));
      border-color: color-mix(in srgb, var(--paper-border) 70%, var(--paper-text));
    }
  }

  &__card-icon {
    font-size: 20px;
    color: var(--paper-accent, #3b6fd4);
    display: flex;
    align-items: center;
  }

  &__card-info {
    display: flex;
    flex-direction: column;
    min-width: 0; // enables truncation
  }

  &__card-title {
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__card-meta {
    font-size: 11px;
    color: var(--paper-text-tertiary, #98989f);
    margin-top: 2px;
  }
}
</style>
