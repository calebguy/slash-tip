import { useQuery } from "@tanstack/react-query";
import classNames from "classnames";
import { getLeaderboard } from "../api";
import { IDK } from "../icons/idk";
import { abbreviate } from "../utils";

export function Balance() {
	const { data } = useQuery({
		queryKey: ["getLeaderboard"],
		queryFn: getLeaderboard,
	});
	return (
		<>
			{data?.map((user) => {
				const [first, last] = abbreviate(user.account);
				return (
					<div key={`user-${user.nickname}`} className="font-thin">
						<span className="text-slime">{user.balance}/</span>
						<div
							key={`user-${user.nickname}`}
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
								<IDK className={classNames("w-5 h-5 md:w-6 md:h-6")} />
								<span>{last}</span>
							</div>
						</div>
					</div>
				);
			})}
		</>
	);
}
