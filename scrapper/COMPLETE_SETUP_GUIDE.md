# Complete Zillow Scraper Setup Guide - EC2 Instance

**Last Updated:** October 31, 2025

**Status:** ✅ Desktop Setup Complete | ⚠️ Residential Proxy Required for Zillow

---

## Table of Contents

1. [Overview](#overview)
2. [AWS EC2 Instance Configuration](#aws-ec2-instance-configuration)
3. [Security Group Setup](#security-group-setup)
4. [EC2 Instance Setup (Step-by-Step)](#ec2-instance-setup-step-by-step)
5. [VNC Desktop Setup](#vnc-desktop-setup)
6. [Running the Scraper](#running-the-scraper)
7. [How It Works](#how-it-works)
8. [Troubleshooting](#troubleshooting)
9. [Residential Proxy Setup (Required for Zillow)](#residential-proxy-setup-required-for-zillow)

---

## Overview

This scraper runs on an **AWS EC2 instance** with a **visible Chrome browser** via **VNC desktop** to scrape Zillow property data.

### Current Setup Summary

- **Instance Type:** `t3.small` (2 vCPU, 2 GB RAM)
- **AMI:** Amazon Linux 2023
- **Public IP:** `34.234.85.49` (may change if instance stopped/started)
- **Private IP:** `172.31.17.54`
- **Key Pair:** `zillow-scraper-key` (`.pem` file)
- **Security Group:** `zillow-scraper-sg` (sg-02e825d1411858066)
- **VPC:** `vpc-09d6f8ddfc86fe543` (default VPC)
- **Status:** ✅ VNC Desktop Working | ⚠️ Zillow blocks EC2 IP (need residential proxy)

### What Works

✅ EC2 instance running  
✅ VNC desktop accessible  
✅ Chrome opens in VNC  
✅ Browser fingerprint configured  
✅ Scraper code ready  

### What Doesn't Work (Known Issue)

⚠️ **Zillow blocks EC2 datacenter IPs**  
- HTTP 403 Forbidden
- `x-px-blocked: 1` (PerimeterX blocking)
- **Solution:** Use residential proxy

---

## AWS EC2 Instance Configuration

### Instance Details

| Property | Value |
|----------|-------|
| **Instance Type** | `t3.small` |
| **vCPU** | 2 |
| **Memory** | 2 GiB RAM |
| **Storage** | 8 GiB gp3 (recommend 20-30 GiB for full setup) |
| **AMI** | Amazon Linux 2023 |
| **Architecture** | x86_64 |
| **Region** | us-east-1 |

### Key Pair

- **Name:** `zillow-scraper-key`
- **Type:** RSA
- **Format:** `.pem`
- **Location:** `~/zillow-scraper-key.pem` (local) or `~/zillow-scraper-key.pem` (WSL)

### Network Configuration

- **VPC:** `vpc-09d6f8ddfc86fe543` (default VPC)
- **Subnet:** Default subnet in availability zone
- **Auto-assign Public IP:** ✅ Enabled
- **Elastic IP:** ❌ Not configured (IP changes on restart)

### Instance IP Addresses

**Current (may change if instance stopped/started):**
- **Public IPv4:** `34.234.85.49`
- **Private IPv4:** `172.31.17.54`
- **Hostname:** `ip-172-31-17-54.ec2.internal`

**Note:** If instance is stopped and started, check AWS Console for new Public IP.

---

## Security Group Setup

### Security Group Details

- **Name:** `zillow-scraper-sg`
- **ID:** `sg-02e825d1411858066`
- **VPC:** `vpc-09d6f8ddfc86fe543`
- **Description:** Security group for Zillow scraper EC2 instance

### Inbound Rules

| Type | Protocol | Port Range | Source | Description |
|------|----------|------------|--------|-------------|
| SSH | TCP | 22 | `0.0.0.0/0` | SSH access (consider restricting to your IP) |
| Custom TCP | TCP | 5901 | `0.0.0.0/0` | VNC access (consider restricting to your IP) |

**Security Recommendation:**  
- Change source from `0.0.0.0/0` to your specific IP for better security
- Find your IP: Visit https://whatismyipaddress.com/

### Outbound Rules

- **Default:** All traffic allowed to all destinations

---

## EC2 Instance Setup (Step-by-Step)

### Prerequisites

1. **AWS Account** with EC2 access
2. **SSH Client** (Windows: WSL/SSH, Mac/Linux: built-in)
3. **VNC Client** (RealVNC Viewer, TightVNC, or similar)
4. **Key Pair File** (`zillow-scraper-key.pem`)

### Step 1: Connect to EC2 Instance

**From your local machine (WSL or Terminal):**

```bash
# Make sure key has correct permissions (WSL)
chmod 400 ~/zillow-scraper-key.pem

# Connect to EC2
ssh -i ~/zillow-scraper-key.pem ec2-user@34.234.85.49

# Note: If IP changed, check AWS Console → EC2 → Instances → Your instance → Public IPv4 address
```

### Step 2: Update System

```bash
# Update system packages
sudo dnf update -y
```

### Step 3: Install X11 and Desktop Components

```bash
# Install X11 server and utilities
sudo dnf install -y xorg-x11-server-Xorg xorg-x11-xinit xorg-x11-apps

# Install terminal (xterm)
sudo dnf install -y xterm

# Install VNC server
sudo dnf install -y tigervnc-server

# Install Firefox (optional, for testing)
sudo dnf install -y firefox
```

### Step 4: Install Google Chrome

```bash
# Download Chrome
cd /tmp
wget https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm

# Install Chrome
sudo yum localinstall -y google-chrome-stable_current_x86_64.rpm

# Verify installation
google-chrome --version
```

### Step 5: Install Python Dependencies

```bash
# Install Python and pip
sudo dnf install -y python3 python3-pip

# Install required packages
pip3 install selenium webdriver-manager --user

# Or create requirements.txt and install
cat > ~/requirements.txt << EOF
selenium==4.15.0
webdriver-manager==4.0.2
EOF

pip3 install -r ~/requirements.txt --user
```

### Step 6: Configure VNC Server

```bash
# Create VNC startup script
mkdir -p ~/.vnc
cat > ~/.vnc/xstartup << 'EOF'
#!/bin/bash
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
[ -x /etc/vnc/xstartup ] && exec /etc/vnc/xstartup
[ -r $HOME/.Xresources ] && xrdb $HOME/.Xresources
vncconfig -iconic &

# Start xterm directly (no window manager needed)
xterm -geometry 80x24+10+10 -title "EC2 Desktop" &
EOF

chmod +x ~/.vnc/xstartup

# Set VNC password (you'll be prompted - 8 characters minimum)
vncserver :1

# Stop it to configure properly
vncserver -kill :1

# Set up display environment
echo 'export DISPLAY=:1' >> ~/.bashrc
export DISPLAY=:1

# Create helper scripts
cat > ~/start_vnc.sh << 'EOF'
#!/bin/bash
vncserver :1 -geometry 1920x1080 -depth 24
echo "VNC started on display :1"
EOF

chmod +x ~/start_vnc.sh

cat > ~/start_scraper_desktop.sh << 'EOF'
#!/bin/bash
if ! pgrep -x "Xvnc" > /dev/null; then
    echo "Starting VNC..."
    vncserver :1 -geometry 1920x1080 -depth 24
    sleep 2
fi
export DISPLAY=:1
python3 ec2_scraper.py
EOF

chmod +x ~/start_scraper_desktop.sh
```

### Step 7: Start VNC Server

```bash
# Start VNC
~/start_vnc.sh

# Or manually:
vncserver :1 -geometry 1920x1080 -depth 24

# Verify it's running
ps aux | grep vnc
```

### Step 8: Upload Scraper Code

**Option A: Using SCP (from local machine)**

```bash
# From your local machine (WSL)
scp -i ~/zillow-scraper-key.pem ec2_scraper.py ec2-user@34.234.85.49:~/
scp -i ~/zillow-scraper-key.pem requirements.txt ec2-user@34.234.85.49:~/ 2>/dev/null || echo "requirements.txt not found, skipping"
```

**Option B: Create file directly on EC2**

```bash
# On EC2, use nano to create the file
nano ~/ec2_scraper.py
# Paste the code, then Ctrl+O to save, Enter, Ctrl+X to exit
```

---

## VNC Desktop Setup

### Connect via VNC

**Option A: SSH Tunnel (Recommended - More Secure)**

```bash
# On your local machine (keep this terminal open)
ssh -i ~/zillow-scraper-key.pem -L 5901:localhost:5901 ec2-user@34.234.85.49

# Then connect VNC client to: localhost:5901
```

**Option B: Direct Connection**

Connect VNC client directly to: `34.234.85.49:5901`

### VNC Client Options

- **Windows:** RealVNC Viewer, TightVNC, UltraVNC
- **Mac:** Built-in Screen Sharing (Cmd+K → `vnc://34.234.85.49:5901`)
- **Linux:** Remmina, TigerVNC Viewer

### VNC Password

The password you set when running `vncserver :1` (8 characters minimum)

### What You'll See in VNC

- Grey/black screen
- Terminal window (`xterm`) open
- Basic desktop environment

---

## Running the Scraper

### Quick Start

```bash
# On EC2 (via SSH or VNC terminal)

# Make sure VNC is running
~/start_vnc.sh

# Set display environment
export DISPLAY=:1

# Run the scraper
python3 ec2_scraper.py
```

### Using Helper Script

```bash
# Runs VNC if needed, sets display, and runs scraper
~/start_scraper_desktop.sh
```

### What Happens

1. **Chrome opens in VNC desktop** (you'll see it in your VNC window)
2. **Navigates to Zillow property page**
3. **Extracts data:**
   - Address
   - Price/rent
   - Beds, baths, area
   - Property images
4. **Saves to `zillow_data.json`**

### Expected Output

```
Starting Zillow scraper with Selenium (EC2 Visible Browser)...
Using ChromeDriver from webdriver-manager: /home/ec2-user/.wdm/...
Opening browser and navigating to Zillow...
Navigating to Zillow...
Waiting for page to load...
Page title: Access to this page has been denied
⚠️ WARNING: Access denied by Zillow anti-bot protection
...
❌ BLOCKED: Zillow is blocking access
```

**This is expected** - Zillow blocks EC2 IPs. See [Residential Proxy Setup](#residential-proxy-setup-required-for-zillow).

---

## How It Works

### Architecture

```
Local Machine
    ↓ (VNC Client)
EC2 Instance (t3.small)
    ├─ VNC Server (display :1)
    ├─ X11 Server
    ├─ Chrome Browser (visible)
    └─ Python Scraper
        └─ Selenium WebDriver
            └─ Zillow.com (blocked - need proxy)
```

### Component Breakdown

1. **EC2 Instance:**
   - Provides compute resources
   - Runs Linux (Amazon Linux 2023)
   - Has public IP for access

2. **VNC Server:**
   - Creates virtual desktop (display :1)
   - Allows remote desktop access
   - Exposes Chrome browser visually

3. **X11 Server:**
   - Graphics display system
   - Allows Chrome to render
   - Required for visible browser

4. **Chrome Browser:**
   - Opens in visible mode (not headless)
   - Stealth options to avoid detection:
     - `--disable-blink-features=AutomationControlled`
     - `excludeSwitches: ["enable-automation"]`
     - JavaScript injection to hide `navigator.webdriver`
   - User agent spoofing

5. **Python Scraper:**
   - Uses Selenium to control Chrome
   - Extracts data from Zillow pages
   - Handles scrolling, clicking, waiting
   - Saves data to JSON

### Data Flow

1. **User runs:** `python3 ec2_scraper.py`
2. **Scraper:**
   - Sets `DISPLAY=:1` (points to VNC)
   - Opens Chrome with stealth options
   - Chrome renders in VNC desktop (visible)
3. **Chrome:**
   - Navigates to Zillow URL
   - Page loads (or gets blocked)
4. **Scraper:**
   - Extracts property data using CSS selectors
   - Scrolls to load images
   - Collects image URLs
5. **Saves:** Data to `zillow_data.json`

### Why Visible Browser?

- **Better fingerprint:** More realistic than headless
- **Harder to detect:** Looks like real user browsing
- **Debugging:** Can see what's happening in real-time
- **Zillow detection:** Still blocked due to IP, but browser looks legitimate

---

## Troubleshooting

### VNC Won't Start

```bash
# Check if VNC is already running
ps aux | grep vnc

# Kill existing VNC
vncserver -kill :1

# Restart VNC
vncserver :1 -geometry 1920x1080 -depth 24

# Check VNC log
tail -30 ~/.vnc/ip-172-31-17-54.ec2.internal:1.log
```

### Can't Connect via VNC

1. **Check Security Group:**
   - Ensure port 5901 is open
   - Source should be your IP or `0.0.0.0/0`

2. **Check VNC is Running:**
   ```bash
   ps aux | grep vnc
   ```

3. **Try SSH Tunnel:**
   ```bash
   ssh -i ~/zillow-scraper-key.pem -L 5901:localhost:5901 ec2-user@34.234.85.49
   ```

### Chrome Won't Open

```bash
# Check DISPLAY is set
echo $DISPLAY
# Should show: :1

# Set it if not set
export DISPLAY=:1

# Check Chrome is installed
google-chrome --version

# Check ChromeDriver
chromedriver --version
```

### Zillow Blocking (Expected)

```bash
# Test connectivity
curl -I https://www.zillow.com

# Expected output:
# HTTP/2 403
# x-px-blocked: 1
```

**Solution:** Use residential proxy (see below)

### Out of Memory

If `t3.small` (2 GB) is too slow:

1. **Upgrade instance:**
   - Stop instance
   - Change instance type to `t3.medium` (4 GB) or larger
   - Start instance
   - Check new Public IP in AWS Console

2. **Or use Xvfb instead of full desktop:**
   ```bash
   # Install Xvfb
   sudo dnf install -y xorg-x11-server-Xvfb
   
   # Use Xvfb instead of VNC
   Xvfb :99 -screen 0 1920x1080x24 &
   export DISPLAY=:99
   ```

### SSH Connection Timeout

1. **Check instance is running:**
   - AWS Console → EC2 → Instances → Check status

2. **Check Public IP:**
   - IP may have changed if instance was stopped/started
   - Get new IP from AWS Console

3. **Check Security Group:**
   - Ensure SSH (port 22) is open

---

## Residential Proxy Setup (Required for Zillow)

### Problem

Zillow blocks datacenter IPs (like EC2):
- HTTP 403 Forbidden
- `x-px-blocked: 1` (PerimeterX blocking)
- EC2 IPs are easily detected as datacenter IPs

### Solution

Use a **residential proxy** service that provides home ISP IPs instead of datacenter IPs.

### Recommended Proxy Providers

1. **Smartproxy**
   - Price: ~$14/month (10 GB) to ~$75/month (50 GB)
   - Website: https://smartproxy.com
   - Format: `http://username:password@gate.smartproxy.com:10000`

2. **IPRoyal**
   - Price: ~$7/month (2 GB) to ~$50/month (50 GB)
   - Website: https://iproyal.com
   - Format: `http://username:password@geo.iproyal.com:12321`

3. **Bright Data (formerly Luminati)**
   - Price: Pay-as-you-go or subscription
   - Website: https://brightdata.com
   - Format: `http://username:password@brd.superproxy.io:22225`

4. **Oxylabs**
   - Price: Subscription-based
   - Website: https://oxylabs.io
   - Format: `http://username:password@pr.oxylabs.io:7777`

### How to Configure Proxy

1. **Get proxy credentials from your provider**

2. **Edit `ec2_scraper.py`:**

   Find this section (around line 724-742):
   ```python
   # Option 5: No proxy (disable by commenting out proxy_list)
   proxy_url = None
   proxy_username = None
   proxy_password = None
   proxy_list = None  # Disable proxy list
   ```

   Replace with:
   ```python
   # Residential proxy configuration
   proxy_url = "http://your-username:your-password@gate.smartproxy.com:10000"
   proxy_username = None  # Already in URL
   proxy_password = None  # Already in URL
   proxy_list = None  # Disable proxy list when using single proxy
   ```

3. **Save and run:**

   ```bash
   python3 ec2_scraper.py
   ```

### Testing Proxy

```bash
# Test proxy works
curl --proxy "http://username:password@proxy.example.com:8080" https://www.zillow.com
```

If it returns HTTP 200 (not 403), proxy is working!

---

## Quick Reference Commands

### Essential Commands

```bash
# Connect to EC2
ssh -i ~/zillow-scraper-key.pem ec2-user@34.234.85.49

# Start VNC
~/start_vnc.sh
# Or: vncserver :1 -geometry 1920x1080 -depth 24

# Stop VNC
vncserver -kill :1

# Set display
export DISPLAY=:1

# Run scraper
python3 ec2_scraper.py

# Check VNC status
ps aux | grep vnc

# Check Chrome processes
ps aux | grep chrome
```

### File Locations

- **Scraper code:** `~/ec2_scraper.py`
- **VNC config:** `~/.vnc/xstartup`
- **VNC password:** `~/.vnc/passwd`
- **Output data:** `~/zillow_data.json`
- **ChromeDriver:** `~/.wdm/drivers/chromedriver/...` (auto-managed)

---

## Maintenance

### Regular Tasks

1. **Keep system updated:**
   ```bash
   sudo dnf update -y
   ```

2. **Keep Python packages updated:**
   ```bash
   pip3 install --upgrade selenium webdriver-manager --user
   ```

3. **Monitor disk space:**
   ```bash
   df -h
   ```

4. **Check instance status:**
   - AWS Console → EC2 → Instances
   - Monitor CloudWatch for CPU/memory

### Backing Up

**Important files to backup:**
- `~/ec2_scraper.py` (scraper code)
- `~/.vnc/passwd` (VNC password - encrypted)
- `~/zillow_data.json` (scraped data)

### Costs

**Current Setup (t3.small):**
- On-Demand: ~$0.0208/hour = ~$15/month if running 24/7
- Spot instances: Cheaper (but can be terminated)
- Data transfer: Additional costs may apply

**Optimization:**
- Stop instance when not in use
- Use spot instances for cost savings
- Monitor usage to optimize instance size

---

## Summary

### ✅ What's Working

- EC2 instance running
- VNC desktop accessible
- Chrome opens in visible mode
- Browser fingerprint configured
- Scraper code ready

### ⚠️ What's Needed

- **Residential proxy** to bypass Zillow IP blocking

### 📝 Next Steps

1. Choose a residential proxy provider
2. Configure proxy in `ec2_scraper.py`
3. Test scraper with proxy
4. Monitor results

---

## Support & Documentation

### AWS Resources

- **EC2 Console:** https://console.aws.amazon.com/ec2/
- **Documentation:** https://docs.aws.amazon.com/ec2/
- **Pricing Calculator:** https://calculator.aws.amazon.com/

### Key Files

- **This Guide:** `COMPLETE_SETUP_GUIDE.md`
- **Scraper Code:** `ec2_scraper.py`
- **Dependencies:** `requirements.txt`

---

**Last Updated:** October 31, 2025  
**Instance IP:** `34.234.85.49` (check AWS Console if changed)  
**Status:** ✅ Ready (residential proxy needed for Zillow)

