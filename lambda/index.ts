import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { S3Event } from 'aws-lambda';
import * as csv from 'fast-csv';

const s3Client = new S3Client({}); // Uses default configuration
const bucketName = process.env.BUCKET_NAME || '';
const metadataFolder = process.env.METADATA_FOLDER || '';

if (!bucketName || !metadataFolder) {
  throw new Error('Environment variables BUCKET_NAME and METADATA_FOLDER must be set.');
}

export const handler = async (event: S3Event): Promise<void> => {
  try {
    console.log('Received S3 Event:', JSON.stringify(event, null, 2));

    for (const record of event.Records) {
      const s3ObjectKey = record.s3.object.key;
      const bucket = record.s3.bucket.name;

      console.log(`Processing file: ${s3ObjectKey} from bucket: ${bucket}`);

      // Extract file name from the S3 key
      const fileName = s3ObjectKey.split('/').pop(); // Get the last part of the key
      if (!fileName) {
        console.error(`Could not extract file name from key: ${s3ObjectKey}`);
        continue;
      }

      // Extract client ID (assumes the second part of the path is the client ID)
      const filePathParts = s3ObjectKey.split('/');
      const clientId = filePathParts.length > 1 ? filePathParts[1] : 'unknown_client';

      const metadata = {
        fileName, // Include the actual file name
        uploadTimestamp: new Date().toISOString(),
        clientId,
      };

      console.log('Extracted metadata:', metadata);

      // Generate CSV content
      const csvData = [['fileName', 'uploadTimestamp', 'clientId'], [metadata.fileName, metadata.uploadTimestamp, metadata.clientId]];
      const csvBuffer: Buffer = await new Promise((resolve, reject) => {
        const buffers: Buffer[] = [];
        csv.write(csvData, { headers: true })
          .on('data', (chunk: Buffer) => buffers.push(chunk))
          .on('end', () => resolve(Buffer.concat(buffers)))
          .on('error', reject);
      });

      // Generate metadata file name
      const metadataFileName = `${metadataFolder}${clientId}/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(new Date().getDate()).padStart(2, '0')}/metadata-${Date.now()}.csv`;

      // Upload CSV to the metadata folder
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: metadataFileName,
        Body: csvBuffer,
        ContentType: 'text/csv',
      });

      await s3Client.send(command);

      console.log(`Metadata written to ${metadataFileName}`);
    }

    console.log('Metadata processed successfully.');
  } catch (error) {
    console.error('Error processing S3 event:', error);
    throw new Error('Failed to process S3 event');
  }
};