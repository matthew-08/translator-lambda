import OpenAI from 'openai';
import { ChatCompletionCreateParamsBase } from 'openai/resources/chat/completions';
import { appEnv } from '../env/env';

const openai = new OpenAI({
  apiKey: appEnv.openAIApiKey,
});

const defaultMessageSetup: ChatCompletionCreateParamsBase['messages'] = [
  {
    role: 'system',
    content: `You are an assistant tasked with translating an array of Vietnamese words.
            You will be given an array of arrays - each subarray representing a set of words to be translated.
            Translate each array and give back a response in the same order presented with each word
            in the subarray presented as a tuple of ["vietnamese word", "translation"].  Punctuation,
            numbers, and untranslatable words are to be marked with the boolean value 'false' [".", false]
            Each sentence should be separated by a newline control character, as each sentence will be output into a jsonl file.
            `,
  },
  {
    role: 'user',
    content: `[
        ["bạn", "sẽ", "dễ dàng", "đạt", "tác động", "lớn"],
        ["Ước tính", "cái", "số lượng", "là", "quá", "nhiều"],
        ["nhung mà", ",", "cuối cùng", "anh ấy", "không", "làm", "."]
      ]
      `,
  },
  {
    role: 'assistant',
    content: `[["bạn", "friend"],["sẽ", "will"]["dễ dàng", "easily"],["đạt", "achieve"],["tác động", "effect"],["lớn", "large"],[".", false]]\n[["Ước tính", "estimate"]["cái", "the"]["số lượng", "amount"]]\n[["nhung mà", "but"][",", false]]`,
  },
];

export const createChat = async (input: string) => {
  const stream = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      ...defaultMessageSetup,
      {
        role: 'user',
        content: input,
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
