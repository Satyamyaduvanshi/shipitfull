import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home, ArrowLeft, Terminal } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "🚫 [SYSTEM_ERROR] Route not found in cluster:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 font-sans selection:bg-primary/30">
      {/* Background Decorative Element */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-info/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md text-center"
      >
        {/* Icon with Pulsing Effect */}
        <div className="relative mx-auto mb-8 w-fit">
          <div className="absolute inset-0 animate-pulse bg-primary/20 blur-2xl rounded-full" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-border bg-card shadow-2xl">
            <FileQuestion className="h-12 w-12 text-primary" />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-3 mb-10">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-7xl font-bold tracking-tighter text-foreground"
          >
            404
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xl font-semibold text-foreground">Route missing in cluster</h2>
            <p className="mt-2 text-muted-foreground">
              The agent couldn't locate <code className="px-1.5 py-0.5 rounded bg-secondary text-primary font-mono text-xs">{location.pathname}</code>. 
              It might have been decommissioned or never deployed.
            </p>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="gap-2 border-border bg-card hover:bg-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button 
            onClick={() => navigate("/")}
            className="gap-2 bg-primary text-primary-foreground hover:opacity-90"
          >
            <Home className="h-4 w-4" />
            Return to Dashboard
          </Button>
        </motion.div>

        {/* Terminal Footer Decor */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.6 }}
          className="mt-12 flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground"
        >
          <Terminal className="h-3 w-3" />
          System_Status: 404_NOT_FOUND
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound;