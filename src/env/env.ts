import { config } from 'dotenv';
config();

export const appEnv = {
  openAIApiKey: process.env.OPEN_AI_API_KEY,
  awsRegion: process.env.AWS_REGION,
  nodeEnv: process.env.NODE_ENV,
  s3TranslationResultsBucket: process.env.S3_TRANSLATION_RESULTS_BUCKET,
  s3InputDataBucket: process.env.S3_INPUT_DATA_BUCKET,
};

for (const [key, value] of Object.entries(appEnv)) {
  if (!value) {
    console.log(`Missing environment variable ${key}`);
  }
}

if (appEnv.nodeEnv === 'development') {
  console.log(`Initialized environment with variables:\n %o`, appEnv);
}
