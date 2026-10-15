import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useWebAuth } from "@/contexts/use-web-auth/web-auth-hooks";

interface SignOutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SignOutModal = ({ isOpen, onClose }: SignOutModalProps) => {
  const { signOut, isSigningOut } = useWebAuth();

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign Out</DialogTitle>
          <DialogDescription>
            Are you sure you want to sign out? Your settings will stop syncing across devices until
            you sign in again.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => void handleSignOut()}
            disabled={isSigningOut}
          >
            {isSigningOut && <Spinner data-icon="inline-start" />}
            Sign Out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
