import type { ReactNode } from 'react'
import styled from 'styled-components'

type StatusBannerProps = {
  children: ReactNode
  /** Explicit semantics when needed; omitted by default. */
  role?: 'status' | 'alert'
}

/** Visual status panel without an implicit live region. */
export function StatusBanner({ children, role }: StatusBannerProps) {
  return <Banner role={role}>{children}</Banner>
}

const Banner = styled.div`
  margin: 0;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.accentSoft};
  color: ${({ theme }) => theme.colors.inkStrong};
`
