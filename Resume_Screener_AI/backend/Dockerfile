FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PORT=7860

WORKDIR /app

# Install minimal build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

WORKDIR /app

# Expose the Hugging Face Spaces port
EXPOSE 7860

# Start the FastAPI app. Uses default port 7860 unless overridden via $PORT.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-7860}"]
