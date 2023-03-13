import { v4 as uuid } from 'uuid'
import { AI_PLAYER_PREFIX } from '@/constants'
import { CustomColor, Player, Players } from '@/types'

export const countPlayers = (players: Players, id?: string) => {
  return Object.keys(players).filter((playerId) => playerId !== id).length
}

const sliceId = (id: string) => {
  const prefixLength = AI_PLAYER_PREFIX.length
  return id.slice(prefixLength)
}

export const generateAIId = (removedPlayerId?: string) => {
  const id = removedPlayerId || uuid()
  return `${AI_PLAYER_PREFIX}${sliceId(id)}`
}

export const findSubstituteAI = (players: Players, id: string) => {
  const playerList = Object.keys(players)
  return playerList.find((playerId) => sliceId(playerId) === sliceId(id))
}

export const isPlayerAI = (id: string) => id.startsWith(AI_PLAYER_PREFIX)

export const findAIPlayer = (players: Players) => {
  return Object.entries(players).find((player) => {
    return isPlayerAI(player[0])
  })?.[0]
}

export const makePlayer = (index: number, color?: CustomColor): Player => ({
  accumulated: 30,
  matchesWon: 0,
  name: `Jogador ${index}`,
  chipColor: color,
})

export const fillPlayers = (
  currentPlayers: Players,
  numberOfPlayers: number,
  availableColors: CustomColor[]
) => {
  const playersOrder = Object.keys(currentPlayers)
  const array = new Array(numberOfPlayers).fill('')
  let remainingColors = availableColors
  const filledPlayers = array.reduce((acc, _, index) => {
    const AI_ID = generateAIId()
    const playerId = playersOrder[index] || AI_ID
    const color = availableColors[index]
    remainingColors = remainingColors.filter(
      (_, colorIndex) => colorIndex !== index
    )
    return {
      ...acc,
      [playerId]: makePlayer(index + 1, color),
    }
  }, {})
  return { filledPlayers, remainingColors }
}

export const getNextPlayer = (
  players: Players,
  playersOrder: string[],
  currentPlayer: string
) => {
  const currentPlayerIndex = playersOrder.indexOf(currentPlayer)
  let nextPlayerIndex = currentPlayerIndex + 1

  if (!!players[playersOrder[nextPlayerIndex]])
    return playersOrder[nextPlayerIndex]

  for (let i = 2; !players[playersOrder[nextPlayerIndex]]; i++) {
    nextPlayerIndex =
      currentPlayerIndex + i >= Object.keys(players).length
        ? 0
        : currentPlayerIndex + i
  }

  return playersOrder[nextPlayerIndex]
}
