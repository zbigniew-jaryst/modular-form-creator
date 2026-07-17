import type { ReactNode } from 'react'
import styled from 'styled-components'

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return <Shell>{children}</Shell>
}

const Shell = styled.div`
  min-height: 100vh;
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.lg};
  box-sizing: border-box;

  @media (min-width: 768px) {
    padding: ${({ theme }) => `${theme.spacing.xl} ${theme.spacing.xxl}`};
  }
`
