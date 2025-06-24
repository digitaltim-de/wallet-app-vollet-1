/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#0070E0',   // PayPal Blue
                    foreground: '#ffffff'
                },
                secondary: {
                    DEFAULT: '#E6F0FF',
                    foreground: '#003087'
                },
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                chart: {
                    '1': 'hsl(var(--chart-1))',
                    '2': 'hsl(var(--chart-2))',
                    '3': 'hsl(var(--chart-3))',
                    '4': 'hsl(var(--chart-4))',
                    '5': 'hsl(var(--chart-5))'
                }
            },
            borderRadius: {
                lg: '24px',  // Design rule: 24px corner radius
                md: '16px',
                sm: '8px'
            },
            spacing: {
                '4': '1rem'
            },
            keyframes: {
                enter: {
                    from: { opacity: 0, transform: 'translateY(-8px)' },
                    to: { opacity: 1, transform: 'translateY(0)' }
                },
                leave: {
                    from: { opacity: 1, transform: 'translateY(0)' },
                    to: { opacity: 0, transform: 'translateY(-8px)' }
                }
            },
            animation: {
                enter: 'enter 0.2s ease-out',
                leave: 'leave 0.15s ease-in forwards'
            }
        }
    },
    plugins: [require("tailwindcss-animate")],
}
