import OpenAI from 'openai';
import { appEnv } from '../env/env';
import { SetupPromptType } from '../types/gpt-types';

const openai = new OpenAI({
  apiKey: appEnv.openAIApiKey,
});

export const createChat = async (
  setupPrompt: SetupPromptType,
  data: string
) => {
  const stream = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      ...setupPrompt,
      {
        role: 'user',
        content: data,
      },
    ],
    stream: true,
    response_format: {
      type: 'text',
    },
    max_tokens: 2048,
  });

  return stream;
};
