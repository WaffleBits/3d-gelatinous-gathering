"use client"

import { Button } from "./ui/Button"
import { skins } from "../data/skins"
import { useState } from "react"
import { X, Coins } from "lucide-react"
import { useGameStore } from "../stores/gameStore"

interface ShopModalProps {
  onClose: () => void
  selectedSkin: number
  onSelectSkin: (id: number) => void
}

export function ShopModal({ onClose, selectedSkin, onSelectSkin }: ShopModalProps) {
  const [activeTab, setActiveTab] = useState<"skins" | "effects">("skins")
  const [purchasedSkins, setPurchasedSkins] = useState<number[]>(() => {
    const saved = localStorage.getItem("purchasedSkins")
    return saved ? JSON.parse(saved) : [0, 1, 2, 3, 4]
  })
  const [purchasedEffects, setPurchasedEffects] = useState<string[]>(() => {
    const saved = localStorage.getItem("purchasedEffects")
    return saved ? JSON.parse(saved) : []
  })

  const { coins, addCoins } = useGameStore()

  // Effects available in the shop
  const effects = [
    { id: "trail", name: "Color Trail", price: 100, description: "Leave a colorful trail as you move" },
    { id: "glow", name: "Glow Effect", price: 150, description: "Make your ball glow in the dark" },
    { id: "particles", name: "Particle Effect", price: 200, description: "Emit particles as you move" },
    { id: "rainbow", name: "Rainbow Pulse", price: 300, description: "Your ball pulses with rainbow colors" },
    { id: "explosion", name: "Explosion Effect", price: 500, description: "Create explosions when you eat others" },
  ]

  const handleSelectSkin = (id: number) => {
    // If it's a premium skin that hasn't been purchased
    if (skins[id].premium && !purchasedSkins.includes(id)) {
      // Check if player has enough coins
      const skinPrice = (id - 4) * 100 // Simple pricing formula

      if (coins >= skinPrice) {
        // Purchase the skin
        addCoins(-skinPrice)
        const newPurchasedSkins = [...purchasedSkins, id]
        setPurchasedSkins(newPurchasedSkins)
        localStorage.setItem("purchasedSkins", JSON.stringify(newPurchasedSkins))

        // Select the skin
        onSelectSkin(id)
      } else {
        alert("Not enough coins to purchase this skin!")
      }

      return
    }

    onSelectSkin(id)
  }

  const handlePurchaseEffect = (effectId: string, price: number) => {
    if (coins >= price) {
      // Purchase the effect
      addCoins(-price)
      const newPurchasedEffects = [...purchasedEffects, effectId]
      setPurchasedEffects(newPurchasedEffects)
      localStorage.setItem("purchasedEffects", JSON.stringify(newPurchasedEffects))
    } else {
      alert("Not enough coins to purchase this effect!")
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-card p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Shop</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-yellow-900/30 px-3 py-1 rounded-full">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span className="font-bold text-yellow-500">{coins}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex border-b mb-4">
          <button
            className={`px-4 py-2 ${activeTab === "skins" ? "border-b-2 border-primary font-bold" : "text-muted-foreground"}`}
            onClick={() => setActiveTab("skins")}
          >
            Skins
          </button>
          <button
            className={`px-4 py-2 ${activeTab === "effects" ? "border-b-2 border-primary font-bold" : "text-muted-foreground"}`}
            onClick={() => setActiveTab("effects")}
          >
            Effects
          </button>
        </div>

        {activeTab === "skins" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {skins.map((skin, index) => {
              const isPremium = skin.premium && !purchasedSkins.includes(index)
              const skinPrice = isPremium ? (index - 4) * 100 : 0

              return (
                <div
                  key={index}
                  className={`
                    p-4 rounded-lg cursor-pointer transition-all
                    ${selectedSkin === index ? "bg-primary/20 ring-2 ring-primary" : "bg-muted hover:bg-muted/80"}
                    ${isPremium ? "relative" : ""}
                  `}
                  onClick={() => handleSelectSkin(index)}
                >
                  <div className="w-16 h-16 mx-auto rounded-full mb-2" style={{ backgroundColor: skin.color }} />
                  <p className="text-center font-medium">{skin.name}</p>

                  {isPremium && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Coins className="h-3 w-3" />
                      <span>{skinPrice}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {effects.map((effect) => {
              const isPurchased = purchasedEffects.includes(effect.id)

              return (
                <div key={effect.id} className="flex justify-between items-center p-4 rounded-lg bg-muted">
                  <div>
                    <h3 className="font-bold">{effect.name}</h3>
                    <p className="text-sm text-muted-foreground">{effect.description}</p>
                  </div>

                  {isPurchased ? (
                    <Button variant="outline" disabled>
                      Owned
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handlePurchaseEffect(effect.id, effect.price)}
                      disabled={coins < effect.price}
                      className="flex items-center gap-2"
                    >
                      <Coins className="h-4 w-4" />
                      <span>{effect.price}</span>
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

