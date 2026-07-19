import { Link } from 'react-router-dom'
import styled from 'styled-components'

export const ResourceTextLink = styled(Link)`
  width: fit-content;
  color: ${({ theme }) => theme.colors.primaryStrong};
  text-decoration: none;
  font-weight: 600;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primaryStrong};
    outline-offset: 2px;
  }
`
