import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // 只在「本機開發」時作用，讓 /api 轉到你的本機 FastAPI 例如 8001
    proxy: { "/api": "https://work2-enfq.onrender.com" }
  }
})
