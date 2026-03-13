import sharp from 'sharp';

async function processIcons() {
  const input = 'public/logo-global.png';
  
  // Pad the image to be a square (1024x1024) with a SOLID WHITE background explicitly.
  // Apple iOS drops alpha channels and turns transparency into black/white blobs.
  const pipeline = sharp(input)
    .resize({
      width: 1024,
      height: 1024,
      fit: 'contain', 
      background: { r: 255, g: 255, b: 255, alpha: 1 } // Solid White
    })
    .flatten({ background: { r: 255, g: 255, b: 255 } }); // Remove Alpha Transparency entirely

  const squareBuffer = await pipeline.toBuffer();

  await sharp(squareBuffer).resize(192, 192).toFile('public/pwa-192x192.png');
  await sharp(squareBuffer).resize(512, 512).toFile('public/pwa-512x512.png');
  await sharp(squareBuffer).resize(180, 180).toFile('public/apple-touch-icon.png');
  
  await sharp(squareBuffer).resize(64, 64).toFile('public/favicon.ico');

  console.log('Opaque Icons generated successfully.');
}

processIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
