import styled from 'styled-components'

type StatusLiveRegionProps = {
  message: string
}

export function StatusLiveRegion({ message }: StatusLiveRegionProps) {
  return (
    <StatusRegion aria-live="polite">
      {message ? <StatusMessage>{message}</StatusMessage> : null}
    </StatusRegion>
  )
}

const StatusRegion = styled.div`
  min-height: 0;
`

const StatusMessage = styled.p`
  margin: 0;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.accentSoft};
  color: ${({ theme }) => theme.colors.inkStrong};
`
