/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Roles
export type UserRole = 'Admin' | 'QA Lead' | 'QA Engineer' | 'Viewer';

// Users
export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  department: string;
  designation: string;
  role: UserRole;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

// Projects
export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'Active' | 'Archived';
  created_at: string;
  updated_at: string;
}

// Environments
export interface Environment {
  id: string;
  name: string;
  url: string;
  status: 'Active' | 'Down';
  created_at: string;
  updated_at: string;
}

// Severity & Priority Definitions
export type SeverityType = 'Low' | 'Medium' | 'High' | 'Critical';
export type PriorityType = 'Low' | 'Medium' | 'High' | 'Critical';
export type DefectStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

// Defects
export interface Defect {
  id: string;
  defect_id: string; // e.g. "DEF-101"
  title: string;
  description: string;
  severity: SeverityType;
  priority: PriorityType;
  status: DefectStatus;
  assignee_id: string;
  reporter_id: string;
  project_id: string;
  environment_id: string;
  created_at: string;
  updated_at: string;

  // Joined relations for convenience in client UI
  project_name?: string;
  environment_name?: string;
  assignee_name?: string;
  assignee_avatar?: string;
  reporter_name?: string;
}

// Defect Comments
export interface DefectComment {
  id: string;
  defect_id: string;
  author_id: string;
  author_name: string;
  author_avatar: string;
  comment: string;
  created_at: string;
}

// File Attachments
export interface FileAttachment {
  id: string;
  defect_id: string;
  name: string;
  url: string;
  size: number;
  mime_type: string;
  uploaded_by_id: string;
  created_at: string;
}

// Test Suites
export interface TestSuite {
  id: string;
  name: string;
  description: string;
  project_id: string;
  created_at: string;
  updated_at: string;
  
  // Custom metadata for UI metrics
  project_name?: string;
  case_count?: number;
}

// Test cases
export interface TestCase {
  id: string;
  suite_id: string;
  title: string;
  description: string;
  steps: string[];
  expected_result: string;
  automation_status: 'Automated' | 'Manual';
  priority: 'Low' | 'Medium' | 'High';
  created_at: string;
  updated_at: string;
}

// Test Runs
export type RunStatus = 'Passed' | 'Failed' | 'Partial' | 'Running';

export interface TestRun {
  id: string;
  name: string;
  suite_id: string;
  environment_id: string;
  status: RunStatus;
  creator_id: string;
  duration: number; // in seconds
  total_cases: number;
  passed_cases: number;
  failed_cases: number;
  created_at: string;
  updated_at: string;

  // Joins
  suite_name?: string;
  environment_name?: string;
  creator_name?: string;
}

// Test Run Results for verification
export interface TestRunResult {
  id: string;
  run_id: string;
  case_id: string;
  case_title: string;
  status: 'Passed' | 'Failed' | 'Skipped';
  error_message?: string;
  executed_by_id: string;
  duration: number; // ms
  created_at: string;
}

// Performance Metrics
export interface PerformanceMetric {
  id: string;
  environment_id: string;
  environment_name?: string;
  endpoint: string;
  latency: number; // ms
  throughput: number; // req/sec
  error_rate: number; // percent
  timestamp: string;
}

// Notifications
export interface Notification {
  id: string;
  user_id: string;
  type: 'Defect Assigned' | 'Defect Resolved' | 'Test Failed' | 'Performance Alert' | 'System Alert';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

// Activity History
export interface Activity {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  category: 'Auth' | 'Defect' | 'Test' | 'Settings' | 'Project';
  action: string;
  description: string;
  created_at: string;
}

// Audit Logs
export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  table_name: string;
  record_id: string;
  old_value: string; // JSON Stringified
  new_value: string; // JSON Stringified
  ip_address: string;
  created_at: string;
}

// User Settings
export interface UserSettings {
  id: string;
  user_id: string;
  email_alerts: boolean;
  browser_push: boolean;
  automation_sync: boolean;
  urgent_only: boolean;
  theme: 'light' | 'dark';
  created_at: string;
}
