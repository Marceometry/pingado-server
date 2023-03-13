import { GameSettings, Match, MatchTable } from '@/types'

export const defaultGameSettings: GameSettings = {
  totalCards: 40,
  cardsPerSuit: 10,
  cardsPerPlayer: 10,
  numberOfPlayers: 4,
  middleCard: 5,
  playersOrder: [],
}

export const defaultTableState: MatchTable = {
  accumulated: 0,
  cards: {
    clubs: null,
    diamonds: null,
    hearts: null,
    spades: null,
  },
}

export const defaultMatchState: Match = {
  players: {},
  table: defaultTableState,
}
