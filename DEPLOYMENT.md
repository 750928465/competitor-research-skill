# Deployment Guide

This guide covers deploying the Competitor Research Skill application to various platforms.

## Vercel (Recommended)

Vercel is the easiest way to deploy Next.js applications.

### Steps

1. Push your code to GitHub
2. Visit [vercel.com](https://vercel.com) and sign in
3. Click "New Project"
4. Import your GitHub repository
5. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

6. Add environment variables:
   - `TAVILY_API_KEY`
   - `LLM_API_KEY` (optional)
   - `LLM_BASE_URL` (optional)
   - `LLM_MODEL` (optional)

7. Click "Deploy"

### Custom Domain

After deployment, you can add a custom domain in the Vercel dashboard under "Settings" → "Domains".

## Netlify

### Steps

1. Push your code to GitHub
2. Visit [netlify.com](https://netlify.com) and sign in
3. Click "Add new site" → "Import an existing project"
4. Connect to your GitHub repository
5. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/.next`

6. Add environment variables in "Site settings" → "Environment variables"

7. Click "Deploy site"

## Docker

### Build Docker Image

```bash
cd frontend

# Build the image
docker build -t competitor-research-skill .

# Run the container
docker run -p 3000:3000 \
  -e TAVILY_API_KEY=your_key \
  -e LLM_API_KEY=your_key \
  competitor-research-skill
```

### Docker Compose

Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - TAVILY_API_KEY=${TAVILY_API_KEY}
      - LLM_API_KEY=${LLM_API_KEY}
      - LLM_BASE_URL=${LLM_BASE_URL}
      - LLM_MODEL=${LLM_MODEL}
    restart: unless-stopped
```

Run with:
```bash
docker-compose up -d
```

## Self-Hosted (VPS)

### Prerequisites

- Ubuntu 20.04+ or similar Linux distribution
- Node.js 18+
- Nginx (optional, for reverse proxy)
- PM2 (for process management)

### Steps

1. Clone the repository:
```bash
git clone https://github.com/yourusername/competitor-research-skill.git
cd competitor-research-skill/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local`:
```bash
cp .env.example .env.local
# Edit .env.local with your API keys
```

4. Build the application:
```bash
npm run build
```

5. Install PM2:
```bash
npm install -g pm2
```

6. Start the application:
```bash
pm2 start npm --name "competitor-research" -- start
pm2 save
pm2 startup
```

### Nginx Configuration (Optional)

Create `/etc/nginx/sites-available/competitor-research`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/competitor-research /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Environment Variables

All deployment platforms require these environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `TAVILY_API_KEY` | Yes | Tavily Search API key |
| `LLM_API_KEY` | No | LLM API key (for enhanced content) |
| `LLM_BASE_URL` | No | LLM API base URL (default: OpenAI) |
| `LLM_MODEL` | No | LLM model name (default: gpt-4o-mini) |

## Monitoring

### Vercel

Vercel provides built-in analytics and monitoring in the dashboard.

### Self-Hosted

Use PM2 for monitoring:

```bash
# View logs
pm2 logs competitor-research

# Monitor resources
pm2 monit

# View status
pm2 status
```

## Troubleshooting

### Build Fails

- Ensure Node.js version is 18+
- Check that all dependencies are installed
- Verify environment variables are set correctly

### API Errors

- Verify API keys are valid
- Check API rate limits
- Review application logs

### Performance Issues

- Enable caching in your reverse proxy
- Consider using a CDN for static assets
- Monitor API response times

## Security Considerations

- Never commit `.env.local` or API keys to version control
- Use HTTPS in production
- Regularly update dependencies
- Monitor for security vulnerabilities
- Implement rate limiting if needed

## Backup

Regularly backup:
- Environment variables
- Configuration files
- User data (if applicable)

---

For more help, please open an issue on GitHub.
