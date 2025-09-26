import { createClient } from '@supabase/supabase-js';
import { Readable } from 'stream';
import { env } from '../config/env.js';

// Initialize Supabase client with service role for server-side operations
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

export async function uploadObject(key: string, body: Buffer | Readable, contentType: string, size: number) {
  try {
    // Convert Buffer to Uint8Array for Supabase
    let fileData: Uint8Array;
    
    if (Buffer.isBuffer(body)) {
      fileData = new Uint8Array(body);
    } else {
      // Handle Readable stream
      const chunks: Buffer[] = [];
      for await (const chunk of body) {
        chunks.push(chunk);
      }
      fileData = new Uint8Array(Buffer.concat(chunks));
    }

    const { data, error } = await supabase.storage
      .from(env.SUPABASE_BUCKET)
      .upload(key, fileData, {
        contentType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Supabase upload error: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

export async function deleteObject(key: string) {
  try {
    const { error } = await supabase.storage
      .from(env.SUPABASE_BUCKET)
      .remove([key]);

    if (error) {
      throw new Error(`Supabase delete error: ${error.message}`);
    }
  } catch (error) {
    console.warn(`Failed to delete file ${key}:`, error);
  }
}

export async function getObjectStream(key: string) {
  try {
    const { data, error } = await supabase.storage
      .from(env.SUPABASE_BUCKET)
      .download(key);

    if (error) {
      throw new Error(`Supabase download error: ${error.message}`);
    }

    // Convert Blob to Readable stream
    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const { Readable } = await import('stream');
    const stream = Readable.from(buffer);

    // Try to detect content type from file extension
    const ext = key.split('.').pop()?.toLowerCase() || '';
    const contentTypeMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'pdf': 'application/pdf',
      'txt': 'text/plain',
      'mp4': 'video/mp4',
      'mp3': 'audio/mpeg',
      'zip': 'application/zip',
    };

    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    return { 
      stream, 
      contentType, 
      contentLength: buffer.length 
    };
  } catch (error) {
    throw new Error(`File not found: ${key}`);
  }
}

export async function headObject(key: string) {
  try {
    const { data, error } = await supabase.storage
      .from(env.SUPABASE_BUCKET)
      .list('', {
        search: key
      });

    if (error) {
      throw new Error(`Supabase head error: ${error.message}`);
    }

    const file = data.find(f => f.name === key);
    if (!file) {
      throw new Error(`File not found: ${key}`);
    }

    return {
      ContentLength: file.metadata?.size || 0,
      LastModified: new Date(file.updated_at),
    };
  } catch (error) {
    throw new Error(`File not found: ${key}`);
  }
}

export async function getSignedUrl(key: string, contentType: string, expiresIn: number = 3600) {
  try {
    const { data, error } = await supabase.storage
      .from(env.SUPABASE_BUCKET)
      .createSignedUrl(key, expiresIn);

    if (error) {
      throw new Error(`Supabase signed URL error: ${error.message}`);
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Signed URL error:', error);
    // Fallback to direct download URL
    return `${env.SUPABASE_URL}/storage/v1/object/public/${env.SUPABASE_BUCKET}/${key}`;
  }
}
