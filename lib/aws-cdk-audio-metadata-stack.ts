import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as path from 'path';

export class AwsCdkAudioMetadataStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create an S3 bucket for audio uploads and metadata storage
    const audioBucket = new s3.Bucket(this, 'AudioBucket', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create a Lambda function for processing metadata
    const metadataProcessor = new lambda.Function(this, 'MetadataProcessor', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      handler: 'index.handler',
      environment: {
        BUCKET_NAME: audioBucket.bucketName,
        METADATA_FOLDER: 'metadata',
      },
    });

    // Grant Lambda permissions to read and write to the S3 bucket
    audioBucket.grantReadWrite(metadataProcessor);

    // Configure S3 bucket notifications to trigger the Lambda function for new audio uploads
    audioBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(metadataProcessor),
      { prefix: 'audiofiles/' } // Trigger only for files in the audiofiles/ folder
    );

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: audioBucket.bucketName,
      description: 'S3 Bucket for audio uploads and metadata storage',
    });
  }
}
