--
-- PostgreSQL database dump
--

\restrict RBwvEQnDrfbdBGhIRWaV2s0VWCM1I65aT5brdGAerP1i1aWvNFH6eu4aJEDfR8K

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
-- Data for Name: course_materials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_materials (id, course_id, teacher_id, title, description, file_name, file_path, file_type, file_size, uploaded_at) FROM stdin;
1	5	2	k	k	1770740697549-164501080-ss.jpg	/uploads/1770740697549-164501080-ss.jpg	image/jpeg	39099	2026-02-10 17:24:57.622619
15	5	2	f	f	1771243020009-576701460-Liste-des-Enseignants-avec-Ã©mail_250126_163235-1.pdf	/uploads/1771243020009-576701460-Liste-des-Enseignants-avec-Ã©mail_250126_163235-1.pdf	application/pdf	880765	2026-02-16 12:57:00.06313
16	7	16	exemple	ex	1771245048830-430400902-Liste-des-Enseignants-avec-Ã©mail_250126_163235-1.pdf	/uploads/1771245048830-430400902-Liste-des-Enseignants-avec-Ã©mail_250126_163235-1.pdf	application/pdf	880765	2026-02-16 13:30:48.899888
17	12	16	fdgfhg	dgfhgjhk	1774536137525-272604347-Screenshot 2026-03-26 15.42.02.png	/uploads/1774536137525-272604347-Screenshot 2026-03-26 15.42.02.png	image/png	237362	2026-03-26 15:42:17.575354
\.


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: postgres
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
-- Data for Name: favorites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.favorites (id, user_id, course_id, created_at) FROM stdin;
9	1	10	2026-02-23 13:39:24.981081
\.


--
-- Data for Name: group_students; Type: TABLE DATA; Schema: public; Owner: postgres
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
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: postgres
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
-- Data for Name: parent_students; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.parent_students (id, parent_id, student_id, relationship, is_primary, created_at) FROM stdin;
1	9	13	parent	t	2026-02-07 18:52:21.252639
2	9	14	parent	t	2026-02-07 18:52:21.252639
3	20	21	parent	t	2026-02-13 19:12:45.955529
4	20	22	parent	t	2026-02-13 19:12:45.955529
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
5	31	16	fchgjvhkjk	2026-02-25 14:49:21.737177	general	t	f
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
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
-- Name: course_materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.course_materials_id_seq', 17, true);


--
-- Name: courses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.courses_id_seq', 12, true);


--
-- Name: favorites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.favorites_id_seq', 9, true);


--
-- Name: group_students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.group_students_id_seq', 31, true);


--
-- Name: groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.groups_id_seq', 19, true);


--
-- Name: parent_students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.parent_students_id_seq', 4, true);


--
-- Name: session_schedule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.session_schedule_id_seq', 7, true);


--
-- Name: student_notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_notes_id_seq', 5, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 26, true);


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

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  notif_key VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(30) DEFAULT 'upcoming_session',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, notif_key)
);

ALTER TABLE notifications ADD CONSTRAINT notifications_notif_key_unique UNIQUE (notif_key);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);

-- migration_fix_notifications.sql
-- Run this once on your PostgreSQL database to fix the conflicting UNIQUE constraints
-- on the notifications table.
--
-- THE PROBLEM:
--   You have TWO unique constraints that conflict with each other:
--     1. UNIQUE(user_id, notif_key)  — pair must be unique
--     2. UNIQUE(notif_key)           — notif_key alone must be globally unique
--
--   The server.js cron was using ON CONFLICT (notif_key) DO NOTHING, which only
--   works if notif_key is globally unique — but the same notif_key was being reused
--   for different users (e.g. student_15min_group5_2026-04-22 for BOTH student and teacher).
--   This caused silent insert failures.
--
-- THE FIX:
--   1. Drop the global notif_key unique constraint (keep only user_id + notif_key pair)
--   2. The new server.js now generates per-user notif_keys (e.g. _s42, _t7, _a1 suffix)
--      so ON CONFLICT (notif_key) works correctly with the global unique constraint.
--
-- ─────────────────────────────────────────────────────────────────────────────

-- Step 1: Drop the problematic global unique constraint on notif_key alone
-- (The constraint name from your bdd.sql is notifications_notif_key_unique)
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_notif_key_unique;

-- Step 2: Ensure the composite unique constraint exists (user_id + notif_key pair)
-- This was already defined in CREATE TABLE as UNIQUE(user_id, notif_key)
-- We just make sure it exists with a known name:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'notifications_user_notif_key_unique'
    AND conrelid = 'notifications'::regclass
  ) THEN
    ALTER TABLE notifications
      ADD CONSTRAINT notifications_user_notif_key_unique UNIQUE (user_id, notif_key);
  END IF;
END $$;

-- Step 3: Add the global notif_key unique constraint BACK
-- Now it works because server.js generates user-specific keys (suffix _s{id}, _t{id} etc.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'notifications_notif_key_unique'
    AND conrelid = 'notifications'::regclass
  ) THEN
    ALTER TABLE notifications
      ADD CONSTRAINT notifications_notif_key_unique UNIQUE (notif_key);
  END IF;
END $$;

-- Step 4: Add the 'type' column default for 'reminder' (in case it's missing)
ALTER TABLE notifications
  ALTER COLUMN type SET DEFAULT 'upcoming_session';

-- Step 5: Verify indexes exist
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
ALTER TABLE group_students ADD COLUMN status VARCHAR(20) DEFAULT 'active';
-- Done!
SELECT 'Migration complete. Notification constraints are now correct.' AS status;
\unrestrict RBwvEQnDrfbdBGhIRWaV2s0VWCM1I65aT5brdGAerP1i1aWvNFH6eu4aJEDfR8K

