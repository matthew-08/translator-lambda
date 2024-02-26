import { EventEmitter } from 'stream';
import { EVENTS } from '../utils/constants/event-map';
import { ILogger } from '../log/log';
import { ITranslatorApiClient } from './translator-client';
import { IFinalResultHandler } from './final-result-handler';
import { createWriteStream } from 'fs';
import { AIResultFormatter } from './ai-result-formatter';

export type PreparedTranslationInput = {
  sequenceNumber: number;
  result: string[][];
};

const w = createWriteStream('./test-2.jsonl');

export class SentenceTranslator {
  private _translationClient: ITranslatorApiClient;
  _processQueue: PreparedTranslationInput[];
  private _maxConnections: number;
  private _currentOpenConnections: number;
  private _finalResultHandler: IFinalResultHandler;
  private _eventEmitter: EventEmitter;
  private _receivedAllChunksReadEvent: boolean = false;
  private _logger: ILogger;
  private _AIResultFormatter: AIResultFormatter;

  constructor(
    client: ITranslatorApiClient,
    finalResultProcessor: IFinalResultHandler,
    eventEmitter: EventEmitter,
    logger: ILogger,
    AIResultFormatter: AIResultFormatter,
    maxConnections: number = 3
  ) {
    this._translationClient = client;
    this._finalResultHandler = finalResultProcessor;
    this._eventEmitter = eventEmitter;
    this._AIResultFormatter = AIResultFormatter;
    this._logger = logger;

    this._processQueue = [];
    this._maxConnections = maxConnections;
    this._currentOpenConnections = 0;

    this.subscribeEvents();
  }

  private subscribeEvents() {
    this._eventEmitter.on(EVENTS.ALL_CHUNKS_READ, () => {
      this._receivedAllChunksReadEvent = true;
      this.checkFinished();
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

      try {
        const translationResult = await this._translationClient.translate(
          JSON.stringify(result)
        );

        if (translationResult) {
          const formattedResult = this._AIResultFormatter.format({
            originalInput: result,
            aiOutput: translationResult,
          });
          if (formattedResult) {
            this._finalResultHandler.handleIncomingChunk({
              dataChunk: JSON.stringify(formattedResult) + '\n',
              sequenceNumber: sequenceNumber,
            });
          }
        }
      } catch (error: any) {
        this._logger.error(
          `Error from sentence translator: ${JSON.stringify(error)}`
        );
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
