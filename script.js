const video = document.getElementById('video')

const detectionDebugOptions = {
  showFaceBox: true,
  showFaceLandmarks: true,
  showFaceLabels: true,
}

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models')

]).then(start)

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    stream => video.srcObject = stream,
    err => console.error(err)
  )
}

let _canvas;
video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video)
  // canvas.id = "canvas"
  document.getElementById('canvas').append(canvas)
  const displaySize = { width: video.width, height: video.height }
  faceapi.matchDimensions(canvas, displaySize)
  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks()
    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    faceapi.draw.drawDetections(canvas, resizedDetections)
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
    // faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
  }, 100)
})

let imageInput = document.getElementById('image-input');

async function start() {
  const labeledFaceDescriptors = await loadLabeledImages();
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
  console.log('ready')

  document.getElementById('loader').classList.add('hidden')
  document.getElementById('gui').classList.remove('hidden');

  let container = document.createElement('div');
  container.style.position = 'relative';

  let imageSection = document.getElementById('image-section');
  imageSection.append(container);



  imageInput.addEventListener('change', async () => {
    let img = document.getElementById('image-input').files[0];
    let image = await faceapi.bufferToImage(document.getElementById('image-input').files[0]);

    container.innerHTML = ''
    let canvas = faceapi.createCanvasFromMedia(image);
    // container.append(image);
    container.append(canvas);

    const displaySize = { width: image.width, height: image.height }
    faceapi.matchDimensions(canvas, displaySize);

    const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    let results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
    // for (let detection of results) {
    //   let box = detection.detection.box;
    //   let drawBox = new faceapi.draw.DrawBox(box, { label: "Face" });
    //   drawBox.draw(canvas);
    // }
    console.log(resizedDetections)

    let ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0)


    for (let i = 0; i < results.length; i++) {
      let box = resizedDetections[i].detection.box;
      let drawBox = new faceapi.draw.DrawBox(box, { label: results[i].toString() });
      console.log('draw')
      drawBox.draw(canvas);
    }

    await faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)


    console.log(displaySize)
    for (let i = 0; i < results.length; i++) {
      let landmarks = resizedDetections[i].landmarks;
      const jawOutline = landmarks.getJawOutline()
      const nose = landmarks.getNose()
      const mouth = landmarks.getMouth()
      const leftEye = landmarks.getLeftEye()
      const rightEye = landmarks.getRightEye()
      const leftEyeBbrow = landmarks.getLeftEyeBrow()
      const rightEyeBrow = landmarks.getRightEyeBrow()

      getEyeBarRegion(leftEye, rightEye, canvas, ctx);
    }
    // faceapi.draw.drawDetections(canvas, resizedDetections)

  })

  // canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
  // canvas.drawImage(img, 0, 0, canvas.width, canvas.height)
  // faceapi.draw.drawDetections(canvas, resizedDetections)
  // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
  // faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
}


function loadLabeledImages() {
  const labels = ['Black Widow', 'Captain America', 'Captain Marvel', 'Hawkeye', 'Jim Rhodes', 'Thor', 'Tony Stark']

  return Promise.all(
    labels.map(async (label) => {
      const descriptions = [];
      for (let i = 1; i <= 2; i++) {
        const img = await faceapi.fetchImage(`labeled_images/${label}/${i}.jpg`);
        // let img = new Image()
        // img.src = `./labeled_images/${label}/${i}.jpg`;
        // img = await faceapi.bufferToImage(img)
        // console.log(await faceapi.bufferToImage(img))
        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
        descriptions.push(detections.descriptor)
      }

      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  )
}



function getEyeBarRegion(leftEye, rightEye, canvas, ctx) {

  let l = leftEye[0];

  // ctx.beginPath();
  // ctx.rect(l.x - 2, l.y - 2, 4, 4);
  // ctx.fillStyle = "red";
  // ctx.strokeStyle = 'black';
  // ctx.stroke();
  // ctx.fill()

  let p = rightEye[3];

  // ctx.beginPath();
  // ctx.rect(p.x - 2, p.y - 2, 4, 4);
  // ctx.fillStyle = "green";
  // ctx.strokeStyle = 'black';
  // ctx.stroke();
  // ctx.fill()

  // console.log(p.x, p.y)
  let vec = { x: p.x - l.x, y: p.y - l.y };
  // console.log(vec)
  let a = angleBetween360(vec, { x: 1, y: 0 });
  // console.log(a)

  let center = { x: vec.x / 2, y: vec.y / 2 };


  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');

  let { width, height } = canvas;
  console.log('www ', width)

  tempCanvas.width = width;
  tempCanvas.height = height;


  let eyeWidth = Math.sqrt(Math.pow(p.x - l.x, 2) + Math.pow(p.y - l.y, 2));
  let paddingX = eyeWidth * (0.1);
  let paddingY = eyeWidth * (0.1);

  tempCtx.rotate(-a);
  tempCtx.translate(-l.x, -l.y);
  tempCtx.translate(paddingX, paddingY);
  tempCtx.strokeStyle = 'purple'



  let barWidth = eyeWidth + 2 * paddingX;
  let barHeight = 2 * paddingY;
  tempCtx.drawImage(canvas, 0, 0, width, height, 0, 0, width, height);

  let imageData = tempCtx.getImageData(0, 0, barWidth + paddingX / 2, barHeight);
  // for (let i = 0; i < imageData.data.length; i += 4) {
  //   imageData.data[i] = imageData.data[i];
  //   imageData.data[i + 1] = imageData.data[i + 1];
  //   imageData.data[i + 2] = 0;
  // }
  tempCtx.clearRect(0, 0, width, height);
  tempCtx.putImageData(blurImageData(imageData), 0, 0);

  ctx.save()
  ctx.translate(-paddingX, -paddingY)
  ctx.translate(l.x, l.y)
  ctx.rotate(a);
  ctx.drawImage(tempCanvas, 0, 0)
  ctx.restore();
  // ctx.drawImage(tempCanvas, 0, 0)
  // document.body.appendChild(tempCanvas)

}


function blurImageData(imageData) {
  // Apply blur to the imageData using a simple box blur algorithm
  // You can replace this with a more sophisticated blur algorithm if needed

  // Example: Box blur
  const radius = 50;
  const width = imageData.width;
  const height = imageData.height;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const { r, g, b } = getWeightedAverage(imageData, x, y, radius, width, height);
      setPixel(imageData, x, y, r, g, b);
    }
  }

  return imageData;
}

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
        const weight = 1 / Math.sqrt(i * i + j * j + 1); // Adjust the weight function as needed
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

function setPixel(imageData, x, y, r, g, b) {
  const index = (y * imageData.width + x) * 4;
  imageData.data[index] = r;
  imageData.data[index + 1] = g;
  imageData.data[index + 2] = b;
}





function dot(vec1, vec2) {
  return Number(vec2.x * vec1.x) + Number(vec2.y * vec1.y);
}

function det(vec1, vec2) {
  return Number(vec2.x * vec1.y) - Number(vec2.y * vec1.x);
}

function angleBetween360(vec1, vec2) {
  return Math.atan2(det(vec1, vec2), dot(vec1, vec2))
}