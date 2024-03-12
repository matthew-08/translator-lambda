from underthesea import sent_tokenize, word_tokenize, text_normalize
from json import dumps
import sys

try:
    text = ''
    for line in sys.stdin:
        text += line

    normalized_text = text_normalize(text)
    sentences = sent_tokenize(text)


    results = []
    for sentence in sentences:
        results.append(word_tokenize(sentence))

    for result in results:
        sys.stdout.write(dumps(result, ensure_ascii=False) + '\n')
    # Your code here
except Exception as e:
    print("Exception occurred:", str(e))



sys.stdout.close()