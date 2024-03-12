import { EventEmitter } from 'stream';
import { EVENTS } from '../utils/constants/event-map';

export class PipelineStateTracker {
  allChunksRead: boolean = false;
  private _pipelineEmitter: EventEmitter;
  constructor(pipelineEmitter: EventEmitter) {
    this._pipelineEmitter = pipelineEmitter;
    this.subscribe();
  }

  subscribe() {
    this._pipelineEmitter.on(EVENTS.ALL_CHUNKS_READ, () => {
      this.allChunksRead = true;
    });
  }
}
