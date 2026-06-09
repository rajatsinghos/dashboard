/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { DB } from "./server/db";

async function runServer() {
  const app = express();
  const PORT = 3000;

  // Body parsing middleware
  app.use(express.json());

  // Static assets folder for public uploads/images
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // API Endpoints Mapping to db.json

  // 1. HEALTHCHECK
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // 2. USERS
  app.get("/api/users", (req, res) => {
    res.json(DB.getUsers());
  });

  app.get("/api/users/:id", (req, res) => {
    const user = DB.getUserById(req.params.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user);
  });

  app.post("/api/users", (req, res) => {
    try {
      const user = DB.createUser(req.body);
      res.status(201).json(user);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put("/api/users/:id", (req, res) => {
    try {
      const updated = DB.updateUser(req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 3. PROJECTS & ENVIRONMENTS
  app.get("/api/projects", (req, res) => {
    res.json(DB.getProjects());
  });

  app.post("/api/projects", (req, res) => {
    try {
      const newProj = DB.createProject(req.body);
      res.status(201).json(newProj);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put("/api/projects/:id", (req, res) => {
    try {
      const updated = DB.updateProject(req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/environments", (req, res) => {
    res.json(DB.getEnvironments());
  });

  // 4. DEFECTS
  app.get("/api/defects", (req, res) => {
    res.json(DB.getDefects());
  });

  app.post("/api/defects", (req, res) => {
    try {
      const newDefect = DB.createDefect(req.body);
      res.status(201).json(newDefect);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put("/api/defects/:id", (req, res) => {
    try {
      const updaterId = req.headers["x-user-id"] as string || "";
      const updated = DB.updateDefect(req.params.id, updaterId, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/defects/:id", (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string || "";
      DB.deleteDefect(req.params.id, userId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 5. COMMENTS & ATTACHMENTS
  app.get("/api/defects/:id/comments", (req, res) => {
    res.json(DB.getComments(req.params.id));
  });

  app.post("/api/defects/:id/comments", (req, res) => {
    try {
      const comment = DB.addComment({
        defect_id: req.params.id,
        author_id: req.body.author_id,
        comment: req.body.comment
      });
      res.status(201).json(comment);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/defects/:id/attachments", (req, res) => {
    res.json(DB.getAttachments(req.params.id));
  });

  app.post("/api/defects/:id/attachments", (req, res) => {
    try {
      const attachment = DB.addAttachment({
        defect_id: req.params.id,
        name: req.body.name,
        url: req.body.url || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=60",
        size: req.body.size || 5000,
        mime_type: req.body.mime_type || "text/plain",
        uploaded_by_id: req.body.uploaded_by_id
      });
      res.status(201).json(attachment);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 6. TEST SUITES & CASES
  app.get("/api/test-suites", (req, res) => {
    res.json(DB.getTestSuites());
  });

  app.post("/api/test-suites", (req, res) => {
    try {
      const newSuite = DB.createTestSuite(req.body);
      res.status(201).json(newSuite);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put("/api/test-suites/:id", (req, res) => {
    try {
      const updated = DB.updateTestSuite(req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/test-suites/:id", (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string || "";
      DB.deleteTestSuite(req.params.id, userId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/test-suites/:id/cases", (req, res) => {
    res.json(DB.getTestCases(req.params.id));
  });

  app.post("/api/test-suites/:id/cases", (req, res) => {
    try {
      const newCase = DB.createTestCase({
        suite_id: req.params.id,
        title: req.body.title,
        description: req.body.description,
        steps: req.body.steps || [],
        expected_result: req.body.expected_result,
        automation_status: req.body.automation_status || "Automated",
        priority: req.body.priority || "Medium"
      });
      res.status(201).json(newCase);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put("/api/test-cases/:id", (req, res) => {
    try {
      const updated = DB.updateTestCase(req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/test-cases/:id", (req, res) => {
    try {
      DB.deleteTestCase(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 7. TEST RUNS
  app.get("/api/test-runs", (req, res) => {
    res.json(DB.getTestRuns());
  });

  app.get("/api/test-runs/:id/results", (req, res) => {
    res.json(DB.getTestRunResults(req.params.id));
  });

  app.post("/api/test-runs", (req, res) => {
    try {
      const { suite_id, environment_id, creator_id } = req.body;
      if (!suite_id || !environment_id || !creator_id) {
        res.status(400).json({ error: "Missing required fields: suite_id, environment_id, creator_id" });
        return;
      }
      const run = DB.executeTestRun(suite_id, environment_id, creator_id);
      res.status(201).json(run);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 8. PERFORMANCE METRICS
  app.get("/api/performance-metrics", (req, res) => {
    res.json(DB.getPerformanceMetrics());
  });

  app.post("/api/performance-metrics", (req, res) => {
    try {
      const metric = DB.addPerformanceMetric(req.body);
      res.status(201).json(metric);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 9. NOTIFICATIONS
  app.get("/api/notifications/:userId", (req, res) => {
    res.json(DB.getNotifications(req.params.userId));
  });

  app.put("/api/notifications/:id/read", (req, res) => {
    try {
      DB.markRead(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/notifications/read-all", (req, res) => {
    try {
      const { userId } = req.body;
      DB.markAllRead(userId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 10. SYSTEM LOGS & AUDITS
  app.get("/api/activities", (req, res) => {
    res.json(DB.getActivities());
  });

  app.get("/api/audit-logs", (req, res) => {
    res.json(DB.getAuditLogs());
  });

  // 11. SETTINGS
  app.get("/api/settings/:userId", (req, res) => {
    res.json(DB.getUserSettings(req.params.userId));
  });

  app.put("/api/settings/:userId", (req, res) => {
    try {
      const settings = DB.updateUserSettings(req.params.userId, req.body);
      res.json(settings);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Realtime metric simulator: background metric loader every 12 seconds
  setInterval(() => {
    const envs = DB.getEnvironments();
    if (envs.length > 0) {
      const env = envs[Math.floor(Math.random() * envs.length)];
      const endpoints = ["/api/v1/auth/token", "/api/v1/ledger/refund", "/api/v1/graphql/query", "/api/v1/iot/stream"];
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
      
      const isSpike = Math.random() < 0.1; // 10% chance to simulate high performance spikes
      const latency = Math.floor(Math.random() * 150) + 80 + (isSpike ? 650 : 0);
      const throughput = Math.floor(Math.random() * 50) + 10;
      const error_rate = Math.random() < 0.08 ? parseFloat((Math.random() * 5).toFixed(1)) : 0;

      DB.addPerformanceMetric({
        environment_id: env.id,
        endpoint,
        latency,
        throughput,
        error_rate
      });
    }
  }, 12000);

  // Setup Vite middlewares for hot module reload and live preview
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`QA Pulse server is listening on http://localhost:${PORT}`);
  });
}

runServer().catch((error) => {
  console.error("Critical server startup error:", error);
});
