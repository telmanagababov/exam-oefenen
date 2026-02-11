# Understanding Our Dockerfile

This guide provides a detailed explanation of our multi-stage Dockerfile, what happens at each step, and the resulting folder structure.

## Table of Contents
- [Overview](#overview)
- [Multi-Stage Build Concept](#multi-stage-build-concept)
- [Stage 1: Build Angular Client](#stage-1-build-angular-client)
- [Stage 2: Build Express Server](#stage-2-build-express-server)
- [Stage 3: Production Image](#stage-3-production-image)
- [Final Image Structure](#final-image-structure)
- [Why This Architecture?](#why-this-architecture)
- [Optimization Tips](#optimization-tips)

## Overview

Our Dockerfile uses a **multi-stage build** pattern to create a production-ready image for our full-stack Angular + Express application.

**What it does:**
1. Builds the Angular frontend
2. Builds the Express backend
3. Combines only the compiled outputs into a minimal production image

**Key Benefits:**
- Small final image size (~205MB vs 1GB+)
- No development dependencies in production
- Clean separation of build and runtime environments
- Faster deployments

## Multi-Stage Build Concept

A multi-stage build uses multiple `FROM` statements in one Dockerfile. Each `FROM` starts a new stage.

```dockerfile
FROM node:20-alpine AS stage1    # Stage 1
# ... build stuff ...

FROM node:20-alpine AS stage2    # Stage 2
# ... build stuff ...

FROM node:20-alpine              # Final stage
# Copy only what we need from stage1 and stage2
```

**Why?**
- Build stages can have different tools and dependencies
- Final stage only gets compiled outputs, not source code or build tools
- Discarded stages don't bloat the final image

---

## Stage 1: Build Angular Client

### Dockerfile Code

```dockerfile
# Stage 1: Build Angular client
FROM node:20-alpine AS client-builder
WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./
RUN npm ci

# Copy client source
COPY client/ ./

# Build Angular app for production
RUN npm run build
```

### What Happens Step-by-Step

#### 1. Base Image Selection
```dockerfile
FROM node:20-alpine AS client-builder
```
- Uses Node.js 20 on Alpine Linux (lightweight, ~40MB vs ~900MB for standard Node)
- Names this stage `client-builder` so we can reference it later
- Creates a fresh, isolated environment

#### 2. Set Working Directory
```dockerfile
WORKDIR /app/client
```
- Creates `/app/client` directory inside the container
- All subsequent commands run from this directory

**Container structure now:**
```
/
├── app/
│   └── client/        ← We are here
├── usr/
├── etc/
└── ...
```

#### 3. Copy Package Files First
```dockerfile
COPY client/package*.json ./
```
- Copies `package.json` and `package-lock.json` from host's `client/` directory
- Copies to current directory (`/app/client/`)

**Why copy package files separately?**
Docker caches each layer. If package files haven't changed, Docker reuses the cached `npm ci` result, making rebuilds faster.

**Container structure now:**
```
/app/client/
├── package.json
└── package-lock.json
```

#### 4. Install Dependencies
```dockerfile
RUN npm ci
```
- `npm ci` installs exact versions from `package-lock.json`
- Installs all dependencies (including devDependencies needed for building)

**Container structure now:**
```
/app/client/
├── node_modules/          ← ~600 packages installed
│   ├── @angular/
│   ├── @ngrx/
│   ├── bootstrap/
│   └── ...
├── package.json
└── package-lock.json
```

#### 5. Copy Source Code
```dockerfile
COPY client/ ./
```
- Copies entire `client/` directory from host
- Includes: `src/`, `tsconfig.json`, `angular.json`, etc.

**Container structure now:**
```
/app/client/
├── node_modules/
├── src/
│   ├── app/
│   ├── assets/
│   ├── index.html
│   └── main.ts
├── angular.json
├── tsconfig.json
├── package.json
└── package-lock.json
```

#### 6. Build Angular Application
```dockerfile
RUN npm run build
```
- Runs `ng build` (defined in `package.json`)
- Angular CLI compiles TypeScript, optimizes assets, bundles code
- Creates production-ready static files

**Container structure after build:**
```
/app/client/
├── node_modules/          ← Still here but won't be copied to final image
├── src/                   ← Source code, not needed in production
├── dist/                  ← Build output (THIS is what we need!)
│   └── exam-oefenen-client/
│       └── browser/
│           ├── index.html
│           ├── main-HASH.js
│           ├── polyfills-HASH.js
│           ├── styles-HASH.css
│           └── assets/
├── angular.json
├── tsconfig.json
├── package.json
└── package-lock.json
```

**Result:** We now have compiled Angular app in `/app/client/dist/exam-oefenen-client/browser/`

---

## Stage 2: Build Express Server

### Dockerfile Code

```dockerfile
# Stage 2: Build Express server
FROM node:20-alpine AS server-builder
WORKDIR /app/server

# Copy server package files
COPY server/package*.json ./
COPY server/tsconfig.json ./
RUN npm ci

# Copy server source
COPY server/src ./src

# Build TypeScript server
RUN npm run build
```

### What Happens Step-by-Step

#### 1. New Base Image
```dockerfile
FROM node:20-alpine AS server-builder
```
- Starts a **completely fresh** container
- Stage 1 still exists but this is independent
- Named `server-builder` for later reference

#### 2. Set Working Directory
```dockerfile
WORKDIR /app/server
```
**Container structure:**
```
/
├── app/
│   └── server/        ← We are here
├── usr/
└── ...
```

#### 3. Copy Package and Config Files
```dockerfile
COPY server/package*.json ./
COPY server/tsconfig.json ./
```
- Copies Node.js dependencies list
- Copies TypeScript compiler configuration

**Container structure now:**
```
/app/server/
├── package.json
├── package-lock.json
└── tsconfig.json
```

#### 4. Install Dependencies
```dockerfile
RUN npm ci
```
**Container structure now:**
```
/app/server/
├── node_modules/          ← ~70 packages
│   ├── express/
│   ├── cors/
│   ├── dotenv/
│   ├── typescript/        ← Build tool
│   └── ...
├── package.json
├── package-lock.json
└── tsconfig.json
```

#### 5. Copy Source Code
```dockerfile
COPY server/src ./src
```
**Container structure now:**
```
/app/server/
├── node_modules/
├── src/
│   ├── index.ts           ← TypeScript source
│   ├── routes/
│   ├── services/
│   └── rules/             ← Markdown files
│       └── *.md
├── package.json
├── package-lock.json
└── tsconfig.json
```

#### 6. Build TypeScript Server
```dockerfile
RUN npm run build
```
- Runs `tsc` (TypeScript compiler)
- Compiles `.ts` files to `.js` files
- Outputs to `dist/` directory (configured in `tsconfig.json`)

**Container structure after build:**
```
/app/server/
├── node_modules/          ← Build dependencies still here
├── src/                   ← Source TypeScript files
│   ├── index.ts
│   ├── routes/
│   ├── services/
│   └── rules/
│       └── *.md
├── dist/                  ← Compiled JavaScript (THIS is what we need!)
│   ├── index.js
│   ├── routes/
│   └── services/
├── package.json
├── package-lock.json
└── tsconfig.json
```

**Note:** The `rules/*.md` files are NOT compiled by TypeScript, so they stay in `src/rules/`. We'll copy them separately.

**Result:** We have compiled Express server in `/app/server/dist/`

---

## Stage 3: Production Image

### Dockerfile Code

```dockerfile
# Stage 3: Production image
FROM node:20-alpine
WORKDIR /app

# Install production dependencies for server
COPY server/package*.json ./
RUN npm ci --only=production

# Copy built server from builder
COPY --from=server-builder /app/server/dist ./dist

# Copy rule files (markdown files are not compiled by TypeScript)
COPY --from=server-builder /app/server/src/rules ./dist/rules

# Copy built Angular app from builder
COPY --from=client-builder /app/client/dist/exam-oefenen-client/browser ./public

# Expose port (Render and other services use PORT env variable)
EXPOSE 3000

# Set NODE_ENV to production
ENV NODE_ENV=production

# Start the Express server
CMD ["node", "dist/index.js"]
```

### What Happens Step-by-Step

#### 1. Fresh Base Image
```dockerfile
FROM node:20-alpine
```
- **No stage name** = this is the final stage
- Starts completely fresh (Stage 1 and 2 won't be in final image)
- Only what we explicitly copy will exist here

#### 2. Set Working Directory
```dockerfile
WORKDIR /app
```
**Container structure:**
```
/
├── app/        ← We are here
├── usr/
└── ...
```

#### 3. Install Production Dependencies Only
```dockerfile
COPY server/package*.json ./
RUN npm ci --only=production
```
- `--only=production` skips devDependencies
- No TypeScript compiler, no Angular CLI, no testing tools
- Only runtime dependencies (express, cors, dotenv, etc.)

**Why do we need `node_modules` in production?**
Our compiled `dist/index.js` still contains `import` statements (e.g., `import express from 'express'`). TypeScript compilation only transpiles syntax—it **doesn't bundle dependencies**. At runtime, Node.js looks for these packages in `node_modules/`. Without it, the server would crash with "Cannot find module 'express'".

**Why doesn't the frontend need `node_modules`?**
Angular uses Webpack to **bundle** all dependencies into the JavaScript files. Everything (Angular, Bootstrap, your code) is combined into `main-HASH.js`. The browser downloads self-contained files with no external imports—no `node_modules` needed!

**Container structure now:**
```
/app/
├── node_modules/          ← Only ~50 production packages
│   ├── express/
│   ├── cors/
│   ├── dotenv/
│   └── ...
│   (NO typescript, NO @angular/cli, etc.)
├── package.json
└── package-lock.json
```

#### 4. Copy Compiled Server
```dockerfile
COPY --from=server-builder /app/server/dist ./dist
```
- `--from=server-builder` pulls from Stage 2
- Copies compiled JavaScript from `/app/server/dist` (Stage 2) → `/app/dist` (Stage 3)

**Container structure now:**
```
/app/
├── node_modules/
├── dist/                  ← Compiled JavaScript from Stage 2
│   ├── index.js
│   ├── routes/
│   │   └── *.js
│   └── services/
│       └── *.js
├── package.json
└── package-lock.json
```

#### 5. Copy Rule Files
```dockerfile
COPY --from=server-builder /app/server/src/rules ./dist/rules
```
- Markdown files weren't compiled by TypeScript
- Copy them from Stage 2's source directory
- Place them next to compiled code

**Container structure now:**
```
/app/
├── node_modules/
├── dist/
│   ├── index.js
│   ├── routes/
│   ├── services/
│   └── rules/             ← Markdown files from Stage 2
│       └── *.md
├── package.json
└── package-lock.json
```

#### 6. Copy Built Angular App
```dockerfile
COPY --from=client-builder /app/client/dist/exam-oefenen-client/browser ./public
```
- Copies compiled Angular from Stage 1
- Places in `/app/public` directory
- Express will serve these static files

**Container structure now:**
```
/app/
├── node_modules/
├── dist/                  ← Backend (Express server)
│   ├── index.js
│   ├── routes/
│   ├── services/
│   └── rules/
├── public/                ← Frontend (Angular app)
│   ├── index.html
│   ├── main-HASH.js
│   ├── polyfills-HASH.js
│   ├── styles-HASH.css
│   └── assets/
├── package.json
└── package-lock.json
```

#### 7. Expose Port
```dockerfile
EXPOSE 3000
```
- Documents that the container listens on port 3000
- Doesn't actually publish the port (you do that with `-p 3000:3000`)
- Informational for users and orchestration tools

#### 8. Set Environment Variable
```dockerfile
ENV NODE_ENV=production
```
- Sets `NODE_ENV=production` for all processes
- Affects Express behavior (error handling, logging, etc.)

#### 9. Define Startup Command
```dockerfile
CMD ["node", "dist/index.js"]
```
- Runs when container starts
- Starts the Express server
- Express serves Angular app from `/app/public`

---

## Final Image Structure

When you run `docker run -p 3000:3000 toetsen-oefenen`, the container has this structure:

```
/
├── app/                           ← Working directory
│   ├── node_modules/              ← ~50 production packages (~30MB)
│   │   ├── express/
│   │   ├── cors/
│   │   ├── dotenv/
│   │   └── ...
│   │
│   ├── dist/                      ← Backend compiled code (~1MB)
│   │   ├── index.js               ← Express server entry point
│   │   ├── routes/
│   │   │   ├── api-routes.js
│   │   │   └── frontend-routes.js
│   │   ├── services/
│   │   │   ├── exam-service.js
│   │   │   ├── rules-service.js
│   │   │   └── stats-service.js
│   │   └── rules/                 ← Static markdown files
│   │       ├── exam-rules.md
│   │       └── question-rules.md
│   │
│   ├── public/                    ← Frontend static files (~5MB)
│   │   ├── index.html             ← Angular entry point
│   │   ├── main.HASH.js           ← Angular app bundle
│   │   ├── polyfills.HASH.js      ← Browser polyfills
│   │   ├── styles.HASH.css        ← Compiled styles
│   │   └── assets/                ← Images, fonts, etc.
│   │
│   ├── package.json
│   └── package-lock.json
│
├── usr/                           ← Alpine Linux binaries
│   ├── bin/
│   │   └── node                   ← Node.js runtime
│   └── lib/
│
├── etc/                           ← Config files
└── ...                            ← Other Linux directories
```

**Total size: ~205MB**
- Alpine Linux base: ~40MB
- Node.js runtime: ~50MB
- Production node_modules: ~30MB
- Compiled backend: ~1MB
- Compiled frontend: ~5MB
- System overhead: ~79MB

**What's NOT in the image:**
- ❌ Source TypeScript files (`*.ts`)
- ❌ Source Angular files (`src/`)
- ❌ Development dependencies (TypeScript compiler, Angular CLI, etc.)
- ❌ Build tools and intermediate files
- ❌ `node_modules/` from build stages (~600MB saved!)

---

## Why This Architecture?

### 1. Small Image Size
- **Without multi-stage**: ~1.2GB (includes dev dependencies, source code, build tools)
- **With multi-stage**: ~205MB (only runtime dependencies and compiled code)
- **Result**: 6x smaller, faster deployments, lower bandwidth costs

### 2. Security
- No source code in production
- No build tools that could be exploited
- Minimal attack surface

### 3. Clear Separation
- Frontend build is independent of backend build
- Can rebuild one without affecting the other (with caching)
- Easy to understand and maintain

### 4. Build Caching
Docker caches each layer. If you only change frontend code:
- Stage 1 (client) rebuilds
- Stage 2 (server) uses cache ✅
- Stage 3 uses cached server build ✅

This makes rebuilds much faster.

### 5. Production Best Practices
- Uses Alpine Linux (small, secure)
- Only production dependencies
- Proper environment variables
- Clean file structure

---

## Optimization Tips

### 1. Use .dockerignore
Create a `.dockerignore` file to exclude unnecessary files from build context:

```
# .dockerignore
node_modules
dist
.git
.env
*.log
.DS_Store
.vscode
.idea
coverage
*.md
!README.md
```

This speeds up builds by not sending these files to Docker.

### 2. Layer Ordering Matters
Copy files that change least frequently first:

```dockerfile
# Good: Package files first (change rarely)
COPY package*.json ./
RUN npm ci

# Then source code (changes often)
COPY src/ ./
```

If source changes, Docker reuses the cached npm install.

### 3. Combine Related Commands
```dockerfile
# Less efficient (3 layers)
RUN npm ci
RUN npm run build
RUN npm prune

# More efficient (1 layer)
RUN npm ci && npm run build && npm prune
```

However, keep frequently-changing steps separate for better caching.

### 4. Use Specific Node Version
```dockerfile
# Good: Specific version
FROM node:20.11.0-alpine

# Bad: Moving target
FROM node:latest
```

Ensures consistency across builds.

### 5. Health Checks
Add a health check to verify the app is running:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"
```

### 6. Non-Root User
Run as non-root for better security:

```dockerfile
# Create user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch user
USER nodejs
```

### 7. Build Arguments
Use build arguments for flexibility:

```dockerfile
ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine

ARG BUILD_ENV=production
ENV NODE_ENV=${BUILD_ENV}
```

Build with: `docker build --build-arg NODE_VERSION=18 -t app .`

---

## Understanding the Build Process

### Timeline of a Build

```
$ docker build -t toetsen-oefenen .

[Stage 1: client-builder]
  ├─ Pull node:20-alpine image (if not cached)
  ├─ Copy client/package*.json
  ├─ npm ci (~5 seconds)
  ├─ Copy client source
  └─ ng build (~15 seconds)

[Stage 2: server-builder]
  ├─ Use node:20-alpine (cached from Stage 1)
  ├─ Copy server/package*.json
  ├─ npm ci (~3 seconds)
  ├─ Copy server source
  └─ tsc build (~2 seconds)

[Stage 3: production]
  ├─ Use node:20-alpine (cached)
  ├─ npm ci --only=production (~3 seconds)
  ├─ COPY --from=client-builder (instant, no download)
  ├─ COPY --from=server-builder (instant, no download)
  ├─ Set environment
  └─ Done!

Total: ~30-40 seconds (first build)
Total: ~5-10 seconds (cached rebuild)
```

### What Gets Cached?

Each command creates a layer. Docker caches layers that haven't changed:

```dockerfile
# Layer 1: FROM node:20-alpine
# → Cached if you've used this image before

# Layer 2: WORKDIR /app/client
# → Cached if previous layer is cached

# Layer 3: COPY client/package*.json ./
# → Cached if package.json hasn't changed

# Layer 4: RUN npm ci
# → Cached if Layer 3 is cached (package.json unchanged)

# Layer 5: COPY client/ ./
# → NOT cached if any file in client/ changed

# Layer 6: RUN npm run build
# → NOT cached if Layer 5 changed
```

**Pro tip:** Change your source code often? Layers 1-4 stay cached, making rebuilds fast!

---

## Common Questions

### Q: Why do we copy package.json before source code?
**A:** Docker caching. If only source code changes, we reuse the cached npm install. If we copied everything at once, any file change would invalidate the npm install cache.

### Q: Can I add more stages?
**A:** Yes! For example, add a testing stage:

```dockerfile
FROM node:20-alpine AS tester
COPY --from=client-builder /app/client ./
RUN npm test
```

### Q: How do I debug a build failure?
**A:** Run the build up to the failing step, then enter the container:

```bash
# Build up to step 10
docker build --target client-builder -t debug .

# Enter the container
docker run -it debug sh

# Manually run commands
$ npm run build
```

### Q: Can I build only one stage?
**A:** Yes, use `--target`:

```bash
# Build only the client
docker build --target client-builder -t client-only .
```

### Q: Why Alpine Linux?
**A:** It's tiny (~5MB) compared to Ubuntu (~77MB) or Debian (~124MB). For Node.js apps, Alpine has everything we need.

### Q: What if I need to install system packages?
**A:** Use `apk` (Alpine's package manager):

```dockerfile
RUN apk add --no-cache python3 make g++
```

---

## Next Steps

Now that you understand the Dockerfile:

1. **Experiment**: Try modifying stages and rebuilding
2. **Optimize**: Add a `.dockerignore` file
3. **Monitor**: Use `docker system df` to track disk usage
4. **Learn**: Explore [Docker best practices](https://docs.docker.com/develop/dev-best-practices/)

## Resources

- [Dockerfile Reference](https://docs.docker.com/engine/reference/builder/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Alpine Linux Packages](https://pkgs.alpinelinux.org/packages)
