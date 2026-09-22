import {
  IconAlertCircle,
  IconArrowLeft,
  IconClock,
  IconPlus,
  IconRobot,
  IconTrash,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

import { SearchInput } from "@/components/a1/search-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/native/accordion";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  createScheduledAgent,
  deleteScheduledAgent,
  listScheduledAgents,
  type ScheduledAgent,
  setScheduledAgentEnabled,
  updateScheduledAgent,
} from "@/lib/cron";

const DEFAULT_SCHEDULE = "0 7 * * *";

function AgentEditor({
  agent,
  busy,
  onSaved,
  onDelete,
  onToggle,
  onError,
}: {
  agent: ScheduledAgent;
  busy: boolean;
  onSaved: (agent: ScheduledAgent) => void;
  onDelete: () => void;
  onToggle: (enabled: boolean) => void;
  onError: (message: string) => void;
}) {
  const [title, setTitle] = useState(agent.title);
  const [schedule, setSchedule] = useState(agent.schedule);
  const [prompt, setPrompt] = useState(agent.prompt);
  const [saving, setSaving] = useState(false);
  const disabled = busy || saving;
  const dirty = title !== agent.title || schedule !== agent.schedule || prompt !== agent.prompt;
  const valid = Boolean(title.trim() && schedule.trim() && prompt.trim());

  const reset = () => {
    setTitle(agent.title);
    setSchedule(agent.schedule);
    setPrompt(agent.prompt);
  };

  const save = async () => {
    if (!valid || disabled) return;
    setSaving(true);
    try {
      const updated = await updateScheduledAgent(agent.id, title, schedule, prompt);
      onSaved(updated);
      setTitle(updated.title);
      setSchedule(updated.schedule);
      setPrompt(updated.prompt);
    } catch (error) {
      onError(`Failed to update scheduled agent: ${String(error)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AccordionItem value={agent.id}>
      <AccordionTrigger className="px-1 py-2 hover:no-underline">
        <div className="flex flex-1 items-center justify-between gap-2 pr-2">
          <span className="flex min-w-0 flex-col items-start gap-1">
            <span className="truncate">{agent.title}</span>
            <span className="text-muted-foreground flex items-center gap-1 font-mono text-xs font-normal">
              <IconClock className="size-3.5" />
              {agent.schedule}
            </span>
          </span>
          <Switch
            checked={agent.enabled}
            onCheckedChange={onToggle}
            onClick={(event) => event.stopPropagation()}
            disabled={disabled}
            aria-label={agent.enabled ? `Disable ${agent.title}` : `Enable ${agent.title}`}
          />
        </div>
      </AccordionTrigger>
      <AccordionContent className="overflow-auto px-1 pb-3">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={`title-${agent.id}`}>Title</FieldLabel>
            <Input
              id={`title-${agent.id}`}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g., Daily email summary"
              disabled={disabled}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`schedule-${agent.id}`}>Cron schedule</FieldLabel>
            <Input
              id={`schedule-${agent.id}`}
              value={schedule}
              onChange={(event) => setSchedule(event.target.value)}
              placeholder="e.g., 0 7 * * *"
              disabled={disabled}
              autoComplete="off"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`prompt-${agent.id}`}>Prompt</FieldLabel>
            <Textarea
              id={`prompt-${agent.id}`}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="e.g., Summarize the unread emails in my inbox."
              disabled={disabled}
              rows={5}
            />
          </Field>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="destructive" size="sm" onClick={onDelete} disabled={disabled}>
              <IconTrash data-icon="inline-start" />
              Delete
            </Button>
            <Button variant="outline" size="sm" onClick={reset} disabled={disabled || !dirty}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => void save()} disabled={disabled || !dirty || !valid}>
              {saving ? <Spinner data-icon="inline-start" /> : null}
              {saving ? "Saving" : "Save"}
            </Button>
          </div>
        </FieldGroup>
      </AccordionContent>
    </AccordionItem>
  );
}

export default function ScheduledAgentsRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [agents, setAgents] = useState<ScheduledAgent[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ScheduledAgent | null>(null);
  const [title, setTitle] = useState("");
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [prompt, setPrompt] = useState("");
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void listScheduledAgents()
      .then(setAgents)
      .catch((error) => setErrorMessage(`Failed to load scheduled agents: ${String(error)}`))
      .finally(() => setLoading(false));
  }, []);

  const filtered = agents.filter((agent) =>
    `${agent.title} ${agent.schedule} ${agent.prompt}`.toLowerCase().includes(query.toLowerCase()),
  );
  const handleNavigateBack = () => {
    const chatId = searchParams.get("chatId");
    void navigate(chatId ? `/chat/${chatId}` : "/chat");
  };

  const create = async () => {
    if (!title.trim() || !schedule.trim() || !prompt.trim() || creating) return;
    setCreating(true);
    try {
      const agent = await createScheduledAgent(title, schedule, prompt);
      setAgents((current) => [...current, agent]);
      setCreateOpen(false);
      setTitle("");
      setSchedule(DEFAULT_SCHEDULE);
      setPrompt("");
    } catch (error) {
      setErrorMessage(`Failed to create scheduled agent: ${String(error)}`);
    } finally {
      setCreating(false);
    }
  };

  const toggle = async (agent: ScheduledAgent, enabled: boolean) => {
    setBusyId(agent.id);
    try {
      const updated = await setScheduledAgentEnabled(agent.id, enabled);
      setAgents((current) => current.map((item) => (item.id === agent.id ? updated : item)));
    } catch (error) {
      setErrorMessage(`Failed to change scheduled agent state: ${String(error)}`);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await deleteScheduledAgent(deleteTarget.id);
      setAgents((current) => current.filter((agent) => agent.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (error) {
      setErrorMessage(`Failed to delete scheduled agent: ${String(error)}`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="flex h-svh min-h-0 flex-col" role="main">
      <header className="bg-background sticky top-0 z-10 flex items-center gap-3 border-b p-4">
        <Button variant="outline" size="sm" onClick={handleNavigateBack}>
          <IconArrowLeft data-icon="inline-start" />
          Back
        </Button>
        <h1 className="text-base font-semibold">Scheduled Agents</h1>
      </header>
      <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col gap-4 overflow-auto p-4 md:p-6">
        {errorMessage ? (
          <Alert variant="destructive">
            <IconAlertCircle />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}
        <div className="flex items-center gap-2">
          <SearchInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search scheduled agents"
            containerClassName="flex-1"
          />
          <Button onClick={() => setCreateOpen(true)} disabled={loading}>
            <IconPlus data-icon="inline-start" />
            New
          </Button>
        </div>
        {!loading && filtered.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconRobot />
              </EmptyMedia>
              <EmptyTitle>
                {query ? "No matching scheduled agents" : "No scheduled agents yet"}
              </EmptyTitle>
              <EmptyDescription>
                {query ? "Try a different search." : "Create one to run an agent automatically."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Accordion className="rounded-md border px-2" type="single" collapsible>
            {filtered.map((agent) => (
              <AgentEditor
                key={agent.id}
                agent={agent}
                busy={busyId === agent.id}
                onToggle={(enabled) => void toggle(agent, enabled)}
                onDelete={() => setDeleteTarget(agent)}
                onSaved={(updated) =>
                  setAgents((current) =>
                    current.map((item) => (item.id === updated.id ? updated : item)),
                  )
                }
                onError={setErrorMessage}
              />
            ))}
          </Accordion>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New scheduled agent</DialogTitle>
            <DialogDescription>Choose when it runs and what the agent should do.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="new-agent-title">Title</FieldLabel>
              <Input
                id="new-agent-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g., Daily email summary"
                disabled={creating}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-agent-schedule">Cron schedule</FieldLabel>
              <Input
                id="new-agent-schedule"
                value={schedule}
                onChange={(event) => setSchedule(event.target.value)}
                placeholder="e.g., 0 7 * * *"
                disabled={creating}
                autoComplete="off"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-agent-prompt">Prompt</FieldLabel>
              <Textarea
                id="new-agent-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="e.g., Summarize the unread emails in my inbox."
                disabled={creating}
                rows={5}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button
              onClick={() => void create()}
              disabled={creating || !title.trim() || !schedule.trim() || !prompt.trim()}
            >
              {creating ? <Spinner data-icon="inline-start" /> : null}
              {creating ? "Creating" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete scheduled agent?</DialogTitle>
            <DialogDescription>
              This permanently deletes "{deleteTarget?.title}". Chats it already created will remain
              available.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={busyId !== null}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void remove()} disabled={busyId !== null}>
              {busyId !== null ? <Spinner data-icon="inline-start" /> : null}
              {busyId !== null ? "Deleting" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
