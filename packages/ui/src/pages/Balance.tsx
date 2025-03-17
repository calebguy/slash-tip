import { useQuery } from "@tanstack/react-query";
import classNames from "classnames";
import { type InferResponseType, hc } from "hono/client";
import { useState } from "react";
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
	const [idHovered, setIdHovered] = useState<string | null>(null);

	return (
		<div className="h-[calc(100dvh-250px)] overflow-y-auto" id="orange-track">
			{data?.map((user) => {
				const [first, last] = abbreviate(user.account);
				const isHovered = idHovered === user.id;
				return (
					<div key={`user-${user.nickname}`} className="font-thin">
						<span className="text-slime">{user.balance}/</span>
						<div
							key={`user-${user.nickname}`}
							className={classNames("inline-block relative")}
						>
							<div
								onMouseEnter={() => setIdHovered(user.id)}
								className={classNames(
									"text-paper",
									{ hidden: isHovered },
									{ "block absolute left-0 top-0": !isHovered },
								)}
							>
								{user.nickname}
							</div>
							<div
								onMouseLeave={() => setIdHovered(null)}
								onClick={() => navigator.clipboard.writeText(user.account)}
								onKeyDown={() => navigator.clipboard.writeText(user.account)}
								onDoubleClick={() =>
									window.open(`https://basescan.org/address/${user.account}`)
								}
								className={classNames(
									"select-none inline-flex items-center gap-1",
									{
										"text-transparent": !isHovered,
										"text-orange active:text-orange/75 cursor-pointer":
											isHovered,
									},
								)}
							>
								<span>{first}</span>
								<IDK
									className={classNames("w-5 h-5 md:w-6 md:h-6", {
										"text-orange/75": isHovered,
										"text-transparent": !isHovered,
									})}
								/>
								<span>{last}</span>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}
