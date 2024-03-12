import { Chat, ChatCompletionChunk } from 'openai/resources';
import { createChat } from '../utils/gpt-client';
import { Stream } from 'openai/streaming';
import OpenAI from 'openai';
import { FormatConfig } from './config/format-config';
import {
  CSV_STYLE_PROMPT,
  JSONL_ARRAY_PROMPT,
} from '../utils/constants/setup-prompts';
import { SetupPromptType } from '../types/gpt-types';

const DEFAULT_REQUEST_RETRY_TIMEOUT = 20;
const SHOULD_RETRY_RESPONSE_CODES = ['rate_limit_exceeded'];

export abstract class ITranslatorApiClient {
  abstract translate(data: string): Promise<string>;
}

type CreateChat = (
  setupPrompt: SetupPromptType,
  data: string
) => Promise<Stream<OpenAI.Chat.Completions.ChatCompletionChunk>>;

type TranslatorClientProps = {
  createChat: CreateChat;
  formatConfig: FormatConfig;
};

export class TranslatorClient implements ITranslatorApiClient {
  _timeout: number | undefined;
  createChat: CreateChat;
  formatConfig: FormatConfig;
  setupPrompt: SetupPromptType;
  constructor({ createChat, formatConfig }: TranslatorClientProps) {
    this.createChat = createChat;
    this.formatConfig = formatConfig;
    this.setupPrompt = this.getPromptFromFormatConfig();
  }

  getPromptFromFormatConfig() {
    const prompts: Record<FormatConfig['outputFormat'], SetupPromptType> = {
      'csv-style': CSV_STYLE_PROMPT,
      'jsonl-array': JSONL_ARRAY_PROMPT,
    };

    return prompts[this.formatConfig.outputFormat];
  }

  async handleGetStream(data: string) {
    try {
      return await this.createChat(this.setupPrompt, data);
    } catch (error: any) {
      console.log(error.message);
      if (SHOULD_RETRY_RESPONSE_CODES.includes(error.code)) {
        if (!this._timeout) {
          this.setInternalTimer();
        }
        await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            clearTimeout(timeout);
            this.handleGetStream(data);
            resolve(undefined);
          }, this._timeout);
        });
      }
    }
  }

  async translate(data: string): Promise<string> {
    const stream = await this.handleGetStream(data);
    let result = '';
    let finishReason: null | string = '';
    for await (const chunk of stream as Stream<ChatCompletionChunk>) {
      finishReason = chunk.choices[0].finish_reason;
      if (chunk.choices[0].delta.content)
        result += chunk.choices[0].delta.content as string;
    }
    return result;
  }

  setInternalTimer() {
    this._timeout = DEFAULT_REQUEST_RETRY_TIMEOUT;
    const interval = setInterval(() => {
      (this._timeout as number) -= 1;
      if ((this._timeout as number) <= 0) {
        this._timeout = undefined;
        clearInterval(interval);
      }
    }, 1000);
  }
}

export const createTranslatorClient = (formatConfig: FormatConfig) => {
  return new TranslatorClient({ createChat, formatConfig });
};
