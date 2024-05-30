import { useQuery } from "@tanstack/react-query"
import { hc, type InferResponseType } from "hono/client"
import type { ApiType } from "../../src/index"
import "./App.css"
import { abbreviate } from "./utils"

const client = hc<ApiType>("/")

export type User = InferResponseType<typeof client.slash.ui.leaderboard.$get>[0]

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
		<div className="font-jacquard text-6xl md:text-[75px] flex-grow flex flex-col">
			<div className="text-left md:text-center">*/tip</div>
			<div className="md:grid md:grid-cols-2 grow py-8">
				<div className="text-left md:text-right">
					{data?.map((user) => (
						<div key={`user-${user.nickname}-${user.balance}`}>
							{user.balance}*/
							<span className="inline-block md:hidden">
								<User user={user} />
							</span>
						</div>
					))}
				</div>
				<div className="hidden md:flex text-left flex-col items-start">
					{data?.map((user) => (
						<User key={`user-${user.id}`} user={user} />
					))}
				</div>
			</div>
			<div className="flex flex-col justify-end items-center gap-y-8 py-8 md:py-12">
				<button
					type="button"
					className="rounded-3xl px-4 text-4xl md:text-5xl p-2 bg-[#02d100] text-[#03ff00] cursor-not-allowed active:translate-x-px active:translate-y-px"
				>
					redeem
				</button>
			</div>
			<div className="flex justify-center">
				<img src={"/black-gif.gif"} alt="✺" width={45} height={45} />
			</div>
		</div>
	)
}

const User = ({ user }: { user: User }) => {
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
			<div className="inline-block group-hover:hidden">{user.nickname}</div>
			<div className="hidden group-hover:block cursor-pointer active:text-[#02d100] select-none group">
				<span>{first}</span>
				<span className="inline-block align-bottom leading-6 md:leading-10 text-4xl md:text-6xl mx-1">
					***
				</span>
				<span>{last}</span>
			</div>
		</div>
	)
}

export default App
