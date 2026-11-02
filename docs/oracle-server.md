# LearnSolo on an Oracle Cloud server: a learner's guide

This guide records how LearnSolo was set up on a free **Oracle Cloud** server, at
**https://learnsolo.duckdns.org**, and explains every command: what it does, and why it's needed.
Use it to remember how the server works, to look after it, or to build it again from nothing.

It's a **second copy** of the site, made for learning. The main site still runs on Render
(`render.yaml`, see section 10 of `docs/content-guide.md`), and nothing here changes it.

**Contents**

1. [The big picture](#1-the-big-picture)
2. [Words to know](#2-words-to-know)
3. [The Oracle account and the server](#3-the-oracle-account-and-the-server)
4. [SSH: logging in to the server](#4-ssh-logging-in-to-the-server)
5. [First setup: updates and swap](#5-first-setup-updates-and-swap)
6. [The two firewalls](#6-the-two-firewalls)
7. [Installing the tools](#7-installing-the-tools)
8. [Installing the app](#8-installing-the-app)
9. [systemd: keeping the app running](#9-systemd-keeping-the-app-running)
10. [nginx: the front door](#10-nginx-the-front-door)
11. [A name and https](#11-a-name-and-https)
12. [Backups](#12-backups)
13. [Updating the site: deploy.sh](#13-updating-the-site-deploysh)
14. [Security updates and restarts](#14-security-updates-and-restarts)
15. [Cheat sheet](#15-cheat-sheet)
16. [Problems we met, and what they meant](#16-problems-we-met-and-what-they-meant)
17. [If Oracle stops or you lose the server](#17-if-oracle-stops-or-you-lose-the-server)

---

## 1. The big picture

The Oracle server is just **another computer that runs a copy of the code**. It only *reads* from GitHub:

```
your laptop ──push──▶ GitHub ──auto-deploy──▶ Render          (the main site, unchanged)
                         │
                         └──git pull (read only)──▶ Oracle server
                                                    its own database
                                                    its own .env and SECRET_KEY
                                                    its own accounts
```

- An account made on one site **doesn't exist** on the other. Each has its own database.
- Render updates itself when `main` changes. The Oracle server updates only when you run `~/deploy.sh` on it (section 13).
- **Always change code on your laptop**, push and merge as usual, then deploy. Never edit code on the server.

Inside the server, a visit travels like this:

```
browser
  │  https://learnsolo.duckdns.org
  ▼
Oracle Security List ── lets in ports 22, 80, 443 ──┐   (Oracle's firewall, outside the server)
                                                     ▼
iptables ── lets in ports 22, 80, 443 ─────────────┐     (Ubuntu's firewall, inside the server)
                                                    ▼
nginx (ports 80 and 443) ── handles https, passes the request on
  │
  ▼
gunicorn (127.0.0.1:8000, 2 workers) ── kept running by systemd
  │
  ▼
Flask (backend/app.py) ──▶ PostgreSQL (only reachable from inside the server)
```

What each part was set up for:

| Part | Job | Section |
|---|---|---|
| Oracle Security List + iptables | Let only SSH and web traffic in | 6 |
| PostgreSQL | The database | 7, 8 |
| gunicorn | Runs the Flask app (same as on Render) | 8 |
| systemd | Starts gunicorn at boot, restarts it if it crashes | 9 |
| nginx | Receives visitors, does https, passes requests to gunicorn | 10 |
| DuckDNS + certbot | The name `learnsolo.duckdns.org` and the https certificate | 11 |
| cron + pg_dump | A database backup every night | 12 |
| unattended-upgrades | Installs security fixes every day | 14 |

---

## 2. Words to know

| Word | Meaning |
|---|---|
| **Server / VM / instance** | A computer in Oracle's data centre. "VM" (virtual machine) because it's a slice of a bigger machine. Oracle's console calls it an **instance** |
| **Ubuntu** | The Linux system the server runs (version 24.04 LTS: security fixes until 2029) |
| **Terminal / shell** | Where you type commands. `bash` is the shell on both your laptop and the server |
| **SSH** | "Secure shell": a terminal on another computer, over an encrypted connection |
| **IP address** | The server's number on the internet, e.g. `161.x.x.x`. **Public** = reachable from the internet; **private** (`10.0.0.x`) = only inside Oracle's network |
| **Port** | A numbered door on a computer. Each program listens on its own: 22 = SSH, 80 = http, 443 = https, 5432 = PostgreSQL, 8000 = our gunicorn |
| **Firewall** | Rules about which ports may be reached from outside |
| **`sudo`** | "Superuser do": run one command as the administrator (`root`). Needed to change system files and settings |
| **Package / `apt`** | A package is a program ready to install. `apt` is Ubuntu's installer |
| **Service** | A program that runs in the background all the time (nginx, PostgreSQL, our app) |
| **systemd / `systemctl`** | systemd starts and watches services. `systemctl` is the command to control it |
| **Reverse proxy** | A server that receives visitors and passes them to another program. Here: nginx → gunicorn |
| **Domain / DNS** | A name (`learnsolo.duckdns.org`) and the system that turns names into IP addresses |
| **Certificate / TLS / https** | https = http encrypted with TLS. The certificate proves the server really owns the name |
| **cron** | Linux's built-in scheduler: runs commands at set times |
| **`~`** | Your home folder. On the server that's `/home/ubuntu` |

Shell symbols that appear a lot below:

| Symbol | Meaning | Example |
|---|---|---|
| `&&` | Run the next command only if this one **succeeded** | `sudo nginx -t && sudo systemctl reload nginx` |
| `\|` | "Pipe": send this command's output into the next command | `ls -l \| head -5` |
| `>` | Write the output into a file, **replacing** what was there | `echo hi > file.txt` |
| `>>` | **Add** the output to the end of a file | `echo hi >> file.txt` |
| `&` (at the end) | Run the command in the background | `gunicorn ... &` |
| `#` | A comment: the shell ignores the rest of the line | `ls   # list files` |
| `$(...)` | Run the command inside, and use its output here | `echo $(date)` |
| `<<'EOF' … EOF` | A "here document": the lines in between are the input. With quotes around `'EOF'`, `$...` is written as it is, not filled in | see section 9 |

---

## 3. The Oracle account and the server

**The account** (oracle.com/cloud/free):
- **A card is needed** to prove you're a real person. Oracle places a small temporary hold (about US$1) and cancels it.
- **You aren't charged** while the account stays on the free type ("Free Tier"). After the 30-day trial, paid services simply stop; Always Free resources keep working.
- Money could only be used if you **upgrade to Pay As You Go** and then create something beyond the free limits. Don't upgrade unless you have a reason, and set a **budget alert** first if you do.
- The **home region** (ours: **Osaka**) can't be changed later. Free servers can only be made there.

**The server** (☰ menu → Compute → Instances → Create instance):

| Setting | Our choice | Why |
|---|---|---|
| Name | `learnsolo` | |
| Image | Canonical Ubuntu 24.04 (not "Minimal") | Common, well documented, long support |
| Shape | **VM.Standard.E2.1.Micro** (AMD) | "Always Free-eligible". 1 CPU, 1 GB memory. The bigger free Ampere A1 shape is often "Out of capacity" |
| Networking | A **public subnet**, with a public IPv4 address | So it can be reached from the internet |
| SSH key | The **public** key `oracle_learnsolo.pub` (section 4) | So you can log in |
| Boot volume | Default (about 47 GB) | Free up to 200 GB in total |

**If the server shows only a private IP:**
1. Instance → **Networking** → the primary **VNIC** (the server's network card) → **IPv4 addresses**.
2. On the private IP row: **⋮ → Edit → Public IP type: Ephemeral public IP → Update**.

"Ephemeral" means the IP belongs to this server: it stays through stop and start, but goes if the server is deleted. If "public IP" is greyed out, the server is in a **private subnet** (no way to the internet). Then:
- make a network with **Networking → Virtual cloud networks → Start VCN Wizard → "Create VCN with Internet Connectivity"**,
- delete the server, and
- create it again in the new **public** subnet.

---

## 4. SSH: logging in to the server

### The key (made once, on the laptop)

```bash
ssh-keygen -t ed25519 -f ~/.ssh/oracle_learnsolo -C "oracle-learnsolo"
```

| Part | Meaning |
|---|---|
| `ssh-keygen` | Makes a new key pair |
| `-t ed25519` | The key type: modern, short and secure |
| `-f ~/.ssh/oracle_learnsolo` | The file name. The public half gets `.pub` added |
| `-C "oracle-learnsolo"` | A label, to remember what the key is for |

It asks for a **passphrase**: a password that protects the key file if someone copies it.

This makes two files:

| File | What it is | Rule |
|---|---|---|
| `~/.ssh/oracle_learnsolo` | **Private key**: like your house key | Never share, upload, commit or paste it anywhere |
| `~/.ssh/oracle_learnsolo.pub` | **Public key**: like the lock on the door | Safe to share. It was pasted into Oracle when making the server |

`cat ~/.ssh/oracle_learnsolo.pub` shows the public key (one line starting with `ssh-ed25519`).

### Logging in (from the laptop)

```bash
ssh -i ~/.ssh/oracle_learnsolo ubuntu@SERVER_IP
```

| Part | Meaning |
|---|---|
| `-i ~/.ssh/oracle_learnsolo` | Which private key proves who you are ("identity") |
| `ubuntu` | The user name. Oracle's Ubuntu servers always start with the user `ubuntu` |
| `SERVER_IP` | The server's public IP (on the instance page in Oracle's console). `learnsolo.duckdns.org` works too |

- **The first time**, ssh asks `Are you sure you want to continue connecting?`. Type `yes`. Your laptop saves the server's identity in `~/.ssh/known_hosts` and checks it every time after. If it ever warns that the identity **changed** for the same address, stop and find out why before typing yes.
- You're in when the prompt is `ubuntu@learnsolo:~$`. Commands now run **on the server**.
- `exit` (or Ctrl+D) goes back to your laptop.

---

## 5. First setup: updates and swap

### Updating

```bash
sudo apt update && sudo apt upgrade -y
```

| Part | Meaning |
|---|---|
| `apt update` | Downloads the latest **list** of packages. Nothing is installed yet |
| `apt upgrade -y` | Installs the newer versions. `-y` answers "yes" to the question |

If it ends with `System restart required`, run `sudo reboot`. You get disconnected; wait about a minute and log in again.

### Looking around

```bash
lsb_release -d    # which Ubuntu version
free -h           # memory (RAM) and swap; -h = "human" units like Mi and Gi
df -h /           # space on the main disk
```

### Swap: extra memory on the disk

The Micro server has only about **1 GB** of memory. Building the React app (`npm run build`) can need more. When memory runs out, Linux stops a program to protect itself. **Swap** is a file on the disk the system can use as slower extra memory, so the build finishes instead.

```bash
sudo fallocate -l 2G /swapfile     # make an empty 2 GB file
sudo chmod 600 /swapfile           # only root can read it (memory can hold secrets)
sudo mkswap /swapfile              # format it as swap
sudo swapon /swapfile              # start using it now
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab   # and after every reboot
free -h                            # the Swap line now shows 2.0Gi
```

- `/etc/fstab` is the list of disks and files Linux sets up when it starts.
- `sudo tee -a FILE` **adds** (`-a` = append) the line to a file that only root may change. A plain `sudo echo ... >> FILE` would fail, because the `>>` is done by your shell, which isn't root.
- Run the `tee -a` line **only once**; otherwise the line appears twice in `/etc/fstab`.

---

## 6. The two firewalls

On Oracle, **two** separate firewalls must both allow a port:

```
internet ──▶ [1. Oracle Security List] ──▶ [2. Ubuntu's iptables] ──▶ program on the server
```

If either one blocks it, the site can't be reached.

### 1. The Oracle Security List (in the website)

1. Instance → **Networking** → click the **subnet**.
2. **Security** → **Default Security List for …** → **Security rules** → **Add Ingress Rules** ("ingress" = incoming).

The rules we added:

| Source CIDR | IP Protocol | Source Port Range | Destination Port Range | Description |
|---|---|---|---|---|
| `0.0.0.0/0` | TCP | **All** (left empty) | `80` | web |
| `0.0.0.0/0` | TCP | **All** (left empty) | `443` | HTTPS |

- `0.0.0.0/0` means "from any address on the internet".
- **Destination** port is the server's door. **Source** port is a random number the *visitor's* computer picks, so it must stay **All**.
- The rule for port **22** (SSH) was already there. **Never delete it**, or you lock yourself out.
- "Stateless: No" means the replies are let back out automatically. That's the right setting.

### 2. iptables (on the server)

Oracle's Ubuntu image has strict iptables rules: everything not allowed is **REJECT**ed. Rules are checked **from top to bottom**, and the first match wins, so new rules must go **above** the REJECT line.

```bash
sudo iptables -L INPUT -n --line-numbers        # show the incoming rules, numbered
```

| Part | Meaning |
|---|---|
| `-L INPUT` | List the rules for **incoming** traffic |
| `-n` | Show numbers (IPs, ports) instead of looking up names: faster |
| `--line-numbers` | Number each rule |

The REJECT rule was number 6, so the new rules were inserted at 6, which pushes REJECT down:

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save                   # keep the rules after a reboot
```

| Part | Meaning |
|---|---|
| `-I INPUT 6` | **Insert** into the incoming rules at position 6 |
| `-m state --state NEW` | For **new** connections (replies to existing ones are already allowed by rule 1) |
| `-p tcp --dport 80` | TCP, to (destination) port 80 |
| `-j ACCEPT` | "Jump to" ACCEPT: let it through |
| `netfilter-persistent save` | Writes the rules to `/etc/iptables/rules.v4`, which is loaded at boot. Without it, they'd be lost at the next restart |

The result (rules 5 and 6 come before REJECT):

```
1  ACCEPT  ... state RELATED,ESTABLISHED     replies to connections already open
2  ACCEPT  1  ...                            ping (protocol 1 = ICMP)
3  ACCEPT  0  ...                            the server talking to itself (shown with -v)
4  ACCEPT  6  ... tcp dpt:22                 SSH  (protocol 6 = TCP, dpt = destination port)
5  ACCEPT  6  ... tcp dpt:443                https
6  ACCEPT  6  ... tcp dpt:80                 http
7  REJECT  ...                               everything else
```

**Don't use `ufw`** (Ubuntu's simpler firewall tool) on Oracle: it can clash with these rules, and Oracle's own documentation warns against it.

---

## 7. Installing the tools

```bash
sudo apt install -y python3-venv postgresql
```

| Package | What for |
|---|---|
| `python3-venv` | Making a **virtual environment**: a private folder of Python packages for one app, so different apps don't clash |
| `postgresql` | The database server (version 16 on Ubuntu 24.04; the laptop's Docker one is 17, but the app works the same). It starts by itself and **only listens on localhost**, so the internet can't reach it |

**Node.js** (needed to build the React app). Ubuntu's own Node is version 18, but Vite 8 needs 20.19 or newer, so it comes from **NodeSource**, the official Node packages for Ubuntu:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x -o nodesource_setup.sh   # download their setup script
sudo bash nodesource_setup.sh     # it adds NodeSource's package list to apt
sudo apt install -y nodejs        # Node 22, with npm
node -v && npm -v                 # check the versions
```

`curl` downloads from the web. Its flags:
- `-f`: fail on an error page instead of saving it
- `-s`: silent
- `-S`: still show errors
- `-L`: follow redirects
- `-o FILE`: save into FILE

Git is already installed on Ubuntu.

---

## 8. Installing the app

### Download the code

```bash
git clone https://github.com/Music195/learnsolo.git ~/learnsolo
```

This makes `/home/ubuntu/learnsolo`, a copy of `main`. The repo is public, so no login is needed. The server can't push: it has no GitHub login, so it can never change the repo.

### The database and the secrets

Pasted as one block:

```bash
DB_PASSWORD=$(openssl rand -hex 24)
sudo -u postgres psql -c "CREATE USER learnsolo WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres createdb -O learnsolo learnsolo
cat > ~/learnsolo/.env <<EOF
DATABASE_URL=postgresql+psycopg://learnsolo:$DB_PASSWORD@localhost:5432/learnsolo
SECRET_KEY=$(openssl rand -hex 32)
EOF
chmod 600 ~/learnsolo/.env
unset DB_PASSWORD
```

| Line | What it does |
|---|---|
| `DB_PASSWORD=$(openssl rand -hex 24)` | Makes a random password (48 hex characters) and keeps it in a **shell variable**. You never see or type it |
| `sudo -u postgres psql -c "…"` | Runs `psql` (the PostgreSQL command line) as the `postgres` user, PostgreSQL's administrator. `-c` runs one SQL command: here it creates a database **user** called `learnsolo` |
| `sudo -u postgres createdb -O learnsolo learnsolo` | Creates a **database** called `learnsolo`, owned (`-O`) by the user `learnsolo` |
| `cat > ~/learnsolo/.env <<EOF … EOF` | Writes the lines in between into `.env`. Here `EOF` has **no** quotes, so `$DB_PASSWORD` and `$(openssl …)` **are** filled in as it writes |
| `chmod 600 .env` | Only the owner (`ubuntu`) can read and write it. `6` = read+write, `0` = nothing for the group, `0` = nothing for others |
| `unset DB_PASSWORD` | Forgets the variable |

- The app reads `.env` exactly as on the laptop (`backend/config.py`).
- There's no `FLASK_DEBUG`: debug mode on a public server would let visitors run code.
- `SESSION_COOKIE_SECURE=1` was added later, once https worked (section 11).
- **Never paste or commit the contents of `.env`.**

### Python packages, tables, content

```bash
cd ~/learnsolo
python3 -m venv .venv                       # create the virtual environment in .venv/
source .venv/bin/activate                   # use it in this terminal: the prompt starts with (.venv)
pip install -r backend/requirements.txt     # Flask, gunicorn, psycopg, ...
cd backend
flask db upgrade                            # create the tables (backend/migrations/)
flask import-content                        # copy content/ into the database
```

- `source .venv/bin/activate` makes `python`, `pip`, `flask` and `gunicorn` mean the ones in `.venv`. It lasts until you close the terminal (or type `deactivate`).
- `flask` finds the app by itself because `backend/` contains `app.py`.

### Build the React app

```bash
cd ~/learnsolo/frontend
npm ci              # install exactly the versions in package-lock.json ("clean install")
npm run build       # make frontend/dist: the files Flask sends to browsers
```

`npm ci` is used instead of `npm install` on servers: it never changes `package-lock.json`, so the server gets the same versions as your laptop.

### A quick test

```bash
cd ~/learnsolo/backend
gunicorn app:app --bind 127.0.0.1:8000 &          # start the web server in the background
sleep 3                                            # wait 3 seconds for it to start
curl -s localhost:8000/api/home | head -c 300; echo   # the start of the JSON (stats: 262 notes, ...)
curl -s localhost:8000/ | head -c 200; echo           # the start of the React page (<!DOCTYPE html>)
kill %1                                            # stop background job number 1
```

| Part | Meaning |
|---|---|
| `app:app` | "In the file `app.py`, the variable `app`" (the Flask app) |
| `--bind 127.0.0.1:8000` | Listen on port 8000, **only for this server**. `127.0.0.1` (= `localhost`) is the computer itself |
| `head -c 300` | Show only the first 300 characters |
| `echo` | Prints a new line, so the prompt starts on its own line |
| `%1` | The background job the shell numbered `[1]` when it started |

---

## 9. systemd: keeping the app running

A gunicorn started by hand stops when you log out, and nobody restarts it after a crash or a reboot. **systemd** does both. It's told what to run by a **unit file**:

```bash
sudo tee /etc/systemd/system/learnsolo.service > /dev/null <<'EOF'
[Unit]
Description=LearnSolo (gunicorn)
# Start after the network and the database are up
After=network.target postgresql.service
Wants=postgresql.service

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/learnsolo/backend
# Before each start: new tables/columns, then the latest content (as on Render)
ExecStartPre=/home/ubuntu/learnsolo/.venv/bin/flask db upgrade
ExecStartPre=/home/ubuntu/learnsolo/.venv/bin/flask import-content
# The web server: 2 workers (each answers one request at a time), only reachable from this server
ExecStart=/home/ubuntu/learnsolo/.venv/bin/gunicorn app:app --bind 127.0.0.1:8000 --workers 2
# If it crashes, start it again after 5 seconds
Restart=always
RestartSec=5

[Install]
# Start at boot
WantedBy=multi-user.target
EOF
```

- `sudo tee FILE > /dev/null` writes into a file only root may change. `tee` would also print what it writes; `> /dev/null` throws that copy away. `/dev/null` is Linux's "bin".
- `<<'EOF'` has **quotes**, so the text is written exactly as it is.
- The settings, line by line:

| Setting | Meaning |
|---|---|
| `After=` / `Wants=` | Start after the network and PostgreSQL, and start PostgreSQL too if needed |
| `User=ubuntu` | Run as the normal user, not root, so a bug in the app can't change the system |
| `WorkingDirectory=` | The folder it runs in (like `cd backend`) |
| `ExecStartPre=` | Commands run **before** the start. If one fails, the app isn't started |
| `ExecStart=` | The program itself. Full paths into `.venv/bin/`, because systemd doesn't run `source .venv/bin/activate` |
| `--workers 2` | Two copies of the app answering requests side by side. On 1 GB of memory, 2 is a safe number |
| `Restart=always`, `RestartSec=5` | Restart 5 seconds after any stop that wasn't asked for |
| `WantedBy=multi-user.target` | "Start this during a normal boot" |

Turning it on:

```bash
sudo systemctl daemon-reload              # make systemd read the new or changed unit file
sudo systemctl enable --now learnsolo     # enable = start at every boot; --now = also start it right now
systemctl status learnsolo --no-pager     # is it running? (--no-pager = print everything, no scrolling)
```

`status` should say **`active (running)`**, and list 3 gunicorn processes: 1 manager plus the 2 workers.

**After changing the unit file**, always run `sudo systemctl daemon-reload` and then `sudo systemctl restart learnsolo`.

The app's output (errors too) goes to systemd's log, the **journal**:

```bash
sudo journalctl -u learnsolo -n 30 --no-pager    # the last 30 lines of this unit's log
sudo journalctl -u learnsolo -f                  # follow: show new lines as they come (Ctrl+C to stop)
```

---

## 10. nginx: the front door

gunicorn is good at running Python, but it's not built to face the internet directly. **nginx** sits in front:
- it receives visitors on ports 80 and 443,
- it does the https encryption,
- it copes with slow connections, and
- it passes each request to gunicorn on `127.0.0.1:8000`.

```bash
sudo apt install -y nginx
```

The site's settings:

```bash
sudo tee /etc/nginx/sites-available/learnsolo > /dev/null <<'EOF'
server {
    # Listen for http on port 80 (IPv4 and IPv6)
    listen 80;
    listen [::]:80;
    # Any name/IP for now; the domain comes in Part 5
    server_name _;

    # The biggest request accepted (the app only receives small JSON)
    client_max_body_size 1m;

    location / {
        # Pass every request to gunicorn
        proxy_pass http://127.0.0.1:8000;
        # Tell it the real address the visitor typed and came from
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
```

| Setting | Meaning |
|---|---|
| `server { … }` | One website |
| `listen 80;` / `listen [::]:80;` | Answer on port 80, for IPv4 and IPv6 |
| `server_name _;` | Which name this site is for. `_` = any. Later changed to `learnsolo.duckdns.org` (section 11) |
| `client_max_body_size 1m;` | Refuse requests bigger than 1 MB. The app only receives small JSON |
| `location / { … }` | Settings for every address starting with `/` (all of them) |
| `proxy_pass` | Pass the request to gunicorn |
| `proxy_set_header …` | Tell gunicorn the name the visitor typed (`Host`), their IP (`X-Forwarded-For`), and whether they used http or https (`X-Forwarded-Proto`). Otherwise gunicorn would only see "a visit from nginx" |

Turning it on:

```bash
sudo ln -s /etc/nginx/sites-available/learnsolo /etc/nginx/sites-enabled/   # enable our site
sudo rm /etc/nginx/sites-enabled/default        # disable nginx's "Welcome" site
sudo nginx -t                                   # test the settings
sudo systemctl reload nginx                     # use the new settings, without dropping visitors
```

- `sites-available/` holds the settings of **every** site. `sites-enabled/` holds **shortcuts** (`ln -s` = symbolic link) to the ones that are **on**. Removing the shortcut turns a site off but keeps its settings.
- `nginx -t` must say `syntax is ok` and `test is successful`. Always test before `reload`; a broken file could take the site down.
- `reload` re-reads the settings gently. `restart` stops and starts nginx.

Check from the server:

```bash
curl -sI http://localhost | head -5
```

`-I` asks for the **headers only**. The first line should be `HTTP/1.1 200 OK` (200 = success), and `Server: nginx` shows nginx answered.

---

## 11. A name and https

### The name: DuckDNS

[duckdns.org](https://www.duckdns.org) gives free names ending in `.duckdns.org`:
1. Log in with GitHub or Google.
2. Add the sub domain `learnsolo`.
3. Put the **server's** IP in **current ip** and click **update ip**. DuckDNS fills in your laptop's IP by default, so check it.

The **token** shown on that page is like a password; keep it private. Our IP doesn't change, so it isn't needed.

```bash
getent hosts learnsolo.duckdns.org    # which IP the name points to (should be the server's)
```

nginx is told its name. `sed` edits the file in place:

```bash
sudo sed -i 's/server_name _;/server_name learnsolo.duckdns.org;/' /etc/nginx/sites-available/learnsolo
sudo nginx -t && sudo systemctl reload nginx
```

`sed -i 's/OLD/NEW/' FILE` replaces the text OLD with NEW inside FILE (`-i` = in place, `s` = substitute).

### https: Let's Encrypt and certbot

- **Let's Encrypt** gives free certificates (proof that the server owns the name). They last 90 days.
- **certbot** requests a certificate, puts it into nginx, and renews it automatically.
- To prove you own the name, Let's Encrypt visits `http://learnsolo.duckdns.org/.well-known/...` on port **80**. That's another reason port 80 stays open.

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d learnsolo.duckdns.org
```

| Part | Meaning |
|---|---|
| `python3-certbot-nginx` | certbot's plugin that edits nginx settings for you |
| `--nginx` | Use that plugin |
| `-d learnsolo.duckdns.org` | The domain the certificate is for |

It asks for an email (Let's Encrypt warns you there if renewal fails) and to accept the terms. Then it changes the nginx site so that:
- port **443** serves the site with the certificate, and
- port **80** **redirects** visitors to https.

certbot's lines in the file are marked `# managed by Certbot`.

Checking that renewal will work:

```bash
sudo certbot renew --dry-run            # a practice renewal: "all simulated renewals succeeded"
systemctl list-timers | grep certbot    # the timer that runs the renewal check twice a day
```

- A **timer** is systemd's version of a scheduled task.
- `grep certbot` keeps only the lines containing "certbot".
- certbot only really renews when the certificate has about 30 days or less left.

### Login cookies over https only

```bash
echo 'SESSION_COOKIE_SECURE=1' >> ~/learnsolo/.env   # >> ADDS a line; a single > would erase .env!
sudo systemctl restart learnsolo                     # the app reads .env when it starts
```

With this on, the browser only sends the login cookie over https, so it can't be read on the way (same setting as on Render, see `backend/config.py`). Because of this, **logging in only works at `https://learnsolo.duckdns.org`**, not at the bare IP over http.

---

## 12. Backups

The notes and practice sets come from `content/` in git and are re-imported at every start, so they can't be lost. The backup is for what exists **only** in the server's database: **accounts and progress**.

- **`pg_dump`** saves a whole database into one file.
- **`pg_restore`** puts it back.

### The backup folder and script

```bash
mkdir -p ~/backups && chmod 700 ~/backups
```

- `mkdir -p` makes the folder (no error if it exists).
- `chmod 700` = only you can open it: `7` = read+write+enter for the owner, nothing for anyone else.

```bash
sudo tee /usr/local/bin/learnsolo-backup > /dev/null <<'EOF'
#!/bin/bash
# Daily backup of the LearnSolo database.
# Run by cron every night (see /etc/cron.d/learnsolo-backup), or by hand:
#   sudo learnsolo-backup
set -euo pipefail            # stop at the first error, instead of carrying on

DIR=/home/ubuntu/backups
FILE="$DIR/learnsolo-$(date +%F).dump"     # e.g. learnsolo-2026-11-02.dump

# pg_dump runs as "postgres" (the database admin, no password needed);
# --format=custom makes a compressed file that pg_restore can read
sudo -u postgres pg_dump --format=custom learnsolo > "$FILE"
chown ubuntu:ubuntu "$FILE"                # so you can copy it to your laptop

# Keep one week: delete backups older than 7 days
find "$DIR" -name 'learnsolo-*.dump' -mtime +7 -delete
EOF
sudo chmod 755 /usr/local/bin/learnsolo-backup    # make it a program anyone can run (only root can change it)
```

| Part | Meaning |
|---|---|
| `#!/bin/bash` | The first line of a script, the "shebang": which program runs this file |
| `set -euo pipefail` | Safety switches: `-e` stop at the first failing command, `-u` stop if a variable has no value, `-o pipefail` count a failure anywhere in a `\|` chain |
| `/usr/local/bin/` | The folder for programs you add yourself. It's on the `PATH`, so `learnsolo-backup` works as a command from anywhere |
| `$(date +%F)` | Today's date as `YYYY-MM-DD` |
| `chown ubuntu:ubuntu` | Make `ubuntu` the owner (the script runs as root, so the file would otherwise belong to root) |
| `find … -mtime +7 -delete` | Find backup files last changed more than 7 days ago, and delete them |
| `chmod 755` | Owner (root) can change it; everyone can read and run it |

Trying it by hand:

```bash
sudo learnsolo-backup && ls -lh ~/backups
```

`ls -lh` lists files with details (`-l`) in human sizes (`-h`). The first backup was about 560 KB.

### Every night, with cron

```bash
echo '0 18 * * * root /usr/local/bin/learnsolo-backup' | sudo tee /etc/cron.d/learnsolo-backup
```

A cron line is **five time fields**, then the user, then the command:

```
0    18   *    *    *     root  /usr/local/bin/learnsolo-backup
│    │    │    │    │     │     └─ the command
│    │    │    │    │     └─ run it as root
│    │    │    │    └─ day of the week (* = every)
│    │    │    └─ month (* = every)
│    │    └─ day of the month (* = every)
│    └─ hour: 18
└─ minute: 0
```

The server's clock is **UTC**, so 18:00 UTC is **3:00 at night in Japan**.

`cat /etc/cron.d/learnsolo-backup` shows the line. `ls ~/backups` should show a new file each day.

### A copy on your laptop

A backup on the server is lost if the server is lost, so copy them now and then. Run this **on the laptop**:

```bash
scp -i ~/.ssh/oracle_learnsolo 'ubuntu@learnsolo.duckdns.org:backups/*.dump' ~/Downloads/
```

- `scp` = "secure copy": copies files over SSH, with the same key.
- `ubuntu@host:backups/*.dump` = the files matching `*.dump` in `backups/` of the `ubuntu` user's home on the server.
- The quotes stop your **laptop's** shell from trying to expand `*` itself.

### Restoring (only when needed)

```bash
sudo systemctl stop learnsolo        # stop the app, so nothing writes while restoring
sudo -u postgres pg_restore --clean --if-exists -d learnsolo < ~/backups/learnsolo-2026-11-02.dump
sudo systemctl start learnsolo
```

| Part | Meaning |
|---|---|
| `--clean --if-exists` | Remove the tables that are there first, then rebuild them from the backup (and don't complain about ones that don't exist) |
| `-d learnsolo` | Into the database `learnsolo` |
| `< file` | Feed the file in. Your shell opens it, so the `postgres` user doesn't need permission to your home folder |

---

## 13. Updating the site: deploy.sh

Render updates itself when `main` changes; the Oracle server doesn't. `~/deploy.sh` is a script **on the server only** (not in the repo) that does every update step:

```bash
cat > ~/deploy.sh <<'EOF'
#!/bin/bash
# Update this server to the latest main on GitHub. Run: ~/deploy.sh
set -euo pipefail                      # stop at the first error

cd ~/learnsolo
git pull --ff-only                     # download main; refuse if the server's copy was changed by hand

# Python packages (quick when nothing changed)
.venv/bin/pip install -q -r backend/requirements.txt

# Rebuild the React app into frontend/dist
cd frontend
npm ci
npm run build

# Restart: runs db upgrade + import-content, then gunicorn (see learnsolo.service)
sudo systemctl restart learnsolo
systemctl status learnsolo --no-pager | head -3
EOF
chmod +x ~/deploy.sh                   # +x = allowed to run as a program
```

| Part | Meaning |
|---|---|
| `git pull --ff-only` | Download and apply the new commits from GitHub. `--ff-only` ("fast-forward only") accepts only updates that simply continue the server's history. If someone edited files on the server, it stops with an error instead of mixing changes |
| `pip install -q` | `-q` = quiet. Installs only what changed in `requirements.txt` |
| `npm ci` + `npm run build` | Same as in section 8 |
| `systemctl restart learnsolo` | Runs the `ExecStartPre` steps (`db upgrade`, `import-content`), then starts gunicorn with the new code |
| `head -3` | Shows the first 3 lines of the status, enough to see `active (running)` |

**The update routine:**

1. **On the laptop:** branch → commit → push → pull request → merge, as usual. Render updates by itself.
2. **On the server:** `ssh` in, then run `~/deploy.sh`.

If it stops with an error, read the last lines: `set -e` stopped at the step that failed, and nothing after it ran. The site keeps running the old version until the restart.

---

## 14. Security updates and restarts

Ubuntu installs **security fixes every day by itself**, with `unattended-upgrades`. To check it's on:

```bash
cat /etc/apt/apt.conf.d/20auto-upgrades     # both lines should end in "1";
systemctl is-active unattended-upgrades     # should print: active
```

```
APT::Periodic::Update-Package-Lists "1";    refresh the package list every 1 day
APT::Periodic::Unattended-Upgrade "1";      install security fixes every 1 day
```

If it's off: `sudo dpkg-reconfigure -plow unattended-upgrades` and answer **Yes**.

**Restarts:** some fixes (like a new Linux kernel) only take effect after a restart. When you log in and see `*** System restart required ***`, run:

```bash
sudo reboot
```

Wait about a minute and log in again. Everything starts by itself:
- swap
- iptables rules
- PostgreSQL
- the app (systemd)
- nginx
- the certbot timer
- cron

Now and then, also run `sudo apt update && sudo apt upgrade -y` for the non-security updates.

---

## 15. Cheat sheet

**Logging in** (on the laptop):

```bash
ssh -i ~/.ssh/oracle_learnsolo ubuntu@learnsolo.duckdns.org
```

**The app:**

| Command | What it does |
|---|---|
| `~/deploy.sh` | Update to the latest `main` and restart |
| `systemctl status learnsolo --no-pager` | Is the app running? |
| `sudo systemctl restart learnsolo` | Restart it (also re-runs `db upgrade` + `import-content`) |
| `sudo journalctl -u learnsolo -n 50 --no-pager` | The app's last 50 log lines: look here first when something's wrong |
| `sudo journalctl -u learnsolo -f` | Watch the log live (Ctrl+C to stop) |

**nginx:**

| Command | What it does |
|---|---|
| `sudo nginx -t` | Test the settings (always before a reload) |
| `sudo systemctl reload nginx` | Use changed settings |
| `sudo tail -n 20 /var/log/nginx/access.log` | The last 20 visits |
| `sudo tail -n 20 /var/log/nginx/error.log` | nginx's last errors |
| `curl -sI http://localhost \| head -5` | Does nginx answer on the server? |

**Database:**

| Command | What it does |
|---|---|
| `sudo learnsolo-backup` | Make a backup right now |
| `ls -lh ~/backups` | List the backups |
| `sudo -u postgres psql learnsolo` | Open the database's SQL prompt (`\dt` lists tables, `\q` quits) |

**The server:**

| Command | What it does |
|---|---|
| `free -h` | Memory and swap |
| `df -h /` | Disk space |
| `uptime` | How long since the last restart, and how busy it is |
| `sudo apt update && sudo apt upgrade -y` | Install updates |
| `sudo reboot` | Restart the server |
| `sudo certbot certificates` | The certificate and when it expires |

**Keyboard:**

| Keys | Meaning |
|---|---|
| Ctrl+C | Stop the command running in the **foreground** |
| `q` | Quit a scrolling screen (`systemctl status`, `less`, `man`) |
| Ctrl+D or `exit` | Log out of the server |
| ↑ | The previous command |
| Tab | Complete a file or command name |

---

## 16. Problems we met, and what they meant

| What we saw | What it meant | Fix |
|---|---|---|
| The server had only a **private IP** | It had no public IP attached | Add an **Ephemeral public IP** to the VNIC (section 3) |
| `curl` on the server worked, but the browser timed out | Something on the way **dropped** port 80. The Security List rule said **88** instead of **80** | Edit the rule. A timeout (no answer at all) usually means a firewall; "connection refused" means the packet arrived but nothing listens on that port |
| `Address already in use` from gunicorn | Another gunicorn was still running on port 8000. **Ctrl+C doesn't stop a background (`&`) job** | `kill %1` (the job number), or `jobs` to list background jobs |
| `nginx -t` → `Permission denied` on `/run/nginx.pid` | It was run **without `sudo`**. The line before said `syntax is ok`, so the settings were fine | `sudo nginx -t` |
| `curl -sI https://localhost` printed nothing | nginx didn't do https yet, and `-s` hid the error | Use `http://` until certbot has run |
| `Unit learnsol.service not found` | A typo in the unit name | `learnsolo`. Press Tab to complete names |
| `Unknown command verb 'list-items'` | A typo; systemctl suggests the right word | `systemctl list-timers` |

**General tips for when something is wrong:**

1. **Read the last lines of the error.** They usually say what failed.
2. **Follow the request's path** (section 1) from the inside out:
   - `curl localhost:8000` tests gunicorn,
   - `curl http://localhost` tests nginx,
   - then the browser tests the firewalls and DNS.
3. **Look at the logs:** `sudo journalctl -u learnsolo -n 50 --no-pager` for the app, `/var/log/nginx/error.log` for nginx.

---

## 17. If Oracle stops or you lose the server

**Oracle stopped the server** ("idle reclamation"): Oracle may stop Always Free servers that are almost unused for 7 days, and sends an email. Go to **Instances → learnsolo → Start**. Everything comes back as it was: the disk, the database and the IP.

**The site is down but the server is running:**
1. Log in.
2. Check `systemctl status learnsolo` and `systemctl status nginx`.
3. Read the logs (section 16).

**Building it again from nothing** (new server, or a new IP):
1. A server, a public IP, and the SSH key (sections 3 and 4).
2. Updates and swap (5), both firewalls (6), the tools (7).
3. The app (8), then systemd (9) and nginx (10).
4. At DuckDNS, point `learnsolo` at the **new** IP, then nginx's `server_name`, certbot and `SESSION_COOKIE_SECURE` (11).
5. The backup script and cron (12), and `deploy.sh` (13).
6. Restore the latest backup from your laptop (12). Copy it up first:

   ```bash
   scp -i ~/.ssh/oracle_learnsolo ~/Downloads/learnsolo-DATE.dump ubuntu@learnsolo.duckdns.org:backups/
   ```

7. Your laptop will warn that the server's identity changed (it's a new server, so that's expected). Remove the old entry with `ssh-keygen -R learnsolo.duckdns.org` and `ssh-keygen -R OLD_IP`, then log in again.
