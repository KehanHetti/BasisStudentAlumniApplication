// tailwind.config.ts

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-avenir)', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Colors derived directly from your logo
        'logo-primary-blue': '#007B8A', // Dark teal
        'logo-secondary-blue': '#00BCD4', // Lighter, vibrant teal
        'logo-accent-green': '#8BC34A', // Lively green
        'logo-accent-orange': '#FF9800', // Warm orange
        'logo-neutral-brown': '#5D4037', // Dark brown for deep elements/text

        // General UI colors (use logo colors where appropriate)
        'ui-background': '#F0F4F8', // Soft light gray
        'ui-card-background': '#FFFFFF',
        'ui-text-dark': '#344054', // Darker text for readability
        'ui-text-light': '#667085', // Lighter text for secondary info
        'ui-border': '#E0E0E0', // Subtle border color
        'ui-success': '#10B981', // Green for success states
        'ui-danger': '#EF4444', // Red for danger/errors
        'ui-warning': '#F59E0B', // Orange for warnings
      },
      boxShadow: {
        'custom-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'custom-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
};
export default config;
