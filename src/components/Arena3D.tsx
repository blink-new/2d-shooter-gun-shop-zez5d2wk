import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

// --- Arena Floor ---
function ArenaFloor() {
  return (
    <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#333" />
    </mesh>
  )
}

// --- Player ---
function Player({ position, color }: { position: [number, number, number], color: string }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(() => {
    // Animate player if needed
  })
  return (
    <mesh ref={ref} position={position} castShadow>
      <capsuleGeometry args={[0.5, 1.5, 4, 8]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

// --- Weapon ---
function Weapon({ type, skin, position }: { type: string, skin: string, position: [number, number, number] }) {
  // Color logic for skin
  const skinColors: Record<string, string> = {
    classic: '#888',
    gold: '#ffd700',
    diamond: '#0ff',
    fire: '#f44',
    ice: '#44f',
  }
  let geometry
  switch (type) {
    case 'sword':
      geometry = <boxGeometry args={[0.1, 2, 0.1]} />
      break
    case 'gun':
      geometry = <boxGeometry args={[0.3, 0.3, 1]} />
      break
    case 'rifle':
      geometry = <boxGeometry args={[0.2, 0.2, 1.5]} />
      break
    case 'laser':
      geometry = <cylinderGeometry args={[0.1, 0.1, 1.2]} />
      break
    default:
      geometry = <boxGeometry args={[0.1, 2, 0.1]} />
  }
  return (
    <mesh position={position} castShadow>
      {geometry}
      <meshStandardMaterial color={skinColors[skin] || '#888'} />
    </mesh>
  )
}

// --- Enemy ---
function Enemy({ position, color }: { position: [number, number, number], color: string }) {
  return (
    <mesh position={position} castShadow>
      <capsuleGeometry args={[0.5, 1.5, 4, 8]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

// --- Warp Point ---
function WarpPoint({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <cylinderGeometry args={[1, 1, 0.5, 8]} />
      <meshStandardMaterial color="#0f0" transparent opacity={0.7} />
    </mesh>
  )
}

// --- Main Arena3D Scene ---
export default function Arena3D({
  playerPos = [0, 1, 0],
  playerColor = '#06c',
  weaponType = 'sword',
  weaponSkin = 'classic',
  enemies = [],
  warpPoints = []
}: {
  playerPos?: [number, number, number],
  playerColor?: string,
  weaponType?: string,
  weaponSkin?: string,
  enemies?: Array<{ position: [number, number, number], color: string }>,
  warpPoints?: Array<[number, number, number]>
}) {
  return (
    <Canvas shadows camera={{ position: [0, 5, 10], fov: 75 }} style={{ width: '100vw', height: '100vh', background: '#001122' }}>
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={0.7} castShadow />
      <ArenaFloor />
      <Player position={playerPos} color={playerColor} />
      <Weapon type={weaponType} skin={weaponSkin} position={[playerPos[0] + 0.5, playerPos[1], playerPos[2] + 0.5]} />
      {enemies.map((e, i) => (
        <Enemy key={i} position={e.position} color={e.color} />
      ))}
      {warpPoints.map((p, i) => (
        <WarpPoint key={i} position={p} />
      ))}
      <OrbitControls target={[0, 1, 0]} enablePan={false} enableZoom={false} />
    </Canvas>
  )
}