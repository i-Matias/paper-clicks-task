# Paper Clicks Task

A full-stack application with GitHub authentication, repository starring, and commit analytics.

## Project Structure

- `client/`: React frontend built with Vite
- `server/`: Node.js backend with Express and Prisma
- `docker-compose.yml`: Docker setup for local development

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- A GitHub OAuth App for authentication (you'll need the client ID and client secret)

## Setup and Running the Application

### 1. Create a GitHub OAuth App

1. Go to GitHub > Settings > Developer Settings > OAuth Apps > New OAuth App
2. Set the following:
   - Application name: Paper Clicks Task
   - Homepage URL: http://localhost:5173
   - Authorization callback URL: http://localhost:5001/api/auth/github/callback
3. Register the application
4. Copy the Client ID and generate a new Client Secret

### 2. Configure Environment Variables

1. Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

2. Edit the `.env` file and add your GitHub OAuth credentials:

```
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
```

### 3. Start the Application

Run the following command to start all services:

```bash
docker-compose up
```

This will:
- Start a PostgreSQL database
- Start the backend server on http://localhost:5001
- Start the frontend client on http://localhost:5173

### 4. Access the Application

Open your browser and navigate to:

```
http://localhost:5173
```

## Stopping the Application

To stop all services:

```bash
docker-compose down
```

To stop and remove volumes (this will delete the database data):

```bash
docker-compose down -v
```
