import { getLeaderboard } from "@/lib/api";
import { UserRow } from "@/components/UserRow";

export const dynamic = "force-dynamic";

type Props = {
	params: Promise<{ org: string }>;
};

export default async function BalancePage({ params }: Props) {
	const { org } = await params;
	const data = await getLeaderboard(org);

	if (data.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-full text-center">
				<p className="text-paper/60 font-thin text-xl">No balances yet</p>
				<p className="text-paper/40 font-thin text-lg mt-2">
					Use /tip in Slack to get started
				</p>
				<p className="text-paper/30 font-thin text-sm mt-4">
					Register your wallet with /register 0x... to receive tips onchain
				</p>
			</div>
		);
	}

	return (
		<>
			{data.map((user) => (
				<UserRow key={user.nickname} user={user} />
			))}
		</>
	);
}
