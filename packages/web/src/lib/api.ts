const API_BASE = process.env.API_URL;

if (!API_BASE) {
	throw new Error("API_URL is not defined");
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

export async function getLeaderboard(org: string): Promise<User[]> {
	const res = await fetch(`${API_BASE}/slash/ui/${org}/leaderboard`, {
		next: { revalidate: 30 },
	});
	if (!res.ok) {
		if (res.status === 404) {
			throw new Error("Organization not found");
		}
		throw new Error("Failed to fetch leaderboard");
	}
	return res.json();
}

export async function getActivity(org: string): Promise<ActivityItem[]> {
	const res = await fetch(`${API_BASE}/slash/ui/${org}/activity`, {
		next: { revalidate: 30 },
	});
	if (!res.ok) {
		if (res.status === 404) {
			throw new Error("Organization not found");
		}
		throw new Error("Failed to fetch activity");
	}
	return res.json();
}
