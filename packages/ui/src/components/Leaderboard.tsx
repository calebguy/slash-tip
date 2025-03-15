import { useQuery } from "@tanstack/react-query";
import { type InferResponseType, hc } from "hono/client";
import type { ApiType } from "../../../server/src/server";
import { IDK } from "../icons/idk";
import { abbreviate } from "../utils";
import { Header } from "./Header";

const client = hc<ApiType>("/");

export type User = InferResponseType<
	typeof client.slash.ui.leaderboard.$get
>[0];

async function getLeaderboard() {
	const res = await client.slash.ui.leaderboard.$get();
	if (!res.ok) {
		throw new Error("Failed to fetch leaderboard");
	}
	const data = await res.json();
	return data;
}

function Leaderboard() {
	const { data } = useQuery({
		queryKey: ["getLeaderboard"],
		queryFn: getLeaderboard,
	});

	return (
		<div className="text-3xl md:text-4xl grow flex flex-col">
			<Header />
			<div className="md:grid md:grid-cols-2 grow overflow-auto">
				<div className="text-left md:text-right">
					{data?.map((user) => (
						<div key={`user-${user.nickname}-${user.balance}`}>
							<span className="text-slime font-thin">{user.balance}</span>
							<span className="inline-block md:hidden font-thin">
								<User user={user} />
							</span>
						</div>
					))}
				</div>
				<div className="hidden md:flex text-left flex-col items-start font-thin">
					{data?.map((user) => (
						<User key={`user-${user.id}`} user={user} />
					))}
				</div>
			</div>
		</div>
	);
}

const User = ({ user }: { user: User }) => {
	const [first, last] = abbreviate(user.account);
	return (
		<div
			key={`user-${user.nickname}`}
			className="group inline-block"
			onClick={() => navigator.clipboard.writeText(user.account)}
			onKeyDown={() => navigator.clipboard.writeText(user.account)}
			onDoubleClick={() =>
				window.open(`https://basescan.org/address/${user.account}`)
			}
		>
			<div className="inline-block group-hover:hidden text-paper">
				{user.nickname}
			</div>
			<div className="group hidden group-hover:block cursor-pointer text-orange active:text-orange/70 select-none">
				<span>{first}</span>
				<span className="inline-flex items-center gap-0.5 md:gap-1">
					<IDK className="w-4 h-4 md:w-5 md:h-5" />
					<IDK className="w-4 h-4 md:w-5 md:h-5" />
					<IDK className="w-4 h-4 md:w-5 md:h-5" />
				</span>
				<span>{last}</span>
			</div>
		</div>
	);
};

export default Leaderboard;
