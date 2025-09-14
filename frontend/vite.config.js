import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file from root directory (one level up)
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '')
  
  return {
    plugins: [react()],
    envDir: path.resolve(__dirname, '..'), // Point to root directory for .env files
    envPrefix: ['VITE_'], // Only expose variables with VITE_ prefix to frontend
  }
})
