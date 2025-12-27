import Link from "next/link";
import { FaSlack } from "react-icons/fa";

const API_URL = process.env.API_URL;

const ERROR_MESSAGES: Record<string, string> = {
	oauth_denied: "You declined the installation. No worries, you can try again whenever you're ready.",
	oauth_failed: "Something went wrong with Slack authorization. Please try again.",
	missing_code: "Authorization failed. Please try again.",
	server_error: "Something went wrong on our end. Please try again later.",
};

export default function LandingPage({
	searchParams,
}: {
	searchParams: { error?: string };
}) {
	const errorMessage = searchParams.error ? ERROR_MESSAGES[searchParams.error] : null;

	return (
		<div className="flex flex-col min-h-dvh items-center justify-center p-8">
			<div className="text-center">
				<h1 className="text-6xl md:text-8xl font-thin text-paper mb-4">/tip</h1>
				<p className="text-xl md:text-2xl text-paper/60 font-thin mb-12">
					Onchain tips for your Slack workspace
				</p>
				{errorMessage && (
					<div className="mb-8 px-6 py-4 border border-orange/50 rounded text-orange text-lg">
						{errorMessage}
					</div>
				)}
				<div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
					<a
						href={`${API_URL}/slash/oauth/install`}
						className="inline-flex items-center gap-3 px-8 py-3 text-xl font-thin border border-paper text-paper hover:border-orange hover:text-orange transition-colors rounded"
					>
						<FaSlack className="text-2xl" />
						Add to Slack
					</a>
					<Link
						href="/syndicate"
						className="inline-block text-xl font-thin text-paper/60 hover:text-orange transition-colors"
					>
						View Demo →
					</Link>
				</div>
			</div>
		</div>
	);
}
