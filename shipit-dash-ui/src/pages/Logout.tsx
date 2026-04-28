import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rocket, LogOut, ArrowRight } from "lucide-react";

const Logout = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 gradient-glow opacity-50" />
      <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="p-8 bg-card/80 backdrop-blur-xl border-border shadow-2xl text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-foreground text-background">
              <Rocket className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold text-foreground tracking-tight">ShipIt</span>
          </div>

          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto mb-6 p-4 rounded-full bg-secondary w-fit"
          >
            <LogOut className="h-8 w-8 text-foreground" />
          </motion.div>

          {/* Content */}
          <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-2">
            You've been logged out
          </h1>
          <p className="text-muted-foreground mb-8">
            Thanks for using ShipIt. See you next time!
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <Button className="w-full gap-2" onClick={() => navigate("/login")}>
              Sign in again
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
              Go to homepage
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Logout;
