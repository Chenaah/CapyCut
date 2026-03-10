const videoInput = document.getElementById('videoInput');
const videoPlayer = document.getElementById('videoPlayer');
const videoSource = document.getElementById('videoSource');
const fileName = document.getElementById('fileName');
const currentFrameEl = document.getElementById('currentFrame');
const totalFramesEl = document.getElementById('totalFrames');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const fpsEl = document.getElementById('fps');
const prevFrameBtn = document.getElementById('prevFrame');
const nextFrameBtn = document.getElementById('nextFrame');
const overlayCanvas = document.getElementById('overlayCanvas');
const ctx = overlayCanvas.getContext('2d');
const coordinatesEl = document.getElementById('coordinates');
const coordinateRow = document.getElementById('coordinateRow');
const clearDotBtn = document.getElementById('clearDot');
const toggleDotModeBtn = document.getElementById('toggleDotMode');
const videoContainer = document.getElementById('videoContainer');
const saveScreenshotBtn = document.getElementById('saveScreenshot');

let fps = 30; // Default FPS, will be updated when possible
let totalFrames = 0;
let currentFrame = 0;
let dotPosition = null; // Store dot position {x, y}
let dotModeActive = false;

// Handle video file selection
videoInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        fileName.textContent = file.name;
        const url = URL.createObjectURL(file);
        videoSource.src = url;
        videoPlayer.load();
        
        // Enable frame navigation buttons
        prevFrameBtn.disabled = false;
        nextFrameBtn.disabled = false;
        toggleDotModeBtn.disabled = false;
        saveScreenshotBtn.disabled = false;
        
        // Reset canvas overlay
        resizeCanvas();
    }
});

// Update video metadata when loaded
videoPlayer.addEventListener('loadedmetadata', function() {
    const duration = videoPlayer.duration;
    durationEl.textContent = formatTime(duration);
    
    // Try to estimate FPS (most videos are 24, 30, or 60 fps)
    // This is an approximation - actual frame detection would require canvas analysis
    fps = 30; // Default assumption
    totalFrames = Math.floor(duration * fps);
    totalFramesEl.textContent = totalFrames.toLocaleString();
    fpsEl.textContent = fps + ' (estimated)';
    
    updateFrameInfo();
    resizeCanvas();
});

// Resize canvas to match video dimensions
function resizeCanvas() {
    const rect = videoPlayer.getBoundingClientRect();
    overlayCanvas.width = videoPlayer.videoWidth || rect.width;
    overlayCanvas.height = videoPlayer.videoHeight || rect.height;
    redrawDot();
}

// Redraw the dot on canvas
function redrawDot() {
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    
    if (dotPosition) {
        // Draw dot
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(dotPosition.x, dotPosition.y, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw crosshair
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(dotPosition.x - 15, dotPosition.y);
        ctx.lineTo(dotPosition.x + 15, dotPosition.y);
        ctx.moveTo(dotPosition.x, dotPosition.y - 15);
        ctx.lineTo(dotPosition.x, dotPosition.y + 15);
        ctx.stroke();
    }
}

// Toggle dot placement mode
toggleDotModeBtn.addEventListener('click', function() {
    dotModeActive = !dotModeActive;
    
    if (dotModeActive) {
        overlayCanvas.classList.add('active');
        videoContainer.classList.add('dot-mode');
        toggleDotModeBtn.classList.add('active');
        toggleDotModeBtn.textContent = '✓ Dot Mode Active';
    } else {
        overlayCanvas.classList.remove('active');
        videoContainer.classList.remove('dot-mode');
        toggleDotModeBtn.classList.remove('active');
        toggleDotModeBtn.textContent = 'Place Dot Mode';
    }
});

// Handle canvas click to add dot
overlayCanvas.addEventListener('click', function(e) {
    if (!dotModeActive) return;
    
    const rect = overlayCanvas.getBoundingClientRect();
    const scaleX = overlayCanvas.width / rect.width;
    const scaleY = overlayCanvas.height / rect.height;
    
    // Get click position relative to canvas
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
    
    dotPosition = { x, y };
    
    // Update display
    coordinatesEl.textContent = `X: ${x}px, Y: ${y}px`;
    coordinateRow.style.display = 'flex';
    clearDotBtn.disabled = false;
    
    redrawDot();
});

// Clear dot button
clearDotBtn.addEventListener('click', function() {
    dotPosition = null;
    coordinateRow.style.display = 'none';
    clearDotBtn.disabled = true;
    redrawDot();
});

// Redraw dot when video is resized
window.addEventListener('resize', function() {
    if (videoPlayer.src) {
        resizeCanvas();
    }
});

// Update frame information during playback
videoPlayer.addEventListener('timeupdate', function() {
    updateFrameInfo();
});

// Seek event for when user manually seeks
videoPlayer.addEventListener('seeked', function() {
    updateFrameInfo();
});

function updateFrameInfo() {
    const currentTime = videoPlayer.currentTime;
    currentFrame = Math.floor(currentTime * fps);
    
    currentFrameEl.textContent = currentFrame.toLocaleString();
    currentTimeEl.textContent = formatTime(currentTime);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

// Frame navigation
prevFrameBtn.addEventListener('click', function() {
    if (currentFrame > 0) {
        const newTime = Math.max(0, videoPlayer.currentTime - (1 / fps));
        videoPlayer.currentTime = newTime;
        videoPlayer.pause();
    }
});

nextFrameBtn.addEventListener('click', function() {
    if (currentFrame < totalFrames - 1) {
        const newTime = Math.min(videoPlayer.duration, videoPlayer.currentTime + (1 / fps));
        videoPlayer.currentTime = newTime;
        videoPlayer.pause();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (videoPlayer.src) {
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                prevFrameBtn.click();
                break;
            case 'ArrowRight':
                e.preventDefault();
                nextFrameBtn.click();
                break;
            case ' ':
                e.preventDefault();
                if (videoPlayer.paused) {
                    videoPlayer.play();
                } else {
                    videoPlayer.pause();
                }
                break;
            case 's':
            case 'S':
                e.preventDefault();
                saveScreenshotBtn.click();
                break;
        }
    }
});

// Save screenshot at native video resolution
saveScreenshotBtn.addEventListener('click', function() {
    const w = videoPlayer.videoWidth;
    const h = videoPlayer.videoHeight;

    if (!w || !h) return;

    // Offscreen canvas at full native resolution
    const offscreen = document.createElement('canvas');
    offscreen.width = w;
    offscreen.height = h;
    const offCtx = offscreen.getContext('2d');

    // Draw the current video frame
    offCtx.drawImage(videoPlayer, 0, 0, w, h);

    // Overlay the dot/crosshair if present (scaled to native resolution)
    if (dotPosition) {
        const scaleX = w / overlayCanvas.width;
        const scaleY = h / overlayCanvas.height;
        const nx = dotPosition.x * scaleX;
        const ny = dotPosition.y * scaleY;
        const dotRadius = 8 * Math.min(scaleX, scaleY);
        const crossLen = 15 * Math.min(scaleX, scaleY);
        const lineW = 2 * Math.min(scaleX, scaleY);

        offCtx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        offCtx.beginPath();
        offCtx.arc(nx, ny, dotRadius, 0, 2 * Math.PI);
        offCtx.fill();

        offCtx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        offCtx.lineWidth = lineW;
        offCtx.beginPath();
        offCtx.moveTo(nx - crossLen, ny);
        offCtx.lineTo(nx + crossLen, ny);
        offCtx.moveTo(nx, ny - crossLen);
        offCtx.lineTo(nx, ny + crossLen);
        offCtx.stroke();
    }

    // Build a filename: <video-name>_frame<N>.png
    const baseName = fileName.textContent.replace(/\.[^.]+$/, '') || 'frame';
    const downloadName = `${baseName}_frame${currentFrame}.png`;

    const link = document.createElement('a');
    link.download = downloadName;
    link.href = offscreen.toDataURL('image/png');
    link.click();
});
