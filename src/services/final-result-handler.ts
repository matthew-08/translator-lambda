import { EventEmitter } from 'stream';
import { EVENTS } from '../utils/constants/event-map';
import { Logger } from '../log/log';
import { ResultUploader } from './result-uploader';

export type Chunk = {
  sequenceNumber: number;
  dataChunk: string;
};

export abstract class IFinalResultHandler {
  abstract handleIncomingChunk(chunk: Chunk): void;
}

export class FinalResultHandler implements IFinalResultHandler {
  private _currentSequenceNumber: number;
  private _chunkMap: Record<number, Chunk[]>;
  private _repository: ResultUploader;
  private _eventEmitter: EventEmitter;
  private _currentlyUploading: boolean;
  private _logger: Logger;
  private _finishedChunks: Record<number, boolean>;
  private _allChunksTranslated: boolean;
  constructor(
    eventEmitter: EventEmitter,
    repository: ResultUploader,
    logger: Logger
  ) {
    this._eventEmitter = eventEmitter;
    this._repository = repository;
    this._logger = logger;

    this._currentSequenceNumber = 0;
    this._chunkMap = {};
    this._currentlyUploading = false;
    this._finishedChunks = {};
    this._allChunksTranslated = false;

    this.subscribeEvents();
  }

  subscribeEvents() {
    this._eventEmitter.on(
      EVENTS.CHUNK_TRANSLATED,
      this.handleFinishedTranslation.bind(this)
    );
    this._eventEmitter.on(
      EVENTS.ALL_CHUNKS_TRANSLATED,
      this.handleAllChunksTranslated.bind(this)
    );
  }

  handleAllChunksTranslated() {
    this._allChunksTranslated = true;
    this._logger.info('All chunks translated');
  }

  handleIncrementSequenceNumber() {
    this._currentSequenceNumber++;
  }

  handleIncomingChunk(chunk: Chunk) {
    const existingMap = this._chunkMap[chunk.sequenceNumber];

    existingMap
      ? existingMap.push(chunk)
      : (this._chunkMap[chunk.sequenceNumber] = [chunk]);

    if (!this._currentlyUploading) {
      this.uploadChunks();
    }
  }

  private async uploadChunks() {
    this._currentlyUploading = true;
    const chunks = this._chunkMap[this._currentSequenceNumber];
    if (!chunks) {
      this._currentlyUploading = false;
      this.checkEnd();
      return;
    }

    while (chunks.length) {
      const maybeChunk = chunks.shift();
      if (maybeChunk) await this._repository.write(maybeChunk);
    }

    delete this._chunkMap[this._currentSequenceNumber];
    ++this._currentSequenceNumber;

    this.uploadChunks();
  }

  private checkEnd() {
    const chunkMapIsEmpty = Object.keys(this._chunkMap).length === 0;

    if (chunkMapIsEmpty && this._allChunksTranslated) {
      this._repository.write(null);
    }
  }

  private handleFinishedTranslation(seqNumber: number) {
    this._finishedChunks[seqNumber] = true;
  }
}
