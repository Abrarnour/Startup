--
-- PostgreSQL database dump
--

\restrict 96XH3khhjLpHXfNHd8OVm6QddabIr8SqI7RbrKjlSwO0pLztH5tqqYUfl6ODGSt

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    id integer NOT NULL,
    tenant_id integer,
    plan_id integer,
    amount_dzd numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    due_date date,
    paid_at timestamp without time zone,
    note text,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT invoices_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'overdue'::character varying])::text[])))
);


ALTER TABLE public.invoices OWNER TO postgres;

--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.invoices_id_seq OWNER TO postgres;

--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- Name: plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plans (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    name_ar character varying(100),
    price_dzd numeric(10,2) DEFAULT 0,
    max_students integer DEFAULT 100,
    max_teachers integer DEFAULT 10,
    features jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.plans OWNER TO postgres;

--
-- Name: plans_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.plans_id_seq OWNER TO postgres;

--
-- Name: plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.plans_id_seq OWNED BY public.plans.id;


--
-- Name: platform_admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.platform_admins (
    id integer NOT NULL,
    email character varying(150) NOT NULL,
    password_hash text NOT NULL,
    name character varying(100),
    role character varying(30) DEFAULT 'admin'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.platform_admins OWNER TO postgres;

--
-- Name: platform_admins_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.platform_admins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.platform_admins_id_seq OWNER TO postgres;

--
-- Name: platform_admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.platform_admins_id_seq OWNED BY public.platform_admins.id;


--
-- Name: platform_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.platform_logs (
    id integer NOT NULL,
    tenant_id integer,
    admin_id integer,
    action character varying(100) NOT NULL,
    details jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.platform_logs OWNER TO postgres;

--
-- Name: platform_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.platform_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.platform_logs_id_seq OWNER TO postgres;

--
-- Name: platform_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.platform_logs_id_seq OWNED BY public.platform_logs.id;


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenants (
    id integer NOT NULL,
    slug character varying(50) NOT NULL,
    school_name character varying(150) NOT NULL,
    school_name_ar character varying(150),
    logo_url text,
    primary_color character varying(7) DEFAULT '#1a73e8'::character varying,
    secondary_color character varying(7) DEFAULT '#f5f5f5'::character varying,
    db_name character varying(80) DEFAULT ''::character varying NOT NULL,
    plan_id integer,
    status character varying(20) DEFAULT 'pending'::character varying,
    trial_ends_at timestamp without time zone,
    admin_email character varying(150) NOT NULL,
    admin_phone character varying(20),
    city character varying(80),
    country character varying(50) DEFAULT 'DZ'::character varying,
    onboarding_done boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    details jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT tenants_status_check CHECK (((status)::text = ANY (ARRAY['pending'::text, 'trial'::text, 'active'::text, 'suspended'::text, 'cancelled'::text])))
);


ALTER TABLE public.tenants OWNER TO postgres;

--
-- Name: tenants_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tenants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tenants_id_seq OWNER TO postgres;

--
-- Name: tenants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tenants_id_seq OWNED BY public.tenants.id;


--
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- Name: plans id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plans ALTER COLUMN id SET DEFAULT nextval('public.plans_id_seq'::regclass);


--
-- Name: platform_admins id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_admins ALTER COLUMN id SET DEFAULT nextval('public.platform_admins_id_seq'::regclass);


--
-- Name: platform_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_logs ALTER COLUMN id SET DEFAULT nextval('public.platform_logs_id_seq'::regclass);


--
-- Name: tenants id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants ALTER COLUMN id SET DEFAULT nextval('public.tenants_id_seq'::regclass);


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoices (id, tenant_id, plan_id, amount_dzd, status, due_date, paid_at, note, created_at) FROM stdin;
\.


--
-- Data for Name: plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.plans (id, name, name_ar, price_dzd, max_students, max_teachers, features, is_active, created_at) FROM stdin;
1	trial	تجريبية	0.00	30	3	{"materials": false, "timetable": true, "notifications": false}	t	2026-05-22 22:23:04.857239
2	basic	أساسية	3000.00	150	10	{"materials": true, "timetable": true, "notifications": false}	t	2026-05-22 22:23:04.857239
3	pro	احترافية	6000.00	500	30	{"materials": true, "timetable": true, "notifications": true}	t	2026-05-22 22:23:04.857239
4	enterprise	مؤسسية	12000.00	9999	999	{"api": true, "materials": true, "timetable": true, "notifications": true}	t	2026-05-22 22:23:04.857239
\.


--
-- Data for Name: platform_admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.platform_admins (id, email, password_hash, name, role, is_active, created_at) FROM stdin;
1	admin@platform.dz	$2b$10$atXaBgGk3L8aWiKIuv3ov.RcXq1rfPoWDKf8F0tNZasEBOWe3kDte	Super Admin	super_admin	t	2026-05-22 22:23:04.866702
\.


--
-- Data for Name: platform_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.platform_logs (id, tenant_id, admin_id, action, details, created_at) FROM stdin;
1	1	\N	tenant_registered_pending	{"email": "abrarlacida@gmail.com"}	2026-05-24 18:03:41.604741
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenants (id, slug, school_name, school_name_ar, logo_url, primary_color, secondary_color, db_name, plan_id, status, trial_ends_at, admin_email, admin_phone, city, country, onboarding_done, created_at, updated_at, details) FROM stdin;
1	abrar	Abrar	ابرار	\N	#971ce9	#f5f5f5		1	pending	\N	abrarlacida@gmail.com	07653543366	Oran	DZ	f	2026-05-24 18:03:41.589578	2026-05-24 18:03:41.589578	{"pending_hash": "$2b$10$VjNSXxABFr4C53PWumOHuex.opNXRdyZ2On0YlIMxGIZxaKFRSDiy"}
\.


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoices_id_seq', 1, false);


--
-- Name: plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.plans_id_seq', 4, true);


--
-- Name: platform_admins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.platform_admins_id_seq', 1, true);


--
-- Name: platform_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.platform_logs_id_seq', 1, true);


--
-- Name: tenants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tenants_id_seq', 3, true);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- Name: platform_admins platform_admins_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_admins
    ADD CONSTRAINT platform_admins_email_key UNIQUE (email);


--
-- Name: platform_admins platform_admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_admins
    ADD CONSTRAINT platform_admins_pkey PRIMARY KEY (id);


--
-- Name: platform_logs platform_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_logs
    ADD CONSTRAINT platform_logs_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_slug_key UNIQUE (slug);


--
-- Name: idx_invoices_tenant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_tenant ON public.invoices USING btree (tenant_id);


--
-- Name: idx_tenants_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tenants_slug ON public.tenants USING btree (slug);


--
-- Name: idx_tenants_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tenants_status ON public.tenants USING btree (status);


--
-- Name: tenants_db_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX tenants_db_name_key ON public.tenants USING btree (db_name) WHERE ((db_name IS NOT NULL) AND ((db_name)::text <> ''::text));


--
-- Name: invoices invoices_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id);


--
-- Name: invoices invoices_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: platform_logs platform_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_logs
    ADD CONSTRAINT platform_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.platform_admins(id);


--
-- Name: platform_logs platform_logs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_logs
    ADD CONSTRAINT platform_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: tenants tenants_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 96XH3khhjLpHXfNHd8OVm6QddabIr8SqI7RbrKjlSwO0pLztH5tqqYUfl6ODGSt

