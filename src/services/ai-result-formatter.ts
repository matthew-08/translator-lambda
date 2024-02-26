import { FormatConfig } from './config/format-config';

type FormatterInput = {
  originalInput: string[][];
  aiOutput: string;
};

export class AIResultFormatter {
  _formatConfig: FormatConfig;
  constructor(formatConfig: FormatConfig) {
    this._formatConfig = formatConfig;
  }

  format(formatterInput: FormatterInput) {
    const { outputFormat } = this._formatConfig;
    if (outputFormat === 'csv-style') {
      return this.formatCsvStyle(formatterInput);
    }

    if (outputFormat === 'jsonl-array') {
      throw new Error('unimplemented');
    }
  }

  private formatCsvStyle({ aiOutput, originalInput }: FormatterInput) {
    const aiTranslatedSentences = aiOutput.split('\n');
    return aiTranslatedSentences.map((translatedSentence, index) => ({
      sentence: originalInput[index],
      translation: translatedSentence,
    }));
  }
}
