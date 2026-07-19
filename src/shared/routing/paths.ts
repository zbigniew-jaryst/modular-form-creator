export const paths = {
  home: '/',
  resources: '/resources',
  resource: (id: string | number) => `/resources/${id}`,
  resourceDetails: (id: string | number) => `/resources/${id}/details`,
  resourceBasicInfo: (id: string | number) => `/resources/${id}/basic-info`,
  resourceProjectDetails: (id: string | number) => `/resources/${id}/project-details`,
} as const

/** Route patterns for React Router <Route path> and test tables. */
export const pathPatterns = {
  resource: '/resources/:resourceId',
  resourceDetails: '/resources/:resourceId/details',
  resourceBasicInfo: '/resources/:resourceId/basic-info',
  resourceProjectDetails: '/resources/:resourceId/project-details',
} as const
