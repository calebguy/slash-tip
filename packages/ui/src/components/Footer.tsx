import { Logo } from "../icons/logo";

export function Footer() {
	return (
		<div className="flex items-center mt-2">
			<Logo className="w-10 h-10 text-paper" />
			<div className="font-thin">Leaderboard</div>
		</div>
	);
}
