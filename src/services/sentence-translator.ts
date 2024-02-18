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
      // asserting here is fine since we check the queue length
      const { result, sequenceNumber } =
        this._processQueue.shift() as PreparedTranslationInput;

      let encounteredError = false;
      try {
        const iterable = await this._translationClient.translate(
          JSON.stringify(result)
        );

        for await (const chunk of iterable) {
          this._resultProcessor.handleIncomingChunk({
            sequenceNumber,
            dataChunk: chunk,
          });
        }
        console.log('test');
        this._resultProcessor.handleIncomingChunk({
          sequenceNumber,
          dataChunk: `COMPLETE SEQUENCE NUMBER ${sequenceNumber}\n`,
        });
        this._resultProcessor.handleIncomingChunk({
          sequenceNumber,
          dataChunk: null,
        });
      } catch (error: any) {
        this._logger.error(
          `Error from sentence translator: ${JSON.stringify(error)}`
        );
        encounteredError = true;
        if (error.code === 'rate_limit_exceeded') {
          this._processQueue.push({
            result,
            sequenceNumber,
          });
          this._logger.info(
            `Rate limit exceeded, retrying seq number ${sequenceNumber} in 20 seconds`
          );
          await new Promise((resolve, reject) => {
            setTimeout(() => {
              resolve(undefined);
            }, 20000);
          });
        }
      }
      if (!encounteredError) {
        this._eventEmitter.emit(EVENTS.CHUNK_TRANSLATED, sequenceNumber);
      }
      this._currentOpenConnections--;
      this.handleTranslation();
    }
    this.checkFinished();
  }

  private checkFinished() {
    const finished =
      this._receivedAllChunksReadEvent &&
      !this._processQueue.length &&
      this._currentOpenConnections === 0;
    if (finished) {
      this._logger.info(
        'All chunks processed, no current connections with AI client emitting all chunks translated event'
      );
      this._eventEmitter.emit(EVENTS.ALL_CHUNKS_TRANSLATED);
    }
  }
}
