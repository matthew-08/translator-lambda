import { SetupPromptType } from '../../types/gpt-types';

export const JSONL_ARRAY_PROMPT: SetupPromptType = [
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
          ["nhung mà", ",", "cuối cùng", "anh ấy", "không", "làm", "."],
          ["Sau", "đó", ",", "anh", "tìm kiếm", "những", "chiếc", "ấm", "cũ", ","]
        ]
        `,
  },
  {
    role: 'assistant',
    content: `[["bạn", "friend"],["sẽ", "will"],["dễ dàng", "easily"],["đạt", "achieve"],["tác động", "effect"],["lớn", "large"],[".", false]]\n[["Ước tính", "estimate"],["cái", "the"],["số lượng", "amount"]]\n[["nhung mà", "but"],[",", false]]\n[["Sau","after"],["đó","that"],[",", false],["anh", "he"],["tìm kiếm", "found"],[".", false]]\n`,
  },
  {
    role: 'user',
    content: `[["“", "Việc", "này", "đã", "được", "chứng minh", "là", "vô cùng", "nguy hại", ",", "”", "bà", "tổng kết", "bằng", "lối", "nói", "giảm", "nói", "tránh", "mang", "tính", "học thuật", "điển hình", "."]]`,
  },
  {
    role: 'assistant',
    content:
      '[["“", false],["Việc", "The"],["này", "this"],["đã", "has"],["được", "been"],["chứng minh", "proven"],["là", "to be"],["vô cùng", "extremely"],["nguy hại", "harmful"],[",", false],["”", false],["bà", "she"],["tổng kết", "concluded"],["bằng", "with"],["lối", "a"],["nói", "style"],["giảm", "of"],["nói", "speaking"],["tránh", "that avoids"],["mang", "carries"],["tính", "the nature"],["học thuật", "of academic"],["điển hình", "typical"],[".", false]]',
  },
  {
    role: 'user',
    content: '[["đồ ăn", "rất", "ngon"],["người ta", "mới", "(", ")", "về"]]',
  },
  {
    role: 'assistant',
    content:
      '[["đồ ăn", "food"],["rất", very], ["ngon", "good"]]\n[["người ta", "they"],["mới", "just"],["(", false],[")", false],["về", back]]',
  },
];

const refinedMessage: SetupPromptType = [
  {
    role: 'system',
    content: `You are an assistant tasked with translating an array of Vietnamese sentences.
              You will be given an array of arrays - each subarray representing a sentence to be translated.
              Translate each array and give back a response in the same order presented.  Numbers, punctuation, and untranslatable
              words are to be marked with the value 'false'.  The response should be in a list format, with each sentence array as a new line.
              `,
  },
  {
    role: 'user',
    content: `[
        ["bạn", "sẽ", "dễ dàng", "đạt", "tác động", "lớn"],
        ["Ước tính", "cái", "số lượng", "là", "quá", "nhiều"],
        ["nhung mà", ",", "cuối cùng", "anh ấy", "không", "làm", "."],
        ["Sau", "đó", ",", "anh", "tìm kiếm", "những", "chiếc", "ấm", "cũ", ","]
      ]`,
  },
  {
    role: 'assistant',
    content: `friend,will,easily,achieve,effect,large\nestimate,the,amount,is,very,much\nbut,false,finally,he,didn\'t,work,
    `,
  },
  {
    role: 'user',
    content: `[["(", "ND", ")", "Tôi", "đề cập", "đến", "ba", "xu hướng", "vận hành", "kinh doanh", "này", "bởi", "chúng", "đều", "nêu", "bật", "lên", "một", "nghịch lý", "."],["Tuy nhiên", ",", "anh", "Đương", "không", "đồng ý", "bán", "."]]
      `,
  },
  {
    role: 'assistant',
    content:
      '{"response":[["(", "ND", ")", "I", "mention", "to", "three", "trends", "business operation", "this", "because", "they", "all", "highlight", "up", "a", "paradox", "."],["However", ",", "Mr.", "Đương", "does not", "agree", "sell", "."]]}',
  },
];

export const CSV_STYLE_PROMPT: SetupPromptType = [
  {
    role: 'system',
    content: `You are an assistant tasked with translating an array of Vietnamese sentences.
              You will be given an array of arrays - each subarray representing a sentence to be translated.
              Translate each word in the array and put each subarray on a new line.  Do not add in any extra
              characters and each sentence MUST be on a new line.
              `,
  },
  {
    role: 'user',
    content: `[
        ["bạn", "sẽ", "dễ dàng", "đạt", "tác động", "lớn"],
        ["Ước tính", "cái", "số lượng", "là", "quá", "nhiều"],
        ["nhung mà", ",", "cuối cùng", "anh ấy", "không", "làm", "."],
        ["Sau", "đó", ",", "anh", "tìm kiếm", "những", "chiếc", "ấm", "cũ", ","]
      ]`,
  },
  {
    role: 'assistant',
    content: `you will easily achieve effects large\nestimate the amount is very much\nbut false finally he didn\'t do it \nafter that false he found teapots old
      `,
  },
];
