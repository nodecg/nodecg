import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	base: "./",
	plugins: [react()],
	build: {
		rolldownOptions: {
			input: {
				index: "index.html",
				dashboard: "dashboard.html",
				graphics: "graphics.html",
			},
		},
	},
});
