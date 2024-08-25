from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
import cv2
import numpy as np
from keras.models import model_from_json

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load the model architecture and weights
with open("model_architecture.json", "r") as json_file:
    loaded_model_json = json_file.read()
emotion_model = model_from_json(loaded_model_json)
emotion_model.load_weights("model_weights.weights.h5")

emotion_dict = {0: 'Angry', 1: 'Disgusted', 2: 'Fearful', 3: 'Happy', 4: 'Neutral', 5: 'Sad', 6: 'Surprised'}

@app.route('/predict_emotion', methods=['POST'])
def predict_emotion():
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400
    
    file = request.files['image'].read()
    npimg = np.frombuffer(file, np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

    gray_frame = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    face_detector = cv2.CascadeClassifier('haarcascades/haarcascade_frontalface_default.xml')
    faces = face_detector.detectMultiScale(gray_frame, scaleFactor=1.3, minNeighbors=5)

    if len(faces) == 0:
        return jsonify({"error": "No face detected"}), 400

    for (x, y, w, h) in faces:
        roi_gray_frame = gray_frame[y:y + h, x:x + w]
        cropped_img = np.expand_dims(np.expand_dims(cv2.resize(roi_gray_frame, (48, 48)), -1), 0)

        emotion_prediction = emotion_model.predict(cropped_img)
        maxindex = int(np.argmax(emotion_prediction))

        return jsonify({"emotion": emotion_dict[maxindex]}), 200

if __name__ == '__main__':
    app.run(debug=True)
