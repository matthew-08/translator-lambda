import { EventEmitter } from 'stream';
import { EVENTS } from '../utils/constants/event-map';
import { ILogger } from '../log/log';
import { ITranslatorApiClient } from './translator-client';
import { IFinalResultHandler } from './final-result-handler';
import { createWriteStream } from 'fs';
import { AIResultFormatter } from './ai-result-formatter';
import { PipelineStateTracker } from './pipeline-emitter';

export type PreparedTranslationInput = {
  sequenceNumber: number;
  result: string[][];
};

export class SentenceTranslator {
  private _translationClient: ITranslatorApiClient;
  _processQueue: PreparedTranslationInput[];
  private _maxConnections: number;
  private _currentOpenConnections: number;
  private _finalResultHandler: IFinalResultHandler;
  private _eventEmitter: EventEmitter;
  private _logger: ILogger;
  private _AIResultFormatter: AIResultFormatter;
  private _pipelineStateTracker: PipelineStateTracker;

  constructor(
    client: ITranslatorApiClient,
    finalResultProcessor: IFinalResultHandler,
    eventEmitter: EventEmitter,
    logger: ILogger,
    AIResultFormatter: AIResultFormatter,
    pipelineStateTracker: PipelineStateTracker,
    maxConnections: number = 3
  ) {
    this._translationClient = client;
    this._finalResultHandler = finalResultProcessor;
    this._eventEmitter = eventEmitter;
    this._AIResultFormatter = AIResultFormatter;
    this._logger = logger;
    this._pipelineStateTracker = pipelineStateTracker;

    this._processQueue = [];
    this._maxConnections = maxConnections;
    this._currentOpenConnections = 0;
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
        this._logger.error(`Error from sentence translator: ${error.message}`);
      }
      this._currentOpenConnections--;
      this.handleTranslation();
    }
    this.checkFinished();
  }

  private checkFinished() {
    const finished =
      this._pipelineStateTracker.allChunksRead &&
      !this._processQueue.length &&
      this._currentOpenConnections === 0;
    console.log(finished, 'FINISHED');
    console.log(
      this._pipelineStateTracker.allChunksRead,
      '_receivedAllChunksReadEvent'
    );
    console.log(this._processQueue, 'process queue');
    console.log(this._currentOpenConnections, 'current open connections');

    if (finished) {
      this._logger.info(
        'All chunks processed, no current connections with AI client emitting all chunks translated event'
      );
      this._eventEmitter.emit(EVENTS.ALL_CHUNKS_TRANSLATED);
    }
  }
}
