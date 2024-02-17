from underthesea import sent_tokenize, word_tokenize, text_normalize
from json import dumps

file = open('./test.txt')

text = file.read()

normalized_text = text_normalize(text)
sentences = sent_tokenize(text)


writeFile = open('./result.json', 'w')
result = []
for sentence in sentences:
    result.append(word_tokenize(sentence))

writeFile.write(dumps(result, ensure_ascii=False))