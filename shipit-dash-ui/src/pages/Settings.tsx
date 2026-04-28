import { motion } from "framer-motion";
import { AppSidebar } from "@/components/AppSidebar";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Palette,
  Key,
  User as UserIcon,
  Terminal,
  Settings as SettingsIcon,
  Loader2,
} from "lucide-react";
import { useUser } from "@/hooks/useUser";

const Settings = () => {
  const { data: user, isLoading } = useUser();

  // Fallbacks while loading or if database is empty
  const username = user?.name || "";
  const formattedEmail = user?.email || (username.toLowerCase().split(" ").join(".") + "@shipit.ai");

  return (
    <div className="min-h-screen bg-background scrollbar-hide">
      <AppSidebar />
      <Navbar />

      <main className="ml-64 pt-16 min-h-screen">
        <div className="p-8 max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-1 mb-8"
          >
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              Settings
            </h1>
            <p className="text-muted-foreground">
              Manage your ShipIt organization and agent preferences
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Tabs defaultValue="account" className="space-y-6">
              <TabsList className="bg-secondary border border-border">
                <TabsTrigger value="account" className="gap-2">
                  <UserIcon className="h-4 w-4" />
                  Account
                </TabsTrigger>
                <TabsTrigger value="security" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="preferences" className="gap-2">
                  <Palette className="h-4 w-4" />
                  Preferences
                </TabsTrigger>
              </TabsList>

              {/* Account Tab */}
              <TabsContent value="account" className="space-y-6">
                <Card className="p-6 bg-card border-border">
                  <h3 className="font-semibold text-foreground mb-4">Profile Information</h3>
                  {isLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Fetching profile from database...
                    </div>
                  ) : (
                    <div className="space-y-4 max-w-md">
                      <div className="space-y-2">
                        <Label htmlFor="username">Full Name</Label>
                        <Input 
                          id="username" 
                          value={username} 
                          readOnly 
                          className="bg-secondary/50 font-medium" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Organization Email</Label>
                        <Input 
                          id="email" 
                          value={formattedEmail} 
                          readOnly 
                          className="bg-secondary/50" 
                        />
                      </div>
                      <Button variant="outline" size="sm" disabled>
                        Update via Database Console
                      </Button>
                    </div>
                  )}
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-6">
                <Card className="p-6 bg-card border-border">
                  <div className="mb-6">
                    <h3 className="font-semibold text-foreground">Deployment Keys</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Encryption keys for SSH and repository access
                    </p>
                  </div>
                  <div className="p-10 text-center border-2 border-dashed border-border rounded-lg bg-secondary/10">
                    <Key className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-30" />
                    <p className="text-sm text-muted-foreground">
                      SSH keys are currently stored per deployment session.
                    </p>
                  </div>
                </Card>
              </TabsContent>

              {/* Preferences Tab */}
              <TabsContent value="preferences" className="space-y-6">
                <Card className="p-6 bg-card border-border">
                  <h3 className="font-semibold text-foreground mb-6">Orchestrator Behavior</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Terminal className="h-4 w-4 text-primary" />
                          <p className="font-medium text-foreground">Verbose Agent Logs</p>
                        </div>
                        <p className="text-sm text-muted-foreground">Stream detailed AI reasoning to terminal</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <SettingsIcon className="h-4 w-4 text-primary" />
                          <p className="font-medium text-foreground">Auto-Heal Infrastructure</p>
                        </div>
                        <p className="text-sm text-muted-foreground">Enable agents to execute autonomous fix commands</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>

                  <Separator className="my-8" />

                  <h3 className="font-semibold text-destructive mb-6">Danger Zone</h3>
                  <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-destructive">Wipe Local Logs</p>
                      <p className="text-sm text-muted-foreground">
                        Clear all terminal stream history from the dashboard
                      </p>
                    </div>
                    <Button variant="destructive" size="sm">Clear</Button>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Settings;