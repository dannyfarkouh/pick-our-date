import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Repo is served from https://dannyfarkouh.github.io/pick-our-date/,
  // so built asset URLs need that prefix.
  base: '/pick-our-date/',
})
