import { useEffect } from 'react'
import { useBlocker } from 'react-router-dom'
import { useBeforeUnloadWarning } from './useBeforeUnloadWarning'

const UNSAVED_CHANGES_MESSAGE =
  'You have unsaved edits on this page. Leave anyway?'

export function useUnsavedChangesWarning(enabled: boolean): void {
  useBeforeUnloadWarning(enabled)
  const blocker = useBlocker(enabled)

  useEffect(() => {
    if (blocker.state !== 'blocked') {
      return
    }

    const shouldLeave = window.confirm(UNSAVED_CHANGES_MESSAGE)

    if (shouldLeave) {
      blocker.proceed()
    } else {
      blocker.reset()
    }
  }, [blocker])
}
