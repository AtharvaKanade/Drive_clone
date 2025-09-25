import 'dotenv/config';
import { S3Client, CreateBucketCommand, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import { env } from '../server/config/env.js';

const s3 = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT,
  credentials: { 
    accessKeyId: env.S3_ACCESS_KEY, 
    secretAccessKey: env.S3_SECRET_KEY 
  },
  forcePathStyle: true,
});

async function setupS3() {
  try {
    console.log('Setting up S3 bucket...');
    
    // Create bucket if it doesn't exist
    try {
      await s3.send(new CreateBucketCommand({ Bucket: env.S3_BUCKET }));
      console.log(`✅ Bucket '${env.S3_BUCKET}' created successfully`);
    } catch (error: any) {
      if (error.name === 'BucketAlreadyOwnedByYou' || error.name === 'BucketAlreadyExists') {
        console.log(`✅ Bucket '${env.S3_BUCKET}' already exists`);
      } else {
        throw error;
      }
    }
    
    // Set up CORS for web uploads
    const corsConfig = {
      Bucket: env.S3_BUCKET,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
            AllowedOrigins: ['*'],
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3000,
          },
        ],
      },
    };
    
    try {
      await s3.send(new PutBucketCorsCommand(corsConfig));
      console.log('✅ CORS configuration set successfully');
    } catch (error) {
      console.warn('⚠️  Could not set CORS configuration:', error);
    }
    
    console.log('🎉 S3 setup completed successfully!');
  } catch (error) {
    console.error('❌ S3 setup failed:', error);
    process.exit(1);
  }
}

setupS3();
