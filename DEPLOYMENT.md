# Wedding Invitation App - Deployment Guide

## Prerequisites
- Digital Ocean account
- Domain name (optional but recommended)
- Google Sheets credentials JSON file (`credentials.json`)
- Docker and Docker Compose installed (for Docker deployment)

## Deployment Options

### Option 1: Docker Deployment (Recommended)

This setup uses Docker Compose with:
- Python Flask app (gunicorn)
- Nginx reverse proxy
- SQLite database in persistent volume

#### Local Testing

1. **Prepare environment files**
   ```bash
   # Create .env file with your settings
   nano .env
   ```
   Add:
   ```
   SECRET_KEY=your-secret-key-here
   GOOGLE_SHEET_URL=https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit
   ```

2. **Ensure credentials.json is in project root**
   - Download from Google Cloud Console
   - Place in project root directory

3. **Build and run with Docker Compose**
   ```bash
   docker compose up --build -d
   ```

4. **Access the application**
   - Open browser: http://localhost (port 80)
   - Nginx proxies to the Flask app running on port 8080

5. **View logs**
   ```bash
   # All services
   docker compose logs -f
   
   # Web service only
   docker compose logs -f web
   
   # Nginx only
   docker compose logs -f nginx
   ```

6. **Stop the application**
   ```bash
   docker compose down
   ```

7. **Rebuild after code changes**
   ```bash
   docker compose down
   docker compose up --build -d
   ```

#### Deploy to Digital Ocean Droplet with Docker

1. **Create Droplet**
   - Choose Ubuntu 22.04 LTS
   - Select plan ($6/month or higher recommended)
   - Add your SSH key
   - Enable IPv4

2. **SSH into Droplet**
   ```bash
   ssh root@YOUR_DROPLET_IP
   ```

3. **Install Docker and Docker Compose**
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   # Verify installation
   docker --version
   docker compose version
   ```

4. **Create application directory**
   ```bash
   mkdir -p /opt/wedding-app
   cd /opt/wedding-app
   ```

5. **Transfer your files**
   
   Option A - Using Git (recommended):
   ```bash
   git clone YOUR_GITHUB_REPO_URL .
   ```
   
   Option B - Using SCP from local machine:
   ```bash
   # From your local machine in project directory:
   rsync -avz --exclude 'instance' --exclude '__pycache__' --exclude '.git' \
     ./ root@YOUR_DROPLET_IP:/opt/wedding-app/
   ```

6. **Upload credentials.json**
   ```bash
   # From your local machine:
   scp credentials.json root@YOUR_DROPLET_IP:/opt/wedding-app/
   ```

7. **Create .env file on server**
   ```bash
   nano /opt/wedding-app/.env
   ```
   Add:
   ```env
   SECRET_KEY=generate-a-strong-random-secret-key-here
   GOOGLE_SHEET_URL=https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit
   ```

8. **Create instance directory**
   ```bash
   mkdir -p /opt/wedding-app/instance
   chmod 755 /opt/wedding-app/instance
   ```

9. **Build and run**
   ```bash
   cd /opt/wedding-app
   docker compose up --build -d
   ```

10. **Verify services are running**
    ```bash
    docker compose ps
    docker compose logs web
    docker compose logs nginx
    ```

11. **Configure firewall**
    ```bash
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow OpenSSH
    ufw enable
    ufw status
    ```

12. **SSL Certificate with Let's Encrypt (recommended)**
    
    First, update nginx configuration for your domain:
    ```bash
    nano /opt/wedding-app/nginx/nginx.conf
    ```
    Change `server_name` to your domain:
    ```nginx
    server {
        listen 80;
        server_name your-domain.com www.your-domain.com;
        # ... rest of config
    }
    ```
    
    Reload nginx:
    ```bash
    docker compose restart nginx
    ```
    
    Install certbot:
    ```bash
    apt-get update
    apt-get install -y certbot
    ```
    
    Get certificate (standalone mode):
    ```bash
    # Stop nginx temporarily
    docker compose stop nginx
    
    # Get certificate
    certbot certonly --standalone -d your-domain.com -d www.your-domain.com
    
    # Start nginx
    docker compose start nginx
    ```
    
    Update nginx config for SSL:
    ```bash
    nano /opt/wedding-app/nginx/nginx.conf
    ```
    Replace contents with:
    ```nginx
    server {
        listen 80;
        server_name your-domain.com www.your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl;
        server_name your-domain.com www.your-domain.com;

        ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

        location / {
            proxy_pass http://web:8080;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    ```
    
    Update docker-compose.yml to mount certificates:
    ```bash
    nano /opt/wedding-app/docker-compose.yml
    ```
    Add under nginx volumes:
    ```yaml
      nginx:
        volumes:
          - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
          - /etc/letsencrypt:/etc/letsencrypt:ro  # Add this line
    ```
    
    Restart:
    ```bash
    docker compose up -d
    ```

13. **Set up auto-restart on reboot**
    ```bash
    systemctl enable docker
    ```

14. **Auto-renew SSL certificates**
    ```bash
    # Add cron job for renewal
    crontab -e
    ```
    Add this line:
    ```
    0 0 * * 0 certbot renew --quiet && docker compose -f /opt/wedding-app/docker-compose.yml restart nginx
    ```



#### Docker Commands Reference

```bash
# View all containers
docker compose ps

# View logs
docker compose logs -f          # All services
docker compose logs -f web      # Web service only
docker compose logs -f nginx    # Nginx only

# Restart services
docker compose restart          # All services
docker compose restart web      # Web only
docker compose restart nginx    # Nginx only

# Stop all services
docker compose down

# Start services
docker compose up -d

# Rebuild and restart
docker compose down
docker compose up --build -d

# Access container shell
docker compose exec web /bin/bash
docker compose exec nginx /bin/sh

# View container stats
docker stats

# Remove all containers and volumes (WARNING: deletes database)
docker compose down -v
```

### Option 2: Digital Ocean App Platform (Managed, No Docker Required)

1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Create App on Digital Ocean**
   - Go to [Digital Ocean App Platform](https://cloud.digitalocean.com/apps)
   - Click "Create App"
   - Connect your GitHub repository
   - Select your repository and branch

3. **Configure App Settings**
   - **Name**: wedding-invitation
   - **Region**: Choose closest to your users
   - **Plan**: Basic ($5/month)
   - **Build Command**: `pip install -r requirements.txt`
   - **Run Command**: `gunicorn --config gunicorn_config.py app:app`
   - **Port**: 8080

4. **Add Environment Variables**
   Go to Settings → Environment Variables and add:
   ```
   SQLALCHEMY_DATABASE_URI=sqlite:///instance/wedding.db
   SQLALCHEMY_TRACK_MODIFICATIONS=False
   SECRET_KEY=your-super-secret-key-change-this
   GOOGLE_SHEET_URL=https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit
   GOOGLE_CREDENTIALS_FILE=/app/credentials.json
   ```

5. **Upload credentials.json**
   - Go to Settings → Environment Variables
   - Add a secret file named `credentials.json`
   - Paste your Google credentials JSON content

6. **Deploy**
   - Click "Next" and "Create Resources"
   - Wait for deployment to complete

### Option 3: Digital Ocean Droplet (Manual Setup, No Docker)

1. **Create a Droplet**
   - Choose Ubuntu 22.04 LTS
   - Select plan ($6/month Basic)
   - Choose datacenter region
   - Add SSH key

2. **SSH into Droplet**
   ```bash
   ssh root@YOUR_DROPLET_IP
   ```

3. **Install Dependencies**
   ```bash
   apt update
   apt install -y python3 python3-pip python3-venv nginx
   ```

4. **Create Application User**
   ```bash
   adduser wedding
   usermod -aG sudo wedding
   su - wedding
   ```

5. **Clone Your Repository**
   ```bash
   git clone YOUR_GITHUB_REPO_URL wedding-app
   cd wedding-app
   ```

6. **Set Up Python Environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

7. **Create .env File**
   ```bash
   nano .env
   ```
   Add your environment variables:
   ```
   SQLALCHEMY_DATABASE_URI=sqlite:///instance/wedding.db
   SQLALCHEMY_TRACK_MODIFICATIONS=False
   SECRET_KEY=your-super-secret-key
   GOOGLE_SHEET_URL=https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit
   GOOGLE_CREDENTIALS_FILE=credentials.json
   ```

8. **Upload credentials.json**
   - Use SCP to upload:
   ```bash
   scp credentials.json wedding@YOUR_DROPLET_IP:~/wedding-app/
   ```

9. **Create Systemd Service**
   ```bash
   sudo nano /etc/systemd/system/wedding.service
   ```
   Add:
   ```ini
   [Unit]
   Description=Wedding Invitation App
   After=network.target

   [Service]
   User=wedding
   WorkingDirectory=/home/wedding/wedding-app
   Environment="PATH=/home/wedding/wedding-app/venv/bin"
   ExecStart=/home/wedding/wedding-app/venv/bin/gunicorn --config gunicorn_config.py app:app
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

10. **Start Service**
    ```bash
    sudo systemctl daemon-reload
    sudo systemctl start wedding
    sudo systemctl enable wedding
    sudo systemctl status wedding
    ```

11. **Configure Nginx**
    ```bash
    sudo nano /etc/nginx/sites-available/wedding
    ```
    Add:
    ```nginx
    server {
        listen 80;
        server_name YOUR_DOMAIN_OR_IP;

        location / {
            proxy_pass http://127.0.0.1:8080;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    ```

12. **Enable Nginx Site**
    ```bash
    sudo ln -s /etc/nginx/sites-available/wedding /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```

13. **Set Up Firewall**
    ```bash
    sudo ufw allow 'Nginx Full'
    sudo ufw allow OpenSSH
    sudo ufw enable
    ```

14. **SSL Certificate (Optional but recommended)**
    ```bash
    sudo apt install -y certbot python3-certbot-nginx
    sudo certbot --nginx -d your-domain.com
    ```

## Post-Deployment

### Load Guest List
Visit: `http://YOUR_DOMAIN/api/load-from-sheet`

### Test Endpoints
- Main page: `http://YOUR_DOMAIN/`
- RSVP: `http://YOUR_DOMAIN/GUEST_ID/rsvp`
- Sync to sheets: `http://YOUR_DOMAIN/api/sync-to-sheet`

## Troubleshooting

### Docker Deployment Issues

#### Container Won't Start
```bash
# Check container status
docker compose ps

# Check logs
docker compose logs web
docker compose logs nginx

# Check if port is already in use
sudo lsof -i :80
sudo lsof -i :8080

# Restart services
docker compose restart
```

#### Database Permission Errors
```bash
# Fix instance directory permissions
chmod 755 ./instance
chmod 644 ./instance/wedding.db

# Restart
docker compose restart web
```

#### Nginx 502 Bad Gateway
```bash
# Check if web service is running
docker compose ps web

# Check web service logs
docker compose logs web

# Verify web service is listening on port 8080
docker compose exec web netstat -tlnp | grep 8080

# Check nginx can reach web service
docker compose exec nginx ping web
```

#### Worker Timeout Errors
Check `gunicorn_config.py`:
```python
timeout = 120  # Increase if needed
workers = 2    # Adjust based on resources
```

Then rebuild:
```bash
docker compose up --build -d
```

### Manual Deployment Issues

#### View Logs
```bash
sudo journalctl -u wedding -f
```

#### Restart Application
```bash
sudo systemctl restart wedding
```

#### Check Application Status
```bash
sudo systemctl status wedding
```

#### Port Already in Use
```bash
sudo lsof -i :8080
sudo kill -9 PID
```

### General Issues

#### Cannot Connect to Database
```bash
# Ensure instance directory exists
mkdir -p instance
chmod 755 instance

# Check database file permissions
ls -la instance/
```

#### Google Sheets Sync Fails
```bash
# Verify credentials.json exists
ls -la credentials.json

# Check environment variable
echo $GOOGLE_SHEET_URL

# Test manually
curl http://localhost/api/load-from-sheet
```

## Maintenance

### Database Backup

#### Docker Deployment
```bash
# Create backup directory
mkdir -p backups

# Backup database (from host machine)
cp ./instance/wedding.db ./backups/wedding-$(date +%Y%m%d).db

# Or backup from server
scp root@YOUR_DROPLET_IP:/opt/wedding-app/instance/wedding.db \
    ./backups/wedding-$(date +%Y%m%d).db

# Restore database
cp ./backups/wedding-YYYYMMDD.db ./instance/wedding.db
docker compose restart web
```

#### Manual Deployment (No Docker)
```bash
# Backup
mkdir -p ~/wedding-app/backups
cp ~/wedding-app/instance/wedding.db ~/wedding-app/backups/wedding-$(date +%Y%m%d).db

# Restore
cp ~/wedding-app/backups/wedding-YYYYMMDD.db ~/wedding-app/instance/wedding.db
sudo systemctl restart wedding
```

### Update Application Code

#### Docker Deployment
```bash
# On server
cd /opt/wedding-app
git pull origin main
docker compose up --build -d
```

#### Manual Deployment
```bash
cd ~/wedding-app
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart wedding
```

## Security Notes

1. **Never commit** `.env` or `credentials.json` to Git
2. Change `SECRET_KEY` to a strong random value
3. Use SSL certificate for production
4. Regularly backup your database
5. Keep dependencies updated: `pip install --upgrade -r requirements.txt`
