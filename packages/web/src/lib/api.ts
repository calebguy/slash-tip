const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export type User = {
	nickname: string;
	account: string;
	balance: string;
};

export type ActivityItem = {
	id: number;
	amount: string;
	message: string | null;
	fromUser: { nickname: string } | null;
	toUser: { nickname: string } | null;
};

export async function getLeaderboard(): Promise<User[]> {
	const res = await fetch(`${API_BASE}/slash/ui/leaderboard`);
	if (!res.ok) {
		throw new Error("Failed to fetch leaderboard");
	}
	return res.json();
}

export async function getActivity(): Promise<ActivityItem[]> {
	const res = await fetch(`${API_BASE}/slash/ui/activity`);
	if (!res.ok) {
		throw new Error("Failed to fetch activity");
	}
	return res.json();
}
