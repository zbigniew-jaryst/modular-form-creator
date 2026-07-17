export type ResourceStatus = 'draft' | 'completed'

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
