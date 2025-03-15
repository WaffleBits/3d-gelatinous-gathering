"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"
import { Loader } from "@/components/ui/loader"

// Dynamically import the Game component with no SSR to avoid Three.js SSR issues
const Game = dynamic(() => import("@/components/game/game"), {
  ssr: false,
  loading: () => <Loader />,
})

export default function Home() {
  return (
    <main className="w-full h-screen overflow-hidden bg-black">
      <Suspense fallback={<Loader />}>
        <Game />
      </Suspense>
    </main>
  )
}

