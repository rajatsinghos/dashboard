/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { 
  User, Project, Environment, Defect, DefectComment, FileAttachment,
  TestSuite, TestCase, TestRun, TestRunResult, PerformanceMetric, 
  Notification, Activity, AuditLog, UserSettings,
  RunStatus, UserRole, DefectStatus, SeverityType, PriorityType
} from '../src/types';

const DB_FILE = path.join(process.cwd(), 'db.json');

interface DatabaseSchema {
  users: User[];
  projects: Project[];
  environments: Environment[];
  defects: Defect[];
  defect_comments: DefectComment[];
  test_suites: TestSuite[];
  test_cases: TestCase[];
  test_runs: TestRun[];
  test_run_results: TestRunResult[];
  performance_metrics: PerformanceMetric[];
  notifications: Notification[];
  activities: Activity[];
  audit_logs: AuditLog[];
  user_settings: UserSettings[];
  attachments: FileAttachment[];
}

let db: DatabaseSchema = {
  users: [],
  projects: [],
  environments: [],
  defects: [],
  defect_comments: [],
  test_suites: [],
  test_cases: [],
  test_runs: [],
  test_run_results: [],
  performance_metrics: [],
  notifications: [],
  activities: [],
  audit_logs: [],
  user_settings: [],
  attachments: []
};

// Helper for UUID style IDs
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving db.json:', error);
  }
}

function loadDb() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(content);
      return;
    } catch (error) {
      console.error('Error loading db.json, generating new seed:', error);
    }
  }
  bootstrapDb();
}

// Relational Operations
export const DB = {
  // Read database completely
  load() {
    loadDb();
  },

  // USERS
  getUsers(): User[] {
    return db.users;
  },
  getUserById(id: string): User | undefined {
    return db.users.find(u => u.id === id);
  },
  createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): User {
    const newUser: User = {
      ...user,
      id: uuid(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.users.push(newUser);
    
    // Create Default User Settings
    const defaultSettings: UserSettings = {
      id: uuid(),
      user_id: newUser.id,
      email_alerts: true,
      browser_push: true,
      automation_sync: false,
      urgent_only: false,
      theme: 'dark',
      created_at: new Date().toISOString()
    };
    db.user_settings.push(defaultSettings);

    saveDb();
    return newUser;
  },
  updateUser(id: string, updates: Partial<User>): User {
    const idx = db.users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found');
    db.users[idx] = {
      ...db.users[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    saveDb();
    return db.users[idx];
  },

  // PROJECTS
  getProjects(): Project[] {
    return db.projects;
  },
  createProject(proj: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Project {
    const newProj: Project = {
      ...proj,
      id: uuid(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.projects.push(newProj);
    saveDb();
    return newProj;
  },
  updateProject(id: string, updates: Partial<Project>): Project {
    const idx = db.projects.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Project not found');
    db.projects[idx] = {
      ...db.projects[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    saveDb();
    return db.projects[idx];
  },

  // ENVIRONMENTS
  getEnvironments(): Environment[] {
    return db.environments;
  },

  // DEFECTS
  getDefects() {
    return db.defects.map(d => {
      const proj = db.projects.find(p => p.id === d.project_id);
      const env = db.environments.find(e => e.id === d.environment_id);
      const assignee = db.users.find(u => u.id === d.assignee_id);
      const reporter = db.users.find(u => u.id === d.reporter_id);
      return {
        ...d,
        project_name: proj ? proj.name : 'Unknown Project',
        environment_name: env ? env.name : 'Unknown Environment',
        assignee_name: assignee ? assignee.name : 'Unassigned',
        assignee_avatar: assignee ? assignee.avatar : '',
        reporter_name: reporter ? reporter.name : 'System'
      };
    });
  },
  createDefect(defect: Omit<Defect, 'id' | 'defect_id' | 'created_at' | 'updated_at'>): Defect {
    const count = db.defects.length + 1;
    const defect_id = `DEF-${String(count).padStart(3, '0')}`;
    const newDefect: Defect = {
      ...defect,
      id: uuid(),
      defect_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.defects.push(newDefect);

    // Create Action / Notification
    this.createActivity(
      newDefect.reporter_id,
      'Defect',
      'Defect Created',
      `Created defect ${newDefect.defect_id}: "${newDefect.title}"`
    );

    if (newDefect.assignee_id) {
      this.createNotification(
        newDefect.assignee_id,
        'Defect Assigned',
        'New Defect Assigned',
        `You have been assigned to defect ${newDefect.defect_id}: ${newDefect.title}`
      );
    }

    saveDb();
    return newDefect;
  },
  updateDefect(id: string, updaterId: string, updates: Partial<Defect>): Defect {
    const idx = db.defects.findIndex(d => d.id === id);
    if (idx === -1) throw new Error('Defect not found');
    const oldVal = { ...db.defects[idx] };
    
    db.defects[idx] = {
      ...db.defects[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };

    const newVal = db.defects[idx];

    // Log Audit
    this.createAuditLog(
      updaterId,
      'update',
      'defects',
      id,
      JSON.stringify(oldVal),
      JSON.stringify(newVal)
    );

    // Dynamic notification triggers
    if (updates.status && updates.status !== oldVal.status) {
      this.createActivity(
        updaterId,
        'Defect',
        'Defect Status Updated',
        `Changed defect ${oldVal.defect_id} status from ${oldVal.status} to ${updates.status}`
      );

      if (updates.status === 'Resolved' && newVal.reporter_id) {
        this.createNotification(
          newVal.reporter_id,
          'Defect Resolved',
          'Defect Resolved',
          `Defect ${oldVal.defect_id} has been marked as Resolved by ${this.getUserById(updaterId)?.name || 'a teammate'}`
        );
      }
    }

    if (updates.assignee_id && updates.assignee_id !== oldVal.assignee_id) {
      this.createNotification(
        updates.assignee_id,
        'Defect Assigned',
        'Defect Reassigned',
        `Defect ${oldVal.defect_id} was assigned to you by ${this.getUserById(updaterId)?.name || 'a teammate'}`
      );
    }

    saveDb();
    return db.defects[idx];
  },
  deleteDefect(id: string, userId: string) {
    const defect = db.defects.find(d => d.id === id);
    if (!defect) throw new Error('Defect not found');

    db.defects = db.defects.filter(d => d.id !== id);
    db.defect_comments = db.defect_comments.filter(c => c.defect_id !== id);
    db.attachments = db.attachments.filter(a => a.defect_id !== id);

    this.createActivity(
      userId,
      'Defect',
      'Defect Deleted',
      `Deleted defect ${defect.defect_id}: "${defect.title}"`
    );

    saveDb();
    return true;
  },

  // COMMENTS & ATTACHMENTS
  getComments(defectId: string): DefectComment[] {
    return db.defect_comments
      .filter(c => c.defect_id === defectId)
      .map(c => {
        const u = db.users.find(usr => usr.id === c.author_id);
        return {
          ...c,
          author_name: u ? u.name : 'Unknown Author',
          author_avatar: u ? u.avatar : ''
        };
      })
      .sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },
  addComment(comment: Omit<DefectComment, 'id' | 'created_at' | 'author_name' | 'author_avatar'>): DefectComment {
    const user = db.users.find(u => u.id === comment.author_id);
    const newComment: DefectComment = {
      ...comment,
      id: uuid(),
      author_name: user ? user.name : 'Anonymous',
      author_avatar: user ? user.avatar : '',
      created_at: new Date().toISOString()
    };
    db.defect_comments.push(newComment);
    saveDb();
    return newComment;
  },
  getAttachments(defectId: string): FileAttachment[] {
    return db.attachments.filter(a => a.defect_id === defectId);
  },
  addAttachment(attachment: Omit<FileAttachment, 'id' | 'created_at'>): FileAttachment {
    const newAttachment: FileAttachment = {
      ...attachment,
      id: uuid(),
      created_at: new Date().toISOString()
    };
    db.attachments.push(newAttachment);
    saveDb();
    return newAttachment;
  },

  // TEST SUITES & CASES
  getTestSuites(): TestSuite[] {
    return db.test_suites.map(ts => {
      const proj = db.projects.find(p => p.id === ts.project_id);
      const caseCount = db.test_cases.filter(tc => tc.suite_id === ts.id).length;
      return {
        ...ts,
        project_name: proj ? proj.name : 'All Projects',
        case_count: caseCount
      };
    });
  },
  createTestSuite(suite: Omit<TestSuite, 'id' | 'created_at' | 'updated_at'>): TestSuite {
    const newSuite: TestSuite = {
      ...suite,
      id: uuid(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.test_suites.push(newSuite);
    saveDb();
    return newSuite;
  },
  updateTestSuite(id: string, updates: Partial<TestSuite>): TestSuite {
    const idx = db.test_suites.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Test Suite not found');
    db.test_suites[idx] = {
      ...db.test_suites[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    saveDb();
    return db.test_suites[idx];
  },
  deleteTestSuite(id: string, userId: string): boolean {
    db.test_suites = db.test_suites.filter(s => s.id !== id);
    db.test_cases = db.test_cases.filter(c => c.suite_id !== id);
    this.createActivity(userId, 'Test', 'Suite Deleted', `Deleted test suite: ${id}`);
    saveDb();
    return true;
  },

  getTestCases(suiteId: string): TestCase[] {
    return db.test_cases.filter(tc => tc.suite_id === suiteId);
  },
  createTestCase(tcase: Omit<TestCase, 'id' | 'created_at' | 'updated_at'>): TestCase {
    const newCase: TestCase = {
      ...tcase,
      id: uuid(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.test_cases.push(newCase);
    saveDb();
    return newCase;
  },
  updateTestCase(id: string, updates: Partial<TestCase>): TestCase {
    const idx = db.test_cases.findIndex(tc => tc.id === id);
    if (idx === -1) throw new Error('Test Case not found');
    db.test_cases[idx] = {
      ...db.test_cases[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    saveDb();
    return db.test_cases[idx];
  },
  deleteTestCase(id: string): boolean {
    db.test_cases = db.test_cases.filter(tc => tc.id !== id);
    saveDb();
    return true;
  },

  // RUNS & RESULTS
  getTestRuns(): TestRun[] {
    return db.test_runs.map(tr => {
      const suite = db.test_suites.find(s => s.id === tr.suite_id);
      const env = db.environments.find(e => e.id === tr.environment_id);
      const creator = db.users.find(u => u.id === tr.creator_id);
      return {
        ...tr,
        suite_name: suite ? suite.name : 'Unknown Suite',
        environment_name: env ? env.name : 'Unknown Env',
        creator_name: creator ? creator.name : 'Agent'
      };
    }).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
  getTestRunResults(runId: string): TestRunResult[] {
    return db.test_run_results.filter(r => r.run_id === runId);
  },
  executeTestRun(suiteId: string, environmentId: string, creatorId: string): TestRun {
    const suite = db.test_suites.find(s => s.id === suiteId);
    if (!suite) throw new Error('Test suite not found');
    
    const cases = db.test_cases.filter(tc => tc.suite_id === suiteId);
    if (cases.length === 0) throw new Error('Cannot execute empty test suite');

    const runId = uuid();
    const startTime = new Date();

    // Run execution logic
    const results: TestRunResult[] = [];
    let passed = 0;
    let failed = 0;

    cases.forEach(tc => {
      // Simulate pass/fail rate based on suite names, simulating realistic test runtime and errors
      let status: 'Passed' | 'Failed' | 'Skipped' = 'Passed';
      let error_message;
      
      const isLeakySuite = suite.name.toLowerCase().includes('leak') || suite.name.toLowerCase().includes('fail');
      const errorThreshold = isLeakySuite ? 0.45 : 0.08; // 45% failure rate for leaky suites, 8% otherwise
      
      if (Math.random() < errorThreshold) {
        status = 'Failed';
        failed++;
        const errors = [
          'AssertionError: Expected status code 200, got 500 Internals',
          'TimeoutError: API request exceeded threshold of 1500ms',
          'DatabaseError: Relation "users" does not exist (Schema Mismatch)',
          'HydrationError: Text content did not match between server and client',
          'SecurityError: Forbidden access - scopes missing in Bearer Auth payload'
        ];
        error_message = errors[Math.floor(Math.random() * errors.length)];
      } else {
        passed++;
      }

      results.push({
        id: uuid(),
        run_id: runId,
        case_id: tc.id,
        case_title: tc.title,
        status,
        error_message,
        executed_by_id: creatorId,
        duration: Math.floor(Math.random() * 800) + 150, // ms
        created_at: new Date().toISOString()
      });
    });

    const status: RunStatus = failed === 0 ? 'Passed' : (passed === 0 ? 'Failed' : 'Partial');

    const newRun: TestRun = {
      id: runId,
      name: `Run for ${suite.name} - #${db.test_runs.length + 1}`,
      suite_id: suiteId,
      environment_id: environmentId,
      status,
      creator_id: creatorId,
      duration: Math.floor(Math.random() * 45) + 10, // seconds
      total_cases: cases.length,
      passed_cases: passed,
      failed_cases: failed,
      created_at: startTime.toISOString(),
      updated_at: new Date().toISOString()
    };

    db.test_runs.push(newRun);
    db.test_run_results.push(...results);

    // Activity Log
    this.createActivity(
      creatorId,
      'Test',
      'Test Run Completed',
      `Executed suite "${suite.name}". Status: ${status} (${passed}/${cases.length} passed)`
    );

    // Create Notification on FAIL
    if (status === 'Failed' || status === 'Partial') {
      this.createNotification(
        creatorId,
        'Test Failed',
        'Regression Alert: Test Execution Failure',
        `Test execution "${newRun.name}" failed with ${failed} case failures.`
      );
    }

    saveDb();
    return newRun;
  },

  // PERFORMANCE METRICS
  getPerformanceMetrics(): PerformanceMetric[] {
    return db.performance_metrics.map(pm => {
      const env = db.environments.find(e => e.id === pm.environment_id);
      return {
        ...pm,
        environment_name: env ? env.name : 'Unknown Env'
      };
    }).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },
  addPerformanceMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): PerformanceMetric {
    const newMetric: PerformanceMetric = {
      ...metric,
      id: uuid(),
      timestamp: new Date().toISOString()
    };
    db.performance_metrics.push(newMetric);
    
    // Prune old metrics if they go beyond 150 to save Memory / Disk
    if (db.performance_metrics.length > 200) {
      db.performance_metrics.shift();
    }
    
    // Triggers performance warning
    if (metric.latency > 800) {
      // Find QA Core / Lead or users
      const leads = db.users.filter(u => u.role === 'QA Lead' || u.role === 'Admin');
      leads.forEach(l => {
        this.createNotification(
          l.id,
          'Performance Alert',
          'Urgent: API Latency Spike Detected',
          `Latency spike on endpoint "${metric.endpoint}" exceeded standard SLA limit. Peak: ${metric.latency}ms`
        );
      });
    }

    saveDb();
    return newMetric;
  },

  // NOTIFICATIONS
  getNotifications(userId: string): Notification[] {
    return db.notifications
      .filter(n => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
  createNotification(userId: string, type: Notification['type'], title: string, message: string): Notification {
    const newNotif: Notification = {
      id: uuid(),
      user_id: userId,
      type,
      title,
      message,
      read: false,
      created_at: new Date().toISOString()
    };
    db.notifications.push(newNotif);
    
    // Maintain max notifications limit per user
    const userNotifs = db.notifications.filter(n => n.user_id === userId);
    if (userNotifs.length > 50) {
      const oldestIdx = db.notifications.findIndex(n => n.user_id === userId);
      if (oldestIdx !== -1) db.notifications.splice(oldestIdx, 1);
    }

    saveDb();
    return newNotif;
  },
  markRead(id: string) {
    const n = db.notifications.find(not => not.id === id);
    if (n) {
      n.read = true;
      saveDb();
    }
  },
  markAllRead(userId: string) {
    db.notifications
      .filter(n => n.user_id === userId)
      .forEach(n => n.read = true);
    saveDb();
  },

  // ACTIVITIES & AUDITS
  getActivities(): Activity[] {
    return db.activities.map(act => {
      const u = db.users.find(usr => usr.id === act.user_id);
      return {
        ...act,
        user_name: u ? u.name : 'Unknown User',
        user_avatar: u ? u.avatar : ''
      };
    }).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
  createActivity(userId: string, category: Activity['category'], action: string, description: string) {
    const newAct: Activity = {
      id: uuid(),
      user_id: userId,
      user_name: '',
      user_avatar: '',
      category,
      action,
      description,
      created_at: new Date().toISOString()
    };
    db.activities.push(newAct);
    saveDb();
  },

  getAuditLogs(): AuditLog[] {
    return db.audit_logs.map(log => {
      const u = db.users.find(usr => usr.id === log.user_id);
      return {
        ...log,
        user_name: u ? u.name : 'Unknown User'
      };
    }).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
  createAuditLog(userId: string, action: string, tableName: string, recordId: string, oldVal: string, newVal: string) {
    const newLog: AuditLog = {
      id: uuid(),
      user_id: userId,
      user_name: '',
      action,
      table_name: tableName,
      record_id: recordId,
      old_value: oldVal,
      new_value: newVal,
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString()
    };
    db.audit_logs.push(newLog);
    saveDb();
  },

  // SETTINGS
  getUserSettings(userId: string): UserSettings {
    let settings = db.user_settings.find(s => s.user_id === userId);
    if (!settings) {
      settings = {
        id: uuid(),
        user_id: userId,
        email_alerts: true,
        browser_push: true,
        automation_sync: false,
        urgent_only: false,
        theme: 'dark',
        created_at: new Date().toISOString()
      };
      db.user_settings.push(settings);
      saveDb();
    }
    return settings;
  },
  updateUserSettings(userId: string, updates: Partial<UserSettings>): UserSettings {
    const settings = this.getUserSettings(userId);
    const idx = db.user_settings.findIndex(s => s.user_id === userId);
    if (idx !== -1) {
      db.user_settings[idx] = {
        ...db.user_settings[idx],
        ...updates
      };
      saveDb();
      return db.user_settings[idx];
    }
    return settings;
  }
};

// Procedural Rich Seed Generation
function bootstrapDb() {
  console.log('Generating full seeding logic for QA Pulse...');

  // 1. Roles & Users Seed (20 distinct users across levels and departments)
  const departments = ['Core Core Eng', 'QA Automation', 'DevOps & SRE', 'Platform Ops', 'Product Design'];
  const designationsByRole: Record<string, string[]> = {
    'Admin': ['Chief QA Architect', 'Director of DevOps', 'Security Architect'],
    'QA Lead': ['Principal Automation Lead', 'QA Manager', 'Team Lead Systems Test'],
    'QA Engineer': ['Senior QA Test Specialist', 'Automation Engineer II', 'Core QA Engineer', 'Manual QA Analyst'],
    'Viewer': ['Product Analyst', 'External Release Viewer', 'Guest Engineering Auditor']
  };

  const seedUsersConfig = [
    { name: 'Rajat Singh', email: 'RajatSinghRaj4321@gmail.com', role: 'Admin', dep: 'QA Automation', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
    { name: 'Sarah Vance', email: 'sarah.vance@qapulse.com', role: 'QA Lead', dep: 'QA Automation', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
    { name: 'Marcus Brody', email: 'marcus@qapulse.com', role: 'Admin', dep: 'DevOps & SRE', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
    { name: 'David Chen', email: 'david.chen@qapulse.com', role: 'QA Engineer', dep: 'Core Core Eng', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
    { name: 'Elena Rostova', email: 'elena.rostova@qapulse.com', role: 'QA Lead', dep: 'Platform Ops', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
    { name: 'James Carter', email: 'james@qapulse.com', role: 'QA Engineer', dep: 'QA Automation', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
    { name: 'Olivia Martinez', email: 'olivia.m@qapulse.com', role: 'Viewer', dep: 'Product Design', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80' },
    { name: 'Sam Wood', email: 'sam@qapulse.com', role: 'QA Engineer', dep: 'Core Core Eng', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
    { name: 'Jessica Taylor', email: 'jessica.t@qapulse.com', role: 'QA Engineer', dep: 'Core Core Eng', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
    { name: 'Daniel Kim', email: 'daniel@qapulse.com', role: 'Viewer', dep: 'Product Design', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80' },
    { name: 'Sophie Dubois', email: 'sophie.d@qapulse.com', role: 'QA Lead', dep: 'Core Core Eng', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' },
    { name: 'William Turner', email: 'william@qapulse.com', role: 'QA Engineer', dep: 'QA Automation', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80' },
    { name: 'Amara Oke', email: 'amara@qapulse.com', role: 'QA Engineer', dep: 'DevOps & SRE', avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&auto=format&fit=crop&q=80' },
    { name: 'George Harris', email: 'george@qapulse.com', role: 'Viewer', dep: 'Platform Ops', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' },
    { name: 'Isabella Rossi', email: 'isabella@qapulse.com', role: 'QA Engineer', dep: 'QA Automation', avatar: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=150&auto=format&fit=crop&q=80' },
    { name: 'Aiden Gallagher', email: 'aiden@qapulse.com', role: 'QA Engineer', dep: 'Core Core Eng', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80' },
    { name: 'Camila Zhang', email: 'camila@qapulse.com', role: 'QA Engineer', dep: 'QA Automation', avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80' },
    { name: 'Liam Sterling', email: 'liam@qapulse.com', role: 'Admin', dep: 'DevOps & SRE', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80' },
    { name: 'Sophia Kowalski', email: 'sophia@qapulse.com', role: 'QA Lead', dep: 'QA Automation', avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80' },
    { name: 'Nikhil Nair', email: 'nikhil@qapulse.com', role: 'QA Engineer', dep: 'Core Core Eng', avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80' }
  ];

  db.users = seedUsersConfig.map(u => {
    const desigs = designationsByRole[u.role] || ['QA Consultant'];
    const designation = desigs[Math.floor(Math.random() * desigs.length)];
    return {
      id: uuid(),
      email: u.email,
      name: u.name,
      avatar: u.avatar,
      department: u.dep,
      designation,
      role: u.role as UserRole,
      status: 'active',
      created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    };
  });

  // Create User Settings for each User
  db.users.forEach(u => {
    db.user_settings.push({
      id: uuid(),
      user_id: u.id,
      email_alerts: true,
      browser_push: true,
      automation_sync: u.role === 'Admin' || u.role === 'QA Lead',
      urgent_only: u.role === 'Viewer',
      theme: 'dark',
      created_at: new Date().toISOString()
    });
  });

  // 2. 10 Projects Seed
  const projectNames = [
    { name: 'Aurora Cloud Portal', desc: 'The next-generation distributed user engagement dashboard.' },
    { name: 'Chronos Mobile Companion', desc: 'Reactive tracking iOS and Android field-operations client.' },
    { name: 'Lumina Payment Gateway', desc: 'SLA sensitive, zero-loss distributed payment ledger broker.' },
    { name: 'Nova GraphQL Broker', desc: 'Aggregated microservice gateway hosting centralized entity graphs.' },
    { name: 'Apex Identity Provider', desc: 'Fully compliant JWT, SAML and OAuth IDP authority.' },
    { name: 'Helium Content Delivery', desc: 'Distributed caching edge nodes for static media streams.' },
    { name: 'Solar IoT Telemetry Core', desc: 'High frequency TCP stream aggregator for smart IoT sensors.' },
    { name: 'Eclipse Distributed Search', desc: 'Elasticsearch interface indexing global product catalogs.' },
    { name: 'Nebula ML Predictions API', desc: 'Low latency classification inference server pipeline.' },
    { name: 'Vector Vector Engine', desc: 'Near-neighbor search backend optimized for LLM token embeddings.' }
  ];

  db.projects = projectNames.map((p, i) => ({
    id: uuid(),
    name: p.name,
    description: p.desc,
    status: i === 7 ? 'Archived' : 'Active',
    created_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }));

  // 3. Environments Seed (production-grade defaults)
  const envNames = [
    { name: 'Production Grid (AWS-US-EAST)', url: 'https://core.qapulse.com' },
    { name: 'Staging Relay (AWS-US-WEST)', url: 'https://staging.qapulse.com' },
    { name: 'Integration Sandbox (Azure-EU)', url: 'https://sandbox.qapulse.eu' },
    { name: 'Local Dev Proxy', url: 'https://localhost:8484' }
  ];

  db.environments = envNames.map(e => ({
    id: uuid(),
    name: e.name,
    url: e.url,
    status: Math.random() < 0.05 ? 'Down' : 'Active',
    created_at: new Date(Date.now() - 120 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }));

  // 4. 15 Test Suites Seed
  const suiteTemplates = [
    { name: 'Distributed Auth Handshake Suite', desc: 'Verify OAuth handshake, session expirations and role tokens.' },
    { name: 'Zero-Copy Serialization Ledger', desc: 'Ensure financial integrity under massive race conditions.' },
    { name: 'GraphQL Schema Structural Validation', desc: 'Inspect graph resolvers for cyclical dependencies & leaf structures.' },
    { name: 'JWT Validation & Public Key Rotating', desc: 'Validate rotating JWKS keys and immediate token validation rules.' },
    { name: 'Cache Header Invalidations', desc: 'Ensure edge nodes respond to PURGE commands securely.' },
    { name: 'IoT Stream Backpressure Tests', desc: 'Introduce throughput choke and analyze buffers.' },
    { name: 'Fuzzy Query Match Matrix', desc: 'Edge cases for compound index lookups, stop-words, and regex injections.' },
    { name: 'Neural Model Classification Thresholds', desc: 'Test precision-recall consistency over raw dataset updates.' },
    { name: 'Vector Clustering Index Health', desc: 'Verify HNSW recall ratios over high dimensionality vectors.' },
    { name: 'Billing Ledger Refund Flows', desc: 'Validate itemized credits, multi-currency ratios, and VAT adjustments.' },
    { name: 'Memory Leak & Profiling Suite', desc: 'Runs endurance scenarios checking Node V8 memory limits.' },
    { name: 'Responsive Accessibility Validation', desc: 'Validate semantic nodes, keyboard focusing limits and dark mode contrast.' },
    { name: 'API Gateway Rate Limitation Rules', desc: 'Verify sliding window IP throttles under distributed bot simulation.' },
    { name: 'Third-Party Webhook Retry Queues', desc: 'Test webhook retry queues using chaotic backoff simulations.' },
    { name: 'Scylla DB Disaster Recovery Fallback', desc: 'Validates automated failover of secondary active cluster nodes.' }
  ];

  db.test_suites = suiteTemplates.map((st, i) => {
    // Distribute across first 5 active projects
    const projIdx = i % 5;
    return {
      id: uuid(),
      name: st.name,
      description: st.desc,
      project_id: db.projects[projIdx].id,
      created_at: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    };
  });

  // Generates 8 Test Cases for each test suite (total 120 Test Cases)
  db.test_suites.forEach(suite => {
    for (let c = 1; c <= 8; c++) {
      db.test_cases.push({
        id: uuid(),
        suite_id: suite.id,
        title: `TC-${c}: Verification of ${suite.name.split(' ')[0]} Component Edgecase ${c}`,
        description: `This test confirms that the logic correctly matches system requirements when input condition resembles state branch ${c}.`,
        steps: [
          `Step 1: Authenticate agent secure signature credentials against authorization payload.`,
          `Step 2: Dispatch mock transactional state vectors mapped on variant index ${c}.`,
          `Step 3: Await response headers and capture process latency metrics.`,
          `Step 4: Confirm entity attributes correspond directly with specifications.`
        ],
        expected_result: `System responds with successful acknowledgement vector and audit trail generated in less than 350ms.`,
        automation_status: c % 3 === 0 ? 'Manual' : 'Automated',
        priority: c % 4 === 0 ? 'High' : (c % 4 === 1 ? 'Medium' : 'Low'),
        created_at: new Date(Date.now() - 24 * 24 * 3600 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  });

  // 5. 100 Test Runs Seed (covering historical executions)
  const testerIds = db.users.filter(u => u.role !== 'Viewer').map(u => u.id);
  const suiteIds = db.test_suites.map(s => s.id);
  const envIds = db.environments.map(e => e.id);

  for (let r = 1; r <= 100; r++) {
    const suiteId = suiteIds[r % suiteIds.length];
    const envId = envIds[r % envIds.length];
    const creatorId = testerIds[r % testerIds.length];

    // Distribute timestamps over previous 30 days
    const timeOffsetDays = 30 - (r * 0.28);
    const startTimestamp = new Date(Date.now() - timeOffsetDays * 24 * 3600 * 1000);
    const casesInSuite = 8;
    
    // Pass/Fail distribution
    let failedCases = 0;
    if (r % 7 === 0) {
      failedCases = 2; // Failed Run
    } else if (r % 15 === 0) {
      failedCases = 3; // Extreme failures
    } else if (r % 12 === 0) {
      failedCases = 1; // Slight failure
    }

    const passedCases = casesInSuite - failedCases;
    const runStatus: RunStatus = failedCases === 0 ? 'Passed' : (passedCases === 0 ? 'Failed' : 'Partial');

    db.test_runs.push({
      id: uuid(),
      name: `Automated Pipeline - Execution Artifact #${5400 + r}`,
      suite_id: suiteId,
      environment_id: envId,
      status: runStatus,
      creator_id: creatorId,
      duration: Math.floor(Math.random() * 60) + 12, // in seconds
      total_cases: casesInSuite,
      passed_cases: passedCases,
      failed_cases: failedCases,
      created_at: startTimestamp.toISOString(),
      updated_at: new Date(startTimestamp.getTime() + 15000).toISOString()
    });
  }

  // Write corresponding 100 Test Cases simulation results for the most recent 10 runs
  const recentRuns = db.test_runs.slice(-10);
  recentRuns.forEach(run => {
    const suiteCases = db.test_cases.filter(c => c.suite_id === run.suite_id);
    suiteCases.forEach((tc, idx) => {
      const isFailed = idx < run.failed_cases;
      db.test_run_results.push({
        id: uuid(),
        run_id: run.id,
        case_id: tc.id,
        case_title: tc.title,
        status: isFailed ? 'Failed' : 'Passed',
        error_message: isFailed ? 'AssertionError: Core gateway response structure malformed. Missing key sequence in handshake.' : undefined,
        executed_by_id: run.creator_id,
        duration: Math.floor(Math.random() * 400) + 80,
        created_at: run.created_at
      });
    });
  });

  // 6. 50 Rich Defects Seed
  const defectTitlesAndDescriptions = [
    { title: 'Concurrent Session token invalidate loop under multiple tabs', desc: 'When the user launches three browser tabs simultaneously, JWT state is corrupted causing infinite redirect loops.', sev: 'High', pri: 'Critical' },
    { title: 'Payment Gate buffer overflow with negative transaction scalars', desc: 'Discovered that dispatching negative float parameters in ledger refund queries bypasses ledger checking scripts.', sev: 'Critical', pri: 'Critical' },
    { title: 'GraphQL Resolvers trigger SQL N+1 loading cascade in project query', desc: 'Calling projects list causes 112 sub-queries against environment entities, spiking load balancer response times.', sev: 'Medium', pri: 'High' },
    { title: 'WebSocket connection disconnects unexpectedly upon load balancing proxy failover', desc: 'Under proxy cluster failure simulations, client WS connections hang for 11 minutes without triggers re-establishing.', sev: 'High', pri: 'High' },
    { title: 'JWT rotation mechanism neglects invalidating blacklisted active signatures', desc: 'Blacklisted signature payloads continue accessing user scopes for up to 35 minutes following revoke commands.', sev: 'Critical', pri: 'Critical' },
    { title: 'File attachments over limits hang client progress state loaders', desc: 'Uploading files exceeding 10MB locks up React hydration state resulting in 100% CPU lock in chrome.', sev: 'Low', pri: 'Medium' },
    { title: 'HNSW vector cluster query returns irrelevant near-neighbor vectors on high-alpha bounds', desc: 'The cosine similarity weights logic is incorrectly inverted on high-alpha queries, shifting closest nodes away.', sev: 'High', pri: 'Medium' },
    { title: 'IoT buffer overflows trigger Scylla DB deadlock lockouts', desc: 'High frequency iot stream uploads create cluster writes block waiting for row updates during index rebuild.', sev: 'Critical', pri: 'Critical' },
    { title: 'Responsive grid displays collapse on extreme viewport sizes (<320px)', desc: 'Mobile sidebar wrapper overlays navigation buttons on iphone SE screen sizes, causing tap locking.', sev: 'Low', pri: 'Low' },
    { title: 'Billing gateway ledger throws math round errors in multi-currency ratios', desc: 'Currency multipliers show minor rounding drift of $.02 on items when aggregated dynamically across VAT regimes.', sev: 'Medium', pri: 'High' }
  ];

  const assigneeIds = db.users.filter(u => u.role === 'QA Engineer' || u.role === 'QA Lead').map(u => u.id);
  const reporterIds = db.users.filter(u => u.role === 'Admin' || u.role === 'QA Lead').map(u => u.id);
  const activeProjects = db.projects.filter(p => p.status === 'Active');
  const activeEnvs = db.environments.filter(e => e.status === 'Active');

  for (let d = 1; d <= 50; d++) {
    const template = defectTitlesAndDescriptions[d % defectTitlesAndDescriptions.length];
    const assignee_id = assigneeIds[d % assigneeIds.length];
    const reporter_id = reporterIds[d % reporterIds.length];
    const project_id = activeProjects[d % activeProjects.length].id;
    const environment_id = activeEnvs[d % activeEnvs.length].id;

    const statuses: DefectStatus[] = ['Open', 'In Progress', 'Resolved', 'Closed'];
    const status = statuses[d % statuses.length];

    // Date distribution
    const dt = new Date(Date.now() - (50 - d) * 12 * 3600 * 1000);

    const defect: Defect = {
      id: uuid(),
      defect_id: `DEF-${String(d).padStart(3, '0')}`,
      title: `${template.title} [Index ${d}]`,
      description: `STEPS TO REPLICATE:\n1. Browse to secure zone container app.\n2. Trigger step instructions modeled under standard parameters.\n3. Observe anomalous behavior patterns: \n${template.desc}`,
      severity: template.sev as SeverityType,
      priority: template.pri as PriorityType,
      status,
      assignee_id,
      reporter_id,
      project_id,
      environment_id,
      created_at: dt.toISOString(),
      updated_at: new Date(dt.getTime() + 4 * 3600 * 1000).toISOString()
    };

    db.defects.push(defect);

    // Seed up to 2 comments for a few defects
    if (d % 3 === 0) {
      db.defect_comments.push({
        id: uuid(),
        defect_id: defect.id,
        author_id: reporter_id,
        author_name: '',
        author_avatar: '',
        comment: `Investigation in progress. Confirmed spike in server thread pools under load. Ready for patch validation.`,
        created_at: new Date(dt.getTime() + 2 * 3600 * 1000).toISOString()
      });
      db.defect_comments.push({
        id: uuid(),
        defect_id: defect.id,
        author_id: assignee_id,
        author_name: '',
        author_avatar: '',
        comment: `I have committed local fix to repository branch "hotfix/${defect.defect_id}". Scheduled regression tests on Staging Relay.`,
        created_at: new Date(dt.getTime() + 3 * 3600 * 1000).toISOString()
      });
    }

    // Add file attachments for defects
    if (d % 5 === 0) {
      db.attachments.push({
        id: uuid(),
        defect_id: defect.id,
        name: `gateway_stack_trace_${d}.txt`,
        url: `https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=60`,
        size: 14502,
        mime_type: 'text/plain',
        uploaded_by_id: assignee_id,
        created_at: dt.toISOString()
      });
    }
  }

  // 7. Performance historical metrics (120 historical entries for 4 environments)
  const endpoints = ['/api/v1/auth/token', '/api/v1/ledger/refund', '/api/v1/graphql/query', '/api/v1/iot/stream'];
  for (let i = 0; i < 120; i++) {
    const envId = db.environments[i % db.environments.length].id;
    const endpoint = endpoints[i % endpoints.length];
    
    // Create logical timelines back by 24 hours
    const latencyOffset = i % 10 === 0 ? 500 : 0; // occasional spikes
    const latency = Math.floor(Math.random() * 200) + 120 + latencyOffset;
    const throughput = Math.floor(Math.random() * 80) + 12;
    const error_rate = i % 15 === 0 ? parseFloat((Math.random() * 8).toFixed(1)) : parseFloat((Math.random() * 1.5).toFixed(1));
    const timestampStr = new Date(Date.now() - (120 - i) * 12 * 60000).toISOString(); // 12-minute steps

    db.performance_metrics.push({
      id: uuid(),
      environment_id: envId,
      endpoint,
      latency,
      throughput,
      error_rate,
      timestamp: timestampStr
    });
  }

  // 8. Bootstrap Activities & Audit Logs
  const mainAdmin = db.users.find(u => u.email === 'RajatSinghRaj4321@gmail.com') || db.users[0];
  const auditActions = ['create', 'update', 'delete', 'execute'];
  const auditTables = ['defects', 'test_suites', 'test_runs', 'user_settings'];

  for (let a = 1; a <= 30; a++) {
    const user = db.users[a % db.users.length];
    db.activities.push({
      id: uuid(),
      user_id: user.id,
      user_name: '',
      user_avatar: '',
      category: a % 4 === 0 ? 'Auth' : (a % 4 === 1 ? 'Defect' : 'Test'),
      action: a % 4 === 0 ? 'Admin Sign In' : (a % 4 === 1 ? 'Defect Level Reassigned' : 'Test Run Completed'),
      description: `Action sequence logged during standard team validation workflow. Checked item ${a}.`,
      created_at: new Date(Date.now() - a * 4 * 3600 * 1000).toISOString()
    });

    db.audit_logs.push({
      id: uuid(),
      user_id: user.id,
      user_name: '',
      action: auditActions[a % auditActions.length],
      table_name: auditTables[a % auditTables.length],
      record_id: uuid(),
      old_value: JSON.stringify({ status: 'Open', priority: 'Medium' }),
      new_value: JSON.stringify({ status: 'In Progress', priority: 'High' }),
      ip_address: `192.168.12.${10 + a}`,
      created_at: new Date(Date.now() - a * 4 * 3600 * 1000).toISOString()
    });
  }

  // 9. Notifications Bootstrap
  const notifTypes: Notification['type'][] = [
    'Defect Assigned',
    'Defect Resolved',
    'Test Failed',
    'Performance Alert',
    'System Alert'
  ];

  db.users.forEach((usr, idx) => {
    // Generate 4-5 items per user
    for (let n = 1; n <= 4; n++) {
      const type = notifTypes[(idx + n) % notifTypes.length];
      db.notifications.push({
        id: uuid(),
        user_id: usr.id,
        type,
        title: `Verification Notification ${n}`,
        message: `System Alert dispatched for ${usr.name}. Transaction reference #${20500 + n}.`,
        read: n % 2 === 0,
        created_at: new Date(Date.now() - n * 8 * 3600 * 1000).toISOString()
      });
    }
  });

  saveDb();
  console.log('Seed database bootstrap completed successfully. Saved to ./db.json.');
}

// Initial DB load on import
DB.load();
