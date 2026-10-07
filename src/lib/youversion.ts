// YouVersion Platform SDK configuration.
// The app key comes from platform.youversion.com (free). It is a public
// browser-side identifier (OAuth uses PKCE, so no secret is needed).
export const YOUVERSION_APP_KEY: string =
  import.meta.env["VITE_YOUVERSION_APP_KEY"]?.trim() ?? "";

export const HAS_YOUVERSION_APP_KEY = YOUVERSION_APP_KEY.length > 0;
