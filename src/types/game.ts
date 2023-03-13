export type CreateGameData = {
  numberOfPlayers: number
  totalCards: number
}

export type GameSettings = {
  totalCards: number
  cardsPerSuit: number
  cardsPerPlayer: number
  numberOfPlayers: number
  middleCard: number
  playersOrder: string[]
}
