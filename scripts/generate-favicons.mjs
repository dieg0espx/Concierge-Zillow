import sharp from 'sharp'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const projectRoot = path.resolve(__dirname, '..')
const publicDir = path.join(projectRoot, 'public')

const sourcePath = path.join(publicDir, 'logo', 'CL Balck LOGO .png')
const outputs = [
  { size: 32, name: 'favicon-32x32.png' },
  { size: 16, name: 'favicon-16x16.png' },
]

async function run() {
  if (!fs.existsSync(sourcePath)) {
    console.error(`Source image not found: ${sourcePath}`)
    process.exit(1)
  }
  for (const { size, name } of outputs) {
    const outPath = path.join(publicDir, name)
    await sharp(sourcePath)
      .resize(size, size, { fit: 'cover' })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(outPath)
    console.log(`Generated ${name}`)
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})


