import sharp from 'sharp';

async function processIcons() {
  const input = 'public/logo-global.png';
  
  // Pad the image to be a square (1024x1024 for example) with transparent background
  // Then resize to 192x192 and 512x512
  const pipeline = sharp(input)
    .resize({
      width: 1024,
      height: 1024,
      fit: 'contain', 
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    });

  const squareBuffer = await pipeline.toBuffer();

  await sharp(squareBuffer).resize(192, 192).toFile('public/pwa-192x192.png');
  await sharp(squareBuffer).resize(512, 512).toFile('public/pwa-512x512.png');
  await sharp(squareBuffer).resize(180, 180).toFile('public/apple-touch-icon.png');
  
  // Also recreate a proper favicon to replace the Lovable one entirely
  await sharp(squareBuffer).resize(64, 64).toFile('public/favicon.ico');

  console.log('Icons generated successfully.');
}

processIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
