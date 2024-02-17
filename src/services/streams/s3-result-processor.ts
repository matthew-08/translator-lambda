import {
  EventEmitter,
  Transform,
  TransformCallback,
  TransformOptions,
} from 'stream';
import { combineBuffer } from '../../utils/combine-buffer';
import { Logger } from '../../log/log';

export class S3ResultsProcessor extends Transform {
  private _sequenceNumber: number;
  private _tail: Buffer;
  private _lineDelineator: number;
  private _logger: Logger;
  constructor(
    logger: Logger,
    lineDelineator: string = '\n',
    options?: TransformOptions
  ) {
    super({
      objectMode: true,
      ...options,
    });
    this._logger = logger;
    this._lineDelineator = lineDelineator.charCodeAt(0);
    this._sequenceNumber = 0;
    this._tail = Buffer.from('');
  }

  _tryJSONParse(data: any) {
    try {
      return JSON.parse(data);
    } catch (error) {
      return false;
    }
  }

  _transform(
    chunk: Buffer,
    encoding: BufferEncoding,
    callback: TransformCallback
  ): void {
    let buff = combineBuffer([this._tail, chunk]);

    const results: any[] = [];
    let indexOfLineDelimiter = buff.indexOf(this._lineDelineator);
    while (indexOfLineDelimiter !== -1) {
      const dataToProcess = buff.toString('utf-8', 0, indexOfLineDelimiter);
      // we'll try our best to parse the json,
      // not always garunteed we can get perfect data so we'll just skip the line if we don't.
      const maybeParsedJson = this._tryJSONParse(dataToProcess);
      if (maybeParsedJson) {
        results.push(maybeParsedJson);
      }
      const newBuff = Buffer.alloc(buff.length - (indexOfLineDelimiter + 1));
      buff.copy(newBuff, 0, indexOfLineDelimiter + 1);
      buff = newBuff;
      indexOfLineDelimiter = buff.indexOf(this._lineDelineator);
    }

    if (buff.length) {
      this._tail = buff;
    }
    if (results.length) {
      this._processResults(results);
    }

    callback();
  }

  _processResults(results: any[]) {
    this.push({
      result: results,
      sequenceNumber: this._sequenceNumber,
    });
    this._logger.info(
      `Pushed result to translator.  Sequence number: ${this._sequenceNumber}`
    );
    this._sequenceNumber++;
  }

  _flush(callback: TransformCallback): void {
    const maybeFinalResult = this._tryJSONParse(this._tail);
    if (maybeFinalResult) {
      this._processResults(maybeFinalResult);
    }
    callback();
  }
}
