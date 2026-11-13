FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY bug_assistant ./bug_assistant
ENV PORT=8080 TICKETS_DB=/tmp/tickets.db PYTHONPATH=/app
CMD ["sh", "-c", "adk api_server --host 0.0.0.0 --port ${PORT} ."]
