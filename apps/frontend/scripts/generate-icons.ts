#!/usr/bin/env tsx

import sharp from 'sharp';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Icon Generation Script for LocalShare PWA
 *
 * Generates all required favicon and PWA icons from logo.svg:
 * - PWA icons (72-512px) for manifest.json
 * - favicon.ico for browser tabs
 * - apple-icon.png for iOS home screen
 */

const SOURCE_LOGO = join(process.cwd(), 'public/logo.svg');
const OUTPUT_ICONS_DIR = join(process.cwd(), 'public/icons');
const OUTPUT_APP_DIR = join(process.cwd(), 'src/app');

// PWA icon sizes referenced in manifest.json
const PWA_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Apple touch icon size
const APPLE_ICON_SIZE = 180;

// Favicon size (will be saved as .ico)
const FAVICON_SIZE = 32;

async function generateIcons() {
  console.log('🎨 LocalShare Icon Generator');
  console.log('============================\n');

  // Verify source logo exists
  if (!existsSync(SOURCE_LOGO)) {
    console.error(`❌ Error: Source logo not found at ${SOURCE_LOGO}`);
    process.exit(1);
  }

  console.log(`📁 Source: ${SOURCE_LOGO}`);
  console.log(`📁 Output: ${OUTPUT_ICONS_DIR}\n`);

  // Ensure output directories exist
  mkdirSync(OUTPUT_ICONS_DIR, { recursive: true });
  mkdirSync(OUTPUT_APP_DIR, { recursive: true });

  try {
    // Generate PWA icons
    console.log('🔨 Generating PWA icons...');
    for (const size of PWA_SIZES) {
      await sharp(SOURCE_LOGO)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 },
        })
        .png({
          compressionLevel: 9,
          quality: 90,
        })
        .toFile(join(OUTPUT_ICONS_DIR, `icon-${size}x${size}.png`));

      console.log(`  ✓ icon-${size}x${size}.png`);
    }

    // Generate favicon.ico
    console.log('\n🔨 Generating favicon...');
    await sharp(SOURCE_LOGO)
      .resize(FAVICON_SIZE, FAVICON_SIZE, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .png()
      .toFile(join(OUTPUT_APP_DIR, 'favicon.ico'));

    console.log('  ✓ favicon.ico');

    // Generate Apple Touch Icon
    console.log('\n🔨 Generating Apple Touch Icon...');
    await sharp(SOURCE_LOGO)
      .resize(APPLE_ICON_SIZE, APPLE_ICON_SIZE, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .png({
        compressionLevel: 9,
        quality: 90,
      })
      .toFile(join(OUTPUT_APP_DIR, 'apple-icon.png'));

    console.log('  ✓ apple-icon.png');

    console.log('\n✅ All icons generated successfully!');
    console.log('\n📊 Summary:');
    console.log(`  • ${PWA_SIZES.length} PWA icons (${Math.min(...PWA_SIZES)}-${Math.max(...PWA_SIZES)}px)`);
    console.log('  • 1 favicon.ico (32x32px)');
    console.log('  • 1 apple-icon.png (180x180px)');
    console.log(`  • Total: ${PWA_SIZES.length + 2} files generated\n`);

  } catch (error) {
    console.error('\n❌ Error generating icons:', error);
    process.exit(1);
  }
}

// Run the generator
generateIcons();
