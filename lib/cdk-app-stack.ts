import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3Notifications from 'aws-cdk-lib/aws-s3-notifications';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

export class AudioFileIndexingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const accountId = this.account;

    // S3 Bucket creation
    const bucket = new s3.Bucket(this, 'AudioFileBucket', {
      bucketName: `audiofile-metadata-${accountId}`,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create "dummy" objects to simulate folders
    new s3deploy.BucketDeployment(this, 'CreateFolders', {
      destinationBucket: bucket,
      sources: [
        s3deploy.Source.data('audiofiles/placeholder.txt', 'This is a placeholder for the audiofiles folder.'),
        s3deploy.Source.data('metadata/placeholder.txt', 'This is a placeholder for the metadata folder.'),
      ],
    });

    // IAM Role for Lambda
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
    );

    // Grant S3 permissions to Lambda
    bucket.grantReadWrite(lambdaRole);

    // Lambda Function with local bundling
    const lambdaFunction = new lambda.Function(this, 'MetadataExtractorLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda', {
        bundling: {
          local: {
            tryBundle: (outputDir: string) => {
              const { execSync } = require('child_process');
              try {
                // Use esbuild for local bundling
                execSync('esbuild --version'); // Check if esbuild is installed globally
                execSync(`esbuild lambda/index.ts --bundle --platform=node --target=node18 --outfile=${outputDir}/index.js`);
                return true; // Local bundling was successful
              } catch (error) {
                console.error('Local bundling failed:', error);
                return false; // Fallback to no bundling
              }
            },
          },
          image: lambda.Runtime.NODEJS_18_X.bundlingImage, // Placeholder for required field
        },
      }),
      environment: {
        BUCKET_NAME: bucket.bucketName,
        METADATA_FOLDER: 'metadata/',
      },
      role: lambdaRole,
    });

    // S3 Event Notification for Lambda
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3Notifications.LambdaDestination(lambdaFunction),
      { prefix: 'audiofiles/' } // Trigger only for the `audiofiles/` folder
    );

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', { value: bucket.bucketName });
  }
}
