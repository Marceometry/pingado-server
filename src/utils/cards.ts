import { v4 as uuid } from 'uuid'
import { CARD_SUITS } from '@/constants'
import { CardModel, MatchTableCards } from '@/types'

export const getCardsInfo = (totalCards: number, numberOfPlayers: number) => {
  const cardsPerSuit = totalCards / 4
  const cardsPerPlayer = totalCards / numberOfPlayers
  const middleCard = Math.ceil(cardsPerSuit / 2)

  return { cardsPerSuit, cardsPerPlayer, middleCard }
}

export const shuffle = (array: any[]) => {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value)
}

const generateCards = (cardsPerSuit: number): CardModel[] => {
  return CARD_SUITS.reduce((acc, item) => {
    for (let i = 1; i <= cardsPerSuit; i++) {
      acc.push({
        suit: item,
        value: i,
        id: uuid(),
      })
    }
    return acc
  }, [] as CardModel[])
}

export const dealCards = (numberOfPlayers = 4, cardsPerSuit = 10) => {
  const cards = generateCards(cardsPerSuit)
  const shuffledCards = shuffle(cards)
  const cardsPerPlayer = cards.length / numberOfPlayers

  let response = []
  for (let i = 0; i < numberOfPlayers; i++) {
    response.push(
      shuffledCards.slice(cardsPerPlayer * i, cardsPerPlayer * (i + 1))
    )
  }

  return response
}

export const getPlaceableCards = (
  playerCards: CardModel[],
  tableCards: MatchTableCards,
  middleCard: number
) => {
  if (!playerCards || !tableCards) return []

  return playerCards.filter((card) => {
    if (!tableCards[card.suit]) {
      if (card.value === middleCard) return true
      return false
    }
    if (card.value + 1 === tableCards[card.suit]![0]) return true
    if (card.value - 1 === tableCards[card.suit]![1]) return true
  })
}
