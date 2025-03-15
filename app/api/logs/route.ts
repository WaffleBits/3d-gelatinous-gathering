import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';

const LOG_DIR = path.join(process.cwd(), 'debug-logs');
const LOG_FILE = path.join(LOG_DIR, 'game-log.txt');

// Function to ensure log directory and file exist
function ensureLogFileExists(): void {
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
      console.log(`Created log directory: ${LOG_DIR}`);
    }
    
    // Create empty log file if it doesn't exist
    if (!fs.existsSync(LOG_FILE)) {
      const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS');
      const initialEntry = `[${timestamp}] [System] Initialization: Log file created`;
      fs.writeFileSync(LOG_FILE, initialEntry + '\n');
      console.log(`Created log file: ${LOG_FILE}`);
    }
  } catch (error) {
    console.error('Failed to create log directory or file:', error);
  }
}

// Ensure log infrastructure exists when the API route is loaded
ensureLogFileExists();

// Function to write log entry
function writeLog(logEntry: string): void {
  try {
    // Ensure log directory and file exist before writing
    ensureLogFileExists();
    
    fs.appendFileSync(LOG_FILE, logEntry + '\n');
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

// Function to read logs
function readLogs(limit = 100, filter?: string): string[] {
  try {
    // Ensure log file exists before reading
    ensureLogFileExists();
    
    const content = fs.readFileSync(LOG_FILE, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    
    let filteredLines = lines;
    if (filter) {
      filteredLines = lines.filter(line => line.toLowerCase().includes(filter.toLowerCase()));
    }
    
    return filteredLines.slice(-limit);
  } catch (error) {
    console.error('Failed to read logs:', error);
    return [];
  }
}

// POST handler - store logs
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.entry) {
      return NextResponse.json({ error: 'Missing log entry' }, { status: 400 });
    }
    
    // Format log entry with timestamp
    const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS');
    const category = data.category || 'Client';
    const action = data.action || 'Log';
    
    const logEntry = `[${timestamp}] [${category}] ${action}: ${data.entry}`;
    writeLog(logEntry);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing log:', error);
    return NextResponse.json({ error: 'Failed to process log' }, { status: 500 });
  }
}

// GET handler - retrieve logs
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const filter = searchParams.get('filter') || undefined;
    
    const logs = readLogs(limit, filter);
    
    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error retrieving logs:', error);
    return NextResponse.json({ error: 'Failed to retrieve logs' }, { status: 500 });
  }
}

// DELETE handler - clear logs
export async function DELETE(request: NextRequest) {
  try {
    ensureLogFileExists();
    
    // Clear log file by writing an empty file with initialization message
    const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS');
    const initialEntry = `[${timestamp}] [System] Clear: Log file cleared`;
    fs.writeFileSync(LOG_FILE, initialEntry + '\n');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing logs:', error);
    return NextResponse.json({ error: 'Failed to clear logs' }, { status: 500 });
  }
} 