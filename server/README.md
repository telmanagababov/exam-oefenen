# Exam Oefenen Server

Server for the Dutch Inburgeringsexamen practice application.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set environment variables:

```bash
export GEMINI_API_KEY=your_api_key_here
export GEMINI_MODEL=gemini-1.5-pro  # or gemini-2.5-flash
export PORT=3000  # optional, defaults to 3000
```

3. Build the project:

```bash
npm run build
```

4. Run the server:

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## State Management

The server uses an in-memory store for exercise sessions by default. This is suitable for:

- Single server instance
- Development/testing
- Small-scale deployments

### When to use Redis

Consider migrating to Redis if you need:

- **Horizontal scaling**: Multiple server instances sharing the same session data
- **Persistence**: Sessions that survive server restarts
- **High availability**: Session data that needs to be available across server failures
- **Large scale**: Thousands of concurrent sessions

### Migration to Redis

If you need Redis, you can:

1. Install `ioredis` or `redis` package
2. Replace the in-memory store with a Redis-backed implementation
3. Use Redis hash maps to store session data with TTL

Example Redis structure:

- Key: `session:{sessionId}`
- Hash fields: `exercises:{examType}` (JSON stringified)
- TTL: 24 hours
