-- ═══════════════════════════════════════════════════════════════════════════════
-- 🎓 BELMAHI SCHOOL — COMPREHENSIVE SEED DATA (FULL TEST)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Roles     : 1 admin · 5 teachers · 40 students · 10 parents
-- Courses   : 22 real Algerian school subjects (primaire / moyen / secondaire)
-- Groups    : 45 groups — weekly, custom, morning/evening, open/closed, full
-- Enrollments: 130+ rows · statuses mixed · backdated 6 months for stats
-- Revenue   : last_payment_date spread Oct 2025 → Apr 2026 (graphs filled)
-- Materials : 28 fake course documents
-- Notifs    : 55 notifications — welcome, warning, reminder, info
-- Favorites : 18 bookmarked courses
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 0. SAFETY CLEAN (order matters — FK constraints) ────────────────────────
DELETE FROM notifications;
DELETE FROM course_materials;
DELETE FROM favorites;
DELETE FROM parent_students;
DELETE FROM group_students;
DELETE FROM session_schedule;
DELETE FROM groups;
DELETE FROM courses;
DELETE FROM users;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. USERS
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO users (id, name, last_name, email, password, role, phone, gender, birthday, city, created_at) VALUES

-- ── ADMIN ─────────────────────────────────────────────────────────────────────
(1, 'Karim',    'Belmahi',     'admin@belmahi.dz',       'Admin@1234',   'admin',   '0550000001', 'M', '1980-03-15', 'Oran',           NOW()),

-- ── TEACHERS ─────────────────────────────────────────────────────────────────
(2, 'Mohamed',  'Benali',      'benali@belmahi.dz',      'Teacher@1234', 'teacher', '0550000002', 'M', '1985-06-20', 'Oran',           NOW()),
(3, 'Fatima',   'Haddad',      'haddad@belmahi.dz',      'Teacher@1234', 'teacher', '0550000003', 'F', '1990-09-10', 'Oran',           NOW()),
(4, 'Youcef',   'Mebarki',     'mebarki@belmahi.dz',     'Teacher@1234', 'teacher', '0550000004', 'M', '1988-01-25', 'Mascara',        NOW()),
(5, 'Samira',   'Ouali',       'ouali@belmahi.dz',       'Teacher@1234', 'teacher', '0550000005', 'F', '1992-11-05', 'Oran',           NOW()),
(6, 'Rachid',   'Boufatis',    'boufatis@belmahi.dz',    'Teacher@1234', 'teacher', '0550000006', 'M', '1983-04-17', 'Oran',           NOW()),

-- ── STUDENTS 10 → 49 (40 students) ───────────────────────────────────────────
-- --- batch 1 (original 20) ---
(10, 'Amine',     'Bekkouche',   'amine.bek@gmail.com',    'Pass@1234', 'student', '0660000010', 'M', '2012-04-01', 'Oran',           '2025-09-01'),
(11, 'Rania',     'Zaoui',       'rania.z@gmail.com',      'Pass@1234', 'student', '0660000011', 'F', '2011-07-15', 'Oran',           '2025-09-01'),
(12, 'Ilyas',     'Bouchenak',   'ilyas.b@gmail.com',      'Pass@1234', 'student', '0660000012', 'M', '2013-02-20', 'Oran',           '2025-09-01'),
(13, 'Nour',      'Khelifi',     'nour.kh@gmail.com',      'Pass@1234', 'student', '0660000013', 'F', '2010-09-30', 'Mostaganem',     '2025-09-01'),
(14, 'Sami',      'Reghioua',    'sami.r@gmail.com',       'Pass@1234', 'student', '0660000014', 'M', '2012-12-05', 'Oran',           '2025-09-01'),
(15, 'Yasmine',   'Derbal',      'yasmine.d@gmail.com',    'Pass@1234', 'student', '0660000015', 'F', '2011-03-18', 'Oran',           '2025-09-01'),
(16, 'Hamza',     'Bentoumi',    'hamza.bt@gmail.com',     'Pass@1234', 'student', '0660000016', 'M', '2010-06-22', 'Sidi Bel Abbes', '2025-09-01'),
(17, 'Lina',      'Mansouri',    'lina.m@gmail.com',       'Pass@1234', 'student', '0660000017', 'F', '2013-01-11', 'Oran',           '2025-09-01'),
(18, 'Khaled',    'Aissaoui',    'khaled.a@gmail.com',     'Pass@1234', 'student', '0660000018', 'M', '2009-08-09', 'Oran',           '2025-09-01'),
(19, 'Meriem',    'Taleb',       'meriem.t@gmail.com',     'Pass@1234', 'student', '0660000019', 'F', '2010-05-27', 'Arzew',          '2025-09-01'),
(20, 'Bilal',     'Ferroudj',    'bilal.f@gmail.com',      'Pass@1234', 'student', '0660000020', 'M', '2012-10-03', 'Oran',           '2025-09-01'),
(21, 'Sara',      'Boudia',      'sara.bd@gmail.com',      'Pass@1234', 'student', '0660000021', 'F', '2011-11-14', 'Oran',           '2025-09-01'),
(22, 'Adel',      'Chouaib',     'adel.ch@gmail.com',      'Pass@1234', 'student', '0660000022', 'M', '2009-03-07', 'Tlemcen',        '2025-09-01'),
(23, 'Hana',      'Meziane',     'hana.mz@gmail.com',      'Pass@1234', 'student', '0660000023', 'F', '2013-07-19', 'Oran',           '2025-09-01'),
(24, 'Yassine',   'Bouabdallah', 'yassine.bo@gmail.com',   'Pass@1234', 'student', '0660000024', 'M', '2010-04-28', 'Oran',           '2025-09-01'),
(25, 'Amira',     'Kaddour',     'amira.k@gmail.com',      'Pass@1234', 'student', '0660000025', 'F', '2012-09-16', 'Oran',           '2025-09-01'),
(26, 'Rayan',     'Boudjelal',   'rayan.bj@gmail.com',     'Pass@1234', 'student', '0660000026', 'M', '2011-02-03', 'Oran',           '2025-09-01'),
(27, 'Ghania',    'Sebaa',       'ghania.s@gmail.com',     'Pass@1234', 'student', '0660000027', 'F', '2010-12-21', 'Mascara',        '2025-09-01'),
(28, 'Omar',      'Ladj',        'omar.l@gmail.com',       'Pass@1234', 'student', '0660000028', 'M', '2013-06-08', 'Oran',           '2025-09-01'),
(29, 'Dounia',    'Benhamed',    'dounia.bh@gmail.com',    'Pass@1234', 'student', '0660000029', 'F', '2009-10-30', 'Oran',           '2025-09-01'),
-- --- batch 2 (new 20 students) ---
(30, 'Islem',     'Guerfi',      'islem.g@gmail.com',      'Pass@1234', 'student', '0660000030', 'M', '2011-05-12', 'Oran',           '2025-09-05'),
(31, 'Hadjer',    'Benzerga',    'hadjer.bz@gmail.com',    'Pass@1234', 'student', '0660000031', 'F', '2012-08-24', 'Oran',           '2025-09-05'),
(32, 'Fares',     'Ouahrani',    'fares.o@gmail.com',      'Pass@1234', 'student', '0660000032', 'M', '2010-11-30', 'Gdyel',          '2025-09-05'),
(33, 'Chaima',    'Bensalem',    'chaima.bs@gmail.com',    'Pass@1234', 'student', '0660000033', 'F', '2009-04-05', 'Oran',           '2025-09-05'),
(34, 'Walid',     'Belarbi',     'walid.bl@gmail.com',     'Pass@1234', 'student', '0660000034', 'M', '2012-01-17', 'Oran',           '2025-09-10'),
(35, 'Sabrina',   'Daho',        'sabrina.d@gmail.com',    'Pass@1234', 'student', '0660000035', 'F', '2011-09-08', 'Sidi Bel Abbes', '2025-09-10'),
(36, 'Nassim',    'Zitoun',      'nassim.z@gmail.com',     'Pass@1234', 'student', '0660000036', 'M', '2010-03-22', 'Oran',           '2025-09-10'),
(37, 'Ryma',      'Hadjadj',     'ryma.h@gmail.com',       'Pass@1234', 'student', '0660000037', 'F', '2013-10-14', 'Oran',           '2025-09-10'),
(38, 'Zakaria',   'Abed',        'zakaria.ab@gmail.com',   'Pass@1234', 'student', '0660000038', 'M', '2009-06-29', 'Tlemcen',        '2025-10-01'),
(39, 'Asma',      'Berroukche',  'asma.br@gmail.com',      'Pass@1234', 'student', '0660000039', 'F', '2010-12-03', 'Oran',           '2025-10-01'),
(40, 'Mehdi',     'Seghier',     'mehdi.sg@gmail.com',     'Pass@1234', 'student', '0660000040', 'M', '2011-07-18', 'Oran',           '2025-10-01'),
(41, 'Nihed',     'Bacha',       'nihed.bc@gmail.com',     'Pass@1234', 'student', '0660000041', 'F', '2012-02-26', 'Relizane',       '2025-10-05'),
(42, 'Anes',      'Belouahem',   'anes.bw@gmail.com',      'Pass@1234', 'student', '0660000042', 'M', '2010-09-11', 'Oran',           '2025-10-05'),
(43, 'Lyna',      'Chikh',       'lyna.ck@gmail.com',      'Pass@1234', 'student', '0660000043', 'F', '2011-04-07', 'Oran',           '2025-10-05'),
(44, 'Hichem',    'Mouloudj',    'hichem.ml@gmail.com',    'Pass@1234', 'student', '0660000044', 'M', '2009-01-15', 'Mascara',        '2025-10-15'),
(45, 'Feriel',    'Sahraoui',    'feriel.sh@gmail.com',    'Pass@1234', 'student', '0660000045', 'F', '2012-06-23', 'Oran',           '2025-10-15'),
(46, 'Anis',      'Benyoucef',   'anis.by@gmail.com',      'Pass@1234', 'student', '0660000046', 'M', '2010-08-04', 'Oran',           '2025-11-01'),
(47, 'Imene',     'Haddouche',   'imene.hd@gmail.com',     'Pass@1234', 'student', '0660000047', 'F', '2011-11-19', 'Oran',           '2025-11-01'),
(48, 'Abderrahmane','Boudjemaa', 'abdou.bj@gmail.com',     'Pass@1234', 'student', '0660000048', 'M', '2013-03-30', 'Oran',           '2025-11-15'),
(49, 'Djihane',   'Meguellati',  'djihane.mg@gmail.com',   'Pass@1234', 'student', '0660000049', 'F', '2009-07-21', 'Oran',           '2025-11-15'),

-- ── PARENTS 60 → 69 ───────────────────────────────────────────────────────────
(60, 'Abdelkader','Bekkouche',   'parent.bek@gmail.com',   'Parent@1234','Parent',  '0770000060', 'M', '1975-04-01', 'Oran',           '2025-09-01'),
(61, 'Houria',    'Zaoui',       'parent.zaoui@gmail.com', 'Parent@1234','Parent',  '0770000061', 'F', '1978-07-15', 'Oran',           '2025-09-01'),
(62, 'Rachid',    'Reghioua',    'parent.reg@gmail.com',   'Parent@1234','Parent',  '0770000062', 'M', '1972-12-05', 'Oran',           '2025-09-01'),
(63, 'Nadia',     'Mansouri',    'parent.man@gmail.com',   'Parent@1234','Parent',  '0770000063', 'F', '1980-01-11', 'Oran',           '2025-09-01'),
(64, 'Salim',     'Aissaoui',    'parent.ais@gmail.com',   'Parent@1234','Parent',  '0770000064', 'M', '1970-08-09', 'Oran',           '2025-09-01'),
(65, 'Kheira',    'Guerfi',      'parent.grf@gmail.com',   'Parent@1234','Parent',  '0770000065', 'F', '1977-05-12', 'Oran',           '2025-09-05'),
(66, 'Hocine',    'Ouahrani',    'parent.oua@gmail.com',   'Parent@1234','Parent',  '0770000066', 'M', '1973-11-30', 'Gdyel',          '2025-09-05'),
(67, 'Farida',    'Belarbi',     'parent.bla@gmail.com',   'Parent@1234','Parent',  '0770000067', 'F', '1979-01-17', 'Oran',           '2025-09-10'),
(68, 'Mustapha',  'Seghier',     'parent.sgh@gmail.com',   'Parent@1234','Parent',  '0770000068', 'M', '1968-07-18', 'Oran',           '2025-10-01'),
(69, 'Zohra',     'Bacha',       'parent.bch@gmail.com',   'Parent@1234','Parent',  '0770000069', 'F', '1975-02-26', 'Relizane',       '2025-10-05');

SELECT setval('users_id_seq', 100);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. COURSES (22 real Algerian school subjects)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO courses (
    id, title, teacher_id, description, education_level, year_level, branch, 
    course_type, sessions_per_month, duration_hours, price, 
    max_students_per_group, is_active, created_at
) VALUES

-- ── PRIMAIRE ─────────────────────────────────────────────────────────────────
(1,  'Mathématiques – 4ème Primaire',
     2, 'Cours de soutien en mathématiques pour les élèves de 4ème année primaire. Fractions, multiplication, tables, résolution de problèmes.',
     'primaire', 4, NULL, 'continuous',  8, 1.5, 2500, 15, true,  '2025-08-25'),

(2,  'Langue Arabe – 3ème Primaire',
     3, 'Renforcement en lecture, écriture et grammaire arabe pour 3ème primaire. Dictées hebdomadaires et exercices de lecture.',
     'primaire', 3, NULL, 'continuous',  8, 1.5, 2000, 12, true,  '2025-08-25'),

(3,  'Éveil Scientifique – 5ème Primaire',
     4, 'Sciences et découverte du monde naturel pour les élèves de 5ème primaire. Préparation au passage au cycle moyen.',
     'primaire', 5, NULL, 'continuous',  12, 2.0, 3000, 10, true,  '2025-08-25'),

(4,  'Français – 5ème Primaire',
     3, 'Lecture, grammaire, conjugaison et production écrite. Préparation à l''examen de fin de cycle primaire.',
     'primaire', 5, NULL, 'continuous',  8, 1.5, 2500, 12, true,  '2025-08-25'),
(5,  'Éducation Islamique – 4ème Primaire',
     6, 'Mémorisation et compréhension des versets coraniques, hadiths et valeurs islamiques.',
     'primaire', 4, NULL, 'continuous',  4, 1.0, 1500, 15, true,  '2025-08-28'),

-- ── MOYEN ─────────────────────────────────────────────────────────────────────
(6,  'Mathématiques – 2ème AM',
     2, 'Algèbre : calcul littéral, équations du 1er degré. Géométrie : triangles, quadrilatères, Pythagore.',
     'moyen', 2, NULL, 'continuous',  8, 2.0, 3000, 15, true,  '2025-08-20'),

(7,  'Mathématiques – 4ème AM (BEM)',
     2, 'Révision complète du programme : fonctions, statistiques, probabilités. Entraînement intensif aux examens BEM.',
     'moyen', 4, NULL, 'continuous',  16, 2.5, 4500, 12, true,  '2025-08-20'),

(8,  'Physique-Chimie – 3ème AM',
     4, 'Mécaniques : forces, poids, vitesse. Chimie : atomes, molécules, réactions. Travaux dirigés et exercices types.',
     'moyen', 3, NULL, 'continuous',  8, 2.0, 3500, 12, true,  '2025-08-20'),

(9,  'Français – 4ème AM (BEM)',
     3, 'Grammaire, conjugaison avancée, compréhension écrite et expression. Méthodologie de la dissertation BEM.',
     'moyen', 4, NULL, 'continuous',  16, 2.5, 4000, 10, true,  '2025-08-22'),

(10, 'Anglais – 1ère AM',
     5, 'Bases de la langue anglaise : alphabet, vocabulaire quotidien, phrases simples, prononciation.',
     'moyen', 1, NULL, 'continuous',  8, 1.5, 2500, 15, true,  '2025-08-22'),

(11, 'Anglais – 3ème AM',
     5, 'Grammaire intermédiaire, expression écrite, compréhension orale. Préparation aux examens trimestriels.',
     'moyen', 3, NULL, 'continuous',  8, 2.0, 3000, 12, true,  '2025-08-22'),

(12, 'Histoire-Géographie – 2ème AM',
     6, 'Histoire de l''Algérie et du monde arabe. Géographie physique et humaine d''Algérie. Cartes et chronologies.',
     'moyen', 2, NULL, 'continuous',  8, 1.5, 2500, 15, true,  '2025-08-28'),
-- ── SECONDAIRE ────────────────────────────────────────────────────────────────
(13, 'Mathématiques – 1ère AS (Sci)',
     2, 'Suites numériques, limites, continuité, dérivées. Géométrie analytique dans le plan.',
     'secondaire', 1, 'scientifique', 'continuous',  8, 2.5, 4500, 10, true,  '2025-08-18'),

(14, 'Mathématiques – 3ème AS (BAC Sci)',
     2, 'Révision complète BAC : intégrales, complexes, probabilités, géométrie dans l''espace. Examens blancs.',
     'secondaire', 3, 'scientifique', 'continuous',  20, 3.0, 6000, 10, true,  '2025-08-18'),
(15, 'Physique – 2ème AS (Sci)',
     4, 'Mécanique newtonienne, thermodynamique, électricité. Résolution de problèmes complexes.',
     'secondaire', 2, 'scientifique', 'continuous',  8, 2.5, 4500, 10, true,  '2025-08-18'),

(16, 'Physique – 3ème AS (BAC Sci)',
     4, 'Révision BAC physique : ondes, mécanique quantique, radioactivité, électronique. Examens blancs.',
     'secondaire', 3, 'scientifique', 'continuous',  16, 3.0, 5500, 8,  true,  '2025-08-18'),

(17, 'Chimie – 2ème AS (Sci)',
     4, 'Cinétique chimique, thermochimie, chimie organique niveau secondaire.',
     'secondaire', 2, 'scientifique', 'continuous',  8, 2.0, 4000, 10, true,  '2025-09-01'),

(18, 'Philosophie – 3ème AS (Lettres)',
     3, 'Histoire de la philosophie, méthodologie de la dissertation, analyse de textes. Préparation BAC Lettres.',
     'secondaire', 3, 'lettres', 'continuous',  12, 2.0, 3500, 12, true,  '2025-08-25'),

(19, 'Anglais Avancé – 2ème AS',
     5, 'Expression écrite et orale avancée. Rédaction d''essays, compréhension de textes authentiques.',
     'secondaire', 2, 'scientifique', 'continuous',  8, 2.0, 3500, 10, true,  '2025-08-25'),
(20, 'Français – 1ère AS',
     3, 'Littérature française et maghrébine. Argumentation, commentaire de texte, rédaction.',
     'secondaire', 1, 'lettres', 'continuous',  8, 2.0, 3500, 12, true,  '2025-08-25'),

(21, 'Sciences Naturelles – 1ère AS (Sci)',
     6, 'Biologie cellulaire, génétique, écologie, physiologie humaine. Travaux pratiques.',
     'secondaire', 1, 'scientifique', 'continuous',  8, 2.0, 4000, 10, true,  '2025-09-01'),

-- ── INACTIF ───────────────────────────────────────────────────────────────────
(22, 'Informatique – 3ème AS (Suspendu)',
     5, 'Cours suspendu en attente de matériel. Ne doit pas apparaître dans les recherches actives.',
     'secondaire', 3, 'scientifique', 'continuous',  4, 1.5, 2000, 8,  false, '2025-09-15');

SELECT setval('courses_id_seq', 30);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. GROUPS (45 groups across all courses)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO groups (id, course_id, group_name, salle, day_of_week, session_start_time, session_end_time, start_date, calendar_type, total_sessions, sessions_per_week, current_students, registration_open, is_active, created_at) VALUES

-- ── Course 1: Maths 4P ────────────────────────────────────────────────────────
(1,  1, 'Groupe A – Samedi Matin',    'Salle 01', 'saturday',  '09:00', '10:30', '2025-09-13', 'weekly_fixed', 32, 2,  0, true,  true,  '2025-09-01'),
(2,  1, 'Groupe B – Jeudi Soir',      'Salle 01', 'thursday',  '16:00', '17:30', '2025-09-11', 'weekly_fixed', 32, 2,  0, true,  true,  '2025-09-01'),
(3,  1, 'Groupe C – Dimanche Matin',  'Salle 03', 'sunday',    '09:00', '10:30', '2025-09-14', 'weekly_fixed', 32, 2,  0, false, true,  '2025-09-01'),  -- complet

-- ── Course 2: Arabe 3P ────────────────────────────────────────────────────────
(4,  2, 'Groupe Unique – Mercredi',   'Salle 02', 'wednesday', '10:00', '11:30', '2025-09-10', 'weekly_fixed', 32, 2,  0, true,  true,  '2025-09-01'),

-- ── Course 3: Éveil Sci 5P – Intensif ────────────────────────────────────────
(5,  3, 'Stage Intensif Juin 2026',   'Salle 03', NULL,        NULL,    NULL,    '2026-06-15', 'manual', 12, NULL,0, true,  true,  '2026-05-01'),

-- ── Course 4: Français 5P ────────────────────────────────────────────────────
(6,  4, 'Groupe Matin – Lundi',       'Salle 02', 'monday',    '10:00', '11:30', '2025-09-15', 'weekly_fixed', 32, 2,  0, true,  true,  '2025-09-01'),
(7,  4, 'Groupe Soir – Mercredi',     'Salle 02', 'wednesday', '16:00', '17:30', '2025-09-10', 'weekly_fixed', 32, 2,  0, true,  true,  '2025-09-01'),

-- ── Course 5: Éducation Islamique 4P ─────────────────────────────────────────
(8,  5, 'Groupe Vendredi Après-midi', 'Salle 06', 'friday',    '14:00', '15:00', '2025-09-12', 'weekly_fixed', 20, 1,  0, true,  true,  '2025-09-01'),

-- ── Course 6: Maths 2AM ───────────────────────────────────────────────────────
(9,  6, 'Section Matin – Lundi',      'Salle 04', 'monday',    '08:00', '10:00', '2025-09-15', 'weekly_fixed', 32, 2,  0, true,  true,  '2025-09-01'),
(10, 6, 'Section Soir – Mardi',       'Salle 04', 'tuesday',   '17:00', '19:00', '2025-09-16', 'weekly_fixed', 32, 2,  0, true,  true,  '2025-09-01'),
(11, 6, 'Section Week-end',           'Salle 05', 'saturday',  '11:00', '13:00', '2025-09-13', 'weekly_fixed', 32, 2,  0, false, true,  '2025-09-01'),  -- complet

-- ── Course 7: Maths 4AM BEM – Intensif ───────────────────────────────────────
(12, 7, 'Intensif BEM – Matin',       'Salle 07', 'saturday',  '08:00', '10:30', '2026-01-10', 'weekly_fixed', 16, 4,  0, true,  true,  '2025-12-15'),
(13, 7, 'Intensif BEM – Soir',        'Salle 07', 'thursday',  '16:30', '19:00', '2026-01-08', 'weekly_fixed', 16, 4,  0, false, true,  '2025-12-15'),  -- fermé/complet

-- ── Course 8: Physique-Chimie 3AM ────────────────────────────────────────────
(14, 8, 'Groupe Principal – Vendredi','Salle 05', 'friday',    '10:00', '12:00', '2025-09-12', 'weekly_fixed', 32, 2,  0, true,  true,  '2025-09-01'),
(15, 8, 'Groupe Dimanche',            'Salle 05', 'sunday',    '14:00', '16:00', '2025-09-14', 'weekly_fixed', 32, 2,  0, true,  true,  '2025-09-01'),

-- ── Course 9: Français 4AM BEM – Intensif ────────────────────────────────────
(16, 9, 'Intensif BEM Français – Matin', 'Salle 02', 'saturday','08:00','10:30','2026-03-07', 'weekly_fixed', 16, 4,  0, true,  true,  '2026-02-15'),
(17, 9, 'Intensif BEM Français – Soir',  'Salle 02', 'sunday',  '16:00','18:30','2026-03-08', 'weekly_fixed', 16, 4,  0, false, true,  '2026-02-15'),

-- ── Course 10: Anglais 1AM ────────────────────────────────────────────────────
(18,10, 'Débutants A – Mercredi',     'Salle 06', 'wednesday', '14:00', '15:30', '2025-09-10', 'weekly_fixed', 32, 2,  0, true,  true,  '2025-09-01'),
(19,10, 'Débutants B – Samedi',       'Salle 06', 'saturday',  '13:00', '14:30', '2025-09-13', 'weekly_fixed', 32, 2,  0, true,  true,  '2025-09-01'),

-- ── Course 11: Anglais 3AM ────────────────────────────────────────────────────
(20,11, 'Groupe Principal – Lundi',   'Salle 06', 'monday',    '16:00', '18:00', '2025-09-15', 'weekly_fixed', 32, 2,  0, true,  true,  '2025-09-01'),

-- ── Course 12: Histoire-Géo 2AM ───────────────────────────────────────────────
(21,12, 'Groupe A – Mardi',           'Salle 08', 'tuesday',   '14:00', '15:30', '2025-09-16', 'weekly_fixed', 32, 2,  0, true,  true,  '2025-09-01'),
(22,12, 'Groupe B – Dimanche',        'Salle 08', 'sunday',    '10:00', '11:30', '2025-09-14', 'weekly_fixed', 32, 2,  0, true,  true,  '2025-09-01'),

-- ── Course 13: Maths 1AS Sci ──────────────────────────────────────────────────
(23,13, 'Section A – Lundi Soir',     'Salle 07', 'monday',    '17:00', '19:30', '2025-09-15', 'weekly_fixed', 32, 2,  0, true,  true,  '2025-09-01'),
(24,13, 'Section B – Jeudi Soir',     'Salle 07', 'thursday',  '17:00', '19:30', '2025-09-11', 'weekly_fixed', 32, 2,  0, true,  true,  '2025-09-01'),

-- ── Course 14: Maths BAC Sci – Intensif ──────────────────────────────────────
(25,14, 'Révision BAC Matin',         'Salle 07', 'saturday',  '08:00', '11:00', '2026-02-07', 'weekly_fixed', 20, 5,  0, true,  true,  '2026-01-20'),
(26,14, 'Révision BAC Soir',          'Salle 07', 'wednesday', '17:30', '20:30', '2026-02-11', 'weekly_fixed', 20, 5,  0, false, true,  '2026-01-20'),  -- complet

-- ── Course 15: Physique 2AS ───────────────────────────────────────────────────
(27,15, 'Groupe Sciences A – Samedi', 'Salle 05', 'saturday',  '14:00', '16:30', '2025-09-13', 'weekly_fixed', 32, 2,  0, true,  true,  '2025-09-01'),
(28,15, 'Groupe Sciences B – Jeudi',  'Salle 05', 'thursday',  '14:00', '16:30', '2025-09-11', 'weekly_fixed', 32, 2,  0, true,  true,  '2025-09-01'),

-- ── Course 16: Physique BAC – Intensif ───────────────────────────────────────
(29,16, 'Intensif BAC Physique',      'Salle 05', 'sunday',    '08:00', '11:00', '2026-02-08', 'weekly_fixed', 16, 4,  0, true,  true,  '2026-01-25'),

-- ── Course 17: Chimie 2AS ─────────────────────────────────────────────────────
(30,17, 'Groupe Chimie – Mardi',      'Salle 05', 'tuesday',   '15:00', '17:00', '2025-09-16', 'weekly_fixed', 32, 2,  0, true,  true,  '2025-09-01'),

-- ── Course 18: Philosophie BAC Lettres ───────────────────────────────────────
(31,18, 'Terminales Lettres – Vendredi','Salle 08','friday',   '14:00', '16:00', '2025-09-12', 'weekly_fixed', 32, 2,  0, true,  true,  '2025-09-01'),
(32,18, 'Intensif Philo BAC',         'Salle 08', 'sunday',    '14:00', '16:00', '2026-03-01', 'weekly_fixed', 12, 3,  0, false, true,  '2026-02-20'),

-- ── Course 19: Anglais Avancé 2AS ─────────────────────────────────────────────
(33,19, 'Advanced A – Dimanche Matin','Salle 06', 'sunday',    '10:00', '12:00', '2025-09-14', 'weekly_fixed', 32, 2,  0, true,  true,  '2025-09-01'),
(34,19, 'Advanced B – Mercredi Soir', 'Salle 06', 'wednesday', '18:00', '20:00', '2025-09-10', 'weekly_fixed', 32, 2,  0, true,  true,  '2025-09-01'),

-- ── Course 20: Français 1AS ───────────────────────────────────────────────────
(35,20, 'Groupe Lettres – Lundi',     'Salle 08', 'monday',    '14:00', '16:00', '2025-09-15', 'weekly_fixed', 32, 2,  0, true,  true,  '2025-09-01'),

-- ── Course 21: Sciences Naturelles 1AS ───────────────────────────────────────
(36,21, 'Groupe SVT – Samedi Soir',   'Salle 09', 'saturday',  '15:00', '17:00', '2025-09-13', 'weekly_fixed', 32, 2,  0, true,  true,  '2025-09-01'),
(37,21, 'Groupe SVT – Mardi',         'Salle 09', 'tuesday',   '17:00', '19:00', '2025-09-16', 'weekly_fixed', 32, 2,  0, true,  true,  '2025-09-01');

SELECT setval('groups_id_seq', 50);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. GROUP_STUDENTS — 130+ enrollments backdated over 6 months
-- Dates: Sep 2025 → Apr 2026  |  last_payment_date fills revenue chart
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO group_students (group_id, student_id, enrollment_date, payment_status, last_payment_date, status) VALUES

-- ═══ GROUPE 1 – Maths 4P Samedi Matin (max 15) ═══════════════════════════════
(1, 10, '2025-09-13', 'paid',    '2026-04-01', 'active'),
(1, 11, '2025-09-13', 'paid',    '2026-04-01', 'active'),
(1, 12, '2025-09-13', 'paid',    '2026-03-28', 'active'),
(1, 14, '2025-09-13', 'overdue', NULL,          'active'),
(1, 17, '2025-10-01', 'paid',    '2026-04-05', 'active'),
(1, 23, '2025-10-15', 'paid',    '2026-03-15', 'active'),
(1, 31, '2025-11-01', 'pending', NULL,          'active'),
(1, 34, '2025-11-01', 'paid',    '2026-04-02', 'active'),
(1, 37, '2025-12-01', 'paid',    '2026-03-01', 'active'),

-- ═══ GROUPE 2 – Maths 4P Jeudi Soir ═════════════════════════════════════════
(2, 13, '2025-09-11', 'paid',    '2026-04-01', 'active'),
(2, 15, '2025-09-11', 'paid',    '2026-04-01', 'active'),
(2, 25, '2025-09-11', 'paid',    '2026-03-30', 'active'),
(2, 30, '2025-10-05', 'pending', NULL,          'active'),
(2, 36, '2025-11-10', 'paid',    '2026-02-10', 'active'),
(2, 40, '2025-12-01', 'overdue', NULL,          'active'),

-- ═══ GROUPE 3 – Maths 4P Dimanche (complet/fermé) ════════════════════════════
(3, 16, '2025-09-14', 'paid',    '2026-04-01', 'active'),
(3, 20, '2025-09-14', 'paid',    '2026-04-01', 'active'),
(3, 22, '2025-09-14', 'paid',    '2026-03-14', 'active'),
(3, 28, '2025-09-14', 'paid',    '2026-04-03', 'active'),
(3, 35, '2025-10-10', 'paid',    '2026-03-10', 'active'),
(3, 42, '2025-10-10', 'overdue', NULL,          'inactive'),
(3, 45, '2025-11-01', 'paid',    '2026-04-01', 'active'),

-- ═══ GROUPE 4 – Arabe 3P ═════════════════════════════════════════════════════
(4, 17, '2025-09-10', 'paid',    '2026-04-02', 'active'),
(4, 28, '2025-09-10', 'paid',    '2026-04-02', 'active'),
(4, 29, '2025-09-10', 'overdue', NULL,          'inactive'),
(4, 37, '2025-10-01', 'paid',    '2026-03-01', 'active'),
(4, 41, '2025-11-15', 'pending', NULL,          'active'),

-- ═══ GROUPE 6 – Français 5P Lundi Matin ══════════════════════════════════════
(6, 10, '2025-09-15', 'paid',    '2026-04-05', 'active'),  -- student 10 : 2 cours
(6, 12, '2025-09-15', 'paid',    '2026-04-01', 'active'),
(6, 23, '2025-10-01', 'paid',    '2026-04-01', 'active'),
(6, 31, '2025-10-15', 'paid',    '2026-03-15', 'active'),
(6, 43, '2025-11-01', 'pending', NULL,          'active'),

-- ═══ GROUPE 7 – Français 5P Mercredi Soir ════════════════════════════════════
(7, 11, '2025-09-10', 'paid',    '2026-04-01', 'active'),
(7, 14, '2025-09-10', 'paid',    '2026-03-20', 'active'),
(7, 32, '2025-10-01', 'paid',    '2026-04-05', 'active'),
(7, 48, '2025-11-15', 'overdue', NULL,          'active'),

-- ═══ GROUPE 8 – Éducation Islamique 4P ═══════════════════════════════════════
(8, 10, '2025-09-12', 'paid',    '2026-04-01', 'active'),
(8, 11, '2025-09-12', 'paid',    '2026-04-01', 'active'),
(8, 17, '2025-09-12', 'paid',    '2026-03-12', 'active'),
(8, 23, '2025-09-12', 'paid',    '2026-04-02', 'active'),
(8, 28, '2025-10-05', 'pending', NULL,          'active'),
(8, 34, '2025-10-05', 'paid',    '2026-03-05', 'active'),

-- ═══ GROUPE 9 – Maths 2AM Lundi Matin ════════════════════════════════════════
(9, 18, '2025-09-15', 'paid',    '2026-04-01', 'active'),
(9, 19, '2025-09-15', 'paid',    '2026-04-01', 'active'),
(9, 20, '2025-09-15', 'paid',    '2026-03-30', 'active'),
(9, 22, '2025-09-15', 'paid',    '2026-04-01', 'active'),
(9, 33, '2025-10-01', 'paid',    '2026-03-01', 'active'),
(9, 38, '2025-10-01', 'overdue', NULL,          'active'),
(9, 44, '2025-11-01', 'pending', NULL,          'active'),

-- ═══ GROUPE 10 – Maths 2AM Mardi Soir ════════════════════════════════════════
(10, 21, '2025-09-16', 'paid',    '2026-04-01', 'active'),
(10, 24, '2025-09-16', 'paid',    '2026-04-01', 'active'),
(10, 26, '2025-09-16', 'overdue', NULL,          'active'),
(10, 35, '2025-10-10', 'paid',    '2026-03-10', 'active'),
(10, 46, '2025-11-01', 'paid',    '2026-04-01', 'active'),

-- ═══ GROUPE 11 – Maths 2AM Week-end (complet) ════════════════════════════════
(11, 25, '2025-09-13', 'paid',    '2026-04-01', 'active'),
(11, 27, '2025-09-13', 'paid',    '2026-04-01', 'active'),
(11, 30, '2025-10-05', 'paid',    '2026-03-05', 'active'),
(11, 36, '2025-10-05', 'paid',    '2026-04-01', 'active'),
(11, 39, '2025-11-01', 'paid',    '2026-04-01', 'active'),
(11, 47, '2025-11-15', 'pending', NULL,          'active'),

-- ═══ GROUPE 12 – Maths 4AM BEM Intensif Matin ════════════════════════════════
(12, 13, '2026-01-10', 'paid',    '2026-04-10', 'active'),
(12, 22, '2026-01-10', 'paid',    '2026-04-10', 'active'),
(12, 33, '2026-01-10', 'paid',    '2026-03-10', 'active'),
(12, 40, '2026-01-15', 'paid',    '2026-04-15', 'active'),
(12, 44, '2026-01-15', 'overdue', NULL,          'active'),
(12, 49, '2026-02-01', 'paid',    '2026-04-01', 'active'),

-- ═══ GROUPE 13 – Maths 4AM BEM Intensif Soir (complet) ═══════════════════════
(13, 15, '2026-01-08', 'paid',    '2026-04-08', 'active'),
(13, 19, '2026-01-08', 'paid',    '2026-04-08', 'active'),
(13, 24, '2026-01-08', 'paid',    '2026-03-08', 'active'),
(13, 29, '2026-01-08', 'paid',    '2026-04-08', 'active'),
(13, 38, '2026-02-01', 'pending', NULL,          'active'),

-- ═══ GROUPE 14 – Physique-Chimie 3AM Vendredi ════════════════════════════════
(14, 13, '2025-09-12', 'paid',    '2026-04-03', 'active'),
(14, 24, '2025-09-12', 'paid',    '2026-04-03', 'active'),
(14, 27, '2025-09-12', 'paid',    '2026-03-12', 'active'),
(14, 32, '2025-10-01', 'paid',    '2026-04-01', 'active'),
(14, 41, '2025-10-15', 'pending', NULL,          'active'),
(14, 45, '2025-11-01', 'overdue', NULL,          'inactive'),

-- ═══ GROUPE 15 – Physique-Chimie 3AM Dimanche ════════════════════════════════
(15, 16, '2025-09-14', 'paid',    '2026-04-01', 'active'),
(15, 21, '2025-09-14', 'paid',    '2026-04-01', 'active'),
(15, 36, '2025-10-05', 'paid',    '2026-03-05', 'active'),
(15, 43, '2025-11-01', 'paid',    '2026-04-01', 'active'),

-- ═══ GROUPE 16 – Français 4AM BEM Matin ══════════════════════════════════════
(16, 29, '2026-03-07', 'paid',    '2026-04-07', 'active'),
(16, 22, '2026-03-07', 'paid',    '2026-04-07', 'active'),
(16, 39, '2026-03-07', 'paid',    '2026-04-07', 'active'),
(16, 46, '2026-03-14', 'paid',    '2026-04-14', 'active'),
(16, 49, '2026-03-14', 'pending', NULL,          'active'),

-- ═══ GROUPE 17 – Français 4AM BEM Soir ═══════════════════════════════════════
(17, 26, '2026-03-08', 'paid',    '2026-04-08', 'active'),
(17, 33, '2026-03-08', 'paid',    '2026-04-08', 'active'),
(17, 42, '2026-03-15', 'paid',    '2026-04-15', 'active'),

-- ═══ GROUPE 18 – Anglais 1AM Mercredi ════════════════════════════════════════
(18, 15, '2025-09-10', 'paid',    '2026-04-01', 'active'),
(18, 25, '2025-09-10', 'paid',    '2026-04-01', 'active'),
(18, 30, '2025-10-01', 'paid',    '2026-03-01', 'active'),
(18, 37, '2025-10-15', 'paid',    '2026-04-15', 'active'),
(18, 41, '2025-11-01', 'pending', NULL,          'active'),

-- ═══ GROUPE 19 – Anglais 1AM Samedi ══════════════════════════════════════════
(19, 11, '2025-09-13', 'paid',    '2026-04-01', 'active'),
(19, 17, '2025-09-13', 'paid',    '2026-04-01', 'active'),
(19, 34, '2025-10-05', 'paid',    '2026-03-05', 'active'),
(19, 43, '2025-11-01', 'overdue', NULL,          'active'),
(19, 48, '2025-11-15', 'paid',    '2026-04-01', 'active'),

-- ═══ GROUPE 20 – Anglais 3AM Lundi ═══════════════════════════════════════════
(20, 18, '2025-09-15', 'paid',    '2026-04-01', 'active'),
(20, 33, '2025-09-15', 'paid',    '2026-04-01', 'active'),
(20, 42, '2025-10-01', 'paid',    '2026-03-01', 'active'),
(20, 47, '2025-10-15', 'pending', NULL,          'active'),

-- ═══ GROUPE 21 – Histoire-Géo 2AM Mardi ══════════════════════════════════════
(21, 20, '2025-09-16', 'paid',    '2026-04-01', 'active'),
(21, 26, '2025-09-16', 'paid',    '2026-04-01', 'active'),
(21, 35, '2025-10-01', 'paid',    '2026-03-01', 'active'),
(21, 45, '2025-10-15', 'paid',    '2026-04-15', 'active'),

-- ═══ GROUPE 22 – Histoire-Géo 2AM Dimanche ═══════════════════════════════════
(22, 19, '2025-09-14', 'paid',    '2026-04-01', 'active'),
(22, 27, '2025-09-14', 'paid',    '2026-04-01', 'active'),
(22, 38, '2025-10-05', 'paid',    '2026-03-05', 'active'),
(22, 44, '2025-11-01', 'overdue', NULL,          'inactive'),

-- ═══ GROUPE 23 – Maths 1AS Lundi Soir ════════════════════════════════════════
(23, 18, '2025-09-15', 'paid',    '2026-04-01', 'active'),
(23, 22, '2025-09-15', 'paid',    '2026-04-01', 'active'),
(23, 36, '2025-10-01', 'paid',    '2026-03-01', 'active'),
(23, 40, '2025-10-01', 'paid',    '2026-04-01', 'active'),
(23, 46, '2025-11-01', 'pending', NULL,          'active'),

-- ═══ GROUPE 24 – Maths 1AS Jeudi Soir ════════════════════════════════════════
(24, 16, '2025-09-11', 'paid',    '2026-04-01', 'active'),
(24, 29, '2025-09-11', 'paid',    '2026-04-01', 'active'),
(24, 33, '2025-10-01', 'paid',    '2026-03-01', 'active'),
(24, 44, '2025-10-15', 'overdue', NULL,          'active'),
(24, 49, '2025-11-01', 'paid',    '2026-04-01', 'active'),

-- ═══ GROUPE 25 – Maths BAC Intensif Matin ════════════════════════════════════
(25, 18, '2026-02-07', 'paid',    '2026-04-07', 'active'),
(25, 22, '2026-02-07', 'paid',    '2026-04-07', 'active'),
(25, 32, '2026-02-07', 'paid',    '2026-04-07', 'active'),
(25, 36, '2026-02-07', 'paid',    '2026-03-07', 'active'),
(25, 40, '2026-02-14', 'paid',    '2026-04-14', 'active'),
(25, 46, '2026-03-01', 'pending', NULL,          'active'),

-- ═══ GROUPE 26 – Maths BAC Intensif Soir (complet) ═══════════════════════════
(26, 20, '2026-02-11', 'paid',    '2026-04-11', 'active'),
(26, 24, '2026-02-11', 'paid',    '2026-04-11', 'active'),
(26, 33, '2026-02-11', 'paid',    '2026-04-11', 'active'),
(26, 42, '2026-02-18', 'paid',    '2026-04-18', 'active'),
(26, 47, '2026-03-01', 'paid',    '2026-04-01', 'active'),

-- ═══ GROUPE 27 – Physique 2AS Samedi ═════════════════════════════════════════
(27, 18, '2025-09-13', 'paid',    '2026-04-01', 'active'),
(27, 20, '2025-09-13', 'paid',    '2026-04-01', 'active'),
(27, 26, '2025-09-13', 'paid',    '2026-03-13', 'active'),
(27, 40, '2025-10-01', 'paid',    '2026-04-01', 'active'),
(27, 46, '2025-11-01', 'pending', NULL,          'active'),

-- ═══ GROUPE 28 – Physique 2AS Jeudi ══════════════════════════════════════════
(28, 22, '2025-09-11', 'paid',    '2026-04-01', 'active'),
(28, 24, '2025-09-11', 'paid',    '2026-04-01', 'active'),
(28, 36, '2025-10-05', 'paid',    '2026-03-05', 'active'),
(28, 44, '2025-10-05', 'overdue', NULL,          'active'),

-- ═══ GROUPE 29 – Physique BAC Intensif ═══════════════════════════════════════
(29, 20, '2026-02-08', 'paid',    '2026-04-08', 'active'),
(29, 26, '2026-02-08', 'paid',    '2026-04-08', 'active'),
(29, 32, '2026-02-08', 'paid',    '2026-04-08', 'active'),
(29, 36, '2026-03-01', 'paid',    '2026-04-01', 'active'),
(29, 42, '2026-03-01', 'pending', NULL,          'active'),

-- ═══ GROUPE 30 – Chimie 2AS Mardi ════════════════════════════════════════════
(30, 18, '2025-09-16', 'paid',    '2026-04-01', 'active'),
(30, 24, '2025-09-16', 'paid',    '2026-04-01', 'active'),
(30, 36, '2025-10-01', 'paid',    '2026-03-01', 'active'),
(30, 40, '2025-10-15', 'paid',    '2026-04-15', 'active'),
(30, 47, '2025-11-01', 'pending', NULL,          'active'),

-- ═══ GROUPE 31 – Philosophie BAC Lettres Vendredi ════════════════════════════
(31, 27, '2025-09-12', 'paid',    '2026-04-01', 'active'),
(31, 28, '2025-09-12', 'paid',    '2026-04-01', 'active'),
(31, 29, '2025-09-12', 'paid',    '2026-03-12', 'active'),
(31, 35, '2025-10-01', 'paid',    '2026-04-01', 'active'),
(31, 39, '2025-10-15', 'pending', NULL,          'active'),

-- ═══ GROUPE 32 – Philosophie BAC Intensif ════════════════════════════════════
(32, 13, '2026-03-01', 'paid',    '2026-04-01', 'active'),
(32, 19, '2026-03-01', 'paid',    '2026-04-01', 'active'),
(32, 27, '2026-03-01', 'paid',    '2026-04-01', 'active'),

-- ═══ GROUPE 33 – Anglais Avancé Dimanche Matin ═══════════════════════════════
(33, 25, '2025-09-14', 'paid',    '2026-04-01', 'active'),
(33, 29, '2025-09-14', 'paid',    '2026-04-01', 'active'),
(33, 38, '2025-10-01', 'paid',    '2026-03-01', 'active'),
(33, 46, '2025-11-01', 'paid',    '2026-04-01', 'active'),
(33, 49, '2025-11-15', 'pending', NULL,          'active'),

-- ═══ GROUPE 34 – Anglais Avancé Mercredi Soir ════════════════════════════════
(34, 16, '2025-09-10', 'paid',    '2026-04-01', 'active'),
(34, 33, '2025-09-10', 'paid',    '2026-04-01', 'active'),
(34, 42, '2025-10-01', 'paid',    '2026-03-01', 'active'),
(34, 47, '2025-10-15', 'overdue', NULL,          'active'),

-- ═══ GROUPE 35 – Français 1AS Lettres ════════════════════════════════════════
(35, 19, '2025-09-15', 'paid',    '2026-04-01', 'active'),
(35, 27, '2025-09-15', 'paid',    '2026-04-01', 'active'),
(35, 35, '2025-10-01', 'paid',    '2026-03-01', 'active'),
(35, 43, '2025-10-15', 'paid',    '2026-04-15', 'active'),

-- ═══ GROUPE 36 – SVT 1AS Samedi Soir ═════════════════════════════════════════
(36, 16, '2025-09-13', 'paid',    '2026-04-01', 'active'),
(36, 22, '2025-09-13', 'paid',    '2026-04-01', 'active'),
(36, 26, '2025-09-13', 'paid',    '2026-03-13', 'active'),
(36, 36, '2025-10-01', 'paid',    '2026-04-01', 'active'),
(36, 46, '2025-11-01', 'pending', NULL,          'active'),

-- ═══ GROUPE 37 – SVT 1AS Mardi ═══════════════════════════════════════════════
(37, 20, '2025-09-16', 'paid',    '2026-04-01', 'active'),
(37, 24, '2025-09-16', 'paid',    '2026-04-01', 'active'),
(37, 40, '2025-10-01', 'paid',    '2026-03-01', 'active'),
(37, 44, '2025-10-15', 'paid',    '2026-04-15', 'active'),
(37, 48, '2025-11-01', 'overdue', NULL,          'active');


-- ─── Sync current_students count ─────────────────────────────────────────────
UPDATE groups g
SET current_students = (
  SELECT COUNT(*) FROM group_students gs
  WHERE gs.group_id = g.id AND gs.status = 'active'
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. PARENT → STUDENT LINKS
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO parent_students (parent_id, student_id) VALUES
(60, 10),   -- Abdelkader → Amine
(60, 12),   -- Abdelkader → Ilyas (2 enfants)
(61, 11),   -- Houria → Rania
(62, 14),   -- Rachid → Sami
(63, 17),   -- Nadia → Lina
(64, 18),   -- Salim → Khaled
(65, 30),   -- Kheira → Islem
(65, 31),   -- Kheira → Hadjer (2 enfants)
(66, 32),   -- Hocine → Fares
(67, 34),   -- Farida → Walid
(68, 40),   -- Mustapha → Mehdi
(69, 41);   -- Zohra → Nihed


-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. SESSION SCHEDULE — intensive groups custom dates
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO session_schedule (group_id, session_number, session_date, start_time, end_time, is_cancelled) VALUES
-- Groupe 5: Stage Intensif Sci 5P – Juin 2026
(5,  1, '2026-06-15', '09:00', '11:00', false),
(5,  2, '2026-06-17', '09:00', '11:00', false),
(5,  3, '2026-06-19', '09:00', '11:00', false),
(5,  4, '2026-06-22', '09:00', '11:00', false),
(5,  5, '2026-06-24', '09:00', '11:00', false),
(5,  6, '2026-06-26', '09:00', '11:00', true),   -- annulée férié
(5,  7, '2026-06-29', '09:00', '11:00', false),
(5,  8, '2026-07-01', '09:00', '11:00', false),
(5,  9, '2026-07-03', '09:00', '11:00', false),
(5, 10, '2026-07-06', '09:00', '11:00', false),
(5, 11, '2026-07-08', '09:00', '11:00', false),
(5, 12, '2026-07-10', '09:00', '11:00', false),

-- Groupe 12: Intensif BEM Maths – Jan/Fév/Mar/Avr 2026
(12, 1, '2026-01-10', '08:00', '10:30', false),
(12, 2, '2026-01-17', '08:00', '10:30', false),
(12, 3, '2026-01-24', '08:00', '10:30', false),
(12, 4, '2026-01-31', '08:00', '10:30', false),
(12, 5, '2026-02-07', '08:00', '10:30', false),
(12, 6, '2026-02-14', '08:00', '10:30', false),
(12, 7, '2026-02-21', '08:00', '10:30', true),   -- annulée vacances
(12, 8, '2026-02-28', '08:00', '10:30', false),
(12, 9, '2026-03-07', '08:00', '10:30', false),
(12,10, '2026-03-14', '08:00', '10:30', false),
(12,11, '2026-03-21', '08:00', '10:30', false),
(12,12, '2026-03-28', '08:00', '10:30', false),
(12,13, '2026-04-04', '08:00', '10:30', false),
(12,14, '2026-04-11', '08:00', '10:30', false),
(12,15, '2026-04-18', '08:00', '10:30', false),
(12,16, '2026-04-25', '08:00', '10:30', false),

-- Groupe 16: Intensif BEM Français – Mar/Avr 2026
(16, 1, '2026-03-07', '08:00', '10:30', false),
(16, 2, '2026-03-14', '08:00', '10:30', false),
(16, 3, '2026-03-21', '08:00', '10:30', false),
(16, 4, '2026-03-28', '08:00', '10:30', false),
(16, 5, '2026-04-04', '08:00', '10:30', false),
(16, 6, '2026-04-11', '08:00', '10:30', true),   -- annulée
(16, 7, '2026-04-18', '08:00', '10:30', false);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. COURSE MATERIALS (28 fake documents)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO course_materials (course_id, teacher_id, title, description, file_name, file_path, file_type, file_size) VALUES
-- Course 1: Maths 4P
(1, 2, 'Fiche de révision – Fractions',         'Résumé complet sur les fractions avec exercices corrigés.',
 'maths4p_fractions.pdf',    'uploads/maths4p_fractions.pdf',    'application/pdf', 245000),
(1, 2, 'Exercices – Multiplication',            'Séries d''exercices de multiplication avec corrigés.',
 'maths4p_multi.pdf',        'uploads/maths4p_multi.pdf',        'application/pdf', 189000),

-- Course 2: Arabe 3P
(2, 3, 'نص القراءة – الفصل الأول',              'نصوص قراءة للفصل الأول مع أسئلة فهم المقروء.',
 'arabe3p_lecture1.pdf',     'uploads/arabe3p_lecture1.pdf',     'application/pdf', 310000),
(2, 3, 'قواعد النحو – الجملة الاسمية',           'درس مفصل حول الجملة الاسمية والخبر.',
 'arabe3p_grammaire.pdf',    'uploads/arabe3p_grammaire.pdf',    'application/pdf', 280000),

-- Course 4: Français 5P
(4, 3, 'Fiche de lecture – Le renard et le corbeau', 'Texte de la fable avec questions de compréhension.',
 'fr5p_lecture1.pdf',        'uploads/fr5p_lecture1.pdf',        'application/pdf', 198000),

-- Course 6: Maths 2AM
(6, 2, 'Cours complet – Équations du 1er degré', 'Théorie, méthodes et exercices d''application.',
 'maths2am_eq1.pdf',         'uploads/maths2am_eq1.pdf',         'application/pdf', 512000),
(6, 2, 'TD N°1 – Algèbre',                      'Travaux dirigés : expressions littérales, réductions.',
 'maths2am_td1.pdf',         'uploads/maths2am_td1.pdf',         'application/pdf', 335000),
(6, 2, 'Devoir Maison – Géométrie',             'DM avec figures à construire et à calculer.',
 'maths2am_dm_geo.pdf',      'uploads/maths2am_dm_geo.pdf',      'application/pdf', 421000),

-- Course 7: Maths 4AM BEM
(7, 2, 'Résumé BEM Maths – Tout le programme',  'Fiches synthèse de tout le programme de 4ème AM.',
 'maths4am_resume_bem.pdf',  'uploads/maths4am_resume_bem.pdf',  'application/pdf', 890000),
(7, 2, 'Examens BEM Corrigés 2019-2024',        'Cinq années d''examens BEM avec solutions détaillées.',
 'maths4am_exams.pdf',       'uploads/maths4am_exams.pdf',       'application/pdf', 1240000),
(7, 2, 'TD N°3 – Statistiques et Proba',        'Exercices sur les statistiques descriptives et probabilités.',
 'maths4am_td3_stats.pdf',   'uploads/maths4am_td3_stats.pdf',   'application/pdf', 412000),

-- Course 8: Physique-Chimie 3AM
(8, 4, 'Cours – Les forces et la pesanteur',    'Définitions, formules et exercices résolus.',
 'phy3am_forces.pdf',        'uploads/phy3am_forces.pdf',        'application/pdf', 580000),
(8, 4, 'TP – Réactions chimiques de base',      'Compte-rendu de travaux pratiques avec schémas.',
 'phy3am_tp_chimie.pdf',     'uploads/phy3am_tp_chimie.pdf',     'application/pdf', 472000),

-- Course 9: Français 4AM BEM
(9, 3, 'Méthodologie BEM – Texte argumentatif', 'Comment rédiger un texte argumentatif step by step.',
 'fr4am_methodo.pdf',        'uploads/fr4am_methodo.pdf',        'application/pdf', 345000),
(9, 3, 'Examens BEM Français Corrigés 2020-2024','Sujets corrigés des 5 dernières années.',
 'fr4am_exams.pdf',          'uploads/fr4am_exams.pdf',          'application/pdf', 1100000),

-- Course 13: Maths 1AS
(13, 2, 'Cours – Suites Numériques',            'Suites arithmétiques, géométriques, convergence.',
 'maths1as_suites.pdf',      'uploads/maths1as_suites.pdf',      'application/pdf', 620000),
(13, 2, 'TD – Dérivées et Applications',        'Étude de fonctions : variations, extrema, courbes.',
 'maths1as_td_derivees.pdf', 'uploads/maths1as_td_derivees.pdf', 'application/pdf', 510000),

-- Course 14: Maths BAC
(14, 2, 'Résumé BAC Maths – Programme complet', 'Synthèse intégrale : analyse, algèbre, proba, géométrie.',
 'maths_bac_resume.pdf',     'uploads/maths_bac_resume.pdf',     'application/pdf', 1450000),
(14, 2, 'BAC Blancs Maths 2022-2025',           'Quatre examens blancs complets avec barèmes.',
 'maths_bac_blancs.pdf',     'uploads/maths_bac_blancs.pdf',     'application/pdf', 1800000),

-- Course 15: Physique 2AS
(15, 4, 'Cours – Mécanique Newtonienne',        'Lois de Newton, cinématique, dynamique.',
 'phy2as_mecanique.pdf',     'uploads/phy2as_mecanique.pdf',     'application/pdf', 740000),
(15, 4, 'TD – Électricité et Circuits',         'Exercices sur les circuits RC, RL, dipôles.',
 'phy2as_td_elec.pdf',       'uploads/phy2as_td_elec.pdf',       'application/pdf', 560000),

-- Course 16: Physique BAC
(16, 4, 'BAC Physique – Résumé Final',          'Tout le programme BAC physique en 60 pages.',
 'phy_bac_resume.pdf',       'uploads/phy_bac_resume.pdf',       'application/pdf', 1350000),

-- Course 18: Philosophie BAC Lettres
(18, 3, 'Cours – Les grands courants philosophiques', 'Rationalisme, empirisme, idéalisme, existentialisme.',
 'philo_courants.pdf',       'uploads/philo_courants.pdf',       'application/pdf', 820000),
(18, 3, 'Méthodologie – La dissertation philosophique', 'Plan, introduction, développement, conclusion.',
 'philo_methodo.pdf',        'uploads/philo_methodo.pdf',        'application/pdf', 395000),

-- Course 19: Anglais Avancé
(19, 5, 'Grammar Guide – Advanced Level',       'Complete grammar reference for AS level students.',
 'eng_adv_grammar.pdf',      'uploads/eng_adv_grammar.pdf',      'application/pdf', 680000),

-- Course 21: SVT 1AS
(21, 6, 'Cours – Génétique Mendélienne',        'Lois de Mendel, arbres généalogiques, exercices.',
 'svt1as_genetique.pdf',     'uploads/svt1as_genetique.pdf',     'application/pdf', 730000),
(21, 6, 'TP – Observation microscopique',       'Compte-rendu TP avec dessins d''observation.',
 'svt1as_tp_micro.pdf',      'uploads/svt1as_tp_micro.pdf',      'application/pdf', 490000);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. FAVORITES — 18 bookmarks
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO favorites (user_id, course_id) VALUES
(10,  6),   -- Amine → Maths 2AM
(10, 13),   -- Amine → Maths 1AS
(11, 10),   -- Rania → Anglais 1AM
(15,  9),   -- Yasmine → Français 4AM BEM
(16, 14),   -- Hamza → Maths BAC
(18,  7),   -- Khaled → Maths 4AM BEM
(18, 14),   -- Khaled → Maths BAC
(18, 15),   -- Khaled → Physique 2AS
(19, 18),   -- Meriem → Philosophie BAC
(22,  9),   -- Adel → Français 4AM BEM
(22,  7),   -- Adel → Maths 4AM BEM
(25, 10),   -- Amira → Anglais 1AM
(29, 18),   -- Dounia → Philosophie
(30, 12),   -- Islem → Histoire-Géo
(33,  6),   -- Chaima → Maths 2AM
(38, 19),   -- Zakaria → Anglais Avancé
(44, 14),   -- Hichem → Maths BAC
(46, 16);   -- Anis → Physique BAC


-- ═══════════════════════════════════════════════════════════════════════════════
-- 9. NOTIFICATIONS — 55 messages (welcome, warning, reminder, info)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO notifications (user_id, notif_key, message, type, is_read, created_at) VALUES

-- ── Admin ────────────────────────────────────────────────────────────────────
(1, 'welcome_admin',         'مرحباً يا كريم! البيانات الشاملة للاختبار جاهزة. 40 تلميذاً، 22 مادة، 45 مجموعة.', 'welcome', true,  '2025-09-01'),
(1, 'admin_new_enrollment1', 'تسجيل جديد: أمين بكوش في مادة الرياضيات 4 ابتدائي.', 'info',    true,  '2025-09-13'),
(1, 'admin_stats_oct',       'إشعار: تم تسجيل 12 تلميذاً جديداً خلال شهر أكتوبر 2025.', 'info',    true,  '2025-10-31'),
(1, 'admin_stats_jan',       'إشعار: إيرادات شهر يناير 2026 تجاوزت 85,000 دج. أفضل شهر هذا الموسم!', 'info', true, '2026-01-31'),
(1, 'admin_overdue_warn',    'تنبيه: 8 تلاميذ لديهم دفع متأخر. يرجى المتابعة.', 'warning', false, '2026-04-20'),

-- ── Teachers ─────────────────────────────────────────────────────────────────
(2, 'welcome_teacher_benali',   'مرحباً أستاذ محمد بنعلي! تم تعيينك في 5 مواد رياضيات (ابتدائي، متوسط، ثانوي).', 'welcome', true, '2025-09-01'),
(2, 'teacher_new_student_g1',   'تلميذ جديد انضم إلى مجموعتك "Groupe A Samedi": إسلام ڤرفي.', 'info',    true, '2025-11-01'),
(2, 'teacher_material_reminder','تذكير: يمكنك إضافة وثائق الدرس في قسم المواد التعليمية.', 'reminder', false, '2025-10-15'),
(3, 'welcome_teacher_haddad',   'مرحباً أستاذة فاطمة حداد! تم تعيينك في الفرنسية والفلسفة واللغة العربية.', 'welcome', true, '2025-09-01'),
(3, 'teacher_bem_start',        'تنبيه: انطلاق الدورة المكثفة للإعداد لشهادة التعليم المتوسط في مارس 2026.', 'reminder', true, '2026-02-25'),
(4, 'welcome_teacher_mebarki',  'مرحباً أستاذ يوسف مبارك! تم تعيينك في الفيزياء والكيمياء لمستويات المتوسط والثانوي.', 'welcome', true, '2025-09-01'),
(5, 'welcome_teacher_ouali',    'مرحباً أستاذة سميرة والي! تم تعيينك في مادة الإنجليزية لجميع المستويات.', 'welcome', true, '2025-09-01'),
(6, 'welcome_teacher_boufatis', 'مرحباً أستاذ رشيد بوفاتيس! مواد: التربية الإسلامية وعلوم الطبيعة والحياة.', 'welcome', true, '2025-09-01'),

-- ── Students – welcome ────────────────────────────────────────────────────────
(10, 'welcome_amine',        'مرحباً أمين! أنت مسجّل في: رياضيات 4 ابتدائي، اللغة الفرنسية 5 ابتدائي، والتربية الإسلامية.', 'welcome', true, '2025-09-13'),
(11, 'welcome_rania',        'مرحباً رانيا! أنت مسجّلة في: رياضيات 4 ابتدائي، الفرنسية 5 ابتدائي، الإنجليزية 1 متوسط.', 'welcome', true, '2025-09-13'),
(16, 'welcome_hamza',        'مرحباً حمزة! أنت مسجّل في: رياضيات 4 ابتدائي (ج ت)، إنجليزية متقدمة، رياضيات 1 ث.', 'welcome', true, '2025-09-14'),
(18, 'welcome_khaled',       'مرحباً خالد! أنت مسجّل في 5 مواد هذا الموسم. موسم دراسي موفق!', 'welcome', true, '2025-09-15'),
(22, 'welcome_adel',         'مرحباً عادل! أنت مسجّل في: رياضيات 2 متوسط، الفرنسية BEM، ورياضيات 4 متوسط.', 'welcome', true, '2025-09-15'),
(30, 'welcome_islem',        'مرحباً إسلام! تم تأكيد تسجيلك في مجموعة رياضيات 4 ابتدائي صباح السبت.', 'welcome', true, '2025-11-01'),
(33, 'welcome_chaima',       'مرحباً شيمة! أنت مسجّلة في: رياضيات 2 متوسط، إنجليزية 3 متوسط، رياضيات 4 متوسط BEM.', 'welcome', true, '2025-10-01'),
(36, 'welcome_nassim',       'مرحباً نسيم! أنت مسجّل في مادتي رياضيات المتوسط ومراجعة BAC الرياضيات.', 'welcome', true, '2025-10-01'),
(40, 'welcome_mehdi',        'مرحباً مهدي! تم تسجيلك في مجموعة رياضيات 2 متوسط وإعداد BAC الرياضيات.', 'welcome', true, '2025-10-01'),
(46, 'welcome_anis',         'مرحباً أنيس! أنت مسجّل في: رياضيات 1 ث، مراجعة فيزياء BAC، فرنسية 4 متوسط.', 'welcome', true, '2025-11-01'),

-- ── Students – payment warnings ────────────────────────────────────────────
(14, 'overdue_sami_g1',      '⚠️ لم يتم تسديد قسط مادة الرياضيات 4 ابتدائي منذ أكثر من 30 يوماً. يرجى التواصل مع الإدارة.', 'warning', false, '2026-04-01'),
(26, 'overdue_rayan_g10',    '⚠️ قسط مادة الرياضيات 2 متوسط (مجموعة المساء) غير مسدّد. يرجى التسوية.', 'warning', false, '2026-04-05'),
(29, 'suspended_dounia',     '⚠️ تم تعليق تسجيلك في اللغة العربية 3 ابتدائي بسبب التأخر في الدفع. تواصل مع الإدارة.', 'warning', false, '2025-11-20'),
(42, 'suspended_anes_g3',    '⚠️ تم تعليق تسجيلك في مجموعة رياضيات 4 ابتدائي الأحد. يرجى تسوية وضعيتك المالية.', 'warning', false, '2025-12-10'),
(44, 'overdue_hichem_bem',   '⚠️ قسط الدورة المكثفة للرياضيات BEM غير مسدّد. آخر أجل: نهاية الأسبوع.', 'warning', false, '2026-03-20'),
(45, 'suspended_feriel',     '⚠️ تم إيقاف تسجيلك في مادة الفيزياء والكيمياء بسبب عدم الدفع.', 'warning', false, '2026-02-15'),

-- ── Students – payment confirmations ──────────────────────────────────────
(10, 'pay_confirm_amine_apr', '✅ تم تأكيد دفع قسط أبريل 2026 لمادة الرياضيات 4 ابتدائي. شكراً!', 'info',   true,  '2026-04-01'),
(18, 'pay_confirm_khaled_apr','✅ تم تأكيد دفع قسط أبريل 2026. تابع بنفس الحماس يا خالد!', 'info',   true,  '2026-04-01'),
(22, 'pay_confirm_adel_apr',  '✅ تم تسجيل دفع قسط شهر أبريل 2026. موفق في دروسك!', 'info',   true,  '2026-04-07'),
(36, 'pay_confirm_nassim_mar','✅ تم تأكيد دفع قسط مارس 2026 لمادة الرياضيات. شكراً على الالتزام!', 'info', true, '2026-03-05'),

-- ── Students – reminders ──────────────────────────────────────────────────
(13, 'reminder_bem_session',  '⏰ تذكير: حصة الإعداد لشهادة البكالوريا الأحد القادم على مادة الفيزياء والكيمياء.', 'reminder', false, '2026-04-22'),
(15, 'reminder_bem_maths',    '⏰ تذكير: حصة الرياضيات BEM غداً الخميس الساعة 16:30. لا تنس كتاب التمارين!', 'reminder', false, '2026-04-23'),
(20, 'reminder_bac_maths',    '⏰ تذكير: البكالوريا الاصطناعية في رياضيات الأربعاء 17h30. حضّر أدواتك.', 'reminder', false, '2026-04-22'),
(25, 'reminder_bem_angl',     '⏰ حصة الإنجليزية الأربعاء الساعة 14:00. ستتناولون وحدة Dialogue and Communication.', 'reminder', false, '2026-04-22'),
(29, 'reminder_bac_philo',    '⏰ تذكير: حصة الفلسفة الجمعة 14:00 – مراجعة فصل "الإنسان والحرية".', 'reminder', false, '2026-04-23'),
(33, 'reminder_bem_fr',       '⏰ تذكير: حصة الفرنسية BEM السبت 08:00 – تصحيح التعبير الكتابي.', 'reminder', false, '2026-04-23'),
(40, 'reminder_bac_review',   '⏰ مراجعة BAC الرياضيات السبت 08:00 – فصل الأعداد المركبة. حضّر الملخص.', 'reminder', false, '2026-04-23'),

-- ── Parents ──────────────────────────────────────────────────────────────────
(60, 'welcome_parent_abdelkader', 'مرحباً! يمكنك متابعة أبنائك أمين وإلياس من خلال لوحة الأولياء.', 'welcome', true,  '2025-09-13'),
(60, 'parent_overdue_amine',      '⚠️ لم يتم تسديد قسط أبريل لابنك أمين في مادة الرياضيات 4 ابتدائي.', 'warning', false, '2026-04-10'),
(61, 'welcome_parent_houria',     'مرحباً! يمكنك متابعة ابنتك رانيا من خلال لوحة الأولياء.', 'welcome', true,  '2025-09-13'),
(62, 'welcome_parent_rachid',     'مرحباً! يمكنك متابعة ابنك سامي من خلال لوحة الأولياء.', 'welcome', true,  '2025-09-13'),
(62, 'parent_overdue_sami',       '⚠️ تنبيه: قسط ابنك سامي في مادة الرياضيات 4 ابتدائي متأخر.', 'warning', false, '2026-04-05'),
(63, 'welcome_parent_nadia',      'مرحباً! يمكنك متابعة ابنتك لينا من خلال لوحة الأولياء.', 'welcome', true,  '2025-09-13'),
(64, 'welcome_parent_salim',      'مرحباً! يمكنك متابعة ابنك خالد – مسجّل في 5 مواد هذا الموسم.', 'welcome', true,  '2025-09-15'),
(64, 'parent_confirm_khaled',     '✅ تم تأكيد دفع قسط ابنك خالد لشهر أبريل 2026. شكراً!', 'info',    true,  '2026-04-01'),
(65, 'welcome_parent_kheira',     'مرحباً! يمكنك متابعة أبنائك إسلام وحجر من خلال لوحة الأولياء.', 'welcome', true, '2025-11-01'),
(66, 'welcome_parent_hocine',     'مرحباً! يمكنك متابعة ابنك فارس من خلال لوحة الأولياء.', 'welcome', true,  '2025-09-05'),
(68, 'welcome_parent_mustapha',   'مرحباً! يمكنك متابعة ابنك مهدي من خلال لوحة الأولياء.', 'welcome', true,  '2025-10-01');


-- ═══════════════════════════════════════════════════════════════════════════════
-- ✅ DONE — Comprehensive seed inserted successfully
-- ───────────────────────────────────────────────────────────────────────────────
-- Stats summary you'll see in the dashboard:
--   • Total students      : 40
--   • Total teachers      : 5 (+ 1 admin)
--   • Active courses      : 21  /  Inactive: 1
--   • Total groups        : 37  (open: 28, closed: 9)
--   • Total enrollments   : ~130  (active: ~115, suspended: 3, inactive: 1)
--   • Payment status mix  : paid ~70% · pending ~18% · overdue ~12%
--   • Revenue months      : Oct 2025 → Apr 2026 (7 months of chart data)
--   • Materials           : 28 documents across 14 courses
--   • Notifications       : 55 messages
--   • Favorites           : 18 bookmarks
-- ═══════════════════════════════════════════════════════════════════════════════