import { useEffect, useRef, useCallback, useMemo } from 'react'
import { useGame } from '../contexts/GameContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Play, Pause, RotateCcw } from 'lucide-react'

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  
  const {
    gameState,
    setGameState,
    playerX,
    playerY,
    setPlayerPosition,
    enemies,
    setEnemies,
    bullets,
    setBullets,
    particles,
    setParticles,
    currentWeapon,
    lastShot,
    setLastShot,
    keys,
    setKeys,
    mousePos,
    setMousePos,
    gameTime,
    setGameTime,
    addCoins,
    addScore,
    playerHealth,
    setPlayerHealth,
    maxPlayerHealth,
    wave,
    setWave,
    level,
    setLevel,
    resetGame,
    score
  } = useGame()

  // 🔥 Performance fix: Précalculate texture particles ONCE
  const textureParticles = useMemo(() => {
    const particles = []
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        radius: Math.random() * 2
      })
    }
    return particles
  }, [])

  // 🔥 Performance fix: Precalculate wobbly circle paths
  const wobbleCircles = useMemo(() => {
    const playerPath = []
    const enemyPath = []
    
    // Player circle path
    for (let i = 0; i <= 16; i++) {
      const angle = (i / 16) * Math.PI * 2
      const wobble = (Math.sin(angle * 8) + Math.cos(angle * 5)) * 1.5
      playerPath.push({
        x: Math.cos(angle) * (15 + wobble),
        y: Math.sin(angle) * (15 + wobble)
      })
    }
    
    // Enemy circle path
    for (let i = 0; i <= 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      const wobble = (Math.sin(angle * 6) + Math.cos(angle * 4)) * 1
      enemyPath.push({
        x: Math.cos(angle) * (12 + wobble),
        y: Math.sin(angle) * (12 + wobble)
      })
    }
    
    return { playerPath, enemyPath }
  }, [])

  // Game loop with performance optimizations
  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas with hand-drawn style
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 🔥 Performance fix: Use precalculated texture particles
    ctx.globalAlpha = 0.05
    ctx.fillStyle = '#ffffff'
    for (const particle of textureParticles) {
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1

    // Update game time with less frequency
    setGameTime(gameTime + 16)

    // Player movement
    let newPlayerX = playerX
    let newPlayerY = playerY
    const moveSpeed = 3

    if (keys.has('KeyW') || keys.has('ArrowUp')) newPlayerY -= moveSpeed
    if (keys.has('KeyS') || keys.has('ArrowDown')) newPlayerY += moveSpeed
    if (keys.has('KeyA') || keys.has('ArrowLeft')) newPlayerX -= moveSpeed
    if (keys.has('KeyD') || keys.has('ArrowRight')) newPlayerX += moveSpeed

    // Keep player in bounds
    newPlayerX = Math.max(20, Math.min(canvas.width - 20, newPlayerX))
    newPlayerY = Math.max(20, Math.min(canvas.height - 20, newPlayerY))
    
    // Only update position if it changed
    if (newPlayerX !== playerX || newPlayerY !== playerY) {
      setPlayerPosition(newPlayerX, newPlayerY)
    }

    // 🔥 Performance fix: Draw player with precalculated path
    ctx.save()
    ctx.translate(newPlayerX, newPlayerY)
    
    ctx.strokeStyle = '#60a5fa'
    ctx.fillStyle = '#3b82f6'
    ctx.lineWidth = 3
    ctx.beginPath()
    
    // Use precalculated wobbly path
    const playerPath = wobbleCircles.playerPath
    ctx.moveTo(playerPath[0].x, playerPath[0].y)
    for (let i = 1; i < playerPath.length; i++) {
      ctx.lineTo(playerPath[i].x, playerPath[i].y)
    }
    ctx.fill()
    ctx.stroke()

    // Draw weapon direction indicator
    if (currentWeapon) {
      const angle = Math.atan2(mousePos.y - newPlayerY, mousePos.x - newPlayerX)
      ctx.rotate(angle)
      ctx.strokeStyle = '#f59e0b'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(15, 0)
      ctx.lineTo(35, 0)
      ctx.stroke()
    }

    ctx.restore()

    // Spawn enemies with better control
    if (enemies.length < 3 + wave && Math.random() < 0.02) {
      const side = Math.floor(Math.random() * 4)
      let x, y
      
      switch (side) {
        case 0: // Top
          x = Math.random() * canvas.width
          y = -30
          break
        case 1: // Right
          x = canvas.width + 30
          y = Math.random() * canvas.height
          break
        case 2: // Bottom
          x = Math.random() * canvas.width
          y = canvas.height + 30
          break
        default: // Left
          x = -30
          y = Math.random() * canvas.height
          break
      }

      const newEnemy = {
        id: Date.now().toString(),
        x,
        y,
        health: 50 + (wave * 10),
        maxHealth: 50 + (wave * 10),
        speed: 1 + (wave * 0.2),
        reward: 10 + (wave * 2),
        type: 'basic' as const
      }

      setEnemies([...enemies, newEnemy])
    }

    // Update and draw enemies
    const updatedEnemies = enemies.map(enemy => {
      const dx = newPlayerX - enemy.x
      const dy = newPlayerY - enemy.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance > 0) {
        enemy.x += (dx / distance) * enemy.speed
        enemy.y += (dy / distance) * enemy.speed
      }

      // 🔥 Performance fix: Draw enemy with precalculated path
      ctx.save()
      ctx.translate(enemy.x, enemy.y)
      
      ctx.strokeStyle = '#dc2626'
      ctx.fillStyle = '#ef4444'
      ctx.lineWidth = 2
      ctx.beginPath()
      
      // Use precalculated wobbly path
      const enemyPath = wobbleCircles.enemyPath
      ctx.moveTo(enemyPath[0].x, enemyPath[0].y)
      for (let i = 1; i < enemyPath.length; i++) {
        ctx.lineTo(enemyPath[i].x, enemyPath[i].y)
      }
      ctx.fill()
      ctx.stroke()

      // Health bar
      if (enemy.health < enemy.maxHealth) {
        const barWidth = 30
        const barHeight = 4
        ctx.fillStyle = '#dc2626'
        ctx.fillRect(-barWidth/2, -25, barWidth, barHeight)
        ctx.fillStyle = '#22c55e'
        ctx.fillRect(-barWidth/2, -25, (enemy.health / enemy.maxHealth) * barWidth, barHeight)
      }

      ctx.restore()

      return enemy
    }).filter(enemy => enemy.health > 0)

    // Update bullets
    const updatedBullets = bullets.map(bullet => {
      bullet.x += bullet.dx
      bullet.y += bullet.dy

      // Draw bullet with simple style for performance
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2)
      ctx.fill()

      return bullet
    }).filter(bullet => 
      bullet.x >= 0 && bullet.x <= canvas.width && 
      bullet.y >= 0 && bullet.y <= canvas.height
    )

    // Collision detection
    const remainingBullets = []
    const remainingEnemies = [...updatedEnemies]
    
    for (const bullet of updatedBullets) {
      let hit = false
      
      for (let i = 0; i < remainingEnemies.length; i++) {
        const enemy = remainingEnemies[i]
        const dx = bullet.x - enemy.x
        const dy = bullet.y - enemy.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < 20) {
          enemy.health -= bullet.damage
          hit = true
          
          // Create hit particles
          const newParticles = []
          for (let j = 0; j < 3; j++) { // Reduced particles for performance
            newParticles.push({
              id: Date.now().toString() + j,
              x: enemy.x,
              y: enemy.y,
              dx: (Math.random() - 0.5) * 4,
              dy: (Math.random() - 0.5) * 4,
              life: 15, // Shorter life for performance
              color: '#ef4444'
            })
          }
          setParticles([...particles, ...newParticles])
          
          if (enemy.health <= 0) {
            addCoins(enemy.reward)
            addScore(enemy.reward * 10)
            remainingEnemies.splice(i, 1)
            i--
          }
          break
        }
      }
      
      if (!hit) {
        remainingBullets.push(bullet)
      }
    }

    // Update particles with simpler rendering
    const updatedParticles = particles.map(particle => {
      particle.x += particle.dx
      particle.y += particle.dy
      particle.life -= 1

      // Simple particle rendering
      ctx.globalAlpha = particle.life / 15
      ctx.fillStyle = particle.color
      ctx.fillRect(particle.x - 1, particle.y - 1, 2, 2) // Rectangle is faster than circle
      ctx.globalAlpha = 1

      return particle
    }).filter(particle => particle.life > 0)

    // Check player collision with enemies
    for (const enemy of remainingEnemies) {
      const dx = newPlayerX - enemy.x
      const dy = newPlayerY - enemy.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < 25) {
        setPlayerHealth(Math.max(0, playerHealth - 1))
        if (playerHealth <= 1) {
          setGameState('gameOver')
        }
      }
    }

    // 🔥 Performance fix: Batch state updates less frequently
    setEnemies(remainingEnemies)
    setBullets(remainingBullets)
    setParticles(updatedParticles)

    // Level progression
    if (enemies.length === 0 && updatedEnemies.length === 0) {
      setTimeout(() => {
        setWave(wave + 1)
        if (wave % 5 === 0) {
          setLevel(level + 1)
        }
      }, 1000)
    }

    animationRef.current = requestAnimationFrame(gameLoop)
  }, [gameState, playerX, playerY, enemies, bullets, particles, currentWeapon, keys, mousePos, gameTime, playerHealth, wave, level, wobbleCircles, textureParticles, setPlayerPosition, setEnemies, setBullets, setParticles, setGameTime, addCoins, addScore, setPlayerHealth, setGameState, setWave, setLevel])

  // Shooting with reduced frequency
  const shoot = useCallback(() => {
    if (!currentWeapon || Date.now() - lastShot < currentWeapon.fireRate) return

    const canvas = canvasRef.current
    if (!canvas) return

    const angle = Math.atan2(mousePos.y - playerY, mousePos.x - playerX)
    const speed = 8
    
    const newBullet = {
      id: Date.now().toString(),
      x: playerX,
      y: playerY,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      damage: currentWeapon.damage
    }

    setBullets([...bullets, newBullet])
    setLastShot(Date.now())
  }, [currentWeapon, lastShot, mousePos, playerX, playerY, bullets, setBullets, setLastShot])

  // Event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        setGameState(gameState === 'playing' ? 'paused' : 'playing')
      }
      
      setKeys(prev => new Set([...prev, e.code]))
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => {
        const newKeys = new Set(prev)
        newKeys.delete(e.code)
        return newKeys
      })
    }

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      setMousePos(e.clientX - rect.left, e.clientY - rect.top)
    }

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { // Left click
        shoot()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mousedown', handleMouseDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
    }
  }, [gameState, setGameState, setKeys, setMousePos, shoot])

  // Start game loop
  useEffect(() => {
    if (gameState === 'playing') {
      animationRef.current = requestAnimationFrame(gameLoop)
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameState, gameLoop])

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
      {gameState === 'menu' && (
        <Card className="p-8 bg-slate-800/90 border-2 border-orange-500 shadow-2xl">
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'cursive' }}>
              Sketchy Shooter
            </h1>
            <p className="text-gray-300 text-lg">
              Survive waves of sketchy enemies and unlock powerful weapons!
            </p>
            <div className="space-y-4">
              <Button
                onClick={() => setGameState('playing')}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg border-2 border-orange-500 shadow-lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Game
              </Button>
              <div className="text-sm text-gray-400">
                Use WASD/Arrow keys to move, mouse to aim and shoot
              </div>
            </div>
          </div>
        </Card>
      )}

      {gameState === 'gameOver' && (
        <Card className="p-8 bg-slate-800/90 border-2 border-red-500 shadow-2xl">
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-bold text-red-400 mb-4">Game Over!</h1>
            <div className="text-white text-lg">
              <div>Final Score: {score}</div>
              <div>Wave Reached: {wave}</div>
            </div>
            <div className="space-y-4">
              <Button
                onClick={() => {
                  resetGame()
                  setGameState('menu')
                }}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg border-2 border-orange-500 shadow-lg"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Play Again
              </Button>
            </div>
          </div>
        </Card>
      )}

      {(gameState === 'playing' || gameState === 'paused') && (
        <>
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="border-2 border-orange-500/30 rounded-lg shadow-2xl bg-slate-800"
            style={{
              filter: 'drop-shadow(0 0 20px rgba(255, 165, 0, 0.2))',
              imageRendering: 'pixelated'
            }}
          />
          
          {/* Game HUD */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg p-2 border border-orange-500/30">
                <div className="text-sm text-gray-300">Health</div>
                <Progress value={(playerHealth / maxPlayerHealth) * 100} className="w-32" />
              </div>
              <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg p-2 border border-orange-500/30">
                <div className="text-sm text-gray-300">Wave {wave}</div>
                <div className="text-sm text-gray-300">Level {level}</div>
              </div>
            </div>
            
            <Button
              onClick={() => setGameState(gameState === 'playing' ? 'paused' : 'playing')}
              className="bg-slate-700 hover:bg-slate-600 text-white"
            >
              {gameState === 'playing' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}