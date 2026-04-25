-- ═══════════════════════════════════════════════════════════════════════════════
-- 🎓 BELMAHI SCHOOL — SEED DATA FOR TESTING
-- ═══════════════════════════════════════════════════════════════════════════════
-- Roles:   1 admin, 4 teachers (M/F), 20 students, 5 parents
-- Courses: primaire / moyen / secondaire — continuous & intensive
-- Groups:  multiple groups per course, different days/times
-- group_students: 20 students enrolled, mixed payment & status
-- Notifications: welcome messages
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 0. SAFETY: clear in correct order ──────────────────────────────────────
DELETE FROM notifications;
DELETE FROM course_materials;
DELETE FROM favorites;
DELETE FROM parent_students;
DELETE FROM group_students;
DELETE FROM session_schedule;
DELETE FROM groups;
DELETE FROM courses;
DELETE FROM users WHERE role <> 'admin';   -- keep existing admins if any
DELETE FROM users;                          -- full clean for fresh seed


-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. USERS
-- Passwords are plain-text (as the app currently works).
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO users (id, name, last_name, email, password, role, phone, gender, birthday, city, created_at) VALUES

-- ── ADMIN ────────────────────────────────────────────────────────────────────
(1, 'Karim',    'Belmahi',   'admin@belmahi.dz',          'Admin@1234',   'admin',   '0550000001', 'M', '1980-03-15', 'Oran',     NOW()),

-- ── TEACHERS ─────────────────────────────────────────────────────────────────
(2, 'Mohamed',  'Benali',    'benali@belmahi.dz',         'Teacher@1234', 'teacher', '0550000002', 'M', '1985-06-20', 'Oran',     NOW()),
(3, 'Fatima',   'Haddad',    'haddad@belmahi.dz',         'Teacher@1234', 'teacher', '0550000003', 'F', '1990-09-10', 'Oran',     NOW()),
(4, 'Youcef',   'Mebarki',   'mebarki@belmahi.dz',        'Teacher@1234', 'teacher', '0550000004', 'M', '1988-01-25', 'Mascara',  NOW()),
(5, 'Samira',   'Ouali',     'ouali@belmahi.dz',          'Teacher@1234', 'teacher', '0550000005', 'F', '1992-11-05', 'Oran',     NOW()),

-- ── STUDENTS (20) ─────────────────────────────────────────────────────────────
(10, 'Amine',     'Bekkouche',  'amine.bek@gmail.com',      'Pass@1234', 'student', '0660000010', 'M', '2012-04-01', 'Oran',    NOW()),
(11, 'Rania',     'Zaoui',      'rania.z@gmail.com',        'Pass@1234', 'student', '0660000011', 'F', '2011-07-15', 'Oran',    NOW()),
(12, 'Ilyas',     'Bouchenak',  'ilyas.b@gmail.com',        'Pass@1234', 'student', '0660000012', 'M', '2013-02-20', 'Oran',    NOW()),
(13, 'Nour',      'Khelifi',    'nour.kh@gmail.com',        'Pass@1234', 'student', '0660000013', 'F', '2010-09-30', 'Mostaganem', NOW()),
(14, 'Sami',      'Reghioua',   'sami.r@gmail.com',         'Pass@1234', 'student', '0660000014', 'M', '2012-12-05', 'Oran',    NOW()),
(15, 'Yasmine',   'Derbal',     'yasmine.d@gmail.com',      'Pass@1234', 'student', '0660000015', 'F', '2011-03-18', 'Oran',    NOW()),
(16, 'Hamza',     'Bentoumi',   'hamza.bt@gmail.com',       'Pass@1234', 'student', '0660000016', 'M', '2010-06-22', 'Sidi Bel Abbes', NOW()),
(17, 'Lina',      'Mansouri',   'lina.m@gmail.com',         'Pass@1234', 'student', '0660000017', 'F', '2013-01-11', 'Oran',    NOW()),
(18, 'Khaled',    'Aissaoui',   'khaled.a@gmail.com',       'Pass@1234', 'student', '0660000018', 'M', '2009-08-09', 'Oran',    NOW()),
(19, 'Meriem',    'Taleb',      'meriem.t@gmail.com',       'Pass@1234', 'student', '0660000019', 'F', '2010-05-27', 'Arzew',   NOW()),
(20, 'Bilal',     'Ferroudj',   'bilal.f@gmail.com',        'Pass@1234', 'student', '0660000020', 'M', '2012-10-03', 'Oran',    NOW()),
(21, 'Sara',      'Boudia',     'sara.bd@gmail.com',        'Pass@1234', 'student', '0660000021', 'F', '2011-11-14', 'Oran',    NOW()),
(22, 'Adel',      'Chouaib',    'adel.ch@gmail.com',        'Pass@1234', 'student', '0660000022', 'M', '2009-03-07', 'Tlemcen', NOW()),
(23, 'Hana',      'Meziane',    'hana.mz@gmail.com',        'Pass@1234', 'student', '0660000023', 'F', '2013-07-19', 'Oran',    NOW()),
(24, 'Yassine',   'Bouabdallah','yassine.bo@gmail.com',     'Pass@1234', 'student', '0660000024', 'M', '2010-04-28', 'Oran',    NOW()),
(25, 'Amira',     'Kaddour',    'amira.k@gmail.com',        'Pass@1234', 'student', '0660000025', 'F', '2012-09-16', 'Oran',    NOW()),
(26, 'Rayan',     'Boudjelal',  'rayan.bj@gmail.com',       'Pass@1234', 'student', '0660000026', 'M', '2011-02-03', 'Oran',    NOW()),
(27, 'Ghania',    'Sebaa',      'ghania.s@gmail.com',       'Pass@1234', 'student', '0660000027', 'F', '2010-12-21', 'Mascara', NOW()),
(28, 'Omar',      'Ladj',       'omar.l@gmail.com',         'Pass@1234', 'student', '0660000028', 'M', '2013-06-08', 'Oran',    NOW()),
(29, 'Dounia',    'Benhamed',   'dounia.bh@gmail.com',      'Pass@1234', 'student', '0660000029', 'F', '2009-10-30', 'Oran',    NOW()),

-- ── PARENTS (5) ───────────────────────────────────────────────────────────────
(50, 'Abdelkader','Bekkouche',  'parent.bek@gmail.com',     'Parent@1234','Parent',  '0770000050', 'M', '1975-04-01', 'Oran',    NOW()),
(51, 'Houria',    'Zaoui',      'parent.zaoui@gmail.com',   'Parent@1234','Parent',  '0770000051', 'F', '1978-07-15', 'Oran',    NOW()),
(52, 'Rachid',    'Reghioua',   'parent.reg@gmail.com',     'Parent@1234','Parent',  '0770000052', 'M', '1972-12-05', 'Oran',    NOW()),
(53, 'Nadia',     'Mansouri',   'parent.man@gmail.com',     'Parent@1234','Parent',  '0770000053', 'F', '1980-01-11', 'Oran',    NOW()),
(54, 'Salim',     'Aissaoui',   'parent.ais@gmail.com',     'Parent@1234','Parent',  '0770000054', 'M', '1970-08-09', 'Oran',    NOW());

-- reset sequence
SELECT setval('users_id_seq', 100);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. COURSES
-- education_level: primaire | moyen | secondaire
-- course_type:     continuous | intensive
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO courses (id, title, teacher_id, description, education_level, year_level, branch, course_type, sessions_per_month, duration_hours, price, max_students_per_group, is_active, created_at) VALUES

-- ── PRIMAIRE ─────────────────────────────────────────────────────────────────
(1, 'Mathématiques – 4ème Primaire',   2, 'Cours de soutien en mathématiques pour les élèves de 4ème année primaire. Fractions, multiplication, géométrie de base.', 'primaire', 4, NULL, 'continuous', 8, 1.5, 2500, 15, true, NOW()),
(2, 'Langue Arabe – 3ème Primaire',    3, 'Renforcement en lecture, écriture et grammaire arabe pour 3ème primaire.', 'primaire', 3, NULL, 'continuous', 8, 1.5, 2000, 12, true, NOW()),
(3, 'Éveil Scientifique – 5ème Primaire', 4, 'Sciences et découverte du monde naturel pour les élèves de 5ème primaire. Préparation au passage au moyen.', 'primaire', 5, NULL, 'intensive', 12, 2.0, 3000, 10, true, NOW()),

-- ── MOYEN ─────────────────────────────────────────────────────────────────────
(4, 'Mathématiques – 2ème AM',         2, 'Algèbre, géométrie et résolution de problèmes. Niveau 2ème année moyenne.', 'moyen', 2, NULL, 'continuous', 8, 2.0, 3000, 15, true, NOW()),
(5, 'Physique-Chimie – 3ème AM',       4, 'Introduction aux lois de la physique et réactions chimiques de base. 3ème AM.', 'moyen', 3, NULL, 'continuous', 8, 2.0, 3500, 12, true, NOW()),
(6, 'Français – 4ème AM',             3, 'Grammaire, conjugaison, compréhension écrite et expression pour le BEM.', 'moyen', 4, NULL, 'intensive', 16, 2.5, 4000, 10, true, NOW()),
(7, 'Anglais – 1ère AM',              5, 'Bases de la langue anglaise : vocabulaire, grammaire simple, conversation.', 'moyen', 1, NULL, 'continuous', 8, 1.5, 2500, 15, true, NOW()),

-- ── SECONDAIRE ────────────────────────────────────────────────────────────────
(8, 'Mathématiques – 2ème AS (Sci)',   2, 'Fonctions, dérivées, suites et géométrie analytique. Terminal scientifique.', 'secondaire', 2, 'scientifique', 'continuous', 8, 2.5, 4500, 10, true, NOW()),
(9, 'Physique – 1ère AS (Sci)',        4, 'Mécanique, électricité et optique. Niveau 1ère AS filière sciences.', 'secondaire', 1, 'scientifique', 'continuous', 8, 2.5, 4000, 10, true, NOW()),
(10,'Philosophie – 3ème AS (Lett)',    3, 'Histoire de la philosophie et méthodologie de la dissertation. BAC Lettres.', 'secondaire', 3, 'lettres', 'intensive', 12, 2.0, 3500, 12, true, NOW()),
(11,'Anglais Avancé – 2ème AS',       5, 'Expression écrite et orale avancée. Préparation aux examens officiels.', 'secondaire', 2, 'scientifique', 'continuous', 8, 2.0, 3500, 10, true, NOW()),

-- ── COURS INACTIF (pour tester ce cas) ───────────────────────────────────────
(12,'Informatique – 3ème AS (Suspendu)', 5, 'Cours suspendu en attente de matériel. Ne doit pas apparaître dans les recherches actives.', 'secondaire', 3, 'scientifique', 'continuous', 4, 1.5, 2000, 8, false, NOW());

SELECT setval('courses_id_seq', 20);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. GROUPS
-- day_of_week: sunday|monday|tuesday|wednesday|thursday|friday|saturday
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO groups (id, course_id, group_name, salle, day_of_week, session_start_time, session_end_time, start_date, calendar_type, total_sessions, sessions_per_week, current_students, registration_open, is_active, created_at) VALUES

-- Course 1: Maths 4ème Primaire → 2 groupes
(1,  1, 'Groupe A – Matin',     'Salle 01', 'saturday',  '09:00:00', '10:30:00', '2025-09-13', 'weekly', 32, 2, 0, true,  true, NOW()),
(2,  1, 'Groupe B – Après-midi','Salle 01', 'thursday',  '15:00:00', '16:30:00', '2025-09-11', 'weekly', 32, 2, 0, true,  true, NOW()),

-- Course 2: Arabe 3ème Primaire → 1 groupe
(3,  2, 'Groupe Unique',        'Salle 02', 'wednesday', '10:00:00', '11:30:00', '2025-09-10', 'weekly', 32, 2, 0, true,  true, NOW()),

-- Course 3: Éveil Sci 5ème Primaire – Intensif → 1 groupe
(4,  3, 'Stage Intensif Juin',  'Salle 03', NULL,         NULL,        NULL,       '2026-06-15', 'custom', 12, NULL, 0, true, true, NOW()),

-- Course 4: Maths 2ème AM → 2 groupes
(5,  4, 'Groupe Matin',         'Salle 04', 'monday',    '08:00:00', '10:00:00', '2025-09-15', 'weekly', 32, 2, 0, true,  true, NOW()),
(6,  4, 'Groupe Soir',          'Salle 04', 'tuesday',   '17:00:00', '19:00:00', '2025-09-16', 'weekly', 32, 2, 0, true,  true, NOW()),

-- Course 5: Physique 3ème AM → 1 groupe
(7,  5, 'Groupe Principal',     'Salle 05', 'friday',    '10:00:00', '12:00:00', '2025-09-12', 'weekly', 32, 2, 0, true,  true, NOW()),

-- Course 6: Français 4ème AM – Intensif (BEM) → 2 groupes
(8,  6, 'Intensif Matin',       'Salle 02', 'saturday',  '08:00:00', '10:30:00', '2026-03-07', 'weekly', 16, 4, 0, true,  true, NOW()),
(9,  6, 'Intensif Soir',        'Salle 02', 'sunday',    '16:00:00', '18:30:00', '2026-03-08', 'weekly', 16, 4, 0, false, true, NOW()),

-- Course 7: Anglais 1ère AM → 1 groupe
(10, 7, 'Groupe Débutants',     'Salle 06', 'wednesday', '14:00:00', '15:30:00', '2025-09-10', 'weekly', 32, 2, 0, true,  true, NOW()),

-- Course 8: Maths 2ème AS → 2 groupes
(11, 8, 'Section A',            'Salle 07', 'monday',    '16:00:00', '18:30:00', '2025-09-15', 'weekly', 32, 2, 0, true,  true, NOW()),
(12, 8, 'Section B',            'Salle 07', 'thursday',  '16:00:00', '18:30:00', '2025-09-11', 'weekly', 32, 2, 0, true,  true, NOW()),

-- Course 9: Physique 1ère AS → 1 groupe
(13, 9, 'Groupe Sciences',      'Salle 05', 'saturday',  '14:00:00', '16:30:00', '2025-09-13', 'weekly', 32, 2, 0, true,  true, NOW()),

-- Course 10: Philo BAC Lettres → 1 groupe
(14,10, 'Terminales Lettres',   'Salle 08', 'friday',    '14:00:00', '16:00:00', '2025-09-12', 'weekly', 32, 2, 0, true,  true, NOW()),

-- Course 11: Anglais Avancé → 1 groupe
(15,11, 'Advanced Group',       'Salle 06', 'sunday',    '10:00:00', '12:00:00', '2025-09-14', 'weekly', 32, 2, 0, true,  true, NOW());

SELECT setval('groups_id_seq', 30);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. GROUP_STUDENTS — 20 students enrolled across groups
-- payment_status: paid | pending | overdue
-- status:         active | inactive | suspended
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO group_students (group_id, student_id, enrollment_date, payment_status, last_payment_date, status) VALUES

-- ── Groupe 1: Maths 4P – Matin (max 15) ─────────────────────────────────────
(1, 10, '2025-09-13', 'paid',    '2025-04-01', 'active'),
(1, 11, '2025-09-13', 'paid',    '2025-04-01', 'active'),
(1, 12, '2025-09-13', 'pending', NULL,          'active'),
(1, 13, '2025-09-13', 'paid',    '2025-03-28', 'active'),
(1, 14, '2025-09-13', 'overdue', NULL,          'active'),   -- impayé depuis longtemps
(1, 17, '2025-10-01', 'paid',    '2025-04-05', 'active'),
(1, 23, '2025-10-15', 'pending', NULL,          'active'),

-- ── Groupe 2: Maths 4P – Après-midi (max 15) ────────────────────────────────
(2, 15, '2025-09-11', 'paid',    '2025-04-01', 'active'),
(2, 16, '2025-09-11', 'paid',    '2025-04-01', 'active'),
(2, 25, '2025-09-11', 'pending', NULL,          'active'),

-- ── Groupe 3: Arabe 3P ───────────────────────────────────────────────────────
(3, 17, '2025-09-10', 'paid',    '2025-04-02', 'active'),   -- student 17 in 2 courses
(3, 28, '2025-09-10', 'paid',    '2025-04-02', 'active'),
(3, 29, '2025-09-10', 'overdue', NULL,          'suspended'), -- suspendu

-- ── Groupe 5: Maths 2AM – Matin ─────────────────────────────────────────────
(5, 18, '2025-09-15', 'paid',    '2025-04-01', 'active'),
(5, 19, '2025-09-15', 'paid',    '2025-04-01', 'active'),
(5, 20, '2025-09-15', 'pending', NULL,          'active'),
(5, 22, '2025-09-15', 'paid',    '2025-03-30', 'active'),

-- ── Groupe 6: Maths 2AM – Soir ──────────────────────────────────────────────
(6, 21, '2025-09-16', 'paid',    '2025-04-01', 'active'),
(6, 26, '2025-09-16', 'overdue', NULL,          'active'),

-- ── Groupe 7: Physique 3AM ───────────────────────────────────────────────────
(7, 13, '2025-09-12', 'paid',    '2025-04-03', 'active'),   -- student 13 in 2 courses
(7, 24, '2025-09-12', 'paid',    '2025-04-03', 'active'),
(7, 27, '2025-09-12', 'pending', NULL,          'active'),

-- ── Groupe 8: Français 4AM – Intensif Matin ─────────────────────────────────
(8, 29, '2026-03-07', 'paid',    '2026-03-07', 'active'),   -- student 29 réactivé
(8, 22, '2026-03-07', 'paid',    '2026-03-07', 'active'),   -- student 22 in 2 courses

-- ── Groupe 11: Maths 2AS – Section A ────────────────────────────────────────
(11, 18, '2025-09-15', 'paid',   '2025-04-01', 'active'),   -- student 18 in 2 courses
(11, 16, '2025-09-15', 'paid',   '2025-04-01', 'active'),

-- ── Groupe 13: Physique 1AS ──────────────────────────────────────────────────
(13, 20, '2025-09-13', 'overdue', NULL,         'inactive'), -- inactif
(13, 26, '2025-09-13', 'paid',    '2025-04-05', 'active'),

-- ── Groupe 14: Philo BAC ─────────────────────────────────────────────────────
(14, 27, '2025-09-12', 'paid',    '2025-04-01', 'active'),
(14, 28, '2025-09-12', 'paid',    '2025-04-01', 'active'),

-- ── Groupe 15: Anglais Avancé ────────────────────────────────────────────────
(15, 29, '2025-09-14', 'paid',    '2025-04-02', 'active'),
(15, 25, '2025-09-14', 'pending', NULL,          'active');


-- ─── Update current_students count ──────────────────────────────────────────
UPDATE groups g
SET current_students = (
  SELECT COUNT(*) FROM group_students gs
  WHERE gs.group_id = g.id AND gs.status = 'active'
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. PARENT — STUDENT LINKS
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO parent_students (parent_id, student_id) VALUES
(50, 10),   -- Abdelkader → Amine
(51, 11),   -- Houria → Rania
(52, 14),   -- Rachid → Sami
(53, 17),   -- Nadia → Lina
(54, 18),   -- Salim → Khaled
(50, 12);   -- Abdelkader also has Ilyas (2 kids same parent)


-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. SESSION SCHEDULE — sample manual sessions for intensive groups
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO session_schedule (group_id, session_number, session_date, start_time, end_time, is_cancelled) VALUES
-- Groupe 4: Stage Intensif 5P Juin 2026
(4,  1, '2026-06-15', '09:00:00', '11:00:00', false),
(4,  2, '2026-06-17', '09:00:00', '11:00:00', false),
(4,  3, '2026-06-19', '09:00:00', '11:00:00', false),
(4,  4, '2026-06-22', '09:00:00', '11:00:00', false),
(4,  5, '2026-06-24', '09:00:00', '11:00:00', false),
(4,  6, '2026-06-26', '09:00:00', '11:00:00', true),  -- annulée (férié)
(4,  7, '2026-06-29', '09:00:00', '11:00:00', false),

-- Groupe 8: Intensif BEM Français – Avril/Mai 2026
(8,  1, '2026-04-05', '08:00:00', '10:30:00', false),
(8,  2, '2026-04-12', '08:00:00', '10:30:00', false),
(8,  3, '2026-04-19', '08:00:00', '10:30:00', false),
(8,  4, '2026-04-26', '08:00:00', '10:30:00', false),
(8,  5, '2026-05-03', '08:00:00', '10:30:00', false),
(8,  6, '2026-05-10', '08:00:00', '10:30:00', true),  -- annulée
(8,  7, '2026-05-17', '08:00:00', '10:30:00', false);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. NOTIFICATIONS — welcome messages
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO notifications (user_id, notif_key, message, type, is_read, created_at) VALUES
(1,  'welcome_admin_seed',   'مرحباً بك في لوحة الإدارة يا كريم! البيانات التجريبية جاهزة.', 'welcome', false, NOW()),

(2,  'welcome_teacher_2',    'مرحباً أستاذ محمد بنعلي! تم تعيينك في 3 مواد: رياضيات.', 'welcome', false, NOW()),
(3,  'welcome_teacher_3',    'مرحباً أستاذة فاطمة حداد! تم تعيينك في مادتي العربية والفلسفة.', 'welcome', false, NOW()),
(4,  'welcome_teacher_4',    'مرحباً أستاذ يوسف مبارك! تم تعيينك في الفيزياء.', 'welcome', false, NOW()),
(5,  'welcome_teacher_5',    'مرحباً أستاذة سميرة والي! تم تعيينك في مادة الإنجليزية.', 'welcome', false, NOW()),

(10, 'welcome_student_10',   'مرحباً أمين! أنت مسجّل في رياضيات 4 ابتدائي. حصتك كل سبت 9:00.', 'welcome', false, NOW()),
(11, 'welcome_student_11',   'مرحباً رانيا! أنت مسجّلة في رياضيات 4 ابتدائي.', 'welcome', false, NOW()),
(14, 'notif_overdue_14',     '⚠️ لم يتم تسديد قسط شهر أبريل لمادة الرياضيات. يرجى التواصل مع الإدارة.', 'warning', false, NOW()),
(18, 'welcome_student_18',   'مرحباً خالد! أنت مسجّل في مادتين هذا الموسم.', 'welcome', false, NOW()),
(29, 'notif_suspended_29',   '⚠️ تم تعليق تسجيلك في مادة اللغة العربية بسبب التأخر في الدفع. تواصل مع الإدارة.', 'warning', false, NOW()),

(50, 'welcome_parent_50',    'مرحباً! يمكنك متابعة أبنائك أمين وإلياس من خلال لوحة الأولياء.', 'welcome', false, NOW()),
(51, 'welcome_parent_51',    'مرحباً! يمكنك متابعة ابنتك رانيا من خلال لوحة الأولياء.', 'welcome', false, NOW());


-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. FAVORITES — some students saved courses
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO favorites (user_id, course_id) VALUES
(10, 4),   -- Amine also likes Maths 2AM
(18, 8),   -- Khaled favorited Maths 2AS
(22, 6),   -- Adel favorited Français BEM
(15, 7);   -- Yasmine favorited Anglais 1AM


-- ═══════════════════════════════════════════════════════════════════════════════
-- ✅ DONE — seed data inserted successfully
-- ═══════════════════════════════════════════════════════════════════════════════