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

export const PRIORITY_OPTIONS = PRIORITIES.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}))

export const CATEGORY_OPTIONS = PROJECT_CATEGORIES.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}))
