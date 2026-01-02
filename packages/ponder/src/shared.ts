import { createPublicClient } from "viem";

import { Db } from "db";
import { http } from "viem";
import { base } from "viem/chains";

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL is not set");
}

export const publicClient = createPublicClient({
	chain: base,
	transport: http(process.env.PONDER_RPC_URL_BASE),
});

export const db = new Db(
	process.env.DATABASE_URL,
	process.env.DATABASE_URL.includes("neon"),
);
