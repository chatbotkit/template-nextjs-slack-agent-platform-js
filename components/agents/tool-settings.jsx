'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { listAgentSlackIntegrations } from '@/actions/slack'
import {
  createAgentTool,
  deleteAgentTool,
  listAgentTools,
} from '@/actions/tool'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { TOOL_TEMPLATES, getToolTemplate } from '@/lib/tool-templates'

import { Loader2, Plus, Trash2, Wrench } from 'lucide-react'

function getInitialForm() {
  return {
    templateKey: 'custom',
    slackIntegrationId: '',
    name: '',
    description: '',
    instruction: '',
  }
}

export function ToolSettings({ agentId }) {
  const [tools, setTools] = useState([])
  const [slackIntegrations, setSlackIntegrations] = useState([])
  const [form, setForm] = useState(getInitialForm)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [status, setStatus] = useState('')

  const selectedTemplate = useMemo(
    () => getToolTemplate(form.templateKey),
    [form.templateKey]
  )

  const loadTools = useCallback(async () => {
    setLoading(true)

    try {
      const [toolItems, integrationItems] = await Promise.all([
        listAgentTools(agentId),
        listAgentSlackIntegrations(agentId),
      ])

      setTools(toolItems)
      setSlackIntegrations(integrationItems)
      setForm((current) => ({
        ...current,
        slackIntegrationId:
          current.slackIntegrationId || integrationItems[0]?.id || '',
      }))
    } catch (error) {
      console.error('Failed to load tools:', error)
      setStatus('Failed to load tools.')
    } finally {
      setLoading(false)
    }
  }, [agentId])

  useEffect(() => {
    loadTools()
  }, [loadTools])

  const setField = useCallback((field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }, [])

  const handleTemplateChange = useCallback(
    (templateKey) => {
      const template = getToolTemplate(templateKey)

      setForm((current) => ({
        ...current,
        templateKey,
        name: template?.name || '',
        description: template?.description || '',
        instruction:
          template && !template.requiresSlackIntegration
            ? template.buildInstruction()
            : '',
      }))
    },
    [setForm]
  )

  const handleCreate = useCallback(async () => {
    setCreating(true)
    setStatus('')

    try {
      const tool = await createAgentTool({
        agentId,
        templateKey: form.templateKey === 'custom' ? '' : form.templateKey,
        slackIntegrationId: form.slackIntegrationId,
        name: form.name,
        description: form.description,
        instruction: form.instruction,
      })

      setTools((current) => [tool, ...current])
      setForm(getInitialForm())
      setStatus('Tool added.')
    } catch (error) {
      console.error('Failed to create tool:', error)
      setStatus(error.message || 'Failed to add tool.')
    } finally {
      setCreating(false)
    }
  }, [agentId, form])

  const handleDelete = useCallback(
    async (abilityId) => {
      setDeletingId(abilityId)
      setStatus('')

      try {
        await deleteAgentTool(agentId, abilityId)
        setTools((current) => current.filter((tool) => tool.id !== abilityId))
        setStatus('Tool deleted.')
      } catch (error) {
        console.error('Failed to delete tool:', error)
        setStatus(error.message || 'Failed to delete tool.')
      } finally {
        setDeletingId(null)
      }
    },
    [agentId]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-4">
      <div className="max-w-5xl mx-auto grid gap-4 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>Tools</CardTitle>
            <CardDescription>
              Abilities attached to this agent&apos;s skillset.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tools.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No tools configured.
              </div>
            ) : (
              <div className="space-y-4">
                {tools.map((tool) => (
                  <div key={tool.id} className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-muted-foreground" />
                          <h3 className="text-sm font-medium">{tool.name}</h3>
                        </div>
                        {tool.description ? (
                          <p className="text-sm text-muted-foreground">
                            {tool.description}
                          </p>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={deletingId === tool.id}
                        onClick={() => handleDelete(tool.id)}
                      >
                        {deletingId === tool.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <pre className="overflow-auto rounded-md bg-muted p-3 text-xs text-muted-foreground">
                      {tool.instruction}
                    </pre>
                    <Separator />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Tool</CardTitle>
            <CardDescription>
              Create a new ability for this Slack agent.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tool-template">Template</Label>
              <Select
                id="tool-template"
                value={form.templateKey}
                onChange={(event) => handleTemplateChange(event.target.value)}
              >
                <option value="custom">Custom</option>
                {TOOL_TEMPLATES.map((template) => (
                  <option key={template.key} value={template.key}>
                    {template.name}
                  </option>
                ))}
              </Select>
            </div>

            {selectedTemplate?.requiresSlackIntegration ? (
              <div className="space-y-2">
                <Label htmlFor="tool-slack">Slack Connection</Label>
                <Select
                  id="tool-slack"
                  value={form.slackIntegrationId}
                  onChange={(event) =>
                    setField('slackIntegrationId', event.target.value)
                  }
                >
                  {slackIntegrations.length === 0 ? (
                    <option value="">No Slack connection</option>
                  ) : null}
                  {slackIntegrations.map((integration) => (
                    <option key={integration.id} value={integration.id}>
                      {integration.name}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="tool-name">Name</Label>
              <Input
                id="tool-name"
                value={form.name}
                onChange={(event) => setField('name', event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tool-description">Description</Label>
              <Input
                id="tool-description"
                value={form.description}
                onChange={(event) =>
                  setField('description', event.target.value)
                }
              />
            </div>

            {form.templateKey === 'custom' ? (
              <div className="space-y-2">
                <Label htmlFor="tool-instruction">Instruction</Label>
                <Textarea
                  id="tool-instruction"
                  rows={8}
                  value={form.instruction}
                  onChange={(event) =>
                    setField('instruction', event.target.value)
                  }
                />
              </div>
            ) : null}
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-3">
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add Tool
            </Button>
            {status ? (
              <span className="text-sm text-muted-foreground">{status}</span>
            ) : null}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
