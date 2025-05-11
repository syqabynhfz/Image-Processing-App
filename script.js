// Image Processing App - Enhanced and Cleaned Up

const imageInput = document.getElementById('imageInput');
const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
const originalCanvas = document.getElementById('originalCanvas');
const originalCtx = originalCanvas.getContext('2d');
const processedCanvas = document.getElementById('processedCanvas');
const processedCtx = processedCanvas.getContext('2d');
const comparisonSlider = document.getElementById('comparisonSlider');
let comparisonMode = false;

let originalImage = null;

imageInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const maxWidth = 800;
                const maxHeight = 600;
                const scale = Math.min(maxWidth / img.width, maxHeight / img.height);

                // Set canvas size
                canvas.width = originalCanvas.width = processedCanvas.width = img.width * scale;
                canvas.height = originalCanvas.height = processedCanvas.height = img.height * scale;

                // Draw image
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                originalCtx.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
                originalCtx.drawImage(img, 0, 0, originalCanvas.width, originalCanvas.height);
                
                processedCtx.clearRect(0, 0, processedCanvas.width, processedCanvas.height);
                processedCtx.drawImage(canvas, 0, 0, processedCanvas.width, processedCanvas.height);

                originalImage = img;
                
                // Hide comparison by default
                document.querySelector('.comparison-container').style.display = 'none';
                comparisonMode = false;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

function toggleComparison() {
    comparisonMode = !comparisonMode;
    const comparisonContainer = document.querySelector('.comparison-container');
    
    if (comparisonMode) {
        // Update processed canvas
        processedCtx.clearRect(0, 0, processedCanvas.width, processedCanvas.height);
        processedCtx.drawImage(canvas, 0, 0, processedCanvas.width, processedCanvas.height);
        
        comparisonContainer.style.display = 'block';
    } else {
        comparisonContainer.style.display = 'none';
    }
}

comparisonSlider.addEventListener('input', function() {
    if (!comparisonMode) return;
    
    const sliderValue = this.value;
    const container = document.querySelector('.image-comparison');
    
    container.style.position = 'relative';
    
    // Create overlay effect
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = sliderValue + '%';
    overlay.style.height = '100%';
    overlay.style.overflow = 'hidden';
    
    // Clear previous overlay
    const oldOverlay = document.querySelector('.comparison-overlay');
    if (oldOverlay) oldOverlay.remove();
    
    // Create clone of original image
    const originalClone = originalCanvas.cloneNode();
    originalClone.style.width = '100%';
    originalClone.style.height = 'auto';
    
    overlay.appendChild(originalClone);
    overlay.className = 'comparison-overlay';
    container.appendChild(overlay);
});

function isCanvasEmpty() {
    return canvas.width === 0 || canvas.height === 0;
}

function safeProcess(callback) {
    if (isCanvasEmpty()) {
        alert("Please upload an image first.");
        return;
    }
    callback();
}

function resetImage() {
    if (!originalImage) return;
    const scale = Math.min(800 / originalImage.width, 600 / originalImage.height);
    canvas.width = originalImage.width * scale;
    canvas.height = originalImage.height * scale;
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
}

function applyGrayscale() {
    safeProcess(() => {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = data[i + 1] = data[i + 2] = avg;
        }

        ctx.putImageData(imageData, 0, 0);
    });
}

function applyBinary() {
    safeProcess(() => {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const binary = avg > 128 ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = binary;
        }

        ctx.putImageData(imageData, 0, 0);
    });
}

function adjustBrightness(amount) {
    safeProcess(() => {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, Math.max(0, data[i] + amount));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + amount));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + amount));
        }

        ctx.putImageData(imageData, 0, 0);
    });
}

function equalizeHistogram() {
    safeProcess(() => {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const grayValues = [];

        for (let i = 0; i < data.length; i += 4) {
            const gray = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3);
            grayValues.push(gray);
        }

        const histogram = new Array(256).fill(0);
        grayValues.forEach(value => histogram[value]++);

        const cumulativeDistribution = [];
        let cumulativeSum = 0;
        histogram.forEach(value => {
            cumulativeSum += value;
            cumulativeDistribution.push(cumulativeSum);
        });

        const totalPixels = canvas.width * canvas.height;
        const equalizedMap = cumulativeDistribution.map(value => Math.round((value / totalPixels) * 255));

        for (let i = 0; i < data.length; i += 4) {
            const gray = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3);
            const newGray = equalizedMap[gray];
            data[i] = data[i + 1] = data[i + 2] = newGray;
        }

        ctx.putImageData(imageData, 0, 0);
    });
}

function applyAverageFilter() {
    safeProcess(() => {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const width = canvas.width;
        const height = canvas.height;
        const tempData = new Uint8ClampedArray(data);

        const kernel = [
            [1 / 9, 1 / 9, 1 / 9],
            [1 / 9, 1 / 9, 1 / 9],
            [1 / 9, 1 / 9, 1 / 9]
        ];

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let sumR = 0, sumG = 0, sumB = 0;

                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const pixelIndex = ((y + ky) * width + (x + kx)) * 4;
                        const weight = kernel[ky + 1][kx + 1];

                        sumR += tempData[pixelIndex] * weight;
                        sumG += tempData[pixelIndex + 1] * weight;
                        sumB += tempData[pixelIndex + 2] * weight;
                    }
                }

                const currentIndex = (y * width + x) * 4;
                data[currentIndex] = sumR;
                data[currentIndex + 1] = sumG;
                data[currentIndex + 2] = sumB;
            }
        }

        ctx.putImageData(imageData, 0, 0);
    });
}

function applyMedianFilter() {
    safeProcess(() => {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const width = canvas.width;
        const height = canvas.height;
        const tempData = new Uint8ClampedArray(data);

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const neighbors = [];

                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const pixelIndex = ((y + ky) * width + (x + kx)) * 4;
                        const gray = Math.round((tempData[pixelIndex] + tempData[pixelIndex + 1] + tempData[pixelIndex + 2]) / 3);
                        neighbors.push(gray);
                    }
                }

                neighbors.sort((a, b) => a - b);
                const median = neighbors[Math.floor(neighbors.length / 2)];

                const currentIndex = (y * width + x) * 4;
                data[currentIndex] = data[currentIndex + 1] = data[currentIndex + 2] = median;
            }
        }

        ctx.putImageData(imageData, 0, 0);
    });
}

function applyEdgeDetection() {
    safeProcess(() => {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const width = canvas.width;
        const height = canvas.height;
        const tempData = new Uint8ClampedArray(data);

        const sobelX = [
            [-1, 0, 1],
            [-2, 0, 2],
            [-1, 0, 1]
        ];
        const sobelY = [
            [-1, -2, -1],
            [0, 0, 0],
            [1, 2, 1]
        ];

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let gx = 0, gy = 0;

                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const pixelIndex = ((y + ky) * width + (x + kx)) * 4;
                        const gray = Math.round((tempData[pixelIndex] + tempData[pixelIndex + 1] + tempData[pixelIndex + 2]) / 3);

                        gx += gray * sobelX[ky + 1][kx + 1];
                        gy += gray * sobelY[ky + 1][kx + 1];
                    }
                }

                const magnitude = Math.min(255, Math.sqrt(gx * gx + gy * gy));

                const currentIndex = (y * width + x) * 4;
                data[currentIndex] = data[currentIndex + 1] = data[currentIndex + 2] = magnitude;
            }
        }

        ctx.putImageData(imageData, 0, 0);
    });
}

function applyScaling(scale) {
    safeProcess(() => {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        tempCanvas.width = canvas.width * scale;
        tempCanvas.height = canvas.height * scale;

        tempCtx.imageSmoothingEnabled = true;
        tempCtx.imageSmoothingQuality = 'high';
        tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);

        canvas.width = tempCanvas.width;
        canvas.height = tempCanvas.height;

        ctx.drawImage(tempCanvas, 0, 0);
    });
}

// Fungsi rotasi yang bisa menerima berbagai sudut
function rotateImage(angle) {
    safeProcess(() => {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        // Hitung ukuran canvas baru untuk gambar yang dirotasi
        const radians = angle * Math.PI / 180;
        const sin = Math.abs(Math.sin(radians));
        const cos = Math.abs(Math.cos(radians));
        tempCanvas.width = Math.ceil(canvas.width * cos + canvas.height * sin);
        tempCanvas.height = Math.ceil(canvas.width * sin + canvas.height * cos);

        tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
        tempCtx.rotate(radians);
        tempCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);

        canvas.width = tempCanvas.width;
        canvas.height = tempCanvas.height;
        ctx.drawImage(tempCanvas, 0, 0);
    });
}

// Tambahkan fungsi reset
function resetToOriginal() {
    if (originalImage) {
        const scale = Math.min(800 / originalImage.width, 600 / originalImage.height);
        canvas.width = originalImage.width * scale;
        canvas.height = originalImage.height * scale;
        ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    }
}

function downloadImage() {
    safeProcess(() => {
        const link = document.createElement('a');
        link.download = 'processed_image.png';
        link.href = canvas.toDataURL();
        link.click();
    });
}

function safeProcess(callback) {
    if (isCanvasEmpty()) {
        alert("Silakan upload gambar terlebih dahulu.");
        return;
    }
    
    const indicator = document.getElementById('processingIndicator');
    indicator.style.display = 'block';
    
    // Beri jeda agar UI punya waktu update
    setTimeout(() => {
        callback();
        indicator.style.display = 'none';
    }, 100);
}

// Dark Mode Toggle
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    const darkModeBtn = document.getElementById("darkModeToggle");
    
    if (document.body.classList.contains("dark-mode")) {
        darkModeBtn.innerHTML = '<i class="fas fa-sun"></i>';
        darkModeBtn.style.background = "#f8f9fa";
        darkModeBtn.style.color = "#212529";
    } else {
        darkModeBtn.innerHTML = '<i class="fas fa-moon"></i>';
        darkModeBtn.style.background = "#212529";
        darkModeBtn.style.color = "white";
    }
}

function safeProcess(callback) {
    if (isCanvasEmpty()) {
        alert("Silakan upload gambar terlebih dahulu!");
        return;
    }
    
    const indicator = document.getElementById("processingIndicator");
    indicator.style.display = "block";
    
    // Beri sedikit delay agar UI tetap smooth
    setTimeout(() => {
        callback();
        indicator.style.display = "none";
    }, 100);
}
