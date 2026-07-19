import { describe, expect, it } from 'vitest'
import { canonicalizeTeamMemberOptions } from '../../domain/resourceModuleOptions'
import {
  createCompleteBasicInfo,
  createCompleteProjectDetails,
  createResource,
} from '../../test/support/resourceFixtures'
import {
  applyBasicInfoOverride,
  applyProjectDetailsOverride,
  clearBufferedEditsFromState,
  reconcileBufferedEditsInState,
  reconcileBufferedEditsSnapshot,
  stateHasAnyBufferedEdits,
} from './completedResourceEdits.reducer'
import {
  getChangedModules,
  getEffectiveBasicInfo,
  getEffectiveProjectDetails,
} from './completedResourceEdits.selectors'
import { buildFullUpdatePayload } from './completedResourceUpdatePayload'
import type { CompletedResourceEditsState } from './completedResourceEdits.types'

function completedServerResource() {
  return createResource({
    resourceId: 42,
    name: 'Locked Name',
    status: 'completed',
    basicInfo: createCompleteBasicInfo({
      resourceName: 'Locked Name',
      owner: 'Jane Owner',
      email: 'jane@example.com',
      description: 'Server description',
      priority: 'medium',
    }),
    projectDetails: createCompleteProjectDetails({
      projectName: 'Server Project',
      budget: '1000',
      category: 'internal',
      options: ['FE devs', 'Designer'],
    }),
  })
}

describe('completedResourceEdits reducer and selectors', () => {
  it('applies Basic Info and stores only Basic Info changes', () => {
    const serverResource = completedServerResource()
    const state = applyBasicInfoOverride({}, serverResource, {
      owner: 'New Owner',
      email: 'jane@example.com',
      description: 'Server description',
      priority: 'medium',
    })

    expect(state['42']).toEqual({
      basicInfo: {
        owner: 'New Owner',
        email: 'jane@example.com',
        description: 'Server description',
        priority: 'medium',
      },
    })
  })

  it('does not buffer Basic Info overrides for draft resources', () => {
    const draftResource = createResource({
      resourceId: 42,
      status: 'draft',
      basicInfo: createCompleteBasicInfo({
        owner: 'Jane Owner',
        email: 'jane@example.com',
        description: 'Server description',
        priority: 'medium',
      }),
    })

    const state = applyBasicInfoOverride({}, draftResource, {
      owner: 'New Owner',
      email: 'jane@example.com',
      description: 'Server description',
      priority: 'medium',
    })

    expect(state).toEqual({})
  })

  it('applies Project Details and stores only Project Details changes', () => {
    const serverResource = completedServerResource()
    const state = applyProjectDetailsOverride({}, serverResource, {
      projectName: 'New Project',
      budget: '1000',
      category: 'internal',
      options: ['FE devs', 'Designer'],
    })

    expect(state['42']).toEqual({
      projectDetails: {
        projectName: 'New Project',
        budget: '1000',
        category: 'internal',
        options: ['FE devs', 'Designer'],
      },
    })
  })

  it('does not buffer Project Details overrides for draft resources', () => {
    const draftResource = createResource({
      resourceId: 42,
      status: 'draft',
      projectDetails: createCompleteProjectDetails({
        projectName: 'Server Project',
        budget: '1000',
        category: 'internal',
        options: ['FE devs', 'Designer'],
      }),
    })

    const state = applyProjectDetailsOverride({}, draftResource, {
      projectName: 'New Project',
      budget: '1000',
      category: 'internal',
      options: ['FE devs', 'Designer'],
    })

    expect(state).toEqual({})
  })

  it('preserves an existing Basic Info override when applying Project Details', () => {
    const serverResource = completedServerResource()
    let state = applyBasicInfoOverride({}, serverResource, {
      owner: 'New Owner',
      email: 'jane@example.com',
      description: 'Server description',
      priority: 'medium',
    })
    state = applyProjectDetailsOverride(state, serverResource, {
      projectName: 'New Project',
      budget: '2000',
      category: 'external',
      options: ['BE devs'],
    })

    expect(state['42']?.basicInfo?.owner).toBe('New Owner')
    expect(state['42']?.projectDetails?.projectName).toBe('New Project')
  })

  it('preserves an existing Project Details override when applying Basic Info', () => {
    const serverResource = completedServerResource()
    let state = applyProjectDetailsOverride({}, serverResource, {
      projectName: 'New Project',
      budget: '1000',
      category: 'internal',
      options: ['FE devs', 'Designer'],
    })
    state = applyBasicInfoOverride(state, serverResource, {
      owner: 'New Owner',
      email: 'new@example.com',
      description: 'Updated',
      priority: 'high',
    })

    expect(state['42']?.projectDetails?.projectName).toBe('New Project')
    expect(state['42']?.basicInfo?.owner).toBe('New Owner')
  })

  it('isolates buffers for separate resources', () => {
    const first = completedServerResource()
    const second = createResource({
      ...completedServerResource(),
      resourceId: 99,
      name: 'Other',
      basicInfo: createCompleteBasicInfo({ resourceName: 'Other' }),
    })

    let state = applyBasicInfoOverride({}, first, {
      owner: 'First Owner',
      email: 'jane@example.com',
      description: 'Server description',
      priority: 'medium',
    })
    state = applyBasicInfoOverride(state, second, {
      owner: 'Second Owner',
      email: 'jane@example.com',
      description: 'A useful resource',
      priority: 'medium',
    })

    expect(state['42']?.basicInfo?.owner).toBe('First Owner')
    expect(state['99']?.basicInfo?.owner).toBe('Second Owner')
  })

  it('removes a module override when applied values equal server data', () => {
    const serverResource = completedServerResource()
    let state = applyBasicInfoOverride({}, serverResource, {
      owner: 'New Owner',
      email: 'jane@example.com',
      description: 'Server description',
      priority: 'medium',
    })
    state = applyBasicInfoOverride(state, serverResource, {
      owner: 'Jane Owner',
      email: 'jane@example.com',
      description: 'Server description',
      priority: 'medium',
    })

    expect(state['42']).toBeUndefined()
  })

  it('removes the resource buffer entry when the final changed module is reverted', () => {
    const serverResource = completedServerResource()
    let state = applyBasicInfoOverride({}, serverResource, {
      owner: 'New Owner',
      email: 'jane@example.com',
      description: 'Server description',
      priority: 'medium',
    })
    state = applyProjectDetailsOverride(state, serverResource, {
      projectName: 'New Project',
      budget: '1000',
      category: 'internal',
      options: ['FE devs', 'Designer'],
    })
    state = applyBasicInfoOverride(state, serverResource, {
      owner: 'Jane Owner',
      email: 'jane@example.com',
      description: 'Server description',
      priority: 'medium',
    })
    state = applyProjectDetailsOverride(state, serverResource, {
      projectName: 'Server Project',
      budget: '1000',
      category: 'internal',
      options: ['FE devs', 'Designer'],
    })

    expect(state).toEqual({})
    expect(stateHasAnyBufferedEdits(state)).toBe(false)
  })

  it('merges effective Basic Info from server data and local override', () => {
    const serverResource = completedServerResource()
    const bufferedEdits = {
      basicInfo: {
        owner: 'Buffered Owner',
        email: 'buffered@example.com',
        description: 'Buffered',
        priority: 'high' as const,
      },
    }

    expect(getEffectiveBasicInfo(serverResource, bufferedEdits)).toEqual(bufferedEdits.basicInfo)
    expect(getEffectiveBasicInfo(serverResource, undefined).owner).toBe('Jane Owner')
  })

  it('merges effective Project Details from server data and local override', () => {
    const serverResource = completedServerResource()
    const bufferedEdits = {
      projectDetails: {
        projectName: 'Buffered Project',
        budget: '500',
        category: 'vendor' as const,
        options: ['Product Owner' as const],
      },
    }

    expect(getEffectiveProjectDetails(serverResource, bufferedEdits)).toEqual(
      bufferedEdits.projectDetails,
    )
    expect(getEffectiveProjectDetails(serverResource, undefined).projectName).toBe(
      'Server Project',
    )
  })

  it('builds a full PUT payload from the latest Resource plus current overrides', () => {
    const serverResource = completedServerResource()
    const bufferedEdits = {
      basicInfo: {
        owner: 'Buffered Owner',
        email: 'buffered@example.com',
        description: 'Buffered',
        priority: 'high' as const,
      },
    }

    const payload = buildFullUpdatePayload(serverResource, bufferedEdits)

    expect(payload).toEqual({
      name: 'Locked Name',
      basicInfo: {
        resourceName: 'Locked Name',
        owner: 'Buffered Owner',
        email: 'buffered@example.com',
        description: 'Buffered',
        priority: 'high',
      },
      projectDetails: {
        projectName: 'Server Project',
        budget: '1000',
        category: 'internal',
        options: ['FE devs', 'Designer'],
      },
    })
  })

  it('injects the unchanged canonical name into both name fields', () => {
    const serverResource = completedServerResource()
    const payload = buildFullUpdatePayload(serverResource, {
      basicInfo: {
        owner: 'Someone',
        email: 'a@b.com',
        description: 'Desc',
        priority: 'low',
      },
    })

    expect(payload.name).toBe('Locked Name')
    expect(payload.basicInfo.resourceName).toBe('Locked Name')
  })

  it('omits status, IDs and dates from the PUT payload', () => {
    const serverResource = completedServerResource()
    const payload = buildFullUpdatePayload(serverResource, undefined)

    expect(payload).not.toHaveProperty('status')
    expect(payload).not.toHaveProperty('_id')
    expect(payload).not.toHaveProperty('resourceId')
    expect(payload).not.toHaveProperty('createdAt')
    expect(payload).not.toHaveProperty('updatedAt')
    expect(Object.keys(payload).sort()).toEqual([
      'basicInfo',
      'name',
      'projectDetails',
    ])
  })

  it('copies options arrays rather than mutating inputs', () => {
    const serverResource = completedServerResource()
    const options = ['Designer', 'FE devs'] as const
    const values = {
      projectName: 'New Project',
      budget: '1000',
      category: 'internal' as const,
      options: [...options],
    }

    const state = applyProjectDetailsOverride({}, serverResource, values)
    state['42']!.projectDetails!.options.push('BE devs')

    expect(values.options).toEqual(['Designer', 'FE devs'])
  })

  it('stores and submits options in canonical TEAM_MEMBER_OPTIONS order', () => {
    const serverResource = completedServerResource()
    const state = applyProjectDetailsOverride({}, serverResource, {
      projectName: 'New Project',
      budget: '1000',
      category: 'internal',
      options: ['Product Owner', 'FE devs', 'FE devs', 'Designer'],
    })

    expect(state['42']?.projectDetails?.options).toEqual([
      'FE devs',
      'Designer',
      'Product Owner',
    ])

    const payload = buildFullUpdatePayload(serverResource, state['42'])
    expect(payload.projectDetails.options).toEqual([
      'FE devs',
      'Designer',
      'Product Owner',
    ])
    expect(canonicalizeTeamMemberOptions(['Designer', 'FE devs'])).toEqual([
      'FE devs',
      'Designer',
    ])
  })

  it('reports only modules that actually differ from server data', () => {
    const serverResource = completedServerResource()
    const bufferedEdits = {
      basicInfo: {
        owner: 'New Owner',
        email: 'jane@example.com',
        description: 'Server description',
        priority: 'medium' as const,
      },
      projectDetails: {
        projectName: 'Server Project',
        budget: '1000',
        category: 'internal' as const,
        options: ['Designer', 'FE devs'] as ('Designer' | 'FE devs')[],
      },
    }

    expect(getChangedModules(serverResource, bufferedEdits)).toEqual(['basic-info'])
  })

  it('removes stale overrides that equal refreshed server data', () => {
    const serverResource = completedServerResource()
    let state: CompletedResourceEditsState = {
      '42': {
        basicInfo: {
          owner: 'New Owner',
          email: 'jane@example.com',
          description: 'Server description',
          priority: 'medium',
        },
      },
    }

    const refreshed = createResource({
      ...serverResource,
      basicInfo: createCompleteBasicInfo({
        resourceName: 'Locked Name',
        owner: 'New Owner',
        email: 'jane@example.com',
        description: 'Server description',
        priority: 'medium',
      }),
    })

    state = reconcileBufferedEditsInState(state, refreshed)
    expect(state['42']).toBeUndefined()
    expect(reconcileBufferedEditsSnapshot(refreshed, {
      basicInfo: {
        owner: 'New Owner',
        email: 'jane@example.com',
        description: 'Server description',
        priority: 'medium',
      },
    })).toBeUndefined()
  })

  it('clears only the requested resource buffered edits', () => {
    const first = completedServerResource()
    const second = createResource({
      ...completedServerResource(),
      resourceId: 7,
    })

    let state = applyBasicInfoOverride({}, first, {
      owner: 'A',
      email: 'jane@example.com',
      description: 'Server description',
      priority: 'medium',
    })
    state = applyBasicInfoOverride(state, second, {
      owner: 'B',
      email: 'jane@example.com',
      description: 'Server description',
      priority: 'medium',
    })
    state = clearBufferedEditsFromState(state, 42)

    expect(state['42']).toBeUndefined()
    expect(state['7']?.basicInfo?.owner).toBe('B')
  })
})
