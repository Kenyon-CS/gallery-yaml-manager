# Gallery YAML Manager

A Version 1 single-server React + Node.js application for managing artwork records stored in `show.yaml`.

## What this version does

- browse artworks from `server/data/show.yaml`
- search and filter artworks
- add a new artwork
- edit an existing artwork
- upload an image or paste an image URL
- save records back into YAML
- use controlled vocabularies from the YAML file
- serve the React app, API, and uploads from a single Express server on one port

## What this version does not do yet

- edit `gallery.yaml` or `scoring.yaml`
- run Python algorithms from the UI
- raw YAML editor
- authentication
- multi-user conflict handling

## Project structure

```text
gallery-yaml-manager/
  client/
  server/
  README.md
```

## Runtime model

This project uses a **single Express server**.

The workflow is:

1. Build the React client with Vite.
2. Express serves the built files from `client/dist`.
3. Express also serves:
   - `/api/...`
   - `/uploads/...`
4. The whole app runs on one port.

There is **no separate client dev server** in this design.

## Setup

### 1. Install client dependencies

```bash
cd client
npm install
```

### 2. Build the client

```bash
npm run build
```

### 3. Install server dependencies

```bash
cd ../server
npm install
```

### 4. Create the environment file

```bash
cp .env.example .env
```

Default values:

```env
PORT=4100
HOST=0.0.0.0
```

### 5. Start the server

```bash
npm start
```

Then open:

```text
http://YOUR_SERVER_IP:4100
```

## Main API routes

- `GET /api/health`
- `GET /api/artworks`
- `GET /api/artworks/:id`
- `POST /api/artworks`
- `PUT /api/artworks/:id`
- `GET /api/artworks/vocabularies`
- `POST /api/uploads/image`
- `GET /api/show-yaml`

## YAML storage

The main data file is:

```text
server/data/show.yaml
```

When an artwork is created or updated:

- the full YAML file is loaded
- the artworks array is modified in memory
- a backup copy is created
- the YAML file is written back out

## Image handling

Users can either:

- paste an external image URL
- upload an image file

Uploaded files are stored in:

```text
server/uploads/
```

and are served from:

```text
/uploads/<filename>
```

## Planned Python integration

This app is structured so Python can be added later without redesigning the whole system.

Recommended later extension:

```text
server/
  algorithms/
    python/
```

Then add routes like:

- `POST /api/algorithms/run`

The Node server can invoke Python scripts using child processes and pass YAML file paths or JSON input.

## Suggested next steps

1. Add `gallery.yaml` and `scoring.yaml` editors.
2. Add schema validation and richer field checking.
3. Add Python evaluator and layout generator hooks.
4. Add layout preview pages.
5. Add authentication if needed.
