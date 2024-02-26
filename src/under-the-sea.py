from underthesea import sent_tokenize, word_tokenize, text_normalize
from json import dumps

file = open('./test.txt')

text = file.read()

normalized_text = text_normalize(text)
sentences = sent_tokenize(text)


writeFile = open('./test-1.1.json', 'w')
result = []
for sentence in sentences:
    writeFile.write(dumps(word_tokenize(sentence), ensure_ascii=False) + '\n')
    result.append(word_tokenize(sentence))
