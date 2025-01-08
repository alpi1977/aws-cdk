import { S3Event } from 'aws-lambda';
/**
 * AWS Lambda handler to process S3 events.
 */
export declare const handler: (event: S3Event) => Promise<void>;
