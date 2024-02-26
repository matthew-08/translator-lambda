type InputFormats = 'array';
type OutputFormats = 'jsonl-array' | 'csv-style';

type Config = {
  inputFormat: InputFormats;
  outputFormat: OutputFormats;
};

export class FormatConfig {
  inputFormat: InputFormats;
  outputFormat: OutputFormats;
  constructor({ inputFormat, outputFormat }: Config) {
    this.inputFormat = inputFormat;
    this.outputFormat = outputFormat;
  }
}
