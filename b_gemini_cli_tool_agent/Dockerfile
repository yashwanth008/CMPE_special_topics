FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends curl git ca-certificates \
 && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
 && apt-get install -y nodejs && rm -rf /var/lib/apt/lists/* \
 && npm install -g @google/gemini-cli
RUN useradd -m app
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY gemini_cli_agent ./gemini_cli_agent
USER app
ENV PORT=8080 GEMINI_WORKSPACE=/tmp/gemini-workspaces
CMD ["sh", "-c", "adk web --host 0.0.0.0 --port ${PORT} ."]
