import { type InferResponseType, hc } from "hono/client";
import type { ApiType } from "../../server/src/server";

const api = hc<ApiType>("/");

export type User = InferResponseType<typeof api.slash.ui.leaderboard.$get>[0];

export async function getLeaderboard() {
	const res = await api.slash.ui.leaderboard.$get();
	if (!res.ok) {
		throw new Error("Failed to fetch leaderboard");
	}
	const data = await res.json();
	return data;
}

export async function getActivity() {
	const res = await api.slash.ui.activity.$get();
	if (!res.ok) {
		throw new Error("Failed to fetch activity");
	}
	const data = await res.json();
	return data;
}
