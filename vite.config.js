import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Replace 'your-repo-name' with the exact name of your GitHub repository
  base: '/cl-react-chatapp/', 
})