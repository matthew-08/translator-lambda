import { PassThrough, StreamOptions } from 'stream';
import { appLogger } from '../../log/log';

export class ChunkBuffer extends PassThrough {
  finished: boolean;

  constructor(options: StreamOptions<PassThrough>) {
    super(options);

    this.finished = false;

    this.on('finish', () => {
      appLogger.info('RECEIVED FINISHED EVENT IN CHUNKBUFFER');
      this.finished = true;
    });
  }
}
