function blurImageData(imageData, radius) {

    const width = imageData.width;
    const height = imageData.height;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const { r, g, b } = getWeightedAverage(imageData, x, y, radius * 10, width, height);
            setPixel(imageData, x, y, r, g, b);
        }
    }

    return imageData;
}

// (used by blurImageData())
function getWeightedAverage(imageData, x, y, radius, width, height) {
    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    let totalWeight = 0;

    for (let i = -radius; i <= radius; i++) {
        for (let j = -radius; j <= radius; j++) {
            const offsetX = x + i;
            const offsetY = y + j;

            if (offsetX >= 0 && offsetX < width && offsetY >= 0 && offsetY < height) {
                const index = (offsetY * width + offsetX) * 4;
                const weight = 1 / Math.sqrt(i * i + j * j + 1);
                sumR += weight * imageData.data[index];
                sumG += weight * imageData.data[index + 1];
                sumB += weight * imageData.data[index + 2];
                totalWeight += weight;
            }
        }
    }

    return {
        r: Math.floor(sumR / totalWeight),
        g: Math.floor(sumG / totalWeight),
        b: Math.floor(sumB / totalWeight),
    };
}

// (used by blurImageData())
function setPixel(imageData, x, y, r, g, b) {
    const index = (y * imageData.width + x) * 4;
    imageData.data[index] = r;
    imageData.data[index + 1] = g;
    imageData.data[index + 2] = b;
}

function contrastImageData(imageData, radius){
    contrast = radius / 5;
    var intercept = 128 * (1 - contrast);
    const width = imageData.width;
    const height = imageData.height;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            setPixelContrast(imageData, x, y, contrast, intercept);
        }
    }

    return imageData;
}

function setPixelContrast(imageData, x, y, contrast, intercept){
    const index = (y * imageData.width + x) * 4;
    imageData.data[index] = imageData.data[index] * contrast + intercept;
    imageData.data[index + 1] = imageData.data[index + 1] * contrast + intercept;
    imageData.data[index + 2] = imageData.data[index + 2] * contrast + intercept;
}

function invertImageData(imageData, radius){
    const width = imageData.width;
    const height = imageData.height;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            setPixelInvert(imageData, x, y, radius);
        }
    }

    return imageData;
}

function setPixelInvert(imageData, x, y, radius){
    const index = (y * imageData.width + x) * 4;
    const value = radius * 25.5;
    imageData.data[index] = value - imageData.data[index];
    imageData.data[index + 1] = value - imageData.data[index + 1];
    imageData.data[index + 2] = value - imageData.data[index + 2];
}

function grayscaleImageData(imageData, radius){
    const width = imageData.width;
    const height = imageData.height;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            setPixelGrayscale(imageData, x, y, radius);
        }
    }

    return imageData;
}

function setPixelGrayscale(imageData, x, y, radius){
    const index = (y * imageData.width + x) * 4;
    const avg = (imageData.data[index] + imageData.data[index + 1] + imageData.data[index + 2]) / 3;
    radius = radius / 10;
    imageData.data[index] = radius * avg;
    imageData.data[index + 1] = radius * avg;
    imageData.data[index + 2] = radius * avg;
}

