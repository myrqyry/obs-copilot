import {
    ImageClassifier,
    FilesetResolver
} from "https://unpkg.com/@mediapipe/tasks-vision@0.10.3/vision_bundle.js";

let imageClassifier;
const runningMode = "IMAGE";

// Initialize the object detector
const classifyButton = document.getElementById("classify-button");

const initializeImageClassifier = async () => {
    classifyButton.innerText = "Loading model...";
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );
    imageClassifier = await ImageClassifier.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/image_classifier/efficientnet_lite0/float32/1/efficientnet_lite0.tflite`,
            delegate: "GPU"
        },
        runningMode: runningMode,
        maxResults: 1
    });
    classifyButton.disabled = false;
    classifyButton.innerText = "Classify";
};
initializeImageClassifier();

const imageInput = document.getElementById("image-input");
const resultsDiv = document.getElementById("results");

classifyButton.addEventListener("click", async () => {
    const [file] = imageInput.files;
    if (file) {
        const image = new Image();
        image.src = URL.createObjectURL(file);
        image.onload = async () => {
            const results = await imageClassifier.classify(image);
            displayResults(results);
        };
    }
});

function displayResults(results) {
    resultsDiv.innerHTML = ""; // Clear previous results
    if (results.classifications.length > 0) {
        const topResult = results.classifications[0].categories[0];
        resultsDiv.innerHTML = `
            <p><strong>Prediction:</strong> ${topResult.categoryName}</p>
            <p><strong>Confidence:</strong> ${(topResult.score * 100).toFixed(2)}%</p>
        `;
    } else {
        resultsDiv.innerHTML = "<p>No classification found.</p>";
    }
}