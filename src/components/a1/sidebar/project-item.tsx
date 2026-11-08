import {
  IconDotsVertical,
  IconEdit,
  IconFolder,
  IconFolderOpen,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { memo, useState } from "react";
import { Link } from "react-router";

import {
  AdaptiveTooltip,
  AdaptiveTooltipContent,
  AdaptiveTooltipTrigger,
} from "@/components/ui/adaptive-tooltip";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";
import { getLogger } from "@/lib/logger";
import type { Project } from "@/lib/projects";
import { cn } from "@/lib/utils";

import { DeleteProjectModal, ProjectModal } from "./modals";

const logger = getLogger(import.meta.url);

const CHAT_DRAG_TYPE = "application/agent-one-chat";

interface ProjectItemProps {
  project: Project;
  collapsed: boolean;
  onToggle: (projectId: string) => void;
  onNewChat?: () => void;
  selectionMode?: boolean;
}

export const ProjectItem = memo(
  ({ project, collapsed, onToggle, onNewChat, selectionMode }: ProjectItemProps) => {
    const { setChatsProject } = usePersistence();
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);

    return (
      <>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <Button
              asChild
              variant="ghost"
              className={cn(
                "group/project-item relative w-full justify-start pr-1 pl-2 transition-none",
                selectionMode ? "mb-0.5" : "mt-0.5",
                isDragOver && "bg-muted ring-ring ring-1",
              )}
            >
              <div
                onDragOver={(e) => {
                  if (!e.dataTransfer.types.includes(CHAT_DRAG_TYPE)) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "copy";
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  setIsDragOver(false);
                  const data = e.dataTransfer.getData(CHAT_DRAG_TYPE);
                  if (!data) return;
                  e.preventDefault();
                  try {
                    const { chatId } = JSON.parse(data) as { chatId: string };
                    setChatsProject([chatId], project.id);
                  } catch (error) {
                    logger.error("Failed to move dropped chat into project", error);
                  }
                }}
              >
                <button
                  type="button"
                  className={cn(
                    "flex h-full min-w-0 flex-1 items-center gap-2 text-left group-hover/project-item:pr-14 group-focus-within/project-item:pr-14 pointer-coarse:pr-14",
                    isDropdownOpen && "pr-14",
                  )}
                  onClick={() => onToggle(project.id)}
                  aria-expanded={!collapsed}
                >
                  {collapsed ? (
                    <IconFolder className="text-muted-foreground size-4 shrink-0" />
                  ) : (
                    <IconFolderOpen className="text-muted-foreground size-4 shrink-0" />
                  )}
                  <span className="truncate">{project.name}</span>
                </button>
                <div
                  className={cn(
                    "absolute top-1/2 right-1 flex -translate-y-1/2 items-center gap-0.5 opacity-0 transition-opacity duration-200 will-change-[opacity] group-hover/project-item:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100",
                    isDropdownOpen && "opacity-100",
                  )}
                >
                  <AdaptiveTooltip>
                    <AdaptiveTooltipTrigger asChild>
                      <Button size="icon" variant="ghost" className="size-6" asChild>
                        <Link
                          to={`/chat?project=${project.id}`}
                          onClick={onNewChat}
                          aria-label={`New chat in ${project.name}`}
                        >
                          <IconPlus />
                        </Link>
                      </Button>
                    </AdaptiveTooltipTrigger>
                    <AdaptiveTooltipContent>New chat in this project</AdaptiveTooltipContent>
                  </AdaptiveTooltip>
                  <DropdownMenu onOpenChange={setIsDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-6"
                        aria-label="Project options"
                      >
                        <IconDotsVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-auto min-w-max">
                      <DropdownMenuGroup>
                        <DropdownMenuItem onSelect={() => setShowEditModal(true)}>
                          <IconEdit />
                          Edit Project
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setShowDeleteModal(true)}
                        >
                          <IconTrash />
                          Delete Project
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </Button>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuGroup>
              <ContextMenuItem asChild>
                <Link to={`/chat?project=${project.id}`} onClick={onNewChat}>
                  <IconPlus />
                  New Chat
                </Link>
              </ContextMenuItem>
              <ContextMenuItem onClick={() => setShowEditModal(true)}>
                <IconEdit />
                Edit Project
              </ContextMenuItem>
              <ContextMenuItem variant="destructive" onClick={() => setShowDeleteModal(true)}>
                <IconTrash />
                Delete Project
              </ContextMenuItem>
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>

        <ProjectModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          project={project}
        />

        <DeleteProjectModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          project={project}
        />
      </>
    );
  },
);

ProjectItem.displayName = "ProjectItem";
