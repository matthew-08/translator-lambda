import { S3 } from '@aws-sdk/client-s3';
import { appEnv } from '../env/env';

export const s3 = new S3({
  region: appEnv.awsRegion,
});
