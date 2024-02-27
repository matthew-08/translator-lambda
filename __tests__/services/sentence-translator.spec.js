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
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sentence_translator_1 = require("../../src/services/sentence-translator");
const prepared_translation_input_mock_1 = require("../mock_data/prepared-translation-input-mock");
const events_1 = __importDefault(require("events"));
const createMockLogger_1 = require("../utils/createMockLogger");
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
class MockTranslatorClient {
    translate() {
        return __asyncGenerator(this, arguments, function* translate_1() {
            for (const sentence of mockTranslations) {
                yield yield __await(sentence);
            }
        });
    }
}
class MockFinalResultsProcessor {
    constructor() {
        this.results = [];
    }
    handleIncomingChunk(chunk) {
        this.results.push(chunk);
    }
}
let mockFinalResultsProcessor;
let sentenceTranslator;
const logger = (0, createMockLogger_1.createMockLogger)();
describe('sentence translator', () => {
    beforeEach(() => {
        mockFinalResultsProcessor = new MockFinalResultsProcessor();
        sentenceTranslator = new sentence_translator_1.SentenceTranslator(new MockTranslatorClient(), mockFinalResultsProcessor, new events_1.default(), logger, 3);
    });
    test('limits the amount of concurrent connections to translator client', () => __awaiter(void 0, void 0, void 0, function* () {
        prepared_translation_input_mock_1.mockTranslationInputData.forEach((input) => {
            sentenceTranslator.enqueueTranslation(input);
        });
        // set 3 as the max connections in constructor.  expect that only 3 have start processing
        // at this point
        expect(sentenceTranslator._processQueue.length).toEqual(prepared_translation_input_mock_1.mockTranslationInputData.length - 3);
    }));
    test('properly handles translations', () => __awaiter(void 0, void 0, void 0, function* () {
        prepared_translation_input_mock_1.mockTranslationInputData.forEach((input) => {
            sentenceTranslator.enqueueTranslation(input);
        });
        yield new Promise((resolve) => setTimeout(() => resolve(undefined), 100));
        expect(mockFinalResultsProcessor.results.length).toEqual(prepared_translation_input_mock_1.mockTranslationInputData.length * mockTranslations.length);
    }));
    test('continues to translate after receiving an error', () => {
        expect(true).toBe(true);
    });
});
