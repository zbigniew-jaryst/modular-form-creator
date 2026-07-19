import { Link } from 'react-router-dom'
import styled from 'styled-components'

export const ResourceActionLink = styled(Link)<{ $primary?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid
    ${({ theme, $primary }) =>
      $primary ? theme.colors.primaryStrong : theme.colors.border};
  background: ${({ theme, $primary }) =>
    $primary ? theme.colors.primaryStrong : theme.colors.surface};
  color: ${({ theme, $primary }) =>
    $primary ? theme.colors.surface : theme.colors.inkStrong};
  text-decoration: none;
  font-weight: 600;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primaryStrong};
    outline-offset: 2px;
  }
`
