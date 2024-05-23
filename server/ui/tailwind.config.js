/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			fontFamily: {
				jacquard: ["'Jacquard 12'", "'system-ui'"],
			},
		},
	},
	plugins: [],
};
