import { useEffect, useRef, useCallback, useMemo } from 'react'
import { useGame } from '../contexts/GameContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Play, Pause, RotateCcw, ShoppingCart, X } from 'lucide-react'

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const lastFrameTime = useRef<number>(0)
  
  const {
    gameState,
    setGameState,
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
    score,
    showShop,
    setShowShop
  } = useGame()

  // 🔥 Performance fix: Pre-calculate static elements
  const staticElements = useMemo(() => {
    const skyboxGradient = []
    for (let i = 0; i < 300; i++) {
      skyboxGradient.push({
        x: Math.random() * 800,
        y: Math.random() * 200,
        size: Math.random() * 1.5 + 0.5,
        brightness: Math.random() * 0.3 + 0.1
      })
    }
    
    const floorPattern = []
    for (let x = 0; x < 40; x++) {
      for (let y = 0; y < 30; y++) {
        floorPattern.push({
          x: x * 20,
          y: y * 20,
          shade: Math.random() * 0.1 + 0.05
        })
      }
    }
    
    return { skyboxGradient, floorPattern }
  }, [])

  // 🔥 Player position and rotation for first-person view
  const playerRotation = useRef(0)
  const playerBob = useRef(0)
  const playerBobSpeed = useRef(0)

  // 🔥 Optimized game loop with 60 FPS cap
  const gameLoop = useCallback((currentTime: number) => {
    if (gameState !== 'playing') return

    const deltaTime = currentTime - lastFrameTime.current
    if (deltaTime < 16) { // Cap at 60 FPS
      animationRef.current = requestAnimationFrame(gameLoop)
      return
    }
    lastFrameTime.current = currentTime

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 🔥 First-person skybox (optimized)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, '#1a1a2e')
    gradient.addColorStop(0.3, '#16213e')
    gradient.addColorStop(0.7, '#0f172a')
    gradient.addColorStop(1, '#020617')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 🔥 Static stars/particles for atmosphere
    ctx.globalAlpha = 0.4
    for (const star of staticElements.skyboxGradient) {
      ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`
      ctx.fillRect(star.x, star.y, star.size, star.size)
    }
    ctx.globalAlpha = 1

    // 🔥 Player movement and rotation
    let moveX = 0
    let moveY = 0
    let rotationSpeed = 0
    const moveSpeed = 4
    const rotSpeed = 0.05

    if (keys.has('KeyW') || keys.has('ArrowUp')) {
      moveX += Math.cos(playerRotation.current) * moveSpeed
      moveY += Math.sin(playerRotation.current) * moveSpeed
      playerBobSpeed.current = Math.min(playerBobSpeed.current + 0.3, 0.15)
    }
    if (keys.has('KeyS') || keys.has('ArrowDown')) {
      moveX -= Math.cos(playerRotation.current) * moveSpeed
      moveY -= Math.sin(playerRotation.current) * moveSpeed
      playerBobSpeed.current = Math.min(playerBobSpeed.current + 0.3, 0.15)
    }
    if (keys.has('KeyA') || keys.has('ArrowLeft')) {
      rotationSpeed -= rotSpeed
    }
    if (keys.has('KeyD') || keys.has('ArrowRight')) {
      rotationSpeed += rotSpeed
    }

    // Update player rotation
    playerRotation.current += rotationSpeed
    
    // Walking bob effect
    if (moveX !== 0 || moveY !== 0) {
      playerBob.current += playerBobSpeed.current
      playerBobSpeed.current *= 0.98
    } else {
      playerBobSpeed.current *= 0.9
    }

    // 🔥 First-person floor rendering (optimized)
    const floorY = canvas.height * 0.6
    const horizonHeight = Math.sin(playerBob.current) * 3
    
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, floorY + horizonHeight, canvas.width, canvas.height - floorY)
    
    // Floor grid effect
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.3
    for (let i = 0; i < 20; i++) {
      const y = floorY + horizonHeight + i * 15
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    // 🔥 Spawn enemies with better performance
    if (enemies.length < 3 + Math.floor(wave / 2) && Math.random() < 0.015) {
      const angle = Math.random() * Math.PI * 2
      const distance = 400 + Math.random() * 200
      const newEnemy = {
        id: Date.now().toString(),
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        health: 50 + (wave * 10),
        maxHealth: 50 + (wave * 10),
        speed: 1 + (wave * 0.15),
        reward: 15 + (wave * 3),
        type: 'basic' as const
      }
      setEnemies([...enemies, newEnemy])
    }

    // 🔥 Update and render enemies in first-person
    const updatedEnemies = enemies.map(enemy => {
      // Move enemy toward player
      const dx = -enemy.x
      const dy = -enemy.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance > 10) {
        enemy.x += (dx / distance) * enemy.speed
        enemy.y += (dy / distance) * enemy.speed
      }

      // Calculate enemy screen position in first-person
      const relativeX = enemy.x * Math.cos(-playerRotation.current) - enemy.y * Math.sin(-playerRotation.current)
      const relativeY = enemy.x * Math.sin(-playerRotation.current) + enemy.y * Math.cos(-playerRotation.current)
      
      if (relativeY > 0) { // Enemy is in front of player
        const screenX = canvas.width/2 + (relativeX / relativeY) * 300
        const screenY = floorY + horizonHeight - (50 / relativeY) * 100
        const size = Math.max(10, 80 / relativeY)
        
        if (screenX > -size && screenX < canvas.width + size && size > 3) {
          // 🔥 Optimized enemy rendering
          ctx.fillStyle = `rgba(239, 68, 68, ${Math.min(1, 150 / relativeY)})`
          ctx.strokeStyle = `rgba(220, 38, 38, ${Math.min(1, 150 / relativeY)})`
          ctx.lineWidth = 2
          
          // Simple enemy shape for performance
          ctx.beginPath()
          ctx.arc(screenX, screenY, size/2, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
          
          // Health bar
          if (enemy.health < enemy.maxHealth && size > 10) {
            const barWidth = size
            const barHeight = 3
            ctx.fillStyle = '#dc2626'
            ctx.fillRect(screenX - barWidth/2, screenY - size/2 - 8, barWidth, barHeight)
            ctx.fillStyle = '#22c55e'
            ctx.fillRect(screenX - barWidth/2, screenY - size/2 - 8, (enemy.health / enemy.maxHealth) * barWidth, barHeight)
          }
        }
      }

      return enemy
    }).filter(enemy => enemy.health > 0)

    // 🔥 Update bullets in first-person
    const updatedBullets = bullets.map(bullet => {
      bullet.x += bullet.dx
      bullet.y += bullet.dy

      // Simple bullet trail effect
      ctx.fillStyle = '#fbbf24'
      ctx.shadowBlur = 10
      ctx.shadowColor = '#fbbf24'
      ctx.beginPath()
      ctx.arc(bullet.x + canvas.width/2, bullet.y + canvas.height/2, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      return bullet
    }).filter(bullet => {
      const distance = Math.sqrt(bullet.x * bullet.x + bullet.y * bullet.y)
      return distance < 1000
    })

    // 🔥 Collision detection (optimized)
    const remainingBullets = []
    const remainingEnemies = [...updatedEnemies]
    
    for (const bullet of updatedBullets) {
      let hit = false
      
      for (let i = 0; i < remainingEnemies.length; i++) {
        const enemy = remainingEnemies[i]
        const dx = bullet.x - enemy.x
        const dy = bullet.y - enemy.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < 25) {
          enemy.health -= bullet.damage
          hit = true
          
          // Create hit effect
          const newParticles = []
          for (let j = 0; j < 5; j++) {
            newParticles.push({
              id: Date.now().toString() + j,
              x: enemy.x,
              y: enemy.y,
              dx: (Math.random() - 0.5) * 6,
              dy: (Math.random() - 0.5) * 6,
              life: 20,
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

    // 🔥 Update particles
    const updatedParticles = particles.map(particle => {
      particle.x += particle.dx
      particle.y += particle.dy
      particle.life -= 1

      // Render particle in first-person
      const relativeX = particle.x * Math.cos(-playerRotation.current) - particle.y * Math.sin(-playerRotation.current)
      const relativeY = particle.x * Math.sin(-playerRotation.current) + particle.y * Math.cos(-playerRotation.current)
      
      if (relativeY > 0) {
        const screenX = canvas.width/2 + (relativeX / relativeY) * 300
        const screenY = floorY + horizonHeight - (20 / relativeY) * 100
        
        ctx.globalAlpha = particle.life / 20
        ctx.fillStyle = particle.color
        ctx.fillRect(screenX - 1, screenY - 1, 2, 2)
        ctx.globalAlpha = 1
      }

      return particle
    }).filter(particle => particle.life > 0)

    // 🔥 Check collision with enemies
    for (const enemy of remainingEnemies) {
      const distance = Math.sqrt(enemy.x * enemy.x + enemy.y * enemy.y)
      if (distance < 30) {
        setPlayerHealth(Math.max(0, playerHealth - 2))
        if (playerHealth <= 2) {
          setGameState('gameOver')
        }
      }
    }

    // 🔥 First-person weapon rendering
    if (currentWeapon) {
      const weaponX = canvas.width - 150
      const weaponY = canvas.height - 100 + Math.sin(playerBob.current) * 5
      
      ctx.fillStyle = '#8b5cf6'
      ctx.strokeStyle = '#6d28d9'
      ctx.lineWidth = 3
      
      // Simple weapon shape
      ctx.beginPath()
      ctx.roundRect(weaponX, weaponY, 80, 20, 5)
      ctx.fill()
      ctx.stroke()
      
      // Weapon barrel
      ctx.fillStyle = '#374151'
      ctx.fillRect(weaponX + 80, weaponY + 5, 40, 10)
      
      // Muzzle flash when shooting
      if (Date.now() - lastShot < 100) {
        ctx.fillStyle = '#fbbf24'
        ctx.shadowBlur = 15
        ctx.shadowColor = '#fbbf24'
        ctx.beginPath()
        ctx.arc(weaponX + 130, weaponY + 10, 8, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }
    }

    // 🔥 First-person crosshair
    const crosshairX = canvas.width / 2
    const crosshairY = canvas.height / 2
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(crosshairX - 10, crosshairY)
    ctx.lineTo(crosshairX + 10, crosshairY)
    ctx.moveTo(crosshairX, crosshairY - 10)
    ctx.lineTo(crosshairX, crosshairY + 10)
    ctx.stroke()

    // Update states
    setEnemies(remainingEnemies)
    setBullets(remainingBullets)
    setParticles(updatedParticles)
    setGameTime(gameTime + deltaTime)

    // Wave progression
    if (enemies.length === 0 && remainingEnemies.length === 0) {
      setTimeout(() => {
        setWave(wave + 1)
        if (wave % 3 === 0) {
          setLevel(level + 1)
        }
      }, 2000)
    }

    animationRef.current = requestAnimationFrame(gameLoop)
  }, [gameState, enemies, bullets, particles, currentWeapon, keys, playerHealth, wave, level, gameTime, lastShot, staticElements, setEnemies, setBullets, setParticles, setGameTime, addCoins, addScore, setPlayerHealth, setGameState, setWave, setLevel])

  // 🔥 Optimized shooting
  const shoot = useCallback(() => {
    if (!currentWeapon || Date.now() - lastShot < currentWeapon.fireRate) return

    const angle = playerRotation.current
    const speed = 12
    
    const newBullet = {
      id: Date.now().toString(),
      x: 0,
      y: 0,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      damage: currentWeapon.damage
    }

    setBullets([...bullets, newBullet])
    setLastShot(Date.now())
  }, [currentWeapon, lastShot, bullets, setBullets, setLastShot])

  // Event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      
      if (e.code === 'Escape') {
        setGameState(gameState === 'playing' ? 'paused' : 'playing')
      }
      if (e.code === 'KeyB') {
        setShowShop(!showShop)
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
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      setMousePos(x, y)
      
      // Mouse look for first-person
      if (gameState === 'playing' && !showShop) {
        const sensitivity = 0.002
        const deltaX = x - canvas.width / 2
        playerRotation.current += deltaX * sensitivity
      }
    }

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0 && gameState === 'playing' && !showShop) {
        shoot()
      }
    }

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('contextmenu', handleContextMenu)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [gameState, showShop, setGameState, setKeys, setMousePos, shoot, setShowShop])

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
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      {gameState === 'menu' && (
        <Card className="p-8 bg-slate-800/95 border-2 border-orange-500 shadow-2xl backdrop-blur-sm">
          <div className="text-center space-y-6">
            <h1 className="text-5xl font-bold text-white mb-4" style={{ fontFamily: 'cursive' }}>
              🎯 First-Person Shooter
            </h1>
            <p className="text-gray-300 text-lg max-w-md">
              Survive endless waves of enemies in this intense first-person shooter!
            </p>
            <div className="space-y-4">
              <Button
                onClick={() => setGameState('playing')}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-8 rounded-lg border-2 border-orange-500 shadow-lg text-lg"
              >
                <Play className="w-6 h-6 mr-3" />
                Start Game
              </Button>
              <div className="text-sm text-gray-400 space-y-1">
                <div>🎮 WASD - Move • Mouse - Look & Shoot</div>
                <div>🛍️ B - Open Shop • ESC - Pause</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {gameState === 'gameOver' && (
        <Card className="p-8 bg-slate-800/95 border-2 border-red-500 shadow-2xl backdrop-blur-sm">
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-bold text-red-400 mb-4">💀 Game Over!</h1>
            <div className="text-white text-xl space-y-2">
              <div>Final Score: <span className="text-yellow-400">{score}</span></div>
              <div>Waves Survived: <span className="text-orange-400">{wave}</span></div>
              <div>Level Reached: <span className="text-blue-400">{level}</span></div>
            </div>
            <div className="space-y-4">
              <Button
                onClick={() => {
                  resetGame()
                  setGameState('menu')
                }}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-8 rounded-lg border-2 border-orange-500 shadow-lg text-lg"
              >
                <RotateCcw className="w-6 h-6 mr-3" />
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
            className="border-2 border-orange-500/50 rounded-lg shadow-2xl bg-slate-900 cursor-none"
            style={{
              filter: 'drop-shadow(0 0 30px rgba(234, 88, 12, 0.3))',
            }}
          />
          
          {/* Game HUD */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-none">
            <div className="flex items-center space-x-4">
              <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 border border-orange-500/50">
                <div className="text-sm text-gray-300 mb-1">Health</div>
                <Progress value={(playerHealth / maxPlayerHealth) * 100} className="w-40 h-3" />
                <div className="text-xs text-gray-400 mt-1">{playerHealth}/{maxPlayerHealth}</div>
              </div>
              <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 border border-orange-500/50">
                <div className="text-sm text-gray-300">Wave <span className="text-orange-400 font-bold">{wave}</span></div>
                <div className="text-sm text-gray-300">Level <span className="text-blue-400 font-bold">{level}</span></div>
                <div className="text-sm text-gray-300">Score <span className="text-yellow-400 font-bold">{score}</span></div>
              </div>
              {currentWeapon && (
                <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 border border-orange-500/50">
                  <div className="text-sm text-gray-300">Weapon</div>
                  <div className="text-sm text-white font-bold">{currentWeapon.name}</div>
                  <div className="text-xs text-gray-400">DMG: {currentWeapon.damage}</div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2 pointer-events-auto">
              <Button
                onClick={() => setShowShop(!showShop)}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2"
                title="Shop (B)"
              >
                {showShop ? <X className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
              </Button>
              <Button
                onClick={() => setGameState(gameState === 'playing' ? 'paused' : 'playing')}
                className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2"
                title="Pause (ESC)"
              >
                {gameState === 'playing' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {gameState === 'paused' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Card className="p-6 bg-slate-800/95 border-2 border-orange-500 shadow-2xl">
                <div className="text-center space-y-4">
                  <h2 className="text-2xl font-bold text-white">Game Paused</h2>
                  <div className="space-y-2">
                    <Button
                      onClick={() => setGameState('playing')}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Resume
                    </Button>
                    <Button
                      onClick={() => {
                        resetGame()
                        setGameState('menu')
                      }}
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Main Menu
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}