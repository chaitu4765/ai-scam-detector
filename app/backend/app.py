from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
# import pandas as pd # Removed to save space/dependency size
import numpy as np
import re
from scipy.sparse import hstack
import os

app = Flask(__name__)
CORS(app)

# Load models and vectorizers
MODEL_DIR = os.path.join(os.path.dirname(__file__), '../../models')
URL_MODEL = joblib.load(os.path.join(MODEL_DIR, 'url_model.pkl'))
URL_TFIDF = joblib.load(os.path.join(MODEL_DIR, 'url_tfidf.pkl'))
EMAIL_MODEL = joblib.load(os.path.join(MODEL_DIR, 'email_model.pkl'))
EMAIL_TFIDF = joblib.load(os.path.join(MODEL_DIR, 'email_tfidf.pkl'))

def extract_url_features(url):
    features = []
    features.append(len(url))
    features.append(url.count('.'))
    features.append(url.count('-'))
    features.append(url.count('_'))
    features.append(url.count('@'))
    features.append(url.count('?'))
    features.append(url.count('/'))
    features.append(1 if re.match(r'^\d+\.\d+\.\d+\.\d+$', url) else 0)
    return np.array(features).reshape(1, -1)

@app.route('/predict/url', methods=['POST'])
def predict_url():
    data = request.json
    url = data.get('url', '')
    if not url:
        return jsonify({'error': 'No URL provided'}), 400
    
    # Feature extraction
    features = extract_url_features(url)
    tfidf_feat = URL_TFIDF.transform([url])
    X = hstack([tfidf_feat, features])
    
    prediction = URL_MODEL.predict(X)[0]
    probability = URL_MODEL.predict_proba(X)[0][1]
    
    return jsonify({
        'prediction': 'phishing' if prediction == 1 else 'legitimate',
        'confidence': float(probability) if prediction == 1 else float(1 - probability),
        'score': float(probability)
    })

@app.route('/predict/email', methods=['POST'])
def predict_email():
    data = request.json
    text = data.get('text', '')
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    
    X = EMAIL_TFIDF.transform([text])
    prediction = EMAIL_MODEL.predict(X)[0]
    probability = EMAIL_MODEL.predict_proba(X)[0][1]
    
    return jsonify({
        'prediction': 'phishing' if prediction == 1 else 'legitimate',
        'confidence': float(probability) if prediction == 1 else float(1 - probability),
        'score': float(probability)
    })

if __name__ == '__main__':
    app.run(port=5000)
