import { EventEmitter } from 'stream';
import { EVENTS } from '../utils/constants/event-map';
import { Logger } from '../log/log';

export abstract class ITranslatorApiClient {
  abstract translate(data: string): AsyncIterable<any>;
}

export class FinalResultProcessor {
  constructor() {}

  handleIncomingChunk(chunk: any) {}
}

export type PreparedTranslationInput = {
  sequenceNumber: number;
  result: string[][];
};

export class SentenceTranslator {
  private _translationClient: ITranslatorApiClient;
  private _processQueue: PreparedTranslationInput[];
  private _maxConnections: number;
  private _currentOpenConnections: number;
  private _resultProcessor: FinalResultProcessor;
  private _eventEmitter: EventEmitter;
  private _receivedAllChunksReadEvent: boolean = false;
  private _logger: Logger;

  constructor(
    client: ITranslatorApiClient,
    finalResultProcessor: FinalResultProcessor,
    eventEmitter: EventEmitter,
    logger: Logger,
    maxConnections: number = 3
  ) {
    this._translationClient = client;
    this._resultProcessor = finalResultProcessor;
    this._eventEmitter = eventEmitter;
    this._processQueue = [];
    this._maxConnections = maxConnections;
    this._currentOpenConnections = 0;
    this._logger = logger;
    this.subscribeEvents();
  }

  private subscribeEvents() {
    this._eventEmitter.on(EVENTS.ALL_CHUNKS_READ, () => {
      this._receivedAllChunksReadEvent = true;
    });
  }

  enqueueTranslation(input: PreparedTranslationInput) {
    this._processQueue.push(input);
    this.handleTranslation();
  }

  private async handleTranslation() {
    if (
      this._processQueue.length &&
      this._currentOpenConnections < this._maxConnections
    ) {
      this._currentOpenConnections++;
      try {
        // asserting here is fine since we check the queue length
        const { result, sequenceNumber } =
          this._processQueue.shift() as PreparedTranslationInput;
        const iterable = await this._translationClient.translate(
          JSON.stringify(result)
        );

        for await (const chunk of iterable) {
          this._resultProcessor.handleIncomingChunk({
            sequenceNumber,
            dataChunk: chunk,
          });
        }
      } catch (error) {
        this._logger.error(
          `Error from sentence translator: ${JSON.stringify(error)}`
        );
      }
      // TODO: Add retry / error handling
      // for now, just letting the translations continue after an error
      this._eventEmitter.emit(EVENTS.CHUNK_TRANSLATED);
      this._currentOpenConnections--;
      this.handleTranslation();
    }
    this.checkFinished();
  }

  private checkFinished() {
    if (this._receivedAllChunksReadEvent && !this._processQueue.length) {
      this._logger.info(
        'All chunks processed, emitting all chunks translated event'
      );
      this._eventEmitter.emit(EVENTS.ALL_CHUNKS_TRANSLATED);
    }
  }
}
