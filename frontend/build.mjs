import { build } from 'vite'
import { resolve } from 'path'

async function buildApp() {
  try {
    console.log('Starting build...')
    await build({
      root: resolve(__dirname),
      build: {
        outDir: 'dist',
        emptyOutDir: true
      }
    })
    console.log('Build completed successfully!')
  } catch (error) {
    console.error('Build failed:', error)
    process.exit(1)
  }
}

buildApp()
