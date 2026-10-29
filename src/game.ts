export const GLYPHS = [
  { id: 'sol', name: 'Sol', glyph: '☼', color: 'amber' },
  { id: 'tide', name: 'Tide', glyph: '≈', color: 'cyan' },
  { id: 'bloom', name: 'Bloom', glyph: '✿', color: 'rose' },
  { id: 'orbit', name: 'Orbit', glyph: '◉', color: 'violet' },
  { id: 'spark', name: 'Spark', glyph: '✧', color: 'mint' },
  { id: 'drift', name: 'Drift', glyph: '〰', color: 'blue' },
  { id: 'moss', name: 'Moss', glyph: '❋', color: 'lime' },
  { id: 'ember', name: 'Ember', glyph: '◇', color: 'coral' },
] as const

export type GlyphColor = (typeof GLYPHS)[number]['color']
export interface MemoryCard {
  instanceId: string
  pairId: string
  name: string
  glyph: string
  color: GlyphColor
  revealed: boolean
  matched: boolean
}

export type GamePhase = 'ready' | 'playing' | 'mismatch' | 'won'
export interface GameState {
  cards: MemoryCard[]
  moves: number
  matchedPairs: number
  phase: GamePhase
  selected: number[]
}

export function createGame(random: () => number = Math.random): GameState {
  const cards = GLYPHS.flatMap((pair) => [0, 1].map((copy) => ({
    instanceId: `${pair.id}-${copy}`,
    pairId: pair.id,
    name: pair.name,
    glyph: pair.glyph,
    color: pair.color,
    revealed: false,
    matched: false,
  })))

  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[cards[i], cards[j]] = [cards[j], cards[i]]
  }

  return { cards, moves: 0, matchedPairs: 0, phase: 'ready', selected: [] }
}

export function flipCard(state: GameState, index: number): GameState {
  if (state.phase === 'mismatch' || state.phase === 'won' || index < 0 || index >= state.cards.length) return state
  const card = state.cards[index]
  if (!card || card.revealed || card.matched) return state

  const cards = state.cards.map((item, itemIndex) => itemIndex === index ? { ...item, revealed: true } : item)
  if (state.selected.length === 0) {
    return { ...state, cards, phase: 'playing', selected: [index] }
  }

  const firstIndex = state.selected[0]
  const firstCard = state.cards[firstIndex]
  const moves = state.moves + 1
  if (firstCard?.pairId === card.pairId) {
    const matchedCards = cards.map((item, itemIndex) =>
      itemIndex === firstIndex || itemIndex === index ? { ...item, matched: true } : item,
    )
    const matchedPairs = state.matchedPairs + 1
    return {
      cards: matchedCards,
      moves,
      matchedPairs,
      phase: matchedPairs === GLYPHS.length ? 'won' : 'playing',
      selected: [],
    }
  }

  return { ...state, cards, moves, phase: 'mismatch', selected: [firstIndex, index] }
}

export function resolveMismatch(state: GameState): GameState {
  if (state.phase !== 'mismatch') return state
  const hiddenCards = state.cards.map((card, index) =>
    state.selected.includes(index) ? { ...card, revealed: false } : card,
  )
  return { ...state, cards: hiddenCards, phase: 'playing', selected: [] }
}
