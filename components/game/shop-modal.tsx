"use client"

import { useState } from "react"
import { skins } from "@/lib/skins"
import { useGameStore } from "@/lib/game-store"
import { Button } from "@/components/ui/button"

// Mock Stripe for demo purposes
const mockStripe = {
  redirectToCheckout: (data: { sessionId: string }) => 
    Promise.resolve({ error: { message: "This is a demo" } })
}

interface ShopModalProps {
  onClose: () => void
  selectedSkin: number
  onSelectSkin: (skinId: number) => void
}

export function ShopModal({ onClose, selectedSkin, onSelectSkin }: ShopModalProps) {
  const { coins, addCoins, removeCoins } = useGameStore()
  const [selectedTab, setSelectedTab] = useState<"skins" | "coins">("skins")
  const [isLoading, setIsLoading] = useState(false)

  // Available coin packages
  const coinPackages = [
    { id: "coins_100", amount: 100, price: 0.99, color: "bg-blue-500" },
    { id: "coins_500", amount: 500, price: 3.99, color: "bg-purple-500" },
    { id: "coins_1000", amount: 1000, price: 7.99, color: "bg-yellow-500" },
    { id: "coins_5000", amount: 5000, price: 29.99, color: "bg-emerald-500" },
  ]

  // Skin purchase handler
  const handleBuySkin = (skinId: number, price: number) => {
    if (coins >= price) {
      removeCoins(price)
      onSelectSkin(skinId)
    }
  }

  // Stripe checkout handler
  const handleBuyCoins = async (packageId: string, amount: number) => {
    setIsLoading(true)
    try {
      // In a real implementation, this would call your backend API
      // which would create a Stripe checkout session
      console.log(`Processing purchase of ${amount} coins...`)
      
      // For demo purposes, we'll just add the coins directly
      // In production, this would redirect to Stripe Checkout
      setTimeout(() => {
        addCoins(amount)
        setIsLoading(false)
        alert(`Successfully purchased ${amount} coins!`)
      }, 1500)
      
      // Real implementation would look like:
      /*
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId })
      });
      
      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      await stripe?.redirectToCheckout({ sessionId });
      */
    } catch (error) {
      console.error('Error during checkout:', error)
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-black/90 backdrop-blur-xl p-6 rounded-xl border border-blue-500/30 shadow-2xl w-full max-w-2xl text-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Game Shop</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-yellow-500/20 px-3 py-1 rounded-full">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 text-yellow-400 mr-1" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              <span className="font-bold">{coins}</span>
            </div>
            <Button 
              onClick={onClose} 
              variant="ghost" 
              className="text-white/70 hover:text-white hover:bg-transparent"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-700 mb-6">
          <button
            className={`px-4 py-2 font-medium ${selectedTab === "skins" ? "text-blue-400 border-b-2 border-blue-400" : "text-gray-400"}`}
            onClick={() => setSelectedTab("skins")}
          >
            Skins
          </button>
          <button
            className={`px-4 py-2 font-medium ${selectedTab === "coins" ? "text-blue-400 border-b-2 border-blue-400" : "text-gray-400"}`}
            onClick={() => setSelectedTab("coins")}
          >
            Buy Coins
          </button>
        </div>
        
        {/* Skins Tab */}
        {selectedTab === "skins" && (
          <div className="grid grid-cols-3 gap-4">
            {skins.map((skin, index) => (
              <div 
                key={index}
                className={`relative p-4 rounded-lg border ${selectedSkin === index ? "border-blue-500 bg-blue-900/20" : "border-gray-700 bg-gray-800/50"}`}
              >
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-4 flex justify-center items-center h-32 mb-2">
                  <div 
                    className="w-16 h-16 rounded-full" 
                    style={{ backgroundColor: skin.color }}
                  />
                </div>
                <h3 className="font-medium text-center mb-1">{skin.name}</h3>
                <div className="flex justify-center items-center space-x-1 mb-3">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4 text-yellow-400" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                  <span>{index === 0 ? "Free" : ((index + 1) * 100)}</span>
                </div>
                {selectedSkin === index ? (
                  <Button disabled className="w-full bg-blue-600 text-white">
                    Selected
                  </Button>
                ) : index === 0 || coins >= ((index + 1) * 100) ? (
                  <Button 
                    onClick={() => handleBuySkin(index, index === 0 ? 0 : (index + 1) * 100)} 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {index === 0 ? "Select" : "Buy"}
                  </Button>
                ) : (
                  <Button disabled className="w-full bg-gray-700 text-gray-300">
                    Not Enough Coins
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Coins Tab */}
        {selectedTab === "coins" && (
          <div className="space-y-6">
            <p className="text-gray-300">Purchase coins to unlock exclusive skins and other in-game items.</p>
            
            <div className="grid grid-cols-2 gap-4">
              {coinPackages.map((pkg) => (
                <div key={pkg.id} className="bg-gray-800/70 rounded-lg p-4 border border-gray-700">
                  <div className={`${pkg.color} w-12 h-12 rounded-full mb-3 flex items-center justify-center`}>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-6 w-6 text-white" 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-1">{pkg.amount} Coins</h3>
                  <p className="text-green-400 font-medium mb-3">${pkg.price}</p>
                  <Button
                    onClick={() => handleBuyCoins(pkg.id, pkg.amount)}
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isLoading ? "Processing..." : "Buy Now"}
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 text-sm">
              <p className="text-yellow-400 font-medium mb-1">Demo Mode</p>
              <p className="text-gray-300">
                This is a demonstration. In a production environment, clicking "Buy Now" would redirect 
                to a secure Stripe payment page. For this demo, coins will be added instantly.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

