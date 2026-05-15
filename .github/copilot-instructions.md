# Chess Tournament Bot — Copilot Instructions

## Project Overview

Multi-file Telegram bot written in Node.js 20 with ES modules (`"type": "module"`).
Runs in a k3d cluster (`telegram-bots`), namespace `chess-tournament`, deployment `chess-tournament-bot`.
Uses a JSON file on a PVC (`/app/data/tournaments.json`) as its database — no SQL, just file I/O.

### Source files
| File | Purpose |
|---|---|
| `src/index.js` | Bot handlers, command routing, reminder loop (~800 lines) |
| `src/tournament.js` | `Tournament` class — round-robin logic, elimination phases |
| `src/persistence.js` | JSON load/save + Map ↔ JSON serialization |

---

## Architecture

### Key values
| Constant | Location | Purpose |
|---|---|---|
| `REMINDER_INTERVAL_MS` | `src/index.js` | 24h fixed interval — see improvement #2 below |
| `tournaments` | `src/index.js` | `Map<chatId, Tournament>` — one tournament per group chat |
| `userStates` | `src/index.js` | `Map<chatId, state>` — tracks multi-step command flows |
| `DATA_FILE` | `src/persistence.js` | `/app/data/tournaments.json` |

### Data structure (per chat in `tournaments.json`)
```json
{
  "chatId": {
    "name": "Liga del Chesito",
    "players": [{ "id", "name", "points", "matchesPlayed", "wins", "draws", "losses" }],
    "groupStageMatches": [{ "id", "round", "player1", "player2", "result", "phase" }],
    "eliminationMatches": [...],
    "standings": [[playerId, playerData]],
    "currentPhase": "group_stage|elimination|finished",
    "currentRound": 0,
    "matchResults": [[matchId, result]]
  }
}
```

`persistence.js` manually serializes Maps ↔ arrays — when adding new Map fields to `Tournament`, always update both `saveTournaments` and `restoreTournaments`.

---

## Pending Improvements

### 1. Health check server (liveness probe)

The bot currently has **no HTTP server**, so k8s has no liveness probe. Add one before `bot.startPolling()` so the pod is considered healthy only after the bot is up:

```js
import { createServer } from 'http';

// Add TZ_OFFSET to env/deployment.yaml (e.g. TZ_OFFSET=2 for Spain UTC+2 summer)
const TZ_OFFSET = parseInt(process.env.TZ_OFFSET ?? '2');

const healthServer = createServer((req, res) => {
  res.writeHead(200);
  res.end('OK');
});

// IMPORTANT: start health server BEFORE bot.startPolling() to avoid liveness probe
// failures during the polling initialization gap
healthServer.listen(3000, () => console.log('Health server listening on :3000'));

// bot.startPolling() is called implicitly by new TelegramBot(token, { polling: true })
// To control startup order, switch to:
//   const bot = new TelegramBot(token, { polling: false });
//   healthServer.listen(3000, () => { bot.startPolling(); });
```

Then add to `k8s/deployment.yaml`:
```yaml
ports:
  - containerPort: 3000
livenessProbe:
  httpGet:
    path: /
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 15
```

And add `TZ_OFFSET` env var to the deployment:
```yaml
env:
  - name: TZ_OFFSET
    value: "2"   # UTC+2 summer / UTC+1 winter
```

---

### 2. Timezone-aware reminders (fire at a fixed local time)

Currently `startReminders()` uses `setInterval(24h)` — it fires 24h after pod start, at no predictable local time. Also resets on every pod restart.

Replace with a minute-by-minute ticker that fires at a configured local hour:

```js
const REMINDER_HOUR   = parseInt(process.env.REMINDER_HOUR   ?? '20'); // 20:00 local
const REMINDER_MINUTE = parseInt(process.env.REMINDER_MINUTE ?? '0');

function getLocalHour()   { return new Date(Date.now() + TZ_OFFSET * 3600_000).getUTCHours(); }
function getLocalMinute() { return new Date(Date.now() + TZ_OFFSET * 3600_000).getUTCMinutes(); }

let lastReminderDate = null;

function startReminders() {
  setInterval(() => {
    const now = new Date(Date.now() + TZ_OFFSET * 3600_000);
    const dateStr = now.toISOString().slice(0, 10);

    if (getLocalHour() !== REMINDER_HOUR || getLocalMinute() !== REMINDER_MINUTE) return;
    if (lastReminderDate === dateStr) return; // already fired today
    lastReminderDate = dateStr;

    for (const [chatId, tournament] of tournaments.entries()) {
      // ... existing reminder logic ...
    }
  }, 60_000); // check every minute
}
```

Add to `k8s/deployment.yaml` env:
```yaml
- name: REMINDER_HOUR
  value: "20"
- name: REMINDER_MINUTE
  value: "0"
```

---

### 3. One-off admin scripts (data fixes, broadcasts)

**Never** pass multiline strings inline to `kubectl exec`. Instead:
1. Write a CommonJS script to `/tmp/myscript.js` (use `require()`, not `import` — it runs standalone outside the ESM bot).
2. `kubectl cp /tmp/myscript.js chess-tournament/$POD:/tmp/myscript.js`
3. `kubectl exec -n chess-tournament $POD -- node /tmp/myscript.js`

```js
// Template for one-off admin scripts
const fs    = require('fs');
const https = require('https');
const token = process.env.TELEGRAM_BOT_TOKEN;
const data  = JSON.parse(fs.readFileSync('/app/data/tournaments.json', 'utf8'));

// Mutate data here...

fs.writeFileSync('/app/data/tournaments.json', JSON.stringify(data, null, 2));
console.log('Done.');
```

**PVC data survives pod restarts and redeployments.** It does NOT survive `kubectl delete pvc`.

---

### 4. Copilot instructions (this file)

This file (`.github/copilot-instructions.md`) is automatically loaded by VS Code Copilot as repo context. Keep it updated when the architecture changes significantly.

---

## Kubernetes Quick Reference

```sh
# Get pod name
POD=$(kubectl get pod -n chess-tournament -l app=chess-tournament-bot -o jsonpath='{.items[0].metadata.name}')

# Stream logs
kubectl logs -f deployment/chess-tournament-bot -n chess-tournament

# Read tournament data
kubectl exec -n chess-tournament $POD -- cat /app/data/tournaments.json

# Restart (e.g. after config change)
kubectl rollout restart deployment/chess-tournament-bot -n chess-tournament
kubectl rollout status deployment/chess-tournament-bot -n chess-tournament --timeout=90s
```

## Deploy Command (full pipeline)
```sh
cd /Users/JGARRI/personal_repos/chess-tournament-bot
git add -A && git commit -m "..." && git push \
  && bash deploy.sh \
  && kubectl rollout restart deployment/chess-tournament-bot -n chess-tournament \
  && kubectl rollout status deployment/chess-tournament-bot -n chess-tournament --timeout=90s
```

---

## Common Pitfalls

| Pitfall | Fix |
|---|---|
| `replace_string_in_file` failing on Spanish strings with emoji | Use Python heredoc: `python3 - << 'PYEOF'` ... `PYEOF` |
| Inline `\n` in `kubectl exec -e` breaking in zsh | Write to `/tmp` file, `kubectl cp`, then exec |
| Adding a new Map field to `Tournament` without updating persistence | Update both `saveTournaments` AND `restoreTournaments` in `persistence.js` |
| Reminders firing at random times after pod restart | Apply improvement #2 above |
| Pod has no liveness probe — k8s can't detect hangs | Apply improvement #1 above |
| Winter timezone (DST ends last Sunday of October) | Change `TZ_OFFSET` from `2` to `1` in deployment env |
