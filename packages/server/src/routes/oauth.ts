import { Hono } from "hono";
import { env } from "../env";
import { db } from "../server";

const SLACK_OAUTH_URL = "https://slack.com/api/oauth.v2.access";
const SITE_URL = "https://slack.tips";

interface SlackOAuthResponse {
	ok: boolean;
	error?: string;
	access_token?: string;
	token_type?: string;
	scope?: string;
	bot_user_id?: string;
	app_id?: string;
	team?: {
		id: string;
		name: string;
	};
	authed_user?: {
		id: string;
	};
}

const app = new Hono()
	/**
	 * GET /oauth/install
	 * Redirects to Slack's OAuth authorization page
	 */
	.get("/install", (c) => {
		const scopes = ["commands", "chat:write"].join(",");
		const redirectUri = `${c.req.url.split("/oauth")[0]}/oauth/callback`;

		const slackAuthUrl = new URL("https://slack.com/oauth/v2/authorize");
		slackAuthUrl.searchParams.set("client_id", env.SLACK_CLIENT_ID);
		slackAuthUrl.searchParams.set("scope", scopes);
		slackAuthUrl.searchParams.set("redirect_uri", redirectUri);

		return c.redirect(slackAuthUrl.toString());
	})

	/**
	 * GET /oauth/callback
	 * Handles the OAuth callback from Slack after user authorizes
	 */
	.get("/callback", async (c) => {
		const code = c.req.query("code");
		const error = c.req.query("error");

		if (error) {
			console.error("OAuth error from Slack:", error);
			return c.redirect(`${SITE_URL}?error=oauth_denied`);
		}

		if (!code) {
			console.error("No code provided in OAuth callback");
			return c.redirect(`${SITE_URL}?error=missing_code`);
		}

		const redirectUri = `${c.req.url.split("/oauth")[0]}/oauth/callback`;

		try {
			// Exchange code for access token
			const response = await fetch(SLACK_OAUTH_URL, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: new URLSearchParams({
					client_id: env.SLACK_CLIENT_ID,
					client_secret: env.SLACK_CLIENT_SECRET,
					code,
					redirect_uri: redirectUri,
				}),
			});

			const data: SlackOAuthResponse = await response.json();

			if (!data.ok || !data.team) {
				console.error("Slack OAuth failed:", data.error);
				return c.redirect(`${SITE_URL}?error=oauth_failed`);
			}

			console.log("Slack OAuth success:", {
				teamId: data.team.id,
				teamName: data.team.name,
			});

			// Check if org already exists
			const [existingOrg] = await db.getOrgBySlackTeamId(data.team.id);

			if (existingOrg) {
				// Update the bot token
				await db.updateOrg(existingOrg.id, {
					slackBotToken: data.access_token,
				});
				console.log(`Updated existing org: ${existingOrg.slug}`);
				return c.redirect(`${SITE_URL}/${existingOrg.slug}?installed=true`);
			}

			// Create new org
			const slug = data.team.name
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-|-$/g, "");

			const [newOrg] = await db.createOrg({
				slug,
				name: data.team.name,
				slackTeamId: data.team.id,
				slackBotToken: data.access_token,
				actionType: "syndicate_send_transaction",
				// actionConfig will need to be set up separately by admin
			});

			console.log(`Created new org: ${newOrg.slug}`);

			// Redirect to setup page (they need to configure action)
			return c.redirect(`${SITE_URL}/${newOrg.slug}?installed=true&setup=true`);
		} catch (err) {
			console.error("OAuth callback error:", err);
			return c.redirect(`${SITE_URL}?error=server_error`);
		}
	});

export default app;
