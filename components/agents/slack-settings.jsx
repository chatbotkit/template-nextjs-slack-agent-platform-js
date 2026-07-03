'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  createAgentSlackIntegration,
  deleteAgentSlackIntegration,
  listAgentSlackIntegrations,
  setupAgentSlackIntegration,
  updateAgentSlackIntegration,
} from '@/actions/slack'
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

import { Check, Clipboard, Loader2, PlugZap, Trash2 } from 'lucide-react'

function hoursFromMilliseconds(value) {
  if (!value) {
    return 0
  }

  return Math.round(Number(value) / (60 * 60 * 1000))
}

function millisecondsFromHours(value) {
  const hours = Number(value || 0)

  if (!Number.isFinite(hours) || hours <= 0) {
    return 0
  }

  return hours * 60 * 60 * 1000
}

function createEmptyForm(agentName) {
  return {
    id: null,
    name: `${agentName} Slack`,
    description: `Slack connection for ${agentName}.`,
    signingSecret: '',
    botToken: '',
    userToken: '',
    contactCollection: false,
    sessionDurationHours: 0,
    references: true,
    ratings: true,
    visibleMessages: 5,
    autoRespond: '',
    allowFrom: '*',
  }
}

function getFormFromIntegration(integration, agentName) {
  if (!integration) {
    return createEmptyForm(agentName)
  }

  return {
    id: integration.id,
    name: integration.name,
    description: integration.description,
    signingSecret: integration.signingSecret,
    botToken: integration.botToken,
    userToken: integration.userToken,
    contactCollection: integration.contactCollection,
    sessionDurationHours: hoursFromMilliseconds(integration.sessionDuration),
    references: integration.references,
    ratings: integration.ratings,
    visibleMessages: integration.visibleMessages,
    autoRespond: integration.autoRespond,
    allowFrom: integration.allowFrom,
  }
}

function WebhookUrl({ label, value }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [value])

  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input readOnly value={value} className="font-mono text-xs" />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Clipboard className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

export function SlackSettings({ agentId, agentName }) {
  const [integrations, setIntegrations] = useState([])
  const [selectedId, setSelectedId] = useState('new')
  const [form, setForm] = useState(() => createEmptyForm(agentName))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settingUp, setSettingUp] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [status, setStatus] = useState('')

  const selectedIntegration = useMemo(
    () => integrations.find((integration) => integration.id === selectedId),
    [integrations, selectedId]
  )

  const loadIntegrations = useCallback(async () => {
    setLoading(true)

    try {
      const items = await listAgentSlackIntegrations(agentId)
      setIntegrations(items)

      if (items.length > 0) {
        setSelectedId((current) =>
          current !== 'new' && items.some((item) => item.id === current)
            ? current
            : items[0].id
        )
      } else {
        setSelectedId('new')
      }
    } catch (error) {
      console.error('Failed to load Slack integrations:', error)
      setStatus('Failed to load Slack connections.')
    } finally {
      setLoading(false)
    }
  }, [agentId])

  useEffect(() => {
    loadIntegrations()
  }, [loadIntegrations])

  useEffect(() => {
    setForm(getFormFromIntegration(selectedIntegration, agentName))
  }, [agentName, selectedIntegration, selectedId])

  const setField = useCallback((field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    setStatus('')

    const payload = {
      agentId,
      name: form.name,
      description: form.description,
      signingSecret: form.signingSecret,
      botToken: form.botToken,
      userToken: form.userToken,
      contactCollection: form.contactCollection,
      sessionDuration: millisecondsFromHours(form.sessionDurationHours),
      references: form.references,
      ratings: form.ratings,
      visibleMessages: Number(form.visibleMessages),
      autoRespond: form.autoRespond,
      allowFrom: form.allowFrom,
    }

    try {
      if (form.id) {
        await updateAgentSlackIntegration(form.id, payload)
        setStatus('Slack connection saved.')
      } else {
        const created = await createAgentSlackIntegration(payload)
        setSelectedId(created.id)
        setStatus('Slack connection created.')
      }

      await loadIntegrations()
    } catch (error) {
      console.error('Failed to save Slack integration:', error)
      setStatus(error.message || 'Failed to save Slack connection.')
    } finally {
      setSaving(false)
    }
  }, [agentId, form, loadIntegrations])

  const handleSetup = useCallback(async () => {
    if (!form.id) {
      return
    }

    setSettingUp(true)
    setStatus('')

    try {
      await setupAgentSlackIntegration(form.id)
      setStatus('Slack credentials validated.')
    } catch (error) {
      console.error('Failed to validate Slack integration:', error)
      setStatus(error.message || 'Slack validation failed.')
    } finally {
      setSettingUp(false)
    }
  }, [form.id])

  const handleDelete = useCallback(async () => {
    if (!form.id) {
      return
    }

    setDeleting(true)
    setStatus('')

    try {
      await deleteAgentSlackIntegration(form.id)
      setStatus('Slack connection deleted.')
      await loadIntegrations()
    } catch (error) {
      console.error('Failed to delete Slack integration:', error)
      setStatus(error.message || 'Failed to delete Slack connection.')
    } finally {
      setDeleting(false)
    }
  }, [form.id, loadIntegrations])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Slack Connection</CardTitle>
          <CardDescription>
            Attach this agent to a Slack app and workspace.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="slack-connection">Connection</Label>
              <Select
                id="slack-connection"
                value={selectedId}
                onChange={(event) => setSelectedId(event.target.value)}
              >
                {integrations.map((integration) => (
                  <option key={integration.id} value={integration.id}>
                    {integration.name}
                  </option>
                ))}
                <option value="new">New Slack connection</option>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              className="self-end"
              onClick={() => {
                setSelectedId('new')
                setForm(createEmptyForm(agentName))
              }}
            >
              New
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="slack-name">Name</Label>
              <Input
                id="slack-name"
                value={form.name}
                onChange={(event) => setField('name', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slack-visible-messages">Visible Messages</Label>
              <Input
                id="slack-visible-messages"
                type="number"
                min="0"
                max="10"
                value={form.visibleMessages}
                onChange={(event) =>
                  setField('visibleMessages', event.target.value)
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slack-description">Description</Label>
            <Input
              id="slack-description"
              value={form.description}
              onChange={(event) => setField('description', event.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="slack-signing-secret">Signing Secret</Label>
              <Input
                id="slack-signing-secret"
                type="password"
                value={form.signingSecret}
                onChange={(event) =>
                  setField('signingSecret', event.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slack-bot-token">Bot Token</Label>
              <Input
                id="slack-bot-token"
                type="password"
                value={form.botToken}
                onChange={(event) => setField('botToken', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slack-user-token">User Token</Label>
              <Input
                id="slack-user-token"
                type="password"
                value={form.userToken}
                onChange={(event) => setField('userToken', event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.contactCollection}
                onChange={(event) =>
                  setField('contactCollection', event.target.checked)
                }
              />
              Collect contacts
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.references}
                onChange={(event) =>
                  setField('references', event.target.checked)
                }
              />
              References
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.ratings}
                onChange={(event) => setField('ratings', event.target.checked)}
              />
              Ratings
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="slack-session-duration">Session Hours</Label>
              <Input
                id="slack-session-duration"
                type="number"
                min="0"
                max="720"
                value={form.sessionDurationHours}
                onChange={(event) =>
                  setField('sessionDurationHours', event.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slack-auto-respond">Auto Respond</Label>
              <Input
                id="slack-auto-respond"
                placeholder="@all"
                value={form.autoRespond}
                onChange={(event) =>
                  setField('autoRespond', event.target.value)
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slack-allow-from">Allow From</Label>
            <Textarea
              id="slack-allow-from"
              rows={3}
              value={form.allowFrom}
              onChange={(event) => setField('allowFrom', event.target.value)}
            />
          </div>

          {selectedIntegration ? (
            <>
              <Separator />
              <div className="space-y-3">
                <WebhookUrl
                  label="Event URL"
                  value={selectedIntegration.urls.eventUrl}
                />
                <WebhookUrl
                  label="Slash Command URL"
                  value={selectedIntegration.urls.commandUrl}
                />
                <WebhookUrl
                  label="Interactivity URL"
                  value={selectedIntegration.urls.interactionUrl}
                />
              </div>
            </>
          ) : null}
        </CardContent>

        <CardFooter className="flex flex-wrap items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <PlugZap className="h-4 w-4 mr-2" />
            )}
            Save Connection
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={!form.id || settingUp}
            onClick={handleSetup}
          >
            {settingUp ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Validate
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={!form.id || deleting}
            onClick={handleDelete}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete
          </Button>

          {status ? (
            <span className="text-sm text-muted-foreground">{status}</span>
          ) : null}
        </CardFooter>
      </Card>
    </div>
  )
}
