import { promises as fs } from 'fs';
import { createReadStream } from 'fs';
import path from 'path';
import { Readable } from 'stream';
import crypto from 'crypto';

// Create uploads directory if it doesn't exist
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

async function ensureUploadsDir() {
  try {
    await fs.access(UPLOADS_DIR);
  } catch {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  }
}

// Initialize uploads directory
ensureUploadsDir().catch(console.error);

export async function uploadObject(key: string, body: Buffer | Readable, contentType: string, size: number) {
  await ensureUploadsDir();
  
  const filePath = path.join(UPLOADS_DIR, key);
  const dir = path.dirname(filePath);
  
  // Ensure directory exists
  await fs.mkdir(dir, { recursive: true });
  
  // Write file
  if (Buffer.isBuffer(body)) {
    await fs.writeFile(filePath, body);
  } else {
    // Handle Readable stream
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(chunk);
    }
    await fs.writeFile(filePath, Buffer.concat(chunks));
  }
}

export async function deleteObject(key: string) {
  const filePath = path.join(UPLOADS_DIR, key);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // File might not exist, ignore error
    console.warn(`Failed to delete file ${key}:`, error);
  }
}

export async function getObjectStream(key: string) {
  const filePath = path.join(UPLOADS_DIR, key);
  
  try {
    const stats = await fs.stat(filePath);
    const stream = createReadStream(filePath);
    
    // Try to detect content type from file extension
    const ext = path.extname(key).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
      '.zip': 'application/zip',
    };
    
    const contentType = contentTypeMap[ext] || 'application/octet-stream';
    
    return { 
      stream, 
      contentType, 
      contentLength: stats.size 
    };
  } catch (error) {
    throw new Error(`File not found: ${key}`);
  }
}

export async function headObject(key: string) {
  const filePath = path.join(UPLOADS_DIR, key);
  
  try {
    const stats = await fs.stat(filePath);
    return {
      ContentLength: stats.size,
      LastModified: stats.mtime,
    };
  } catch (error) {
    throw new Error(`File not found: ${key}`);
  }
}

export async function getSignedUrl(key: string, contentType: string, expiresIn: number = 3600) {
  // For local storage, we'll return a direct download URL
  // In a real app, you might want to implement proper signed URLs
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/api/files/${key}/download`;
}
