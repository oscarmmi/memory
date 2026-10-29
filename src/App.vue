<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createGame, flipCard, resolveMismatch, type GameState } from './game'

const bestStorageKey = 'pairlight-best-v1'
const game = ref<GameState>(createGame())
const focusedIndex = ref(0)
const elapsedSeconds = ref(0)
const startedAt = ref<number | null>(null)
const best = ref<{ moves: number; seconds: number } | null>(readBest())
const announcement = ref('Choose any card to begin.')
let clock: number | undefined
let mismatchTimeout: number | undefined

const isWon = computed(() => game.value.phase === 'won')
const formattedTime = computed(() => formatTime(elapsedSeconds.value))
const progress = computed(() => Math.round((game.value.matchedPairs / 8) * 100))

function readBest(): { moves: number; seconds: number } | null {
  try {
    const raw = localStorage.getItem(bestStorageKey)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed === 'object' && parsed !== null &&
      'moves' in parsed && 'seconds' in parsed &&
      typeof parsed.moves === 'number' && typeof parsed.seconds === 'number'
    ) return { moves: parsed.moves, seconds: parsed.seconds }
  } catch {
    // Storage can be unavailable in private browsing; the game still works.
  }
  return null
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
  const remainder = (seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${remainder}`
}

function startClock() {
  if (startedAt.value !== null) return
  startedAt.value = Date.now()
  clock = window.setInterval(() => {
    if (startedAt.value !== null) elapsedSeconds.value = Math.floor((Date.now() - startedAt.value) / 1000)
  }, 250)
}

function stopClock() {
  if (clock !== undefined) window.clearInterval(clock)
  clock = undefined
}

function playCard(index: number) {
  focusedIndex.value = index
  const previousPairs = game.value.matchedPairs
  const next = flipCard(game.value, index)
  if (next === game.value) return
  startClock()
  game.value = next

  if (next.phase === 'mismatch') {
    announcement.value = 'Not a pair. Try to remember where each glyph lives.'
    mismatchTimeout = window.setTimeout(() => {
      game.value = resolveMismatch(game.value)
      mismatchTimeout = undefined
    }, 700)
  } else if (next.phase === 'won') {
    elapsedSeconds.value = startedAt.value === null
      ? elapsedSeconds.value
      : Math.floor((Date.now() - startedAt.value) / 1000)
    stopClock()
    announcement.value = `All pairs found in ${next.moves} ${next.moves === 1 ? 'move' : 'moves'} and ${formatTime(elapsedSeconds.value)}.`
  } else if (next.matchedPairs > previousPairs) {
    announcement.value = `${next.matchedPairs} of 8 pairs found.`
  } else {
    announcement.value = 'Card revealed.'
  }
}

function restartGame() {
  if (mismatchTimeout !== undefined) window.clearTimeout(mismatchTimeout)
  mismatchTimeout = undefined
  stopClock()
  game.value = createGame()
  focusedIndex.value = 0
  elapsedSeconds.value = 0
  startedAt.value = null
  announcement.value = 'New game. Choose any card to begin.'
}

function onKeydown(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey) return
  if (event.key.toLowerCase() === 'r') {
    event.preventDefault()
    restartGame()
    return
  }

  const offsets: Record<string, number> = {
    ArrowLeft: -1,
    ArrowRight: 1,
    ArrowUp: -4,
    ArrowDown: 4,
  }
  if (event.key in offsets) {
    event.preventDefault()
    const offset = offsets[event.key]
    const column = focusedIndex.value % 4
    if (event.key === 'ArrowLeft' && column === 0) return
    if (event.key === 'ArrowRight' && column === 3) return
    focusedIndex.value = Math.max(0, Math.min(15, focusedIndex.value + offset))
    return
  }

  if (event.key === 'Enter' || event.key === ' ') {
    const target = event.target as HTMLElement | null
    if (target?.closest('button') && !target.closest('.memory-card')) return
    event.preventDefault()
    playCard(focusedIndex.value)
  }
}

watch(isWon, (won) => {
  if (!won) return
  const result = { moves: game.value.moves, seconds: elapsedSeconds.value }
  const isNewBest = !best.value || result.moves < best.value.moves ||
    (result.moves === best.value.moves && result.seconds < best.value.seconds)
  if (isNewBest) {
    best.value = result
    try {
      localStorage.setItem(bestStorageKey, JSON.stringify(result))
    } catch {
      // Best score remains available for this session even if storage is full.
    }
  }
})

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  stopClock()
  if (mismatchTimeout !== undefined) window.clearTimeout(mismatchTimeout)
})
</script>

<template>
  <main class="page-shell">
    <div class="ambient ambient-one" aria-hidden="true"></div>
    <div class="ambient ambient-two" aria-hidden="true"></div>

    <header class="topbar">
      <a class="brand" href="#top" aria-label="Pairlight home">
        <span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span><span></span></span>
        <span>pairlight<span class="brand-period">.</span></span>
      </a>
      <div class="topbar-right">
        <span class="edition"><span class="online-dot"></span> DAILY RESET</span>
        <span class="header-divider" aria-hidden="true"></span>
        <span class="header-note">A little clarity, one pair at a time.</span>
      </div>
    </header>

    <section id="top" class="game-layout" aria-label="Pairlight memory game">
      <aside class="intro-panel">
        <div class="eyebrow"><span class="eyebrow-line"></span> THE FOCUS MINI-GAME</div>
        <h1>Find your<br /><span>flow state.</span></h1>
        <p class="intro-copy">Eight pairs are hiding in plain sight. Take a breath, trust your memory, and let the pattern come to you.</p>

        <div class="session-stats" aria-label="Current game statistics">
          <div class="stat-block">
            <span class="stat-label">YOUR MOVES</span>
            <strong class="stat-number">{{ game.moves.toString().padStart(2, '0') }}</strong>
            <span class="stat-caption">pair attempts</span>
          </div>
          <div class="stat-separator" aria-hidden="true"></div>
          <div class="stat-block">
            <span class="stat-label">TIME</span>
            <strong class="stat-number time-number">{{ formattedTime }}</strong>
            <span class="stat-caption">go at your pace</span>
          </div>
        </div>

        <div class="progress-card">
          <div class="progress-heading"><span>PAIRS FOUND</span><strong>{{ game.matchedPairs }}<i> / 8</i></strong></div>
          <div class="progress-track" role="progressbar" :aria-valuenow="game.matchedPairs" aria-valuemin="0" aria-valuemax="8" aria-label="Pairs found">
            <span class="progress-fill" :style="{ width: `${progress}%` }"></span>
          </div>
          <div class="progress-foot"><span>Keep your rhythm</span><span>{{ progress }}%</span></div>
        </div>

        <div class="best-card">
          <div class="best-icon" aria-hidden="true">✳</div>
          <div class="best-copy">
            <span class="stat-label">PERSONAL BEST</span>
            <strong v-if="best">{{ best.moves }} <small>{{ best.moves === 1 ? 'move' : 'moves' }}</small><span class="best-time">{{ formatTime(best.seconds) }}</span></strong>
            <strong v-else class="best-placeholder">Make your first match</strong>
          </div>
          <span class="best-spark" aria-hidden="true">✦</span>
        </div>

        <div class="how-to">
          <span class="how-icon" aria-hidden="true">⌘</span>
          <span><strong>Quick reset</strong><br />Press <kbd>R</kbd> any time to start fresh.</span>
        </div>
      </aside>

      <section class="board-panel" aria-label="Memory card board">
        <div class="board-topline">
          <div class="round-label"><span class="round-icon" aria-hidden="true">◌</span><span>ROUND <strong>01</strong></span></div>
          <button class="reset-button" type="button" @click="restartGame"><span aria-hidden="true">↻</span> New game <kbd>R</kbd></button>
        </div>

        <div class="board-frame">
          <div class="board-grid" role="group" aria-label="Sixteen memory cards. Use arrow keys to move, then Enter or Space to reveal.">
            <button
              v-for="(card, index) in game.cards"
              :key="card.instanceId"
              class="memory-card"
              :class="[`tone-${card.color}`, { 'is-revealed': card.revealed, 'is-matched': card.matched, 'is-focused': focusedIndex === index }]"
              type="button"
              :aria-label="card.revealed ? `${card.name}${card.matched ? ', matched' : ', revealed'}` : `Hidden card ${index + 1}`"
              :aria-pressed="card.revealed"
              @focus="focusedIndex = index"
              @click="playCard(index)"
            >
              <span class="card-inner">
                <span class="card-face card-back" aria-hidden="true"><span class="card-orbit orbit-one"></span><span class="card-orbit orbit-two"></span><span class="card-center">✳</span><span class="card-corner corner-top">·</span><span class="card-corner corner-bottom">·</span></span>
                <span class="card-face card-front" aria-hidden="true"><span class="glyph-halo"></span><span class="card-glyph">{{ card.glyph }}</span><span class="glyph-name">{{ card.name }}</span><span v-if="card.matched" class="match-check">✓</span></span>
              </span>
            </button>
          </div>
          <div class="board-bottom"><span class="board-dot" aria-hidden="true"></span><span>16 TILES <i>·</i> 8 PAIRS</span><span class="board-dot" aria-hidden="true"></span></div>
        </div>

        <div class="board-footer">
          <div class="hint-wrap" aria-live="polite"><span class="hint-symbol" aria-hidden="true">✧</span><span>{{ isWon ? 'Beautifully done. Your mind is a lovely place.' : game.moves === 0 ? 'Tap a tile to reveal its hidden glow' : announcement }}</span></div>
          <span class="keyboard-hint"><kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd><span>navigate</span></span>
        </div>

        <Transition name="win">
          <div v-if="isWon" class="win-banner" role="status">
            <span class="win-star" aria-hidden="true">✦</span>
            <div><strong>A moment of clarity.</strong><span>All eight pairs, all yours.</span></div>
            <button type="button" aria-label="Play another round" @click="restartGame">Play again <span aria-hidden="true">↗</span></button>
          </div>
        </Transition>
      </section>
    </section>

    <footer class="page-footer"><span>PAIRLIGHT <i>©</i> 2026</span><span class="footer-center">A small space to reset your attention.</span><span>MADE FOR YOUR MIND <b aria-hidden="true">✳</b></span></footer>
  </main>
</template>
