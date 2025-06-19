from flask import Flask, request, jsonify
from transformers import pipeline
from flask_cors import CORS
 
app = Flask(__name__)
CORS(app, resources={r"/analyze-review": {"origins": "*"}}, methods=["POST"])
classifier = pipeline("sentiment-analysis", model="nlptown/bert-base-multilingual-uncased-sentiment")
 
CATEGORIES = {
    "AmenitiesRate": ["pool", "gym", "spa", "sauna", "fitness", "jacuzzi"],
    "CleanlinessRate": ["clean", "dirty", "hygiene", "tidy"],
    "FoodBeverage": ["food", "breakfast", "restaurant", "drink", "buffet"],
    "SleepQuality": ["bed", "sleep", "quiet", "pillow", "noise"],
    "InternetQuality": ["wifi", "internet", "network", "signal", "connection"],
    "LocationRating": ["location", "area", "near", "neighborhood", "walk", "distance"],
    "ServiceRating": ["staff", "service", "helpful", "friendly", "reception", "support"],
    "ValueRating": ["price", "value", "worth", "cost", "expensive", "cheap", "deal"]
}
 
def extract_sentiment_score(text):
    result = classifier(text[:512])[0]
    label = result['label']
    stars = int(label[0])
    confidence = result['score']
    raw_score = stars + confidence - 1
    scaled = round(raw_score * 2, 1)
    return min(max(scaled, 1.0), 10.0)
 
def analyze_review_content(text):
    text_lower = text.lower()
    scores = {}
    for category, keywords in CATEGORIES.items():
        relevant_sentences = [s for s in text_lower.split('.') if any(k in s for k in keywords)]
        combined = '. '.join(relevant_sentences) if relevant_sentences else text
        scores[category] = extract_sentiment_score(combined)
 
    scores["OverallRating"] = round(sum(scores.values()) / len(scores), 1)
    return scores
 
@app.route("/analyze-review", methods=["POST"])
def analyze():
    data = request.json
    content = data.get("content", "")
    if not content:
        return jsonify({"error": "No review content provided"}), 400
    scores = analyze_review_content(content)
    return jsonify(scores)
 
if __name__ == "__main__":
    app.run(debug=True, port=5001)