/**
 * Paid season pass is implemented but paused — everything is free for now.
 * Flip to true when re-enabling Stripe checkout + company caps.
 */
export const MONETIZATION_ENABLED = false;

/**
 * Free plan company cap (only enforced when MONETIZATION_ENABLED).
 * Season pass unlocks unlimited tracking through the season end date.
 */
export const FREE_COMPANY_LIMIT = 3;

export const UPGRADE_PATH = "/upgrade";

/** One-time Summer 2027 season pass (USD cents). */
export const SEASON_PASS_PRICE_CENTS = 1000;

export const SEASON_PASS_NAME = "Summer 2027 Season Pass";

export const SEASON_PASS_DESCRIPTION =
  "Unlimited company tracking for the Summer 2027 internship season.";

/** Pass covers alerts through end of summer recruiting. */
export const SEASON_PASS_EXPIRES_AT = "2027-09-01T00:00:00.000Z";

export const SEASON_PASS_PRODUCT_KEY = "season_pass_2027";
