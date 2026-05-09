#!/usr/bin/env node
/**
 * Generates all platform-specific icon assets from assets/logo.png.
 *
 * Requires: ImageMagick (convert/magick)
 * Usage:    node scripts/generate-icons.mjs
 *           pnpm run generate-icons
 *
 * Outputs:
 *   assets/icons/{size}x{size}.png  — Linux desktop integration sizes
 *   assets/icon.ico                 — Windows (multi-resolution)
 *   assets/icon.icns                — macOS (requires png2icns or iconutil)
 */

import { execSync } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'assets', 'logo.png')
const iconsDir = join(root, 'assets', 'icons')

if (!existsSync(src)) {
  console.error(`Source image not found: ${src}`)
  process.exit(1)
}

mkdirSync(iconsDir, { recursive: true })

// Detect whether to use `magick` (IM 7) or `convert` (IM 6)
function im(args) {
  const bin = (() => {
    try {
      execSync('magick -version', { stdio: 'ignore' })
      return 'magick'
    } catch {
      return 'convert'
    }
  })()
  execSync(`${bin} ${args}`, { stdio: 'inherit' })
}

// ── PNG sizes ────────────────────────────────────────────────────────────────
const linuxSizes = [16, 32, 48, 64, 128, 256, 512, 1024]

console.log('Generating PNG icons…')
for (const size of linuxSizes) {
  const out = join(iconsDir, `${size}x${size}.png`)
  // Fit inside the square, pad transparent if aspect differs
  im(`"${src}" -resize ${size}x${size} -background transparent -gravity center -extent ${size}x${size} "${out}"`)
  console.log(`  ✓ ${size}x${size}.png`)
}

// ── Windows .ico (multi-resolution) ─────────────────────────────────────────
const icoSizes = [16, 32, 48, 64, 128, 256]
const icoInputs = icoSizes.map((s) => `"${join(iconsDir, `${s}x${s}.png`)}"`).join(' ')
const icoOut = join(root, 'assets', 'icon.ico')

console.log('\nGenerating icon.ico…')
im(`${icoInputs} "${icoOut}"`)
console.log(`  ✓ assets/icon.ico`)

// ── macOS .icns ──────────────────────────────────────────────────────────────
console.log('\nGenerating icon.icns…')
const icnsOut = join(root, 'assets', 'icon.icns')

// Strategy 1: png2icns (icnsutils package, available on Linux)
const hasPng2icns = (() => {
  try {
    execSync('which png2icns', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
})()

// Strategy 2: iconutil (macOS only)
const hasIconutil = (() => {
  try {
    execSync('which iconutil', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
})()

if (hasPng2icns) {
  const icnsSizes = [16, 32, 48, 128, 256, 512, 1024]
  const icnsInputs = icnsSizes.map((s) => `"${join(iconsDir, `${s}x${s}.png`)}"`).join(' ')
  execSync(`png2icns "${icnsOut}" ${icnsInputs}`, { stdio: 'inherit' })
  console.log(`  ✓ assets/icon.icns  (via png2icns)`)
} else if (hasIconutil) {
  // Build an iconset directory then convert it
  const iconset = join(root, 'assets', 'AppIcon.iconset')
  mkdirSync(iconset, { recursive: true })
  const iconutilMap = [
    [16, 'icon_16x16'], [32, 'icon_16x16@2x'], [32, 'icon_32x32'],
    [64, 'icon_32x32@2x'], [128, 'icon_128x128'], [256, 'icon_128x128@2x'],
    [256, 'icon_256x256'], [512, 'icon_256x256@2x'], [512, 'icon_512x512'],
    [1024, 'icon_512x512@2x'],
  ]
  for (const [size, name] of iconutilMap) {
    execSync(
      `cp "${join(iconsDir, `${size}x${size}.png`)}" "${join(iconset, `${name}.png`)}"`,
      { stdio: 'inherit' }
    )
  }
  execSync(`iconutil -c icns "${iconset}" -o "${icnsOut}"`, { stdio: 'inherit' })
  execSync(`rm -rf "${iconset}"`)
  console.log(`  ✓ assets/icon.icns  (via iconutil)`)
} else {
  console.warn('  ⚠  png2icns and iconutil not found — skipping .icns generation.')
  console.warn('     Install icnsutils (apt/pacman) or run this script on macOS.')
}

console.log('\nDone! All icons are in assets/icons/ and assets/icon.*')
