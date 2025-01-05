import { S3Handler } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import * as csvParser from 'csv-stringify';

const s3 = new AWS.S3();
const bucketName = process.env.BUCKET_NAME!;
const metadataFolder = process.env.METADATA_FOLDER!;

export const handler: S3Handler = async (event) => {
  try {
    console.log('Received S3 event:', JSON.stringify(event, null, 2));

    for (const record of event.Records) {
      const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
      const uploadDate = new Date().toISOString();

      if (!objectKey.startsWith('audiofiles/')) {
        console.log('Skipping non-audio file:', objectKey);
        continue;
      }

      const relativeKey = objectKey.replace('audiofiles/', '');
      const [clientId, year, month, day, fileName] = relativeKey.split('/');
      const metadata = {
        clientId,
        year,
        month,
        day,
        fileName,
        uploadDate,
      };

      console.log('Extracted Metadata:', metadata);

      const metadataFileKey = `${metadataFolder}/metadata.csv`;

      let existingData: string[][] = [];
      try {
        const response = await s3
          .getObject({
            Bucket: bucketName,
            Key: metadataFileKey,
          })
          .promise();

        const fileContent = response.Body!.toString('utf-8');
        existingData = fileContent
          .split('\n')
          .filter((line) => line.trim())
          .map((line) => line.split(','));
      } catch (err) {
        if (err.code !== 'NoSuchKey') {
          throw err;
        }
        console.log('Metadata CSV file does not exist. Creating a new one.');
      }

      existingData.push(Object.values(metadata));

      const csvContent = await new Promise<string>((resolve, reject) => {
        csvParser(existingData, { delimiter: ',' }, (err, output) => {
          if (err) return reject(err);
          resolve(output);
        });
      });

      await s3
        .putObject({
          Bucket: bucketName,
          Key: metadataFileKey,
          Body: csvContent,
          ContentType: 'text/csv',
        })
        .promise();

      console.log('Metadata CSV file updated successfully.');
    }
  } catch (error) {
    console.error('Error processing S3 event:', error);
    throw error;
  }
};
