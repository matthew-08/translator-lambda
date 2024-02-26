import { FinalResultHandler } from '../../services/final-result-handler';

export const createFinalResultsProcessor = (
  ...args: ConstructorParameters<typeof FinalResultHandler>
) => {
  return new FinalResultHandler(...args);
};
