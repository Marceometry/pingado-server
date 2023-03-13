export type Player = {
  accumulated: number
  matchesWon: number
  name: string
  chipColor?: CustomColor
}

export type Players = {
  [id: string]: Player
}

export type CustomColor =
  | 'black'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'lightblue'
  | 'blue'
  | 'purple'
  | 'pink'
