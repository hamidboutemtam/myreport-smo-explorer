
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '24px',
			screens: {
				'sm': '640px',
				'md': '960px',
				'lg': '1280px',
			}
		},
		extend: {
			fontFamily: {
				sans: ['InterVariable', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial'],
				inter: ['InterVariable', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto'],
			},
			fontSize: {
				'display': ['28px', { lineHeight: '1.15' }],
				'h1': ['22px', { lineHeight: '1.15' }],
				'h2': ['18px', { lineHeight: '1.15' }],
				'h3': ['16px', { lineHeight: '1.15' }],
				'body': ['15px', { lineHeight: '1.45' }],
				'caption': ['13px', { lineHeight: '1.45' }],
				'mini': ['12px', { lineHeight: '1.45' }],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				
				/* Surface tokens */
				surface: {
					panel: 'hsl(var(--surface-panel))',
					muted: 'hsl(var(--surface-muted))',
				},
				
				/* Text tokens */
				text: {
					primary: 'hsl(var(--text-primary))',
					secondary: 'hsl(var(--text-secondary))',
					subtle: 'hsl(var(--text-subtle))',
				},
				
				/* Neutral tokens */
				neutral: {
					100: 'hsl(var(--neutral-100))',
					200: 'hsl(var(--neutral-200))',
					300: 'hsl(var(--neutral-300))',
					400: 'hsl(var(--neutral-400))',
					500: 'hsl(var(--neutral-500))',
					600: 'hsl(var(--neutral-600))',
				},
				
				/* Status colors */
				success: 'hsl(var(--success))',
				info: 'hsl(var(--info))',
				warning: 'hsl(var(--warning))',
				
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					600: 'hsl(var(--primary-600))',
					400: 'hsl(var(--primary-400))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				sm: 'var(--radius-sm)',
				md: 'var(--radius-md)',
				lg: 'var(--radius-lg)',
				pill: 'var(--radius-pill)',
			},
			boxShadow: {
				sm: 'var(--elevation-sm)',
				md: 'var(--elevation-md)',
				lg: 'var(--elevation-lg)',
			},
			transitionDuration: {
				'fast': '120ms',
				'default': '200ms',
				'long': '360ms',
			},
			transitionTimingFunction: {
				'standard': 'cubic-bezier(.2,.8,.2,1)',
				'decay': 'cubic-bezier(.2,.9,.3,1)',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
