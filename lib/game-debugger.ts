"use client";

import { format } from 'date-fns';

// Game metrics interface
interface GameMetrics {
  timestamp: string;
  fps?: number;
  entityCount?: number;
  foodCount?: number;
  memoryUsage?: number;
  renderTime?: number;
  collisionChecks?: number;
  playerPosition?: { x: number; y: number; z: number };
  playerSize?: number;
  playerScore?: number;
}

// Global state for tracking
class GameDebuggerClass {
  private metrics: GameMetrics = {
    timestamp: new Date().toISOString(),
  };
  
  private entityCount: number = 0;
  private foodCount: number = 0;
  private frameTime: number = 0;
  private collisionCount: number = 0;
  
  // Browser-side storage for logs when server logging isn't available
  private browserLogs: string[] = [];
  private maxBrowserLogs: number = 1000;
  
  // Track errors to prevent duplicate logging
  private recentErrors = new Set<string>();
  
  constructor() {
    // Initialize metrics
    this.resetMetrics();
    
    // Log startup
    this.logEvent('System', 'Startup', 'Game debugger initialized');
    
    // Set up global error handlers
    if (typeof window !== 'undefined') {
      this.setupGlobalErrorHandlers();
    }
  }
  
  /**
   * Set up global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(
        'UnhandledPromiseRejection', 
        new Error(event.reason?.message || 'Unknown promise rejection'), 
        event.reason
      );
    });
    
    // Global errors
    window.addEventListener('error', (event) => {
      this.logError(
        'GlobalError', 
        new Error(event.message), 
        { 
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      );
      
      // Prevent default browser error handling
      event.preventDefault();
    });
    
    // Console error override to capture all console.error calls
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Call original console.error
      originalConsoleError.apply(console, args);
      
      // Log to our system
      const errorMessage = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      this.logEvent('ConsoleError', 'Error', errorMessage);
    };
  }
  
  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.metrics = {
      timestamp: new Date().toISOString(),
      fps: 0,
      entityCount: 0,
      foodCount: 0,
      memoryUsage: 0,
      renderTime: 0,
      collisionChecks: 0,
    };
    this.frameTime = performance.now();
  }
  
  /**
   * Update entity counts
   */
  updateCounts(entities: number, foods: number): void {
    this.entityCount = entities;
    this.foodCount = foods;
    
    // Update metrics
    this.metrics.entityCount = entities;
    this.metrics.foodCount = foods;
  }
  
  /**
   * Update player metrics
   */
  updatePlayerMetrics(position: { x: number; y: number; z: number }, size: number, score: number): void {
    this.metrics.playerPosition = position;
    this.metrics.playerSize = size;
    this.metrics.playerScore = score;
  }
  
  /**
   * Update FPS calculation
   */
  updateFPS(delta: number): void {
    if (delta > 0) {
      this.metrics.fps = Math.round(1 / delta);
    }
  }
  
  /**
   * Track a collision check
   */
  trackCollision(): void {
    this.collisionCount++;
    this.metrics.collisionChecks = this.collisionCount;
  }
  
  /**
   * Track render time
   */
  trackRenderTime(): void {
    const now = performance.now();
    this.metrics.renderTime = now - this.frameTime;
    this.frameTime = now;
  }
  
  /**
   * Log an event to the file and console
   */
  logEvent(category: string, action: string, details: string): void {
    const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS');
    const logEntry = `[${timestamp}] [${category}] ${action}: ${details}`;
    
    // Log to console
    console.log(logEntry);
    
    // Store in browser logs
    this.browserLogs.push(logEntry);
    
    // Trim logs if they get too large
    if (this.browserLogs.length > this.maxBrowserLogs) {
      this.browserLogs = this.browserLogs.slice(-this.maxBrowserLogs);
    }
    
    // Save to localStorage for persistence
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('game-debug-logs', JSON.stringify(this.browserLogs.slice(-100)));
      }
    } catch (e) {
      console.warn('Failed to save logs to localStorage:', e);
    }
    
    // Send to server API if possible
    this.sendLogToServer(category, action, details).catch(e => {
      console.warn('Failed to send log to server:', e);
    });
  }
  
  /**
   * Send log to server API
   */
  private async sendLogToServer(category: string, action: string, entry: string): Promise<void> {
    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          action,
          entry,
        }),
      });
      
      if (!response.ok) {
        console.warn('Failed to send log to server:', await response.text());
      }
    } catch (error) {
      // Silently fail - we don't want logging failures to break the game
    }
  }
  
  /**
   * Log an error
   */
  logError(source: string, error: Error, context?: any): void {
    // Create error signature to deduplicate
    const errorSignature = `${source}:${error.message}`;
    
    // Check if we've logged this error recently to prevent spam
    if (this.recentErrors.has(errorSignature)) {
      return;
    }
    
    // Add to recent errors
    this.recentErrors.add(errorSignature);
    
    // Remove from set after a delay
    setTimeout(() => {
      this.recentErrors.delete(errorSignature);
    }, 10000); // 10 seconds
    
    const details = `${error.message}\nStack: ${error.stack}\nContext: ${JSON.stringify(context || {})}`;
    this.logEvent('Error', source, details);
  }
  
  /**
   * Log metrics snapshot
   */
  logMetricsSnapshot(): void {
    // Update timestamp
    this.metrics.timestamp = new Date().toISOString();
    
    // Add memory usage if available
    if (typeof window !== 'undefined' && (performance as any).memory) {
      this.metrics.memoryUsage = Math.round(
        (performance as any).memory.usedJSHeapSize / (1024 * 1024)
      );
    }
    
    // Log metrics
    this.logEvent(
      'Metrics',
      'Snapshot',
      JSON.stringify(this.metrics, null, 0)
    );
    
    // Reset collision counter after logging
    this.collisionCount = 0;
  }
  
  /**
   * Get browser logs
   */
  getBrowserLogs(): string[] {
    return this.browserLogs;
  }
  
  /**
   * Download logs as a file (client-side only)
   */
  downloadLogs(): void {
    if (typeof window === 'undefined') return;
    
    const blob = new Blob([this.browserLogs.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-debug-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Create singleton instance
export const GameDebugger = new GameDebuggerClass(); 