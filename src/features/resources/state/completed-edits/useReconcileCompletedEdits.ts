import { useEffect } from 'react'
import { useCompletedResourceEdits } from './CompletedResourceEditsProvider'
import type { Resource } from '../../domain/resource.types'

export function useReconcileCompletedEdits(
  serverResource: Resource | undefined,
): void {
  const { reconcileBufferedEdits } = useCompletedResourceEdits()

  useEffect(() => {
    if (!serverResource) {
      return
    }

    reconcileBufferedEdits(serverResource)
  }, [serverResource, reconcileBufferedEdits])
}
