CREATE TABLE "public"."layers" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "incident" uuid NOT NULL, "name" text NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("incident") REFERENCES "public"."incidents"("id") ON UPDATE restrict ON DELETE restrict, UNIQUE ("id"));
CREATE EXTENSION IF NOT EXISTS pgcrypto;
