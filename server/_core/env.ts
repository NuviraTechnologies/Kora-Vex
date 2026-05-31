export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // Moonshot Kimi API — direct, no Manus
  moonshotApiKey: process.env.MOONSHOT_API_KEY ?? "",
  // Replicate for image/video generation
  replicateApiKey: process.env.REPLICATE_API_KEY ?? "",
};