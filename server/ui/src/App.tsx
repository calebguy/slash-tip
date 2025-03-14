import { useQuery } from "@tanstack/react-query";
import { type InferResponseType, hc } from "hono/client";
import type { ApiType } from "../../src/server";
import { abbreviate } from "./utils";

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

function App() {
	const { data } = useQuery({
		queryKey: ["getLeaderboard"],
		queryFn: getLeaderboard,
	});

	return (
		<div className="font-jacquard text-4xl md:text-6xl grow flex flex-col justify-stretch items-stretch h-full">
			<div className="text-left md:text-center">/tip</div>
			<div className="md:grid md:grid-cols-2 grow overflow-auto my-8">
				<div className="text-left md:text-right font-thin">
					{data?.map((user) => (
						<div key={`user-${user.nickname}-${user.balance}`}>
							<span className="font-thin">{user.balance}</span>/
							<span className="inline-block md:hidden font-light">
								<User user={user} />
							</span>
						</div>
					))}
				</div>
				<div className="hidden md:flex text-left flex-col items-start font-light">
					{data?.map((user) => (
						<User key={`user-${user.id}`} user={user} />
					))}
				</div>
			</div>
			<div>
				<div className="flex flex-col justify-end items-center gap-y-8">
					<button
						type="button"
						className="rounded-3xl px-4 text-4xl p-2 bg-[#02d100] text-[#03ff00] cursor-not-allowed active:translate-x-px active:translate-y-px"
					>
						redeem
					</button>
				</div>
				<div className="flex justify-center mt-6">
					<span className="w-12 h-12">
						<img src={"/logo.svg"} alt="syn" />
					</span>
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
			<div className="inline-block group-hover:hidden">{user.nickname}</div>
			<div className="hidden group-hover:block cursor-pointer active:text-[#02d100] select-none group">
				<span>{first}</span>
				<span className="inline-flex items-center mx-1">
					<img src={"/thing.svg"} alt="syn" className="w-6 h-6" />
				</span>
				<span>{last}</span>
			</div>
		</div>
	);
};

export default App;
