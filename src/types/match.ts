import { CardModel } from './cards'

export type MatchPlayer = {
  cards: CardModel[]
}

export type MatchTableCards = {
  clubs: [number, number] | null
  diamonds: [number, number] | null
  hearts: [number, number] | null
  spades: [number, number] | null
}

export type MatchTable = {
  accumulated: number
  cards: MatchTableCards
}

export type Match = {
  startingPlayer?: string
  currentPlayer?: string
  winner?: string
  table: MatchTable
  players: {
    [id: string]: MatchPlayer
  }
}
