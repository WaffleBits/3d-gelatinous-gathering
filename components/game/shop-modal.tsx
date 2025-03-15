"use client"

import { Button } from "@/components/ui/button"
import { skins } from "@/lib/skins"
import { useState } from "react"
import { X } from "lucide-react"

interface ShopModalProps {
  onClose: () => void
  selectedSkin: number
  onSelectSkin: (id: number) => void
}

export function ShopModal({ onClose, selectedSkin, onSelectSkin }: ShopModalProps) {
  const [showPremium, setShowPremium] = useState(false)

  const handleSelectSkin = (id: number) => {
    // If it's a premium skin, show premium message
    if (skins[id].premium && !showPremium) {
      setShowPremium(true)
      return
    }

    onSelectSkin(id)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-card p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Skin Shop</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {showPremium ? (
          <div className="text-center p-6">
            <h3 className="text-xl font-bold mb-4">Premium Skins</h3>
            <p className="mb-4">
              Premium skins are available for purchase. Support the game and stand out with unique skins!
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => setShowPremium(false)}>
                Back to Shop
              </Button>
              <Button onClick={() => alert("This would open a payment modal in the full game")}>
                Purchase ($4.99)
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {skins.map((skin, index) => (
              <div
                key={index}
                className={`
                  p-4 rounded-lg cursor-pointer transition-all
                  ${selectedSkin === index ? "bg-primary/20 ring-2 ring-primary" : "bg-muted hover:bg-muted/80"}
                  ${skin.premium ? "relative" : ""}
                `}
                onClick={() => handleSelectSkin(index)}
              >
                <div className="w-16 h-16 mx-auto rounded-full mb-2" style={{ backgroundColor: skin.color }} />
                <p className="text-center font-medium">{skin.name}</p>

                {skin.premium && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs px-1 rounded">PRO</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

