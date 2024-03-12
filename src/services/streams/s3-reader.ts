import { EventEmitter, Readable, ReadableOptions } from 'stream';
import { S3, GetObjectRequest } from '@aws-sdk/client-s3';
import { EVENTS } from '../../utils/constants/event-map';
import { Logger } from '../../log/log';

type ReaderChunkSizeOptions = {
  maxNumberOfChunks?: number;
  sizeOfChunks?: number;
};

type S3ReaderOptions = {
  s3StreamParams: GetObjectRequest;
  nodeReadableStreamOptions?: ReadableOptions;
  readerChunkOptions?: ReaderChunkSizeOptions;
};

export class S3Reader extends Readable {
  _currentCursorPosition = 0;
  _s3ChunkSize = 1024;
  _maxChunks: number = 10;
  _contentLength: number;
  _s3: S3;
  _s3StreamParams: GetObjectRequest;
  _chunksRead: number;
  _eventEmitter: EventEmitter;
  _logger: Logger;
  _s3ObjectNameReference: string;

  constructor(
    s3: S3,
    emitter: EventEmitter,
    logger: Logger,
    contentLength: number,
    options: S3ReaderOptions
  ) {
    super(options.nodeReadableStreamOptions);
    this._contentLength = contentLength;
    this._s3 = s3;
    this._s3StreamParams = options.s3StreamParams;
    this._chunksRead = 0;
    this._s3ChunkSize = options.readerChunkOptions?.sizeOfChunks || 2048;
    this._maxChunks = options.readerChunkOptions?.maxNumberOfChunks || 10;
    this._eventEmitter = emitter;
    this._logger = logger;
    this._s3ObjectNameReference = `${this._s3StreamParams.Bucket}/${this._s3StreamParams.Key}`;
    this._logger.info(
      `Initialized S3 reader for S3 Object ${this._s3ObjectNameReference}`
    );
    emitter.on(EVENTS.CHUNK_UPLOADED, this.handleChunkProcessed.bind(this));
  }

  _read() {
    if (this._currentCursorPosition > this._contentLength) {
      this._eventEmitter.emit(EVENTS.ALL_CHUNKS_READ);
      this._logger.info(
        `Finished reading ${this._contentLength} bytes from ${this._s3ObjectNameReference}:`
      );
      this.push(null);
    } else if (this._chunksRead < this._maxChunks) {
      const range = this._currentCursorPosition + this._s3ChunkSize;
      this._s3StreamParams.Range = `bytes=${this._currentCursorPosition}-${range}`;
      this._currentCursorPosition = range + 1;
      this._chunksRead++;

      this._s3.getObject(this._s3StreamParams, async (err, data) => {
        if (err) {
          this._logger.error(`Error fetching s3 object ${JSON.stringify(err)}`);
          this.destroy(err);
        } else {
          if (!data) return;
          const test = await data.Body?.transformToString();
          this.push(test);
        }
      });
    }
  }

  handleChunkProcessed() {
    this._chunksRead -= 1;
    // not sure what I did here, this should prob be a <
    if (this._chunksRead + 1 === this._maxChunks) {
      this._read();
    }
  }
}

export async function createS3Reader(
  s3: S3,
  parameters: GetObjectRequest,
  pipelineEmitter: EventEmitter,
  chunkSizeOptions?: ReaderChunkSizeOptions
): Promise<S3Reader> {
  const bucketMetadata = await s3.headObject(parameters);
  return new S3Reader(
    s3,
    pipelineEmitter,
    new Logger('s3-reader'),
    bucketMetadata.ContentLength ?? 0,
    {
      readerChunkOptions: chunkSizeOptions,
      s3StreamParams: parameters,
    }
  );
}
