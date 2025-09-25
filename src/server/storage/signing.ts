import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from './s3.js';
import { env } from '../config/env.js';

export async function getSignedDownloadUrl(key: string, expiresInSeconds: number) {
  const command = new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key });
  return getSignedUrl(s3 as any, command, { expiresIn: expiresInSeconds });
}


