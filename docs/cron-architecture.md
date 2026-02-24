# Cron Job Fan-Out Architecture

## The Problem
Vercel's Hobby plan imposes a strict 60-second limit on Serverless Functions execution (e.g., `/api/cron`). Generating personalized emails involves heavy operations:
1. Fetching multiple RSS feeds.
2. Generating a narrative briefing via the Gemini LLM API.
3. Sending the email via SendGrid.

These steps can take ~10-15 seconds per user. Processing all users sequentially within a single cron execution quickly hits the 60-second limit and kills the process, leaving users scheduled for the same exact minute unserved. The `cron-job.org` utility pings exactly once per minute; if 08:00 users fail, the 08:01 ping skips them because they no longer strictly match `08:01`.

## The Solution: Fan-Out Pattern
Instead of processing users sequentially, we use a **Fan-Out Architecture** to decouple *dispatching* from *processing*.

### 1. The Dispatcher (`/api/cron`)
Triggered exactly on the minute by `cron-job.org`, this endpoint takes less than a second to execute:
- Iterates over all users.
- Checks if the current time exactly matches their `deliveryTime`.
- If a match is found, it asynchronously triggers a worker (`/api/digest/generate`) to actually do the heavy lifting.
- Crucially, it **does not `await`** the worker’s response, allowing the router to complete instantly and spin up all needed workers in parallel.

### 2. The Worker (`/api/digest/generate`)
A dedicated internal endpoint that accepts a single user email payload:
- Fetches RSS feeds for the provided user.
- Queries Gemini for the digest layout.
- Sends the finished email context to SendGrid.
- Safely completes its task within 15 seconds independently.

By distributing the workloads to parallel workers, this completely avoids Vercel's sequential 60-second limit and guarantees precise-time dispatching.

## Handling Hobby Plan Constraints
Vercel Hobby supports 1,000,000 function invocations and 4 hours of total Active CPU execution time monthly. This architecture scales brilliantly within these limits constraints:
- Concurrent worker invocations scale automatically. Setting off 50 concurrent `fetch()` calls merely instantiates 50 instances of the worker function parallel to each other.
- The only potential Serverless limit comes from TCP connection pooling (e.g., a Postgres database maximum connections pool). However, since we use Upstash Redis over HTTP (REST), we bypass max concurrency issues because the connection requests are entirely stateless.

This technique delivers immediate precision without necessitating infrastructure upgrades.
