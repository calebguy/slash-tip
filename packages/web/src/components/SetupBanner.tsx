"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function SetupBanner() {
	const searchParams = useSearchParams();
	const isInstalled = searchParams.get("installed") === "true";
	const appId = searchParams.get("app_id");
	const teamId = searchParams.get("team_id");
	const [dismissed, setDismissed] = useState(false);

	if (!isInstalled || dismissed) {
		return null;
	}

	const slackAppLink =
		appId && teamId
			? `https://slack.com/app_redirect?app=${appId}&team=${teamId}&tab=home`
			: null;

	return (
		<div className="fixed bottom-4 right-4 z-50 max-w-sm bg-slime px-4 py-3 rounded-sm">
			<div className="flex justify-between items-start gap-3">
				<div>
					<h3 className="text-black font-medium text-base">
						/tip installed successfully!
					</h3>
					<p className="text-black/70 mt-2 text-sm">
						complete setup in Slack to start tipping.
					</p>
					{slackAppLink ? (
						<a
							href={slackAppLink}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-block mt-3 px-4 py-2 bg-black text-slime font-medium text-sm rounded hover:bg-black/90 transition-colors"
						>
							open in Slack →
						</a>
					) : (
						<ol className="text-black/60 text-sm mt-2 ml-4 list-decimal space-y-1">
							<li>
								Open the <span className="text-black">/tip</span> app in Slack
							</li>
							<li>
								Go to the <span className="text-black">Home</span> tab
							</li>
							<li>
								Click <span className="text-black">Get Started</span> to
								configure your tipping token
							</li>
						</ol>
					)}
				</div>
				<button
					type="button"
					onClick={() => setDismissed(true)}
					className="text-black/40 hover:text-black/60 hover:cursor-pointer text-xl leading-none shrink-0 absolute top-1 right-2"
					aria-label="Dismiss"
				>
					&times;
				</button>
			</div>
		</div>
	);
}
