Remote Control Local OpenCode via Telegram: A Practical Guide to opencode-telegram-bot
Notes AI
TL;DR

Use opencode-telegram-bot to turn Telegram into a remote terminal for your local OpenCode instance. Setup takes under 10 minutes, requires no open ports, and keeps your code entirely on your machine. Perfect for anyone whose personal computer stays at home and needs to drive a local AI coding environment from anywhere.

Introduction
Two scenarios, one pain point.

Scenario one: You’re on your phone when an idea suddenly strikes — “How should I fix that bug?” You open your laptop, launch the terminal, navigate to the directory, type out the prompt… by the time you sit down, you’ve already lost half the thread.

Scenario two: Your personal project only lives on your home computer, completely out of reach from your work machine. Inspiration hits at the office, so you jot it down in a notes app and plan to deal with it later — but by the time you get home, the moment is gone.

opencode-telegram-bot is built to eliminate exactly this friction. It’s not a cloud AI service; it’s a bridge — a direct connection between Telegram and your locally running OpenCode CLI. Your local compute, your local code, your local context — all driven by a single message, from anywhere, without needing to be at your desk.

No ports to open. No code pushed to the cloud. Secure, lightweight, and always available.

This article walks through the complete installation and configuration process, along with real-world usage experience.

Tool Overview
opencode-telegram-bot is an open-source Node.js project with a straightforward core: listen for messages from a Telegram Bot, forward them to the local OpenCode API, and return the results back to Telegram.

The full communication flow looks like this:

Telegram App → Telegram Bot API (cloud) → opencode-telegram-bot → OpenCode Server (local)
Messages are relayed through Telegram’s servers, but your code, project files, and execution environment all remain local. The bot polls Telegram for new messages — no inbound ports required, no public IP needed.

Key features:

Send text prompts and monitor execution status in real time
Attach images, PDFs, and files as context
Voice prompts (transcribed via Whisper)
Switch between models and work modes (Plan / Build)
Session management: create, switch, and rename sessions
Project switching: move between multiple OpenCode projects
Scheduled tasks: preset prompts to run on a schedule or at a specific time
Custom commands: trigger OpenCode custom commands from Telegram
Interactive approvals: answer agent questions and approve permissions via inline buttons
Context control: compact context with one tap when it grows too large
Multi-language UI (including Simplified Chinese)
Runs via npx — no global installation required
Dependencies:

| Dependency | Description | | — -| — -| | Node.js 20+ | Runtime environment | | OpenCode CLI | Local AI coding engine | | Telegram Bot Token | Obtained from @BotFather |

The only prerequisite: OpenCode must be running locally. The bot is purely a control layer — the actual work is done by your local OpenCode instance.

Prerequisites
Before getting started, you need two things: confirm OpenCode is installed, and create a Telegram Bot.

Verify OpenCode is installed

which opencode && opencode --version
Expected output (paths and version numbers will vary):

/Users/your-username/.opencode/bin/opencode
1.x.x
If OpenCode isn’t installed yet, refer to the official OpenCode documentation to get it set up.

Create a Telegram Bot

Open Telegram and search for @BotFather
Send /newbot and follow the prompts to set a name and username for your bot
Once created, BotFather will return a Bot Token in the following format:
123456789:AAxxxxxxxxxxxxxxxxxxxx
Keep this safe — you’ll need it during configuration.

Get your Telegram User ID

The bot needs to know which user’s messages to respond to, so you’ll need to provide your User ID:

Search for @userinfobot
Send any message and it will return your numeric ID
Installation and Configuration
opencode-telegram-bot runs via npx and requires no global installation. On first run, it automatically launches a setup wizard:

npx @grinev/opencode-telegram-bot
You can also re-run the configuration wizard at any time:

npx @grinev/opencode-telegram-bot config
The wizard will prompt you for the following settings:

| Setting | Description | Example | | — -| — -| — -| | UI Language | Select your preferred language | English | | Bot Token | Token obtained from BotFather | 123456789:AAxx... | | Telegram User ID | Your numeric user ID | 664478408 | | OpenCode API URL | Default local address — press Enter to accept | http://127.0.0.1:4096 | | Server Username | Default is opencode — press Enter to accept | opencode | | Server Password | Optional — press Enter to skip | (leave blank) | | Model Provider | Your AI model provider | github-copilot | | Model ID | Default model ID | claude-opus-4.6 |

Once complete, the configuration is saved to:

macOS: ~/Library/Application Support/opencode-telegram-bot/.env
Linux: ~/.config/opencode-telegram-bot/.env
Language and other settings are stored in settings.json in the same directory:

macOS: ~/Library/Application Support/opencode-telegram-bot/settings.json
Linux: ~/.config/opencode-telegram-bot/settings.json
Start the OpenCode Server

Get Addo Zhang’s stories in your inbox
Join Medium for free to get updates from this writer.

Enter your email
Subscribe

Remember me for faster sign in

The bot depends on the local OpenCode API, so start it first:

opencode serve &
It listens on http://127.0.0.1:4096 by default. The & runs it in the background without blocking your terminal.

macOS note: Processes backgrounded with & will exit when you close the terminal. For persistent operation, use launchd — see the "macOS Auto-Start" section below.

Starting and Using the Bot
Start the bot

npx @grinev/opencode-telegram-bot start
A successful start looks like:

[INFO] Bot @your_bot_username started!
To run it in the background:

npx @grinev/opencode-telegram-bot start &
Common management commands

# Check running status
npx @grinev/opencode-telegram-bot status

# Stop the bot
npx @grinev/opencode-telegram-bot stop

# Reconfigure
npx @grinev/opencode-telegram-bot config
Day-to-day usage

Once started, open Telegram, find the bot you created, and start sending messages. Whether it’s a text prompt, a code question, or a screenshot to analyze — the bot forwards everything to your local OpenCode instance and streams the results back in real time.

On your phone while out, or on your work machine at the office — as long as your home computer is running, you’re always connected.

Important Notes
Your Bot Token is sensitive

The token is essentially a key to your bot. Anyone with it can control it. A few basic rules:

Never commit it to a Git repository
Never share it with others
The config file path is listed in the “Installation and Configuration” section above — keep default permissions and don’t place it in a public directory
OpenCode Server has no password by default

opencode serve starts with no authentication — the API is completely open. Since it only listens on 127.0.0.1, it's inaccessible from outside your machine, which is safe for typical local use.

If your machine has a public IP or is on a shared network, it’s worth setting a password:

export OPENCODE_SERVER_PASSWORD=your_password
opencode serve &
Then enter this password in the corresponding field during bot configuration.

Both processes must stay running

The bot requires two processes to be online simultaneously:

opencode serve — the local AI engine
opencode-telegram-bot start — the Telegram message bridge
After a system restart, both need to be relaunched. Using a system service manager (macOS: launchd, Linux: systemd) is recommended for automatic startup and crash recovery.

macOS Auto-Start (launchd)

macOS uses Launch Agents to manage user-level background services — they start automatically on login and restart automatically on crash.

1. Create the OpenCode Server service

Create the file ~/Library/LaunchAgents/ai.opencode.serve.plist:

<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.opencode.serve</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/your-username/.opencode/bin/opencode</string>
        <string>serve</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/your-username/Library/Logs/opencode-serve.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/your-username/Library/Logs/opencode-serve.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/Users/your-username/.opencode/bin</string>
        <key>HOME</key>
        <string>/Users/your-username</string>
    </dict>
</dict>
</plist>
Replace your-username with your actual macOS username (run whoami to check). Confirm the opencode binary path with which opencode — if installed via the official script, it's typically ~/.opencode/bin/opencode.

2. Create the Telegram Bot service

Create the file ~/Library/LaunchAgents/com.grinev.opencode-telegram-bot.plist:

<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.grinev.opencode-telegram-bot</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/npx</string>
        <string>@grinev/opencode-telegram-bot</string>
        <string>start</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/your-username/Library/Logs/opencode-telegram-bot.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/your-username/Library/Logs/opencode-telegram-bot.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/Users/your-username/.opencode/bin</string>
        <key>HOME</key>
        <string>/Users/your-username</string>
    </dict>
</dict>
</plist>
Confirm the npx path with which npx. On Intel Macs it's typically /usr/local/bin/npx.

3. Load the services

Note: The startup order of the two services is not guaranteed. If the bot starts before OpenCode Server is ready, it will retry automatically — this is expected behavior.

launchctl load ~/Library/LaunchAgents/ai.opencode.serve.plist
launchctl load ~/Library/LaunchAgents/com.grinev.opencode-telegram-bot.plist
Services start immediately after loading and will auto-start on every subsequent login.

4. Common management commands

# Check running status
launchctl list | grep -E 'opencode|telegram'

# Stop services
launchctl unload ~/Library/LaunchAgents/ai.opencode.serve.plist
launchctl unload ~/Library/LaunchAgents/com.grinev.opencode-telegram-bot.plist

# Restart a service (unload + load)
launchctl unload ~/Library/LaunchAgents/ai.opencode.serve.plist && \
launchctl load ~/Library/LaunchAgents/ai.opencode.serve.plist

# View logs
tail -f ~/Library/Logs/opencode-serve.log
tail -f ~/Library/Logs/opencode-telegram-bot.log
Configuration reference:

RunAtLoad: auto-start on login
KeepAlive: auto-restart on crash
Log files are in ~/Library/Logs/ for easy troubleshooting
Summary
opencode-telegram-bot is a deliberately lightweight tool. No complex architecture, no cloud service dependencies. It does one focused thing: turn Telegram into a remote terminal for your local OpenCode instance.

The value of this approach lies in how real the problem it solves is — not everyone is always at their development machine, but good ideas don’t wait for you to get home.

This tool is ideal when:

Your personal projects only live on your home computer and you need remote access
You’re working on the go and want to send prompts to your local environment from your phone
You don’t want to host your code or API keys on any cloud service
The whole setup takes under 10 minutes with a very low barrier to entry. If you’re already using OpenCode locally, it’s worth taking a few minutes to build this bridge.


State before:
- Bot existed but was pointed at scripts-writer and copywriting projects
- No auto-start configured
- No my-brain project in the bot's cache
What is changed:
File
settings.json
ai.opencode.serve.plist
com.grinev.opencode-telegram-bot.plist

Done. Both opencode serve and the telegram bot are stopped. Launch agents are still on disk at ~/Library/LaunchAgents/ if you want to re-enable later via launchctl load.