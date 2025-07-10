import React from 'react'
import { GameProvider } from './contexts/GameContext'
import Game from './components/Game'
import Shop from './components/Shop'
import { useGame } from './contexts/GameContext'

function GameApp() {
  const { showShop } = useGame()

  return (
    <div className="w-full h-screen bg-slate-900 relative overflow-hidden">
      {showShop ? (
        <div className="h-full flex">
          <div className="w-1/2">
            <Game />
          </div>
          <div className="w-1/2 bg-slate-800 border-l border-orange-500/30">
            <Shop />
          </div>
        </div>
      ) : (
        <Game />
      )}
    </div>
  )
}

export default function App() {
  return (
    <GameProvider>
      <GameApp />
    </GameProvider>
  )
}