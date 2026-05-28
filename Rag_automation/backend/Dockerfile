FROM python:3.14-slim

WORKDIR /app

# Prevent Python from writing .pyc files and enable output flushing
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install lightweight build dependencies needed for some packages
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       build-essential \
       libpq-dev \
       poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Copy project metadata first to leverage Docker layer caching
COPY pyproject.toml ./

# Upgrade packaging tools and install the project
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Copy the rest of the backend source
COPY . .

# Install the package (will install dependencies from pyproject.toml)
RUN pip install --no-cache-dir .

# Hugging Face expects the server to listen on port 7860
EXPOSE 7860

# Run the FastAPI app via uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
