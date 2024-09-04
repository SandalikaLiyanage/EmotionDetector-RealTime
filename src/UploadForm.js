import React, { useState, useRef } from 'react';
import axios from 'axios';
import Webcam from 'react-webcam';
import './Uploadfrom.css';

const UploadForm = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [mediaType, setMediaType] = useState('webcam');
    const [detectedFaces, setDetectedFaces] = useState([]);
    const webcamRef = useRef(null);
    const [capturedImage, setCapturedImage] = useState(null);

    const handleMediaTypeChange = (event) => {
        setMediaType(event.target.value);
        setSelectedFile(null);
        setCapturedImage(null);
        setDetectedFaces([]);
    };

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
        setCapturedImage(URL.createObjectURL(event.target.files[0]));
    };

    const handleCapture = async () => {
        if (mediaType === 'webcam') {
            const imageSrc = webcamRef.current.getScreenshot();
            setCapturedImage(imageSrc);
            const blob = await fetch(imageSrc).then(res => res.blob());
            await handleEmotionDetection(blob, 'webcam_capture.jpg');
        }
    };

    const handleEmotionDetection = async (imageBlob, filename) => {
        const formData = new FormData();
        formData.append('image', imageBlob, filename);

        try {
            const response = await axios.post('http://127.0.0.1:5000/predict_emotion', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setDetectedFaces(response.data.detected_faces);
        } catch (error) {
            console.error('Error uploading the image', error);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (mediaType === 'file' && selectedFile) {
            const blob = await fetch(capturedImage).then(res => res.blob());
            await handleEmotionDetection(blob, selectedFile.name);
        } else {
            await handleCapture();
        }
    };

    return (
        <div className="container">
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Select Media Type: </label>
                    <select value={mediaType} onChange={handleMediaTypeChange}>
                        <option value="webcam">Webcam</option>
                        <option value="file">Upload Photo</option>
                    </select>
                </div>

                {mediaType === 'file' && (
                    <div>
                        <input type="file" accept="image/*" onChange={handleFileChange} />
                    </div>
                )}

                {mediaType === 'webcam' && (
                    <div className="webcam-container">
                        <Webcam ref={webcamRef} screenshotFormat="image/jpeg" />
                    </div>
                )}

                <button type="submit">Capture and Predict Emotion</button>
            </form>

            {capturedImage && (
                <div className="preview-container">
                    <h3>Preview:</h3>
                    <img src={capturedImage} alt="Captured" width="400" />
                </div>
            )}

            {detectedFaces.length > 0 && (
                <div>
                    <h3>Detected Emotions:</h3>
                    {detectedFaces.map((face, index) => (
                        <p key={index}>{face.emotion}</p>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UploadForm;
