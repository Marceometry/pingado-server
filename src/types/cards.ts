export type CardSuit = 'clubs' | 'diamonds' | 'hearts' | 'spades'

export type CardModel = {
  suit: CardSuit
  value: number
  id?: string
}
