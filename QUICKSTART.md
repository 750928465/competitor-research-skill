# Quick Start Guide

Get up and running with Competitor Research Skill in 5 minutes!

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- A Tavily API key ([Get one free](https://tavily.com))

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/competitor-research-skill.git
cd competitor-research-skill
```

### 2. Install Dependencies

```bash
cd frontend
npm install
```

### 3. Configure API Keys

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local and add your API keys
# Required: TAVILY_API_KEY
# Optional: LLM_API_KEY, LLM_BASE_URL, LLM_MODEL
```

Example `.env.local`:
```env
TAVILY_API_KEY=tvly-xxxxxxxxxxxxx
LLM_API_KEY=sk-xxxxxxxxxxxxx
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
```

### 4. Start the Development Server

```bash
npm run dev
```

### 5. Open Your Browser

Navigate to [http://localhost:3000](http://localhost:3000)

## First Analysis

Try these example queries:

1. **Market Analysis**: "AI email assistant market"
2. **Product Research**: "Superhuman email client"
3. **Competitive Comparison**: "Superhuman vs Front vs Missive"

## What's Next?

- Read the full [README](README.md) for detailed documentation
- Check out [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- See [CONTRIBUTING.md](CONTRIBUTING.md) to contribute

## Troubleshooting

### Build Errors

If you encounter build errors:
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run dev
```

### API Key Issues

- Verify your Tavily API key is valid
- Check that `.env.local` is in the `frontend` directory
- Restart the dev server after changing environment variables

### Port Already in Use

If port 3000 is already in use:
```bash
# Use a different port
PORT=3001 npm run dev
```

## Need Help?

- Open an issue on GitHub
- Check existing issues for solutions
- Read the documentation

Happy researching! 🚀
