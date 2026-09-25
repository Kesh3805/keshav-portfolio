---
title: Multi-Tenant E-Commerce Administrative Platform
slug: groupkart
category: professional
description: Full-stack administrative platform for multi-tenant e-commerce operations, with a NestJS backend bootstrapped to migrate incrementally off a legacy PHP monolith.
role: Core Contributor · backend foundation
technologies:
  - NestJS
  - TypeScript
  - MySQL
  - TypeORM
  - AWS S3
  - Passport JWT
  - Swagger
tags:
  - Backend
  - NestJS
  - MySQL
order: 4
metrics:
  - value: '60MB'
    label: direct-to-S3 streaming uploads, no disk buffering
---

## Problem

The platform is a full-stack admin system for a multi-tenant e-commerce marketplace covering products, orders, categories, customers, taxes, delivery and media. The new NestJS backend had to coexist with a legacy CodeIgniter system and let the frontend migrate incrementally.

I bootstrapped the NestJS backend from zero and built the foundational modules the rest of the team built on.

## What I Built

### Foundation

- NestJS boilerplate: project structure, TypeORM database module, global API response envelopes, JWT/Passport auth, GitHub PR templates.
- Complete admin-side TypeORM entity coverage generated from the live production MySQL schema — a typed representation of every table.
- JWT guard, role decorators, and legacy issuer compatibility so the new auth coexists with the existing CodeIgniter session.

### Domain modules

- **Products** — admin CRUD with attribute and variant resolution, and parity with the legacy CodeIgniter import endpoints. Fixed a SQL bug that selected attribute values incorrectly.
- **Orders & tickets** — repository and service layers, order status management and tracking assignment.
- **Brands** and **countries** — admin CRUD; countries feed delivery-zone configuration and tax-region management.
- **Media & S3** — direct-to-S3 streaming upload with a 60MB limit and MIME-type enforcement, with no local disk buffering; S3 wired into the NestJS DI system.

## Engineering Decisions

- **Legacy-compatible response shapes.** Product responses were aligned with the legacy shapes so the frontend could migrate incrementally without breaking existing consumers.
- **Audit before migrating.** I audited the legacy PHP controller and documented every endpoint and data shape as the migration target reference.
- **Shrink the migration surface.** Standalone APIs were retired and tracking moved into the shipping module, removing dead code paths.
- **Consistent metadata and errors.** TypeORM migration metadata corrected to use `PrimaryColumn`, and response structure normalised across services with consistent error and message shapes.

## Technology

NestJS 10 · TypeScript 5 · MySQL 8.0 · TypeORM · AWS S3 SDK · Passport JWT · Swagger
