# Digital Ocean Deployment Guide

## Prerequisites
- Digital Ocean account
- Domain name (optional but recommended)
- Google Sheets credentials JSON file
- Docker installed (for Docker deployment)

## Deployment Options

### Option 1: Docker Deployment (Recommended - Easiest)

#### Local Testing
1. **Prepare environment files**
   ```bash
   # Create .env file with your settings
   cp .env.example .env
   nano .env
   ```

2. **Ensure credentials.json is in project root**

3. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Open browser: http://localhost:8080

5. **View logs**
   ```bash
   docker-compose logs -f
   ```

6. **Stop the application**
   ```bash
   docker-compose down
   ```

#### Deploy to Digital Ocean with Docker

**Method A: Digital Ocean Droplet with Docker**

1. **Create Droplet**
   - Choose Ubuntu 22.04 LTS
   - Select plan ($6/month or higher)
   - Add SSH key

2. **SSH into Droplet**
   ```bash
   ssh root@YOUR_DROPLET_IP
   ```

3. **Install Docker and Docker Compose**
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   # Install Docker Compose
   apt-get update
   apt-get install -y docker-compose-plugin
   ```

4. **Create application directory**
   ```bash
   mkdir -p /opt/wedding-app
   cd /opt/wedding-app
   ```

5. **Upload your files**
   ```bash
   # From your local machine:
   scp -r ./* root@YOUR_DROPLET_IP:/opt/wedding-app/
   
   # OR use Git:
   # git clone YOUR_REPO_URL /opt/wedding-app
   ```

6. **Create .env file on server**
   ```bash
   nano /opt/wedding-app/.env
   ```
   Add:
   ```
   SECRET_KEY=your-super-secret-production-key
   GOOGLE_SHEET_URL=https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit
   SQLALCHEMY_DATABASE_URI=sqlite:///instance/wedding.db
   SQLALCHEMY_TRACK_MODIFICATIONS=False
   ```

7. **Upload credentials.json**
   ```bash
   # From local machine:
   scp credentials.json root@YOUR_DROPLET_IP:/opt/wedding-app/
   ```

8. **Build and run**
   ```bash
   cd /opt/wedding-app
   docker compose up -d --build
   ```

9. **Set up Nginx reverse proxy**
   ```bash
   apt-get install -y nginx
   nano /etc/nginx/sites-available/wedding
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
   
   ```bash
   ln -s /etc/nginx/sites-available/wedding /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   ```

10. **Set up firewall**
    ```bash
    ufw allow 'Nginx Full'
    ufw allow OpenSSH
    ufw enable
    ```

11. **SSL Certificate (recommended)**
    ```bash
    apt-get install -y certbot python3-certbot-nginx
    certbot --nginx -d your-domain.com
    ```

12. **Set up auto-restart**
    ```bash
    # Docker containers will auto-restart on reboot
    systemctl enable docker
    ```

**Method B: Digital Ocean App Platform with Docker**

1. **Create Dockerfile in your project** (already done)

2. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add Docker support"
   git push
   ```

3. **Create App on Digital Ocean**
   - Go to App Platform
   - Select "Deploy from Dockerfile"
   - Connect GitHub repository
   - Digital Ocean will auto-detect Dockerfile

4. **Configure**
   - Port: 8080
   - Add environment variables in App Platform settings
   - Upload credentials.json as a secret file

5. **Deploy**
   - Click deploy and wait

**Docker Commands Reference**

```bash
# Build image
docker build -t wedding-app .

# Run container
docker run -d -p 8080:8080 --env-file .env wedding-app

# View logs
docker logs -f CONTAINER_ID
docker-compose logs -f

# Stop container
docker stop CONTAINER_ID
docker-compose down

# Restart
docker restart CONTAINER_ID
docker-compose restart

# Remove and rebuild
docker-compose down
docker-compose up -d --build

# Access container shell
docker exec -it CONTAINER_ID /bin/bash

# View running containers
docker ps
```

### Option 2: Digital Ocean App Platform (No Docker)

### Option 1: Digital Ocean App Platform (Recommended for beginners)

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

### Option 2: Digital Ocean Droplet (More control)

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

### View Logs (App Platform)
- Go to your app in Digital Ocean dashboard
- Click "Runtime Logs"

### View Logs (Droplet)
```bash
sudo journalctl -u wedding -f
```

### Restart Application (Droplet)
```bash
sudo systemctl restart wedding
```

### Check Application Status
```bash
sudo systemctl status wedding
```

## Database Backup

### Docker Deployment
```bash
# Backup (container running)
docker cp CONTAINER_ID:/app/instance/wedding.db ./backups/wedding-$(date +%Y%m%d).db

# Or if using docker-compose
cp ./instance/wedding.db ./backups/wedding-$(date +%Y%m%d).db

# Restore
cp ./backups/wedding-YYYYMMDD.db ./instance/wedding.db
docker-compose restart
```

### Droplet Deployment (without Docker)
```bash
# Backup
cp ~/wedding-app/instance/wedding.db ~/wedding-app/backups/wedding-$(date +%Y%m%d).db

# Restore
cp ~/wedding-app/backups/wedding-YYYYMMDD.db ~/wedding-app/instance/wedding.db
sudo systemctl restart wedding
```

## Security Notes

1. **Never commit** `.env` or `credentials.json` to Git
2. Change `SECRET_KEY` to a strong random value
3. Use SSL certificate for production
4. Regularly backup your database
5. Keep dependencies updated: `pip install --upgrade -r requirements.txt`
