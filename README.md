# Sleutelbeheer-MVV29

Sleutelbeheer webapplicatie voor MVV29. React 19 frontend, Express API backend, MySQL database.

## Branches

| Branch | Beschrijving |
|--------|-------------|
| `main` | Originele versie (localStorage + Gemini AI Studio) |
| `truenas-mysql` | **TrueNAS-klare versie** (MySQL + Docker + Nginx) |

---

## Stack (truenas-mysql branch)

- **Frontend**: React 19 + Vite + Tailwind CSS
- **Backend**: Node.js Express REST API
- **Database**: MySQL 8
- **Webserver**: Nginx (static files + reverse proxy)
- **Containers**: Docker Compose

## Opzetten op TrueNAS SCALE

### 1. Pas docker-compose.yml aan

Open `docker-compose.yml` en verander **drie dingen**:

```yaml
MYSQL_ROOT_PASSWORD: jouw_root_wachtwoord
MYSQL_PASSWORD:      jouw_wachtwoord
DB_PASSWORD:         jouw_wachtwoord       # zelfde als MYSQL_PASSWORD
```

En het volume pad:
```yaml
/mnt/tank/sleutelbeheer/mysql:/var/lib/mysql   # ← jouw TrueNAS dataset pad
```

En de poort:
```yaml
- "3000:80"    # ← verander 3000 naar jouw gewenste poort
```

### 2. Maak de TrueNAS dataset aan

```
Storage → Datasets → Add Dataset: sleutelbeheer
```

### 3. Start de app

In TrueNAS: **Apps → Custom App → YAML** — plak de inhoud van `docker-compose.yml`.

Of via SSH:
```bash
docker compose up -d
```

De app is daarna bereikbaar op `http://[truenas-ip]:3000`

### 4. Eerste gebruik

Bij de eerste opstart wordt het database schema automatisch aangemaakt via `server/init.sql`. Alle tabellen starten leeg — gebruik de **Beheer** pagina om ruimtes, sleuteltypes en sleutels in te voeren (of te importeren via CSV).

## Lokale ontwikkeling

```bash
# Terminal 1 — start MySQL lokaal (of gebruik Docker)
docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=sleutelbeheer -e MYSQL_USER=sleutel -e MYSQL_PASSWORD=secret mysql:8.0

# Terminal 2 — start de API
cd server && npm install && node index.js

# Terminal 3 — start de frontend
npm install && npm run dev
```

Frontend draait op http://localhost:3000, API op http://localhost:4000 (Vite proxy zorgt voor /api doorsturen).
