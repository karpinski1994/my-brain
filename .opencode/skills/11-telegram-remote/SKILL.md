---
name: telegram-remote
description: "Set up and manage Telegram remote control for OpenCode. Start/stop the bot, configure BotFather token, create launchd auto-start, and verify connection works."
---

# Telegram Remote Control

## What This Does

Sets up `opencode-telegram-bot` so you can control this project from Telegram (phone, work machine, etc.). Handles the full lifecycle:

- **Setup** — BotFather token, user ID, config wizard, project linking
- **Launch** — Start `opencode serve` + telegram bot as background services
- **Auto-start** — Create/load launchd agents so they survive reboots
- **Test** — Verify the bot responds and can use my-brain skills

## Architecture

```
Telegram App → Telegram Bot API (cloud) → opencode-telegram-bot → opencode serve (local)
```

Your code never leaves your machine. The bot relays prompts through Telegram's servers but execution is fully local.

## Prerequisites

- OpenCode CLI installed (`which opencode`)
- Telegram account
- `npx @grinev/opencode-telegram-bot` available

## Output

Creates/updates:
- `~/Library/Application Support/opencode-telegram-bot/.env` — bot config
- `~/Library/Application Support/opencode-telegram-bot/settings.json` — project/session config
- `~/Library/LaunchAgents/ai.opencode.serve.plist` — auto-start for opencode serve
- `~/Library/LaunchAgents/com.grinev.opencode-telegram-bot.plist` — auto-start for bot
- `my-brain/02_Wiki/opencode/setting the remote control from telegram.md` — setup summary

## Command Protocol

- **help** / **ask llm** — Get guidance on any step
- **save** — Save progress and exit (resume later)
- **skip** — Skip current step
- **status** — Show current remote control state
- **done** — Finalize and verify

## Setup Steps

### Step 0: Check Current State

Check if things are already configured:

```bash
ls ~/Library/Application\ Support/opencode-telegram-bot/.env 2>/dev/null && echo "Config exists" || echo "No config"
launchctl list 2>/dev/null | grep -E 'opencode|telegram' || echo "No launch agents loaded"
lsof -i :4096 2>/dev/null || echo "Server not running"
```

If config exists with a valid token and my-brain project, offer to skip straight to launching.

### Step 1: Get Telegram Bot Token

Open Telegram and:

1. Search for **@BotFather**
2. Send `/newbot`
3. Choose a name (e.g. `MyBrain Bot`) and username (e.g. `mybrain_bot`)
4. Save the token: `123456789:AAxxxxxxxxxxxxxxxxxxxx`

> **Security:** This token is a password to your bot. Never commit it to git, never share it. The config file is at `~/Library/Application Support/opencode-telegram-bot/.env` — keep default permissions.

If a token already exists in `.env`, ask if they want to reuse it or get a new one.

### Step 2: Get Your Telegram User ID

1. Search Telegram for **@userinfobot**
2. Send any message
3. It returns your numeric ID (e.g. `664478408`)

### Step 3: Configure the Bot

Run the config wizard:

```bash
npx @grinev/opencode-telegram-bot config
```

The wizard asks for:

| Setting | What to enter |
|---------|---------------|
| UI Language | `English` |
| Bot Token | From Step 1 |
| Telegram User ID | From Step 2 |
| OpenCode API URL | `http://127.0.0.1:4096` (default, press Enter) |
| Server Username | `opencode` (default, press Enter) |
| Server Password | Leave blank (press Enter) |
| Model Provider | Whatever matches the current project config (e.g. `github-copilot`) |
| Model ID | Whatever matches (e.g. `claude-opus-4.6`) |

After wizard completes, update `settings.json` to point at my-brain:

```bash
cat > ~/Library/Application\ Support/opencode-telegram-bot/settings.json << 'EOF'
{
  "scheduledTasks": [],
  "sessionDirectoryCache": {
    "version": 1,
    "lastSyncedUpdatedAt": $(date +%s000),
    "directories": [
      {
        "worktree": "$(pwd)",
        "lastUpdated": $(date +%s000)
      }
    ]
  },
  "currentProject": {
    "id": "my-brain",
    "worktree": "$(pwd)",
    "name": "my-brain"
  },
  "currentSession": null,
  "pinnedMessageId": null
}
EOF
```

### Step 4: Create Launchd Auto-Start Agents

Create `~/Library/LaunchAgents/ai.opencode.serve.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.opencode.serve</string>
    <key>ProgramArguments</key>
    <array>
        <string>$(which opencode)</string>
        <string>serve</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$HOME/Library/Logs/opencode-serve.log</string>
    <key>StandardErrorPath</key>
    <string>$HOME/Library/Logs/opencode-serve.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>$HOME/.opencode/bin:$HOME/.nvm/versions/node/v24.16.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
        <key>HOME</key>
        <string>$HOME</string>
    </dict>
    <key>WorkingDirectory</key>
    <string>$(pwd)</string>
</dict>
</plist>
```

Create `~/Library/LaunchAgents/com.grinev.opencode-telegram-bot.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.grinev.opencode-telegram-bot</string>
    <key>ProgramArguments</key>
    <array>
        <string>$(which npx)</string>
        <string>@grinev/opencode-telegram-bot</string>
        <string>start</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$HOME/Library/Logs/opencode-telegram-bot.log</string>
    <key>StandardErrorPath</key>
    <string>$HOME/Library/Logs/opencode-telegram-bot.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>$HOME/.opencode/bin:$HOME/.nvm/versions/node/v24.16.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
        <key>HOME</key>
        <string>$HOME</string>
    </dict>
    <key>WorkingDirectory</key>
    <string>$(pwd)</string>
</dict>
</plist>
```

### Step 5: Load & Start Services

```bash
launchctl load ~/Library/LaunchAgents/ai.opencode.serve.plist
sleep 3
launchctl load ~/Library/LaunchAgents/com.grinev.opencode-telegram-bot.plist
```

### Step 6: Verify Everything

Check both services are running:

```bash
launchctl list | grep -E 'opencode|telegram'
lsof -i :4096
```

Check the bot logs:

```bash
tail -5 ~/Library/Logs/opencode-telegram-bot.log
```

Expected: `[INFO] Bot @your_bot_username started!`

**Final test:** Send a message to your bot on Telegram. It should respond using the my-brain skills (mybrain calorie tracking, todo management, etc.).

### Step 7: Write Summary to Wiki

Save the setup summary to `my-brain/02_Wiki/opencode/setting the remote control from telegram.md`.

## Daily Management Commands

| Action | Command |
|--------|---------|
| Check status | `launchctl list \| grep -E 'opencode\|telegram'` |
| View serve logs | `tail -f ~/Library/Logs/opencode-serve.log` |
| View bot logs | `tail -f ~/Library/Logs/opencode-telegram-bot.log` |
| Restart serve | `launchctl unload ~/Library/LaunchAgents/ai.opencode.serve.plist && launchctl load ~/Library/LaunchAgents/ai.opencode.serve.plist` |
| Restart bot | `launchctl unload ~/Library/LaunchAgents/com.grinev.opencode-telegram-bot.plist && launchctl load ~/Library/LaunchAgents/com.grinev.opencode-telegram-bot.plist` |
| Stop both | `launchctl unload ~/Library/LaunchAgents/ai.opencode.serve.plist; launchctl unload ~/Library/LaunchAgents/com.grinev.opencode-telegram-bot.plist` |
| Start both | `launchctl load ~/Library/LaunchAgents/ai.opencode.serve.plist; launchctl load ~/Library/LaunchAgents/com.grinev.opencode-telegram-bot.plist` |
