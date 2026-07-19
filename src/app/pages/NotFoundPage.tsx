import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { paths } from '../../shared/routing/paths'

export function NotFoundPage() {
  return (
    <Container>
      <Title>Page not found</Title>
      <Description>The page you requested does not exist.</Description>
      <HomeLink to={paths.resources}>Back to resources</HomeLink>
    </Container>
  )
}

const Container = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  max-width: 480px;
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

const HomeLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.surface};
  text-decoration: none;
  font-weight: 600;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primaryStrong};
    outline-offset: 2px;
  }
`
