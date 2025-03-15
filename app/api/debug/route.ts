import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Ensure log directory exists
const LOG_DIR = path.resolve(process.cwd(), './debug-logs');
const LOG_FILE = path.join(LOG_DIR, 'game-log.txt');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.entries || !Array.isArray(data.entries)) {
      return NextResponse.json({ success: false, error: 'Invalid log format' }, { status: 400 });
    }
    
    // Format logs with timestamp
    const formattedLogs = data.entries.map((entry: any) => {
      const timestamp = entry.timestamp || new Date().toISOString();
      return `[${timestamp}] [${entry.category || 'Unknown'}] ${entry.message}\n${entry.details ? `    ${entry.details}\n` : ''}`;
    }).join('');
    
    // Append to log file
    fs.appendFileSync(LOG_FILE, formattedLogs);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error writing to debug log:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Check if the log file exists
    if (!fs.existsSync(LOG_FILE)) {
      return NextResponse.json({ logs: 'No logs available yet' });
    }
    
    // Read the last 50KB of logs (to avoid huge responses)
    const stats = fs.statSync(LOG_FILE);
    const fileSize = stats.size;
    const maxSize = 50 * 1024; // 50KB
    
    let buffer;
    let logContent;
    
    if (fileSize <= maxSize) {
      // If file is small enough, read it all
      logContent = fs.readFileSync(LOG_FILE, 'utf-8');
    } else {
      // Read only the last part of the file
      const fd = fs.openSync(LOG_FILE, 'r');
      buffer = Buffer.alloc(maxSize);
      fs.readSync(fd, buffer, 0, maxSize, fileSize - maxSize);
      fs.closeSync(fd);
      
      // Convert buffer to string and ensure we start at a new line
      logContent = buffer.toString('utf-8');
      const newLineIndex = logContent.indexOf('\n');
      if (newLineIndex !== -1) {
        logContent = logContent.substring(newLineIndex + 1);
      }
      
      // Add a note that this is truncated
      logContent = `[... older logs truncated ...]\n\n${logContent}`;
    }
    
    return NextResponse.json({ logs: logContent });
  } catch (error) {
    console.error('Error reading debug log:', error);
    return NextResponse.json({ logs: 'Error reading logs', error: (error as Error).message }, { status: 500 });
  }
} 