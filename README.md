# Gallery YAML Manager

A single-server React + Node.js application for managing art shows stored as YAML files: artworks, gallery rooms and walls, scoring settings, and wall arrangements. Each user logs in and works on their own projects.

## Requirements

- Node.js 18 or newer (`node --version`)
- npm

## Quick start

From the repository root:

```bash
cd client
npm install
npm run build
```

```bash
cd ../server
npm install
cp .env.example .env
cp data/users.example.yaml data/users.yaml
npm start
```

Then open <http://localhost:4100> (or `http://YOUR_SERVER_IP:4100` on a remote machine) and log in with one of the accounts in `server/data/users.yaml`. The sample file contains:

| Username  | Password   | Role    |
|-----------|------------|---------|
| `admin`   | `changeme` | admin   |
| `curator` | `changeme` | curator |

**Change these passwords before running the server anywhere other people can reach it.**

After logging in, go to the **Projects** page and create a project. Every other page reads from the current project, so you will see "You must select or create a project" until you do.

## Setup in detail

### 1. Build the client

The React app is built once with Vite, and the Express server serves the built files from `client/dist`. There is no separate client dev server.

```bash
cd client
npm install
npm run build
```

Re-run `npm run build` whenever you change anything under `client/src`, then reload the browser.

### 2. Install server dependencies

```bash
cd ../server
npm install
```

### 3. Create the environment file

```bash
cp .env.example .env
```

| Variable | Default   | Meaning                                            |
|----------|-----------|----------------------------------------------------|
| `PORT`   | `4100`    | Port the server listens on                         |
| `HOST`   | `0.0.0.0` | Interface to bind; use `127.0.0.1` for local-only  |

### 4. Create user accounts

Login accounts live in `server/data/users.yaml`, which is not checked into git. Start from the sample:

```bash
cp data/users.example.yaml data/users.yaml
```

Each entry has a `username`, `password`, and `role`:

```yaml
users:
  - username: admin
    password: changeme
    role: admin

  - username: jsmith
    password: a-better-password
    role: curator
```

Notes:

- Passwords are stored in plain text. Do not reuse a real password.
- The username is also the name of that user's data folder (`server/data/users/<username>/`), so use only letters, numbers, dashes, and underscores.
- The `role` is currently only displayed in the header; it does not restrict anything.
- The file is read on every login, so you can add or change accounts without restarting the server.

If `users.yaml` is missing, the login screen shows an error telling you to create it.

### 5. Start the server

```bash
npm start
```

To keep it running in the background on a server, `pm2` is included as a dependency:

```bash
npx pm2 start src/server.js --name gallery
```

## Using the app

1. Log in.
2. On **Projects**, create a project. This copies the default `art`, `gallery`, and `scoring` files from `server/data/defaults/` into your project and generates an empty `show` file from the gallery's walls.
3. Use the other pages to edit artworks, rooms and walls, scoring settings, and wall designs. You can also upload or download each project's YAML files from the **Projects** page.

## Data layout

```text
server/
  data/
    users.example.yaml        sample accounts (committed)
    users.yaml                real accounts (not committed)
    defaults/                 templates copied into each new project
      art.yaml
      gallery.yaml
      scoring.yaml
    users/                    created automatically, not committed
      <username>/
        current-project.json  which project this user has open
        projects/
          project-<id>.yaml   lists the project's files and which are active
          art-<id>.yaml
          gallery-<id>.yaml
          scoring-<id>.yaml
          show-<id>.yaml
  uploads/                    uploaded images, served at /uploads/<filename>
```

When a YAML file is saved, the server loads the whole file, changes it in memory, writes a backup copy, and writes the file back out.

## Troubleshooting

- **Login says `users.yaml not found`**: run `cp data/users.example.yaml data/users.yaml` inside `server/`.
- **Login says "Invalid username or password"**: check spelling and indentation in `users.yaml`; each account must be a `- username:` item under `users:`.
- **Blank page or an error loading `/`**: the client has not been built. Run `npm run build` in `client/`.
- **"You must select or create a project"**: create or select a project on the **Projects** page.
- **Port already in use**: change `PORT` in `server/.env`.

## Main API routes

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/projects`, `POST /api/projects`, `GET|PUT /api/projects/current`
- `/api/art...` (artworks and vocabularies)
- `/api/gallery...` (rooms, walls, doors)
- `GET|PUT /api/scoring-settings`
- `GET|PUT /api/show`
- `POST /api/uploads/image`

Project and data routes take the current user as a `?user=<username>` query parameter.

## Current limitations

- Authentication is a simple username/password check; the API itself does not verify who is calling.
- No multi-user conflict handling on the same files.
- Python algorithms cannot yet be run from the UI.

## Planned Python integration

Python can be added later without redesigning the system, for example under `server/algorithms/python/` with a route such as `POST /api/algorithms/run`. The Node server would invoke the scripts as child processes and pass YAML file paths or JSON input.
