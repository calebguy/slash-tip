import { syncAllowance } from "./src/allowance";

syncAllowance()
	.then(() => {
		process.exit(0);
	})
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
