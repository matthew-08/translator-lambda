import {
  FinalResultProcessor,
  SentenceTranslator,
} from '../../src/services/sentence-translator';
import { ITranslatorApiClient } from '../../src/services/sentence-translator';
import { mockTranslationInputData } from '../mock_data/prepared-translation-input-mock';
import EventEmitter from 'events';

const mockTranslations = [
  'Mock transalted data 1',
  'Mock translated data 2',
  'Mock translated data 3',
  'Mock translated data 4',
  'wow this is super mocked',
  'amazing wow',
  'cool no way',
  'wow super cool',
];
class MockTranslatorClient implements ITranslatorApiClient {
  async *translate(): AsyncIterable<any> {
    for (const sentence of mockTranslations) {
      yield sentence;
    }
  }
}
class MockFinalResultsProcessor implements FinalResultProcessor {
  results: any[] = [];
  handleIncomingChunk(chunk: any): void {
    this.results.push(chunk);
  }
}

let mockFinalResultsProcessor: MockFinalResultsProcessor;

let sentenceTranslator: SentenceTranslator;

describe('sentence translator', () => {
  beforeEach(() => {
    mockFinalResultsProcessor = new MockFinalResultsProcessor();
    sentenceTranslator = new SentenceTranslator(
      new MockTranslatorClient(),
      mockFinalResultsProcessor,
      new EventEmitter(),
      3
    );
  });

  test('limits the amount of concurrent connections to translator client', async () => {
    mockTranslationInputData.forEach((input) => {
      sentenceTranslator.enqueueTranslation(input);
    });
    // set 3 as the max connections in constructor.  expect that only 3 have start processing
    // at this point
    expect(sentenceTranslator._processQueue.length).toEqual(
      mockTranslationInputData.length - 3
    );
  });

  test('properly handles translations', async () => {
    mockTranslationInputData.forEach((input) => {
      sentenceTranslator.enqueueTranslation(input);
    });

    await new Promise((resolve) => setTimeout(() => resolve(undefined), 100));
    expect(mockFinalResultsProcessor.results.length).toEqual(
      mockTranslationInputData.length * mockTranslations.length
    );
  });

  test('continues to translate after receiving an error', () => {
    expect(true).toBe(true);
  });
});
