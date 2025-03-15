"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import GameDebugger, { type GameMetrics, type DebugConfig, type DebugError, type StateChange } from '@/lib/debug'

type DebugOverlayProps = {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  initialExpanded?: boolean
}

export function DebugOverlay({ 
  position = 'bottom-right', 
  initialExpanded = false 
}: DebugOverlayProps) {
  // State for metrics and UI state
  const [metrics, setMetrics] = useState<GameMetrics | null>(null)
  const [isExpanded, setIsExpanded] = useState<boolean>(initialExpanded)
  const [activeTab, setActiveTab] = useState<string>("metrics")
  const [isEnabled, setIsEnabled] = useState<boolean>(false)
  const [errors, setErrors] = useState<DebugError[]>([])
  const [stateChanges, setStateChanges] = useState<StateChange[]>([])

  // Update metrics at interval if debug is enabled
  useEffect(() => {
    if (!isEnabled) return

    // Enable debugger
    GameDebugger.setConfig({ 
      enabled: true,
      showOverlay: true,
      logToConsole: true,
      trackPerformance: true,
      captureStateChanges: true
    })

    // Subscribe to state changes
    const unsubscribeErrors = GameDebugger.subscribeToErrors((newErrors) => {
      setErrors(newErrors)
    })

    const unsubscribeState = GameDebugger.subscribeToStateChanges((changes) => {
      setStateChanges(changes)
    })

    // Update metrics every 500ms
    const interval = setInterval(() => {
      setMetrics(GameDebugger.getMetrics())
    }, 500)

    return () => {
      clearInterval(interval)
      unsubscribeErrors()
      unsubscribeState()
      
      // Only disable debugging if we're unmounting completely, not just collapsing
      if (!isExpanded) {
        GameDebugger.setConfig({ enabled: false })
      }
    }
  }, [isEnabled, isExpanded])

  // Toggle debug mode
  const toggleDebug = () => {
    if (isEnabled) {
      setIsEnabled(false)
      setIsExpanded(false)
      GameDebugger.setConfig({ enabled: false })
    } else {
      setIsEnabled(true)
      setIsExpanded(true)
    }
  }

  // Position classes
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  }

  // For debug report
  const handleDownloadReport = () => {
    const data = GameDebugger.generateDebugReport()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `game-debug-report-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // If debug not enabled, just show the toggle button
  if (!isEnabled) {
    return (
      <div className={`fixed ${positionClasses[position]} z-50`}>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleDebug}
          className="bg-black/50 hover:bg-black/70 text-white border-gray-700"
        >
          Enable Debug Mode
        </Button>
      </div>
    )
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50 w-80 transition-all duration-200 ease-in-out ${isExpanded ? 'opacity-95' : 'opacity-70 hover:opacity-95'}`}>
      <Card className="border-gray-800 bg-black/80 backdrop-blur-md text-white shadow-lg">
        <CardHeader className="py-2 px-4 flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-sm font-mono flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Game Debugger
            </CardTitle>
            <CardDescription className="text-xs text-gray-400">
              {isEnabled ? 'Monitoring game performance' : 'Debug disabled'}
            </CardDescription>
          </div>
          <div className="flex space-x-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              )}
            </Button>
          </div>
        </CardHeader>
        
        {isExpanded && (
          <>
            <Tabs defaultValue="metrics" value={activeTab} onValueChange={setActiveTab}>
              <div className="px-4 pt-0 pb-1">
                <TabsList className="w-full bg-gray-900">
                  <TabsTrigger value="metrics" className="text-xs">Metrics</TabsTrigger>
                  <TabsTrigger value="errors" className="text-xs">
                    Errors {errors.length > 0 && <span className="ml-1 bg-red-500 text-white rounded-full px-1.5 py-0.5 text-[10px]">{errors.length}</span>}
                  </TabsTrigger>
                  <TabsTrigger value="state" className="text-xs">State</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="metrics" className="m-0">
                <CardContent className="p-4 pt-2">
                  <div className="space-y-2 text-xs font-mono">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-900 p-2 rounded">
                        <div className="text-gray-400">FPS</div>
                        <div className={`text-lg ${metrics?.fps && metrics.fps > 30 ? 'text-green-400' : metrics?.fps && metrics.fps > 15 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {metrics?.fps || 0}
                        </div>
                      </div>
                      <div className="bg-gray-900 p-2 rounded">
                        <div className="text-gray-400">Memory</div>
                        <div className="text-lg text-blue-400">
                          {metrics?.memoryUsage ? `${Math.round(metrics.memoryUsage)}MB` : 'N/A'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-900 p-2 rounded">
                      <div className="text-gray-400">Frame Time</div>
                      <div className="flex items-center justify-between">
                        <div>
                          {metrics?.frameTime ? `${metrics.frameTime.toFixed(2)}ms` : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          min: {metrics?.minFrameTime?.toFixed(2) || 'N/A'}ms
                          max: {metrics?.maxFrameTime?.toFixed(2) || 'N/A'}ms
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-900 p-2 rounded">
                      <div className="text-gray-400">Objects</div>
                      <div className="grid grid-cols-2 gap-x-4">
                        <div className="flex justify-between">
                          <span>Food:</span>
                          <span>{metrics?.foodCount || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Players:</span>
                          <span>{metrics?.playerCount || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-900 p-2 rounded">
                      <div className="text-gray-400">Network</div>
                      <div className="grid grid-cols-2 gap-x-4">
                        <div className="flex justify-between">
                          <span>Ping:</span>
                          <span>{metrics?.ping || 'N/A'}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Packets:</span>
                          <span>{metrics?.packetsReceived || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </TabsContent>
              
              <TabsContent value="errors" className="m-0">
                <CardContent className="px-4 py-2">
                  <ScrollArea className="h-40">
                    {errors.length === 0 ? (
                      <div className="text-gray-500 text-xs italic">No errors recorded</div>
                    ) : (
                      <div className="space-y-2">
                        {errors.map((error, i) => (
                          <div key={i} className="bg-red-900/30 border border-red-900 rounded p-2 text-xs">
                            <div className="font-semibold mb-1">{error.component || 'Unknown'}: {error.message}</div>
                            {error.stack && (
                              <pre className="text-gray-400 text-[10px] whitespace-pre-wrap">{error.stack.split('\n').slice(0, 3).join('\n')}</pre>
                            )}
                            <div className="text-gray-500 mt-1 text-[10px]">{new Date(error.timestamp).toLocaleTimeString()}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </TabsContent>
              
              <TabsContent value="state" className="m-0">
                <CardContent className="px-4 py-2">
                  <ScrollArea className="h-40">
                    {stateChanges.length === 0 ? (
                      <div className="text-gray-500 text-xs italic">No state changes recorded</div>
                    ) : (
                      <div className="space-y-1">
                        {stateChanges.map((change, i) => (
                          <div key={i} className="bg-gray-900 rounded p-1.5 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="font-mono">{change.component}.{change.property}</span>
                              <span className="text-gray-500 text-[10px]">{new Date(change.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <div className="flex items-center mt-1 space-x-2">
                              <span className="text-red-400 text-[10px]">{typeof change.oldValue === 'object' ? JSON.stringify(change.oldValue) : String(change.oldValue)}</span>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                              </svg>
                              <span className="text-green-400 text-[10px]">{typeof change.newValue === 'object' ? JSON.stringify(change.newValue) : String(change.newValue)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </TabsContent>
            </Tabs>
            
            <CardFooter className="px-4 py-2 flex justify-between">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs h-7"
                onClick={() => {
                  console.log('Debug Report:', GameDebugger.generateDebugReport())
                }}
              >
                Log to Console
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs h-7"
                onClick={handleDownloadReport}
              >
                Download Report
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  )
} 