import { createReadStream } from 'fs';
import { S3ResultsProcessor } from '../../../src/services/streams/s3-result-processor';
import fs from 'fs/promises';
import path from 'path';
import { createMockLogger } from '../../utils/createMockLogger';
const mockLogger = createMockLogger();

// load file into memory and parse into JS object so we can compare the stream results
const getMockData = async () => {
  return (await fs.readFile(MOCK_JSONL_FILEPATH, 'utf-8'))
    .split('\n')
    .filter(Boolean)
    .map((jsonArray) => JSON.parse(jsonArray)) as string[];
};

const MOCK_JSONL_FILEPATH = path.join(__dirname, './mocks/mock-jsonl.jsonl');
describe('text processor stream', () => {
  test('processes a line delineated json file into distinct javascript arrays', async () => {
    const mockData = await getMockData();

    const r = createReadStream(MOCK_JSONL_FILEPATH).pipe(
      new S3ResultsProcessor(mockLogger)
    );

    const results = [];
    for await (const result of r) {
      results.push(...result.result);
    }

    expect(results).toEqual(mockData);
    expect(results.length).toEqual(mockData.length);
  });

  test('processes if the readable source is split into uneven chunks', async () => {
    const mockData = await getMockData();

    const r = createReadStream(MOCK_JSONL_FILEPATH, {
      highWaterMark: 20,
    }).pipe(new S3ResultsProcessor(mockLogger));

    const results = [];
    for await (const result of r) {
      results.push(...result.result);
    }

    expect(results).toEqual(mockData);
  });

  test('returns sequence numbers in order for each chunk processed ', async () => {
    const r = createReadStream(MOCK_JSONL_FILEPATH, {
      highWaterMark: 1024,
    }).pipe(new S3ResultsProcessor(mockLogger));

    const results: any[] = [];
    for await (const result of r) {
      results.push(result);
    }

    results.forEach((result, index) =>
      expect(result.sequenceNumber).toEqual(index)
    );
  });

  test('ignores errenous data and still processes valid data in the same set of data', async () => {
    const mockData = Buffer.from(
      `["valid", "data"]\n "invalid", "json", "array"]\n ["more", "valid", "data"]`
    );

    const r = new S3ResultsProcessor(mockLogger);
    r.write(mockData);
    r.end();

    const results: any[] = [];
    for await (const result of r) {
      results.push(result);
    }
    expect(results.length).toEqual(2);
  });
});
