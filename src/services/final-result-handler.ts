import { EventEmitter } from 'stream';
import { EVENTS } from '../utils/constants/event-map';
import fs from 'fs';
import { Logger } from '../log/log';

type Chunk = {
  sequenceNumber: number;
  dataChunk: string | undefined | null;
};

const w = fs.createWriteStream('./test-res.jsonl');

export class StreamableRepository {
  async write({ dataChunk, sequenceNumber }: Chunk) {
    if (dataChunk) {
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
    console.log('end');
  }

  handleIncrementSequenceNumber() {
    this._currentSequenceNumber++;
  }

  handleIncomingChunk(chunk: Chunk) {
    const existingMap = this._chunkMap[chunk.sequenceNumber];

    existingMap
      ? existingMap.push(chunk)
      : (this._chunkMap[chunk.sequenceNumber] = []);

    if (!this._currentlyUploading) {
      this._currentlyUploading = true;
      this.uploadChunk();
    }
  }

  private async uploadChunk() {
    const currentChunksToUpload = this._chunkMap[this._currentSequenceNumber];
    while (currentChunksToUpload && currentChunksToUpload.length) {
      try {
        await this._repository.write(currentChunksToUpload.shift() as Chunk);
      } catch (error) {
        console.error(error);
      }
    }
    this._currentlyUploading = false;
  }

  private handleFinishedTranslation() {
    if (this._chunkMap[this._currentSequenceNumber]) {
      this._logger.info(
        `Finishing processing chunks for seq number: ${this._currentSequenceNumber}`
      );
      delete this._chunkMap[this._currentSequenceNumber];
    }
    ++this._currentSequenceNumber;
    this._eventEmitter.emit(EVENTS.CHUNK_UPLOADED);
    this.uploadChunk();
  }
}
