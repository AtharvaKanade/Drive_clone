import { S3Client, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { env } from '../config/env.js';

export const s3 = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT,
  credentials: { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY },
  forcePathStyle: true,
});

export async function uploadObject(key: string, body: Buffer | Readable, contentType: string, size: number) {
  const uploader = new Upload({
    client: s3,
    params: { Bucket: env.S3_BUCKET, Key: key, Body: body as any, ContentType: contentType, ContentLength: size },
  });
  await uploader.done();
}

export async function deleteObject(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
}

export async function getObjectStream(key: string) {
  const out = await s3.send(new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
  return { stream: out.Body as Readable, contentType: out.ContentType ?? 'application/octet-stream', contentLength: Number(out.ContentLength ?? 0) };
}

export async function headObject(key: string) {
  const out = await s3.send(new HeadObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
  return out;
}

export async function getSignedUrl(key: string, contentType: string, expiresIn: number = 3600) {
  const command = new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key });
  return await awsGetSignedUrl(s3, command, { expiresIn });
}


