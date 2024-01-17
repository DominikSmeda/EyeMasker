const inputSourceTypeSelect = document.getElementById('input-source-type-select');
const imageSection = document.getElementById('image-section');
const videoSection = document.getElementById('video-section');



const applyMaskOptions = {
    mode: 'All faces',
    labels: ''
}

const maskOptions = {
    radius: 50
}

const detectionDebugOptions = {
    showFaceBox: true,
    showFaceLandmarks: false,
    showFaceLabel: false,
    // showFaceExpression: true,
}


async function onModelsLoaded() {
    console.log('--- Models Loaded ---')

    document.getElementById('loader-message').innerText = '(2/2) Loading Labeled Images...';
    await initializeFaceRecognition();

    document.getElementById('loader').classList.add('hidden');
    document.getElementById('gui').classList.remove('hidden');

    console.log('--- READY ---')
    initializeGUI();
}


// initialize gui with defaults from config options (above)
function initializeGUI() { // #TO IMPLEMENT



    imageInput.addEventListener('change', newImageDetection)

    setSourceType(inputSourceTypeSelect.value)
}


inputSourceTypeSelect.addEventListener('change', (e) => {
    let type = e.target.value;
    setSourceType(type);
})

async function setSourceType(type) {
    console.log('Source Type: ' + type)
    imageSection.innerHTML = '';

    container = document.createElement('div');
    container.style.position = 'relative';

    imageSection.append(container);

    if (type == 'Image') {
        stopCamera();

        imageInput.value = null;
        imageInput.classList.remove('hidden')
        imageSection.classList.remove('hidden');
        videoSection.classList.add('hidden');

    }
    else if (type == 'Camera') {
        imageInput.classList.add('hidden')
        imageSection.classList.add('hidden');
        videoSection.classList.remove('hidden');

        startCamera();
    }
}