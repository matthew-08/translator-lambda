import { Handler, APIGatewayEvent } from 'aws-lambda';
import { InputTextExtractor } from './services/user-input-formatter';
import { spawn } from 'child_process';
import path from 'path';
import { s3 } from './db/s3';
import { Upload } from '@aws-sdk/lib-storage';
import { startTranslatePipeline } from './pipeline';
import { appEnv } from './env/env';
import { randomUUID } from 'crypto';
import { configDotenv } from 'dotenv';
configDotenv();

const PATH_TO_UNDER_THE_SEA = './scripts/under-the-sea.py';

class InputTokenizer {
  constructor() {}

  async tokenize(text: string) {
    const underthesea = spawn(
      'python3',
      ['-u', path.join(__dirname, PATH_TO_UNDER_THE_SEA)],
      {
        stdio: 'pipe',
      }
    );
    underthesea.stdin.write(text);
    underthesea.stdin.end();

    return underthesea.stdout;
  }
}

const createObjectKey = (format: string) => {
  const date = new Date();

  return `${format}/${date.getMonth()}-${date.getDay()}-${date.getFullYear()}/${randomUUID()}`;
};

const handler: Handler<APIGatewayEvent> = async (event, context, callback) => {
  if (!event.body) return;

  const textExtractor = new InputTextExtractor();

  const format = 'txt'; // todo: add in other formats

  const formattedUserInput = textExtractor.format({
    format,
    input: event.body,
  });

  const inputTokenizer = new InputTokenizer();
  if (!formattedUserInput) return;
  const tokenizedJSONL = await inputTokenizer.tokenize(formattedUserInput);

  const bucketParams = {
    Bucket: appEnv.s3InputDataBucket as string,
    Key: createObjectKey(format),
  };

  const uploader = new Upload({
    client: s3,
    params: {
      ...bucketParams,
      Body: tokenizedJSONL,
    },
  });

  uploader.on('httpUploadProgress', (httpUploadProgress) => {
    console.log(httpUploadProgress);
  });

  await uploader.done();

  startTranslatePipeline(bucketParams);
};
