"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const s3_result_processor_1 = require("../../../src/services/streams/s3-result-processor");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const createMockLogger_1 = require("../../utils/createMockLogger");
const mockLogger = (0, createMockLogger_1.createMockLogger)();
// load file into memory and parse into JS object so we can compare the stream results
const getMockData = () => __awaiter(void 0, void 0, void 0, function* () {
    return (yield promises_1.default.readFile(MOCK_JSONL_FILEPATH, 'utf-8'))
        .split('\n')
        .filter(Boolean)
        .map((jsonArray) => JSON.parse(jsonArray));
});
const MOCK_JSONL_FILEPATH = path_1.default.join(__dirname, './mocks/mock-jsonl.jsonl');
describe('text processor stream', () => {
    test('processes a line delineated json file into distinct javascript arrays', () => __awaiter(void 0, void 0, void 0, function* () {
        var e_1, _a;
        const mockData = yield getMockData();
        const r = (0, fs_1.createReadStream)(MOCK_JSONL_FILEPATH).pipe(new s3_result_processor_1.S3ResultsProcessor(mockLogger));
        const results = [];
        try {
            for (var r_1 = __asyncValues(r), r_1_1; r_1_1 = yield r_1.next(), !r_1_1.done;) {
                const result = r_1_1.value;
                results.push(...result.result);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (r_1_1 && !r_1_1.done && (_a = r_1.return)) yield _a.call(r_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        expect(results).toEqual(mockData);
        expect(results.length).toEqual(mockData.length);
    }));
    test('processes if the readable source is split into uneven chunks', () => __awaiter(void 0, void 0, void 0, function* () {
        var e_2, _b;
        const mockData = yield getMockData();
        const r = (0, fs_1.createReadStream)(MOCK_JSONL_FILEPATH, {
            highWaterMark: 20,
        }).pipe(new s3_result_processor_1.S3ResultsProcessor(mockLogger));
        const results = [];
        try {
            for (var r_2 = __asyncValues(r), r_2_1; r_2_1 = yield r_2.next(), !r_2_1.done;) {
                const result = r_2_1.value;
                results.push(...result.result);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (r_2_1 && !r_2_1.done && (_b = r_2.return)) yield _b.call(r_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
        expect(results).toEqual(mockData);
    }));
    test('returns sequence numbers in order for each chunk processed ', () => __awaiter(void 0, void 0, void 0, function* () {
        var e_3, _c;
        const r = (0, fs_1.createReadStream)(MOCK_JSONL_FILEPATH, {
            highWaterMark: 1024,
        }).pipe(new s3_result_processor_1.S3ResultsProcessor(mockLogger));
        const results = [];
        try {
            for (var r_3 = __asyncValues(r), r_3_1; r_3_1 = yield r_3.next(), !r_3_1.done;) {
                const result = r_3_1.value;
                results.push(result);
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (r_3_1 && !r_3_1.done && (_c = r_3.return)) yield _c.call(r_3);
            }
            finally { if (e_3) throw e_3.error; }
        }
        results.forEach((result, index) => expect(result.sequenceNumber).toEqual(index));
    }));
    test('ignores errenous data and still processes valid data in the same set of data', () => __awaiter(void 0, void 0, void 0, function* () {
        var e_4, _d;
        const mockData = Buffer.from(`["valid", "data"]\n "invalid", "json", "array"]\n ["more", "valid", "data"]`);
        const r = new s3_result_processor_1.S3ResultsProcessor(mockLogger);
        r.write(mockData);
        r.end();
        const results = [];
        try {
            for (var r_4 = __asyncValues(r), r_4_1; r_4_1 = yield r_4.next(), !r_4_1.done;) {
                const result = r_4_1.value;
                results.push(result);
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (r_4_1 && !r_4_1.done && (_d = r_4.return)) yield _d.call(r_4);
            }
            finally { if (e_4) throw e_4.error; }
        }
        expect(results.length).toEqual(2);
    }));
});
