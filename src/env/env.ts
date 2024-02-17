import { config } from 'dotenv';
config();
import { appLogger } from '../log/log';

export const appEnv = {
  openAIApiKey: process.env.OPEN_AI_API_KEY,
  awsRegion: process.env.AWS_REGION,
  nodeEnv: process.env.NODE_ENV,
} as Record<string, string>;

for (const [key, value] of Object.entries(appEnv)) {
  if (!value) {
    console.log(`Missing environment variable ${key}`);
  }
}

if (appEnv.nodeEnv === 'development') {
  console.log(`Initialized environment with variables:\n %o`, appEnv);
}
