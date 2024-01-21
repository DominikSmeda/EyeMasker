const imageInput = document.getElementById('image-input');
const video = document.getElementById('video')



let container;
let image;
let stream;
let canvas;
let displaySize;
let faceMatcher;
let labeledFaceDescriptors;
let resizedDetections;
let results;



async function initializeFaceRecognition() {
  labeledFaceDescriptors = await loadLabeledImages();
  faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
}

function startCamera() {
  navigator.getUserMedia({ video: {} },
    (streamSource) => {
      stream = streamSource;
      video.srcObject = stream;
    },
    (err) => {
      console.error(err);
      alert(err);
    }
  )
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(function (track) {
      track.stop();
    });
    stream = null;
  }
}

video.addEventListener('play', newCameraDetection);

async function newCameraDetection() {
  let videoContainer = document.getElementById('video-container');

  //remove canvas el inside videoContainer if exists //TO IMPLEMENT
  // for (let elem of videoContainer.getElementsByTagName('canvas')) {
  //   videoContainer.remove(elem);

  // }

  canvas = faceapi.createCanvasFromMedia(video)
  videoContainer.append(canvas);

  displaySize = { width: video.width, height: video.height }
  faceapi.matchDimensions(canvas, displaySize)
  image = video;

  // requestAnimationFrame(cameraDetect);
  setInterval(cameraDetect, 100)
}

async function cameraDetect() {
  if (!stream) return;
  // requestAnimationFrame(cameraDetect);
  // console.log('- Camera detect -')

  detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
  resizedDetections = faceapi.resizeResults(detections, displaySize)
  results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))


  renderDetections();
}

async function newImageDetection() {
  image = await faceapi.bufferToImage(document.getElementById('image-input').files[0]);

  container.innerHTML = ''
  canvas = faceapi.createCanvasFromMedia(image);
  container.append(canvas);

  displaySize = { width: image.width, height: image.height }
  faceapi.matchDimensions(canvas, displaySize);

  let detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors();
  resizedDetections = faceapi.resizeResults(detections, displaySize);
  results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))

  renderDetections();
}

// Use when gui setting options change
async function renderDetections() {


  let ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, displaySize.width, displaySize.height);
  ctx.drawImage(image, 0, 0, displaySize.width, displaySize.height);

  for (let i = 0; i < results.length; i++) {
    let landmarks = resizedDetections[i].landmarks;
    // const jawOutline = landmarks.getJawOutline()
    // const nose = landmarks.getNose()
    // const mouth = landmarks.getMouth()
    const leftEye = landmarks.getLeftEye()
    const rightEye = landmarks.getRightEye()
    // const leftEyeBbrow = landmarks.getLeftEyeBrow()
    // const rightEyeBrow = landmarks.getRightEyeBrow()
    renderEyeBarRegion(leftEye, rightEye, canvas, ctx)
  }

  if (detectionDebugOptions.showFaceLabel) {
    for (let i = 0; i < results.length; i++) {
      let box = resizedDetections[i].detection.box;
      let drawBox = new faceapi.draw.DrawBox(box, { label: results[i].toString() });
      drawBox.draw(canvas);
    }
  }
  else if (detectionDebugOptions.showFaceBox) {
    faceapi.draw.drawDetections(canvas, resizedDetections);
  }

  if (detectionDebugOptions.showFaceLandmarks) {
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
  }

  // if (detectionDebugOptions.showFaceExpression) {
  //     // faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
  // }



}

function renderEyeBarRegion(leftEye, rightEye, canvas, ctx) {

  let l = leftEye[0];
  let p = rightEye[3];

  // ctx.beginPath();
  // ctx.rect(l.x - 2, l.y - 2, 4, 4);
  // ctx.fillStyle = "red";
  // ctx.strokeStyle = 'black';
  // ctx.stroke();
  // ctx.fill()

  // ctx.beginPath();
  // ctx.rect(p.x - 2, p.y - 2, 4, 4);
  // ctx.fillStyle = "green";
  // ctx.strokeStyle = 'black';
  // ctx.stroke();
  // ctx.fill()

  // trzeba zoptymalizować być może w osobnym workerze
  // nie tworzyć cały czas nowego canvasa? i ctx  Liczenie pierwiastka -> sqrt() ?
  let vec = { x: p.x - l.x, y: p.y - l.y }; //eyes line vector

  let a = angleBetween360(vec, { x: 1, y: 0 }); // eyes line angle related to image


  let { width, height } = canvas;

  let eyeWidth = Math.sqrt(Math.pow(p.x - l.x, 2) + Math.pow(p.y - l.y, 2));
  let paddingX = eyeWidth * (0.1);
  let paddingY = eyeWidth * (0.1);
  let barWidth = eyeWidth + 2 * paddingX;
  let barHeight = 2 * paddingY;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;

  const tempCtx = tempCanvas.getContext('2d');

  tempCtx.rotate(-a);
  tempCtx.translate(-l.x, -l.y);
  tempCtx.translate(paddingX, paddingY);

  tempCtx.drawImage(canvas, 0, 0, width, height, 0, 0, width, height);

  let imageData = tempCtx.getImageData(0, 0, barWidth + paddingX / 2, barHeight);

  //COLOR MASK
  // \for (let i = 0; i < imageData.data.length; i += 4) {
  //   imageData.data[i] = imageData.data[i];
  //   imageData.data[i + 1] = imageData.data[i + 1];
  //   imageData.data[i + 2] = 0;
  // }

  tempCtx.clearRect(0, 0, width, height);

  let updateData;
  let mask;

  mask = document.getElementById("mask").value;

  if(mask == "Blur"){
    updateData = blurImageData(imageData, maskOptions.radius);
  }
  
  else if(mask == "Pixel"){
    ctx.translate(-paddingX, -paddingY)
    ctx.translate(l.x, l.y)
    ctx.rotate(a);
    for (let y = 0; y < imageData.height; y += 7){
      for (let x = 0; x < imageData.width; x += 7){
        const index = (y * imageData.width + x) * 4;

        ctx.fillStyle = `rgba(
          ${imageData.data[index]},
          ${imageData.data[index + 1]},
          ${imageData.data[index + 2]},
          ${imageData.data[index + 3]}
        )`;

        ctx.fillRect(x,y,7,7);
      }
    }
  }
  
  else if(mask == "Contrast"){
    updateData = contrastImageData(imageData);
  }

  else if(mask == "Invert"){
    updateData = invertImageData(imageData);
  }

  else if(mask = "Grayscale"){
    updateData = grayscaleImageData(imageData);
  }

  tempCtx.putImageData(updateData, 0, 0);
  // document.body.appendChild(tempCanvas) // TO SEE SELECTED AREA

  ctx.save()
  ctx.translate(-paddingX, -paddingY)
  ctx.translate(l.x, l.y)
  ctx.rotate(a);
  ctx.drawImage(tempCanvas, 0, 0)
  ctx.restore();
}