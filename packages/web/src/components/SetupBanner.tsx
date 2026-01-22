"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function SetupBanner() {
	const searchParams = useSearchParams();
	const isInstalled = searchParams.get("installed") === "true";
	const appId = searchParams.get("app_id");
	const [dismissed, setDismissed] = useState(false);

	if (!isInstalled || dismissed) {
		return null;
	}

	const slackAppLink = appId
		? `https://slack.com/app_redirect?app=${appId}&tab=home`
		: null;

	return (
		<div className="fixed bottom-4 right-4 z-50 max-w-sm bg-black border-2 border-slime rounded-lg p-4 pl-5 shadow-[0_0_20px_rgba(163,255,60,0.3)]">
			<div className="flex justify-between items-start gap-3">
				<div>
					<h3 className="text-slime font-medium text-base">
						App installed successfully!
					</h3>
					<p className="text-paper/70 mt-2 text-sm">
						Complete setup in Slack to start tipping.
					</p>
					{slackAppLink ? (
						<a
							href={slackAppLink}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-block mt-3 px-4 py-2 bg-slime text-black font-medium text-sm rounded hover:bg-slime/90 transition-colors"
						>
							Open in Slack →
						</a>
					) : (
						<ol className="text-paper/60 text-sm mt-2 ml-4 list-decimal space-y-1">
							<li>
								Open the <span className="text-paper">/tip</span> app in Slack
							</li>
							<li>
								Go to the <span className="text-paper">Home</span> tab
							</li>
							<li>
								Click <span className="text-paper">Get Started</span> to configure
								your tipping token
							</li>
						</ol>
					)}
				</div>
				<button
					onClick={() => setDismissed(true)}
					className="text-paper/40 hover:text-paper/60 text-xl leading-none shrink-0"
					aria-label="Dismiss"
				>
					&times;
				</button>
			</div>
		</div>
	);
}
