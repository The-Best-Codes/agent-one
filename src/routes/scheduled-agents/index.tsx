import { IconClock, IconPlus, IconRobot, IconTrash } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SearchInput } from "@/components/a1/search-input";
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
}: {
  agent: ScheduledAgent;
  busy: boolean;
  onSaved: (agent: ScheduledAgent) => void;
  onDelete: () => void;
  onToggle: (enabled: boolean) => void;
}) {
  const [title, setTitle] = useState(agent.title);
  const [schedule, setSchedule] = useState(agent.schedule);
  const [prompt, setPrompt] = useState(agent.prompt);
  const [saving, setSaving] = useState(false);
  const dirty = title !== agent.title || schedule !== agent.schedule || prompt !== agent.prompt;
  const valid = title.trim() && schedule.trim() && prompt.trim();

  const reset = () => {
    setTitle(agent.title);
    setSchedule(agent.schedule);
    setPrompt(agent.prompt);
  };

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      const updated = await updateScheduledAgent(agent.id, title, schedule, prompt);
      onSaved(updated);
      setTitle(updated.title);
      setSchedule(updated.schedule);
      setPrompt(updated.prompt);
      toast.success("Scheduled agent updated.");
    } catch (error) {
      toast.error(`Failed to update scheduled agent: ${String(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const disabled = busy || saving;

  return (
    <AccordionItem value={agent.id} className="rounded-lg border px-4">
      <AccordionTrigger aria-disabled={busy} className="no-underline hover:no-underline">
        <div className="flex min-w-0 flex-col items-start gap-1">
          <span className="truncate">{agent.title}</span>
          <span className="text-muted-foreground flex items-center gap-1 font-mono text-xs font-normal">
            <IconClock className="size-3.5" />
            {agent.schedule}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={`title-${agent.id}`}>Title</FieldLabel>
            <Input
              id={`title-${agent.id}`}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={disabled}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`schedule-${agent.id}`}>Cron schedule</FieldLabel>
            <Input
              id={`schedule-${agent.id}`}
              value={schedule}
              onChange={(event) => setSchedule(event.target.value)}
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
              disabled={disabled}
              rows={5}
            />
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={agent.enabled}
                onCheckedChange={onToggle}
                disabled={disabled}
                aria-label={agent.enabled ? `Disable ${agent.title}` : `Enable ${agent.title}`}
              />
              <span className="text-muted-foreground text-sm">
                {agent.enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="destructive" size="sm" onClick={onDelete} disabled={disabled}>
                <IconTrash data-icon="inline-start" />
                Delete
              </Button>
              <Button variant="outline" size="sm" onClick={reset} disabled={disabled || !dirty}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => void save()} disabled={disabled || !dirty || !valid}>
                Save
              </Button>
            </div>
          </div>
        </FieldGroup>
      </AccordionContent>
    </AccordionItem>
  );
}

export default function ScheduledAgentsRoute() {
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

  useEffect(() => {
    void listScheduledAgents()
      .then(setAgents)
      .catch((error) => toast.error(`Failed to load scheduled agents: ${String(error)}`))
      .finally(() => setLoading(false));
  }, []);

  const filtered = agents.filter((agent) =>
    `${agent.title} ${agent.schedule} ${agent.prompt}`.toLowerCase().includes(query.toLowerCase()),
  );

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
      toast.success("Scheduled agent created.");
    } catch (error) {
      toast.error(`Failed to create scheduled agent: ${String(error)}`);
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
      toast.error(`Failed to change scheduled agent state: ${String(error)}`);
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
      toast.success("Scheduled agent deleted.");
    } catch (error) {
      toast.error(`Failed to delete scheduled agent: ${String(error)}`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="container mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Scheduled Agents</h1>
        <p className="text-muted-foreground mt-1">
          Run AgentOne automatically on a recurring schedule.
        </p>
      </div>
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
        <Accordion type="single" collapsible className="flex flex-col gap-3">
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
            />
          ))}
        </Accordion>
      )}

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
                disabled={creating}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-agent-schedule">Cron schedule</FieldLabel>
              <Input
                id="new-agent-schedule"
                value={schedule}
                onChange={(event) => setSchedule(event.target.value)}
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
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete scheduled agent?</DialogTitle>
            <DialogDescription>
              This permanently deletes “{deleteTarget?.title}”. Chats it already created will remain
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
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
