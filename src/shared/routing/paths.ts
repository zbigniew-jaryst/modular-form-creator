export const paths = {
  home: '/',
  resources: '/resources',
  resource: (id: string | number) => `/resources/${id}`,
  resourceDetails: (id: string | number) => `/resources/${id}/details`,
  resourceBasicInfo: (id: string | number) => `/resources/${id}/basic-info`,
  resourceProjectDetails: (id: string | number) => `/resources/${id}/project-details`,
} as const
