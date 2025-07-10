import React from 'react'

const weaponNames: Record<string, string> = {
  sword: 'Épée',
  gun: 'Pistolet',
  rifle: 'Fusil',
  laser: 'Laser',
}
const skinNames: Record<string, string> = {
  classic: 'Classique',
  gold: 'Or',
  diamond: 'Diamant',
  fire: 'Feu',
  ice: 'Glace',
}

export default function GameUI({
  hp = 150,
  maxHp = 150,
  weapon = 'sword',
  skin = 'classic',
  onWeaponChange,
  onSkinChange,
}: {
  hp?: number
  maxHp?: number
  weapon?: string
  skin?: string
  onWeaponChange?: (w: string) => void
  onSkinChange?: (s: string) => void
}) {
  return (
    <>
      <div id="ui" style={{ position: 'absolute', top: 20, left: 20, color: 'white', zIndex: 100, fontSize: 16 }}>
        <div id="hpBar" style={{ width: 300, height: 30, background: '#333', border: '2px solid #fff', borderRadius: 15, overflow: 'hidden', marginBottom: 10 }}>
          <div id="hpFill" style={{ height: '100%', background: 'linear-gradient(90deg, #ff0000, #ff4444)', width: `${(hp / maxHp) * 100}%`, transition: 'width 0.3s ease' }} />
        </div>
        <div id="playerInfo">
          <div>HP: <span id="hpText">{hp}</span>/{maxHp}</div>
          <div>Arme: <span id="currentWeapon">{weaponNames[weapon] || weapon}</span></div>
          <div>Skin: <span id="currentSkin">{skinNames[skin] || skin}</span></div>
        </div>
      </div>
      <div id="weaponSelect" style={{ position: 'absolute', top: 20, right: 20, color: 'white', zIndex: 100 }}>
        <h3>Armes</h3>
        {Object.keys(weaponNames).map(w => (
          <button
            key={w}
            className={`weapon-btn${weapon === w ? ' active' : ''}`}
            data-weapon={w}
            style={{
              background: weapon === w ? '#0066cc' : '#333',
              color: 'white',
              border: `2px solid ${weapon === w ? '#0088ff' : '#666'}`,
              padding: '10px 15px',
              margin: 5,
              borderRadius: 5,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onClick={() => onWeaponChange?.(w)}
          >
            {w === 'sword' && '🗡️'}
            {w === 'gun' && '🔫'}
            {w === 'rifle' && '🔫'}
            {w === 'laser' && '⚡'} {weaponNames[w]}
          </button>
        ))}
      </div>
      <div id="skinSelect" style={{ position: 'absolute', bottom: 20, left: 20, color: 'white', zIndex: 100 }}>
        <h3>Skins d'Arme</h3>
        {Object.keys(skinNames).map(s => (
          <button
            key={s}
            className={`skin-btn${skin === s ? ' active' : ''}`}
            data-skin={s}
            style={{
              background: skin === s ? '#cc6600' : '#333',
              color: 'white',
              border: `2px solid ${skin === s ? '#ff8800' : '#666'}`,
              padding: '8px 12px',
              margin: 3,
              borderRadius: 5,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onClick={() => onSkinChange?.(s)}
          >
            {skinNames[s]}
          </button>
        ))}
      </div>
      <div id="crosshair" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 20, height: 20, border: '2px solid #fff', borderRadius: '50%', zIndex: 100, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 4, height: 4, background: '#fff', borderRadius: '50%' }} />
      </div>
      <div id="controls" style={{ position: 'absolute', bottom: 20, right: 20, color: 'white', zIndex: 100, fontSize: 14 }}>
        <strong>Contrôles:</strong><br />
        WASD - Déplacement<br />
        Souris - Regarder<br />
        Clic Gauche - Attaquer<br />
        R - Warp/Téléportation<br />
        Espace - Saut
      </div>
    </>
  )
}
