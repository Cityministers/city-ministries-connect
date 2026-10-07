// YouVersion Platform SDK configuration.
// The app key comes from platform.youversion.com (free). It is a public
// browser-side identifier (OAuth uses PKCE, so no secret is needed).
export const YOUVERSION_APP_KEY: string =
  (import.meta.env["VITE_YOUVERSION_APP_KEY"]?.trim() ||
    "HIVeV2AAd7d0Arbcpc9WiYDXSgqd2lpJMkegIR8debZ8MN4Z");

export const HAS_YOUVERSION_APP_KEY = YOUVERSION_APP_KEY.length > 0;

// The SDK's license-free default; verified available with this app's key.
export const INSERTION_BIBLE_VERSION_ID = 3034;
export const INSERTION_BIBLE_LABEL = "BSB";
