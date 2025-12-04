import { defineConfig } from 'prisma/config';
import { config } from 'dotenv';

config(); // Load .env file

export default defineConfig({
	migrations: {
		seed: 'tsx prisma/seed.ts',
	},
});


