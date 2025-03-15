# 3D Agario Debugging System

This document explains how to use the debugging system for the 3D Agario game.

## Overview

The debugging system provides several tools to help diagnose and fix issues:

1. **File-based logging**: Game events, errors, and metrics are logged to text files
2. **Command-line log viewer**: Real-time monitoring of logs with filtering
3. **In-game metrics collection**: Performance and game state information is tracked
4. **Error handling and reporting**: Errors are captured and logged for diagnosis

## Getting Started

### Running the Game with Debugging

To start the game with debugging enabled, use the provided batch file:

```
.\debug-game.bat
```

This will:
- Start the game server in one window
- Open a real-time log viewer in a second window

### Viewing Logs

The log viewer supports several command-line options:

```
.\view-logs.bat [options]
```

Options:
- `-n, --lines <number>`: Number of lines to show (default: 50)
- `-c, --category <name>`: Filter logs by category (e.g., "Error", "Metrics")
- `-s, --search <text>`: Search for specific text in logs
- `-w, --watch`: Watch for new log entries in real-time
- `--clear`: Clear the log file

Examples:
```
.\view-logs.bat -n 100             # Show the last 100 log entries
.\view-logs.bat -c Error           # Show only error logs
.\view-logs.bat -s "Player"        # Show logs containing "Player"
.\view-logs.bat -w                 # Watch for new log entries
```

### Clearing Logs

To clear all logs and start fresh:

```
.\clear-logs.bat
```

## Log File Location

Logs are stored in the `debug-logs` directory at the root of the project:

- Main log file: `debug-logs/game-log.txt`

## Types of Information Logged

The system logs several types of information:

1. **System Events**: Game startup, shutdown, configuration changes
2. **Performance Metrics**: FPS, memory usage, render times
3. **Game State**: Player counts, positions, scores
4. **Errors**: JavaScript errors, network issues, game logic problems
5. **Collisions**: Object interactions and collision detection
6. **Network**: Connection status, latency, packet information

## API for Developers

### Log Events

```typescript
GameDebugger.logEvent('Category', 'Action', 'Details');
```

### Track Metrics

```typescript
GameDebugger.updateCounts(playerCount, foodCount);
GameDebugger.updateFPS(delta);
GameDebugger.trackCollision();
```

### Log Errors

```typescript
try {
  // Code that might fail
} catch (error) {
  GameDebugger.logError('ComponentName', error, contextObject);
}
```

## Troubleshooting

If you encounter issues with the debugging system:

1. Ensure the `debug-logs` directory exists
2. Check that Node.js is properly installed
3. Make sure the batch files have the correct paths
4. Run the scripts with the `.\` prefix in PowerShell

## Adding New Logging

To add new logging to a component:

1. Import the debugger: `import { GameDebugger } from "@/lib/game-debugger";`
2. Add log statements at appropriate points
3. Use meaningful category names for better filtering

## Performance Impact

The debugging system is designed to have minimal impact on game performance:
- Logging is throttled to prevent performance issues
- Heavy operations only run when actually viewing logs
- File operations are performed asynchronously when possible 