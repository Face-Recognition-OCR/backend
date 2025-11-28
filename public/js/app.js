// ===== Configuration =====
const CONFIG = {
    API_BASE_URL: '/api',
    MIN_FACE_CONFIDENCE: 0.5,
    FACE_WIDTH: 224,
    FACE_HEIGHT: 224,
    MAX_REALTIME_DETECTIONS: 10
};

// ===== State Management =====
let state = {
    addCamera: {
        stream: null,
        isRunning: false,
        faceDetector: null,
        capturedFace: null
    },
    realtime: {
        stream: null,
        isRunning: false,
        faceDetector: null,
        detections: [],
        animationFrameId: null
    }
};

// ===== MediaPipe Face Detection Initialization =====
async function initializeFaceDetection() {
    try {
        // Check if vision module is loaded
        if (!window.vision) {
            console.error('MediaPipe vision module not loaded');
            showAlert('Lỗi: MediaPipe chưa tải xong', 'danger');
            return false;
        }

        const { FaceDetector, FilesetResolver } = window.vision;

        console.log('Loading WASM...');
        const wasmModule = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );

        console.log('Creating FaceDetector...');
        const faceDetector = await FaceDetector.createFromOptions(wasmModule, {
            baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite"
            },
            runningMode: "VIDEO",
            minDetectionConfidence: 0.5
        });

        state.addCamera.faceDetector = faceDetector;
        state.realtime.faceDetector = faceDetector;
        console.log("✓ Face Detection initialized successfully");
        return true;
    } catch (error) {
        console.error("Error initializing Face Detection:", error);
        showAlert('Lỗi khởi tạo Face Detection: ' + error.message, 'danger');
        return false;
    }
}

// ===== Tab 1: Thêm Khuôn Mặt =====

// Start Add Camera
$('#startAddCamera').on('click', async function() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });

        const video = document.getElementById('addCameraVideo');
        video.srcObject = stream;

        state.addCamera.stream = stream;
        state.addCamera.isRunning = true;

        $('#startAddCamera').prop('disabled', true);
        $('#stopAddCamera').prop('disabled', false);
        $('#captureAddFace').prop('disabled', false);

        // Wait for video to be ready
        video.onloadedmetadata = () => {
            video.play();
            console.log('Add camera video started');
        };
    } catch (error) {
        console.error('Error accessing camera:', error);
        showAlert('Không thể truy cập webcam. Vui lòng kiểm tra quyền truy cập.', 'danger');
    }
});

// Stop Add Camera
$('#stopAddCamera').on('click', function() {
    if (state.addCamera.stream) {
        state.addCamera.stream.getTracks().forEach(track => track.stop());
        state.addCamera.stream = null;
    }

    state.addCamera.isRunning = false;
    document.getElementById('addCameraVideo').srcObject = null;

    $('#startAddCamera').prop('disabled', false);
    $('#stopAddCamera').prop('disabled', true);
    $('#captureAddFace').prop('disabled', true);
});

// Capture Add Face
$('#captureAddFace').on('click', async function() {
    if (!state.addCamera.isRunning) return;

    if (!state.addCamera.faceDetector) {
        showAlert('Face Detection chưa sẵn sàng. Vui lòng chờ...', 'warning');
        return;
    }

    try {
        const video = document.getElementById('addCameraVideo');
        const canvas = document.getElementById('processedFaceCanvas');
        const ctx = canvas.getContext('2d');

        // Detect faces using MediaPipe
        console.log('Detecting faces...');
        const detections = await state.addCamera.faceDetector.detectForVideo(video, performance.now());

        console.log('Detections:', detections);

        if (!detections.detections || detections.detections.length === 0) {
            showAlert('Không phát hiện khuôn mặt. Vui lòng thử lại.', 'warning');
            return;
        }

        // Get the first (largest) detected face
        const detection = detections.detections[0];
        const boundingBox = detection.boundingBox;

        console.log('Bounding box:', boundingBox);

        // Extract and display face
        const faceImage = extractAndAlignFace(video, boundingBox);

        // Set canvas size and display
        canvas.width = CONFIG.FACE_WIDTH;
        canvas.height = CONFIG.FACE_HEIGHT;
        ctx.putImageData(faceImage, 0, 0);
        canvas.classList.remove('hidden-canvas');
        canvas.style.display = 'block';

        // Store face data
        state.addCamera.capturedFace = {
            imageData: canvas.toDataURL('image/jpeg', 0.95),
            confidence: detection.categories[0].score,
            timestamp: new Date().toISOString()
        };

        // Show detection info
        showDetectionInfo(detection);

        // Enable submit button
        $('#submitFace').prop('disabled', false);

        // Hide placeholder
        $('#noImagePlaceholder').hide();

        showAlert('Chụp ảnh thành công!', 'success');
    } catch (error) {
        console.error('Error capturing face:', error);
        showAlert('Lỗi khi chụp ảnh: ' + error.message, 'danger');
    }
});

// Extract and align face
function extractAndAlignFace(video, boundingBox) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Get video dimensions
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    console.log('Video dimensions:', videoWidth, 'x', videoHeight);
    console.log('Bounding box raw:', boundingBox);

    // MediaPipe v0.10 returns absolute pixel values or normalized values
    // Check if values are normalized (0-1) or absolute pixels
    let x, y, width, height;

    if (boundingBox.originX <= 1 && boundingBox.originY <= 1) {
        // Normalized coordinates
        x = boundingBox.originX * videoWidth;
        y = boundingBox.originY * videoHeight;
        width = boundingBox.width * videoWidth;
        height = boundingBox.height * videoHeight;
    } else {
        // Absolute pixel coordinates
        x = boundingBox.originX;
        y = boundingBox.originY;
        width = boundingBox.width;
        height = boundingBox.height;
    }

    console.log('Calculated face region:', { x, y, width, height });

    // Add padding for better face crop
    const padding = 0.15;
    const paddedX = Math.max(0, x - width * padding);
    const paddedY = Math.max(0, y - height * padding);
    const paddedWidth = Math.min(videoWidth - paddedX, width * (1 + 2 * padding));
    const paddedHeight = Math.min(videoHeight - paddedY, height * (1 + 2 * padding));

    console.log('Padded region:', { paddedX, paddedY, paddedWidth, paddedHeight });

    // Create temporary canvas for cropping
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = paddedWidth;
    tempCanvas.height = paddedHeight;

    tempCtx.drawImage(
        video,
        paddedX, paddedY, paddedWidth, paddedHeight,
        0, 0, paddedWidth, paddedHeight
    );

    // Resize to standard face size
    canvas.width = CONFIG.FACE_WIDTH;
    canvas.height = CONFIG.FACE_HEIGHT;
    ctx.drawImage(tempCanvas, 0, 0, CONFIG.FACE_WIDTH, CONFIG.FACE_HEIGHT);

    console.log('Face extracted successfully');
    return ctx.getImageData(0, 0, CONFIG.FACE_WIDTH, CONFIG.FACE_HEIGHT);
}

// Show detection info
function showDetectionInfo(detection) {
    const confidence = (detection.categories[0].score * 100).toFixed(2);
    const info = `
        <strong>Độ tin cậy:</strong> ${confidence}%<br>
        <strong>Thời gian:</strong> ${new Date().toLocaleTimeString()}
    `;

    $('#detectionInfo').html(info);
    $('#detectionStatus').show();
}

// Submit face to server
$('#submitFace').on('click', async function() {
    const personName = $('#personName').val().trim();

    if (!personName) {
        showAlert('Vui lòng nhập tên người!', 'warning');
        return;
    }

    if (!state.addCamera.capturedFace) {
        showAlert('Vui lòng chụp ảnh trước!', 'warning');
        return;
    }

    $(this).prop('disabled', true);
    showLoadingMessage('Đang gửi ảnh lên server...');

    try {
        // Convert data URL to base64 (remove data:image/jpeg;base64, prefix)
        const base64Image = state.addCamera.capturedFace.imageData.split(',')[1];

        const response = await fetch(`${CONFIG.API_BASE_URL}/face/embed`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: personName + '_' + Date.now(),
                image_base64: base64Image,
                metadata: {
                    name: personName,
                    confidence: state.addCamera.capturedFace.confidence,
                    timestamp: state.addCamera.capturedFace.timestamp
                }
            })
        });

        const data = await response.json();

        if (response.ok) {
            showSuccessMessage(`Thêm ${personName} thành công!`);

            // Reset form
            $('#personName').val('');
            state.addCamera.capturedFace = null;
            $('#submitFace').prop('disabled', true);

            // Clear canvas
            document.getElementById('processedFaceCanvas').style.display = 'none';
            document.getElementById('processedFaceCanvas').classList.add('hidden-canvas');
            $('#noImagePlaceholder').show();
            $('#detectionStatus').hide();
        } else {
            showErrorMessage(data.error || data.message || 'Lỗi khi gửi ảnh');
        }
    } catch (error) {
        console.error('Error submitting face:', error);
        showErrorMessage('Lỗi kết nối với server: ' + error.message);
    } finally {
        $('#submitFace').prop('disabled', false);
    }
});

// ===== Tab 2: Realtime Detection =====

// Start Realtime Camera
$('#startRealtimeCamera').on('click', async function() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });

        const video = document.getElementById('realtimeCameraVideo');
        const canvas = document.getElementById('realtimeCanvas');

        video.srcObject = stream;

        state.realtime.stream = stream;
        state.realtime.isRunning = true;

        $('#startRealtimeCamera').prop('disabled', true);
        $('#stopRealtimeCamera').prop('disabled', false);

        // Wait for video to be ready before starting detection
        video.onloadedmetadata = () => {
            video.play();

            // Setup canvas dimensions immediately
            const videoWidth = video.videoWidth || 1280;
            const videoHeight = video.videoHeight || 720;

            canvas.width = videoWidth;
            canvas.height = videoHeight;

            console.log('✓ Video stream started:');
            console.log('  - Video dimensions:', videoWidth, 'x', videoHeight);
            console.log('  - Canvas dimensions:', canvas.width, 'x', canvas.height);

            // Make canvas visible
            canvas.style.display = 'block';

            // Start detection immediately (no timeout)
            setTimeout(() => {
                startRealtimeDetection();
            }, 100);
        };
    } catch (error) {
        console.error('Error accessing camera:', error);
        showAlert('Không thể truy cập webcam. Vui lòng kiểm tra quyền truy cập.', 'danger');
    }
});

// Stop Realtime Camera
$('#stopRealtimeCamera').on('click', function() {
    if (state.realtime.stream) {
        state.realtime.stream.getTracks().forEach(track => track.stop());
        state.realtime.stream = null;
    }

    state.realtime.isRunning = false;
    document.getElementById('realtimeCameraVideo').srcObject = null;
    document.getElementById('realtimeCanvas').style.display = 'none';

    if (state.realtime.animationFrameId) {
        cancelAnimationFrame(state.realtime.animationFrameId);
    }

    $('#startRealtimeCamera').prop('disabled', false);
    $('#stopRealtimeCamera').prop('disabled', true);

    // Clear detections
    state.realtime.detections = [];
    updateDetectionList();
});

// Start realtime detection loop
function startRealtimeDetection() {
    if (!state.realtime.faceDetector) {
        showAlert('Face Detector không sẵn sàng', 'warning');
        return;
    }

    const video = document.getElementById('realtimeCameraVideo');
    const canvas = document.getElementById('realtimeCanvas');

    if (!canvas) {
        console.error('❌ Canvas not found');
        return;
    }

    if (!video) {
        console.error('❌ Video not found');
        return;
    }

    const ctx = canvas.getContext('2d');

    if (!ctx) {
        console.error('❌ Canvas context not found');
        return;
    }

    // Ensure canvas has proper dimensions
    if (canvas.width === 0 || canvas.height === 0) {
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
    }

    console.log('✓ Starting detection with canvas:', canvas.width, 'x', canvas.height);

    async function detect() {
        if (!state.realtime.isRunning) return;

        try {
            // Ensure canvas is visible
            if (canvas.style.display === 'none') {
                canvas.style.display = 'block';
            }

            const detections = await state.realtime.faceDetector.detectForVideo(video, performance.now());

            // Draw video frame to canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Process detections
            state.realtime.detections = [];

            if (detections.detections && detections.detections.length > 0) {
                console.log('Detections found:', detections.detections.length);
                detections.detections.forEach((detection, index) => {
                    console.log('=== DETECTION', index, '===');
                    console.log('Full detection object:');
                    console.log(JSON.stringify(detection, null, 2));
                    console.log('BoundingBox object:', detection.boundingBox);
                    console.log('BoundingBox keys:', Object.keys(detection.boundingBox));
                    console.log('Categories:', detection.categories);

                    if (detection.categories[0].score >= CONFIG.MIN_FACE_CONFIDENCE) {
                        console.log('✓ Drawing face', index, 'with confidence', detection.categories[0].score);
                        // Draw bounding box
                        drawBoundingBox(ctx, detection, canvas);

                        // Store detection info
                        state.realtime.detections.push({
                            id: index,
                            confidence: detection.categories[0].score,
                            timestamp: new Date().toLocaleTimeString()
                        });
                    }
                });
            }

            // Update detection list
            updateDetectionList();
        } catch (error) {
            console.error('Detection error:', error);
        }

        state.realtime.animationFrameId = requestAnimationFrame(detect);
    }

    detect();
}

// Draw bounding box
function drawBoundingBox(ctx, detection, canvas) {
    const boundingBox = detection.boundingBox;
    const confidence = detection.categories[0].score;

    let x, y, width, height;

    const originX = boundingBox.originX;
    const originY = boundingBox.originY;
    const boxWidth = boundingBox.width;
    const boxHeight = boundingBox.height;

    console.log('Raw boundingBox values:', { originX, originY, boxWidth, boxHeight });

    // Detect coordinate system
    // If originX/Y are extremely large (> canvas dimensions), they might be scaled
    if (originX > canvas.width * 2 || originY > canvas.height * 2) {
        // Likely integer pixel coordinates that need scaling
        // Try to detect if they're in a normalized 0-1000000 scale
        if (originX > 100000 || originY > 100000) {
            // Assume 0-1000000 scale, convert to 0-1
            x = (originX / 1000000) * canvas.width;
            y = (originY / 1000000) * canvas.height;
            width = (boxWidth / 1000000) * canvas.width;
            height = (boxHeight / 1000000) * canvas.height;
            console.log('Detected 0-1000000 scale');
        } else {
            // Direct pixel coordinates
            x = originX;
            y = originY;
            width = boxWidth;
            height = boxHeight;
            console.log('Using direct pixel coordinates');
        }
    } else if (originX <= 1 && originY <= 1 && boxWidth <= 1 && boxHeight <= 1) {
        // Normalized coordinates (0-1)
        x = originX * canvas.width;
        y = originY * canvas.height;
        width = boxWidth * canvas.width;
        height = boxHeight * canvas.height;
        console.log('Using normalized 0-1 coordinates');
    } else {
        // Direct pixel coordinates
        x = originX;
        y = originY;
        width = boxWidth;
        height = boxHeight;
        console.log('Using direct pixel coordinates (default)');
    }

    // Clamp values to canvas bounds
    x = Math.max(0, Math.min(x, canvas.width - 1));
    y = Math.max(0, Math.min(y, canvas.height - 1));
    width = Math.min(width, canvas.width - x);
    height = Math.min(height, canvas.height - y);

    console.log('Final coordinates:', { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) });

    // Only draw if coordinates are valid
    if (width > 5 && height > 5) {
        // Draw rectangle with green color
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        // Draw filled background for label
        const label = `Face ${(confidence * 100).toFixed(1)}%`;
        const fontSize = 16;
        ctx.font = `bold ${fontSize}px Arial`;

        const textMetrics = ctx.measureText(label);
        const textWidth = textMetrics.width;
        const textHeight = fontSize + 4;

        const labelX = Math.max(x, 0);
        const labelY = Math.max(y - textHeight - 2, 0);

        // Draw label background
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.fillRect(labelX, labelY, textWidth + 8, textHeight + 2);

        // Draw label text
        ctx.fillStyle = '#000000';
        ctx.fillText(label, labelX + 4, labelY + fontSize + 1);

        console.log('✓ Rectangle drawn successfully');
    } else {
        console.warn('⚠ Invalid or too small coordinates - rectangle not drawn', { width, height });
    }

    // Attempt to recognize face from server (optional)
    recognizeFace(detection, x, y, width, height);
}

// Recognize face (send to server for identification)
async function recognizeFace(detection, x, y, width, height) {
    try {
        // You can extract face image and send to server for recognition
        // This is a placeholder for the recognition logic
    } catch (error) {
        console.error('Recognition error:', error);
    }
}

// Update detection list display
function updateDetectionList() {
    const list = $('#detectionList');

    if (state.realtime.detections.length === 0) {
        list.html('<div class="text-muted text-center py-5"><p>Chưa phát hiện khuôn mặt nào</p></div>');
        return;
    }

    let html = '';
    state.realtime.detections.slice(0, CONFIG.MAX_REALTIME_DETECTIONS).forEach((detection, index) => {
        const confidence = (detection.confidence * 100).toFixed(2);
        html += `
            <div class="detection-item success">
                <strong>Khuôn mặt #${index + 1}</strong><br>
                <small>Độ tin cậy: ${confidence}%</small><br>
                <small>Thời gian: ${detection.timestamp}</small>
            </div>
        `;
    });

    list.html(html);
}

// ===== Helper Functions =====

function showAlert(message, type = 'info') {
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert" style="position: fixed; top: 20px; right: 20px; z-index: 1000; max-width: 400px;">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;

    $('body').append(alertHtml);

    setTimeout(() => {
        $('.alert:last').fadeOut(() => $('.alert:last').remove());
    }, 4000);
}

function showLoadingMessage(message) {
    const messageDiv = $('#submitMessage');
    messageDiv.html(`<div class="alert alert-info">${message}</div>`).show();
}

function showSuccessMessage(message) {
    const messageDiv = $('#submitMessage');
    messageDiv.html(`<div class="alert alert-success">${message}</div>`).show();

    setTimeout(() => {
        messageDiv.fadeOut(() => {
            messageDiv.hide();
            messageDiv.html('');
        });
    }, 3000);
}

function showErrorMessage(message) {
    const messageDiv = $('#submitMessage');
    messageDiv.html(`<div class="alert alert-danger">${message}</div>`).show();

    setTimeout(() => {
        messageDiv.fadeOut();
    }, 5000);
}

// ===== Initialization =====
$(document).ready(async function() {
    console.log('Initializing Face Recognition System...');

    // Wait for MediaPipe vision module to load
    let attempts = 0;
    while (!window.vision && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }

    if (!window.vision) {
        console.error('MediaPipe vision module failed to load');
        showAlert('Lỗi: MediaPipe không tải được. Vui lòng tải lại trang.', 'danger');
        return;
    }

    console.log('✓ MediaPipe vision module loaded');

    // Initialize face detection
    const initialized = await initializeFaceDetection();

    if (initialized) {
        console.log('✓ Face Recognition System ready!');
        showAlert('Hệ thống sẵn sàng!', 'success');
    }
});

// Clean up on page unload
$(window).on('beforeunload', function() {
    if (state.addCamera.stream) {
        state.addCamera.stream.getTracks().forEach(track => track.stop());
    }
    if (state.realtime.stream) {
        state.realtime.stream.getTracks().forEach(track => track.stop());
    }
});
