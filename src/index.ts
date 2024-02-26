import { EventEmitter } from 'stream';
import { createS3Reader } from './services/streams/s3-reader';
import { S3 } from '@aws-sdk/client-s3';
import { SentenceTranslator } from './services/sentence-translator';
import { S3ResultsProcessor } from './services/streams/s3-result-processor';
import { appEnv } from './env/env';
import { Logger } from './log/log';
import { createTranslatorClient } from './services/translator-client';
import { ResultUploader } from './services/result-uploader';
import { AIResultFormatter } from './services/ai-result-formatter';
import { FormatConfig } from './services/config/format-config';
import { createFinalResultsProcessor } from './utils/factories/final-results-processor-factory';

const s3 = new S3({
  region: appEnv.awsRegion,
});

type Input = {
  Bucket: string;
  Key: string;
};

async function main(input: Input) {
  const exampleInput = {
    Bucket: 'tokenized-vietnamese-json',
    Key: 'test-1.2.jsonl',
  };

  const pipelineEmitter = new EventEmitter();

  // construct initial s3 read => formatS3 results stream
  const s3Reader = await createS3Reader(s3, exampleInput, pipelineEmitter, {
    maxNumberOfChunks: 20,
  });
  const resultProcessor = new S3ResultsProcessor(
    new Logger('s3-result-processor')
  );
  const stream = s3Reader.pipe(resultProcessor);

  const finalResultsProcessor = createFinalResultsProcessor(
    pipelineEmitter,
    await ResultUploader.create(
      s3,
      pipelineEmitter,
      new Logger('result-uploader'),
      {
        Bucket: 'tokenized-vietnamese-json',
        Key: 'test-1.2-result.jsonl',
      }
    ),
    new Logger('final-result-processor')
  );

  const formatConfig = new FormatConfig({
    inputFormat: 'array',
    outputFormat: 'csv-style',
  });

  const translatorClient = createTranslatorClient(formatConfig);

  const sentenceTranslator = new SentenceTranslator(
    translatorClient,
    finalResultsProcessor,
    pipelineEmitter,
    new Logger('sentence-translator'),
    new AIResultFormatter(formatConfig),
    3
  );
  stream.on('data', (chunk) => {
    sentenceTranslator.enqueueTranslation(chunk);
  });
}

main({
  Bucket: '',
  Key: '',
});

process.on('uncaughtException', (err) => {
  console.error(`Uncaught Exception: ${JSON.stringify(err)}`);
});
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled rejection: ${JSON.stringify(err)}`);
});
