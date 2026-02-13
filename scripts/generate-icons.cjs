const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const svgPath = path.join(__dirname, "../public/assets/icon.svg");
const outputDir = path.join(__dirname, "../public/assets");

const sizes = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "icon-maskable.png", size: 512 },
];

async function generateIcons() {
  // Read SVG
  const svgBuffer = fs.readFileSync(svgPath);

  console.log("Generating PWA icons from SVG...");

  for (const { name, size } of sizes) {
    const outputPath = path.join(outputDir, name);

    await sharp(svgBuffer).resize(size, size).png().toFile(outputPath);

    console.log(`✓ Generated ${name} (${size}x${size})`);
  }

  // Also generate a favicon
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(outputDir, "icon-32.png"));
  console.log("✓ Generated icon-32.png (32x32)");

  console.log("\n✅ All icons generated successfully!");
}

generateIcons().catch((err) => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
