# Icons for Village Family Survey System PWA

This folder contains icons for the Progressive Web App.

## Required Icons

The following icon sizes are referenced in manifest.json:

- **icon-72.png** - 72x72 pixels (Android home screen)
- **icon-96.png** - 96x96 pixels (Android)
- **icon-128.png** - 128x128 pixels (Small devices)
- **icon-144.png** - 144x144 pixels (Tablet)
- **icon-152.png** - 152x152 pixels (Tablet)
- **icon-192.png** - 192x192 pixels (Android)
- **icon-384.png** - 384x384 pixels (Desktop)
- **icon-512.png** - 512x512 pixels (Splash screen, desktop)

## Maskable Icons

For better display on devices with different shape cutouts:

- **icon-192-maskable.png** - 192x192 pixels (maskable variant)
- **icon-512-maskable.png** - 512x512 pixels (maskable variant)

## How to Generate Icons

### Option 1: Using the icon-base.svg
1. The `icon-base.svg` file contains the base design
2. Convert SVG to PNG using:
   - **Online**: Use convertio.co or cloudconvert.com
   - **Command line**: `convert icon-base.svg icon-512.png`
   - **ImageMagick**: `magick convert icon-base.svg -resize 512x512 icon-512.png`

### Option 2: Using Favicon Generators
1. Upload icon-base.svg to https://www.favicon-generator.org/
2. Generate all required sizes
3. Download and replace files

### Option 3: Using Node.js with Sharp
```bash
npm install sharp

node -e "
const sharp = require('sharp');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
sizes.forEach(size => {
  sharp('icon-base.svg')
    .resize(size, size)
    .png()
    .toFile('icon-' + size + '.png');
});
"
```

## Alternative: Simple PNG Files

If you don't have conversion tools, you can use any existing PNG files:

1. Create or download a 512x512 PNG icon
2. Rename it to `icon-512.png`
3. Create resized versions for other sizes using:
   - Online tools
   - Image editing software
   - Command line tools

## Icon Specifications

- **Format**: PNG (with transparency recommended)
- **Colors**: Gradient purple (#667eea to #764ba2)
- **Design**: Clipboard with checkmarks (for survey theme)
- **Background**: Can be gradient or solid
- **Style**: Modern, minimalist, professional

## Using in manifest.json

The manifest.json already references these icon files. Once you place the PNG files in this folder, they will be:
- Used for home screen icons
- Used for app installation prompts
- Displayed in browser extensions area
- Used for splash screens on mobile

## Maskable Icons

For best results on devices with custom shape cutouts (Android):
1. Create 192x192 and 512x512 maskable variants
2. Ensure important content is within the center circle (safe zone: 20% from edges)
3. Name them `icon-192-maskable.png` and `icon-512-maskable.png`

## Quick Start

The app will work with or without icons, but for a professional PWA experience:
1. Keep at least `icon-192.png` and `icon-512.png`
2. All sizes are helpful but not required
3. Web browsers will provide a default icon if none specified

---

**Note**: The app is fully functional without custom icons. The manifest.json will use the generated icon-512.jpg as fallback.
