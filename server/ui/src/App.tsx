import { useQuery } from "@tanstack/react-query"
import { hc, type InferResponseType } from "hono/client"
import type { ApiType } from "../../src/index"
import "./App.css"
import { abbreviate } from "./utils"

const client = hc<ApiType>("/")

export type User = InferResponseType<typeof client.slash.ui.leaderboard.$get>

async function getLeaderboard() {
	const res = await client.slash.ui.leaderboard.$get()
	if (!res.ok) {
		throw new Error("Failed to fetch leaderboard")
	}
	const data = await res.json()
	return data
}

function App() {
	const { data } = useQuery({
		queryKey: ["getLeaderboard"],
		queryFn: getLeaderboard,
	})

	return (
		<div className="font-jacquard text-8xl flex-grow flex flex-col">
			<div>*/tip</div>
			<div className="grid grid-cols-2 grow py-8">
				<div className="text-right">
					{data?.map((user) => (
						<div key={`user-${user.nickname}-${user.balance}`}>
							{user.balance}*/
						</div>
					))}
				</div>
				<div className="text-left flex flex-col items-start">
					{data?.map((user) => {
						const [first, last] = abbreviate(user.account)
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
								<div className="inline-block group-hover:hidden">
									{user.nickname}
								</div>
								<div className="hidden group-hover:block cursor-pointer active:text-[#02d100] select-none group">
									<span>{first}</span>
									<span className="inline-block align-bottom leading-10 text-6xl ml-2">
										***
									</span>
									<span>{last}</span>
								</div>
							</div>
						)
					})}
				</div>
			</div>
			<div className="flex flex-col justify-end items-center gap-y-8 py-12">
				<button
					type="button"
					className="text-6xl p-2 bg-[#02d100] text-[#03ff00] cursor-not-allowed"
				>
					redeem
				</button>
			</div>
			<div className="flex justify-center">
				<img src={"/black-gif.gif"} alt="✺" width={35} height={35} />
			</div>
		</div>
	)
}

export default App
