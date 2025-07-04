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
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'orbitron': ['Orbitron', 'monospace'],
				'exo2': ['Exo 2', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))'
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
				neon: {
					pink: 'hsl(var(--neon-pink))',
					blue: 'hsl(var(--neon-blue))',
					green: 'hsl(var(--neon-green))',
					cyan: 'hsl(var(--neon-cyan))',
					yellow: 'hsl(var(--neon-yellow))',
					purple: 'hsl(var(--neon-purple))'
				},
				hd: {
					silver: 'hsl(var(--hd-silver))',
					gold: 'hsl(var(--hd-gold))',
					platinum: 'hsl(var(--hd-platinum))',
					chrome: 'hsl(var(--hd-chrome))'
				},
				sega: {
					cyan: 'hsl(var(--sega-cyan))',
					magenta: 'hsl(var(--sega-magenta))',
					lime: 'hsl(var(--sega-lime))',
					orange: 'hsl(var(--sega-orange))',
					purple: 'hsl(var(--sega-purple))'
				},
				arcade: {
					gold: 'hsl(var(--arcade-gold))'
				},
				danger: {
					red: 'hsl(var(--danger-red))'
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
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
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
				},
				'neon-pulse': {
					'0%, 100%': {
						opacity: '1',
						filter: 'drop-shadow(0 0 8px hsl(280 100% 60%))'
					},
					'50%': {
						opacity: '0.8',
						filter: 'drop-shadow(0 0 20px hsl(280 100% 60%))'
					}
				},
				'float': {
					'0%, 100%': {
						transform: 'translateY(0px)'
					},
					'50%': {
						transform: 'translateY(-6px)'
					}
				},
				'glow': {
					'0%, 100%': {
						boxShadow: '0 0 20px hsl(280 100% 60% / 0.3)'
					},
					'50%': {
						boxShadow: '0 0 30px hsl(280 100% 60% / 0.6), 0 0 40px hsl(280 100% 60% / 0.3)'
					}
				},
				'slide-up': {
					'0%': {
						transform: 'translateY(100%)',
						opacity: '0'
					},
					'100%': {
						transform: 'translateY(0)',
						opacity: '1'
					}
				},
				'zoom-in': {
					'0%': {
						transform: 'scale(0.8)',
						opacity: '0'
					},
					'100%': {
						transform: 'scale(1)',
						opacity: '1'
					}
				},
				'particle-float': {
					'0%, 100%': {
						transform: 'translateY(0px) rotate(0deg)'
					},
					'33%': {
						transform: 'translateY(-10px) rotate(120deg)'
					},
					'66%': {
						transform: 'translateY(5px) rotate(240deg)'
					}
				},
				'hd-glow': {
					'0%, 100%': {
						filter: 'drop-shadow(0 0 10px rgba(0, 255, 255, 0.5)) drop-shadow(0 0 20px rgba(0, 255, 255, 0.3))',
						boxShadow: '0 0 30px rgba(0, 255, 255, 0.2), inset 0 0 20px rgba(255, 255, 255, 0.1)'
					},
					'50%': {
						filter: 'drop-shadow(0 0 20px rgba(0, 255, 255, 0.8)) drop-shadow(0 0 40px rgba(0, 255, 255, 0.4))',
						boxShadow: '0 0 50px rgba(0, 255, 255, 0.4), inset 0 0 30px rgba(255, 255, 255, 0.2)'
					}
				},
				'metal-shine': {
					'0%': {
						backgroundPosition: '-100% 0'
					},
					'100%': {
						backgroundPosition: '100% 0'
					}
				},
				'depth-float': {
					'0%, 100%': {
						transform: 'perspective(1000px) rotateX(15deg) rotateY(5deg) translateZ(0px)'
					},
					'50%': {
						transform: 'perspective(1000px) rotateX(20deg) rotateY(10deg) translateZ(20px)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
				'float': 'float 3s ease-in-out infinite',
				'glow': 'glow 2s ease-in-out infinite',
				'slide-up': 'slide-up 0.5s ease-out',
				'zoom-in': 'zoom-in 0.3s ease-out',
				'particle-float': 'particle-float 4s ease-in-out infinite',
				'hd-glow': 'hd-glow 3s ease-in-out infinite',
				'metal-shine': 'metal-shine 2s ease-in-out infinite',
				'depth-float': 'depth-float 4s ease-in-out infinite'
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-secondary': 'var(--gradient-secondary)',
				'gradient-bg': 'var(--gradient-bg)',
				'gradient-card': 'var(--gradient-card)',
				'gradient-sega': 'var(--gradient-sega)',
				'gradient-metal': 'var(--gradient-metal)',
				'gradient-chrome': 'var(--gradient-chrome)'
			},
			boxShadow: {
				'neon': 'var(--shadow-neon)',
				'neon-strong': 'var(--shadow-neon-strong)',
				'card': 'var(--shadow-card)',
				'chrome': 'var(--shadow-chrome)',
				'sprite': 'var(--shadow-sprite)',
				'particle': 'var(--shadow-particle)',
				'hd-depth': '0 20px 40px rgba(0,0,0,0.4), 0 10px 20px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
				'hd-glow': '0 0 30px rgba(0, 255, 255, 0.5), 0 0 60px rgba(0, 255, 255, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)',
				'hd-metal': '0 8px 16px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.1)'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
