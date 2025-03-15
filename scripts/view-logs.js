#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    crimson: '\x1b[38m'
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    crimson: '\x1b[48m'
  }
};

// Configuration
const LOG_DIR = path.join(process.cwd(), 'debug-logs');
const LOG_FILE = path.join(LOG_DIR, 'game-log.txt');

// Parse command line arguments
const args = process.argv.slice(2);
let options = {
  lines: 50,
  category: null,
  search: null,
  watch: false,
  help: false,
  clear: false
};

// Process arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--lines' || arg === '-n') {
    options.lines = parseInt(args[++i]) || 50;
  } else if (arg === '--category' || arg === '-c') {
    options.category = args[++i];
  } else if (arg === '--search' || arg === '-s') {
    options.search = args[++i];
  } else if (arg === '--watch' || arg === '-w') {
    options.watch = true;
  } else if (arg === '--help' || arg === '-h') {
    options.help = true;
  } else if (arg === '--clear') {
    options.clear = true;
  }
}

// Show help
if (options.help) {
  console.log(`
${colors.bright}Game Debug Log Viewer${colors.reset}

Usage: node view-logs.js [options]

Options:
  -n, --lines <number>     Number of lines to show (default: 50)
  -c, --category <name>    Filter logs by category (e.g., "Error", "Metrics")
  -s, --search <text>      Search for specific text in logs
  -w, --watch              Watch for new log entries
  --clear                  Clear the log file
  -h, --help               Show this help message

Examples:
  node view-logs.js                    Show the last 50 log entries
  node view-logs.js -n 100             Show the last 100 log entries
  node view-logs.js -c Error           Show only error logs
  node view-logs.js -s "Player"        Show logs containing "Player"
  node view-logs.js -w                 Watch for new log entries
  node view-logs.js --clear            Clear the log file
  `);
  process.exit(0);
}

// Function to ensure the log directory and file exist
function ensureLogFileExists() {
  try {
    // Create the directory if it doesn't exist
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
      console.log(`${colors.fg.green}Created log directory: ${LOG_DIR}${colors.reset}`);
    }
    
    // Create an empty log file with timestamp if it doesn't exist
    if (!fs.existsSync(LOG_FILE)) {
      const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
      const initialEntry = `[${timestamp}] [System] Initialization: Log file created by view-logs.js`;
      fs.writeFileSync(LOG_FILE, initialEntry + '\n');
      console.log(`${colors.fg.green}Created new log file: ${LOG_FILE}${colors.reset}`);
    }
    
    return true;
  } catch (error) {
    console.error(`${colors.fg.red}Error ensuring log file exists: ${error.message}${colors.reset}`);
    return false;
  }
}

// Clear logs
if (options.clear) {
  try {
    // Ensure directory exists
    ensureLogFileExists();
    
    // Clear the log file with an initialization message
    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    const initialEntry = `[${timestamp}] [System] Clear: Log file cleared by view-logs.js`;
    fs.writeFileSync(LOG_FILE, initialEntry + '\n');
    
    console.log(`${colors.fg.green}✓ Log file cleared${colors.reset}`);
  } catch (error) {
    console.error(`${colors.fg.red}Error clearing logs: ${error.message}${colors.reset}`);
  }
  
  if (!options.watch) {
    process.exit(0);
  }
}

// Ensure log file exists before trying to read it
if (!ensureLogFileExists()) {
  console.error(`${colors.fg.red}Unable to access or create the log file. Check permissions.${colors.reset}`);
  process.exit(1);
}

// Function to colorize log entry
function colorizeLog(log) {
  // Extract category from log format [timestamp] [Category] Action: Details
  const categoryMatch = log.match(/\[\d{4}-\d{2}-\d{2}.*?\] \[(.*?)\]/);
  const category = categoryMatch ? categoryMatch[1] : '';
  
  // Color based on category
  let colorized = log;
  
  if (category.toLowerCase().includes('error')) {
    colorized = colors.fg.red + log + colors.reset;
  } else if (category.toLowerCase().includes('warning')) {
    colorized = colors.fg.yellow + log + colors.reset;
  } else if (category.toLowerCase().includes('metrics')) {
    colorized = colors.fg.cyan + log + colors.reset;
  } else if (category.toLowerCase().includes('performance')) {
    colorized = colors.fg.green + log + colors.reset;
  } else if (category.toLowerCase().includes('player')) {
    colorized = colors.fg.blue + log + colors.reset;
  } else if (category.toLowerCase().includes('collision')) {
    colorized = colors.fg.magenta + log + colors.reset;
  } else if (category.toLowerCase().includes('system')) {
    colorized = colors.bright + colors.fg.white + log + colors.reset;
  }
  
  // Highlight timestamps
  colorized = colorized.replace(/\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\]/g, (match) => {
    return colors.dim + match + colors.reset;
  });
  
  // Highlight action
  colorized = colorized.replace(/(\w+):/, (match) => {
    return colors.bright + match + colors.reset;
  });
  
  // If search term is specified, highlight it
  if (options.search) {
    const regex = new RegExp(`(${options.search})`, 'gi');
    colorized = colorized.replace(regex, `${colors.bg.yellow}${colors.fg.black}$1${colors.reset}`);
  }
  
  return colorized;
}

// Function to read and display logs
function displayLogs() {
  try {
    console.clear();
    
    // Make sure the log file exists
    ensureLogFileExists();
    
    let content = fs.readFileSync(LOG_FILE, 'utf-8');
    let lines = content.split('\n').filter(line => line.trim().length > 0);
    
    // Apply filters
    if (options.category) {
      const categoryPattern = new RegExp(`\\[${options.category}\\]`, 'i');
      lines = lines.filter(line => categoryPattern.test(line));
    }
    
    if (options.search) {
      lines = lines.filter(line => line.toLowerCase().includes(options.search.toLowerCase()));
    }
    
    // Get the last N lines
    const lastLines = lines.slice(-options.lines);
    
    if (lastLines.length === 0) {
      console.log(`${colors.fg.yellow}No matching log entries found.${colors.reset}`);
    } else {
      // Display header
      console.log(`${colors.bg.blue}${colors.fg.white}${colors.bright} Game Debug Logs ${colors.reset} ${colors.dim}Showing ${lastLines.length} of ${lines.length} entries${colors.reset}`);
      console.log(`${colors.dim}─`.repeat(process.stdout.columns || 80) + colors.reset);
      
      // Display logs
      lastLines.forEach(line => {
        console.log(colorizeLog(line));
      });
      
      // Display footer
      console.log(`${colors.dim}─`.repeat(process.stdout.columns || 80) + colors.reset);
      if (options.watch) {
        console.log(`${colors.bg.green}${colors.fg.black} WATCHING ${colors.reset} Press Ctrl+C to exit`);
      }
    }
  } catch (error) {
    console.error(`${colors.fg.red}Error reading logs: ${error.message}${colors.reset}`);
  }
}

// Watch for changes to the log file
if (options.watch) {
  let lastSize = 0;
  
  // Initial display
  displayLogs();
  
  // Set up interval to check for changes
  setInterval(() => {
    try {
      // Make sure file exists
      ensureLogFileExists();
      
      const stats = fs.statSync(LOG_FILE);
      if (stats.size !== lastSize) {
        lastSize = stats.size;
        displayLogs();
      }
    } catch (error) {
      console.error(`${colors.fg.red}Error watching logs: ${error.message}${colors.reset}`);
    }
  }, 1000);
  
  console.log(`Watching for changes to ${LOG_FILE}. Press Ctrl+C to exit.`);
} else {
  // One-time display
  displayLogs();
} 