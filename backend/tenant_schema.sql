-- PostgreSQL database dump
--

-- Removed invalid backslash restriction directive to support node-pg execution
-- \restrict 6I28pWHr7AvxnwZR5evJ8Ix3qlxl9GXC29QlG58rHPbKZI7rjuTbeyx8cj62CER

-- Dumped from database version 15.18 (Debian 15.18-0+deb12u1)
-- Dumped by pg_dump version 15.18 (Debian 15.18-0+deb12u1)

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
-- Name: add_student_note(integer, integer, text, character varying, boolean, boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.add_student_note(p_group_student_id integer, p_author_id integer, p_note_text text, p_note_type character varying DEFAULT 'general'::character varying, p_is_important boolean DEFAULT false, p_is_private boolean DEFAULT false) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_author_role VARCHAR;
  v_new_note_id INTEGER;
BEGIN
  -- Vérifier le rôle de l'auteur
  SELECT role INTO v_author_role FROM users WHERE id = p_author_id;
  
  -- Seulement admin et teacher peuvent ajouter des notes
  IF v_author_role NOT IN ('admin', 'teacher') THEN
    RAISE EXCEPTION 'Seuls les enseignants et administrateurs peuvent ajouter des notes';
  END IF;
  
  -- Créer la note
  INSERT INTO student_notes (
    group_student_id,
    author_id,
    note_text,
    note_type,
    is_important,
    is_private
  ) VALUES (
    p_group_student_id,
    p_author_id,
    p_note_text,
    p_note_type,
    p_is_important,
    p_is_private
  ) RETURNING id INTO v_new_note_id;
  
  RETURN v_new_note_id;
END;
$$;


ALTER FUNCTION public.add_student_note(p_group_student_id integer, p_author_id integer, p_note_text text, p_note_type character varying, p_is_important boolean, p_is_private boolean) OWNER TO postgres;

--
-- Name: apply_next_cycle_modifications(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.apply_next_cycle_modifications(p_group_id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_modifications JSONB;
  v_return_to_normal BOOLEAN;
BEGIN
  -- Récupérer les modifications
  SELECT next_cycle_modifications, return_to_normal_after_cycle
  INTO v_modifications, v_return_to_normal
  FROM groups
  WHERE id = p_group_id AND has_next_cycle_modifications = true;
  
  IF v_modifications IS NULL THEN
    RAISE EXCEPTION 'Aucune modification de cycle trouvée pour ce groupe';
  END IF;
  
  -- Supprimer les anciennes sessions
  DELETE FROM session_schedule WHERE group_id = p_group_id;
  
  -- Créer les nouvelles sessions depuis les modifications
  PERFORM create_manual_sessions_v2(
    p_group_id,
    v_modifications->'sessions'
  );
  
  -- Incrémenter le compteur de cycles modifiés
  UPDATE groups
  SET modified_cycle_count = modified_cycle_count + 1,
      current_cycle = current_cycle + 1
  WHERE id = p_group_id;
  
  -- Si on doit retourner au cycle normal après
  IF v_return_to_normal THEN
    UPDATE groups
    SET has_next_cycle_modifications = false,
        next_cycle_modifications = NULL
    WHERE id = p_group_id;
  END IF;
END;
$$;


ALTER FUNCTION public.apply_next_cycle_modifications(p_group_id integer) OWNER TO postgres;

--
-- Name: cancel_session(integer, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.cancel_session(p_session_id integer, p_reason text) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE session_schedule
  SET 
    is_cancelled = true,
    cancellation_reason = p_reason,
    status = 'cancelled'
  WHERE id = p_session_id;
END;
$$;


ALTER FUNCTION public.cancel_session(p_session_id integer, p_reason text) OWNER TO postgres;

--
-- Name: create_manual_sessions(integer, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_manual_sessions(p_group_id integer, p_sessions jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  session_item JSONB;
BEGIN
  -- Supprimer les anciennes sessions
  DELETE FROM session_schedule WHERE group_id = p_group_id;
  
  -- Créer les nouvelles sessions
  FOR session_item IN SELECT * FROM jsonb_array_elements(p_sessions)
  LOOP
    INSERT INTO session_schedule (
      group_id,
      session_number,
      session_title,
      week_number,
      session_date,
      start_time,
      end_time,
      status
    ) VALUES (
      p_group_id,
      (session_item->>'session_number')::INTEGER,
      session_item->>'title',
      (session_item->>'week')::INTEGER,
      (session_item->>'date')::DATE,
      (session_item->>'start_time')::TIME,
      (session_item->>'end_time')::TIME,
      COALESCE(session_item->>'status', 'scheduled')
    );
  END LOOP;
END;
$$;


ALTER FUNCTION public.create_manual_sessions(p_group_id integer, p_sessions jsonb) OWNER TO postgres;

--
-- Name: create_manual_sessions_v2(integer, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_manual_sessions_v2(p_group_id integer, p_sessions jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  session_item JSONB;
BEGIN
  -- Supprimer les anciennes sessions
  DELETE FROM session_schedule WHERE group_id = p_group_id;
  
  -- Créer les nouvelles sessions
  FOR session_item IN SELECT * FROM jsonb_array_elements(p_sessions)
  LOOP
    INSERT INTO session_schedule (
      group_id,
      session_number,
      session_title,
      week_number,
      session_date,
      start_time,
      end_time,
      status
    ) VALUES (
      p_group_id,
      (session_item->>'session_number')::INTEGER,
      session_item->>'title',
      COALESCE((session_item->>'week')::INTEGER, 1),
      (session_item->>'date')::DATE,
      (session_item->>'start_time')::TIME,
      (session_item->>'end_time')::TIME,
      COALESCE(session_item->>'status', 'scheduled')
    );
  END LOOP;
  
  -- Mettre à jour le nombre total de séances
  UPDATE groups 
  SET total_sessions = (SELECT COUNT(*) FROM session_schedule WHERE group_id = p_group_id)
  WHERE id = p_group_id;
END;
$$;


ALTER FUNCTION public.create_manual_sessions_v2(p_group_id integer, p_sessions jsonb) OWNER TO postgres;

--
-- Name: get_group_calendar(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_group_calendar(p_group_id integer) RETURNS TABLE(session_id integer, week_number integer, session_number integer, session_title character varying, session_date date, actual_date date, start_time time without time zone, end_time time without time zone, status character varying, is_modified boolean, is_cancelled boolean, cancellation_reason text)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ss.id,
    ss.week_number,
    ss.session_number,
    ss.session_title,
    ss.session_date,
    ss.actual_date,
    ss.start_time,
    ss.end_time,
    ss.status,
    ss.is_modified,
    ss.is_cancelled,
    ss.cancellation_reason
  FROM session_schedule ss
  WHERE ss.group_id = p_group_id
  ORDER BY ss.week_number, ss.session_number;
END;
$$;


ALTER FUNCTION public.get_group_calendar(p_group_id integer) OWNER TO postgres;

--
-- Name: get_parent_children(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_parent_children(p_parent_id integer) RETURNS TABLE(student_id integer, student_name character varying, student_last_name character varying, student_email character varying, student_birthday date, relationship character varying, is_primary boolean)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    u.last_name,
    u.email,
    u.birthday,
    ps.relationship,
    ps.is_primary
  FROM users u
  INNER JOIN parent_students ps ON u.id = ps.student_id
  WHERE ps.parent_id = p_parent_id
  ORDER BY ps.is_primary DESC, u.name;
END;
$$;


ALTER FUNCTION public.get_parent_children(p_parent_id integer) OWNER TO postgres;

--
-- Name: get_student_enrolled_courses(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_student_enrolled_courses(p_student_id integer) RETURNS TABLE(enrollment_id integer, course_id integer, course_title character varying, teacher_name character varying, teacher_last_name character varying, teacher_gender character, group_id integer, group_name character varying, education_level character varying, year_level integer, branch character varying, price numeric, status character varying, payment_status character varying, amount_paid numeric, enrollment_date timestamp without time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gs.id,
    c.id,
    c.title,
    u.name,
    u.last_name,
    u.gender,
    g.id,
    g.group_name,
    c.education_level,
    c.year_level,
    c.branch,
    c.price,
    gs.status,
    gs.payment_status,
    gs.amount_paid,
    gs.enrollment_date
  FROM group_students gs
  INNER JOIN groups g ON gs.group_id = g.id
  INNER JOIN courses c ON g.course_id = c.id
  LEFT JOIN users u ON c.teacher_id = u.id
  WHERE gs.student_id = p_student_id
  ORDER BY gs.enrollment_date DESC;
END;
$$;


ALTER FUNCTION public.get_student_enrolled_courses(p_student_id integer) OWNER TO postgres;

--
-- Name: modify_session(integer, date, time without time zone, time without time zone, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.modify_session(p_session_id integer, p_new_date date DEFAULT NULL::date, p_new_start_time time without time zone DEFAULT NULL::time without time zone, p_new_end_time time without time zone DEFAULT NULL::time without time zone, p_new_title character varying DEFAULT NULL::character varying) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE session_schedule
  SET 
    actual_date = COALESCE(p_new_date, actual_date),
    start_time = COALESCE(p_new_start_time, start_time),
    end_time = COALESCE(p_new_end_time, end_time),
    session_title = COALESCE(p_new_title, session_title),
    is_modified = true
  WHERE id = p_session_id;
END;
$$;


ALTER FUNCTION public.modify_session(p_session_id integer, p_new_date date, p_new_start_time time without time zone, p_new_end_time time without time zone, p_new_title character varying) OWNER TO postgres;

--
-- Name: return_to_normal_cycle(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.return_to_normal_cycle(p_group_id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_base_sessions JSONB;
BEGIN
  -- TODO: Implémenter la logique pour récupérer les sessions de base
  -- Pour l'instant, on supprime juste les modifications
  UPDATE groups
  SET 
    has_next_cycle_modifications = false,
    next_cycle_modifications = NULL,
    modified_cycle_count = 0
  WHERE id = p_group_id;
END;
$$;


ALTER FUNCTION public.return_to_normal_cycle(p_group_id integer) OWNER TO postgres;

--
-- Name: save_next_cycle_modifications(integer, text, integer, integer, jsonb, boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.save_next_cycle_modifications(p_group_id integer, p_reason text, p_total_weeks integer, p_total_sessions integer, p_sessions jsonb, p_return_to_normal boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE groups
  SET 
    has_next_cycle_modifications = true,
    next_cycle_modifications = jsonb_build_object(
      'reason', p_reason,
      'total_weeks', p_total_weeks,
      'total_sessions', p_total_sessions,
      'sessions', p_sessions,
      'saved_at', NOW()
    ),
    return_to_normal_after_cycle = p_return_to_normal
  WHERE id = p_group_id;
END;
$$;


ALTER FUNCTION public.save_next_cycle_modifications(p_group_id integer, p_reason text, p_total_weeks integer, p_total_sessions integer, p_sessions jsonb, p_return_to_normal boolean) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: attendance_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance_log (
    id integer NOT NULL,
    group_id integer NOT NULL,
    student_id integer NOT NULL,
    scanned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    session_number integer NOT NULL,
    scanned_by integer
);


ALTER TABLE public.attendance_log OWNER TO postgres;

--
-- Name: attendance_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attendance_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.attendance_log_id_seq OWNER TO postgres;

--
-- Name: attendance_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attendance_log_id_seq OWNED BY public.attendance_log.id;


--
-- Name: course_materials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_materials (
    id integer NOT NULL,
    course_id integer NOT NULL,
    teacher_id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    file_name character varying(255) NOT NULL,
    file_path character varying(500) NOT NULL,
    file_type character varying(50) NOT NULL,
    file_size integer,
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.course_materials OWNER TO postgres;

--
-- Name: TABLE course_materials; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.course_materials IS 'Stores uploaded course materials by teachers';


--
-- Name: course_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.course_materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.course_materials_id_seq OWNER TO postgres;

--
-- Name: course_materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.course_materials_id_seq OWNED BY public.course_materials.id;


--
-- Name: courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.courses (
    id integer NOT NULL,
    title character varying(200) NOT NULL,
    teacher_id integer,
    description text,
    education_level character varying(20) NOT NULL,
    year_level integer NOT NULL,
    branch character varying(50),
    course_type character varying(20) NOT NULL,
    sessions_per_month integer,
    duration_hours integer,
    max_students_per_group integer DEFAULT 30,
    price numeric(10,2),
    salle character varying(100),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT courses_course_type_check CHECK (((course_type)::text = ANY ((ARRAY['one_time'::character varying, 'continuous'::character varying])::text[]))),
    CONSTRAINT courses_education_level_check CHECK (((education_level)::text = ANY ((ARRAY['primaire'::character varying, 'moyen'::character varying, 'secondaire'::character varying])::text[]))),
    CONSTRAINT courses_year_level_check CHECK (((year_level >= 1) AND (year_level <= 5)))
);


ALTER TABLE public.courses OWNER TO postgres;

--
-- Name: courses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.courses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.courses_id_seq OWNER TO postgres;

--
-- Name: courses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.courses_id_seq OWNED BY public.courses.id;


--
-- Name: favorites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.favorites (
    id integer NOT NULL,
    user_id integer,
    course_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.favorites OWNER TO postgres;

--
-- Name: favorites_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.favorites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.favorites_id_seq OWNER TO postgres;

--
-- Name: favorites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.favorites_id_seq OWNED BY public.favorites.id;


--
-- Name: group_students; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.group_students (
    id integer NOT NULL,
    group_id integer,
    student_id integer,
    status character varying(20) DEFAULT 'active'::character varying,
    payment_status character varying(20) DEFAULT 'pending'::character varying,
    amount_paid numeric(10,2) DEFAULT 0,
    enrollment_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    enrollment_type character varying(20) DEFAULT 'direct'::character varying,
    requested_by integer,
    request_date timestamp without time zone,
    payment_due numeric(10,2),
    payment_deadline date,
    last_payment_date date,
    sessions_attended integer DEFAULT 0 NOT NULL,
    cycle_start_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT group_students_enrollment_type_check CHECK (((enrollment_type)::text = ANY ((ARRAY['direct'::character varying, 'parent_request'::character varying, 'admin_assigned'::character varying])::text[]))),
    CONSTRAINT group_students_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'completed'::character varying, 'dropped'::character varying])::text[])))
);


ALTER TABLE public.group_students OWNER TO postgres;

--
-- Name: group_students_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.group_students_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.group_students_id_seq OWNER TO postgres;

--
-- Name: group_students_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.group_students_id_seq OWNED BY public.group_students.id;


--
-- Name: groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.groups (
    id integer NOT NULL,
    course_id integer,
    group_name character varying(100) NOT NULL,
    start_date date,
    start_time time without time zone,
    end_time time without time zone,
    day_of_week character varying(20),
    session_start_time time without time zone,
    session_end_time time without time zone,
    registration_open boolean DEFAULT true,
    current_students integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    salle character varying(100),
    calendar_type character varying(20) DEFAULT 'manual'::character varying,
    total_weeks integer DEFAULT 4,
    repeat_calendar boolean DEFAULT false,
    current_cycle integer DEFAULT 1,
    total_sessions integer,
    sessions_per_week integer DEFAULT 1,
    has_next_cycle_modifications boolean DEFAULT false,
    next_cycle_modifications jsonb,
    return_to_normal_after_cycle boolean DEFAULT true,
    modified_cycle_count integer DEFAULT 0,
    CONSTRAINT groups_calendar_type_check CHECK (((calendar_type)::text = ANY ((ARRAY['manual'::character varying, 'weekly_fixed'::character varying])::text[])))
);


ALTER TABLE public.groups OWNER TO postgres;

--
-- Name: groups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.groups_id_seq OWNER TO postgres;

--
-- Name: groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.groups_id_seq OWNED BY public.groups.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer,
    notif_key character varying(200) NOT NULL,
    message text NOT NULL,
    type character varying(30) DEFAULT 'upcoming_session'::character varying,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: parent_students; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.parent_students (
    id integer NOT NULL,
    parent_id integer,
    student_id integer,
    relationship character varying(50) DEFAULT 'parent'::character varying,
    is_primary boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.parent_students OWNER TO postgres;

--
-- Name: parent_students_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.parent_students_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.parent_students_id_seq OWNER TO postgres;

--
-- Name: parent_students_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.parent_students_id_seq OWNED BY public.parent_students.id;


--
-- Name: session_schedule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.session_schedule (
    id integer NOT NULL,
    group_id integer,
    session_number integer NOT NULL,
    session_title character varying(200),
    session_date date,
    status character varying(20) DEFAULT 'scheduled'::character varying,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    week_number integer,
    start_time time without time zone,
    end_time time without time zone,
    actual_date date,
    is_modified boolean DEFAULT false,
    is_cancelled boolean DEFAULT false,
    cancellation_reason text,
    CONSTRAINT session_schedule_status_check CHECK (((status)::text = ANY ((ARRAY['scheduled'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.session_schedule OWNER TO postgres;

--
-- Name: COLUMN session_schedule.session_number; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.session_schedule.session_number IS 'Numéro de séance (1, 2, 3...) - indépendant des semaines';


--
-- Name: COLUMN session_schedule.week_number; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.session_schedule.week_number IS 'Semaine du cycle (1-8) - pour organisation seulement';


--
-- Name: session_schedule_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.session_schedule_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.session_schedule_id_seq OWNER TO postgres;

--
-- Name: session_schedule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.session_schedule_id_seq OWNED BY public.session_schedule.id;


--
-- Name: student_notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_notes (
    id integer NOT NULL,
    group_student_id integer,
    author_id integer,
    note_text text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    note_type character varying(20) DEFAULT 'general'::character varying,
    is_important boolean DEFAULT false,
    is_private boolean DEFAULT false,
    CONSTRAINT student_notes_note_type_check CHECK (((note_type)::text = ANY ((ARRAY['general'::character varying, 'behavior'::character varying, 'progress'::character varying, 'attendance'::character varying, 'payment'::character varying])::text[])))
);


ALTER TABLE public.student_notes OWNER TO postgres;

--
-- Name: student_notes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.student_notes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.student_notes_id_seq OWNER TO postgres;

--
-- Name: student_notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.student_notes_id_seq OWNED BY public.student_notes.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    birthday date,
    city character varying(100),
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    phone character varying(20),
    gender character(1),
    role character varying(20) DEFAULT 'student'::character varying,
    parent_phone character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    photo_url character varying(255),
    CONSTRAINT users_gender_check CHECK ((gender = ANY (ARRAY['M'::bpchar, 'F'::bpchar]))),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['student'::character varying, 'admin'::character varying, 'Parent'::character varying, 'teacher'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: v_enrollments_full; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_enrollments_full AS
 SELECT gs.id AS enrollment_id,
    gs.student_id,
    s.name AS student_name,
    s.last_name AS student_last_name,
    gs.group_id,
    g.group_name,
    c.id AS course_id,
    c.title AS course_title,
    c.education_level,
    c.year_level,
    c.branch,
    c.price,
    u.name AS teacher_name,
    u.last_name AS teacher_last_name,
    u.gender AS teacher_gender,
    gs.status AS enrollment_status,
    gs.payment_status,
    gs.amount_paid,
    gs.enrollment_date,
    gs.enrollment_type,
    gs.requested_by,
    req.name AS requester_name
   FROM (((((public.group_students gs
     JOIN public.users s ON ((gs.student_id = s.id)))
     JOIN public.groups g ON ((gs.group_id = g.id)))
     JOIN public.courses c ON ((g.course_id = c.id)))
     LEFT JOIN public.users u ON ((c.teacher_id = u.id)))
     LEFT JOIN public.users req ON ((gs.requested_by = req.id)));


ALTER TABLE public.v_enrollments_full OWNER TO postgres;

--
-- Name: v_group_sessions_full; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_group_sessions_full AS
 SELECT g.id AS group_id,
    g.group_name,
    g.calendar_type,
    g.total_weeks,
    g.repeat_calendar,
    g.current_cycle,
    c.id AS course_id,
    c.title AS course_title,
    c.course_type,
    ss.id AS session_id,
    ss.session_number,
    ss.session_title,
    ss.week_number,
    ss.session_date,
    ss.actual_date,
    ss.start_time,
    ss.end_time,
    ss.status,
    ss.is_modified,
    ss.is_cancelled,
    ss.cancellation_reason,
    ss.notes,
    ( SELECT count(*) AS count
           FROM public.group_students
          WHERE ((group_students.group_id = g.id) AND ((group_students.status)::text = 'active'::text))) AS enrolled_students
   FROM ((public.groups g
     JOIN public.courses c ON ((g.course_id = c.id)))
     LEFT JOIN public.session_schedule ss ON ((g.id = ss.group_id)))
  ORDER BY g.id, ss.week_number, ss.session_number;


ALTER TABLE public.v_group_sessions_full OWNER TO postgres;

--
-- Name: v_group_students_detailed; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_group_students_detailed AS
 SELECT gs.id AS enrollment_id,
    gs.group_id,
    g.group_name,
    gs.student_id,
    s.name,
    s.last_name,
    s.email,
    s.parent_phone,
    s.gender,
    gs.status,
    gs.payment_status,
    gs.amount_paid,
    gs.payment_due,
    gs.payment_deadline,
    gs.enrollment_date,
    c.price AS course_price,
    ( SELECT count(*) AS count
           FROM public.student_notes
          WHERE (student_notes.group_student_id = gs.id)) AS notes_count,
    ( SELECT json_agg(json_build_object('id', sn.id, 'text', sn.note_text, 'type', sn.note_type, 'author', (((u.name)::text || ' '::text) || (u.last_name)::text), 'author_role', u.role, 'created_at', sn.created_at, 'is_important', sn.is_important) ORDER BY sn.created_at DESC) AS json_agg
           FROM (public.student_notes sn
             LEFT JOIN public.users u ON ((sn.author_id = u.id)))
          WHERE (sn.group_student_id = gs.id)) AS notes
   FROM (((public.group_students gs
     JOIN public.users s ON ((gs.student_id = s.id)))
     JOIN public.groups g ON ((gs.group_id = g.id)))
     JOIN public.courses c ON ((g.course_id = c.id)))
  ORDER BY s.last_name, s.name;


ALTER TABLE public.v_group_students_detailed OWNER TO postgres;

--
-- Name: v_groups_with_cycles; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_groups_with_cycles AS
 SELECT g.id,
    g.course_id,
    g.group_name,
    g.start_date,
    g.start_time,
    g.end_time,
    g.day_of_week,
    g.session_start_time,
    g.session_end_time,
    g.registration_open,
    g.current_students,
    g.is_active,
    g.created_at,
    g.updated_at,
    g.salle,
    g.calendar_type,
    g.total_weeks,
    g.repeat_calendar,
    g.current_cycle,
    g.total_sessions,
    g.sessions_per_week,
    g.has_next_cycle_modifications,
    g.next_cycle_modifications,
    g.return_to_normal_after_cycle,
    g.modified_cycle_count,
    ( SELECT count(*) AS count
           FROM public.session_schedule
          WHERE (session_schedule.group_id = g.id)) AS current_sessions_count,
    ( SELECT count(*) AS count
           FROM public.group_students
          WHERE ((group_students.group_id = g.id) AND ((group_students.status)::text = 'active'::text))) AS enrolled_students,
        CASE
            WHEN g.has_next_cycle_modifications THEN ((g.next_cycle_modifications ->> 'total_sessions'::text))::integer
            ELSE g.total_sessions
        END AS next_cycle_sessions,
        CASE
            WHEN g.has_next_cycle_modifications THEN (g.next_cycle_modifications ->> 'reason'::text)
            ELSE NULL::text
        END AS next_cycle_reason
   FROM public.groups g;


ALTER TABLE public.v_groups_with_cycles OWNER TO postgres;

--
-- Name: v_parent_student_relationships; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_parent_student_relationships AS
 SELECT p.id AS parent_id,
    p.name AS parent_name,
    p.last_name AS parent_last_name,
    p.email AS parent_email,
    p.phone AS parent_phone,
    s.id AS student_id,
    s.name AS student_name,
    s.last_name AS student_last_name,
    s.email AS student_email,
    s.birthday AS student_birthday,
    ps.relationship,
    ps.is_primary,
    ps.created_at AS link_created_at
   FROM ((public.parent_students ps
     JOIN public.users p ON ((ps.parent_id = p.id)))
     JOIN public.users s ON ((ps.student_id = s.id)))
  WHERE (((p.role)::text = 'Parent'::text) AND ((s.role)::text = 'student'::text));


ALTER TABLE public.v_parent_student_relationships OWNER TO postgres;

--
-- Name: v_sessions_detailed; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_sessions_detailed AS
 SELECT ss.id AS session_id,
    ss.group_id,
    g.group_name,
    g.current_cycle,
    ss.session_number,
    ss.session_title,
    ss.week_number,
    ss.session_date,
    ss.actual_date,
    ss.start_time,
    ss.end_time,
    ss.status,
    ss.is_modified,
    ss.is_cancelled,
    ss.cancellation_reason,
    c.id AS course_id,
    c.title AS course_title,
    c.course_type
   FROM ((public.session_schedule ss
     JOIN public.groups g ON ((ss.group_id = g.id)))
     JOIN public.courses c ON ((g.course_id = c.id)))
  ORDER BY g.id, ss.session_number;


ALTER TABLE public.v_sessions_detailed OWNER TO postgres;

--
-- Name: v_student_notes_full; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_student_notes_full AS
 SELECT sn.id AS note_id,
    sn.note_text,
    sn.note_type,
    sn.is_important,
    sn.is_private,
    sn.created_at,
    gs.id AS enrollment_id,
    gs.student_id,
    s.name AS student_name,
    s.last_name AS student_last_name,
    s.email AS student_email,
    g.id AS group_id,
    g.group_name,
    c.id AS course_id,
    c.title AS course_title,
    author.id AS author_id,
    author.name AS author_name,
    author.last_name AS author_last_name,
    author.role AS author_role,
    author.gender AS author_gender
   FROM (((((public.student_notes sn
     JOIN public.group_students gs ON ((sn.group_student_id = gs.id)))
     JOIN public.users s ON ((gs.student_id = s.id)))
     JOIN public.groups g ON ((gs.group_id = g.id)))
     JOIN public.courses c ON ((g.course_id = c.id)))
     LEFT JOIN public.users author ON ((sn.author_id = author.id)))
  ORDER BY sn.created_at DESC;


ALTER TABLE public.v_student_notes_full OWNER TO postgres;

--
-- Name: attendance_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_log ALTER COLUMN id SET DEFAULT nextval('public.attendance_log_id_seq'::regclass);


--
-- Name: course_materials id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_materials ALTER COLUMN id SET DEFAULT nextval('public.course_materials_id_seq'::regclass);


--
-- Name: courses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses ALTER COLUMN id SET DEFAULT nextval('public.courses_id_seq'::regclass);


--
-- Name: favorites id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites ALTER COLUMN id SET DEFAULT nextval('public.favorites_id_seq'::regclass);


--
-- Name: group_students id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_students ALTER COLUMN id SET DEFAULT nextval('public.group_students_id_seq'::regclass);


--
-- Name: groups id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups ALTER COLUMN id SET DEFAULT nextval('public.groups_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: parent_students id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parent_students ALTER COLUMN id SET DEFAULT nextval('public.parent_students_id_seq'::regclass);


--
-- Name: session_schedule id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_schedule ALTER COLUMN id SET DEFAULT nextval('public.session_schedule_id_seq'::regclass);


--
-- Name: student_notes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_notes ALTER COLUMN id SET DEFAULT nextval('public.student_notes_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: attendance_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance_log (id, group_id, student_id, scanned_at, session_number, scanned_by) FROM stdin;
\.


--
-- Data for Name: course_materials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_materials (id, course_id, teacher_id, title, description, file_name, file_path, file_type, file_size, uploaded_at) FROM stdin;
\.


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.courses (id, title, teacher_id, description, education_level, year_level, branch, course_type, sessions_per_month, duration_hours, max_students_per_group, price, salle, is_active, created_at, updated_at) FROM stdin;
21	hhh	3	hhh	primaire	1	\N	continuous	\N	\N	30	0.00	hhh	t	2026-05-19 18:40:59.507444	2026-05-19 18:40:59.507444
\.


--
-- Data for Name: favorites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.favorites (id, user_id, course_id, created_at) FROM stdin;
\.


--
-- Data for Name: group_students; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.group_students (id, group_id, student_id, status, payment_status, amount_paid, enrollment_date, enrollment_type, requested_by, request_date, payment_due, payment_deadline, last_payment_date, sessions_attended, cycle_start_date) FROM stdin;
45	31	16	active	paid	0.00	2026-05-19 19:16:51.880311	direct	1	\N	0.00	\N	2026-05-19	0	2026-05-19 19:16:51.880311
\.


--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.groups (id, course_id, group_name, start_date, start_time, end_time, day_of_week, session_start_time, session_end_time, registration_open, current_students, is_active, created_at, updated_at, salle, calendar_type, total_weeks, repeat_calendar, current_cycle, total_sessions, sessions_per_week, has_next_cycle_modifications, next_cycle_modifications, return_to_normal_after_cycle, modified_cycle_count) FROM stdin;
31	21	hhh	\N	\N	\N	saturday	09:00:00	11:00:00	t	1	t	2026-05-19 19:16:36.03146	2026-05-19 19:16:36.03146	hhh	weekly_fixed	4	f	1	4	1	f	\N	t	0
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, notif_key, message, type, is_read, created_at) FROM stdin;
2	2	welcome_teacher_2	مرحباً أستاذ محمد بنعلي! تم تعيينك في 3 مواد: رياضيات.	welcome	f	2026-04-25 18:34:54.086817
3	3	welcome_teacher_3	مرحباً أستاذة فاطمة حداد! تم تعيينك في مادتي العربية والفلسفة.	welcome	f	2026-04-25 18:34:54.086817
4	4	welcome_teacher_4	مرحباً أستاذ يوسف مبارك! تم تعيينك في الفيزياء.	welcome	f	2026-04-25 18:34:54.086817
5	5	welcome_teacher_5	مرحباً أستاذة سميرة والي! تم تعيينك في مادة الإنجليزية.	welcome	f	2026-04-25 18:34:54.086817
6	10	welcome_student_10	مرحباً أمين! أنت مسجّل في رياضيات 4 ابتدائي. حصتك كل سبت 9:00.	welcome	f	2026-04-25 18:34:54.086817
7	11	welcome_student_11	مرحباً رانيا! أنت مسجّلة في رياضيات 4 ابتدائي.	welcome	f	2026-04-25 18:34:54.086817
8	14	notif_overdue_14	⚠️ لم يتم تسديد قسط شهر أبريل لمادة الرياضيات. يرجى التواصل مع الإدارة.	warning	f	2026-04-25 18:34:54.086817
9	18	welcome_student_18	مرحباً خالد! أنت مسجّل في مادتين هذا الموسم.	welcome	f	2026-04-25 18:34:54.086817
10	29	notif_suspended_29	⚠️ تم تعليق تسجيلك في مادة اللغة العربية بسبب التأخر في الدفع. تواصل مع الإدارة.	warning	f	2026-04-25 18:34:54.086817
11	50	welcome_parent_50	مرحباً! يمكنك متابعة أبنائك أمين وإلياس من خلال لوحة الأولياء.	welcome	f	2026-04-25 18:34:54.086817
12	51	welcome_parent_51	مرحباً! يمكنك متابعة ابنتك رانيا من خلال لوحة الأولياء.	welcome	f	2026-04-25 18:34:54.086817
14	3	course_assigned_21_1779212459518	<i class="fa-solid fa-book"></i> تم تعيينك كأستاذ لمادة جديدة: "hhh" — يمكنك الآن رؤيتها في لوحة القيادة.	assignment	f	2026-05-19 18:40:59.519271
16	3	group_created_teacher_31_1779214596047	 تم إنشاء مجموعة جديدة "hhh" لمادتك "hhh"  .	assignment	f	2026-05-19 19:16:36.048775
17	16	enrolled_student_31_16_1779214611899	🎓 تم تسجيلك في مادة "hhh" — يوم saturday الساعة 09:00:00، القاعة: hhh. أستاذك: أ. Fatima Haddad.	assignment	f	2026-05-19 19:16:51.899741
18	3	enrolled_teacher_31_16_1779214611899	👤 انضم طالب جديد "Hamza Bentoumi" إلى مجموعتك "hhh" في مادة "hhh".	info	f	2026-05-19 19:16:51.913487
15	1	course_new_admin_21_1779212459518_a1	✅ تم إنشاء مادة جديدة: "hhh" وتعيينها للأستاذ Fatima Haddad.	info	t	2026-05-19 18:40:59.52671
13	1	welcome_1_2026-05-19	مرحباً بك في لوحة الإدارة! يمكنك الآن رؤية إشعاراتك هنا وعلى جهازك.	welcome	t	2026-05-19 18:40:07.226595
1	1	welcome_admin_seed	مرحباً بك في لوحة الإدارة يا كريم! البيانات التجريبية جاهزة.	welcome	t	2026-04-25 18:34:54.086817
\.


--
-- Data for Name: parent_students; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.parent_students (id, parent_id, student_id, relationship, is_primary, created_at) FROM stdin;
5	50	10	parent	t	2026-04-25 18:34:54.07831
6	51	11	parent	t	2026-04-25 18:34:54.07831
7	52	14	parent	t	2026-04-25 18:34:54.07831
8	53	17	parent	t	2026-04-25 18:34:54.07831
9	54	18	parent	t	2026-04-25 18:34:54.07831
10	50	12	parent	t	2026-04-25 18:34:54.07831
\.


--
-- Data for Name: session_schedule; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.session_schedule (id, group_id, session_number, session_title, session_date, status, notes, created_at, week_number, start_time, end_time, actual_date, is_modified, is_cancelled, cancellation_reason) FROM stdin;
\.


--
-- Data for Name: student_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_notes (id, group_student_id, author_id, note_text, created_at, note_type, is_important, is_private) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, last_name, birthday, city, email, password, phone, gender, role, parent_phone, created_at, photo_url) FROM stdin;
1	Admin	Belmahi	1980-03-15	Oran	admin@belmahi.dz	Admin@1234	0550000001	M	admin	\N	2026-04-25 18:34:54.043273	\N
2	Mohamed	Benali	1985-06-20	Oran	benali@belmahi.dz	Teacher@1234	0550000002	M	teacher	\N	2026-04-25 18:34:54.043273	\N
3	Fatima	Haddad	1990-09-10	Oran	haddad@belmahi.dz	Teacher@1234	0550000003	F	teacher	\N	2026-04-25 18:34:54.043273	\N
4	Youcef	Mebarki	1988-01-25	Mascara	mebarki@belmahi.dz	Teacher@1234	0550000004	M	teacher	\N	2026-04-25 18:34:54.043273	\N
5	Samira	Ouali	1992-11-05	Oran	ouali@belmahi.dz	Teacher@1234	0550000005	F	teacher	\N	2026-04-25 18:34:54.043273	\N
10	Amine	Bekkouche	2012-04-01	Oran	amine.bek@gmail.com	Pass@1234	0660000010	M	student	\N	2026-04-25 18:34:54.043273	\N
11	Rania	Zaoui	2011-07-15	Oran	rania.z@gmail.com	Pass@1234	0660000011	F	student	\N	2026-04-25 18:34:54.043273	\N
12	Ilyas	Bouchenak	2013-02-20	Oran	ilyas.b@gmail.com	Pass@1234	0660000012	M	student	\N	2026-04-25 18:34:54.043273	\N
13	Nour	Khelifi	2010-09-30	Mostaganem	nour.kh@gmail.com	Pass@1234	0660000013	F	student	\N	2026-04-25 18:34:54.043273	\N
14	Sami	Reghioua	2012-12-05	Oran	sami.r@gmail.com	Pass@1234	0660000014	M	student	\N	2026-04-25 18:34:54.043273	\N
15	Yasmine	Derbal	2011-03-18	Oran	yasmine.d@gmail.com	Pass@1234	0660000015	F	student	\N	2026-04-25 18:34:54.043273	\N
16	Hamza	Bentoumi	2010-06-22	Sidi Bel Abbes	hamza.bt@gmail.com	Pass@1234	0660000016	M	student	\N	2026-04-25 18:34:54.043273	\N
17	Lina	Mansouri	2013-01-11	Oran	lina.m@gmail.com	Pass@1234	0660000017	F	student	\N	2026-04-25 18:34:54.043273	\N
18	Khaled	Aissaoui	2009-08-09	Oran	khaled.a@gmail.com	Pass@1234	0660000018	M	student	\N	2026-04-25 18:34:54.043273	\N
19	Meriem	Taleb	2010-05-27	Arzew	meriem.t@gmail.com	Pass@1234	0660000019	F	student	\N	2026-04-25 18:34:54.043273	\N
20	Bilal	Ferroudj	2012-10-03	Oran	bilal.f@gmail.com	Pass@1234	0660000020	M	student	\N	2026-04-25 18:34:54.043273	\N
21	Sara	Boudia	2011-11-14	Oran	sara.bd@gmail.com	Pass@1234	0660000021	F	student	\N	2026-04-25 18:34:54.043273	\N
22	Adel	Chouaib	2009-03-07	Tlemcen	adel.ch@gmail.com	Pass@1234	0660000022	M	student	\N	2026-04-25 18:34:54.043273	\N
23	Hana	Meziane	2013-07-19	Oran	hana.mz@gmail.com	Pass@1234	0660000023	F	student	\N	2026-04-25 18:34:54.043273	\N
24	Yassine	Bouabdallah	2010-04-28	Oran	yassine.bo@gmail.com	Pass@1234	0660000024	M	student	\N	2026-04-25 18:34:54.043273	\N
25	Amira	Kaddour	2012-09-16	Oran	amira.k@gmail.com	Pass@1234	0660000025	F	student	\N	2026-04-25 18:34:54.043273	\N
26	Rayan	Boudjelal	2011-02-03	Oran	rayan.bj@gmail.com	Pass@1234	0660000026	M	student	\N	2026-04-25 18:34:54.043273	\N
27	Ghania	Sebaa	2010-12-21	Mascara	ghania.s@gmail.com	Pass@1234	0660000027	F	student	\N	2026-04-25 18:34:54.043273	\N
28	Omar	Ladj	2013-06-08	Oran	omar.l@gmail.com	Pass@1234	0660000028	M	student	\N	2026-04-25 18:34:54.043273	\N
29	Dounia	Benhamed	2009-10-30	Oran	dounia.bh@gmail.com	Pass@1234	0660000029	F	student	\N	2026-04-25 18:34:54.043273	\N
50	Abdelkader	Bekkouche	1975-04-01	Oran	parent.bek@gmail.com	Parent@1234	0770000050	M	Parent	\N	2026-04-25 18:34:54.043273	\N
51	Houria	Zaoui	1978-07-15	Oran	parent.zaoui@gmail.com	Parent@1234	0770000051	F	Parent	\N	2026-04-25 18:34:54.043273	\N
52	Rachid	Reghioua	1972-12-05	Oran	parent.reg@gmail.com	Parent@1234	0770000052	M	Parent	\N	2026-04-25 18:34:54.043273	\N
53	Nadia	Mansouri	1980-01-11	Oran	parent.man@gmail.com	Parent@1234	0770000053	F	Parent	\N	2026-04-25 18:34:54.043273	\N
54	Salim	Aissaoui	1970-08-09	Oran	parent.ais@gmail.com	Parent@1234	0770000054	M	Parent	\N	2026-04-25 18:34:54.043273	\N
\.


--
-- Name: attendance_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attendance_log_id_seq', 1, false);


--
-- Name: course_materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.course_materials_id_seq', 17, true);


--
-- Name: courses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.courses_id_seq', 21, true);


--
-- Name: favorites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.favorites_id_seq', 13, true);


--
-- Name: group_students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.group_students_id_seq', 45, true);


--
-- Name: groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.groups_id_seq', 31, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 18, true);


--
-- Name: parent_students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.parent_students_id_seq', 10, true);


--
-- Name: session_schedule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.session_schedule_id_seq', 21, true);


--
-- Name: student_notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_notes_id_seq', 5, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 100, true);


--
-- Name: attendance_log attendance_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_log
    ADD CONSTRAINT attendance_log_pkey PRIMARY KEY (id);


--
-- Name: course_materials course_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_materials
    ADD CONSTRAINT course_materials_pkey PRIMARY KEY (id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_user_id_course_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_course_id_key UNIQUE (user_id, course_id);


--
-- Name: group_students group_students_group_id_student_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_students
    ADD CONSTRAINT group_students_group_id_student_id_key UNIQUE (group_id, student_id);


--
-- Name: group_students group_students_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_students
    ADD CONSTRAINT group_students_pkey PRIMARY KEY (id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_notif_key_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_notif_key_unique UNIQUE (notif_key);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_user_id_notif_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_notif_key_key UNIQUE (user_id, notif_key);


--
-- Name: notifications notifications_user_notif_key_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_notif_key_unique UNIQUE (user_id, notif_key);


--
-- Name: parent_students parent_students_parent_id_student_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parent_students
    ADD CONSTRAINT parent_students_parent_id_student_id_key UNIQUE (parent_id, student_id);


--
-- Name: parent_students parent_students_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parent_students
    ADD CONSTRAINT parent_students_pkey PRIMARY KEY (id);


--
-- Name: session_schedule session_schedule_group_id_session_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_schedule
    ADD CONSTRAINT session_schedule_group_id_session_number_key UNIQUE (group_id, session_number);


--
-- Name: session_schedule session_schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_schedule
    ADD CONSTRAINT session_schedule_pkey PRIMARY KEY (id);


--
-- Name: student_notes student_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_notes
    ADD CONSTRAINT student_notes_pkey PRIMARY KEY (id);


--
-- Name: session_schedule unique_group_session; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_schedule
    ADD CONSTRAINT unique_group_session UNIQUE (group_id, session_number);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_att_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_att_date ON public.attendance_log USING btree (group_id, ((scanned_at)::date));


--
-- Name: idx_att_group_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_att_group_student ON public.attendance_log USING btree (group_id, student_id);


--
-- Name: idx_att_no_double_scan; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_att_no_double_scan ON public.attendance_log USING btree (group_id, student_id, ((scanned_at)::date));


--
-- Name: idx_course_materials_course; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_course_materials_course ON public.course_materials USING btree (course_id);


--
-- Name: idx_course_materials_teacher; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_course_materials_teacher ON public.course_materials USING btree (teacher_id);


--
-- Name: idx_courses_level; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_courses_level ON public.courses USING btree (education_level, year_level);


--
-- Name: idx_courses_teacher; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_courses_teacher ON public.courses USING btree (teacher_id);


--
-- Name: idx_favorites_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_favorites_user ON public.favorites USING btree (user_id);


--
-- Name: idx_group_students_group; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_group_students_group ON public.group_students USING btree (group_id);


--
-- Name: idx_group_students_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_group_students_student ON public.group_students USING btree (student_id);


--
-- Name: idx_groups_course; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_groups_course ON public.groups USING btree (course_id);


--
-- Name: idx_groups_cycle_modifications; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_groups_cycle_modifications ON public.groups USING btree (has_next_cycle_modifications) WHERE (has_next_cycle_modifications = true);


--
-- Name: idx_gs_sessions_attended; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_gs_sessions_attended ON public.group_students USING btree (group_id, sessions_attended);


--
-- Name: idx_notifications_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_created ON public.notifications USING btree (created_at DESC);


--
-- Name: idx_notifications_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_read ON public.notifications USING btree (user_id, is_read);


--
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id);


--
-- Name: idx_parent_students_parent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_parent_students_parent ON public.parent_students USING btree (parent_id);


--
-- Name: idx_parent_students_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_parent_students_student ON public.parent_students USING btree (student_id);


--
-- Name: idx_session_schedule_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_session_schedule_date ON public.session_schedule USING btree (session_date);


--
-- Name: idx_session_schedule_group; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_session_schedule_group ON public.session_schedule USING btree (group_id);


--
-- Name: idx_session_schedule_session_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_session_schedule_session_number ON public.session_schedule USING btree (group_id, session_number);


--
-- Name: idx_session_schedule_week; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_session_schedule_week ON public.session_schedule USING btree (week_number);


--
-- Name: attendance_log attendance_log_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_log
    ADD CONSTRAINT attendance_log_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: attendance_log attendance_log_scanned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_log
    ADD CONSTRAINT attendance_log_scanned_by_fkey FOREIGN KEY (scanned_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: attendance_log attendance_log_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_log
    ADD CONSTRAINT attendance_log_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: course_materials course_materials_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_materials
    ADD CONSTRAINT course_materials_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: course_materials course_materials_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_materials
    ADD CONSTRAINT course_materials_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: courses courses_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: favorites favorites_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: favorites favorites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: group_students group_students_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_students
    ADD CONSTRAINT group_students_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: group_students group_students_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_students
    ADD CONSTRAINT group_students_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: group_students group_students_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_students
    ADD CONSTRAINT group_students_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: groups groups_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: parent_students parent_students_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parent_students
    ADD CONSTRAINT parent_students_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: parent_students parent_students_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parent_students
    ADD CONSTRAINT parent_students_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: session_schedule session_schedule_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_schedule
    ADD CONSTRAINT session_schedule_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: student_notes student_notes_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_notes
    ADD CONSTRAINT student_notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: student_notes student_notes_group_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_notes
    ADD CONSTRAINT student_notes_group_student_id_fkey FOREIGN KEY (group_student_id) REFERENCES public.group_students(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 6I28pWHr7AvxnwZR5evJ8Ix3qlxl9GXC29QlG58rHPbKZI7rjuTbeyx8cj62CER

