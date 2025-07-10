import React, { useState } from 'react'
import Arena3D from './components/Arena3D'
import GameUI from './components/GameUI'

export default function App() {
  // Game state
  const [hp, setHp] = useState(150)
  const [weapon, setWeapon] = useState('sword')
  const [skin, setSkin] = useState('classic')

  // Demo: static enemies and warp points
  const enemies = [
    { position: [5, 1, 5], color: '#f00' },
    { position: [-5, 1, 5], color: '#f00' },
    { position: [5, 1, -5], color: '#f00' },
    { position: [-5, 1, -5], color: '#f00' },
    { position: [0, 1, 10], color: '#f00' },
  ]
  const warpPoints = [
    [15, 0.25, 15],
    [-15, 0.25, 15],
    [15, 0.25, -15],
    [-15, 0.25, -15],
    [0, 0.25, 20],
  ]

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#000' }}>
      <Arena3D
        playerPos={[0, 1, 0]}
        playerColor="#06c"
        weaponType={weapon}
        weaponSkin={skin}
        enemies={enemies}
        warpPoints={warpPoints}
      />
      <GameUI
        hp={hp}
        maxHp={150}
        weapon={weapon}
        skin={skin}
        onWeaponChange={setWeapon}
        onSkinChange={setSkin}
      />
    </div>
  )
}
