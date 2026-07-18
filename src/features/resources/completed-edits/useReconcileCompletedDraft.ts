import { useEffect } from 'react'
import { useCompletedResourceDrafts } from './CompletedResourceDraftsProvider'
import type { Resource } from '../model/resource.types'

export function useReconcileCompletedDraft(
  serverResource: Resource | undefined,
): void {
  const { reconcileDraft } = useCompletedResourceDrafts()

  useEffect(() => {
    if (!serverResource) {
      return
    }

    reconcileDraft(serverResource)
  }, [serverResource, reconcileDraft])
}
