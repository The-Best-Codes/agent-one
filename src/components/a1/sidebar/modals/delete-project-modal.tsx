import { useAtomValueRawSync } from "jotai";
import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";
import { chatIdsAtom } from "@/lib/jotai/atoms";
import { deleteProject, type Project } from "@/lib/projects";

interface DeleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export const DeleteProjectModal = ({ isOpen, onClose, project }: DeleteProjectModalProps) => {
  const { id: activeChatId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const chatIds = useAtomValueRawSync(chatIdsAtom);
  const { loadChatMetadata, setChatsProject, bulkDeleteChats } = usePersistence();
  const [deleteChats, setDeleteChats] = useState(false);

  const projectChatIds = isOpen
    ? chatIds.filter((id) => loadChatMetadata(id).projectId === project.id)
    : [];

  const handleClose = () => {
    setDeleteChats(false);
    onClose();
  };

  const handleDelete = () => {
    if (deleteChats) {
      bulkDeleteChats(projectChatIds);
      if (activeChatId && projectChatIds.includes(activeChatId)) {
        void navigate("/chat");
      }
    } else {
      setChatsProject(projectChatIds, undefined);
    }
    deleteProject(project.id);
    if (new URLSearchParams(location.search).get("project") === project.id) {
      void navigate("/chat", { replace: true });
    }
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Project</DialogTitle>
          <DialogDescription>
            {deleteChats
              ? `Are you sure you want to delete "${project.name}" and its chats? This action cannot be undone.`
              : `Are you sure you want to delete "${project.name}"? Its chats will be kept and moved out of the project.${project.separateMemory ? " Its memory will be deleted, and your other chats will be able to see these chats." : ""}`}
          </DialogDescription>
        </DialogHeader>
        {projectChatIds.length > 0 && (
          <Field orientation="horizontal">
            <Checkbox
              id="delete-project-chats"
              checked={deleteChats}
              onCheckedChange={(checked) => setDeleteChats(checked === true)}
            />
            <FieldLabel htmlFor="delete-project-chats">
              {`Also delete ${projectChatIds.length === 1 ? "its chat" : `its ${projectChatIds.length} chats`}`}
            </FieldLabel>
          </Field>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
