import { createContext, useContext, useReducer, ReactNode } from 'react'

export interface Weapon {
  id: string
  name: string
  damage: number
  fireRate: number
  range: number
  cost: number
  unlocked: boolean
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  description: string
}

export interface Enemy {
  id: string
  x: number
  y: number
  health: number
  maxHealth: number
  speed: number
  reward: number
  type: 'basic' | 'fast' | 'heavy' | 'boss'
}

export interface GameState {
  gameState: 'menu' | 'playing' | 'paused' | 'gameOver'
  showShop: boolean
  coins: number
  score: number
  level: number
  wave: number
  playerHealth: number
  maxPlayerHealth: number
  playerX: number
  playerY: number
  currentWeapon: Weapon | null
  weapons: Weapon[]
  enemies: Enemy[]
  bullets: Array<{
    id: string
    x: number
    y: number
    dx: number
    dy: number
    damage: number
  }>
  particles: Array<{
    id: string
    x: number
    y: number
    dx: number
    dy: number
    life: number
    color: string
  }>
  lastShot: number
  keys: Set<string>
  mousePos: { x: number; y: number }
  gameTime: number
}

type GameAction = 
  | { type: 'SET_GAME_STATE'; payload: GameState['gameState'] }
  | { type: 'SET_SHOW_SHOP'; payload: boolean }
  | { type: 'ADD_COINS'; payload: number }
  | { type: 'SPEND_COINS'; payload: number }
  | { type: 'ADD_SCORE'; payload: number }
  | { type: 'SET_LEVEL'; payload: number }
  | { type: 'SET_WAVE'; payload: number }
  | { type: 'SET_PLAYER_HEALTH'; payload: number }
  | { type: 'SET_PLAYER_POSITION'; payload: { x: number; y: number } }
  | { type: 'SET_CURRENT_WEAPON'; payload: Weapon | null }
  | { type: 'UNLOCK_WEAPON'; payload: string }
  | { type: 'SET_ENEMIES'; payload: Enemy[] }
  | { type: 'SET_BULLETS'; payload: GameState['bullets'] }
  | { type: 'SET_PARTICLES'; payload: GameState['particles'] }
  | { type: 'SET_LAST_SHOT'; payload: number }
  | { type: 'SET_KEYS'; payload: Set<string> }
  | { type: 'SET_MOUSE_POS'; payload: { x: number; y: number } }
  | { type: 'SET_GAME_TIME'; payload: number }
  | { type: 'RESET_GAME' }

const initialWeapons: Weapon[] = [
  {
    id: 'pistol',
    name: 'Sketchy Pistol',
    damage: 25,
    fireRate: 300,
    range: 300,
    cost: 0,
    unlocked: true,
    rarity: 'common',
    description: 'A basic hand-drawn pistol. Reliable but weak.'
  },
  {
    id: 'shotgun',
    name: 'Scribbled Shotgun',
    damage: 60,
    fireRate: 800,
    range: 150,
    cost: 150,
    unlocked: false,
    rarity: 'common',
    description: 'Close-range devastation in sketchy style.'
  },
  {
    id: 'rifle',
    name: 'Doodle Rifle',
    damage: 40,
    fireRate: 150,
    range: 400,
    cost: 300,
    unlocked: false,
    rarity: 'rare',
    description: 'Fast-firing sketched rifle for sustained damage.'
  },
  {
    id: 'sniper',
    name: 'Pencil Sniper',
    damage: 120,
    fireRate: 1500,
    range: 600,
    cost: 500,
    unlocked: false,
    rarity: 'epic',
    description: 'One-shot precision from artistic distance.'
  },
  {
    id: 'plasma',
    name: 'Drawn Plasma Gun',
    damage: 80,
    fireRate: 200,
    range: 350,
    cost: 800,
    unlocked: false,
    rarity: 'legendary',
    description: 'Futuristic sketched energy weapon.'
  }
]

const initialState: GameState = {
  gameState: 'menu',
  showShop: false,
  coins: 50,
  score: 0,
  level: 1,
  wave: 1,
  playerHealth: 100,
  maxPlayerHealth: 100,
  playerX: 400,
  playerY: 300,
  currentWeapon: initialWeapons[0],
  weapons: initialWeapons,
  enemies: [],
  bullets: [],
  particles: [],
  lastShot: 0,
  keys: new Set(),
  mousePos: { x: 0, y: 0 },
  gameTime: 0
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_GAME_STATE':
      return { ...state, gameState: action.payload }
    case 'SET_SHOW_SHOP':
      return { ...state, showShop: action.payload }
    case 'ADD_COINS':
      return { ...state, coins: state.coins + action.payload }
    case 'SPEND_COINS':
      return { ...state, coins: Math.max(0, state.coins - action.payload) }
    case 'ADD_SCORE':
      return { ...state, score: state.score + action.payload }
    case 'SET_LEVEL':
      return { ...state, level: action.payload }
    case 'SET_WAVE':
      return { ...state, wave: action.payload }
    case 'SET_PLAYER_HEALTH':
      return { ...state, playerHealth: action.payload }
    case 'SET_PLAYER_POSITION':
      return { ...state, playerX: action.payload.x, playerY: action.payload.y }
    case 'SET_CURRENT_WEAPON':
      return { ...state, currentWeapon: action.payload }
    case 'UNLOCK_WEAPON':
      return {
        ...state,
        weapons: state.weapons.map(weapon =>
          weapon.id === action.payload ? { ...weapon, unlocked: true } : weapon
        )
      }
    case 'SET_ENEMIES':
      return { ...state, enemies: action.payload }
    case 'SET_BULLETS':
      return { ...state, bullets: action.payload }
    case 'SET_PARTICLES':
      return { ...state, particles: action.payload }
    case 'SET_LAST_SHOT':
      return { ...state, lastShot: action.payload }
    case 'SET_KEYS':
      return { ...state, keys: action.payload }
    case 'SET_MOUSE_POS':
      return { ...state, mousePos: action.payload }
    case 'SET_GAME_TIME':
      return { ...state, gameTime: action.payload }
    case 'RESET_GAME':
      return { ...initialState, weapons: state.weapons }
    default:
      return state
  }
}

const GameContext = createContext<{
  state: GameState
  dispatch: React.Dispatch<GameAction>
} | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }

  const { state, dispatch } = context

  return {
    // State
    gameState: state.gameState,
    showShop: state.showShop,
    coins: state.coins,
    score: state.score,
    level: state.level,
    wave: state.wave,
    playerHealth: state.playerHealth,
    maxPlayerHealth: state.maxPlayerHealth,
    playerX: state.playerX,
    playerY: state.playerY,
    currentWeapon: state.currentWeapon,
    weapons: state.weapons,
    enemies: state.enemies,
    bullets: state.bullets,
    particles: state.particles,
    lastShot: state.lastShot,
    keys: state.keys,
    mousePos: state.mousePos,
    gameTime: state.gameTime,
    
    // Actions
    setGameState: (gameState: GameState['gameState']) => dispatch({ type: 'SET_GAME_STATE', payload: gameState }),
    setShowShop: (show: boolean) => dispatch({ type: 'SET_SHOW_SHOP', payload: show }),
    addCoins: (amount: number) => dispatch({ type: 'ADD_COINS', payload: amount }),
    spendCoins: (amount: number) => dispatch({ type: 'SPEND_COINS', payload: amount }),
    addScore: (amount: number) => dispatch({ type: 'ADD_SCORE', payload: amount }),
    setLevel: (level: number) => dispatch({ type: 'SET_LEVEL', payload: level }),
    setWave: (wave: number) => dispatch({ type: 'SET_WAVE', payload: wave }),
    setPlayerHealth: (health: number) => dispatch({ type: 'SET_PLAYER_HEALTH', payload: health }),
    setPlayerPosition: (x: number, y: number) => dispatch({ type: 'SET_PLAYER_POSITION', payload: { x, y } }),
    setCurrentWeapon: (weapon: Weapon | null) => dispatch({ type: 'SET_CURRENT_WEAPON', payload: weapon }),
    unlockWeapon: (weaponId: string) => dispatch({ type: 'UNLOCK_WEAPON', payload: weaponId }),
    setEnemies: (enemies: Enemy[]) => dispatch({ type: 'SET_ENEMIES', payload: enemies }),
    setBullets: (bullets: GameState['bullets']) => dispatch({ type: 'SET_BULLETS', payload: bullets }),
    setParticles: (particles: GameState['particles']) => dispatch({ type: 'SET_PARTICLES', payload: particles }),
    setLastShot: (time: number) => dispatch({ type: 'SET_LAST_SHOT', payload: time }),
    setKeys: (keysOrUpdater: Set<string> | ((prev: Set<string>) => Set<string>)) => {
      if (typeof keysOrUpdater === 'function') {
        dispatch({ type: 'SET_KEYS', payload: keysOrUpdater(state.keys) })
      } else {
        dispatch({ type: 'SET_KEYS', payload: keysOrUpdater })
      }
    },
    setMousePos: (x: number, y: number) => dispatch({ type: 'SET_MOUSE_POS', payload: { x, y } }),
    setGameTime: (time: number) => dispatch({ type: 'SET_GAME_TIME', payload: time }),
    resetGame: () => dispatch({ type: 'RESET_GAME' })
  }
}