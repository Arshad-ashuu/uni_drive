# Use slim Python image
FROM python:3.11-slim

# Prevent Python stdout buffering
ENV PYTHONUNBUFFERED=1

# Set working directory inside container
WORKDIR /app

# Copy and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY . .

# Expose Flask port
EXPOSE 5000

# Start Flask app
CMD ["python", "app.py"]
