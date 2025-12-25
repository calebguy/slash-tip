"use client";

import { useQuery } from "@tanstack/react-query";
import classNames from "classnames";
import { getLeaderboard } from "@/lib/api";
import { IDK } from "@/icons/idk";
import { abbreviate } from "@/lib/utils";

export default function BalancePage() {
	const { data } = useQuery({
		queryKey: ["getLeaderboard"],
		queryFn: getLeaderboard,
	});
	return (
		<>
			{data?.map((user) => {
				const abbreviated = abbreviate(user.account);
				const [first, last] = Array.isArray(abbreviated)
					? abbreviated
					: [abbreviated, ""];
				return (
					<div key={`user-${user.nickname}`} className="font-thin">
						<span className="text-slime">{user.balance}/</span>
						<div
							className={classNames("inline-block relative group transition")}
						>
							<div
								className={classNames(
									"text-paper group-hover:hidden block transition duration-150",
								)}
							>
								{user.nickname}
							</div>
							<div
								onClick={() => navigator.clipboard.writeText(user.account)}
								onKeyDown={() => navigator.clipboard.writeText(user.account)}
								onDoubleClick={() =>
									window.open(`https://basescan.org/address/${user.account}`)
								}
								className={classNames(
									"select-none items-center gap-1 hidden group-hover:inline-flex text-orange active:text-orange/50 cursor-pointer transition duration-150",
								)}
							>
								<span>{first}</span>
								{last && <IDK className={classNames("w-5 h-5 md:w-6 md:h-6")} />}
								{last && <span>{last}</span>}
							</div>
						</div>
					</div>
				);
			})}
		</>
	);
}
