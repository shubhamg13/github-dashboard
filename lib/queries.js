/**
 * GraphQL query strings used by the dashboard generator.
 */

/** Get the account creation date so we know which year to start from. */
export const CREATED_AT_QUERY = `
  query($login: String!) {
    user(login: $login) {
      createdAt
    }
  }
`;

/**
 * Get the total contribution count for a single time range.
 * `from`/`to` must be at most one year apart (we keep ranges under ~6 months).
 */
export const CONTRIBUTIONS_QUERY = `
  query($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
        }
      }
    }
  }
`;
