import { EventEmitter } from 'stream';
import { createS3Reader } from './services/streams/s3-reader';
import { S3 } from '@aws-sdk/client-s3';
import {
  ITranslatorApiClient,
  SentenceTranslator,
} from './services/sentence-translator';
import { createChat } from './utils/gpt-client';
import { S3ResultsProcessor } from './services/streams/s3-result-processor';
import {
  FinalResultHandler,
  StreamableRepository,
} from './services/final-result-handler';
import { appEnv } from './env/env';
import { Logger, appLogger } from './log/log';

const s3 = new S3({
  region: appEnv.awsRegion,
});

class TranslatorClient implements ITranslatorApiClient {
  async *translate(data: string): AsyncIterable<string> {
    const stream = await createChat(data);
    for await (const chunk of stream) {
      yield chunk.choices[0].delta.content as string;
    }
  }
}

type Input = {
  Bucket: string;
  Key: string;
};

async function main(input: Input) {
  const exampleInput = {
    Bucket: 'tokenized-vietnamese-json',
    Key: 'test.jsonl',
  };

  const pipelineEmitter = new EventEmitter();
  const s3Reader = await createS3Reader(s3, exampleInput, pipelineEmitter, {});

  const resultProcessor = new S3ResultsProcessor(
    new Logger('s3-result-processor')
  );

  const stream = s3Reader.pipe(resultProcessor);
  const translatorClient = new TranslatorClient();
  const finalResultsProcessor = new FinalResultHandler(
    pipelineEmitter,
    new StreamableRepository(),
    new Logger('final-result-processor')
  );
  const sentenceTranslator = new SentenceTranslator(
    translatorClient,
    finalResultsProcessor,
    pipelineEmitter,
    new Logger('sentence-translator'),
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

appLogger.info('hello');
