"use client"

import { useEffect, useState } from "react"

interface LoaderProps {
  progress?: number
  text?: string
}

export function Loader({ progress = 0, text = "Loading..." }: LoaderProps) {
  const [dots, setDots] = useState("")

  // Animate the loading dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return ""
        return prev + "."
      })
    }, 500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-black">
      <div className="w-64 h-64 relative mb-8">
        <div className="absolute w-full h-full rounded-full border-8 border-primary/20"></div>
        <div
          className="absolute w-full h-full rounded-full border-8 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"
          style={{ animationDuration: "1.5s" }}
        ></div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-4xl font-bold text-primary">{Math.round(progress)}%</div>
        </div>
      </div>

      <div className="text-xl text-white font-medium">
        {text}
        {dots}
      </div>

      <div className="mt-16 w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full bg-primary transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  )
}

