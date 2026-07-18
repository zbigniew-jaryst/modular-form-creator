import styled from 'styled-components'
import { Badge, Card } from '../../../design-system'
import type { Resource } from '../model/resource.types'
import {
  displayCategory,
  displayDate,
  displayOptions,
  displayPriority,
  displayValue,
  EMPTY_DISPLAY,
} from '../model/resourceDisplay'
import { getResourceProgress } from '../model/resourceProgress'
import { ResourceStatusBadge } from './ResourceStatusBadge'

type ResourceSummaryProps = {
  resource: Resource
}

export function ResourceSummary({ resource }: ResourceSummaryProps) {
  const progress = getResourceProgress(resource)
  const teamOptions = displayOptions(resource.projectDetails.options)

  return (
    <Summary>
      <Card variant="outline">
        <Section>
          <SectionHeading>Resource</SectionHeading>
          <DefinitionList>
            <DefinitionItem>
              <dt>Name</dt>
              <dd>{displayValue(resource.name)}</dd>
            </DefinitionItem>
            <DefinitionItem>
              <dt>Resource ID</dt>
              <dd>{resource.resourceId}</dd>
            </DefinitionItem>
            <DefinitionItem>
              <dt>Status</dt>
              <dd>
                <ResourceStatusBadge status={resource.status} />
              </dd>
            </DefinitionItem>
            <DefinitionItem>
              <dt>Created</dt>
              <dd>{displayDate(resource.createdAt)}</dd>
            </DefinitionItem>
            <DefinitionItem>
              <dt>Last updated</dt>
              <dd>{displayDate(resource.updatedAt)}</dd>
            </DefinitionItem>
          </DefinitionList>
        </Section>
      </Card>

      <Card variant="outline">
        <Section>
          <SectionHeader>
            <SectionHeading>Basic Info</SectionHeading>
            <Badge variant={progress.basicInfoComplete ? 'success' : 'warning'}>
              {progress.basicInfoComplete ? 'Complete' : 'Incomplete'}
            </Badge>
          </SectionHeader>
          <DefinitionList>
            <DefinitionItem>
              <dt>Owner</dt>
              <dd>{displayValue(resource.basicInfo.owner)}</dd>
            </DefinitionItem>
            <DefinitionItem>
              <dt>Email</dt>
              <dd>{displayValue(resource.basicInfo.email)}</dd>
            </DefinitionItem>
            <DefinitionItem>
              <dt>Description</dt>
              <dd>{displayValue(resource.basicInfo.description)}</dd>
            </DefinitionItem>
            <DefinitionItem>
              <dt>Priority</dt>
              <dd>{displayPriority(resource.basicInfo.priority)}</dd>
            </DefinitionItem>
          </DefinitionList>
        </Section>
      </Card>

      <Card variant="outline">
        <Section>
          <SectionHeader>
            <SectionHeading>Project Details</SectionHeading>
            <Badge variant={progress.projectDetailsComplete ? 'success' : 'warning'}>
              {progress.projectDetailsComplete ? 'Complete' : 'Incomplete'}
            </Badge>
          </SectionHeader>
          <DefinitionList>
            <DefinitionItem>
              <dt>Project name</dt>
              <dd>{displayValue(resource.projectDetails.projectName)}</dd>
            </DefinitionItem>
            <DefinitionItem>
              <dt>Budget</dt>
              <dd>{displayValue(resource.projectDetails.budget)}</dd>
            </DefinitionItem>
            <DefinitionItem>
              <dt>Category</dt>
              <dd>{displayCategory(resource.projectDetails.category)}</dd>
            </DefinitionItem>
            <DefinitionItem>
              <dt>Team members</dt>
              <dd>
                {teamOptions.length > 0 ? (
                  <OptionsList>
                    {teamOptions.map((option) => (
                      <li key={option}>{option}</li>
                    ))}
                  </OptionsList>
                ) : (
                  EMPTY_DISPLAY
                )}
              </dd>
            </DefinitionItem>
          </DefinitionList>
        </Section>
      </Card>
    </Summary>
  )
}

const Summary = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.lg};
`

const Section = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
`

const SectionHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
`

const SectionHeading = styled.h2`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.heading};
  font-size: 1.15rem;
  color: ${({ theme }) => theme.colors.inkStrong};
`

const DefinitionList = styled.dl`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  margin: 0;
`

const DefinitionItem = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};

  dt {
    margin: 0;
    color: ${({ theme }) => theme.colors.inkMuted};
    font-size: 0.85rem;
    font-weight: 600;
  }

  dd {
    margin: 0;
    color: ${({ theme }) => theme.colors.inkStrong};
    overflow-wrap: anywhere;
  }
`

const OptionsList = styled.ul`
  margin: 0;
  padding-left: 1.25rem;
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
`
