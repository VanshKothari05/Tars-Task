export default {
  providers: [
    {
      // Replace with your Clerk Frontend API URL
      // Found in Clerk Dashboard → API Keys → Frontend API
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
};
