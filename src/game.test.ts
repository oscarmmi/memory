import { describe, expect, it } from 'vitest'
import { createGame, flipCard, GLYPHS } from './game'

describe('Pairlight game logic', () => {
  it('creates a shuffled board with eight unique pairs', () => {
    const game = createGame(() => 0.42)
    const pairCounts = new Map<string, number>()
    for (const card of game.cards) pairCounts.set(card.pairId, (pairCounts.get(card.pairId) ?? 0) + 1)

    expect(game.cards).toHaveLength(16)
    expect(pairCounts.size).toBe(8)
    expect([...pairCounts.values()]).toEqual(Array(8).fill(2))
    expect(new Set(game.cards.map((card) => card.instanceId)).size).toBe(16)
  })

  it('keeps a matching pair revealed and increments the pair count', () => {
    const game = createGame()
    const pairId = game.cards[0]!.pairId
    const pairIndexes = game.cards.flatMap((card, index) => card.pairId === pairId ? [index] : [])
    const firstFlip = flipCard(game, pairIndexes[0]!)
    const matched = flipCard(firstFlip, pairIndexes[1]!)

    expect(matched.matchedPairs).toBe(1)
    expect(matched.moves).toBe(1)
    expect(matched.cards.filter((card) => card.pairId === pairId).every((card) => card.revealed && card.matched)).toBe(true)
  })

  it('does not declare a win after a mismatch', () => {
    const game = createGame()
    const firstPairId = game.cards[0]!.pairId
    const secondIndex = game.cards.findIndex((card) => card.pairId !== firstPairId)
    const mismatch = flipCard(flipCard(game, 0), secondIndex)

    expect(mismatch.phase).toBe('mismatch')
    expect(mismatch.matchedPairs).toBe(0)
    expect(mismatch.phase).not.toBe('won')
    expect(mismatch.cards.filter((card) => card.revealed)).toHaveLength(2)
  })

  it('wins after all eight pairs are matched', () => {
    let game = createGame()
    for (const glyph of GLYPHS) {
      const pairIndexes = game.cards.flatMap((card, index) => card.pairId === glyph.id ? [index] : [])
      game = flipCard(game, pairIndexes[0]!)
      game = flipCard(game, pairIndexes[1]!)
    }

    expect(game.matchedPairs).toBe(8)
    expect(game.moves).toBe(8)
    expect(game.phase).toBe('won')
    expect(game.cards.every((card) => card.revealed && card.matched)).toBe(true)
  })
})
