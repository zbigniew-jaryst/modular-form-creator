export const paths = {
  home: '/',
  resources: '/resources',
  resource: (id: string | number) => `/resources/${id}`,
  resourceBasicInfo: (id: string | number) => `/resources/${id}/basic-info`,
  resourceProjectDetails: (id: string | number) => `/resources/${id}/project-details`,
} as const
