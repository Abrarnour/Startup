--
-- PostgreSQL database dump
--

\restrict gdU9l7qXZOTbZT8aNM92joIaGcmHYRx8SGAZwjHEntVsmPtHEB27LAYWCfQTeOn

-- Dumped from database version 15.16 (Debian 15.16-0+deb12u1)
-- Dumped by pg_dump version 15.16 (Debian 15.16-0+deb12u1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, last_name, birthday, city, email, password, phone, gender, role, parent_phone, created_at) FROM stdin;
1	Admin	Belmahi	1990-01-01	Oran	admin@belmahi.dz	pass	0555000001	M	admin	\N	2026-02-01 17:15:50.752859
2	Mohammed	Benali	1985-05-15	Oran	benali@belmahi.dz	pass	0555000002	M	teacher	\N	2026-02-01 17:15:50.752859
3	Fatima	Khadri	1988-08-20	Oran	khadri@belmahi.dz	pass	0555000003	F	teacher	\N	2026-02-01 17:15:50.752859
8	karim	bnziane	1991-12-29	Oran	karimbn@gmail.com	pass	\N	\N	Parent	\N	2026-02-01 18:39:45.25055
9	amina	bouzidi	2026-02-26	Oran	amina.bouzidi@parent.dz	pass	\N	\N	Parent	\N	2026-02-06 21:14:41.836624
10	nour	bouzidi	2019-06-11	Oran	nourbouzidi@gmail.com	pass	\N	F	student	\N	2026-02-06 21:55:11.458914
4	Ahmed	Meziane	2010-09-01	Oran	ahmed@student.dz	pass	0555000010	M	student	0666111222	2026-02-01 17:15:50.752859
5	Yasmine	Boudiaf	2011-03-15	Oran	yasmine@student.dz	pass	0555000011	F	student	0666111222	2026-02-01 17:15:50.752859
6	Karim	Hamadi	2012-07-20	Oran	karim@student.dz	pass	0555000012	M	student	0666111222	2026-02-01 17:15:50.752859
13	Sara	Bouzidi	2012-03-10	Oran	sara.bouzidi@student.dz	pass	\N	F	student	0777888999	2026-02-07 18:52:21.240027
14	Yacine	Bouzidi	2014-08-15	Oran	yacine.bouzidi@student.dz	pass	\N	M	student	0777888999	2026-02-07 18:52:21.240027
15	Ahmed	Benali	1985-03-15	Oran	ahmed.benali@teacher.dz	pass123	0770123456	M	teacher	\N	2026-02-13 19:12:45.903417
16	Fatima	Khelifi	1988-07-22	Oran	fatima.khelifi@teacher.dz	pass123	0771234567	F	teacher	\N	2026-02-13 19:12:45.903417
17	Karim	Meziane	1982-11-10	Oran	karim.meziane@teacher.dz	pass123	0772345678	M	teacher	\N	2026-02-13 19:12:45.903417
19	Youcef	Mansouri	1987-09-25	Oran	youcef.mansouri@teacher.dz	pass123	0774567890	M	teacher	\N	2026-02-13 19:12:45.903417
20	Leila	Hamidi	1980-08-12	Oran	leila.hamidi@parent.dz	pass123	0660111222	F	Parent	\N	2026-02-13 19:12:45.946428
21	Rania	Hamidi	2013-04-20	Oran	rania.hamidi@student.dz	pass123	\N	F	student	0660111222	2026-02-13 19:12:45.951045
22	Mehdi	Hamidi	2015-09-15	Oran	mehdi.hamidi@student.dz	pass123	\N	M	student	0660111222	2026-02-13 19:12:45.951045
23	Sarah	Benali	2012-06-10	Oran	sarah.benali@student.dz	pass123	\N	F	student	\N	2026-02-13 19:12:45.951045
24	Amine	Khelifi	2014-02-28	Oran	amine.khelifi@student.dz	pass123	\N	M	student	\N	2026-02-13 19:12:45.951045
25	Yasmine	Meziane	2013-11-05	Oran	yasmine.meziane@student.dz	pass123	\N	F	student	\N	2026-02-13 19:12:45.951045
26	Admin	System	1990-01-01	Oran	admin@school.dz	admin123	0555000000	M	admin	\N	2026-02-13 19:12:46.11247
\.


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.courses (id, title, teacher_id, description, education_level, year_level, branch, course_type, sessions_per_month, duration_hours, max_students_per_group, price, salle, is_active, created_at, updated_at) FROM stdin;
3	Physique - 2ème Année Secondaire	3	Cours de physique sciences expérimentales	secondaire	2	\N	continuous	6	\N	20	8000.00	Salle C	t	2026-02-01 17:15:50.763523	2026-02-01 17:15:50.763523
5	jjj	2	jjjj	primaire	1	\N	continuous	1	\N	30	0.01	jjjj	t	2026-02-06 23:29:36.726937	2026-02-06 23:29:36.726937
6	Mathématiques Primaire	15	Cours de mathématiques pour le primaire avec exercices pratiques	primaire	5	\N	continuous	8	\N	25	3000.00	Salle A1	t	2026-02-13 19:12:45.981305	2026-02-13 19:12:45.981305
7	Sciences Physiques	16	Cours de physique-chimie pour le moyen	moyen	2	\N	continuous	8	\N	30	3500.00	Labo B2	t	2026-02-13 19:12:45.988976	2026-02-13 19:12:45.988976
8	Anglais Avancé	17	Cours d'anglais niveau avancé pour lycéens	secondaire	2	Sciences	continuous	8	\N	20	4000.00	Salle C3	t	2026-02-13 19:12:45.99382	2026-02-13 19:12:45.99382
11	Initiation Informatique	15	Cours d'informatique pour débutants	moyen	1	\N	continuous	4	\N	15	3200.00	Salle Info E5	t	2026-02-13 19:12:46.008199	2026-02-13 19:12:46.008199
10	Révision Intensive BAC Math	19	Stage intensif de révision pour le BA\n	secondaire	3	Mathématiques	one_time	\N	30	15	8000.00	Grande Salle	t	2026-02-13 19:12:46.003315	2026-02-23 12:49:13.919355
12	mat	16	duk	primaire	1	\N	continuous	1	\N	30	2500.00	A	t	2026-02-23 14:46:33.766411	2026-02-24 13:04:47.829797
\.


--
-- Data for Name: course_materials; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.course_materials (id, course_id, teacher_id, title, description, file_name, file_path, file_type, file_size, uploaded_at) FROM stdin;
1	5	2	k	k	1770740697549-164501080-ss.jpg	/uploads/1770740697549-164501080-ss.jpg	image/jpeg	39099	2026-02-10 17:24:57.622619
15	5	2	f	f	1771243020009-576701460-Liste-des-Enseignants-avec-Ã©mail_250126_163235-1.pdf	/uploads/1771243020009-576701460-Liste-des-Enseignants-avec-Ã©mail_250126_163235-1.pdf	application/pdf	880765	2026-02-16 12:57:00.06313
16	7	16	exemple	ex	1771245048830-430400902-Liste-des-Enseignants-avec-Ã©mail_250126_163235-1.pdf	/uploads/1771245048830-430400902-Liste-des-Enseignants-avec-Ã©mail_250126_163235-1.pdf	application/pdf	880765	2026-02-16 13:30:48.899888
17	12	16	fdgfhg	dgfhgjhk	1774536137525-272604347-Screenshot 2026-03-26 15.42.02.png	/uploads/1774536137525-272604347-Screenshot 2026-03-26 15.42.02.png	image/png	237362	2026-03-26 15:42:17.575354
\.


--
-- Data for Name: favorites; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.favorites (id, user_id, course_id, created_at) FROM stdin;
9	1	10	2026-02-23 13:39:24.981081
\.


--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.groups (id, course_id, group_name, start_date, start_time, end_time, day_of_week, session_start_time, session_end_time, registration_open, current_students, is_active, created_at, updated_at, salle, calendar_type, total_weeks, repeat_calendar, current_cycle, total_sessions, sessions_per_week, has_next_cycle_modifications, next_cycle_modifications, return_to_normal_after_cycle, modified_cycle_count) FROM stdin;
10	7	Groupe Unique	\N	\N	\N	monday	15:00:00	17:00:00	t	3	t	2026-02-13 19:12:46.029044	2026-02-13 19:12:46.029044	Labo B2	manual	4	f	1	\N	1	f	\N	t	0
6	5	Groupe A	\N	\N	\N	\N	\N	\N	t	1	t	2026-02-10 21:12:38.05828	2026-02-10 21:12:38.05828	\N	manual	4	f	1	\N	1	f	\N	t	0
7	3	Groupe A	\N	\N	\N	\N	\N	\N	t	1	t	2026-02-10 21:12:54.625998	2026-02-10 21:12:54.625998	\N	manual	4	f	1	\N	1	f	\N	t	0
8	6	Groupe A - Dimanche Matin	\N	\N	\N	sunday	09:00:00	11:00:00	t	2	t	2026-02-13 19:12:46.01334	2026-02-13 19:12:46.01334	Salle A1	manual	4	f	1	\N	1	f	\N	t	0
9	6	Groupe B - Mercredi Après-midi	\N	\N	\N	wednesday	14:00:00	16:00:00	t	1	t	2026-02-13 19:12:46.023829	2026-02-13 19:12:46.023829	Salle A1	manual	4	f	1	\N	1	f	\N	t	0
11	8	Groupe Sciences	\N	\N	\N	tuesday	17:30:00	19:30:00	t	1	t	2026-02-13 19:12:46.033624	2026-02-13 19:12:46.033624	Salle C3	manual	4	f	1	\N	1	f	\N	t	0
13	11	Groupe Débutants	\N	\N	\N	saturday	09:00:00	11:00:00	t	2	t	2026-02-13 19:12:46.043779	2026-02-13 19:12:46.043779	Salle Info E5	manual	4	f	1	\N	1	f	\N	t	0
14	10	Stage Février 2026	2026-02-17	09:00:00	17:00:00	\N	\N	\N	t	1	t	2026-02-13 19:12:46.04955	2026-02-13 19:12:46.04955	Grande Salle	manual	4	f	1	\N	1	f	\N	t	0
17	12	111	\N	\N	\N	\N	\N	\N	t	0	t	2026-02-23 16:25:36.480374	2026-02-23 16:25:36.480374	A	weekly_fixed	4	f	1	4	1	f	\N	t	0
18	12	jjkj	\N	\N	\N	\N	\N	\N	t	0	t	2026-02-23 16:34:14.462836	2026-02-23 16:34:14.462836	jkjjjj	weekly_fixed	4	f	1	4	1	f	\N	t	0
19	12	A	\N	\N	\N	\N	\N	\N	t	0	t	2026-02-23 17:38:02.971887	2026-02-23 17:38:02.971887	AA	weekly_fixed	4	f	1	4	1	f	\N	t	0
15	12	1	\N	\N	\N	\N	\N	\N	t	1	t	2026-02-23 14:58:50.099734	2026-02-23 14:58:50.099734	A	weekly_fixed	4	f	1	4	1	f	\N	t	0
\.


--
-- Data for Name: group_students; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.group_students (id, group_id, student_id, status, payment_status, amount_paid, enrollment_date, enrollment_type, requested_by, request_date, payment_due, payment_deadline, last_payment_date) FROM stdin;
16	6	3	active	pending	0.00	2026-02-10 21:13:04.62262	direct	\N	\N	\N	\N	\N
17	7	3	active	pending	0.00	2026-02-10 21:13:04.62262	direct	\N	\N	\N	\N	\N
21	13	22	active	pending	0.00	2026-02-13 19:12:46.054215	direct	\N	\N	\N	\N	\N
28	14	25	active	pending	0.00	2026-02-13 19:12:46.054215	direct	\N	\N	\N	\N	\N
30	15	5	active	pending	0.00	2026-02-23 17:39:05.461433	direct	1	\N	0.01	\N	\N
25	13	24	active	pending	0.00	2026-02-13 19:12:46.054215	direct	\N	\N	\N	\N	\N
18	8	21	active	paid	0.00	2026-02-13 19:12:46.054215	direct	\N	\N	\N	\N	2026-02-13
20	9	22	active	paid	0.00	2026-02-13 19:12:46.054215	direct	\N	\N	\N	\N	2026-02-13
22	10	23	active	paid	0.00	2026-02-13 19:12:46.054215	direct	\N	\N	\N	\N	2026-02-13
23	11	23	active	paid	0.00	2026-02-13 19:12:46.054215	direct	\N	\N	\N	\N	2026-02-13
24	8	24	active	paid	0.00	2026-02-13 19:12:46.054215	direct	\N	\N	\N	\N	2026-02-13
27	10	25	active	paid	0.00	2026-02-13 19:12:46.054215	direct	\N	\N	\N	\N	2026-02-13
31	10	13	active	paid	0.00	2026-02-25 14:48:41.270239	parent_request	9	2026-02-25 14:48:41.270239	\N	\N	2026-02-25
\.


--
-- Data for Name: parent_students; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.parent_students (id, parent_id, student_id, relationship, is_primary, created_at) FROM stdin;
1	9	13	parent	t	2026-02-07 18:52:21.252639
2	9	14	parent	t	2026-02-07 18:52:21.252639
3	20	21	parent	t	2026-02-13 19:12:45.955529
4	20	22	parent	t	2026-02-13 19:12:45.955529
\.


--
-- Data for Name: session_schedule; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.session_schedule (id, group_id, session_number, session_title, session_date, status, notes, created_at, week_number, start_time, end_time, actual_date, is_modified, is_cancelled, cancellation_reason) FROM stdin;
\.


--
-- Data for Name: student_notes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.student_notes (id, group_student_id, author_id, note_text, created_at, note_type, is_important, is_private) FROM stdin;
5	31	16	fchgjvhkjk	2026-02-25 14:49:21.737177	general	t	f
\.


--
-- Name: course_materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.course_materials_id_seq', 17, true);


--
-- Name: courses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.courses_id_seq', 12, true);


--
-- Name: favorites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.favorites_id_seq', 9, true);


--
-- Name: group_students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.group_students_id_seq', 31, true);


--
-- Name: groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.groups_id_seq', 19, true);


--
-- Name: parent_students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.parent_students_id_seq', 4, true);


--
-- Name: session_schedule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.session_schedule_id_seq', 7, true);


--
-- Name: student_notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.student_notes_id_seq', 5, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 26, true);


--
-- PostgreSQL database dump complete
--

\unrestrict gdU9l7qXZOTbZT8aNM92joIaGcmHYRx8SGAZwjHEntVsmPtHEB27LAYWCfQTeOn

