"use client";

// Debugging utility for 3D Gelatinous Gathering
// This file provides tools to monitor and debug the game state and performance

// Debug configuration interface
export interface DebugConfig {
  enabled: boolean;
  showOverlay: boolean;
  logToConsole: boolean;
  trackPerformance: boolean;
  verboseErrors: boolean;
  captureStateChanges: boolean;
}

// Game metrics interface
export interface GameMetrics {
  fps: number;
  frameTime: number;
  minFrameTime: number;
  maxFrameTime: number;
  memoryUsage: number;
  playerCount: number;
  foodCount: number;
  ping: number | null;
  packetsReceived: number;
  lastUpdate: number;
}

// Debug error interface
export interface DebugError {
  message: string;
  component?: string;
  stack?: string;
  timestamp: number;
}

// State change interface
export interface StateChange {
  component: string;
  property: string;
  oldValue: any;
  newValue: any;
  timestamp: number;
}

// Event subscriber type
type Subscriber<T> = (data: T) => void;

// GameDebugger singleton
class GameDebugger {
  private config: DebugConfig = {
    enabled: false,
    showOverlay: false,
    logToConsole: true,
    trackPerformance: true,
    verboseErrors: true,
    captureStateChanges: true
  };

  private metrics: GameMetrics = {
    fps: 0,
    frameTime: 0,
    minFrameTime: Infinity,
    maxFrameTime: 0,
    memoryUsage: 0,
    playerCount: 0,
    foodCount: 0,
    ping: null,
    packetsReceived: 0,
    lastUpdate: Date.now()
  };

  private errors: DebugError[] = [];
  private stateChanges: StateChange[] = [];
  private frameTimeHistory: number[] = [];
  private errorSubscribers: Subscriber<DebugError[]>[] = [];
  private stateSubscribers: Subscriber<StateChange[]>[] = [];

  // Config management
  public getConfig(): DebugConfig {
    return { ...this.config };
  }

  public setConfig(newConfig: Partial<DebugConfig>): DebugConfig {
    this.config = { ...this.config, ...newConfig };
    return this.config;
  }

  // Metrics management
  public getMetrics(): GameMetrics {
    // Update memory usage when metrics are requested
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      if (memory && memory.usedJSHeapSize) {
        this.metrics.memoryUsage = memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
      }
    }
    
    this.metrics.lastUpdate = Date.now();
    return { ...this.metrics };
  }

  // FPS tracking
  public updateFPS(fps: number): void {
    if (!this.config.enabled || !this.config.trackPerformance) return;
    
    this.metrics.fps = fps;
  }

  // Frame time tracking
  public updateFrameTime(frameTime: number): void {
    if (!this.config.enabled || !this.config.trackPerformance) return;
    
    this.metrics.frameTime = frameTime;
    this.metrics.minFrameTime = Math.min(this.metrics.minFrameTime, frameTime);
    this.metrics.maxFrameTime = Math.max(this.metrics.maxFrameTime, frameTime);
    
    // Keep a history of frame times for analysis
    this.frameTimeHistory.push(frameTime);
    if (this.frameTimeHistory.length > 100) {
      this.frameTimeHistory.shift();
    }
  }

  // Update object counts
  public updateCounts(playerCount: number, foodCount: number): void {
    if (!this.config.enabled) return;
    
    this.metrics.playerCount = playerCount;
    this.metrics.foodCount = foodCount;
  }

  // Network metrics
  public updateNetworkStats(ping: number, packetsReceived: number): void {
    if (!this.config.enabled) return;
    
    this.metrics.ping = ping;
    this.metrics.packetsReceived = packetsReceived;
  }

  // Error handling
  public handleGameError(error: Error, component?: string, errorInfo?: { componentStack?: string }): void {
    if (!this.config.enabled) return;
    
    const componentName = component || (errorInfo?.componentStack ? 'React Component' : 'Unknown');
    
    const debugError: DebugError = {
      message: error.message,
      component: componentName,
      stack: this.config.verboseErrors ? error.stack : undefined,
      timestamp: Date.now()
    };
    
    this.errors.push(debugError);
    
    // Notify subscribers
    this.errorSubscribers.forEach(subscriber => subscriber([...this.errors]));
    
    // Log to console if enabled
    if (this.config.logToConsole) {
      console.error(`[GameDebugger] Error in ${componentName}:`, error);
    }
  }

  // State change tracking
  public trackStateChange(component: string, property: string, oldValue: any, newValue: any): void {
    if (!this.config.enabled || !this.config.captureStateChanges) return;
    
    const stateChange: StateChange = {
      component,
      property,
      oldValue,
      newValue,
      timestamp: Date.now()
    };
    
    this.stateChanges.push(stateChange);
    
    // Keep only the last 50 state changes
    if (this.stateChanges.length > 50) {
      this.stateChanges.shift();
    }
    
    // Notify subscribers
    this.stateSubscribers.forEach(subscriber => subscriber([...this.stateChanges]));
    
    // Log to console if enabled
    if (this.config.logToConsole) {
      console.log(`[GameDebugger] State change in ${component}.${property}:`, oldValue, '->', newValue);
    }
  }

  // Event subscription for errors
  public subscribeToErrors(subscriber: Subscriber<DebugError[]>): () => void {
    this.errorSubscribers.push(subscriber);
    // Initial call with current data
    subscriber([...this.errors]);
    
    // Return unsubscribe function
    return () => {
      this.errorSubscribers = this.errorSubscribers.filter(s => s !== subscriber);
    };
  }

  // Event subscription for state changes
  public subscribeToStateChanges(subscriber: Subscriber<StateChange[]>): () => void {
    this.stateSubscribers.push(subscriber);
    // Initial call with current data
    subscriber([...this.stateChanges]);
    
    // Return unsubscribe function
    return () => {
      this.stateSubscribers = this.stateSubscribers.filter(s => s !== subscriber);
    };
  }

  // Generate a complete debug report
  public generateDebugReport(): any {
    return {
      timestamp: new Date().toISOString(),
      config: this.getConfig(),
      metrics: this.getMetrics(),
      errors: [...this.errors],
      stateChanges: [...this.stateChanges],
      frameTimeAnalysis: this.analyzeFrameTimes(),
      browserInfo: this.getBrowserInfo()
    };
  }

  // Analyze frame time performance
  private analyzeFrameTimes(): any {
    if (this.frameTimeHistory.length === 0) {
      return { 
        available: false 
      };
    }
    
    const sorted = [...this.frameTimeHistory].sort((a, b) => a - b);
    const total = this.frameTimeHistory.reduce((sum, time) => sum + time, 0);
    
    return {
      available: true,
      average: total / this.frameTimeHistory.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      jitter: this.calculateJitter(),
      sampleCount: this.frameTimeHistory.length
    };
  }

  // Calculate frame time jitter (variation)
  private calculateJitter(): number {
    if (this.frameTimeHistory.length < 2) return 0;
    
    let jitterSum = 0;
    for (let i = 1; i < this.frameTimeHistory.length; i++) {
      jitterSum += Math.abs(this.frameTimeHistory[i] - this.frameTimeHistory[i-1]);
    }
    
    return jitterSum / (this.frameTimeHistory.length - 1);
  }

  // Get browser/environment info
  private getBrowserInfo(): any {
    const info: any = {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Not available',
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'Not available',
      screenSize: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'Not available',
      devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 'Not available'
    };
    
    // Try to detect WebGL capabilities
    if (typeof document !== 'undefined') {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          // Type assertion to WebGLRenderingContext to fix linter error
          const webGLContext = gl as WebGLRenderingContext;
          const debugInfo = webGLContext.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            info.gpuVendor = webGLContext.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            info.gpuRenderer = webGLContext.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          }
        }
      } catch (e) {
        info.webglDetectionError = (e as Error).message;
      }
    }
    
    return info;
  }

  // Clear collected data
  public clearData(): void {
    this.errors = [];
    this.stateChanges = [];
    this.frameTimeHistory = [];
    
    // Notify subscribers
    this.errorSubscribers.forEach(subscriber => subscriber([]));
    this.stateSubscribers.forEach(subscriber => subscriber([]));
  }
}

// Export a singleton instance
export default new GameDebugger(); 