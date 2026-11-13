FROM python:3.12-slim
RUN useradd -m app
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY ecommerce_agent ./ecommerce_agent
USER app
ENV PORT=8080 STORE_DB=/tmp/store.db PYTHONPATH=/app
CMD ["sh", "-c", "uvicorn --factory ecommerce_agent.app:get_app --host 0.0.0.0 --port ${PORT}"]
