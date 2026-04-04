// Icon Generator Script
// Run this in Node.js to generate all required icon sizes

// For web use, create a simple canvas-based approach
const fs = require('fs');
const path = require('path');

function generateIcon(size) {
    // Create SVG icon
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <!-- Background gradient -->
    <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
    </defs>
    
    <!-- Background -->
    <rect width="512" height="512" fill="url(#grad)"/>
    
    <!-- Clipboard body -->
    <rect x="140" y="80" width="232" height="350" rx="20" fill="white"/>
    
    <!-- Clipboard clip -->
    <rect x="206" y="30" width="100" height="70" rx="8" fill="#764ba2"/>
    <rect x="216" y="45" width="80" height="40" rx="4" fill="#667eea"/>
    
    <!-- Checkmarks -->
    <g stroke="#667eea" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <!-- First checkmark -->
        <path d="M 180 150 L 220 190 L 280 130"/>
        <!-- Second checkmark -->
        <path d="M 180 250 L 220 290 L 280 230"/>
        <!-- Third checkmark -->
        <path d="M 180 350 L 220 390 L 280 330"/>
    </g>
</svg>`;

    return svg;
}

// Generate SVG icon
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = path.join(__dirname);

sizes.forEach(size => {
    const svg = generateIcon(size);
    const filename = path.join(outputDir, `icon-${size}.svg`);
    fs.writeFileSync(filename, svg);
    console.log(`Generated icon-${size}.svg`);
});

console.log('Icon generation complete!');
console.log('SVG files generated. Convert to PNG using:');
console.log('  - ImageMagick: convert icon-512.svg -resize 512x512 icon-512.png');
console.log('  - Or use online converters');
