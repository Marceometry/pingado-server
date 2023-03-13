import { Server, Socket } from 'socket.io'
import {
  AUTOPLAY_DELAY_MS,
  CUSTOM_COLORS,
  defaultGameSettings,
  defaultMatchState,
  defaultTableState,
  SOCKET_EVENTS,
} from '@/constants'
import {
  CardModel,
  CreateGameData,
  CustomColor,
  GameSettings,
  Match,
  Players,
} from '@/types'
import {
  countPlayers,
  dealCards,
  fillPlayers,
  getCardsInfo,
  findAIPlayer,
  makePlayer,
  generateAIId,
  matchPublicInfo,
  getNextPlayer,
  isPlayerAI,
  getPlaceableCards,
  shuffle,
  generateMatchPlayers,
} from '@/utils'

const log = (info: any) => console.log(info, '\n')

export const game = (io: Server) => {
  let gameStarted = false
  let availableColors: CustomColor[] = shuffle(CUSTOM_COLORS)
  let gameSettings: GameSettings = { ...defaultGameSettings }
  let match: Match = { ...defaultMatchState }
  let players: Players = {}

  const notifyGameCreation = () => {
    io.emit(SOCKET_EVENTS.createGame, { gameSettings, players })
  }

  const notifyMatchState = (showCards?: boolean) => {
    const matchInfo = showCards ? match : matchPublicInfo(match)
    io.emit(SOCKET_EVENTS.matchUpdate, matchInfo)
  }

  const notifyPlayersState = () => {
    io.emit(SOCKET_EVENTS.playersUpdate, {
      players,
      playersOrder: gameSettings.playersOrder,
    })
  }

  const notifyPlayerCards = (playerId: string) => {
    io.emit(`cards-${playerId}`, match.players[playerId]?.cards || [])
  }

  const notifyCardsForPlayers = () => {
    const playerList = Object.keys(players).filter(
      (playerId) => !isPlayerAI(playerId)
    )
    playerList.forEach((playerId) => notifyPlayerCards(playerId))
  }

  function createGame(data: CreateGameData) {
    const { totalCards, numberOfPlayers } = data
    const cardsInfo = getCardsInfo(totalCards, numberOfPlayers)
    const { filledPlayers, remainingColors } = fillPlayers(
      players,
      numberOfPlayers,
      availableColors
    )

    availableColors = remainingColors
    players = filledPlayers
    gameSettings = {
      ...cardsInfo,
      totalCards,
      numberOfPlayers,
      playersOrder: Object.keys(filledPlayers),
    }

    notifyGameCreation()
    startMatch()
    gameStarted = true
  }

  function stopGame() {
    match = { ...defaultMatchState }
    notifyMatchState()
    gameStarted = false
  }

  function startMatch() {
    const { cardsPerSuit, numberOfPlayers, playersOrder } = gameSettings
    const playersCards = dealCards(numberOfPlayers, cardsPerSuit)
    const matchPlayers = generateMatchPlayers(
      playersOrder,
      players,
      playersCards
    )

    const firstPlayer = match.startingPlayer || playersOrder[0]
    match = {
      players: { ...matchPlayers },
      startingPlayer: firstPlayer,
      currentPlayer: firstPlayer,
      table: defaultTableState,
    }

    io.emit(SOCKET_EVENTS.startMatch, matchPublicInfo(match))
    notifyCardsForPlayers()
    autoPlay(firstPlayer)
  }

  function placeCard(card: CardModel, playerId: string) {
    if (match.winner) return
    if (match.currentPlayer !== playerId) return

    const { middleCard, playersOrder } = gameSettings
    const currentValues = match.table.cards[card.suit]
    let cardsInTable = currentValues

    if (!currentValues && card.value !== middleCard) return

    if (!currentValues && card.value === middleCard) {
      cardsInTable = [middleCard, middleCard]
    }
    if (currentValues && currentValues[0] === card.value + 1) {
      cardsInTable = [card.value, currentValues[1]]
    }
    if (currentValues && currentValues[1] === card.value - 1) {
      cardsInTable = [currentValues[0], card.value]
    }
    if (cardsInTable === currentValues) return

    const cardsRemaining = match.players[playerId].cards.filter((item) => {
      if (item.suit !== card.suit) return true
      return item.value !== card.value
    })

    const hasWon = cardsRemaining.length === 0

    const nextPlayer = getNextPlayer(
      players,
      playersOrder,
      hasWon ? match.startingPlayer! : match.currentPlayer!
    )

    const tableAccumulatedPoints = match.table.accumulated

    match = {
      winner: hasWon ? playerId : undefined,
      startingPlayer: hasWon ? nextPlayer : match.startingPlayer,
      currentPlayer: nextPlayer,
      players: {
        ...match.players,
        [playerId]: {
          ...match.players[playerId],
          cards: cardsRemaining,
        },
      },
      table: {
        ...match.table,
        cards: {
          ...match.table.cards,
          [card.suit]: cardsInTable,
        },
      },
    }

    autoPlay(nextPlayer)

    notifyPlayerCards(playerId)
    if (!hasWon) return notifyMatchState()
    notifyMatchState(true)

    players = {
      ...players,
      [playerId]: {
        ...players[playerId],
        accumulated: players[playerId].accumulated + tableAccumulatedPoints,
        matchesWon: players[playerId].matchesWon + 1,
      },
    }
    notifyPlayersState()
  }

  function dropAndSkipTurn(playerId: string) {
    if (match.winner) return
    if (match.currentPlayer !== playerId) return

    const nextPlayer = getNextPlayer(
      players,
      gameSettings.playersOrder,
      match.currentPlayer!
    )

    match = {
      ...match,
      currentPlayer: nextPlayer,
      table: {
        ...match.table,
        accumulated: match.table.accumulated + 1,
      },
    }

    players = {
      ...players,
      [playerId]: {
        ...players[playerId],
        accumulated: players[playerId].accumulated - 1,
      },
    }

    notifyMatchState()
    notifyPlayersState()

    autoPlay(nextPlayer)
  }

  function autoPlay(playerId: string) {
    setTimeout(() => {
      if (!isPlayerAI(playerId)) return

      const cards = match.players[playerId].cards
      const placeableCards = getPlaceableCards(
        cards,
        match.table.cards,
        gameSettings.middleCard
      )

      if (!placeableCards.length) return dropAndSkipTurn(playerId)

      placeCard(placeableCards[0], playerId)
    }, AUTOPLAY_DELAY_MS)
  }

  function updateUserColor(playerId: string, color: CustomColor) {
    players = {
      ...players,
      [playerId]: {
        ...players[playerId],
        chipColor: color,
      },
    }
    notifyPlayersState()
  }

  function addPlayer(id: string) {
    const order = Object.keys(players).length + 1
    const player = makePlayer(order, availableColors[0])

    players = { ...players, [id]: player }

    notifyPlayersState()
  }

  function removePlayer(id: string) {
    const player = { ...players[id] }
    delete players[id]

    if (!gameStarted) return

    const AIId = generateAIId()
    const removedPlayerCards = match.players[id].cards
    delete match.players[id]

    players = {
      ...players,
      [AIId]: player,
    }
    match = {
      ...match,
      winner: match.winner === id ? AIId : match.winner,
      currentPlayer: match.currentPlayer === id ? AIId : match.currentPlayer,
      startingPlayer: match.startingPlayer === id ? AIId : match.startingPlayer,
      players: {
        ...match.players,
        [AIId]: { cards: removedPlayerCards },
      },
    }

    if (match.currentPlayer === AIId) autoPlay(AIId)

    const index = gameSettings.playersOrder.findIndex((item) => item === id)
    gameSettings.playersOrder[index] = AIId

    notifyMatchState()
    notifyPlayersState()
  }

  function handleConnection(id: string, socket: Socket) {
    const numberOfPlayers = countPlayers(players, id)

    if (numberOfPlayers === gameSettings.numberOfPlayers) {
      socket.disconnect()
    }

    if (!gameStarted && !players[id]) addPlayer(id)
  }

  io.on('connection', (socket) => {
    log(`\n connected: ${socket.handshake.auth.id}`)

    const id = socket.handshake.auth.id
    handleConnection(id, socket)

    socket.on('disconnect', () => {
      log(`disconnected: ${id}`)
      removePlayer(id)
    })

    socket.on(SOCKET_EVENTS.createGame, createGame)

    socket.on(SOCKET_EVENTS.stopGame, stopGame)

    socket.on(SOCKET_EVENTS.startMatch, startMatch)

    socket.on(SOCKET_EVENTS.placeCard, (card) => placeCard(card, id))

    socket.on(SOCKET_EVENTS.dropAndSkip, () => dropAndSkipTurn(id))

    socket.on(SOCKET_EVENTS.userColor, (color) => updateUserColor(id, color))
  })
}
