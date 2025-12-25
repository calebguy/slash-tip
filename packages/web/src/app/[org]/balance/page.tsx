import { getLeaderboard } from "@/lib/api";
import { UserRow } from "@/components/UserRow";

export const dynamic = "force-dynamic";

type Props = {
	params: Promise<{ org: string }>;
};

export default async function BalancePage({ params }: Props) {
	const { org } = await params;
	const data = await getLeaderboard(org);

	return (
		<>
			{data.map((user) => (
				<UserRow key={user.nickname} user={user} />
			))}
		</>
	);
}
