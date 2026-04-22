import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("echarts")) return "echarts";
          if (id.includes("reactflow")) return "reactflow";
          if (id.includes("react-dnd") || id.includes("dnd-core")) return "react-dnd";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("motion")) return "motion";
          if (id.includes("@tanstack/react-virtual")) return "tanstack";
          if (id.includes("@radix-ui") || id.includes("cmdk") || id.includes("vaul")) {
            return "ui-kit";
          }
          if (id.includes("date-fns")) return "date-fns";
          if (id.includes("react-router")) return "router";
          return "vendor";
        },
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
