import { useQuery } from "@tanstack/react-query";
import { type InferResponseType, hc } from "hono/client";
import type { ApiType } from "../../../server/src/server";
import { IDK } from "../icons/idk";
import { abbreviate } from "../utils";

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

export function Balance() {
	const { data } = useQuery({
		queryKey: ["getLeaderboard"],
		queryFn: getLeaderboard,
	});

	return (
		<div className="h-[calc(100dvh-250px)] overflow-y-auto" id="orange-track">
			{data?.map((user) => {
				const [first, last] = abbreviate(user.account);
				return (
					<div key={`user-${user.nickname}`} className="font-thin">
						<span className="text-slime">{user.balance}/</span>
						<div
							key={`user-${user.nickname}`}
							className="group inline-block relative cursor-pointer"
							onClick={() => navigator.clipboard.writeText(user.account)}
							onKeyDown={() => navigator.clipboard.writeText(user.account)}
							onDoubleClick={() =>
								window.open(`https://basescan.org/address/${user.account}`)
							}
						>
							<div className="absolute top-0 left-0 pointer-events-none inline-block group-hover:text-transparent text-paper">
								{user.nickname}
							</div>
							<div className="text-transparent group-hover:text-orange inline-flex cursor-pointer  active:text-orange/75 select-none items-center gap-1">
								<span>{first}</span>
								<IDK className="w-5 h-5 md:w-6 md:h-6 text-transparent group-hover:text-orange/75" />
								<span>{last}</span>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}
