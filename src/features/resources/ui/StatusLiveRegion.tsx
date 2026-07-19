import { StatusBanner } from './StatusBanner'
import styled from 'styled-components'

type StatusLiveRegionProps = {
  message: string
}

/** One-shot announcements via aria-live. */
export function StatusLiveRegion({ message }: StatusLiveRegionProps) {
  return (
    <StatusRegion aria-live="polite">
      {message ? <StatusBanner role="status">{message}</StatusBanner> : null}
    </StatusRegion>
  )
}

const StatusRegion = styled.div`
  min-height: 0;
`
