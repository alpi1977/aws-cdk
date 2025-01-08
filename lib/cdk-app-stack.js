"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioFileIndexingStack = void 0;
const cdk = require("aws-cdk-lib");
const s3 = require("aws-cdk-lib/aws-s3");
const iam = require("aws-cdk-lib/aws-iam");
const lambda = require("aws-cdk-lib/aws-lambda");
const s3Notifications = require("aws-cdk-lib/aws-s3-notifications");
const s3deploy = require("aws-cdk-lib/aws-s3-deployment");
class AudioFileIndexingStack extends cdk.Stack {
    constructor(scope, id, props) {
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
        lambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));
        // Grant S3 permissions to Lambda
        bucket.grantReadWrite(lambdaRole);
        // Lambda Function with local bundling
        const lambdaFunction = new lambda.Function(this, 'MetadataExtractorLambda', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset('lambda', {
                bundling: {
                    local: {
                        tryBundle: (outputDir) => {
                            const { execSync } = require('child_process');
                            try {
                                // Use esbuild for local bundling
                                execSync('esbuild --version'); // Check if esbuild is installed globally
                                execSync(`esbuild lambda/index.ts --bundle --platform=node --target=node18 --outfile=${outputDir}/index.js`);
                                return true; // Local bundling was successful
                            }
                            catch (error) {
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
        bucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3Notifications.LambdaDestination(lambdaFunction), { prefix: 'audiofiles/' } // Trigger only for the `audiofiles/` folder
        );
        // Outputs
        new cdk.CfnOutput(this, 'BucketName', { value: bucket.bucketName });
    }
}
exports.AudioFileIndexingStack = AudioFileIndexingStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLWFwcC1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNkay1hcHAtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbUNBQW1DO0FBRW5DLHlDQUF5QztBQUN6QywyQ0FBMkM7QUFDM0MsaURBQWlEO0FBQ2pELG9FQUFvRTtBQUNwRSwwREFBMEQ7QUFFMUQsTUFBYSxzQkFBdUIsU0FBUSxHQUFHLENBQUMsS0FBSztJQUNuRCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7UUFFL0IscUJBQXFCO1FBQ3JCLE1BQU0sTUFBTSxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDcEQsVUFBVSxFQUFFLHNCQUFzQixTQUFTLEVBQUU7WUFDN0MsU0FBUyxFQUFFLElBQUk7WUFDZixhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPO1lBQ3hDLGlCQUFpQixFQUFFLElBQUk7U0FDeEIsQ0FBQyxDQUFDO1FBRUgsNkNBQTZDO1FBQzdDLElBQUksUUFBUSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7WUFDbkQsaUJBQWlCLEVBQUUsTUFBTTtZQUN6QixPQUFPLEVBQUU7Z0JBQ1AsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsNEJBQTRCLEVBQUUsa0RBQWtELENBQUM7Z0JBQ3RHLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLDBCQUEwQixFQUFFLGdEQUFnRCxDQUFDO2FBQ25HO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsc0JBQXNCO1FBQ3RCLE1BQU0sVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUscUJBQXFCLEVBQUU7WUFDM0QsU0FBUyxFQUFFLElBQUksR0FBRyxDQUFDLGdCQUFnQixDQUFDLHNCQUFzQixDQUFDO1NBQzVELENBQUMsQ0FBQztRQUVILFVBQVUsQ0FBQyxnQkFBZ0IsQ0FDekIsR0FBRyxDQUFDLGFBQWEsQ0FBQyx3QkFBd0IsQ0FBQywwQ0FBMEMsQ0FBQyxDQUN2RixDQUFDO1FBRUYsaUNBQWlDO1FBQ2pDLE1BQU0sQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFbEMsc0NBQXNDO1FBQ3RDLE1BQU0sY0FBYyxHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUseUJBQXlCLEVBQUU7WUFDMUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxPQUFPLEVBQUUsZUFBZTtZQUN4QixJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFO2dCQUNwQyxRQUFRLEVBQUU7b0JBQ1IsS0FBSyxFQUFFO3dCQUNMLFNBQVMsRUFBRSxDQUFDLFNBQWlCLEVBQUUsRUFBRTs0QkFDL0IsTUFBTSxFQUFFLFFBQVEsRUFBRSxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQzs0QkFDOUMsSUFBSSxDQUFDO2dDQUNILGlDQUFpQztnQ0FDakMsUUFBUSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyx5Q0FBeUM7Z0NBQ3hFLFFBQVEsQ0FBQyw4RUFBOEUsU0FBUyxXQUFXLENBQUMsQ0FBQztnQ0FDN0csT0FBTyxJQUFJLENBQUMsQ0FBQyxnQ0FBZ0M7NEJBQy9DLENBQUM7NEJBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQ0FDZixPQUFPLENBQUMsS0FBSyxDQUFDLHdCQUF3QixFQUFFLEtBQUssQ0FBQyxDQUFDO2dDQUMvQyxPQUFPLEtBQUssQ0FBQyxDQUFDLDBCQUEwQjs0QkFDMUMsQ0FBQzt3QkFDSCxDQUFDO3FCQUNGO29CQUNELEtBQUssRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxhQUFhLEVBQUUsaUNBQWlDO2lCQUNuRjthQUNGLENBQUM7WUFDRixXQUFXLEVBQUU7Z0JBQ1gsV0FBVyxFQUFFLE1BQU0sQ0FBQyxVQUFVO2dCQUM5QixlQUFlLEVBQUUsV0FBVzthQUM3QjtZQUNELElBQUksRUFBRSxVQUFVO1NBQ2pCLENBQUMsQ0FBQztRQUVILG1DQUFtQztRQUNuQyxNQUFNLENBQUMsb0JBQW9CLENBQ3pCLEVBQUUsQ0FBQyxTQUFTLENBQUMsY0FBYyxFQUMzQixJQUFJLGVBQWUsQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLENBQUMsRUFDckQsRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFLENBQUMsNENBQTRDO1NBQ3ZFLENBQUM7UUFFRixVQUFVO1FBQ1YsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7SUFDdEUsQ0FBQztDQUNGO0FBM0VELHdEQTJFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCAqIGFzIHMzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMyc7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XG5pbXBvcnQgKiBhcyBzM05vdGlmaWNhdGlvbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzLW5vdGlmaWNhdGlvbnMnO1xuaW1wb3J0ICogYXMgczNkZXBsb3kgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzLWRlcGxveW1lbnQnO1xuXG5leHBvcnQgY2xhc3MgQXVkaW9GaWxlSW5kZXhpbmdTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIGNvbnN0IGFjY291bnRJZCA9IHRoaXMuYWNjb3VudDtcblxuICAgIC8vIFMzIEJ1Y2tldCBjcmVhdGlvblxuICAgIGNvbnN0IGJ1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ0F1ZGlvRmlsZUJ1Y2tldCcsIHtcbiAgICAgIGJ1Y2tldE5hbWU6IGBhdWRpb2ZpbGUtbWV0YWRhdGEtJHthY2NvdW50SWR9YCxcbiAgICAgIHZlcnNpb25lZDogdHJ1ZSxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgICBhdXRvRGVsZXRlT2JqZWN0czogdHJ1ZSxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBcImR1bW15XCIgb2JqZWN0cyB0byBzaW11bGF0ZSBmb2xkZXJzXG4gICAgbmV3IHMzZGVwbG95LkJ1Y2tldERlcGxveW1lbnQodGhpcywgJ0NyZWF0ZUZvbGRlcnMnLCB7XG4gICAgICBkZXN0aW5hdGlvbkJ1Y2tldDogYnVja2V0LFxuICAgICAgc291cmNlczogW1xuICAgICAgICBzM2RlcGxveS5Tb3VyY2UuZGF0YSgnYXVkaW9maWxlcy9wbGFjZWhvbGRlci50eHQnLCAnVGhpcyBpcyBhIHBsYWNlaG9sZGVyIGZvciB0aGUgYXVkaW9maWxlcyBmb2xkZXIuJyksXG4gICAgICAgIHMzZGVwbG95LlNvdXJjZS5kYXRhKCdtZXRhZGF0YS9wbGFjZWhvbGRlci50eHQnLCAnVGhpcyBpcyBhIHBsYWNlaG9sZGVyIGZvciB0aGUgbWV0YWRhdGEgZm9sZGVyLicpLFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIElBTSBSb2xlIGZvciBMYW1iZGFcbiAgICBjb25zdCBsYW1iZGFSb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsICdMYW1iZGFFeGVjdXRpb25Sb2xlJywge1xuICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2xhbWJkYS5hbWF6b25hd3MuY29tJyksXG4gICAgfSk7XG5cbiAgICBsYW1iZGFSb2xlLmFkZE1hbmFnZWRQb2xpY3koXG4gICAgICBpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ3NlcnZpY2Utcm9sZS9BV1NMYW1iZGFCYXNpY0V4ZWN1dGlvblJvbGUnKVxuICAgICk7XG5cbiAgICAvLyBHcmFudCBTMyBwZXJtaXNzaW9ucyB0byBMYW1iZGFcbiAgICBidWNrZXQuZ3JhbnRSZWFkV3JpdGUobGFtYmRhUm9sZSk7XG5cbiAgICAvLyBMYW1iZGEgRnVuY3Rpb24gd2l0aCBsb2NhbCBidW5kbGluZ1xuICAgIGNvbnN0IGxhbWJkYUZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnTWV0YWRhdGFFeHRyYWN0b3JMYW1iZGEnLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMThfWCxcbiAgICAgIGhhbmRsZXI6ICdpbmRleC5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgnbGFtYmRhJywge1xuICAgICAgICBidW5kbGluZzoge1xuICAgICAgICAgIGxvY2FsOiB7XG4gICAgICAgICAgICB0cnlCdW5kbGU6IChvdXRwdXREaXI6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICBjb25zdCB7IGV4ZWNTeW5jIH0gPSByZXF1aXJlKCdjaGlsZF9wcm9jZXNzJyk7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8gVXNlIGVzYnVpbGQgZm9yIGxvY2FsIGJ1bmRsaW5nXG4gICAgICAgICAgICAgICAgZXhlY1N5bmMoJ2VzYnVpbGQgLS12ZXJzaW9uJyk7IC8vIENoZWNrIGlmIGVzYnVpbGQgaXMgaW5zdGFsbGVkIGdsb2JhbGx5XG4gICAgICAgICAgICAgICAgZXhlY1N5bmMoYGVzYnVpbGQgbGFtYmRhL2luZGV4LnRzIC0tYnVuZGxlIC0tcGxhdGZvcm09bm9kZSAtLXRhcmdldD1ub2RlMTggLS1vdXRmaWxlPSR7b3V0cHV0RGlyfS9pbmRleC5qc2ApO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlOyAvLyBMb2NhbCBidW5kbGluZyB3YXMgc3VjY2Vzc2Z1bFxuICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0xvY2FsIGJ1bmRsaW5nIGZhaWxlZDonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlOyAvLyBGYWxsYmFjayB0byBubyBidW5kbGluZ1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAgaW1hZ2U6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xOF9YLmJ1bmRsaW5nSW1hZ2UsIC8vIFBsYWNlaG9sZGVyIGZvciByZXF1aXJlZCBmaWVsZFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBCVUNLRVRfTkFNRTogYnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICAgIE1FVEFEQVRBX0ZPTERFUjogJ21ldGFkYXRhLycsXG4gICAgICB9LFxuICAgICAgcm9sZTogbGFtYmRhUm9sZSxcbiAgICB9KTtcblxuICAgIC8vIFMzIEV2ZW50IE5vdGlmaWNhdGlvbiBmb3IgTGFtYmRhXG4gICAgYnVja2V0LmFkZEV2ZW50Tm90aWZpY2F0aW9uKFxuICAgICAgczMuRXZlbnRUeXBlLk9CSkVDVF9DUkVBVEVELFxuICAgICAgbmV3IHMzTm90aWZpY2F0aW9ucy5MYW1iZGFEZXN0aW5hdGlvbihsYW1iZGFGdW5jdGlvbiksXG4gICAgICB7IHByZWZpeDogJ2F1ZGlvZmlsZXMvJyB9IC8vIFRyaWdnZXIgb25seSBmb3IgdGhlIGBhdWRpb2ZpbGVzL2AgZm9sZGVyXG4gICAgKTtcblxuICAgIC8vIE91dHB1dHNcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQnVja2V0TmFtZScsIHsgdmFsdWU6IGJ1Y2tldC5idWNrZXROYW1lIH0pO1xuICB9XG59XG4iXX0=