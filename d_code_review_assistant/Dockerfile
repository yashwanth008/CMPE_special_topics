FROM python:3.12-slim
RUN useradd -m app
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY code_review_assistant ./code_review_assistant
USER app
ENV PORT=8080 PYTHONPATH=/app
CMD ["sh", "-c", "adk api_server --host 0.0.0.0 --port ${PORT} ."]
