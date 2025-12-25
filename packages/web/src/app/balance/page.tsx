import { getLeaderboard } from "@/lib/api";
import { UserRow } from "@/components/UserRow";

export const dynamic = "force-dynamic";

export default async function BalancePage() {
	const data = await getLeaderboard();

	return (
		<>
			{data.map((user) => (
				<UserRow key={user.nickname} user={user} />
			))}
		</>
	);
}
