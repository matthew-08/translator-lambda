import { EventEmitter, PassThrough } from 'stream';
import { EVENTS } from '../utils/constants/event-map';
import fs from 'fs';
import { Logger } from '../log/log';
import { ChunkBuffer } from './streams/chunk-buffer';
import { appLogger } from '../log/log';

type Chunk = {
  sequenceNumber: number;
  dataChunk: string | undefined | null;
};

const w = fs.createWriteStream('./test-res.jsonl');

export class StreamableRepository {
  async write({ dataChunk, sequenceNumber }: Chunk) {
    if (dataChunk) {
      appLogger.info(dataChunk + '  ' + sequenceNumber);
      w.write(dataChunk);
    }
  }
}

export class FinalResultHandler {
  private _currentSequenceNumber: number;
  private _chunkMap: Record<number, Chunk[]>;
  private _repository: StreamableRepository;
  private _eventEmitter: EventEmitter;
  private _currentlyUploading: boolean;
  private _logger: Logger;
  private _finishedChunks: Record<number, boolean>;
  constructor(
    eventEmitter: EventEmitter,
    repository: StreamableRepository,
    logger: Logger
  ) {
    this._eventEmitter = eventEmitter;
    this._repository = repository;
    this._logger = logger;

    this._currentSequenceNumber = 0;
    this._chunkMap = {};
    this._currentlyUploading = false;
    this._finishedChunks = {};

    this._eventEmitter.on(
      EVENTS.CHUNK_TRANSLATED,
      this.handleFinishedTranslation.bind(this)
    );
  }

  subscribeEvents() {
    this._eventEmitter.on(
      EVENTS.CHUNK_TRANSLATED,
      this.handleFinishedTranslation.bind(this)
    );
    this._eventEmitter.on(
      EVENTS.ALL_CHUNKS_TRANSLATED,
      this.handleEnd.bind(this)
    );
  }

  handleEnd() {
    appLogger.info('end');
  }

  handleIncrementSequenceNumber() {
    this._currentSequenceNumber++;
  }

  handleIncomingChunk(chunk: Chunk) {
    const existingMap = this._chunkMap[chunk.sequenceNumber];

    existingMap
      ? existingMap.push(chunk)
      : (this._chunkMap[chunk.sequenceNumber] = []);

    if (
      !this._currentlyUploading &&
      chunk.sequenceNumber === this._currentSequenceNumber
    ) {
      this.uploadChunk();
    }
    this.checkFinished();
  }

  private async uploadChunk() {
    this._currentlyUploading = true;
    const currentChunksToUpload = this._chunkMap[this._currentSequenceNumber];
    while (currentChunksToUpload && currentChunksToUpload.length) {
      try {
        const chunk = currentChunksToUpload.shift() as Chunk;
        if (chunk.dataChunk === null) {
          this.handleChunkComplete();
        } else await this._repository.write(chunk);
      } catch (error) {
        console.error(error);
      }
    }
    this._currentlyUploading = false;
  }

  private checkFinished() {
    if (this._finishedChunks[this._currentSequenceNumber]) {
      if (this._chunkMap[this._currentSequenceNumber].length) {
        appLogger.info('chunk still has bytes, retrying');
        this.uploadChunk();
      } else {
        appLogger.info('chunk complete');
        this.handleChunkComplete();
      }
    }
  }

  private handleChunkComplete() {
    delete this._chunkMap[this._currentSequenceNumber];

    this._currentSequenceNumber++;
    this._logger.info(
      `Finishing processing chunks for seq number: ${
        this._currentSequenceNumber - 1
      }
      `
    );
    this._eventEmitter.emit(EVENTS.CHUNK_UPLOADED);
    this.uploadChunk();
  }

  private handleFinishedTranslation(seqNumber: number) {
    appLogger.info('received seq number', seqNumber);
    this._finishedChunks[seqNumber] = true;
  }
}
