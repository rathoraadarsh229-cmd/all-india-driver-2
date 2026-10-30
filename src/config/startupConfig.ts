/**
 * Startup and Splash Screen Configuration
 * Calibrated comfortable 3.0 second duration for a relaxed, natural startup
 */
export const SPLASH_DURATION_SECONDS = 3.0;

export function getEffectiveSplashDurationSeconds(): number {
  return SPLASH_DURATION_SECONDS;
}
