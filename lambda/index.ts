import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { S3Event } from 'aws-lambda';
import { Readable } from 'stream';
import * as csvParser from 'fast-csv';
import * as path from 'path';

const s3 = new S3Client({});
const BUCKET_NAME = process.env.BUCKET_NAME || '';
const METADATA_FILE_KEY = 'metadata/metadata.csv'; // Fixed location for metadata.csv

/**
 * Helper function to read the content of an S3 object.
 */
async function getObject(bucket: string, key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await s3.send(command);
  const stream = response.Body as Readable;

  return new Promise((resolve, reject) => {
    let data = '';
    stream.on('data', chunk => (data += chunk));
    stream.on('end', () => resolve(data));
    stream.on('error', err => reject(err));
  });
}

/**
 * Helper function to upload content to S3.
 */
async function putObject(bucket: string, key: string, data: string): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: data,
    ContentType: 'text/csv',
  });
  await s3.send(command);
}

/**
 * AWS Lambda handler to process S3 events.
 */
export const handler = async (event: S3Event): Promise<void> => {
  for (const record of event.Records) {
    const audioFileKey = record.s3.object.key;

    // Metadata extraction: filename, upload timestamp, and client ID
    const newMetadata = {
      FileName: path.basename(audioFileKey), // Extract filename
      UploadTimestamp: new Date().toISOString(), // Upload timestamp
      ClientID: getClientID(audioFileKey), // Extract client ID from the file path
    };

    let rows: { FileName: string; UploadTimestamp: string; ClientID: string }[] = [];
    const headers = ['FileName', 'UploadTimestamp', 'ClientID'];

    // Fetch existing metadata.csv file, if it exists
    try {
      const metadataCsv = await getObject(BUCKET_NAME, METADATA_FILE_KEY);

      // Parse existing CSV content
      await new Promise((resolve, reject) => {
        csvParser
          .parseString(metadataCsv, { headers: true })
          .on('data', row => {
            // Only add valid rows
            if (row.FileName && row.UploadTimestamp && row.ClientID) {
              rows.push(row);
            }
          })
          .on('end', resolve)
          .on('error', reject);
      });
    } catch (err: any) {
      if (err.name === 'NoSuchKey') {
        console.log('metadata.csv does not exist yet. Creating a new file.');
      } else {
        console.error('Error fetching metadata.csv:', err);
        throw err;
      }
    }

    // Check for duplicates and append new metadata
    const isDuplicate = rows.some(
      row =>
        row.FileName === newMetadata.FileName &&
        row.UploadTimestamp === newMetadata.UploadTimestamp &&
        row.ClientID === newMetadata.ClientID
    );

    if (!isDuplicate) {
      rows.push(newMetadata);
    }

    // Convert rows to CSV format with fixed headers
    const csvStream = csvParser.format({ headers });
    const output: string[] = [];
    csvStream.on('data', chunk => output.push(chunk.toString()));
    rows.forEach(row => csvStream.write(row));
    csvStream.end();

    // Upload the updated metadata.csv to S3
    const updatedCsv = output.join('');
    await putObject(BUCKET_NAME, METADATA_FILE_KEY, updatedCsv);

    console.log(`Metadata updated for file: ${audioFileKey}`);
  }
};

/**
 * Helper function to extract client ID from the file path.
 */
function getClientID(filePath: string): string {
  // Assuming the client ID is part of the file path, e.g., "audiofiles/client1/filename.mp3"
  const parts = filePath.split('/');
  return parts.length > 1 ? parts[1] : 'UnknownClient';
}
