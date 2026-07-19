import {
  canonicalizeTeamMemberOptions,
  PRIORITIES,
  PROJECT_CATEGORIES,
  TEAM_MEMBER_OPTIONS,
} from './resourceModuleOptions'
import type {
  BasicInfoFormValues,
  EditableBasicInfo,
  Priority,
  ProjectCategory,
  ProjectDetailsFormValues,
  ProjectDetailsUpdatePayload,
  TeamMemberOption,
} from './resource.types'

type EditableBasicInfoInput = {
  owner: string
  email: string
  description: string
  priority: string
}

type ProjectDetailsInput = {
  projectName: string
  budget: string
  category: string
  options: readonly string[]
}

const OWNER_PATTERN = /^[A-Za-z ]+$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PROJECT_NAME_PATTERN = /^[A-Za-z0-9 -]+$/
const BUDGET_PATTERN = /^\d+$/
const MAX_OWNER_LENGTH = 255
const MAX_DESCRIPTION_LENGTH = 1000
const MAX_PROJECT_NAME_LENGTH = 255

export function validateOwner(value: string): string | undefined {
  const trimmed = value.trim()

  if (!trimmed) {
    return 'Owner is required'
  }

  if (trimmed.length > MAX_OWNER_LENGTH) {
    return 'Owner must be at most 255 characters'
  }

  if (!OWNER_PATTERN.test(trimmed)) {
    return 'Owner can contain only letters and spaces'
  }

  return undefined
}

export function validateEmail(value: string): string | undefined {
  const trimmed = value.trim()

  if (!trimmed) {
    return 'Email is required'
  }

  if (!EMAIL_PATTERN.test(trimmed)) {
    return 'Email must be a valid email format'
  }

  return undefined
}

export function validateDescription(value: string): string | undefined {
  const trimmed = value.trim()

  if (!trimmed) {
    return 'Description is required'
  }

  if (trimmed.length > MAX_DESCRIPTION_LENGTH) {
    return 'Description must be at most 1000 characters'
  }

  return undefined
}

export function validatePriority(value: string): string | undefined {
  if (!PRIORITIES.includes(value as Priority)) {
    return 'Priority must be one of: low, medium, high'
  }

  return undefined
}

export function validateProjectName(value: string): string | undefined {
  const trimmed = value.trim()

  if (!trimmed) {
    return 'Project name is required'
  }

  if (trimmed.length > MAX_PROJECT_NAME_LENGTH) {
    return 'Project name must be at most 255 characters'
  }

  if (!PROJECT_NAME_PATTERN.test(trimmed)) {
    return 'Project name can contain only letters, numbers, spaces, and hyphens'
  }

  return undefined
}

export function validateBudget(value: string): string | undefined {
  const trimmed = value.trim()

  if (!trimmed) {
    return 'Budget is required'
  }

  if (!BUDGET_PATTERN.test(trimmed)) {
    return 'Budget must contain digits only'
  }

  return undefined
}

export function validateCategory(value: string): string | undefined {
  if (!PROJECT_CATEGORIES.includes(value as ProjectCategory)) {
    return 'Category must be one of: internal, external, vendor'
  }

  return undefined
}

export function validateTeamMemberOptions(value: string[]): string | undefined {
  if (!Array.isArray(value) || value.length === 0) {
    return 'At least one team member is required'
  }

  const invalid = value.find(
    (option) => !TEAM_MEMBER_OPTIONS.includes(option as TeamMemberOption),
  )
  if (invalid) {
    return `Unsupported team member option: ${invalid}`
  }

  return undefined
}

export function normalizeEditableBasicInfo(
  values: EditableBasicInfoInput | BasicInfoFormValues,
): EditableBasicInfo {
  return {
    owner: values.owner.trim(),
    email: values.email.trim(),
    description: values.description.trim(),
    priority: values.priority as Priority,
  }
}

export function normalizeProjectDetailsPayload(
  values: ProjectDetailsInput | ProjectDetailsFormValues,
): ProjectDetailsUpdatePayload {
  return {
    projectName: values.projectName.trim(),
    budget: values.budget.trim(),
    category: values.category as ProjectCategory,
    options: canonicalizeTeamMemberOptions(values.options),
  }
}
