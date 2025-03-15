"use client"

import { Button } from "./ui/Button"
import { X } from "lucide-react"
import { useState, useEffect } from "react"
import { Slider } from "./ui/Slider"
import { Switch } from "./ui/Switch"
import { Label } from "./ui/Label"

interface SettingsModalProps {
  onClose: () => void
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [musicVolume, setMusicVolume] = useState(50)
  const [sfxVolume, setSfxVolume] = useState(70)
  const [showFps, setShowFps] = useState(false)
  const [highQuality, setHighQuality] = useState(true)

  // Load settings from localStorage
  useEffect(() => {
    const savedMusicVolume = localStorage.getItem("musicVolume")
    if (savedMusicVolume) setMusicVolume(Number.parseInt(savedMusicVolume))

    const savedSfxVolume = localStorage.getItem("sfxVolume")
    if (savedSfxVolume) setSfxVolume(Number.parseInt(savedSfxVolume))

    const savedShowFps = localStorage.getItem("showFps")
    if (savedShowFps) setShowFps(savedShowFps === "true")

    const savedHighQuality = localStorage.getItem("highQuality")
    if (savedHighQuality) setHighQuality(savedHighQuality === "true")
  }, [])

  // Save settings to localStorage
  const saveSettings = () => {
    localStorage.setItem("musicVolume", musicVolume.toString())
    localStorage.setItem("sfxVolume", sfxVolume.toString())
    localStorage.setItem("showFps", showFps.toString())
    localStorage.setItem("highQuality", highQuality.toString())
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Settings</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Music Volume</Label>
            <Slider value={[musicVolume]} onValueChange={(values) => setMusicVolume(values[0])} max={100} step={1} />
          </div>

          <div className="space-y-2">
            <Label>Sound Effects Volume</Label>
            <Slider value={[sfxVolume]} onValueChange={(values) => setSfxVolume(values[0])} max={100} step={1} />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-fps">Show FPS Counter</Label>
            <Switch id="show-fps" checked={showFps} onCheckedChange={setShowFps} />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="high-quality">High Quality Graphics</Label>
            <Switch id="high-quality" checked={highQuality} onCheckedChange={setHighQuality} />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={saveSettings}>Save</Button>
        </div>
      </div>
    </div>
  )
}

