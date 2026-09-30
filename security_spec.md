# Security Specification: Health Journal Cloud Security & ABAC

## 1. Data Invariants

1. **Strict User Isolation**: Any path under `/users/{userId}/*` can strictly only be read or written by an authenticated user whose `request.auth.uid == userId`.
2. **No Cross-Account Infiltration**: User A cannot read, query, list, create, edit, or delete any record under User B's `/users/{userB_id}` document tree.
3. **No Unauthenticated Access**: Unauthenticated visitors (`request.auth == null`) are denied all access to any document in the entire database.
4. **Valid Path ID**: All document IDs must satisfy the ID regex pattern (`^[a-zA-Z0-9_\-]+$`) and cannot exceed 128 characters.
5. **No Document Poisoning / Oversized Payloads**: All text fields must have reasonable length boundaries (`<= 2000` or `<= 5000` characters) to prevent Denial-of-Wallet attacks.
6. **No Default-Open Routes**: Any unrecognized or top-level path outside `/users/{userId}` is strictly denied by the global catch-all.

---

## 2. The Dirty Dozen Payloads (Adversarial Attack Scenarios)

1. **Payload 1: Unauthenticated Read of User Profile**
   - Target: `GET /users/victim123/profile/main`
   - Auth: `null`
   - Expected: `PERMISSION_DENIED`

2. **Payload 2: Cross-User Symptom Read (IDOR Attack)**
   - Target: `GET /users/victim123/symptoms/symptom_abc`
   - Auth: `{ uid: "attacker456" }`
   - Expected: `PERMISSION_DENIED`

3. **Payload 3: Cross-User Symptom Creation**
   - Target: `CREATE /users/victim123/symptoms/symptom_fake`
   - Auth: `{ uid: "attacker456" }`
   - Payload: `{ id: "symptom_fake", symptomName: "Spoofed Symptom", severity: 8, date: "2026-09-30" }`
   - Expected: `PERMISSION_DENIED`

4. **Payload 4: Cross-User List Query (Collection Snooping)**
   - Target: `LIST /users/victim123/symptoms`
   - Auth: `{ uid: "attacker456" }`
   - Expected: `PERMISSION_DENIED`

5. **Payload 5: Cross-User Medication Modification**
   - Target: `UPDATE /users/victim123/medications/med_1`
   - Auth: `{ uid: "attacker456" }`
   - Payload: `{ isActive: false }`
   - Expected: `PERMISSION_DENIED`

6. **Payload 6: Cross-User Medical Record Deletion**
   - Target: `DELETE /users/victim123/medicalRecords/record_1`
   - Auth: `{ uid: "attacker456" }`
   - Expected: `PERMISSION_DENIED`

7. **Payload 7: Denial-of-Wallet Path Poisoning (Huge ID)**
   - Target: `CREATE /users/victim123/symptoms/` + 500-char string
   - Auth: `{ uid: "victim123" }`
   - Expected: `PERMISSION_DENIED` (due to `isValidId` check)

8. **Payload 8: Unauthenticated Write to Root / System Docs**
   - Target: `CREATE /system/config`
   - Auth: `null`
   - Expected: `PERMISSION_DENIED`

9. **Payload 9: Authenticated Tampering with Other User's Doctor Report**
   - Target: `UPDATE /users/victim123/reports/rep_1`
   - Auth: `{ uid: "attacker456" }`
   - Expected: `PERMISSION_DENIED`

10. **Payload 10: Anonymous Read of Sleep Data**
    - Target: `GET /users/victim123/sleep/sleep_1`
    - Auth: `null`
    - Expected: `PERMISSION_DENIED`

11. **Payload 11: Cross-User Check-in Inspection**
    - Target: `GET /users/victim123/checkins/checkin_1`
    - Auth: `{ uid: "attacker456" }`
    - Expected: `PERMISSION_DENIED`

12. **Payload 12: Cross-User Profile Overwrite**
    - Target: `SET /users/victim123/profile/main`
    - Auth: `{ uid: "attacker456" }`
    - Payload: `{ name: "Hacked Profile", sex: "male", country: "US" }`
    - Expected: `PERMISSION_DENIED`

---

## 3. Test Runner Specification

All operations targeted by an actor other than the document path owner `userId` or without a valid authentication token result in synchronous `PERMISSION_DENIED` response from the Firebase Rules engine.
