import type { Priority, ProjectCategory, TeamMemberOption } from './resource.types'

export const PRIORITIES: readonly Priority[] = ['low', 'medium', 'high'] as const

export const PROJECT_CATEGORIES: readonly ProjectCategory[] = [
  'internal',
  'external',
  'vendor',
] as const

export const TEAM_MEMBER_OPTIONS: readonly TeamMemberOption[] = [
  'FE devs',
  'BE devs',
  'Designer',
  'Data Eng',
  'Product Owner',
] as const

/** Keep selected team members in the canonical domain order. */
export function canonicalizeTeamMemberOptions(
  options: readonly string[],
): TeamMemberOption[] {
  const unique = new Set(options)
  return TEAM_MEMBER_OPTIONS.filter((option) => unique.has(option))
}
