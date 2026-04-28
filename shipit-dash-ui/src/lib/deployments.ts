export interface Deployment {
  id: string;
  userId: string;
  repo_url: string;
  status: string;
  celery_task_id: string | null;
  server_ip_address: string | null;
  created_at: string;
}

export interface LogEntry {
  timestamp: Date;
  level: "info" | "warn" | "error" | "debug";
  message: string;
}

export const mockLogs: LogEntry[] = [
  { timestamp: new Date(), level: "info", message: "Initializing deployment agent..." },
  { timestamp: new Date(), level: "info", message: "Fetching latest codebase from GitHub..." },
  { timestamp: new Date(), level: "info", message: "Installing dependencies via npm..." },
  { timestamp: new Date(), level: "debug", message: "Found 847 packages to install" },
  { timestamp: new Date(), level: "info", message: "Provisioning AWS EC2 instance (t3.medium)..." },
  { timestamp: new Date(), level: "info", message: "Configuring security groups and IAM roles..." },
  { timestamp: new Date(), level: "warn", message: "Rate limit approaching for ECR pushes" },
  { timestamp: new Date(), level: "info", message: "Setting up load balancer..." },
  { timestamp: new Date(), level: "info", message: "Building Docker container..." },
  { timestamp: new Date(), level: "debug", message: "Layer 1/8: FROM node:18-alpine" },
  { timestamp: new Date(), level: "debug", message: "Layer 2/8: COPY package*.json ./" },
  { timestamp: new Date(), level: "info", message: "Pushing image to ECR registry..." },
  { timestamp: new Date(), level: "info", message: "Running health checks..." },
  { timestamp: new Date(), level: "info", message: "Deployment successful! Service is live" },
];
