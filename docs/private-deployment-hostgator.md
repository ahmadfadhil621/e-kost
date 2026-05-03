# Private Deployment on Client's HostGator Server

Working doc for an ongoing client request: a single E-Kost client wants to run a private, single-tenant copy of E-Kost on a HostGator server he already pays for.

Status: **waiting on info from the client** before we can produce a concrete deployment runbook.

---

## What "private deployment" means here

- One isolated copy of E-Kost, his data only, on infrastructure he pays for and controls.
- His own domain (or subdomain).
- His own PostgreSQL database — self-hosted on the VPS, not Supabase. Data never leaves his box.
- His own `BETTER_AUTH_SECRET` and `.env`.
- No shared users, no shared services with the main E-Kost SaaS.

This is a different product from the main multi-tenant SaaS. Decide the support/licensing model (one-shot vs. managed) before starting.

---

## Recommended target architecture (price not a constraint)

| Decision | Pick | Why |
|---|---|---|
| HostGator plan | VPS (Snappy 4000+) or Dedicated | 4GB+ RAM, root SSH. Avoid shared hosting entirely. |
| OS | AlmaLinux 9 or Ubuntu 22.04 LTS | Long support, well-documented. |
| Database | Self-hosted PostgreSQL 15 on the VPS | Fully private. Drop Supabase for this deployment. |
| Auth | BetterAuth → local Postgres | Same code, his own session store. |
| Web server | Nginx → Next.js on :3000 | Standard reverse proxy for TLS, gzip, rate limiting. |
| Process manager | systemd unit | Native, survives reboots, journald logging. |
| TLS | Let's Encrypt via certbot, auto-renew | Standard. |
| Backups | `pg_dump` nightly → off-server (S3/B2) + HostGator VPS snapshots | Two independent backup paths. |
| Monitoring | UptimeRobot/BetterStack HTTP probes; `journalctl` for app logs | Lightweight, pages on outage. |
| Updates | Tagged release deploys (git tag → pull → migrate → restart) | Don't auto-pull `main`. |

### Operational risk to flag with him

HostGator's VPS isn't their strongest product; their support is oriented to cPanel shared customers. If a network/hardware issue hits, expect slow ticket turnaround. Worth telling him before we start.

---

## Info we need from the client before producing a deployment runbook

1. **HostGator plan name** (e.g. "Snappy 4000", "Snappy 8000", or a dedicated server tier)
2. **OS image** he chose (AlmaLinux / Ubuntu / CentOS / etc.)
3. **Root SSH access confirmed** + a **domain/subdomain** ready to point at the server's IP

### How a non-technical client can find each of these

These instructions are written so the client can follow them himself. Send him this section verbatim.

#### 1. HostGator plan name

- Go to **portal.hostgator.com** and log in with the email/password used to buy the hosting.
- Click **"Hosting"** or **"My Services"** in the left menu.
- Look for the line that mentions **"VPS"** or **"Dedicated"**. The plan name will be next to it (e.g. "Snappy 2000", "Snappy 4000", "Snappy 8000").
- If he only sees "Hatchling", "Baby", or "Business Plan" — that's **shared hosting, not VPS**, and we cannot deploy E-Kost on it. He'll need to upgrade.
- Screenshot of that page is the easiest way to send it.

#### 2. OS image

- From the same **portal.hostgator.com** dashboard, click into the VPS service.
- Look for a section called **"Server Information"**, **"Server Details"**, or **"Manage"**.
- It will list the OS — usually one of: **AlmaLinux 8/9**, **CentOS 7**, **Ubuntu 20.04/22.04**.
- If he can't find it, he can open a HostGator support ticket and ask: *"What operating system is installed on my VPS?"* — they'll answer within a day.

#### 3. Root SSH access + domain

**SSH access:**

- When he bought the VPS, HostGator sent a **welcome email** with the server IP, root username, and root password (or a link to set one).
- Ask him to forward that email — the subject usually contains "VPS" and "Welcome" or "Server Information".
- If he lost it: in the HostGator portal under the VPS service, there's usually a **"Reset root password"** button. He clicks it, sets a new password, and shares the IP + new password with us.
- If he isn't sure what SSH is, tell him: *"I just need the server's IP address and the root password — I'll handle the rest."*

**Domain:**

- He needs a domain name (like `kost.hisbusiness.com` or `myproperty.com`) that he owns.
- If he already has one through HostGator or another registrar (GoDaddy, Namecheap, Niagahoster, etc.), he just needs to tell us the domain name.
- He does **not** need to configure DNS himself — we'll do that once we have the server IP. He just needs to grant us access to the domain's DNS settings, or be willing to paste in one DNS record we send him.
- If he doesn't own a domain yet, he can buy one for ~$10/year from any registrar before we start.

---

## Open questions to resolve with the client

- Support model: one-shot setup fee, or ongoing managed service with a monthly retainer?
- Update cadence: does he get every new E-Kost release, or only tagged stable versions on his approval?
- Data export: does he get a way to export his own DB dumps, or is that part of our service?
- SLA expectations: response time when his site is down, backup retention window, etc.

---

## Next step

Once the client provides the three items above, write the concrete deployment runbook here:

- `setup-runbook.md` — exact commands, systemd unit, Nginx config, backup cron
- `handover.md` — what to give the client at the end (admin credentials, how to contact us, backup recovery procedure)
