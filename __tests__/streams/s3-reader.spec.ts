import { HttpHandlerOptions } from "@smithy/types";
import { S3Reader } from "../../src/streams/s3-reader";
import { GetObjectCommandInput, GetObjectCommandOutput, S3 } from "@aws-sdk/client-s3";

type MockS3Helper = Partial<{
  [K in keyof S3]: any
}>

class MockS3Client implements MockS3Helper {
  getObject(args: unknown, options?: unknown, cb?: unknown): void | Promise<GetObjectCommandOutput> {
    
  }


}

let mockS3Client = 

let s3Reader = new S3Reader(new S3)

beforeEach

describe('s3 reader', () => {
  test('to be implemented', () => {
    expect(true).toBe(true);
  });
});
