from flask import Flask, jsonify
from your_script import extract_paragraphs_from_epub, align_paragraphs

app = Flask(__name__)

@app.route('/api/pairs')
def get_pairs():
    bookA = request.args.get('bookA')
    bookB = request.args.get('bookB')
    paraA = extract_paragraphs_from_epub(bookA)
    paraB = extract_paragraphs_from_epub(bookB)
    pairs = align_paragraphs(paraA, paraB)
    return jsonify(pairs)

if __name__ == '__main__':
    app.run(debug=True)