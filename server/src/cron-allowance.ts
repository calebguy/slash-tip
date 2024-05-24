import { addAllowanceForAllUsers } from "./chain";

async function main() {
	const allowance = 1;
	const now = new Date();
	console.log(
		`[${now.toISOString()}] adding allowance of ${allowance} for all users`,
	);
	await addAllowanceForAllUsers(allowance);
}

main()
	.then(() => process.exit(0))
	.catch((e) => {
		console.error(e);
		process.exit(1);
	});
