import { CardModel, Match, MatchPlayer, Players } from '@/types'

export const generateMatchPlayers = (
  playersOrder: string[],
  players: Players,
  playersCards: CardModel[][]
) => {
  return playersOrder
    .filter((player) => !!players[player])
    .reduce((acc, item, index) => {
      acc[item] = { cards: playersCards[index] }
      return acc
    }, {} as { [id: string]: MatchPlayer })
}

export const matchPublicInfo = (match: Match) => {
  const players = Object.entries(match.players).reduce((acc, player) => {
    const cards = player[1].cards.map((card) => ({ id: card.id }))
    return { ...acc, [player[0]]: { cards } }
  }, {})
  return { ...match, players }
}
