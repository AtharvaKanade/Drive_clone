import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { prisma } from '../db/prisma';
import { requireAuth, AuthenticatedRequest } from '../middlewares/auth';
import { uploadObject, getObjectStream, deleteObject, getSignedUrl } from '../storage/s3';
import crypto from 'crypto';

const filesRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get user's files with pagination
filesRouter.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const folderId = req.query.folderId as string | undefined;
  
  const where: any = { ownerId: req.user!.id };
  if (folderId) {
    where.folderId = folderId;
  } else {
    where.folderId = null; // Root folder files
  }

  const [total, items] = await Promise.all([
    prisma.file.count({ where }),
    prisma.file.findMany({ 
      where, 
      orderBy: { createdAt: 'desc' }, 
      take: limit, 
      skip: (page - 1) * limit 
    }),
  ]);
  
  res.json({ 
    page, 
    limit, 
    total, 
    results: items.map(item => ({
      ...item,
      size: item.size.toString()
    }))
  });
});

// Upload file to S3/MinIO
const uploadSchema = z.object({ folderId: z.string().uuid().optional() });
filesRouter.post('/upload', requireAuth, upload.single('file'), async (req: AuthenticatedRequest, res) => {
  const parsed = uploadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { message: 'Invalid input' } });
  }
  
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: { message: 'Missing file' } });
  }

  try {
    // Generate unique key for S3 storage
    const ext = file.originalname.split('.').pop() ?? '';
    const key = `${req.user!.id}/${crypto.randomUUID()}.${ext}`;
    
    // Upload to S3/MinIO
    await uploadObject(key, file.buffer, file.mimetype, file.size);
    
    // Calculate file checksum
    const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');
    
    // Store file metadata in database
    const created = await prisma.file.create({
      data: {
        name: file.originalname,
        mimeType: file.mimetype,
        size: BigInt(file.size),
        key,
        bucket: process.env.S3_BUCKET as string,
        ownerId: req.user!.id,
        folderId: parsed.data.folderId ?? null,
        checksum,
      },
    });
    
    res.status(201).json({ 
      file: {
        ...created,
        size: created.size.toString()
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: { message: 'Upload failed' } });
  }
});

// Download file with signed URL
filesRouter.get('/:id/download', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    console.log('Download request for file:', req.params.id, 'by user:', req.user!.id);
    
    const file = await prisma.file.findFirst({ 
      where: { id: req.params.id, ownerId: req.user!.id } 
    });
    
    if (!file) {
      console.log('File not found:', req.params.id);
      return res.status(404).json({ error: { message: 'File not found' } });
    }
    
    console.log('File found:', file.name, 'key:', file.key);
    
    try {
      // Try to generate signed URL
      const signedUrl = await getSignedUrl(file.key, file.mimeType);
      console.log('Generated signed URL:', signedUrl);
      
      res.json({ 
        downloadUrl: signedUrl,
        file: {
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          size: file.size.toString()
        }
      });
    } catch (s3Error) {
      console.error('S3 signed URL error:', s3Error);
      // Fallback: stream file directly
      console.log('Streaming file directly as fallback');
      
      try {
        const { stream, contentType, contentLength } = await getObjectStream(file.key);
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
        if (contentLength) {
          res.setHeader('Content-Length', String(contentLength));
        }
        
        stream.pipe(res);
        return;
      } catch (streamError) {
        console.error('Stream error:', streamError);
        res.status(500).json({ error: { message: 'Download failed: ' + (streamError as any)?.message } });
      }
    }
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ error: { message: 'Download failed: ' + (error as any)?.message } });
  }
});

// Get file stream (for direct download)
filesRouter.get('/:id/stream', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const file = await prisma.file.findFirst({ 
      where: { id: req.params.id, ownerId: req.user!.id } 
    });
    
    if (!file) {
      return res.status(404).json({ error: { message: 'File not found' } });
    }
    
    const { stream, contentType, contentLength } = await getObjectStream(file.key);
    
    res.setHeader('Content-Type', contentType);
    if (contentLength) {
      res.setHeader('Content-Length', String(contentLength));
    }
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    
    stream.pipe(res);
  } catch (error) {
    console.error('File stream error:', error);
    res.status(500).json({ error: { message: 'Stream failed' } });
  }
});

// Get file preview URL (for images, videos, etc.)
filesRouter.get('/:id/preview', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const file = await prisma.file.findFirst({ 
      where: { id: req.params.id, ownerId: req.user!.id } 
    });
    
    if (!file) {
      return res.status(404).json({ error: { message: 'File not found' } });
    }
    
    // For small files, convert to data URL
    if (file.mimeType.startsWith('image/') && Number(file.size) < 5 * 1024 * 1024) { // 5MB limit
      try {
        const { stream } = await getObjectStream(file.key);
        const chunks: Buffer[] = [];
        
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const base64 = buffer.toString('base64');
          const dataUrl = `data:${file.mimeType};base64,${base64}`;
          res.json({ previewUrl: dataUrl });
        });
        stream.on('error', (err) => {
          console.error('Stream error:', err);
          res.status(500).json({ error: { message: 'Preview failed' } });
        });
        return;
      } catch (streamError) {
        console.error('Data URL conversion error:', streamError);
      }
    }
    
    // For larger files or other types, try signed URL
    try {
      const signedUrl = await getSignedUrl(file.key, file.mimeType);
      res.json({ previewUrl: signedUrl });
    } catch (s3Error) {
      console.error('S3 signed URL error:', s3Error);
      res.status(500).json({ error: { message: 'Preview not available' } });
    }
  } catch (error) {
    console.error('File preview error:', error);
    res.status(500).json({ error: { message: 'Preview failed' } });
  }
});

// Delete file
filesRouter.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const file = await prisma.file.findFirst({ 
      where: { id: req.params.id, ownerId: req.user!.id } 
    });
    
    if (!file) {
      return res.status(404).json({ error: { message: 'File not found' } });
    }
    
    // Delete from S3/MinIO
    await deleteObject(file.key);
    
    // Delete from database
    await prisma.file.delete({ where: { id: file.id } });
    
    res.status(204).send();
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ error: { message: 'Deletion failed' } });
  }
});

// Rename file
const renameSchema = z.object({ name: z.string().min(1) });
filesRouter.post('/:id/rename', requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = renameSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { message: 'Invalid input' } });
  }
  
  try {
    const file = await prisma.file.findFirst({ 
      where: { id: req.params.id, ownerId: req.user!.id } 
    });
    
    if (!file) {
      return res.status(404).json({ error: { message: 'File not found' } });
    }
    
    const updated = await prisma.file.update({
      where: { id: file.id },
      data: { name: parsed.data.name }
    });
    
    res.json({ file: updated });
  } catch (error) {
    console.error('File rename error:', error);
    res.status(500).json({ error: { message: 'Rename failed' } });
  }
});

// Get file info
filesRouter.get('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const file = await prisma.file.findFirst({ 
      where: { id: req.params.id, ownerId: req.user!.id } 
    });
    
    if (!file) {
      return res.status(404).json({ error: { message: 'File not found' } });
    }
    
    res.json({ 
      file: {
        ...file,
        size: file.size.toString()
      }
    });
  } catch (error) {
    console.error('File info error:', error);
    res.status(500).json({ error: { message: 'Failed to get file info' } });
  }
});

export { filesRouter };
