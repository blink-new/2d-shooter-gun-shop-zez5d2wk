import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Coins, Zap, Lock, Target, Shield, Clock } from 'lucide-react'
import { useGame } from '../contexts/GameContext'
import { Weapon } from '../contexts/GameContext'

export default function Shop() {
  const { 
    weapons, 
    currentWeapon, 
    setCurrentWeapon, 
    coins, 
    spendCoins, 
    unlockWeapon 
  } = useGame()

  const getRarityColor = (rarity: Weapon['rarity']) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500'
      case 'rare': return 'bg-blue-500'
      case 'epic': return 'bg-purple-500'
      case 'legendary': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getRarityBorder = (rarity: Weapon['rarity']) => {
    switch (rarity) {
      case 'common': return 'border-gray-400'
      case 'rare': return 'border-blue-400'
      case 'epic': return 'border-purple-400'
      case 'legendary': return 'border-yellow-400'
      default: return 'border-gray-400'
    }
  }

  const purchaseWeapon = (weapon: Weapon) => {
    if (coins >= weapon.cost && !weapon.unlocked) {
      spendCoins(weapon.cost)
      unlockWeapon(weapon.id)
    }
  }

  const equipWeapon = (weapon: Weapon) => {
    if (weapon.unlocked) {
      setCurrentWeapon(weapon)
    }
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="sticky top-0 bg-slate-800/90 backdrop-blur-sm pb-4 mb-4 border-b border-orange-500/30">
        <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'cursive' }}>
          Gun Shop
        </h2>
        <div className="flex items-center text-yellow-400 text-xl font-bold">
          <Coins className="w-5 h-5 mr-2" />
          {coins} Coins
        </div>
      </div>

      <div className="space-y-4">
        {weapons.map((weapon) => (
          <Card 
            key={weapon.id} 
            className={`p-4 bg-slate-700/80 backdrop-blur-sm border-2 ${getRarityBorder(weapon.rarity)} transition-all duration-300 hover:scale-105 hover:shadow-lg`}
            style={{
              filter: weapon.unlocked ? 'none' : 'grayscale(0.7) opacity(0.8)',
              background: weapon.id === currentWeapon?.id 
                ? 'linear-gradient(145deg, rgba(234, 88, 12, 0.2), rgba(194, 65, 12, 0.1))'
                : 'rgba(51, 65, 85, 0.8)'
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-bold text-white">{weapon.name}</h3>
                  <Badge 
                    className={`${getRarityColor(weapon.rarity)} text-white text-xs px-2 py-1`}
                  >
                    {weapon.rarity}
                  </Badge>
                  {weapon.id === currentWeapon?.id && (
                    <Badge className="bg-orange-500 text-white text-xs px-2 py-1">
                      EQUIPPED
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-300 mb-3">{weapon.description}</p>
              </div>
              
              {!weapon.unlocked && (
                <Lock className="w-5 h-5 text-gray-400 ml-2" />
              )}
            </div>

            {/* Weapon Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-300">
                  <Target className="w-4 h-4 mr-2 text-red-400" />
                  <span>Damage</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Progress value={(weapon.damage / 120) * 100} className="flex-1 h-2" />
                  <span className="text-sm text-white font-bold">{weapon.damage}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-300">
                  <Zap className="w-4 h-4 mr-2 text-yellow-400" />
                  <span>Range</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Progress value={(weapon.range / 600) * 100} className="flex-1 h-2" />
                  <span className="text-sm text-white font-bold">{weapon.range}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-300">
                  <Clock className="w-4 h-4 mr-2 text-blue-400" />
                  <span>Fire Rate</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Progress value={(1 - weapon.fireRate / 1500) * 100} className="flex-1 h-2" />
                  <span className="text-sm text-white font-bold">{Math.round(1000 / weapon.fireRate * 60)} RPM</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-300">
                  <Shield className="w-4 h-4 mr-2 text-green-400" />
                  <span>Cost</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-white font-bold">{weapon.cost}</span>
                </div>
              </div>
            </div>

            <Separator className="my-3 bg-slate-600" />

            {/* Action Buttons */}
            <div className="flex space-x-2">
              {!weapon.unlocked ? (
                <Button
                  onClick={() => purchaseWeapon(weapon)}
                  disabled={coins < weapon.cost}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg border-2 border-green-500 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Coins className="w-4 h-4 mr-2" />
                  Buy ({weapon.cost})
                </Button>
              ) : (
                <Button
                  onClick={() => equipWeapon(weapon)}
                  disabled={weapon.id === currentWeapon?.id}
                  className={`flex-1 font-bold py-2 px-4 rounded-lg border-2 shadow-lg ${
                    weapon.id === currentWeapon?.id
                      ? 'bg-orange-600 border-orange-500 text-white cursor-default'
                      : 'bg-blue-600 hover:bg-blue-700 border-blue-500 text-white'
                  }`}
                >
                  {weapon.id === currentWeapon?.id ? 'Equipped' : 'Equip'}
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Shop Tips */}
      <Card className="mt-6 p-4 bg-slate-700/60 backdrop-blur-sm border border-orange-500/30">
        <h3 className="text-lg font-bold text-orange-400 mb-2">💡 Shop Tips</h3>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Defeat enemies to earn coins</li>
          <li>• Higher waves give more rewards</li>
          <li>• Rare weapons have better stats</li>
          <li>• Each weapon has unique characteristics</li>
        </ul>
      </Card>
    </div>
  )
}