export const adConfig = {
  enabled: import.meta.env.VITE_ADSTERRA_ENABLED === "true",
  devMode: import.meta.env.VITE_ADSTERRA_DEV_MODE !== "false",
  homeTopBannerId: import.meta.env.VITE_ADSTERRA_BANNER_ID || "",
  homeNativeId: import.meta.env.VITE_ADSTERRA_NATIVE_ID || "",
  gameDashboardBannerId: import.meta.env.VITE_ADSTERRA_BANNER_ID || "",
  interstitialId: import.meta.env.VITE_ADSTERRA_INTERSTITIAL_ID || "",
  socialBarId: import.meta.env.VITE_ADSTERRA_SOCIALBAR_ID || "",
  smartlinkUrl: import.meta.env.VITE_ADSTERRA_SMARTLINK_URL || "",
  rewardedAdId: ""
};
