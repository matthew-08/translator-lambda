import { Handler, APIGatewayEvent } from 'aws-lambda';
import { InputTextExtractor } from './services/user-input-formatter';
import { spawn } from 'child_process';
import path from 'path';
import { s3 } from './db/s3';
import { Upload } from '@aws-sdk/lib-storage';
import { processWithTranslationPipeline } from './pipeline';
import { appEnv } from './env/env';
import { randomUUID } from 'crypto';
import { configDotenv } from 'dotenv';
import { appLogger } from './log/log';
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
    underthesea.stderr.on('data', (data) => {
      console.error('Error from Python script:', data.toString());
    });

    underthesea.on('error', (error) => {
      console.error('Error spawning Python script:', error);
    });

    underthesea.on('close', (code) => {
      if (code !== 0) {
        console.error('under-the-sea script exited with non-zero code:', code);
      }
    });
    underthesea.stdin.write(text);
    underthesea.stdin.end();

    return underthesea.stdout;
  }
}

const createObjectKey = (format: string) => {
  const date = new Date(Date.now());

  return `${format}/${date.getMonth()}-${date.getDay()}-${date.getFullYear()}/${randomUUID()}.jsonl`;
};

export const handler: Handler<APIGatewayEvent> = async (
  event,
  context,
  callback
) => {
  if (!event.body) return;
  let data = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;
  const input = JSON.parse(data).text;
  const textExtractor = new InputTextExtractor();
  const format = 'txt'; // todo: add in other formats
  const formattedUserInput = textExtractor.format({
    format,
    input,
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
    appLogger.info(JSON.stringify(httpUploadProgress));
  });
  await uploader.done();
  let res;
  try {
    res = await processWithTranslationPipeline(bucketParams);
  } catch (error) {
    return {
      statusCode: 500,
      result: {
        error: JSON.stringify(error),
      },
    };
  }
  return {
    statusCode: 200,
    body: JSON.stringify({
      result: {
        translatedResult: res,
        original: bucketParams,
      },
    }),
  };
};
