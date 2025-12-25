const API_BASE = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE) {
	throw new Error("NEXT_PUBLIC_API_URL is not defined");
}

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
	const res = await fetch(`${API_BASE}/slash/ui/leaderboard`, {
		next: { revalidate: 30 },
	});
	if (!res.ok) {
		throw new Error("Failed to fetch leaderboard");
	}
	return res.json();
}

export async function getActivity(): Promise<ActivityItem[]> {
	const res = await fetch(`${API_BASE}/slash/ui/activity`, {
		next: { revalidate: 30 },
	});
	if (!res.ok) {
		throw new Error("Failed to fetch activity");
	}
	return res.json();
}
