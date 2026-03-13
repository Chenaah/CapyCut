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
const flipHBtn = document.getElementById('flipH');
const flipVBtn = document.getElementById('flipV');
const saveVideoBtn = document.getElementById('saveVideo');
const exportProgress = document.getElementById('exportProgress');
const exportBar = document.getElementById('exportBar');
const exportPercent = document.getElementById('exportPercent');
const exportStatusText = document.getElementById('exportStatusText');
const exportOptions = document.getElementById('exportOptions');
const useFfmpegChk = document.getElementById('useFfmpeg');

let fps = 30; // Default FPS, will be updated when possible
let totalFrames = 0;
let currentFrame = 0;
let dotPosition = null; // Store dot position {x, y}
let dotModeActive = false;
let flippedH = false;
let flippedV = false;

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
        flipHBtn.disabled = false;
        flipVBtn.disabled = false;
        saveVideoBtn.disabled = false;

        // Show export options panel
        exportOptions.style.display = 'block';

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

// Flip helpers
function applyFlipTransform() {
    const sx = flippedH ? -1 : 1;
    const sy = flippedV ? -1 : 1;
    const transform = `scale(${sx}, ${sy})`;
    videoPlayer.style.transform = transform;
    overlayCanvas.style.transform = transform;
}

flipHBtn.addEventListener('click', function() {
    flippedH = !flippedH;
    flipHBtn.classList.toggle('active', flippedH);
    applyFlipTransform();
});

flipVBtn.addEventListener('click', function() {
    flippedV = !flippedV;
    flipVBtn.classList.toggle('active', flippedV);
    applyFlipTransform();
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

    // Draw the current video frame (apply flip if active)
    offCtx.save();
    if (flippedH || flippedV) {
        offCtx.translate(flippedH ? w : 0, flippedV ? h : 0);
        offCtx.scale(flippedH ? -1 : 1, flippedV ? -1 : 1);
    }
    offCtx.drawImage(videoPlayer, 0, 0, w, h);
    offCtx.restore();

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

// Save flipped video
let isExporting = false;
let mp4boxLoaded = false;

async function loadMp4box() {
    if (mp4boxLoaded) return;
    await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/mp4box@0.5.2/dist/mp4box.all.min.js';
        s.onload = resolve;
        s.onerror = () => reject(new Error('Failed to load mp4box.js'));
        document.head.appendChild(s);
    });
    mp4boxLoaded = true;
}

// Encode flipped frames directly to H.264 + MP4 using WebCodecs + mp4box.js.
// Seeks frame-by-frame so progress is accurate and no real-time wait is needed.
async function encodeToMp4(w, h) {
    exportStatusText.textContent = 'Loading mp4box.js…';
    await loadMp4box();

    // ── Source video (loaded first so we know duration before creating the track)
    exportStatusText.textContent = 'Loading video…';
    const srcVideo = document.createElement('video');
    srcVideo.muted = true;
    srcVideo.playsInline = true;
    srcVideo.src = videoPlayer.currentSrc || videoSource.src;
    await new Promise((res, rej) => {
        srcVideo.onloadedmetadata = res;
        srcVideo.onerror = () => rej(new Error('Failed to load video for encoding'));
    });

    const duration = srcVideo.duration;
    const frameCount = Math.round(duration * fps);
    const frameDuration = 1 / fps;

    // Total duration in the 90 kHz timescale used for the MP4 track
    const frameDur90k = Math.round(90000 / fps);
    const totalDur90k = frameCount * frameDur90k;

    const mp4File = MP4Box.createFile();
    let trackId = null;
    let sampleCount = 0;
    let encoderError = null;

    // ── VideoEncoder ─────────────────────────────────────────────────────────
    const encoder = new VideoEncoder({
        output(chunk, meta) {
            try {
                const buf = new Uint8Array(chunk.byteLength);
                chunk.copyTo(buf);

                // Create the track on the very first chunk, using the avcC
                // descriptor that the encoder provides in meta.decoderConfig.
                if (trackId === null) {
                    // mp4box.js 0.5.2 feeds avcDecoderConfigRecord into
                    // MP4BoxStream → DataStream, which requires a plain ArrayBuffer.
                    const desc = meta?.decoderConfig?.description;
                    console.log('[MP4 export] first chunk, desc type:', desc?.constructor?.name, 'byteLength:', desc?.byteLength);
                    let avcCBuffer;
                    if (desc instanceof ArrayBuffer) {
                        avcCBuffer = desc;
                    } else if (ArrayBuffer.isView(desc)) {
                        // Uint8Array / DataView etc. — extract the underlying buffer slice
                        avcCBuffer = desc.buffer.slice(desc.byteOffset, desc.byteOffset + desc.byteLength);
                    }
                    // Pass duration so mvhd / tkhd / mdhd all get the correct length.
                    // mp4box inherits the movie timescale from the first addTrack call,
                    // which sets mvhd.timescale = options.timescale (90000 here).
                    // So all duration fields use the same 90000 timescale.
                    trackId = mp4File.addTrack({
                        type: 'avc1',
                        width: w,
                        height: h,
                        timescale: 90000,
                        duration: totalDur90k,       // tkhd duration (movie timescale = 90000)
                        media_duration: totalDur90k, // mdhd duration (track timescale = 90000)
                        avcDecoderConfigRecord: avcCBuffer,
                    });
                    // Patch mvhd duration and ftyp brand for maximum player compatibility
                    if (mp4File.moov && mp4File.moov.mvhd) {
                        mp4File.moov.mvhd.duration = totalDur90k;
                    }
                    if (mp4File.ftyp) {
                        mp4File.ftyp.major_brand = 'mp42';
                        mp4File.ftyp.compatible_brands = ['mp42', 'isom', 'iso4'];
                    }
                }

                mp4File.addSample(trackId, buf, {
                    duration: frameDur90k,
                    dts: sampleCount * frameDur90k,
                    cts: sampleCount * frameDur90k,
                    is_sync: chunk.type === 'key',
                });
                sampleCount++;
            } catch (e) {
                console.error('[MP4 encoder output error]', e);
                encoderError = e;
            }
        },
        error(e) {
            console.error('[MP4 encoder error]', e);
            encoderError = e;
        },
    });

    // Pick the right H.264 level based on resolution (coded area limits per spec)
    // Profile: High (0x64), constraints: 0x00
    function avcCodecString(width, height) {
        const area = width * height;
        let level;
        if      (area <= 25344)   level = 0x1E; // 3.0  — up to ~176×144×30
        else if (area <= 101376)  level = 0x1F; // 3.1  — up to ~352×288×30
        else if (area <= 414720)  level = 0x20; // 3.2
        else if (area <= 921600)  level = 0x28; // 4.0  — up to 1280×720×30
        else if (area <= 2097152) level = 0x29; // 4.1  — up to 1920×1080×30
        else if (area <= 2228224) level = 0x2A; // 4.2
        else                      level = 0x32; // 5.0  — up to 2560×1920
        return `avc1.6400${level.toString(16).padStart(2, '0').toUpperCase()}`;
    }

    const codecStr = avcCodecString(w, h);
    console.log('[MP4 export] codec:', codecStr, 'size:', w, 'x', h);

    // Check codec support before configuring (Chrome 94+)
    if (VideoEncoder.isConfigSupported) {
        const support = await VideoEncoder.isConfigSupported({
            codec: codecStr, width: w, height: h,
            framerate: fps, bitrate: 16_000_000,
        });
        if (!support.supported) {
            throw new Error(`H.264 codec not supported: ${codecStr}. Try a smaller video or a different browser.`);
        }
    }

    encoder.configure({
        codec: codecStr,
        width: w,
        height: h,
        framerate: fps,
        bitrate: 16_000_000,
        avc: { format: 'avc' }, // request Annex-B + avcC descriptor
    });

    const offscreen = document.createElement('canvas');
    offscreen.width = w;
    offscreen.height = h;
    const offCtx = offscreen.getContext('2d');

    exportStatusText.textContent = 'Encoding frames…';

    for (let i = 0; i < frameCount; i++) {
        if (encoderError) throw encoderError;

        srcVideo.currentTime = i * frameDuration;
        await new Promise(res => srcVideo.addEventListener('seeked', res, { once: true }));

        offCtx.save();
        offCtx.clearRect(0, 0, w, h);
        if (flippedH || flippedV) {
            offCtx.translate(flippedH ? w : 0, flippedV ? h : 0);
            offCtx.scale(flippedH ? -1 : 1, flippedV ? -1 : 1);
        }
        offCtx.drawImage(srcVideo, 0, 0, w, h);
        offCtx.restore();

        const frame = new VideoFrame(offscreen, {
            timestamp: Math.round(i * frameDuration * 1_000_000),
            duration:  Math.round(frameDuration * 1_000_000),
        });
        encoder.encode(frame, { keyFrame: i % 60 === 0 });
        frame.close();

        const pct = Math.round(((i + 1) / frameCount) * 100);
        exportBar.style.width = pct + '%';
        exportPercent.textContent = pct + '%';

        // Yield every 10 frames to keep UI responsive
        if (i % 10 === 0) await new Promise(r => setTimeout(r, 0));
    }

    await encoder.flush();
    encoder.close();

    if (encoderError) throw encoderError;

    exportStatusText.textContent = 'Finalising MP4…';
    const buffer = mp4File.getBuffer();
    return new Blob([buffer], { type: 'video/mp4' });
}

saveVideoBtn.addEventListener('click', async function() {
    if (isExporting) return;
    if (!flippedH && !flippedV) {
        alert('No flip is applied. Flip the video first, then save.');
        return;
    }

    const w = videoPlayer.videoWidth;
    const h = videoPlayer.videoHeight;
    if (!w || !h) return;

    isExporting = true;
    saveVideoBtn.disabled = true;
    saveVideoBtn.textContent = '⏳ Exporting…';
    exportProgress.style.display = 'block';
    exportBar.style.width = '0%';
    exportPercent.textContent = '0%';

    const useMp4 = useFfmpegChk.checked;

    if (useMp4) {
        // ── MP4 path: WebCodecs H.264 encode → mp4box mux ────────────────────
        if (!('VideoEncoder' in window)) {
            alert('Your browser does not support the WebCodecs API.\n\nMake sure you are opening the page via http://localhost:8080 (not 0.0.0.0 or a file:// URL) — Chrome only enables WebCodecs on localhost or https://.');
            resetExportUI();
            return;
        }
        try {
            const mp4Blob = await encodeToMp4(w, h);
            const origExt = fileName.textContent.match(/\.[^.]+$/)?.[0]?.toLowerCase() || '.mp4';
            const outExt = (origExt === '.mov') ? '.mov' : '.mp4';
            const baseName = fileName.textContent.replace(/\.[^.]+$/, '') || 'video';
            const flipLabel = (flippedH ? '_flipH' : '') + (flippedV ? '_flipV' : '');
            triggerDownload(mp4Blob, `${baseName}${flipLabel}${outExt}`);
        } catch (err) {
            console.error('[MP4 export]', err);
            const msg = err?.message || (typeof err === 'string' ? err : null) || String(err) || 'Unknown error';
            alert('MP4 export failed: ' + msg);
        }
        resetExportUI();
        return;
    }

    // ── WebM path: MediaRecorder ──────────────────────────────────────────────
    exportStatusText.textContent = 'Exporting video…';
    try {
        const webmBlob = await recordFlippedVideo(w, h);
        const baseName = fileName.textContent.replace(/\.[^.]+$/, '') || 'video';
        const flipLabel = (flippedH ? '_flipH' : '') + (flippedV ? '_flipV' : '');
        triggerDownload(webmBlob, `${baseName}${flipLabel}.webm`);
    } catch (err) {
        alert('Export failed: ' + err.message);
    }
    resetExportUI();
});

// Record a flipped version of the video to a WebM Blob
function recordFlippedVideo(w, h) {
    return new Promise((resolve, reject) => {
        const renderCanvas = document.createElement('canvas');
        renderCanvas.width = w;
        renderCanvas.height = h;
        const renderCtx = renderCanvas.getContext('2d');

        const srcVideo = document.createElement('video');
        srcVideo.muted = true;
        srcVideo.playsInline = true;
        srcVideo.src = videoPlayer.currentSrc || videoSource.src;

        const mimeTypes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
        let chosenMime = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) || '';
        if (!chosenMime) { reject(new Error('Browser does not support WebM recording.')); return; }

        srcVideo.addEventListener('loadedmetadata', function() {
            const duration = srcVideo.duration;
            const stream = renderCanvas.captureStream();
            const recorder = new MediaRecorder(stream, {
                mimeType: chosenMime,
                videoBitsPerSecond: 16_000_000,
            });
            const chunks = [];

            recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
            recorder.onstop = () => resolve(new Blob(chunks, { type: chosenMime }));

            recorder.start();

            function drawFrame() {
                renderCtx.save();
                renderCtx.clearRect(0, 0, w, h);
                if (flippedH || flippedV) {
                    renderCtx.translate(flippedH ? w : 0, flippedV ? h : 0);
                    renderCtx.scale(flippedH ? -1 : 1, flippedV ? -1 : 1);
                }
                renderCtx.drawImage(srcVideo, 0, 0, w, h);
                renderCtx.restore();

                if (!useFfmpegChk.checked) {
                    // Only update progress bar in WebM-only mode
                    const pct = Math.min(100, Math.round((srcVideo.currentTime / duration) * 100));
                    exportBar.style.width = pct + '%';
                    exportPercent.textContent = pct + '%';
                }
            }

            function onEnded() {
                drawFrame();
                exportStatusText.textContent = 'Finalising…';
                setTimeout(() => recorder.stop(), 200);
            }

            srcVideo.addEventListener('ended', onEnded, { once: true });

            if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
                const step = () => { drawFrame(); if (!srcVideo.ended) srcVideo.requestVideoFrameCallback(step); };
                srcVideo.requestVideoFrameCallback(step);
            } else {
                srcVideo.addEventListener('timeupdate', drawFrame);
            }

            srcVideo.play();
        }, { once: true });

        srcVideo.addEventListener('error', () => reject(new Error('Failed to load video.')), { once: true });
    });
}

function triggerDownload(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
}

function resetExportUI() {
    isExporting = false;
    saveVideoBtn.disabled = false;
    saveVideoBtn.textContent = '🎬 Save Flipped Video';
    setTimeout(() => { exportProgress.style.display = 'none'; }, 1500);
}
