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
  fileLogging: boolean;
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

// Log entry interface
interface LogEntry {
  timestamp: string;
  category: string;
  message: string;
  details?: string;
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
    captureStateChanges: true,
    fileLogging: true
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
  private sessionId: string;
  private pendingLogs: LogEntry[] = [];
  private lastLogSend: number = 0;
  private logSendThrottle: number = 5000; // 5 seconds between log sends
  private maxPendingLogs: number = 50; // Maximum number of pending logs before forcing a send
  
  constructor() {
    // Generate a unique session ID
    this.sessionId = `session-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    
    // Initialize session
    this.initSession();
    
    // Set up periodic flushing of logs
    if (typeof window !== 'undefined') {
      // Only set interval in browser environment
      setInterval(() => this.flushLogs(), 10000); // Flush logs every 10 seconds
      
      // Also flush logs when page is about to unload
      window.addEventListener('beforeunload', () => {
        this.flushLogs();
      });
    }
  }

  private initSession() {
    this.addLogEntry('System', 'Session started', `SessionID: ${this.sessionId}`);
    
    // Log browser info if available
    if (typeof navigator !== 'undefined') {
      const browserInfo = this.getBrowserInfo();
      this.addLogEntry('System', 'Browser info', JSON.stringify(browserInfo));
    }
  }

  private addLogEntry(category: string, message: string, details?: string) {
    if (!this.config.enabled || !this.config.fileLogging) return;
    
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      category,
      message,
      details
    };
    
    // Add to pending logs
    this.pendingLogs.push(logEntry);
    
    // Check if we should send logs now based on quantity or time
    const now = Date.now();
    if (this.pendingLogs.length >= this.maxPendingLogs || now - this.lastLogSend > this.logSendThrottle) {
      this.flushLogs();
    }
  }

  // Send logs to the server API
  public flushLogs(): void {
    if (!this.config.fileLogging || this.pendingLogs.length === 0) return;
    
    try {
      // Clone and clear pending logs before sending
      const logsToSend = [...this.pendingLogs];
      this.pendingLogs = [];
      this.lastLogSend = Date.now();
      
      // Don't use await here to make call non-blocking
      fetch('/api/debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          entries: logsToSend
        }),
      }).catch(error => {
        console.error('Failed to send logs to server:', error);
        // Put logs back in queue if send failed
        this.pendingLogs.unshift(...logsToSend);
      });
    } catch (error) {
      console.error('Error preparing logs for sending:', error);
    }
  }

  // Config management
  public getConfig(): DebugConfig {
    return { ...this.config };
  }

  public setConfig(newConfig: Partial<DebugConfig>): DebugConfig {
    this.config = { ...this.config, ...newConfig };
    
    // Log config changes
    this.logEvent('Config', 'Configuration changed', JSON.stringify(this.config));
    
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
    
    // Log significant FPS changes (avoid spamming the log)
    if (fps < 30 && fps % 5 === 0) {
      this.logEvent('Performance', 'Low FPS detected', `${fps} FPS`);
    }
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
    
    // Write to log file
    this.logEvent('Error', `Error in ${componentName}`, error.message, error.stack);
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
    
    // Log significant state changes
    this.logEvent('StateChange', `${component}.${property} changed`, 
                  `${JSON.stringify(oldValue)} -> ${JSON.stringify(newValue)}`);
  }

  // General event logging
  public logEvent(category: string, title: string, details?: string, extraData?: any): void {
    if (!this.config.enabled) return;
    
    // Add to log entries
    this.addLogEntry(category, title, details);
    
    // Also log to console if enabled
    if (this.config.logToConsole) {
      console.log(`[GameDebugger] ${category}: ${title}${details ? ` - ${details}` : ''}`);
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
    const report = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      config: this.getConfig(),
      metrics: this.getMetrics(),
      errors: [...this.errors],
      stateChanges: [...this.stateChanges],
      frameTimeAnalysis: this.analyzeFrameTimes(),
      browserInfo: this.getBrowserInfo()
    };
    
    // Log report generation
    this.logEvent('System', 'Debug report generated', 
                  `Generated at ${new Date().toLocaleString()} with ${this.errors.length} errors recorded`);
    
    return report;
  }

  // Save metrics snapshot to log file
  public logMetricsSnapshot(): void {
    if (!this.config.enabled) return;
    
    const metrics = this.getMetrics();
    
    let metricsDetails = `FPS: ${metrics.fps}, `;
    metricsDetails += `Frame Time: ${metrics.frameTime.toFixed(2)}ms (min: ${metrics.minFrameTime.toFixed(2)}ms, max: ${metrics.maxFrameTime.toFixed(2)}ms), `;
    metricsDetails += `Memory: ${Math.round(metrics.memoryUsage)}MB, `;
    metricsDetails += `Objects: ${metrics.playerCount} players, ${metrics.foodCount} food items`;
    if (metrics.ping) {
      metricsDetails += `, Network: ${metrics.ping}ms ping, ${metrics.packetsReceived} packets received`;
    }
    
    this.addLogEntry('Metrics', 'Performance Snapshot', metricsDetails);
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
    
    // Log data clear
    this.logEvent('System', 'Debug data cleared', 'All collected metrics and errors have been reset');
  }
  
  // Fetch the logs from the server
  public async fetchLogs(): Promise<string> {
    try {
      const response = await fetch('/api/debug');
      const data = await response.json();
      return data.logs || 'No logs available';
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      return `Error fetching logs: ${(error as Error).message}`;
    }
  }
}

// Export a singleton instance
export default new GameDebugger(); 