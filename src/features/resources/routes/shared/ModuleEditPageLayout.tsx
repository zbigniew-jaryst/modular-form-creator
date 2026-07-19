import type { ReactNode } from 'react'
import styled from 'styled-components'
import { ResourceTextLink } from './ResourceTextLink'

type ModuleEditPageLayoutProps = {
  backTo: string
  title: string
  description: string
  children: ReactNode
}

export function ModuleEditPageLayout({
  backTo,
  title,
  description,
  children,
}: ModuleEditPageLayoutProps) {
  return (
    <Page>
      <Header>
        <ResourceTextLink to={backTo}>Back to resource</ResourceTextLink>
        <Title>{title}</Title>
        <Description>{description}</Description>
      </Header>
      {children}
    </Page>
  )
}

const Page = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xl};
  max-width: 40rem;
`

const Header = styled.header`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
`

const Title = styled.h1`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.heading};
  color: ${({ theme }) => theme.colors.inkStrong};
`

const Description = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.inkMuted};
`
