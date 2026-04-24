// backend/notifHelper.js
// ─────────────────────────────────────────────────────────────────────────────
// Central helper: sendNotif(pool, userId, key, message, type)
// All backend routes import this to send role-linked notifications.
// The ON CONFLICT (notif_key) DO NOTHING prevents duplicates.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Insert one notification row. Silently skips if notif_key already exists.
 * @param {Pool}   pool    - pg Pool instance
 * @param {number} userId  - recipient user id
 * @param {string} key     - globally unique key (prevents duplicate inserts)
 * @param {string} message - human-readable message
 * @param {string} type    - 'info' | 'success' | 'warning' | 'reminder' | 'welcome' | 'assignment'
 */
export async function sendNotif(pool, userId, key, message, type = 'info') {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, notif_key, message, type)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (notif_key) DO NOTHING`,
      [userId, key, message, type],
    )
  } catch (err) {
    // Never crash the parent request because of a notification error
    console.warn(`[notifHelper] Failed to insert notif key=${key}:`, err.message)
  }
}

/**
 * Send the same notification to all admins.
 */
export async function notifyAllAdmins(pool, key, message, type = 'info') {
  try {
    const admins = await pool.query(`SELECT id FROM users WHERE role = 'admin'`)
    for (const admin of admins.rows) {
      await sendNotif(pool, admin.id, `${key}_a${admin.id}`, message, type)
    }
  } catch (err) {
    console.warn('[notifHelper] notifyAllAdmins error:', err.message)
  }
}

/**
 * Send notification to every parent of a student.
 */
export async function notifyParentsOf(pool, studentId, key, message, type = 'info') {
  try {
    const parents = await pool.query(
      `SELECT parent_id FROM parent_students WHERE student_id = $1`,
      [studentId],
    )
    for (const p of parents.rows) {
      await sendNotif(pool, p.parent_id, `${key}_p${p.parent_id}`, message, type)
    }
  } catch (err) {
    console.warn('[notifHelper] notifyParentsOf error:', err.message)
  }
}

/**
 * Send notification to all active students in a group.
 */
export async function notifyGroupStudents(pool, groupId, key, message, type = 'info') {
  try {
    const students = await pool.query(
      `SELECT student_id FROM group_students WHERE group_id = $1 AND status = 'active'`,
      [groupId],
    )
    for (const st of students.rows) {
      await sendNotif(pool, st.student_id, `${key}_s${st.student_id}`, message, type)
      await notifyParentsOf(pool, st.student_id, `${key}_s${st.student_id}`, message, type)
    }
  } catch (err) {
    console.warn('[notifHelper] notifyGroupStudents error:', err.message)
  }
}
