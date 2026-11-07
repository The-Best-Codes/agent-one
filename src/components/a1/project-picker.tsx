import {
  IconCheck,
  IconChevronDown,
  IconFolder,
  IconFolderOff,
  IconFolderPlus,
} from "@tabler/icons-react";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { useSearchParams } from "react-router";

import { ProjectModal } from "@/components/a1/sidebar/modals";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { projectsAtom } from "@/lib/projects";
import { cn } from "@/lib/utils";

export const ProjectPicker = () => {
  const projects = useAtomValue(projectsAtom);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const selectedProject = projects.find((project) => project.id === searchParams.get("project"));

  const selectProject = (projectId: string | undefined) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (projectId) {
          next.set("project", projectId);
        } else {
          next.delete("project");
        }
        next.delete("initialMessage");
        return next;
      },
      { replace: true },
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn("min-w-0 max-w-48 shrink", !selectedProject && "text-muted-foreground")}
          >
            {selectedProject ? (
              <IconFolder data-icon="inline-start" />
            ) : (
              <IconFolderOff data-icon="inline-start" />
            )}
            <span className="truncate">{selectedProject?.name ?? "No project"}</span>
            <IconChevronDown data-icon="inline-end" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-auto min-w-48">
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => selectProject(undefined)}>
              <IconFolderOff />
              No project
              {!selectedProject && <IconCheck className="ml-auto" />}
            </DropdownMenuItem>
            {projects.map((project) => (
              <DropdownMenuItem key={project.id} onSelect={() => selectProject(project.id)}>
                <IconFolder />
                <span className="max-w-60 truncate">{project.name}</span>
                {project.id === selectedProject?.id && <IconCheck className="ml-auto" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setShowNewProjectModal(true)}>
            <IconFolderPlus />
            New Project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ProjectModal isOpen={showNewProjectModal} onClose={() => setShowNewProjectModal(false)} />
    </>
  );
};
