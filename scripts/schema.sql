CREATE TABLE IF NOT EXISTS players (
 id text PRIMARY KEY,
 "firstName" text NOT NULL,
 "lastName" text NOT NULL,
 number integer NOT NULL CHECK (number BETWEEN 0 AND 99),
 code text NOT NULL UNIQUE,
 "documentType" text NOT NULL DEFAULT '',
 "documentNumber" text NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS team (id integer PRIMARY KEY, name text NOT NULL);
CREATE TABLE IF NOT EXISTS directors (
 id text PRIMARY KEY,
 "firstName" text NOT NULL,
 "lastName" text NOT NULL,
 code text NOT NULL DEFAULT '',
 "documentType" text NOT NULL DEFAULT '',
 "documentNumber" text NOT NULL DEFAULT ''
);
