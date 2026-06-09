# Security Specification (`security_spec.md`)

This security specification establishes the Attribute-Based Access Control (ABAC) boundaries and strict type contracts for the QA Pulse Firebase deployment.

## 1. Data Invariants

1. **Relation Bounds**: 
   - A comment cannot be created for a non-existent defect.
   - An active TestRun cannot reference a non-existent TestSuite.
   - A TestCase must map to a valid TestSuite.
2. **Access Isolation**:
   - Only matching user profile documents can be modified by their respective owners.
   - No user can escalate their own simulated role via client-side operations.
   - Write actions (defects create/edit, suite additions, run executions) are restricted to authentic, verified sessions.
3. **Immutability Clauses**:
   - `created_at` fields on defects, comments, suites, and users are completely immutable post-insertion.
   - `defect_id` (e.g. DEF-101) cannot be altered once assigned.

---

## 2. The "Dirty Dozen" Payloads

Here are twelve rogue payloads designed to probe authentication boundaries, type constraints, ID lengths, and value leakage:

### Payload 1: Privilege Escalation (Self-Assigned Admin Role)
```json
{
  "id": "user_id_123",
  "name": "Jane QA Specialist",
  "role": "Admin",
  "email": "jane@pulseqa.com",
  "status": "active"
}
```
*Expected Result*: `PERMISSION_DENIED` — Non-admins cannot alter users' roles, and a user cannot set their own role during self-updates.

### Payload 2: Hostile ID Poisoning (Resource Exhaustion)
```json
{
  "id": "def_extremely_long_junk_identifier_repeating_over_and_over_to_reach_one_and_a_half_kilobytes_denial_of_wallet_attacks_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```
*Expected Result*: `PERMISSION_DENIED` — Document IDs must match standard patterns and be shorter than 128 characters.

### Payload 3: Field Injection (Shadow Keys Addition)
```json
{
  "id": "def-123",
  "title": "SQL Injection on Auth",
  "severity": "Critical",
  "priority": "Critical",
  "status": "Open",
  "reporter_id": "user_456",
  "project_id": "proj_abc",
  "environment_id": "env_dev",
  "ghost_field_is_verified_hack": true
}
```
*Expected Result*: `PERMISSION_DENIED` — Strict key structure checking via `keys().hasAll()` and exact key count constraints (`keys().size() == N`).

### Payload 4: PII Unauthorized Leak Snoop
```json
GET /users/private_user_456
Headers: Authorization: Bearer another_unrelated_user
```
*Expected Result*: `PERMISSION_DENIED` — Blanket reads of other users' details are explicitly forbidden.

### Payload 5: Orphan Comment Insertion
```json
{
  "id": "comm_789",
  "defect_id": "non_existent_defect_uuid_999",
  "author_id": "user_123",
  "author_name": "John Doe",
  "comment": "Rogue Comment",
  "created_at": "2026-06-08T18:34:15Z"
}
```
*Expected Result*: `PERMISSION_DENIED` — The referenced defect ID must verify to an existing defect document using `exists()`.

### Payload 6: Status Hop Bypass (State Machine Hijack)
```json
{
  "id": "def_101",
  "status": "Closed",
  "title": "Malicious Status Skip"
}
```
*Expected Result*: `PERMISSION_DENIED` — Transitional status states cannot bypass validation checks or jump boundaries.

### Payload 7: Terminal State Overwrite
```json
{
  "id": "def_finalized_111",
  "status": "Closed",
  "title": "Illegal Override of Terminal State"
}
```
*Expected Result*: `PERMISSION_DENIED` — Once an item reaches a terminal value (e.g. `Closed`), editing is locked for non-admins.

### Payload 8: Immutable Timestamp Manipulation (createdAt Hack)
```json
{
  "id": "def_102",
  "created_at": "1999-01-01T00:00:00Z"
}
```
*Expected Result*: `PERMISSION_DENIED` — `created_at` timestamp must match the strict server time `request.time`.

### Payload 9: Empty Values / Empty Defect Title Poisoning
```json
{
  "id": "def_103",
  "title": "",
  "severity": "Low",
  "priority": "Low",
  "status": "Open",
  "reporter_id": "user_123",
  "project_id": "proj_abc",
  "environment_id": "env_dev"
}
```
*Expected Result*: `PERMISSION_DENIED` — Title must be non-empty and satisfy size boundaries (`size() >= 3`).

### Payload 10: Array Size Exhaustion (Denial-of-Wallet Array Push)
```json
{
  "id": "suite_123",
  "steps": ["step1", "step2", "step3", "...", "step20000"]
}
```
*Expected Result*: `PERMISSION_DENIED` — Array structures must respect strict size constraints (e.g., `<= 100`).

### Payload 11: Spoofed Reporter ID (Identity Theft)
```json
{
  "id": "def_104",
  "title": "Spoofed Defect reporting",
  "severity": "Medium",
  "priority": "Medium",
  "status": "Open",
  "reporter_id": "another_hacked_user_uuid",
  "project_id": "proj_abc",
  "environment_id": "env_dev"
}
```
*Expected Result*: `PERMISSION_DENIED` — `reporter_id` field in payload must strictly match authenticated `request.auth.uid`.

### Payload 12: Insecure Query Collection Scraping
```json
GET /defects
Headers: Authorization: Bearer active_user_token
Query: none (Blanket retrieve all)
```
*Expected Result*: `PERMISSION_DENIED` — Collections must reject blanket queries which aren't scoped securely to allowed relationships inside the security rules.

---

## 3. The Test Runner (`firestore.rules.test.ts`)

A complete TypeScript test specification to verify security compliance using the `@firebase/rules-unit-testing` framework.

```typescript
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import * as fs from "fs";

let testEnv: RulesTestEnvironment;

describe("QA Pulse fortress rule verification", () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "dauntless-abode-sszp9",
      firestore: {
        rules: fs.readFileSync("firestore.rules", "utf8"),
        host: "localhost",
        port: 8080,
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  test("Blocked: Payload 1 - Privilege Escalation", async () => {
    const context = testEnv.authenticatedContext("user_123");
    const usrRef = doc(context.firestore(), "users", "user_123");
    
    await expect(
      setDoc(usrRef, {
        id: "user_123",
        email: "attacker@gmail.com",
        name: "Attacker",
        role: "Admin",
        status: "active",
        created_at: new Date().toISOString()
      })
    ).rejects.toThrow();
  });

  test("Blocked: Payload 2 - ID Poisoning Guard", async () => {
    const context = testEnv.authenticatedContext("user_123");
    const docRef = doc(context.firestore(), "defects", "a".repeat(200));
    await expect(
      setDoc(docRef, { title: "Spam" })
    ).rejects.toThrow();
  });

  test("Blocked: Payload 3 - Field Injection (Shadow Keys)", async () => {
    const context = testEnv.authenticatedContext("user_123");
    const defectRef = doc(context.firestore(), "defects", "def_101");
    await expect(
      setDoc(defectRef, {
        id: "def_101",
        defect_id: "DEF-101",
        title: "Normal Bug",
        severity: "Low",
        priority: "Low",
        status: "Open",
        reporter_id: "user_123",
        project_id: "proj_abc",
        environment_id: "env_dev",
        ghost_field_is_verified_hack: true
      })
    ).rejects.toThrow();
  });
});
```
