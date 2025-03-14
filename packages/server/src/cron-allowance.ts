import { addAllowanceForAllUsers } from "./chain";
import { DAILY_ALLOWANCE } from "./constants";

async function main() {
	const now = new Date();
	console.log(
		`[${now.toISOString()}] adding allowance of ${DAILY_ALLOWANCE} for all users`,
	);
	await addAllowanceForAllUsers(DAILY_ALLOWANCE);
}

main()
	.then(() => process.exit(0))
	.catch((e) => {
		console.error(e);
		process.exit(1);
	});
