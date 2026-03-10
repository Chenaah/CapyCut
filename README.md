# Video Frame Viewer

A simple web application that allows you to load a video file and view the current frame index as the video plays.

## Features

- **Load Video Files**: Upload any video file from your computer
- **Frame Index Display**: Shows the current frame number in real-time
- **Video Information**: Displays total frames, current time, duration, and FPS
- **Frame Navigation**: Step forward/backward one frame at a time
- **Keyboard Controls**:
  - `Arrow Left`: Previous frame
  - `Arrow Right`: Next frame
  - `Spacebar`: Play/Pause

## How to Use

1. Open `index.html` in a web browser
2. Click "Choose Video File" and select a video
3. Play the video or use frame navigation buttons
4. Watch the frame index update in real-time

## Notes

- FPS is estimated at 30fps by default (common for most videos)
- Frame counting is calculated based on `currentTime * FPS`
- For precise frame-accurate analysis, consider using video processing libraries
- Works with all major video formats supported by HTML5 video

## Browser Compatibility

Works in all modern browsers that support HTML5 video:
- Chrome/Edge
- Firefox
- Safari
- Opera

## No Installation Required

This is a standalone HTML/CSS/JavaScript application. No server or build process needed - just open the HTML file in your browser!
