--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

-- Started on 2025-07-30 01:08:59 UTC

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

ALTER TABLE ONLY public.withdrawal_requests DROP CONSTRAINT withdrawal_requests_provider_id_providers_id_fk;
ALTER TABLE ONLY public.withdrawal_requests DROP CONSTRAINT withdrawal_requests_processed_by_users_id_fk;
ALTER TABLE ONLY public.withdrawal_requests DROP CONSTRAINT withdrawal_requests_pix_key_id_provider_pix_keys_id_fk;
ALTER TABLE ONLY public.withdrawal_requests DROP CONSTRAINT withdrawal_requests_bank_account_id_provider_bank_accounts_id_f;
ALTER TABLE ONLY public.user_upload_stats DROP CONSTRAINT user_upload_stats_user_id_users_id_fk;
ALTER TABLE ONLY public.service_requests DROP CONSTRAINT service_requests_provider_id_providers_id_fk;
ALTER TABLE ONLY public.service_requests DROP CONSTRAINT service_requests_client_id_users_id_fk;
ALTER TABLE ONLY public.service_requests DROP CONSTRAINT service_requests_category_id_service_categories_id_fk;
ALTER TABLE ONLY public.service_assignments DROP CONSTRAINT service_assignments_service_request_id_service_requests_id_fk;
ALTER TABLE ONLY public.service_assignments DROP CONSTRAINT service_assignments_employee_id_employees_id_fk;
ALTER TABLE ONLY public.reviews DROP CONSTRAINT reviews_service_request_id_service_requests_id_fk;
ALTER TABLE ONLY public.reviews DROP CONSTRAINT reviews_provider_id_providers_id_fk;
ALTER TABLE ONLY public.reviews DROP CONSTRAINT reviews_client_id_users_id_fk;
ALTER TABLE ONLY public.providers DROP CONSTRAINT providers_user_id_users_id_fk;
ALTER TABLE ONLY public.provider_services DROP CONSTRAINT provider_services_provider_id_providers_id_fk;
ALTER TABLE ONLY public.provider_services DROP CONSTRAINT provider_services_category_id_service_categories_id_fk;
ALTER TABLE ONLY public.provider_pix_keys DROP CONSTRAINT provider_pix_keys_provider_id_providers_id_fk;
ALTER TABLE ONLY public.provider_earnings DROP CONSTRAINT provider_earnings_service_request_id_service_requests_id_fk;
ALTER TABLE ONLY public.provider_earnings DROP CONSTRAINT provider_earnings_provider_id_providers_id_fk;
ALTER TABLE ONLY public.provider_bank_accounts DROP CONSTRAINT provider_bank_accounts_provider_id_providers_id_fk;
ALTER TABLE ONLY public.promotional_banners DROP CONSTRAINT promotional_banners_category_id_service_categories_id_fk;
ALTER TABLE ONLY public.payments DROP CONSTRAINT payments_service_request_id_service_requests_id_fk;
ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_provider_id_providers_id_fk;
ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_client_id_users_id_fk;
ALTER TABLE ONLY public.order_items DROP CONSTRAINT order_items_provider_service_id_provider_services_id_fk;
ALTER TABLE ONLY public.order_items DROP CONSTRAINT order_items_order_id_orders_id_fk;
ALTER TABLE ONLY public.notifications DROP CONSTRAINT notifications_user_id_users_id_fk;
ALTER TABLE ONLY public.file_uploads DROP CONSTRAINT file_uploads_user_id_users_id_fk;
ALTER TABLE ONLY public.employees DROP CONSTRAINT employees_user_id_users_id_fk;
ALTER TABLE ONLY public.employees DROP CONSTRAINT employees_provider_id_providers_id_fk;
ALTER TABLE ONLY public.chat_messages DROP CONSTRAINT chat_messages_sender_id_users_id_fk;
ALTER TABLE ONLY public.chat_messages DROP CONSTRAINT chat_messages_conversation_id_chat_conversations_id_fk;
ALTER TABLE ONLY public.chat_conversations DROP CONSTRAINT chat_conversations_service_request_id_service_requests_id_fk;
ALTER TABLE ONLY public.chat_conversations DROP CONSTRAINT chat_conversations_participant_two_id_users_id_fk;
ALTER TABLE ONLY public.chat_conversations DROP CONSTRAINT chat_conversations_participant_one_id_users_id_fk;
ALTER TABLE ONLY public.withdrawal_requests DROP CONSTRAINT withdrawal_requests_pkey;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_unique;
ALTER TABLE ONLY public.user_upload_stats DROP CONSTRAINT user_upload_stats_user_id_unique;
ALTER TABLE ONLY public.user_upload_stats DROP CONSTRAINT user_upload_stats_pkey;
ALTER TABLE ONLY public.system_settings DROP CONSTRAINT system_settings_pkey;
ALTER TABLE ONLY public.system_settings DROP CONSTRAINT system_settings_key_unique;
ALTER TABLE ONLY public.service_zones DROP CONSTRAINT service_zones_pkey;
ALTER TABLE ONLY public.service_requests DROP CONSTRAINT service_requests_pkey;
ALTER TABLE ONLY public.service_categories DROP CONSTRAINT service_categories_pkey;
ALTER TABLE ONLY public.service_assignments DROP CONSTRAINT service_assignments_pkey;
ALTER TABLE ONLY public.reviews DROP CONSTRAINT reviews_pkey;
ALTER TABLE ONLY public.providers DROP CONSTRAINT providers_pkey;
ALTER TABLE ONLY public.provider_services DROP CONSTRAINT provider_services_pkey;
ALTER TABLE ONLY public.provider_pix_keys DROP CONSTRAINT provider_pix_keys_pkey;
ALTER TABLE ONLY public.provider_earnings DROP CONSTRAINT provider_earnings_pkey;
ALTER TABLE ONLY public.provider_bank_accounts DROP CONSTRAINT provider_bank_accounts_pkey;
ALTER TABLE ONLY public.promotional_banners DROP CONSTRAINT promotional_banners_pkey;
ALTER TABLE ONLY public.payments DROP CONSTRAINT payments_pkey;
ALTER TABLE ONLY public.payment_gateway_configs DROP CONSTRAINT payment_gateway_configs_pkey;
ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_pkey;
ALTER TABLE ONLY public.order_items DROP CONSTRAINT order_items_pkey;
ALTER TABLE ONLY public.notifications DROP CONSTRAINT notifications_pkey;
ALTER TABLE ONLY public.file_uploads DROP CONSTRAINT file_uploads_pkey;
ALTER TABLE ONLY public.employees DROP CONSTRAINT employees_pkey;
ALTER TABLE ONLY public.coupons DROP CONSTRAINT coupons_pkey;
ALTER TABLE ONLY public.coupons DROP CONSTRAINT coupons_code_unique;
ALTER TABLE ONLY public.chat_messages DROP CONSTRAINT chat_messages_pkey;
ALTER TABLE ONLY public.chat_conversations DROP CONSTRAINT chat_conversations_pkey;
ALTER TABLE public.withdrawal_requests ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.user_upload_stats ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.system_settings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.service_zones ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.service_requests ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.service_categories ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.service_assignments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.reviews ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.providers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.provider_services ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.provider_pix_keys ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.provider_earnings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.provider_bank_accounts ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.promotional_banners ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.payments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.payment_gateway_configs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.orders ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.order_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.notifications ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.file_uploads ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.employees ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.coupons ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.chat_messages ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.chat_conversations ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE public.withdrawal_requests_id_seq;
DROP TABLE public.withdrawal_requests;
DROP SEQUENCE public.users_id_seq;
DROP TABLE public.users;
DROP SEQUENCE public.user_upload_stats_id_seq;
DROP TABLE public.user_upload_stats;
DROP SEQUENCE public.system_settings_id_seq;
DROP TABLE public.system_settings;
DROP SEQUENCE public.service_zones_id_seq;
DROP TABLE public.service_zones;
DROP SEQUENCE public.service_requests_id_seq;
DROP TABLE public.service_requests;
DROP SEQUENCE public.service_categories_id_seq;
DROP TABLE public.service_categories;
DROP SEQUENCE public.service_assignments_id_seq;
DROP TABLE public.service_assignments;
DROP SEQUENCE public.reviews_id_seq;
DROP TABLE public.reviews;
DROP SEQUENCE public.providers_id_seq;
DROP TABLE public.providers;
DROP SEQUENCE public.provider_services_id_seq;
DROP TABLE public.provider_services;
DROP SEQUENCE public.provider_pix_keys_id_seq;
DROP TABLE public.provider_pix_keys;
DROP SEQUENCE public.provider_earnings_id_seq;
DROP TABLE public.provider_earnings;
DROP SEQUENCE public.provider_bank_accounts_id_seq;
DROP TABLE public.provider_bank_accounts;
DROP SEQUENCE public.promotional_banners_id_seq;
DROP TABLE public.promotional_banners;
DROP SEQUENCE public.payments_id_seq;
DROP TABLE public.payments;
DROP SEQUENCE public.payment_gateway_configs_id_seq;
DROP TABLE public.payment_gateway_configs;
DROP SEQUENCE public.orders_id_seq;
DROP TABLE public.orders;
DROP SEQUENCE public.order_items_id_seq;
DROP TABLE public.order_items;
DROP SEQUENCE public.notifications_id_seq;
DROP TABLE public.notifications;
DROP SEQUENCE public.file_uploads_id_seq;
DROP TABLE public.file_uploads;
DROP SEQUENCE public.employees_id_seq;
DROP TABLE public.employees;
DROP SEQUENCE public.coupons_id_seq;
DROP TABLE public.coupons;
DROP SEQUENCE public.chat_messages_id_seq;
DROP TABLE public.chat_messages;
DROP SEQUENCE public.chat_conversations_id_seq;
DROP TABLE public.chat_conversations;
DROP TYPE public.withdrawal_status;
DROP TYPE public.user_type;
DROP TYPE public.service_status;
DROP TYPE public.provider_status;
DROP TYPE public.payment_status;
DROP TYPE public.payment_method;
DROP TYPE public.order_status;
DROP TYPE public.message_status;
DROP TYPE public.chat_status;
DROP TYPE public.banner_status;
--
-- TOC entry 889 (class 1247 OID 16477)
-- Name: banner_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.banner_status AS ENUM (
    'active',
    'inactive',
    'scheduled'
);


--
-- TOC entry 892 (class 1247 OID 16484)
-- Name: chat_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.chat_status AS ENUM (
    'active',
    'closed',
    'archived'
);


--
-- TOC entry 895 (class 1247 OID 16492)
-- Name: message_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.message_status AS ENUM (
    'sent',
    'delivered',
    'read'
);


--
-- TOC entry 898 (class 1247 OID 16500)
-- Name: order_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.order_status AS ENUM (
    'cart',
    'pending_payment',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled'
);


--
-- TOC entry 991 (class 1247 OID 49177)
-- Name: payment_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_method AS ENUM (
    'digital',
    'cash',
    'credit_card',
    'debit_card',
    'pix'
);


--
-- TOC entry 901 (class 1247 OID 16524)
-- Name: payment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'refunded'
);


--
-- TOC entry 904 (class 1247 OID 16536)
-- Name: provider_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.provider_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'suspended'
);


--
-- TOC entry 907 (class 1247 OID 16546)
-- Name: service_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.service_status AS ENUM (
    'pending',
    'accepted',
    'in_progress',
    'completed',
    'cancelled'
);


--
-- TOC entry 910 (class 1247 OID 16558)
-- Name: user_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_type AS ENUM (
    'client',
    'provider',
    'admin',
    'employee'
);


--
-- TOC entry 913 (class 1247 OID 16568)
-- Name: withdrawal_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.withdrawal_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'completed'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 216 (class 1259 OID 16578)
-- Name: chat_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_conversations (
    id integer NOT NULL,
    participant_one_id integer NOT NULL,
    participant_two_id integer NOT NULL,
    service_request_id integer,
    title character varying(255),
    status public.chat_status DEFAULT 'active'::public.chat_status,
    last_message_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 215 (class 1259 OID 16577)
-- Name: chat_conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chat_conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3740 (class 0 OID 0)
-- Dependencies: 215
-- Name: chat_conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chat_conversations_id_seq OWNED BY public.chat_conversations.id;


--
-- TOC entry 218 (class 1259 OID 16588)
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    sender_id integer NOT NULL,
    content text NOT NULL,
    message_type character varying(20) DEFAULT 'text'::character varying,
    attachment_url text,
    status public.message_status DEFAULT 'sent'::public.message_status,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 217 (class 1259 OID 16587)
-- Name: chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chat_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3741 (class 0 OID 0)
-- Dependencies: 217
-- Name: chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chat_messages_id_seq OWNED BY public.chat_messages.id;


--
-- TOC entry 220 (class 1259 OID 16601)
-- Name: coupons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupons (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    discount_type character varying(20) NOT NULL,
    discount_value numeric(10,2) NOT NULL,
    minimum_amount numeric(10,2),
    maximum_uses integer,
    current_uses integer DEFAULT 0,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 219 (class 1259 OID 16600)
-- Name: coupons_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.coupons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3742 (class 0 OID 0)
-- Dependencies: 219
-- Name: coupons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.coupons_id_seq OWNED BY public.coupons.id;


--
-- TOC entry 222 (class 1259 OID 16616)
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    provider_id integer NOT NULL,
    user_id integer NOT NULL,
    name character varying(255) NOT NULL,
    phone character varying(20),
    email character varying(255),
    specialization text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 221 (class 1259 OID 16615)
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3743 (class 0 OID 0)
-- Dependencies: 221
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- TOC entry 224 (class 1259 OID 16628)
-- Name: file_uploads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.file_uploads (
    id integer NOT NULL,
    user_id integer NOT NULL,
    filename character varying(255) NOT NULL,
    original_name character varying(255) NOT NULL,
    file_path text NOT NULL,
    file_size integer NOT NULL,
    mime_type character varying(100) NOT NULL,
    category character varying(50) NOT NULL,
    is_active boolean DEFAULT true,
    virus_scanned boolean DEFAULT false,
    virus_scan_result character varying(50) DEFAULT 'pending'::character varying,
    last_accessed timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 223 (class 1259 OID 16627)
-- Name: file_uploads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.file_uploads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3744 (class 0 OID 0)
-- Dependencies: 223
-- Name: file_uploads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.file_uploads_id_seq OWNED BY public.file_uploads.id;


--
-- TOC entry 226 (class 1259 OID 16643)
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    related_id integer,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 225 (class 1259 OID 16642)
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3745 (class 0 OID 0)
-- Dependencies: 225
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- TOC entry 228 (class 1259 OID 16654)
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer NOT NULL,
    provider_service_id integer NOT NULL,
    quantity integer DEFAULT 1,
    unit_price numeric(10,2) NOT NULL,
    total_price numeric(10,2) NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 227 (class 1259 OID 16653)
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3746 (class 0 OID 0)
-- Dependencies: 227
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- TOC entry 230 (class 1259 OID 16666)
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    client_id integer NOT NULL,
    provider_id integer,
    status public.order_status DEFAULT 'cart'::public.order_status,
    subtotal numeric(10,2) DEFAULT 0.00,
    discount_amount numeric(10,2) DEFAULT 0.00,
    service_amount numeric(10,2) DEFAULT 0.00,
    total_amount numeric(10,2) DEFAULT 0.00,
    coupon_code character varying(50),
    payment_method public.payment_method,
    address text,
    cep character varying(10),
    city character varying(100),
    state character varying(50),
    latitude numeric(10,7),
    longitude numeric(10,7),
    scheduled_at timestamp without time zone,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 229 (class 1259 OID 16665)
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3747 (class 0 OID 0)
-- Dependencies: 229
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- TOC entry 232 (class 1259 OID 16682)
-- Name: payment_gateway_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_gateway_configs (
    id integer NOT NULL,
    gateway_name character varying(50) NOT NULL,
    is_active boolean DEFAULT false,
    environment_mode character varying(20) DEFAULT 'test'::character varying,
    public_key text,
    access_token text,
    client_id text,
    gateway_title character varying(255),
    logo text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 231 (class 1259 OID 16681)
-- Name: payment_gateway_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payment_gateway_configs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3748 (class 0 OID 0)
-- Dependencies: 231
-- Name: payment_gateway_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payment_gateway_configs_id_seq OWNED BY public.payment_gateway_configs.id;


--
-- TOC entry 234 (class 1259 OID 16695)
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    service_request_id integer NOT NULL,
    payment_method public.payment_method NOT NULL,
    amount numeric(10,2) NOT NULL,
    commission_amount numeric(10,2),
    status public.payment_status DEFAULT 'pending'::public.payment_status,
    transaction_id character varying(255),
    gateway_response text,
    paid_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 233 (class 1259 OID 16694)
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3749 (class 0 OID 0)
-- Dependencies: 233
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- TOC entry 236 (class 1259 OID 16707)
-- Name: promotional_banners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promotional_banners (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    image_url text,
    category_id integer,
    target_url text,
    status public.banner_status DEFAULT 'active'::public.banner_status,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    click_count integer DEFAULT 0,
    display_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 235 (class 1259 OID 16706)
-- Name: promotional_banners_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.promotional_banners_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3750 (class 0 OID 0)
-- Dependencies: 235
-- Name: promotional_banners_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.promotional_banners_id_seq OWNED BY public.promotional_banners.id;


--
-- TOC entry 238 (class 1259 OID 16721)
-- Name: provider_bank_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provider_bank_accounts (
    id integer NOT NULL,
    provider_id integer NOT NULL,
    bank_name character varying(255) NOT NULL,
    agency character varying(20) NOT NULL,
    account_number character varying(50) NOT NULL,
    account_holder character varying(255) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 237 (class 1259 OID 16720)
-- Name: provider_bank_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.provider_bank_accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3751 (class 0 OID 0)
-- Dependencies: 237
-- Name: provider_bank_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.provider_bank_accounts_id_seq OWNED BY public.provider_bank_accounts.id;


--
-- TOC entry 240 (class 1259 OID 16733)
-- Name: provider_earnings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provider_earnings (
    id integer NOT NULL,
    provider_id integer NOT NULL,
    service_request_id integer NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    commission_rate numeric(5,2) NOT NULL,
    commission_amount numeric(10,2) NOT NULL,
    provider_amount numeric(10,2) NOT NULL,
    is_withdrawn boolean DEFAULT false,
    withdrawn_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 239 (class 1259 OID 16732)
-- Name: provider_earnings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.provider_earnings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3752 (class 0 OID 0)
-- Dependencies: 239
-- Name: provider_earnings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.provider_earnings_id_seq OWNED BY public.provider_earnings.id;


--
-- TOC entry 242 (class 1259 OID 16742)
-- Name: provider_pix_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provider_pix_keys (
    id integer NOT NULL,
    provider_id integer NOT NULL,
    pix_key character varying(255) NOT NULL,
    pix_type character varying(20) NOT NULL,
    account_holder character varying(255) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 241 (class 1259 OID 16741)
-- Name: provider_pix_keys_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.provider_pix_keys_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3753 (class 0 OID 0)
-- Dependencies: 241
-- Name: provider_pix_keys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.provider_pix_keys_id_seq OWNED BY public.provider_pix_keys.id;


--
-- TOC entry 244 (class 1259 OID 16754)
-- Name: provider_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provider_services (
    id integer NOT NULL,
    provider_id integer NOT NULL,
    category_id integer NOT NULL,
    name character varying(255),
    description text,
    price numeric(10,2),
    minimum_price numeric(10,2),
    estimated_duration character varying(100),
    requirements text,
    service_zone text,
    images text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 243 (class 1259 OID 16753)
-- Name: provider_services_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.provider_services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3754 (class 0 OID 0)
-- Dependencies: 243
-- Name: provider_services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.provider_services_id_seq OWNED BY public.provider_services.id;


--
-- TOC entry 246 (class 1259 OID 16766)
-- Name: providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.providers (
    id integer NOT NULL,
    user_id integer NOT NULL,
    status public.provider_status DEFAULT 'pending'::public.provider_status,
    service_radius integer DEFAULT 10,
    base_price numeric(10,2),
    description text,
    experience text,
    documents text,
    portfolio_images text,
    rating numeric(3,2) DEFAULT 0.00,
    total_reviews integer DEFAULT 0,
    total_services integer DEFAULT 0,
    is_trial_active boolean DEFAULT true,
    trial_ends_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    identity_document text,
    city character varying(100),
    state character varying(50),
    cpf_cnpj character varying(20),
    registration_step integer DEFAULT 1,
    registration_data text,
    bank_name character varying(100),
    bank_agency character varying(10),
    bank_account character varying(20)
);


--
-- TOC entry 245 (class 1259 OID 16765)
-- Name: providers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.providers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3755 (class 0 OID 0)
-- Dependencies: 245
-- Name: providers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.providers_id_seq OWNED BY public.providers.id;


--
-- TOC entry 248 (class 1259 OID 16783)
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id integer NOT NULL,
    service_request_id integer NOT NULL,
    client_id integer NOT NULL,
    provider_id integer NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 247 (class 1259 OID 16782)
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3756 (class 0 OID 0)
-- Dependencies: 247
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;


--
-- TOC entry 250 (class 1259 OID 16793)
-- Name: service_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_assignments (
    id integer NOT NULL,
    service_request_id integer NOT NULL,
    employee_id integer NOT NULL,
    assigned_at timestamp without time zone DEFAULT now(),
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 249 (class 1259 OID 16792)
-- Name: service_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.service_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3757 (class 0 OID 0)
-- Dependencies: 249
-- Name: service_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.service_assignments_id_seq OWNED BY public.service_assignments.id;


--
-- TOC entry 252 (class 1259 OID 16805)
-- Name: service_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    icon character varying(50),
    image_url text,
    color character varying(20),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 251 (class 1259 OID 16804)
-- Name: service_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.service_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3758 (class 0 OID 0)
-- Dependencies: 251
-- Name: service_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.service_categories_id_seq OWNED BY public.service_categories.id;


--
-- TOC entry 254 (class 1259 OID 16816)
-- Name: service_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_requests (
    id integer NOT NULL,
    client_id integer NOT NULL,
    category_id integer NOT NULL,
    provider_id integer,
    title character varying(255) NOT NULL,
    description text,
    address text NOT NULL,
    cep character varying(10) NOT NULL,
    city character varying(100) NOT NULL,
    state character varying(50) NOT NULL,
    latitude numeric(10,7),
    longitude numeric(10,7),
    estimated_price numeric(10,2),
    final_price numeric(10,2),
    total_amount numeric(10,2),
    payment_method public.payment_method,
    payment_status public.payment_status DEFAULT 'pending'::public.payment_status,
    notes text,
    status public.service_status DEFAULT 'pending'::public.service_status,
    scheduled_at timestamp without time zone,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 253 (class 1259 OID 16815)
-- Name: service_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.service_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3759 (class 0 OID 0)
-- Dependencies: 253
-- Name: service_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.service_requests_id_seq OWNED BY public.service_requests.id;


--
-- TOC entry 256 (class 1259 OID 16829)
-- Name: service_zones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_zones (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    coordinates text,
    city character varying(100),
    state character varying(50),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 255 (class 1259 OID 16828)
-- Name: service_zones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.service_zones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3760 (class 0 OID 0)
-- Dependencies: 255
-- Name: service_zones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.service_zones_id_seq OWNED BY public.service_zones.id;


--
-- TOC entry 258 (class 1259 OID 16840)
-- Name: system_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_settings (
    id integer NOT NULL,
    key character varying(100) NOT NULL,
    value text,
    type character varying(50) DEFAULT 'string'::character varying,
    description text,
    is_system boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 257 (class 1259 OID 16839)
-- Name: system_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.system_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3761 (class 0 OID 0)
-- Dependencies: 257
-- Name: system_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.system_settings_id_seq OWNED BY public.system_settings.id;


--
-- TOC entry 260 (class 1259 OID 16854)
-- Name: user_upload_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_upload_stats (
    id integer NOT NULL,
    user_id integer NOT NULL,
    daily_uploads integer DEFAULT 0,
    monthly_uploads integer DEFAULT 0,
    total_uploads integer DEFAULT 0,
    total_size integer DEFAULT 0,
    last_upload timestamp without time zone,
    last_daily_reset timestamp without time zone DEFAULT now(),
    last_monthly_reset timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 259 (class 1259 OID 16853)
-- Name: user_upload_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_upload_stats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3762 (class 0 OID 0)
-- Dependencies: 259
-- Name: user_upload_stats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_upload_stats_id_seq OWNED BY public.user_upload_stats.id;


--
-- TOC entry 262 (class 1259 OID 16871)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password text NOT NULL,
    name character varying(255) NOT NULL,
    phone character varying(20),
    user_type public.user_type DEFAULT 'client'::public.user_type NOT NULL,
    address text,
    cep character varying(10),
    city character varying(100),
    state character varying(50),
    latitude numeric(10,7),
    longitude numeric(10,7),
    avatar text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    cpf character varying(14)
);


--
-- TOC entry 261 (class 1259 OID 16870)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3763 (class 0 OID 0)
-- Dependencies: 261
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 264 (class 1259 OID 16886)
-- Name: withdrawal_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.withdrawal_requests (
    id integer NOT NULL,
    provider_id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    bank_name character varying(255),
    account_number character varying(50),
    account_holder_name character varying(255),
    cpf_cnpj character varying(20),
    payment_method character varying(50),
    pix_key character varying(255),
    status public.withdrawal_status DEFAULT 'pending'::public.withdrawal_status,
    request_notes text,
    admin_notes text,
    processed_by integer,
    processed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    bank_account_id integer,
    pix_key_id integer
);


--
-- TOC entry 263 (class 1259 OID 16885)
-- Name: withdrawal_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.withdrawal_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3764 (class 0 OID 0)
-- Dependencies: 263
-- Name: withdrawal_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.withdrawal_requests_id_seq OWNED BY public.withdrawal_requests.id;


--
-- TOC entry 3330 (class 2604 OID 16581)
-- Name: chat_conversations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversations ALTER COLUMN id SET DEFAULT nextval('public.chat_conversations_id_seq'::regclass);


--
-- TOC entry 3334 (class 2604 OID 16591)
-- Name: chat_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages ALTER COLUMN id SET DEFAULT nextval('public.chat_messages_id_seq'::regclass);


--
-- TOC entry 3339 (class 2604 OID 16604)
-- Name: coupons id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons ALTER COLUMN id SET DEFAULT nextval('public.coupons_id_seq'::regclass);


--
-- TOC entry 3344 (class 2604 OID 16619)
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- TOC entry 3348 (class 2604 OID 16631)
-- Name: file_uploads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_uploads ALTER COLUMN id SET DEFAULT nextval('public.file_uploads_id_seq'::regclass);


--
-- TOC entry 3355 (class 2604 OID 16646)
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- TOC entry 3358 (class 2604 OID 16657)
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- TOC entry 3362 (class 2604 OID 16669)
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- TOC entry 3370 (class 2604 OID 16685)
-- Name: payment_gateway_configs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_gateway_configs ALTER COLUMN id SET DEFAULT nextval('public.payment_gateway_configs_id_seq'::regclass);


--
-- TOC entry 3375 (class 2604 OID 16698)
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- TOC entry 3379 (class 2604 OID 16710)
-- Name: promotional_banners id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotional_banners ALTER COLUMN id SET DEFAULT nextval('public.promotional_banners_id_seq'::regclass);


--
-- TOC entry 3385 (class 2604 OID 16724)
-- Name: provider_bank_accounts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_bank_accounts ALTER COLUMN id SET DEFAULT nextval('public.provider_bank_accounts_id_seq'::regclass);


--
-- TOC entry 3389 (class 2604 OID 16736)
-- Name: provider_earnings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_earnings ALTER COLUMN id SET DEFAULT nextval('public.provider_earnings_id_seq'::regclass);


--
-- TOC entry 3392 (class 2604 OID 16745)
-- Name: provider_pix_keys id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_pix_keys ALTER COLUMN id SET DEFAULT nextval('public.provider_pix_keys_id_seq'::regclass);


--
-- TOC entry 3396 (class 2604 OID 16757)
-- Name: provider_services id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_services ALTER COLUMN id SET DEFAULT nextval('public.provider_services_id_seq'::regclass);


--
-- TOC entry 3400 (class 2604 OID 16769)
-- Name: providers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.providers ALTER COLUMN id SET DEFAULT nextval('public.providers_id_seq'::regclass);


--
-- TOC entry 3410 (class 2604 OID 16786)
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


--
-- TOC entry 3412 (class 2604 OID 16796)
-- Name: service_assignments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_assignments ALTER COLUMN id SET DEFAULT nextval('public.service_assignments_id_seq'::regclass);


--
-- TOC entry 3416 (class 2604 OID 16808)
-- Name: service_categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_categories ALTER COLUMN id SET DEFAULT nextval('public.service_categories_id_seq'::regclass);


--
-- TOC entry 3419 (class 2604 OID 16819)
-- Name: service_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_requests ALTER COLUMN id SET DEFAULT nextval('public.service_requests_id_seq'::regclass);


--
-- TOC entry 3424 (class 2604 OID 16832)
-- Name: service_zones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_zones ALTER COLUMN id SET DEFAULT nextval('public.service_zones_id_seq'::regclass);


--
-- TOC entry 3427 (class 2604 OID 16843)
-- Name: system_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings ALTER COLUMN id SET DEFAULT nextval('public.system_settings_id_seq'::regclass);


--
-- TOC entry 3431 (class 2604 OID 16857)
-- Name: user_upload_stats id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_upload_stats ALTER COLUMN id SET DEFAULT nextval('public.user_upload_stats_id_seq'::regclass);


--
-- TOC entry 3440 (class 2604 OID 16874)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 3445 (class 2604 OID 16889)
-- Name: withdrawal_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.withdrawal_requests ALTER COLUMN id SET DEFAULT nextval('public.withdrawal_requests_id_seq'::regclass);


--
-- TOC entry 3686 (class 0 OID 16578)
-- Dependencies: 216
-- Data for Name: chat_conversations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_conversations (id, participant_one_id, participant_two_id, service_request_id, title, status, last_message_at, created_at, updated_at) FROM stdin;
1	3	6	1	Serviço #1	active	2025-07-25 14:10:32.959	2025-07-25 14:09:52.671273	2025-07-25 14:09:52.717
2	11	13	14	Serviço #14	active	2025-07-27 13:07:14.989	2025-07-27 13:06:27.04636	2025-07-27 13:06:27.076
\.


--
-- TOC entry 3688 (class 0 OID 16588)
-- Dependencies: 218
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_messages (id, conversation_id, sender_id, content, message_type, attachment_url, status, created_at, updated_at) FROM stdin;
1	1	3	Oi	text	\N	sent	2025-07-25 14:10:06.358215	2025-07-25 14:10:06.358215
2	1	6	ola	text	\N	sent	2025-07-25 14:10:32.94102	2025-07-25 14:10:32.94102
3	2	11	Oi	text	\N	sent	2025-07-27 13:06:40.762598	2025-07-27 13:06:40.762598
4	2	13	ola	text	\N	sent	2025-07-27 13:07:14.971366	2025-07-27 13:07:14.971366
\.


--
-- TOC entry 3690 (class 0 OID 16601)
-- Dependencies: 220
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.coupons (id, code, name, description, discount_type, discount_value, minimum_amount, maximum_uses, current_uses, start_date, end_date, is_active, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3692 (class 0 OID 16616)
-- Dependencies: 222
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employees (id, provider_id, user_id, name, phone, email, specialization, is_active, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3694 (class 0 OID 16628)
-- Dependencies: 224
-- Data for Name: file_uploads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.file_uploads (id, user_id, filename, original_name, file_path, file_size, mime_type, category, is_active, virus_scanned, virus_scan_result, last_accessed, created_at, updated_at) FROM stdin;
1	14	1753624503618_iyiuik6jvx.webp	perfil.jpg	/uploads/avatars/1753624503618_iyiuik6jvx.webp	41977	image/jpeg	avatars	t	t	clean	2025-07-27 13:55:03.694	2025-07-27 13:55:03.714574	2025-07-27 13:55:03.714574
\.


--
-- TOC entry 3696 (class 0 OID 16643)
-- Dependencies: 226
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, type, title, message, related_id, is_read, created_at) FROM stdin;
\.


--
-- TOC entry 3698 (class 0 OID 16654)
-- Dependencies: 228
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_items (id, order_id, provider_service_id, quantity, unit_price, total_price, notes, created_at, updated_at) FROM stdin;
2	1	1	1	50.00	50.00	\N	2025-07-25 14:05:22.087414	2025-07-25 14:05:22.087414
4	2	1	1	50.00	50.00	\N	2025-07-25 14:49:05.632528	2025-07-25 14:49:05.632528
6	3	1	1	50.00	50.00	\N	2025-07-25 16:20:51.672138	2025-07-25 16:20:51.672138
9	5	1	1	50.00	50.00	\N	2025-07-25 18:32:03.639542	2025-07-25 18:55:02.588
12	6	1	1	50.00	50.00	\N	2025-07-26 15:06:34.929211	2025-07-26 15:06:34.929211
13	7	1	3	50.00	150.00	\N	2025-07-26 15:24:45.766719	2025-07-26 20:38:24.662
14	8	1	1	50.00	50.00	\N	2025-07-26 20:56:34.427531	2025-07-26 20:56:34.427531
15	10	1	1	50.00	50.00	\N	2025-07-26 21:01:15.976409	2025-07-26 21:01:15.976409
16	12	1	1	50.00	50.00	\N	2025-07-26 21:05:58.785902	2025-07-26 21:05:58.785902
17	13	1	1	50.00	50.00	\N	2025-07-26 21:10:26.407806	2025-07-26 21:10:26.407806
18	14	1	2	50.00	100.00	\N	2025-07-26 21:16:00.161144	2025-07-26 21:16:41.797
19	15	1	1	50.00	50.00	\N	2025-07-26 21:31:44.249612	2025-07-26 21:31:44.249612
20	16	9	1	0.00	0.00	\N	2025-07-27 11:28:20.610235	2025-07-27 11:28:20.610235
21	17	4	1	70.00	70.00	\N	2025-07-27 13:40:32.382203	2025-07-27 13:40:32.382203
\.


--
-- TOC entry 3700 (class 0 OID 16666)
-- Dependencies: 230
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orders (id, client_id, provider_id, status, subtotal, discount_amount, service_amount, total_amount, coupon_code, payment_method, address, cep, city, state, latitude, longitude, scheduled_at, notes, created_at, updated_at) FROM stdin;
1	3	\N	confirmed	50.00	0.00	5.00	55.00	\N	credit_card	RUA 262	74615300	Goiania	GO	\N	\N	2025-07-25 11:06:00	\N	2025-07-25 14:04:01.985351	2025-07-25 14:05:41.235
2	3	\N	cart	0.00	0.00	0.00	0.00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-25 14:48:17.490541	2025-07-25 14:48:17.490541
3	11	\N	confirmed	50.00	0.00	5.00	55.00	\N	cash	RUA 262	74615300	Goiania	GO	\N	\N	2025-07-25 17:00:00	\N	2025-07-25 16:07:12.510091	2025-07-25 18:30:10.821
5	11	\N	confirmed	50.00	0.00	5.00	55.00	\N	credit_card	Rua 262, 45 - Goiânia, GO	74615300	Goiania	GO	\N	\N	2025-07-25 15:55:00	\N	2025-07-25 18:32:03.521013	2025-07-25 19:00:13.517
6	11	\N	confirmed	50.00	0.00	5.00	55.00	\N	pix	Rua 262, 45 - Goiânia, GO	74615300	Goiania	GO	\N	\N	2025-07-26 12:09:00	\N	2025-07-26 00:34:53.491804	2025-07-26 15:09:13.03
7	11	\N	confirmed	150.00	0.00	15.00	165.00	\N	debit_card	RUA 262	74615300	Goiania	111.222.333.444	\N	\N	2000-01-01 02:00:00	\N	2025-07-26 15:24:45.711358	2025-07-26 20:52:15.069
8	11	\N	confirmed	50.00	0.00	5.00	55.00	\N	debit_card	RUA 262	74615300	Goiania	111.222.333.444	\N	\N	2025-07-26 20:57:00	\N	2025-07-26 20:56:34.365384	2025-07-26 20:57:10.105
9	11	\N	confirmed	50.00	0.00	15.00	65.00	\N	debit_card	RUA 262	74615300	Goiania	111.222.333.444	\N	\N	2025-07-26 20:57:00	\N	2025-07-26 20:57:49.341975	2025-07-26 20:57:49.341975
10	11	\N	confirmed	50.00	0.00	5.00	55.00	\N	debit_card	RUA 262	74615300	Goiania	111.222.333.444	\N	\N	2025-07-26 21:03:00	\N	2025-07-26 21:01:15.929742	2025-07-26 21:02:45.607
11	11	\N	confirmed	50.00	0.00	15.00	65.00	\N	debit_card	RUA 262	74615300	Goiania	111.222.333.444	\N	\N	2025-07-26 21:03:00	\N	2025-07-26 21:02:58.298644	2025-07-26 21:02:58.298644
12	11	\N	confirmed	50.00	0.00	5.00	55.00	\N	debit_card	RUA 262	74615300	Goiania	111.222.333.444	\N	\N	2025-07-26 21:06:00	\N	2025-07-26 21:05:58.729261	2025-07-26 21:06:20.85
13	11	\N	confirmed	50.00	0.00	5.00	55.00	\N	cash	Rua 262, 45 - Goiânia, GO	74615300	Goiania	GO	\N	\N	2025-07-26 18:11:00	\N	2025-07-26 21:10:26.2796	2025-07-26 21:10:47.436
14	11	\N	confirmed	100.00	0.00	10.00	110.00	\N	debit_card	RUA 262	74615300	Goiania	111.222.333.444	\N	\N	2025-07-26 21:28:00	\N	2025-07-26 21:16:00.028122	2025-07-26 21:27:49.46
15	11	\N	confirmed	50.00	0.00	5.00	55.00	\N	debit_card	RUA 262	74615300	Goiania	111.222.333.444	\N	\N	2025-07-26 21:32:00	\N	2025-07-26 21:31:44.193143	2025-07-26 21:32:06.544
16	11	\N	confirmed	0.00	0.00	0.00	0.00	\N	debit_card	Av. Paulista, 1000, Goiânia - GO	74710-010	Goiania	111.222.333.444	\N	\N	2025-07-27 11:29:00	\N	2025-07-27 11:28:20.527167	2025-07-27 11:28:57.491
17	11	\N	confirmed	70.00	0.00	7.00	77.00	\N	debit_card	RUA 262	74615300	Goiania	GO	\N	\N	2025-07-27 13:42:00	\N	2025-07-27 13:40:32.28369	2025-07-27 13:42:19.016
\.


--
-- TOC entry 3702 (class 0 OID 16682)
-- Dependencies: 232
-- Data for Name: payment_gateway_configs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_gateway_configs (id, gateway_name, is_active, environment_mode, public_key, access_token, client_id, gateway_title, logo, created_at, updated_at) FROM stdin;
1	stripe	t	test	pk_test_example	sk_test_example	stripe_client_123	Stripe Payment Gateway		2025-07-25 13:26:41.225893	2025-07-25 13:26:41.225893
2	mercadopago	t	test	TEST-27ced349-dab5-48bb-99bb-4519e58f30d8	TEST-4284137095789433-072608-e6902069f1873f975547e9475af51ed0-130334509	130334509	Mercado Pago		2025-07-25 14:46:59.398392	2025-07-26 19:02:17.104
\.


--
-- TOC entry 3704 (class 0 OID 16695)
-- Dependencies: 234
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (id, service_request_id, payment_method, amount, commission_amount, status, transaction_id, gateway_response, paid_at, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3706 (class 0 OID 16707)
-- Dependencies: 236
-- Data for Name: promotional_banners; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.promotional_banners (id, title, description, image_url, category_id, target_url, status, start_date, end_date, click_count, display_order, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3708 (class 0 OID 16721)
-- Dependencies: 238
-- Data for Name: provider_bank_accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.provider_bank_accounts (id, provider_id, bank_name, agency, account_number, account_holder, is_active, created_at, updated_at) FROM stdin;
1	1	BB	0234-5	23456-7	João Ferreira de Moura	t	2025-07-27 09:12:59.389727	2025-07-27 09:20:40.89
\.


--
-- TOC entry 3710 (class 0 OID 16733)
-- Dependencies: 240
-- Data for Name: provider_earnings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.provider_earnings (id, provider_id, service_request_id, total_amount, commission_rate, commission_amount, provider_amount, is_withdrawn, withdrawn_at, created_at) FROM stdin;
1	1	1	50.00	4.00	2.00	48.00	f	\N	2025-07-25 14:10:52.476177
2	6	14	0.00	4.00	0.00	0.00	f	\N	2025-07-27 13:08:01.589797
3	7	15	70.00	4.00	2.80	67.20	f	\N	2025-07-27 15:20:07.742515
4	1	2	50.00	4.00	2.00	48.00	f	\N	2025-07-27 15:35:48.840471
\.


--
-- TOC entry 3712 (class 0 OID 16742)
-- Dependencies: 242
-- Data for Name: provider_pix_keys; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.provider_pix_keys (id, provider_id, pix_key, pix_type, account_holder, is_active, created_at, updated_at) FROM stdin;
1	1	777.666.555-53	cpf	João Ferreira de Moura	t	2025-07-27 09:15:20.823827	2025-07-27 09:15:20.823827
\.


--
-- TOC entry 3714 (class 0 OID 16754)
-- Dependencies: 244
-- Data for Name: provider_services; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.provider_services (id, provider_id, category_id, name, description, price, minimum_price, estimated_duration, requirements, service_zone, images, is_active, created_at, updated_at) FROM stdin;
3	2	1	Limpeza de Escritórios	Limpeza comercial para empresas e escritórios	\N	40.00	\N	\N	Não especificado	\N	t	2025-07-25 14:01:02.63604	2025-07-25 14:01:02.63604
5	3	3	Instalação de Ventiladores	Instalação e manutenção de ventiladores de teto	\N	35.00	\N	\N	Não especificado	\N	t	2025-07-25 14:01:02.63604	2025-07-25 14:01:02.63604
6	3	3	Manutenção Elétrica Predial	Manutenção elétrica em prédios e condomínios	\N	60.00	\N	\N	Não especificado	\N	t	2025-07-25 14:01:02.63604	2025-07-25 14:01:02.63604
7	4	4	Conserto de Torneiras	Reparo e troca de torneiras e registros	\N	45.00	\N	\N	Não especificado	\N	t	2025-07-25 14:01:02.63604	2025-07-25 14:01:02.63604
8	4	4	Desentupimento de Pias	Serviço de desentupimento para cozinhas e banheiros	\N	80.00	\N	\N	Não especificado	\N	t	2025-07-25 14:01:02.63604	2025-07-25 14:01:02.63604
9	5	5	Pintura de Fachadas	Pintura externa de prédios e casas	\N	30.00	\N	\N	Não especificado	\N	t	2025-07-25 14:01:02.63604	2025-07-25 14:01:02.63604
10	5	5	Pintura de Interiores	Pintura interna de casas e apartamentos	\N	25.00	\N	\N	Não especificado	\N	t	2025-07-25 14:01:02.63604	2025-07-25 14:01:02.63604
1	1	3	Instalação Elétrica Básica	Instalação de tomadas, interruptores e luminárias	50.00	\N	\N	\N	Não especificado	\N	t	2025-07-25 14:01:02.63604	2025-07-25 14:01:02.63604
2	1	1	Limpeza Residencial Completa	Limpeza completa de casa incluindo todos os cômodos	50.00	\N	\N	\N	Não especificado	\N	t	2025-07-25 14:01:02.63604	2025-07-25 14:01:02.63604
11	6	5	Serviço de Pintor	Serviço profissional de Pintor	50.00	\N	\N	\N	\N	\N	t	2025-07-27 11:14:48.148939	2025-07-27 11:14:48.148939
13	7	1	Serviço de Limpeza	Serviço profissional de Limpeza	50.00	\N	\N	\N	\N	\N	t	2025-07-27 13:35:31.701498	2025-07-27 13:35:31.701498
4	2	1	Limpeza Pós-Obra	Limpeza especializada após reformas e construções	70.00	60.00	3	\N	Não especificado	\N	t	2025-07-25 14:01:02.63604	2025-07-25 14:01:02.63604
14	8	3	\N	das dsa sadasdsada s	100.00	\N	\N	\N	\N	\N	t	2025-07-29 01:04:59.119282	2025-07-29 01:04:59.119282
15	9	3	\N	da s sdsa dsa	100.00	\N	\N	\N	\N	\N	t	2025-07-29 13:25:22.892944	2025-07-29 13:25:22.892944
\.


--
-- TOC entry 3716 (class 0 OID 16766)
-- Dependencies: 246
-- Data for Name: providers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.providers (id, user_id, status, service_radius, base_price, description, experience, documents, portfolio_images, rating, total_reviews, total_services, is_trial_active, trial_ends_at, created_at, updated_at, identity_document, city, state, cpf_cnpj, registration_step, registration_data, bank_name, bank_agency, bank_account) FROM stdin;
2	7	approved	20	35.00	Especialista em limpeza residencial e comercial	\N	\N	\N	0.00	0	0	t	\N	2025-07-25 14:00:44.728466	2025-07-25 14:00:44.728466	\N	\N	\N	\N	1	\N	\N	\N	\N
3	4	approved	12	35.00	Eletricista com experiência em manutenção predial	\N	\N	\N	0.00	0	0	t	\N	2025-07-25 14:00:44.728466	2025-07-25 14:00:44.728466	\N	\N	\N	\N	1	\N	\N	\N	\N
4	9	approved	18	45.00	Encanadora especializada em reparos hidráulicos	\N	\N	\N	0.00	0	0	t	\N	2025-07-25 14:00:44.728466	2025-07-25 14:00:44.728466	\N	\N	\N	\N	1	\N	\N	\N	\N
5	8	approved	25	25.00	Pintor profissional com experiência em projetos residenciais e comerciais	\N	\N	\N	0.00	0	0	t	\N	2025-07-25 14:00:44.728466	2025-07-25 14:00:44.728466	\N	\N	\N	\N	1	\N	\N	\N	\N
6	13	approved	15	60.00	sad asdasdas ad asdas	da dasda sdas d	\N	[]	4.00	1	0	t	2025-08-03 09:43:06.17	2025-07-27 09:43:06.19243	2025-07-27 14:12:24.008	\N	\N	\N	\N	1	\N	\N	\N	\N
7	14	approved	20	60.00	Eletricista experiente em instalações residenciais e comerciais	Eletricista experiente em instalações residenciais e comerciais	\N	[]	5.00	1	0	t	2025-08-03 13:34:21.135	2025-07-27 13:34:21.15595	2025-07-27 13:50:45.355	/uploads/providers/1753623246844_3z91y6n1s3r.webp	\N	\N	\N	1	\N	\N	\N	\N
1	6	approved	15	45.00	Eletricista experiente em instalações residenciais e comerciais	\N	\N	\N	4.00	1	0	t	\N	2025-07-25 14:00:44.728466	2025-07-25 14:00:44.728466	\N	\N	\N	\N	1	\N	\N	\N	\N
8	17	pending	10	100.00	das dsa sadasdsada s	asdasd asds das	\N	\N	0.00	0	0	t	2025-08-05 01:04:58.885	2025-07-29 01:04:58.898093	2025-07-29 01:04:58.898093	\N	Goiânia	GO	631897456157-87	3	\N	Itaú	123-4	23187-8
9	19	pending	10	100.00	da s sdsa dsa	as dsasd das	\N	\N	0.00	0	0	t	2025-08-05 13:25:22.655	2025-07-29 13:25:22.668253	2025-07-29 13:25:22.668253	\N	Goiânia	GO	631897456157-87	3	\N	Itaú	123-4	23187-5
\.


--
-- TOC entry 3718 (class 0 OID 16783)
-- Dependencies: 248
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reviews (id, service_request_id, client_id, provider_id, rating, comment, created_at) FROM stdin;
5	14	11	6	4		2025-07-27 15:19:26.581767
6	15	11	7	5		2025-07-27 15:20:12.365443
7	2	11	1	4		2025-07-27 15:35:53.022595
\.


--
-- TOC entry 3720 (class 0 OID 16793)
-- Dependencies: 250
-- Data for Name: service_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.service_assignments (id, service_request_id, employee_id, assigned_at, started_at, completed_at, notes, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3722 (class 0 OID 16805)
-- Dependencies: 252
-- Data for Name: service_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.service_categories (id, name, description, icon, image_url, color, is_active, created_at) FROM stdin;
1	Limpeza	Serviços de limpeza residencial e comercial	🧹	\N	\N	t	2025-07-25 13:40:23.287289
2	Encanamento	Serviços de encanamento e hidráulica	🔧	\N	\N	t	2025-07-25 13:40:25.847159
3	Eletricista	Serviços elétricos e instalações	⚡	\N	\N	t	2025-07-25 13:59:50.140216
4	Encanador	Serviços hidráulicos e encanamento	🔧	\N	\N	t	2025-07-25 13:59:52.773637
5	Pintor	Serviços de pintura residencial e comercial	🎨	\N	\N	t	2025-07-25 13:59:54.979401
\.


--
-- TOC entry 3724 (class 0 OID 16816)
-- Dependencies: 254
-- Data for Name: service_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.service_requests (id, client_id, category_id, provider_id, title, description, address, cep, city, state, latitude, longitude, estimated_price, final_price, total_amount, payment_method, payment_status, notes, status, scheduled_at, completed_at, created_at, updated_at) FROM stdin;
1	3	3	1	Pedido #1	1x Eletricista	RUA 262	74615300	Goiania	GO	\N	\N	50.00	\N	50.00	credit_card	completed	\N	completed	2025-07-25 11:06:00	2025-07-25 14:10:52.393	2025-07-25 14:05:41.26	2025-07-25 14:10:52.394
3	11	3	\N	Pedido #5	1x Eletricista	Rua 262, 45 - Goiânia, GO	74615300	Goiania	GO	\N	\N	50.00	\N	50.00	credit_card	completed	\N	pending	2025-07-25 15:55:00	\N	2025-07-25 19:00:13.586	2025-07-25 19:00:13.586
4	11	3	\N	Pedido #6	1x Eletricista	Rua 262, 45 - Goiânia, GO	74615300	Goiania	GO	\N	\N	50.00	\N	50.00	pix	completed	\N	pending	2025-07-26 12:09:00	\N	2025-07-26 15:09:13.061	2025-07-26 15:09:13.061
5	11	3	\N	Pedido #7	3x Eletricista	RUA 262	74615300	Goiania	111.222.333.444	\N	\N	150.00	\N	150.00	debit_card	completed	\N	pending	2000-01-01 02:00:00	\N	2025-07-26 20:52:15.118	2025-07-26 20:52:15.118
6	11	3	\N	Pedido #8	1x Eletricista	RUA 262	74615300	Goiania	111.222.333.444	\N	\N	50.00	\N	50.00	debit_card	completed	\N	pending	2025-07-26 20:57:00	\N	2025-07-26 20:57:10.136	2025-07-26 20:57:10.136
8	11	3	\N	Pedido #10	1x Eletricista	RUA 262	74615300	Goiania	111.222.333.444	\N	\N	50.00	\N	50.00	debit_card	completed	\N	pending	2025-07-26 21:03:00	\N	2025-07-26 21:02:45.639	2025-07-26 21:02:45.639
9	11	1	1	Solicitação de Serviço	Instalação de tomadas, interruptores e luminárias	RUA 262	74615300	Goiania	111.222.333.444	\N	\N	\N	\N	\N	\N	pending	\N	pending	2025-07-26 21:03:00	\N	2025-07-26 21:02:58.333617	2025-07-26 21:02:58.333617
10	11	3	\N	Pedido #12	1x Eletricista	RUA 262	74615300	Goiania	111.222.333.444	\N	\N	50.00	\N	50.00	debit_card	completed	\N	pending	2025-07-26 21:06:00	\N	2025-07-26 21:06:20.88	2025-07-26 21:06:20.88
11	11	3	\N	Pedido #13	1x Eletricista	Rua 262, 45 - Goiânia, GO	74615300	Goiania	GO	\N	\N	50.00	\N	50.00	cash	completed	\N	pending	2025-07-26 18:11:00	\N	2025-07-26 21:10:47.502	2025-07-26 21:10:47.502
12	11	3	\N	Pedido #14	2x Eletricista	RUA 262	74615300	Goiania	111.222.333.444	\N	\N	100.00	\N	100.00	debit_card	completed	\N	pending	2025-07-26 21:28:00	\N	2025-07-26 21:27:49.492	2025-07-26 21:27:49.492
13	11	3	\N	Pedido #15	1x Eletricista	RUA 262	74615300	Goiania	111.222.333.444	\N	\N	50.00	\N	50.00	debit_card	completed	\N	pending	2025-07-26 21:32:00	\N	2025-07-26 21:32:06.576	2025-07-26 21:32:06.576
14	11	5	6	Pedido #16	1x Pintor	Av. Paulista, 1000, Goiânia - GO	74710-010	Goiania	111.222.333.444	\N	\N	0.00	\N	0.00	debit_card	completed	\N	completed	2025-07-27 11:29:00	2025-07-27 13:08:01.449	2025-07-27 11:28:57.534	2025-07-27 13:08:01.45
15	11	1	7	Pedido #17	1x Limpeza	RUA 262	74615300	Goiania	GO	\N	\N	70.00	\N	70.00	debit_card	completed	\N	completed	2025-07-27 13:42:00	2025-07-27 15:20:07.599	2025-07-27 13:42:19.054	2025-07-27 15:20:07.599
2	11	3	1	Pedido #3	1x Eletricista	RUA 262	74615300	Goiania	GO	\N	\N	50.00	\N	50.00	cash	completed	\N	completed	2025-07-25 17:00:00	2025-07-27 15:35:48.698	2025-07-25 18:30:10.891	2025-07-27 15:35:48.699
\.


--
-- TOC entry 3726 (class 0 OID 16829)
-- Dependencies: 256
-- Data for Name: service_zones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.service_zones (id, name, description, coordinates, city, state, is_active, created_at) FROM stdin;
\.


--
-- TOC entry 3728 (class 0 OID 16840)
-- Dependencies: 258
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_settings (id, key, value, type, description, is_system, updated_at) FROM stdin;
\.


--
-- TOC entry 3730 (class 0 OID 16854)
-- Dependencies: 260
-- Data for Name: user_upload_stats; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_upload_stats (id, user_id, daily_uploads, monthly_uploads, total_uploads, total_size, last_upload, last_daily_reset, last_monthly_reset, created_at, updated_at) FROM stdin;
1	14	1	1	1	41977	2025-07-27 13:55:03.78	2025-07-27 13:55:03.085646	2025-07-27 13:55:03.085646	2025-07-27 13:55:03.085646	2025-07-27 13:55:03.78
\.


--
-- TOC entry 3732 (class 0 OID 16871)
-- Dependencies: 262
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password, name, phone, user_type, address, cep, city, state, latitude, longitude, avatar, is_active, created_at, updated_at, cpf) FROM stdin;
1	admin@qservicos.com	$2b$10$1HbQkNIsLUJSOnbItxAsv.t9oXAUh17pphY/ia4hKXqLhGuIrX0Fm	Admin User	11999999999	admin	\N	\N	\N	\N	\N	\N	\N	t	2025-07-25 13:26:24.296152	2025-07-25 13:26:24.296152	\N
2	joao@cliente.com	$2b$10$t6hxmisDzG1vwQ3fwt6mL.ZIWNzCaD3sUN0DHwABdY3rmpbsZ8D02	João Silva	11987654321	client	\N	\N	\N	\N	\N	\N	\N	t	2025-07-25 13:40:06.38684	2025-07-25 13:40:06.38684	\N
3	maria@cliente.com	$2b$10$UxQu6fX2N0gMMOactKSdt.Q6LO.WWQ/RNB/My5EG0EuLjrzSoj3vq	Maria Santos	11876543210	client	\N	\N	\N	\N	\N	\N	\N	t	2025-07-25 13:40:11.351852	2025-07-25 13:40:11.351852	\N
4	carlos@provider.com	$2b$10$0qYzSEBlv.TPArvLYsj4SuuYrSNAKoKZjRV6.50TFh/Q.laLPFpBO	Carlos Ferreira	11765432109	provider	\N	\N	\N	\N	\N	\N	\N	t	2025-07-25 13:40:12.457589	2025-07-25 13:40:12.457589	\N
5	ana@provider.com	$2b$10$7lz2D8G8XkJ1T/JCjitEKuzuF6BLsaKEIyDPm61xYA8LYFXZmonOu	Ana Costa	11654321098	provider	\N	\N	\N	\N	\N	\N	\N	t	2025-07-25 13:40:13.39053	2025-07-25 13:40:13.39053	\N
6	joaomoura49@outlook.com	$2b$10$kQCHrW0.6L6VKg6mftMcvuOpDQxun1F9/tQMurj2AE9Ajkto0eXOS	João Moura	(11) 99999-9999	provider	\N	\N	\N	\N	\N	\N	\N	t	2025-07-25 14:00:00.752868	2025-07-25 14:00:00.752868	\N
7	maria@provider.com	$2b$10$xfAr5DhgLiDTR26qBybyBO15IDBpqm6KUTYNaVHQ2b20Y81RuUpi.	Maria Santos	(11) 91234-5678	provider	\N	\N	\N	\N	\N	\N	\N	t	2025-07-25 14:00:01.745273	2025-07-25 14:00:01.745273	\N
8	pedro@provider.com	$2b$10$HD9AgMuTfzYvXfYoABlLDeLjRKQ95fKHvxv0MzV9IHDnd2oEpOjRq	Pedro Silva	(11) 94567-8901	provider	\N	\N	\N	\N	\N	\N	\N	t	2025-07-25 14:00:04.135666	2025-07-25 14:00:04.135666	\N
9	ana@costa.com	$2b$10$yaq8InyNxcH761YkEU3cveOxmeRzfB4oZezzoblhkLSzk9zwCaohi	Ana Costa	(11) 93456-7890	provider	\N	\N	\N	\N	\N	\N	\N	t	2025-07-25 14:00:09.211204	2025-07-25 14:00:09.211204	\N
10	cliente.teste@qservicos.com	$2b$10$3WvNpF/H0eJqYEoBHm/1Z.K5gYZ7YdlnGruF15ROw0Bv2/xhRmFJm	Cliente Teste	11999999999	client	\N	\N	\N	\N	\N	\N	\N	t	2025-07-25 14:01:08.371452	2025-07-25 14:01:08.371452	\N
11	elis205@gmail.com	$2b$10$tTNfg5Nl/XEk52nBxaQdKO795l3wcYl9rq/6g39WD2deTPe1Z6REO	elivania	62981458264	client	\N	\N	\N	\N	\N	\N	\N	t	2025-07-25 14:01:09.90884	2025-07-25 14:01:09.90884	\N
12	relino@gmail.com	$2b$10$smE.9A9HAlKAxZBv1nvF/Ovst4tNdhrllbyZ/8z0/KHc4.Q9ir./q	renata	6299331122	client	\N	\N	\N	\N	\N	\N	\N	t	2025-07-27 09:38:47.2882	2025-07-27 09:38:47.2882	\N
13	marcelu.lino@gmail.com	$2b$10$R3/fqih9fqT0aOuhW2TPXuD2eiD4PDCtEAmKu4FpZmcht2XwsxPV2	MARCELO LINO	64999338744	provider	\N	\N	\N	\N	\N	\N	\N	t	2025-07-27 09:42:37.396851	2025-07-27 09:42:37.396851	\N
14	igooplay.games@gmail.com	$2b$10$cqV3crAK0j89NyMTJH/XJO.gOPLGsZU40EOCRXnhqvouWd3Ap4g8K	Igoor Play	6232028119	provider	Rua 262, 45 - Goiânia, GO	74615300	Goiania	GO	\N	\N	/uploads/providers/1753625048012_cq762vt9hnf.webp	t	2025-07-27 13:30:51.311704	2025-07-27 14:04:42.086	\N
15	ceicagyn@gmail.com	$2b$10$EVOgMvyafb8BIwr8w.7WM.1VxTJoPRVC7uYEzqvkX2F8lRjQhhuv2	CONCEICAO Lino	6232028119	client	\N	\N	\N	\N	\N	\N	\N	t	2025-07-28 18:43:31.778827	2025-07-28 18:43:31.778827	\N
16	joaomoura.gta49@gmail.com	$2b$10$x3QrUiLLuYO6fDBJvD05UOEPNC24M.PaZfCStUD3wjsuHAfsPXJri	João Moura	6299887766	provider	\N	\N	Goiânia	GO	\N	\N	\N	t	2025-07-29 00:09:39.330477	2025-07-29 00:09:39.330477	\N
17	elias.bomplay@gmail.com	$2b$10$TytlAmNnMa78KbBmQDAWtuMSWlLgtXL5WnRbvf98peqvVSIN22OTy	Elias Bomb	6299887766	provider	\N	\N	Goiânia	GO	\N	\N	\N	t	2025-07-29 01:04:58.661582	2025-07-29 01:04:58.661582	\N
18	contato@seucodigo.com	$2b$10$4c0LA/uwo7bMY9xgER6JB.Uh3IGfgJHdc2XHhYWXbP4S14SQGyDiy	Seu Código	6232028119	client	\N	\N	\N	\N	\N	\N	\N	t	2025-07-29 13:05:12.365794	2025-07-29 13:05:12.365794	\N
19	fernandez.moura7@gmail.com	$2b$10$KSTYJavqWqoHmJ0/lnzs..RSfx9KNcX9mKtZOSk/emf1dwCDFQRmy	Fernandez Moura	11999991001	provider	\N	\N	Goiânia	GO	\N	\N	\N	t	2025-07-29 13:25:22.408282	2025-07-29 13:25:22.408282	\N
20	maria.barbara17@outlook.com	$2b$10$3iwPcz7on94fAy8alJ6f7e2buqHBUOoHduvaOmj9Ub02bjA/RIILi	Maria	64999338745	client	\N	\N	\N	\N	\N	\N	\N	t	2025-07-29 13:31:21.261614	2025-07-29 13:31:21.261614	\N
21	roger@gmail.com	$2b$10$zQpzn0sknP46Uo6PFX.8BeHjIuE7ipbJjM8FiqwlgJvXzR3LIQB.m	Roger	6298657415	client	\N	\N	\N	\N	\N	\N	/uploads/avatars/1753013732039_y69qwbifzd.webp	t	2025-07-29 18:41:44.633314	2025-07-29 18:41:44.633314	\N
22	naema@gmail.com	$2b$10$G1FrCo87wNZpecdt92VXMulmiuhM7UIaqp3ecWojjj/hDjjYSxVZS	Naena	649988774455	client	Rua 262 - Setor Leste Universitário, Goiânia - GO, Brasil, 45, Apto 301	\N	Goiânia	GO	\N	\N	/uploads/avatars/avatar_1753816056136_uq78irpc9.jpg	t	2025-07-29 19:08:39.859738	2025-07-29 19:08:39.859738	\N
23	rodolfo@gmail.com	$2b$10$7lT9qJWf9m1SCSvTpE/gUuB5xaEWC4UFBpLdvsU1S4XckQt8wquuq	rodolfo weldon	6299887766	client	Rua 262 - Setor Leste Universitário, Goiânia - GO, Brasil, 45, Apto 301	\N	Goiânia	GO	\N	\N		t	2025-07-29 19:10:49.41321	2025-07-29 19:10:49.41321	\N
24	raquel@gmail.com	$2b$10$lAfM4X6YgcXpEr3UkkiDIOAtKu9NmP7KFP4GBOxJIPO5jIv1tXID6	Raquel	6269857412	client	Rua 207 - Setor Leste Vila Nova, Goiânia - GO, Brasil, 45, Apto 301	74615-300	Goiânia	GO	\N	\N		t	2025-07-29 19:19:03.053126	2025-07-29 19:24:44.232	689.578.310-53
25	ronaldo10@gmail.com	$2b$10$ShoAapkPtuNRdBPDq9Gww.IlpA8yc9.xRFzD2VHVJS9AHArcibXuq	Ronaldinho	62981456987	client	Rua 35 - Jardim Tiradentes, Aparecida de Goiânia - GO, Brasil, 1000, casa 02	74063-410	Aparecida de Goiânia	GO	\N	\N	/uploads/avatars/avatar_1753834002588_dppt9c82d.jpg	t	2025-07-30 00:07:27.472853	2025-07-30 00:07:27.472853	165.842.340-29
\.


--
-- TOC entry 3734 (class 0 OID 16886)
-- Dependencies: 264
-- Data for Name: withdrawal_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.withdrawal_requests (id, provider_id, amount, bank_name, account_number, account_holder_name, cpf_cnpj, payment_method, pix_key, status, request_notes, admin_notes, processed_by, processed_at, created_at, updated_at, bank_account_id, pix_key_id) FROM stdin;
\.


--
-- TOC entry 3765 (class 0 OID 0)
-- Dependencies: 215
-- Name: chat_conversations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.chat_conversations_id_seq', 2, true);


--
-- TOC entry 3766 (class 0 OID 0)
-- Dependencies: 217
-- Name: chat_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.chat_messages_id_seq', 4, true);


--
-- TOC entry 3767 (class 0 OID 0)
-- Dependencies: 219
-- Name: coupons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.coupons_id_seq', 1, false);


--
-- TOC entry 3768 (class 0 OID 0)
-- Dependencies: 221
-- Name: employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.employees_id_seq', 1, false);


--
-- TOC entry 3769 (class 0 OID 0)
-- Dependencies: 223
-- Name: file_uploads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.file_uploads_id_seq', 1, true);


--
-- TOC entry 3770 (class 0 OID 0)
-- Dependencies: 225
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- TOC entry 3771 (class 0 OID 0)
-- Dependencies: 227
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.order_items_id_seq', 21, true);


--
-- TOC entry 3772 (class 0 OID 0)
-- Dependencies: 229
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.orders_id_seq', 17, true);


--
-- TOC entry 3773 (class 0 OID 0)
-- Dependencies: 231
-- Name: payment_gateway_configs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payment_gateway_configs_id_seq', 2, true);


--
-- TOC entry 3774 (class 0 OID 0)
-- Dependencies: 233
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payments_id_seq', 1, false);


--
-- TOC entry 3775 (class 0 OID 0)
-- Dependencies: 235
-- Name: promotional_banners_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.promotional_banners_id_seq', 1, false);


--
-- TOC entry 3776 (class 0 OID 0)
-- Dependencies: 237
-- Name: provider_bank_accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.provider_bank_accounts_id_seq', 2, true);


--
-- TOC entry 3777 (class 0 OID 0)
-- Dependencies: 239
-- Name: provider_earnings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.provider_earnings_id_seq', 4, true);


--
-- TOC entry 3778 (class 0 OID 0)
-- Dependencies: 241
-- Name: provider_pix_keys_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.provider_pix_keys_id_seq', 1, true);


--
-- TOC entry 3779 (class 0 OID 0)
-- Dependencies: 243
-- Name: provider_services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.provider_services_id_seq', 15, true);


--
-- TOC entry 3780 (class 0 OID 0)
-- Dependencies: 245
-- Name: providers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.providers_id_seq', 9, true);


--
-- TOC entry 3781 (class 0 OID 0)
-- Dependencies: 247
-- Name: reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reviews_id_seq', 7, true);


--
-- TOC entry 3782 (class 0 OID 0)
-- Dependencies: 249
-- Name: service_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.service_assignments_id_seq', 1, false);


--
-- TOC entry 3783 (class 0 OID 0)
-- Dependencies: 251
-- Name: service_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.service_categories_id_seq', 5, true);


--
-- TOC entry 3784 (class 0 OID 0)
-- Dependencies: 253
-- Name: service_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.service_requests_id_seq', 15, true);


--
-- TOC entry 3785 (class 0 OID 0)
-- Dependencies: 255
-- Name: service_zones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.service_zones_id_seq', 1, false);


--
-- TOC entry 3786 (class 0 OID 0)
-- Dependencies: 257
-- Name: system_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.system_settings_id_seq', 1, false);


--
-- TOC entry 3787 (class 0 OID 0)
-- Dependencies: 259
-- Name: user_upload_stats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_upload_stats_id_seq', 1, true);


--
-- TOC entry 3788 (class 0 OID 0)
-- Dependencies: 261
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 25, true);


--
-- TOC entry 3789 (class 0 OID 0)
-- Dependencies: 263
-- Name: withdrawal_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.withdrawal_requests_id_seq', 1, false);


--
-- TOC entry 3450 (class 2606 OID 16586)
-- Name: chat_conversations chat_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_pkey PRIMARY KEY (id);


--
-- TOC entry 3452 (class 2606 OID 16599)
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- TOC entry 3454 (class 2606 OID 16614)
-- Name: coupons coupons_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_unique UNIQUE (code);


--
-- TOC entry 3456 (class 2606 OID 16612)
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- TOC entry 3458 (class 2606 OID 16626)
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- TOC entry 3460 (class 2606 OID 16641)
-- Name: file_uploads file_uploads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_uploads
    ADD CONSTRAINT file_uploads_pkey PRIMARY KEY (id);


--
-- TOC entry 3462 (class 2606 OID 16652)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 3464 (class 2606 OID 16664)
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3466 (class 2606 OID 16680)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 3468 (class 2606 OID 16693)
-- Name: payment_gateway_configs payment_gateway_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_gateway_configs
    ADD CONSTRAINT payment_gateway_configs_pkey PRIMARY KEY (id);


--
-- TOC entry 3470 (class 2606 OID 16705)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- TOC entry 3472 (class 2606 OID 16719)
-- Name: promotional_banners promotional_banners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotional_banners
    ADD CONSTRAINT promotional_banners_pkey PRIMARY KEY (id);


--
-- TOC entry 3474 (class 2606 OID 16731)
-- Name: provider_bank_accounts provider_bank_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_bank_accounts
    ADD CONSTRAINT provider_bank_accounts_pkey PRIMARY KEY (id);


--
-- TOC entry 3476 (class 2606 OID 16740)
-- Name: provider_earnings provider_earnings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_earnings
    ADD CONSTRAINT provider_earnings_pkey PRIMARY KEY (id);


--
-- TOC entry 3478 (class 2606 OID 16752)
-- Name: provider_pix_keys provider_pix_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_pix_keys
    ADD CONSTRAINT provider_pix_keys_pkey PRIMARY KEY (id);


--
-- TOC entry 3480 (class 2606 OID 16764)
-- Name: provider_services provider_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_services
    ADD CONSTRAINT provider_services_pkey PRIMARY KEY (id);


--
-- TOC entry 3482 (class 2606 OID 16781)
-- Name: providers providers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.providers
    ADD CONSTRAINT providers_pkey PRIMARY KEY (id);


--
-- TOC entry 3484 (class 2606 OID 16791)
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- TOC entry 3486 (class 2606 OID 16803)
-- Name: service_assignments service_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_assignments
    ADD CONSTRAINT service_assignments_pkey PRIMARY KEY (id);


--
-- TOC entry 3488 (class 2606 OID 16814)
-- Name: service_categories service_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_categories
    ADD CONSTRAINT service_categories_pkey PRIMARY KEY (id);


--
-- TOC entry 3490 (class 2606 OID 16827)
-- Name: service_requests service_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_pkey PRIMARY KEY (id);


--
-- TOC entry 3492 (class 2606 OID 16838)
-- Name: service_zones service_zones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_zones
    ADD CONSTRAINT service_zones_pkey PRIMARY KEY (id);


--
-- TOC entry 3494 (class 2606 OID 16852)
-- Name: system_settings system_settings_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_key_unique UNIQUE (key);


--
-- TOC entry 3496 (class 2606 OID 16850)
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 3498 (class 2606 OID 16867)
-- Name: user_upload_stats user_upload_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_upload_stats
    ADD CONSTRAINT user_upload_stats_pkey PRIMARY KEY (id);


--
-- TOC entry 3500 (class 2606 OID 16869)
-- Name: user_upload_stats user_upload_stats_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_upload_stats
    ADD CONSTRAINT user_upload_stats_user_id_unique UNIQUE (user_id);


--
-- TOC entry 3502 (class 2606 OID 16884)
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- TOC entry 3504 (class 2606 OID 16882)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3506 (class 2606 OID 16896)
-- Name: withdrawal_requests withdrawal_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.withdrawal_requests
    ADD CONSTRAINT withdrawal_requests_pkey PRIMARY KEY (id);


--
-- TOC entry 3507 (class 2606 OID 16897)
-- Name: chat_conversations chat_conversations_participant_one_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_participant_one_id_users_id_fk FOREIGN KEY (participant_one_id) REFERENCES public.users(id);


--
-- TOC entry 3508 (class 2606 OID 16902)
-- Name: chat_conversations chat_conversations_participant_two_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_participant_two_id_users_id_fk FOREIGN KEY (participant_two_id) REFERENCES public.users(id);


--
-- TOC entry 3509 (class 2606 OID 16907)
-- Name: chat_conversations chat_conversations_service_request_id_service_requests_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_service_request_id_service_requests_id_fk FOREIGN KEY (service_request_id) REFERENCES public.service_requests(id);


--
-- TOC entry 3510 (class 2606 OID 16912)
-- Name: chat_messages chat_messages_conversation_id_chat_conversations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_conversation_id_chat_conversations_id_fk FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id);


--
-- TOC entry 3511 (class 2606 OID 16917)
-- Name: chat_messages chat_messages_sender_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_sender_id_users_id_fk FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- TOC entry 3512 (class 2606 OID 16922)
-- Name: employees employees_provider_id_providers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_provider_id_providers_id_fk FOREIGN KEY (provider_id) REFERENCES public.providers(id);


--
-- TOC entry 3513 (class 2606 OID 16927)
-- Name: employees employees_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3514 (class 2606 OID 16932)
-- Name: file_uploads file_uploads_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_uploads
    ADD CONSTRAINT file_uploads_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3515 (class 2606 OID 16937)
-- Name: notifications notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3516 (class 2606 OID 16942)
-- Name: order_items order_items_order_id_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- TOC entry 3517 (class 2606 OID 16947)
-- Name: order_items order_items_provider_service_id_provider_services_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_provider_service_id_provider_services_id_fk FOREIGN KEY (provider_service_id) REFERENCES public.provider_services(id);


--
-- TOC entry 3518 (class 2606 OID 16952)
-- Name: orders orders_client_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_client_id_users_id_fk FOREIGN KEY (client_id) REFERENCES public.users(id);


--
-- TOC entry 3519 (class 2606 OID 16957)
-- Name: orders orders_provider_id_providers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_provider_id_providers_id_fk FOREIGN KEY (provider_id) REFERENCES public.providers(id);


--
-- TOC entry 3520 (class 2606 OID 16962)
-- Name: payments payments_service_request_id_service_requests_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_service_request_id_service_requests_id_fk FOREIGN KEY (service_request_id) REFERENCES public.service_requests(id);


--
-- TOC entry 3521 (class 2606 OID 16967)
-- Name: promotional_banners promotional_banners_category_id_service_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotional_banners
    ADD CONSTRAINT promotional_banners_category_id_service_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.service_categories(id);


--
-- TOC entry 3522 (class 2606 OID 16972)
-- Name: provider_bank_accounts provider_bank_accounts_provider_id_providers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_bank_accounts
    ADD CONSTRAINT provider_bank_accounts_provider_id_providers_id_fk FOREIGN KEY (provider_id) REFERENCES public.providers(id);


--
-- TOC entry 3523 (class 2606 OID 16977)
-- Name: provider_earnings provider_earnings_provider_id_providers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_earnings
    ADD CONSTRAINT provider_earnings_provider_id_providers_id_fk FOREIGN KEY (provider_id) REFERENCES public.providers(id);


--
-- TOC entry 3524 (class 2606 OID 16982)
-- Name: provider_earnings provider_earnings_service_request_id_service_requests_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_earnings
    ADD CONSTRAINT provider_earnings_service_request_id_service_requests_id_fk FOREIGN KEY (service_request_id) REFERENCES public.service_requests(id);


--
-- TOC entry 3525 (class 2606 OID 16987)
-- Name: provider_pix_keys provider_pix_keys_provider_id_providers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_pix_keys
    ADD CONSTRAINT provider_pix_keys_provider_id_providers_id_fk FOREIGN KEY (provider_id) REFERENCES public.providers(id);


--
-- TOC entry 3526 (class 2606 OID 16997)
-- Name: provider_services provider_services_category_id_service_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_services
    ADD CONSTRAINT provider_services_category_id_service_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.service_categories(id);


--
-- TOC entry 3527 (class 2606 OID 16992)
-- Name: provider_services provider_services_provider_id_providers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_services
    ADD CONSTRAINT provider_services_provider_id_providers_id_fk FOREIGN KEY (provider_id) REFERENCES public.providers(id);


--
-- TOC entry 3528 (class 2606 OID 17002)
-- Name: providers providers_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.providers
    ADD CONSTRAINT providers_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3529 (class 2606 OID 17012)
-- Name: reviews reviews_client_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_client_id_users_id_fk FOREIGN KEY (client_id) REFERENCES public.users(id);


--
-- TOC entry 3530 (class 2606 OID 17017)
-- Name: reviews reviews_provider_id_providers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_provider_id_providers_id_fk FOREIGN KEY (provider_id) REFERENCES public.providers(id);


--
-- TOC entry 3531 (class 2606 OID 17007)
-- Name: reviews reviews_service_request_id_service_requests_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_service_request_id_service_requests_id_fk FOREIGN KEY (service_request_id) REFERENCES public.service_requests(id);


--
-- TOC entry 3532 (class 2606 OID 17027)
-- Name: service_assignments service_assignments_employee_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_assignments
    ADD CONSTRAINT service_assignments_employee_id_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- TOC entry 3533 (class 2606 OID 17022)
-- Name: service_assignments service_assignments_service_request_id_service_requests_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_assignments
    ADD CONSTRAINT service_assignments_service_request_id_service_requests_id_fk FOREIGN KEY (service_request_id) REFERENCES public.service_requests(id);


--
-- TOC entry 3534 (class 2606 OID 17037)
-- Name: service_requests service_requests_category_id_service_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_category_id_service_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.service_categories(id);


--
-- TOC entry 3535 (class 2606 OID 17032)
-- Name: service_requests service_requests_client_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_client_id_users_id_fk FOREIGN KEY (client_id) REFERENCES public.users(id);


--
-- TOC entry 3536 (class 2606 OID 17042)
-- Name: service_requests service_requests_provider_id_providers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_provider_id_providers_id_fk FOREIGN KEY (provider_id) REFERENCES public.providers(id);


--
-- TOC entry 3537 (class 2606 OID 17047)
-- Name: user_upload_stats user_upload_stats_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_upload_stats
    ADD CONSTRAINT user_upload_stats_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3538 (class 2606 OID 73728)
-- Name: withdrawal_requests withdrawal_requests_bank_account_id_provider_bank_accounts_id_f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.withdrawal_requests
    ADD CONSTRAINT withdrawal_requests_bank_account_id_provider_bank_accounts_id_f FOREIGN KEY (bank_account_id) REFERENCES public.provider_bank_accounts(id);


--
-- TOC entry 3539 (class 2606 OID 17067)
-- Name: withdrawal_requests withdrawal_requests_pix_key_id_provider_pix_keys_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.withdrawal_requests
    ADD CONSTRAINT withdrawal_requests_pix_key_id_provider_pix_keys_id_fk FOREIGN KEY (pix_key_id) REFERENCES public.provider_pix_keys(id);


--
-- TOC entry 3540 (class 2606 OID 17057)
-- Name: withdrawal_requests withdrawal_requests_processed_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.withdrawal_requests
    ADD CONSTRAINT withdrawal_requests_processed_by_users_id_fk FOREIGN KEY (processed_by) REFERENCES public.users(id);


--
-- TOC entry 3541 (class 2606 OID 17052)
-- Name: withdrawal_requests withdrawal_requests_provider_id_providers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.withdrawal_requests
    ADD CONSTRAINT withdrawal_requests_provider_id_providers_id_fk FOREIGN KEY (provider_id) REFERENCES public.providers(id);


-- Completed on 2025-07-30 01:09:03 UTC

--
-- PostgreSQL database dump complete
--

