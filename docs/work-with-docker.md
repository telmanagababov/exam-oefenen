# Working with Docker

This guide explains how to use Docker and Colima for this project.

## Table of Contents
- [What is Docker?](#what-is-docker)
- [Docker CLI vs Docker Desktop](#docker-cli-vs-docker-desktop)
- [What is Colima?](#what-is-colima)
- [Setup](#setup)
- [Basic Workflow](#basic-workflow)
- [Common Commands](#common-commands)
- [Troubleshooting](#troubleshooting)

## What is Docker?

Docker is a platform for running applications in isolated environments called **containers**. It ensures your app runs the same way everywhere (your laptop, servers, cloud).

**Key Concepts:**
- **Docker Image**: A blueprint/template containing your app and all dependencies (like a .zip file)
- **Docker Container**: A running instance of an image (like a running program)
- **Dockerfile**: A recipe file that describes how to build an image

## Docker CLI vs Docker Desktop

### Docker CLI (Command Line Interface)
- The `docker` command-line tool for running Docker commands
- Just a "remote control" - needs a Docker daemon (engine) to work
- Lightweight and fast

### Docker Desktop
- Complete package: Docker CLI + Docker daemon + GUI
- Easy to use with graphical interface
- Resource-heavy (~400MB+ RAM)
- Costs money for commercial use in large companies

### What We Use: Docker CLI + Colima
We use Docker CLI with Colima as the daemon. This gives us:
- ✅ Free and open-source
- ✅ Lightweight
- ✅ Full Docker functionality
- ✅ Works great for development

## What is Colima?

**Colima** (Containers in Lima) is a minimal Docker daemon that runs in a lightweight VM.

**Think of it as:**
- Docker Desktop's engine without the GUI
- A free, lightweight alternative
- Something that runs quietly in the background

**Do you need to learn Colima?**
No! You only need 3 commands:
```bash
colima start    # Start Docker
colima stop     # Stop Docker
colima status   # Check if running
```

After `colima start`, you use regular `docker` commands.

## Setup

### Install Colima (One-time)
```bash
brew install colima
```

### Start Colima
```bash
colima start
```

This starts the Docker daemon. You need to run this once each time you restart your Mac.

### Verify Docker is Working
```bash
docker info
```

If you see server information, you're ready to go!

## Basic Workflow

### 1. Daily Development

```bash
# Start Docker daemon (once per Mac restart)
colima start

# Build your Docker image
docker build -t toetsen-oefenen .

# Run the container
docker run -p 3000:3000 toetsen-oefenen

# Open browser to http://localhost:3000

# When done for the day
colima stop
```

### 2. Making Changes

```bash
# After code changes, rebuild the image
docker build -t toetsen-oefenen .

# Stop old container (if running)
docker stop $(docker ps -q --filter ancestor=toetsen-oefenen)

# Run new container
docker run -p 3000:3000 toetsen-oefenen
```

## Common Commands

### Colima Commands

```bash
# Start Docker daemon
colima start

# Stop Docker daemon
colima stop

# Check status
colima status

# Restart Docker daemon
colima restart

# Delete Colima VM (fresh start)
colima delete
```

### Docker Image Commands

```bash
# Build an image from Dockerfile
docker build -t my-app .

# Build with a specific tag/version
docker build -t my-app:v1.0 .

# List all images
docker images

# Remove an image
docker rmi toetsen-oefenen

# Remove unused images
docker image prune

# Remove all unused images
docker image prune -a
```

### Docker Container Commands

```bash
# Run a container
docker run -p 3000:3000 toetsen-oefenen

# Run in background (detached mode)
docker run -d -p 3000:3000 toetsen-oefenen

# Run with a custom name
docker run -d -p 3000:3000 --name my-app toetsen-oefenen

# Run with environment variables
docker run -p 3000:3000 -e PORT=3000 -e NODE_ENV=production toetsen-oefenen

# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# Stop a container
docker stop <container-id-or-name>

# Start a stopped container
docker start <container-id-or-name>

# Restart a container
docker restart <container-id-or-name>

# Remove a container
docker rm <container-id-or-name>

# Force remove a running container
docker rm -f <container-id-or-name>

# View container logs
docker logs <container-id-or-name>

# Follow logs in real-time
docker logs -f <container-id-or-name>

# Execute a command in a running container
docker exec -it <container-id-or-name> sh

# Inspect container details
docker inspect <container-id-or-name>
```

### Useful Shortcuts

```bash
# Stop all running containers
docker stop $(docker ps -q)

# Remove all stopped containers
docker rm $(docker ps -a -q)

# Remove all containers (running and stopped)
docker rm -f $(docker ps -a -q)

# Clean up everything (images, containers, networks, cache)
docker system prune -a

# See disk usage
docker system df
```

## Command Flag Reference

### Common Flags Explained

- `-t my-app` - Tag/name your image
- `-p 3000:3000` - Port mapping (host:container)
  - Format: `-p <host-port>:<container-port>`
  - Example: `-p 8080:3000` means localhost:8080 → container:3000
- `-d` - Detached mode (run in background)
- `-it` - Interactive terminal
- `--name my-container` - Give container a friendly name
- `-e VAR=value` - Set environment variable
- `-v /host/path:/container/path` - Mount a volume
- `--rm` - Automatically remove container when it stops
- `-f` - Force (skip confirmations)

## Troubleshooting

### Colima won't start
```bash
# Try deleting and recreating
colima delete
colima start
```

### Port already in use
```bash
# Find what's using the port
lsof -i :3000

# Stop the container using that port
docker stop $(docker ps -q --filter publish=3000)
```

### Docker build fails
```bash
# Clean build cache and try again
docker builder prune
docker build -t toetsen-oefenen .
```

### Out of disk space
```bash
# Clean up unused resources
docker system prune -a

# Check disk usage
docker system df
```

### Container exits immediately
```bash
# Check logs to see why
docker logs <container-id>

# Run with interactive terminal to debug
docker run -it toetsen-oefenen sh
```

### "Cannot connect to Docker daemon"
```bash
# Make sure Colima is running
colima status

# If not, start it
colima start
```

### Reset everything
```bash
# Stop and delete Colima
colima stop
colima delete

# Remove all Docker resources
docker system prune -a --volumes

# Start fresh
colima start
```

## Best Practices

1. **Start Colima once** when you boot your Mac, not before every Docker command
2. **Use specific tags** for images (e.g., `v1.0`) instead of just `latest`
3. **Clean up regularly** with `docker system prune` to free disk space
4. **Use `.dockerignore`** to exclude files from build context (like `.gitignore`)
5. **Name your containers** with `--name` for easier management
6. **Use detached mode** (`-d`) for long-running services
7. **Check logs** with `docker logs` when containers behave unexpectedly

## Next Steps

- Read [How to: Dockerfile](./how-to-dockerfile.md) to understand how our Dockerfile works
- Learn about [Docker Compose](https://docs.docker.com/compose/) for multi-container apps
- Explore [Docker Hub](https://hub.docker.com/) for pre-built images

## Resources

- [Docker Official Docs](https://docs.docker.com/)
- [Colima GitHub](https://github.com/abiosoft/colima)
- [Docker Cheat Sheet](https://docs.docker.com/get-started/docker_cheatsheet.pdf)
