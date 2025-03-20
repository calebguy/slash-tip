import UserRegistryAbi from "utils/src/abis/UserRegistryAbi";
import { USER_REGISTRY_ADDRESS } from "utils/src/constants";
import { db, publicClient } from "./shared";


export async function syncUserRegistry() {
	const users = await publicClient.readContract({
		address: USER_REGISTRY_ADDRESS,
		abi: UserRegistryAbi,
		functionName: "listUsers",
	});
	for (const user of users) {
		await db.upsertUser({
			id: user.id,
			nickname: user.nickname,
			address: user.account,
		});
	}
}
