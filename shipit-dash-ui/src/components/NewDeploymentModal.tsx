import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Rocket, Loader2, Globe, Shield, User as UserIcon } from "lucide-react";
import { deployApi } from "@/lib/api";
import { getUserId } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export const NewDeploymentModal = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const userId = getUserId();

    if (!userId) {
      toast({
        title: "Session Expired",
        description: "Please log in again to continue.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await deployApi.trigger({
        user_id: userId,
        repo_url: formData.get("repo_url") as string,
        ssh_details: {
          hostname: formData.get("hostname") as string,
          username: formData.get("username") as string || "ubuntu",
          private_key: formData.get("private_key") as string,
        },
      });

      toast({
        title: "Deployment Queued",
        description: "The AI agent has started the remediation process.",
      });
      
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["deployments"] });
    } catch (error) {
      toast({
        title: "Trigger Failed",
        description: "Could not communicate with the backend server.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" /> New Deployment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] bg-card border-border backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Rocket className="h-5 w-5 text-primary" /> 
            ShipIt Orchestrator
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          <div className="space-y-2">
            <Label htmlFor="repo_url" className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              GitHub Repository URL
            </Label>
            <Input 
              id="repo_url" 
              name="repo_url" 
              placeholder="https://github.com/satyam/my-app" 
              className="bg-background border-border"
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hostname" className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                Target Host (IP)
              </Label>
              <Input 
                id="hostname" 
                name="hostname" 
                placeholder="13.232.x.x" 
                className="bg-background border-border"
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2">
                <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                User
              </Label>
              <Input 
                id="username" 
                name="username" 
                placeholder="ubuntu" 
                defaultValue="ubuntu"
                className="bg-background border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="private_key" className="text-sm font-medium">
              SSH Private Key (.pem)
            </Label>
            <Textarea 
              id="private_key" 
              name="private_key" 
              placeholder="-----BEGIN RSA PRIVATE KEY-----" 
              className="font-mono text-[10px] h-40 bg-background/50 border-border resize-none scrollbar-hide" 
              required 
            />
            <p className="text-[10px] text-muted-foreground">
              Your key is only used for this session and never stored in plain text.
            </p>
          </div>

          <Button type="submit" className="w-full gap-2 mt-2" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="h-4 w-4" />
            )}
            Trigger ODPAV Loop
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};