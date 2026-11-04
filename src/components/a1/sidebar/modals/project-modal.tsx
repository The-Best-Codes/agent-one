import { IconFolder, IconX } from "@tabler/icons-react";
import { open } from "@tauri-apps/plugin-dialog";
import { useState } from "react";
import { useNavigate } from "react-router";

import { MemoryEditor } from "@/components/settings-components/account";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getLogger } from "@/lib/logger";
import { sanitizeMemoryEntries } from "@/lib/memory";
import { createProject, type Project, updateProject } from "@/lib/projects";

const logger = getLogger(import.meta.url);

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project;
}

const ProjectForm = ({ project, onClose }: { project?: Project; onClose: () => void }) => {
  const navigate = useNavigate();
  const [name, setName] = useState(project?.name ?? "");
  const [instructions, setInstructions] = useState(project?.instructions ?? "");
  const [folder, setFolder] = useState(project?.folder);
  const [separateMemory, setSeparateMemory] = useState(project?.separateMemory ?? false);
  const [memory, setMemory] = useState(project?.memory ?? []);

  const chooseFolder = async () => {
    try {
      const selected = await open({ directory: true, defaultPath: folder });
      if (typeof selected === "string") setFolder(selected);
    } catch (error) {
      logger.error("Failed to choose project folder", error);
    }
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const details = {
      name: trimmedName,
      instructions: instructions.trim(),
      folder,
      separateMemory,
    };
    if (project) {
      updateProject(project.id, { ...details, memory: sanitizeMemoryEntries(memory) });
    } else {
      const created = createProject(details);
      void navigate(`/chat?project=${created.id}`);
    }
    onClose();
  };

  return (
    <>
      <div className="-mx-4 flex min-h-0 min-w-0 flex-col gap-5 overflow-y-auto px-4 py-1">
        <Field>
          <FieldLabel htmlFor="project-name">Name</FieldLabel>
          <Input
            id="project-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
            placeholder="e.g. Kitchen remodel"
            maxLength={100}
            autoFocus
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="project-instructions">Instructions</FieldLabel>
          <Textarea
            id="project-instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="What should AgentOne know or do in this project?"
            className="max-h-48 min-h-24"
          />
        </Field>
        <Field>
          <FieldLabel>
            Folder <span className="text-muted-foreground font-normal">(optional)</span>
          </FieldLabel>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-w-0 flex-1 justify-start"
              onClick={() => void chooseFolder()}
            >
              <IconFolder data-icon="inline-start" />
              <span className="truncate" title={folder}>
                {folder ?? "Choose a folder"}
              </span>
            </Button>
            {folder && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setFolder(undefined)}
                aria-label="Remove folder"
              >
                <IconX />
              </Button>
            )}
          </div>
          <FieldDescription>Chats in this project work inside this folder.</FieldDescription>
        </Field>
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="project-separate-memory">Separate memory</FieldLabel>
            <FieldDescription>
              Keep this project's memory and chats apart from your other chats.
            </FieldDescription>
          </FieldContent>
          <Switch
            id="project-separate-memory"
            checked={separateMemory}
            onCheckedChange={setSeparateMemory}
          />
        </Field>
        {project && separateMemory && (
          <Field>
            <FieldLabel>Project memory</FieldLabel>
            <MemoryEditor memory={memory} setMemory={setMemory} />
          </Field>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!name.trim()}>
          {project ? "Save" : "Create Project"}
        </Button>
      </DialogFooter>
    </>
  );
};

export const ProjectModal = ({ isOpen, onClose, project }: ProjectModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90svh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "New Project"}</DialogTitle>
          <DialogDescription>
            Group related chats and give them shared instructions.
          </DialogDescription>
        </DialogHeader>
        {isOpen && <ProjectForm project={project} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
};
