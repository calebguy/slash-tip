"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function SetupBanner() {
	const searchParams = useSearchParams();
	const isInstalled = searchParams.get("installed") === "true";
	const [dismissed, setDismissed] = useState(false);

	if (!isInstalled || dismissed) {
		return null;
	}

	return (
		<div className="bg-slime/10 border border-slime/30 rounded-lg p-4 mb-6">
			<div className="flex justify-between items-start">
				<div>
					<h3 className="text-slime font-medium text-lg">
						App installed successfully!
					</h3>
					<p className="text-paper/70 mt-2 text-sm">
						Complete setup in Slack to start tipping:
					</p>
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
				</div>
				<button
					onClick={() => setDismissed(true)}
					className="text-paper/40 hover:text-paper/60 text-xl leading-none"
					aria-label="Dismiss"
				>
					&times;
				</button>
			</div>
		</div>
	);
}
