import './style.css';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

const spinner = document.querySelector('.spinner') as HTMLDivElement;

async function main() {
    spinner.style.display = 'block';
    const images = document.querySelectorAll(
        'img'
    ) as NodeListOf<HTMLImageElement>;

    const form = document.querySelector('form') as HTMLFormElement;
    const imagesList = document.querySelector('.images') as HTMLUListElement;

    try {
        // Ensure TensorFlow.js is ready
        await tf.ready();

        // Load the COCO-SSD model
        const model = await cocoSsd.load();
        console.log('Model loaded');
        spinner.style.display = 'none';

        // Process initial images on the page
        for (const image of images) {
            try {
                const predictions = await model.detect(image);
                if (predictions && predictions.length > 0) {
                    image.parentElement?.insertAdjacentHTML(
                        'beforeend',
                        `<div class="predictions">
                            <p>${predictions[0].class}</p>
                            <p>Score: ${predictions[0].score.toFixed(2)}</p>
                        </div>`
                    );
                }
            } catch (err) {
                console.error('Error detecting objects in image:', err);
            }
        }

        // Handle file uploads
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const input = document.querySelector(
                'input[type="file"]'
            ) as HTMLInputElement;
            const file = input.files?.[0];

            if (file) {
                spinner.style.display = 'block';
                const reader = new FileReader();

                reader.onload = (e) => {
                    const imgElement = document.createElement('img');
                    imgElement.src = e.target?.result as string;

                    const liElement = document.createElement('li');
                    liElement.appendChild(imgElement);
                    imagesList.appendChild(liElement);

                    // Wait for the image to load before detecting objects
                    imgElement.onload = async () => {
                        try {
                            const predictions = await model.detect(imgElement);
                            console.log(predictions);

                            if (predictions && predictions.length > 0) {
                                for (const prediction of predictions) {
                                    liElement.insertAdjacentHTML(
                                        'beforeend',
                                        `<div class="predictions">
                                            <p>${prediction.class}</p>
                                            <p>Score: ${prediction.score.toFixed(
                                                2
                                            )}</p>
                                        </div>`
                                    );
                                }
                            } else {
                                liElement.insertAdjacentHTML(
                                    'beforeend',
                                    `<div class="predictions">
                                        <p>No objects detected</p>
                                    </div>`
                                );
                            }
                        } catch (err) {
                            console.error('Error detecting objects:', err);
                            liElement.insertAdjacentHTML(
                                'beforeend',
                                `<div class="predictions error">
                                    <p>Error detecting objects</p>
                                </div>`
                            );
                        } finally {
                            spinner.style.display = 'none';
                            // Clear the file input
                            input.value = '';
                        }
                    };
                };

                reader.onerror = () => {
                    console.error('Error reading file');
                    spinner.style.display = 'none';
                    alert('Error reading file');
                };

                reader.readAsDataURL(file);
            }
        });
    } catch (error) {
        console.error('Error loading or using model:', error);
        spinner.style.display = 'none';
        alert(
            `Error loading model: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }
}

main().catch((err) => {
    console.error(err);
    spinner.style.display = 'none';
    alert('Error loading model');
});
