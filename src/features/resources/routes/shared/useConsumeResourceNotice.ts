import {
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Seeds a one-shot status message from location.state and clears that state
 * from the history entry so Back/Forward does not re-show the notice.
 */
export function useConsumeResourceNotice<TNotice>(
  notice: TNotice | undefined,
  toMessage: (notice: TNotice) => string,
  clearPath: string | undefined,
): [string, Dispatch<SetStateAction<string>>] {
  const navigate = useNavigate()
  const [statusMessage, setStatusMessage] = useState(() =>
    notice ? toMessage(notice) : '',
  )

  useEffect(() => {
    if (!notice || clearPath === undefined) {
      return
    }

    navigate(clearPath, { replace: true, state: null })
  }, [notice, clearPath, navigate])

  return [statusMessage, setStatusMessage]
}
