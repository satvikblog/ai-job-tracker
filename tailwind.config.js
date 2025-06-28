/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      colors: {
        // Semantic color tokens
        background: {
          DEFAULT: 'var(--background)',
          secondary: 'var(--background-secondary)',
        },
        foreground: 'var(--foreground)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        
        card: {
          DEFAULT: 'rgb(var(--card) / <alpha-value>)',
          foreground: 'var(--card-foreground)',
          hover: 'var(--card-hover)',
          border: 'var(--card-border)',
        },
        
        sidebar: {
          DEFAULT: 'var(--sidebar)',
          hover: 'var(--sidebar-hover)',
          active: 'var(--sidebar-active)',
          text: 'var(--sidebar-text)',
          'text-hover': 'var(--sidebar-text-hover)',
          'text-active': 'var(--sidebar-text-active)',
          border: 'var(--sidebar-border)',
          'border-active': 'var(--sidebar-border-active)',
        },
        
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          foreground: 'var(--primary-foreground)',
          hover: 'var(--primary-hover)',
          accent: 'var(--primary-accent)',
        },
        
        secondary: {
          DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
          foreground: 'var(--secondary-foreground)',
          hover: 'var(--secondary-hover)',
          accent: 'var(--secondary-accent)',
        },
        
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          foreground: 'var(--accent-foreground)',
          hover: 'var(--accent-hover)',
          accent: 'var(--accent-accent)',
        },
        
        success: {
          DEFAULT: 'rgb(var(--success) / <alpha-value>)',
          foreground: 'var(--success-foreground)',
          hover: 'var(--success-hover)',
          accent: 'var(--success-accent)',
        },
        
        warning: {
          DEFAULT: 'rgb(var(--warning) / <alpha-value>)',
          foreground: 'var(--warning-foreground)',
          hover: 'var(--warning-hover)',
          accent: 'var(--warning-accent)',
        },
        
        error: {
          DEFAULT: 'rgb(var(--error) / <alpha-value>)',
          foreground: 'var(--error-foreground)',
          hover: 'var(--error-hover)',
          accent: 'var(--error-accent)',
        },
        
        icon: 'var(--icon)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px var(--shadow-glow-color)' },
          '100%': { boxShadow: '0 0 20px var(--shadow-glow-color)' },
        },
        pulseGlow: {
          '0%, 100%': { 
            boxShadow: '0 0 5px var(--shadow-glow-color)',
            transform: 'scale(1)'
          },
          '50%': { 
            boxShadow: '0 0 20px var(--shadow-glow-color)',
            transform: 'scale(1.02)'
          },
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-sm': '0 0 10px var(--shadow-glow-color)',
        'glow': '0 0 15px var(--shadow-glow-color)',
        'glow-lg': '0 0 25px var(--shadow-glow-color)',
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      }
    },
  },
  plugins: [],
};