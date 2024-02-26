import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  S3,
  UploadPartCommandOutput,
} from '@aws-sdk/client-s3';
import { EventEmitter } from 'stream';
import { s3 } from '../db/s3';
import { Chunk } from './final-result-handler';
import { EVENTS } from '../utils/constants/event-map';
import { Logger } from '../log/log';

const MAX_SIZE_IN_BYTES = 5 * 1024 * 1024;

type S3Params = {
  Bucket: string;
  Key: string;
};

export class ResultUploader {
  private _eventEmitter: EventEmitter;
  private _internalBuffer: string = '';
  private _s3: S3;
  private _params: S3Params;
  private _uploadedPromises: Promise<UploadPartCommandOutput>[] = [];
  private _partNumberCounter = 1;
  private _uploadId: string | undefined;
  private _logger: Logger;
  constructor(
    s3: S3,
    eventEmitter: EventEmitter,
    logger: Logger,
    params: S3Params
  ) {
    this._eventEmitter = eventEmitter;
    this._s3 = s3;
    this._logger = logger;
    this._params = params;

    this.subscribe();
  }

  static async create(
    s3: S3,
    eventEmitter: EventEmitter,
    logger: Logger,
    params: S3Params
  ) {
    const uploader = new ResultUploader(s3, eventEmitter, logger, params);
    await uploader.init();
    return uploader;
  }

  subscribe() {}

  private async init() {
    try {
      const multipartUpload = await s3.send(
        new CreateMultipartUploadCommand(this._params)
      );
      this._logger.info('Initialized multi-part upload');
      this._uploadId = multipartUpload.UploadId;
    } catch (error) {
      this._logger.error(
        `Error while initializing multi-part upload: ${JSON.stringify(error)}`
      );
    }
  }

  async write(chunk: Chunk | null) {
    if (chunk && chunk.dataChunk) {
      this._internalBuffer += chunk.dataChunk;
      this._eventEmitter.emit(EVENTS.CHUNK_UPLOADED);
      if (
        Buffer.byteLength(this._internalBuffer, 'utf-8') > MAX_SIZE_IN_BYTES
      ) {
        this.uploadPart();
      }
    }
    if (chunk === null) {
      await this.handleEndUpload();
    }
  }

  async handleEndUpload() {
    await this.uploadPart();
    const results = await Promise.all(this._uploadedPromises);
    const res = await s3.send(
      new CompleteMultipartUploadCommand({
        ...this._params,
        UploadId: this._uploadId,
        MultipartUpload: {
          Parts: results.map(({ ETag }, i) => ({
            ETag,
            PartNumber: i + 1,
          })),
        },
      })
    );
  }

  async uploadPart() {
    const dataToUpload = this._internalBuffer;
    this._logger.info(`uploadPart, uploading ${dataToUpload.length} bytes`);
    this._internalBuffer = '';
    this._logger.info(`uploading partNumber: ${this._partNumberCounter}`);
    const result = this._s3.send(
      new UploadPartCommand({
        ...this._params,
        UploadId: this._uploadId,
        PartNumber: this._partNumberCounter,
        Body: Buffer.from(dataToUpload),
      })
    );
    this._partNumberCounter++;
    this._logger.info(
      `partNumber ${this._partNumberCounter} successfully uploaded`
    );
    this._uploadedPromises.push(result);
  }
}
