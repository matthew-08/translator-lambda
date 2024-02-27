type SupportedFormats = 'txt' | 'epub' | 'html';

const regexMap = {
  urls: /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/g,
};

type InputTextExtractorInput = {
  input: string;
  format: SupportedFormats;
};

export class InputTextExtractor {
  constructor() {}

  format({ format, input }: InputTextExtractorInput) {
    if (format === 'txt') {
      return input;
    }
  }

  private _applySharedRegexFormatting(input: string) {
    for (const regex of Object.values(regexMap)) {
      input.replace(regex, '');
    }
  }
  private _formatText(input: string) {}
}
