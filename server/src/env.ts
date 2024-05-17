export const env = {
  SYNDICATE_API_KEY: process.env.SYNDICATE_API_KEY as string,
}

for (const key in env) {
  if (!env[key as keyof typeof env]) {
    throw new Error(`Environment variable ${key} is missing`)
  }
}
