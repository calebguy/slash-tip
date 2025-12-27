import Link from "next/link";

export default function LandingPage() {
	return (
		<div className="flex flex-col min-h-dvh items-center justify-center p-8">
			<div className="text-center">
				<h1 className="text-6xl md:text-8xl font-thin text-paper mb-4">/tip</h1>
				<p className="text-xl md:text-2xl text-paper/60 font-thin mb-12">
					Onchain kudos for your Slack workspace
				</p>
				<Link
					href="/syndicateio"
					className="inline-block text-2xl font-thin text-orange hover:text-slime transition-colors"
				>
					View Demo →
				</Link>
			</div>
		</div>
	);
}
