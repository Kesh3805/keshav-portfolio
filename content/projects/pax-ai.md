---
title: Enterprise Context-Aware Conversational AI Platform
slug: pax-ai
category: professional
description: Enterprise conversational AI gateway grounding LLM responses on real business entities — clients, projects and active persons — from an entity catalog.
role: Feature Contributor · Core Conversational AI Gateway
technologies:
  - NestJS
  - TypeScript
  - Node.js
  - Google OAuth
  - JWT
  - Docker
tags:
  - Backend
  - NestJS
  - AI
  - LLM
order: 2
---

## Overview

The platform is an enterprise AI system powering AI-assisted conversations, meeting intelligence, and background job processing for business workflows across three microservices.

## What I Built

### Chat API refactor (Core Conversational AI Gateway)

- Refactored the core chat service and DTOs into a modular structure with improved context handling and response generation.
- Wired Entity Catalog data — clients, projects, active persons — directly into chat context and LLM prompt construction, so responses are grounded on real business data instead of generic completions.
- Fixed the project query to filter by active person status in the join conditions.

### Global response standardisation

- Added a response-envelope opt-out for endpoints that need raw passthrough instead of the global response envelope.

## Technology

NestJS · TypeScript 5 · Node.js 22+ · Clean Architecture · LLM prompt engineering · Google OAuth · JWT · Docker
