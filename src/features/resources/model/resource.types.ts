export type ResourceStatus = 'draft' | 'completed'

export type Priority = 'low' | 'medium' | 'high'

export type ProjectCategory = 'internal' | 'external' | 'vendor'

export type TeamMemberOption =
  | 'FE devs'
  | 'BE devs'
  | 'Designer'
  | 'Data Eng'
  | 'Product Owner'

export type BasicInfo = {
  resourceName: string
  owner: string
  email: string
  description: string
  priority: string
}

export type ProjectDetails = {
  projectName: string
  budget: string
  category: string
  options: string[]
}

export type Resource = {
  _id?: string
  resourceId: number
  name: string
  status: ResourceStatus
  basicInfo: BasicInfo
  projectDetails: ProjectDetails
  createdAt?: string
  updatedAt?: string
}

export type BasicInfoFormValues = {
  owner: string
  email: string
  description: string
  priority: Priority | ''
}

export type ProjectDetailsFormValues = {
  projectName: string
  budget: string
  category: ProjectCategory | ''
  options: TeamMemberOption[]
}

export type BasicInfoUpdatePayload = {
  resourceName: string
  owner: string
  email: string
  description: string
  priority: Priority
}

export type ProjectDetailsUpdatePayload = {
  projectName: string
  budget: string
  category: ProjectCategory
  options: TeamMemberOption[]
}

export type ResourceListPagination = {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export type ResourceListResponse = {
  items: Resource[]
  pagination: ResourceListPagination
}

export type ResourceSortOrder = 'asc' | 'desc'

export type ResourceListQuery = {
  page: number
  pageSize: number
  status?: ResourceStatus
  name?: string
  sortOrder: ResourceSortOrder
}

export type CreateResourcePayload = {
  resourceName: string
}
