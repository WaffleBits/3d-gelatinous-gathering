import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';

const LOG_DIR = path.join(process.cwd(), 'debug-logs');
const LOG_FILE = path.join(LOG_DIR, 'game-log.txt');

// Ensure log directory exists
try {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
} catch (error) {
  console.error('Failed to create log directory:', error);
}

// Function to write log entry
function writeLog(logEntry: string): void {
  try {
    fs.appendFileSync(LOG_FILE, logEntry + '\n');
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

// Function to read logs
function readLogs(limit = 100, filter?: string): string[] {
  try {
    if (!fs.existsSync(LOG_FILE)) {
      return [];
    }
    
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
    if (fs.existsSync(LOG_FILE)) {
      fs.writeFileSync(LOG_FILE, '');
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing logs:', error);
    return NextResponse.json({ error: 'Failed to clear logs' }, { status: 500 });
  }
} 