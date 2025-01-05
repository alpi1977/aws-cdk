# AWS CDK Project Git Repository Structure

aws-cdk/
├── README.md
├── cdk.json
├── package.json
├── tsconfig.json
├── bin/
│   └── aws-cdk-audio-metadata.ts
├── lib/
│   └── aws-cdk-audio-metadata-stack.ts
├── lambda/
│   └── index.ts
└── node_modules/


# AWS CDK Audio Metadata Indexing

This project provisions an AWS infrastructure to:
- Upload audio files to an S3 bucket.
- Automatically index metadata for uploaded files.
- Store metadata as a CSV file in the same S3 bucket.

## Features

- **S3 Bucket**: Single bucket with folders for audio files (`audiofiles/`) and metadata (`metadata/`).
- **Lambda Function**: Processes S3 events to extract and store metadata.
- **AWS CDK**: Infrastructure as Code (IaC) using AWS CDK v2 in TypeScript.

## Usage

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd aws-cdk-audio-metadata

2. Install dependencies:

   npm install


3. Bootstrap your AWS environment (if not already done):

   cdk bootstrap


4. Deploy the stack:

   cdk deploy


5. Upload audio files to the audiofiles/ folder of the S3 bucket to trigger metadata indexing.
