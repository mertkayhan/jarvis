FROM python:3.12.10-slim AS builder
WORKDIR /app
COPY poetry.lock pyproject.toml ./ 
RUN pip3 install poetry==1.8.3 && poetry export -f requirements.txt -o requirements.txt --without-hashes

FROM python:3.12.10-slim AS final
WORKDIR /app
COPY --from=builder /app/requirements.txt .
RUN apt-get update && \
    apt-get install -y git g++ && \ 
    pip install -r requirements.txt 
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH="${PYTHONPATH}:/app/jarvis"
ENV NUMBA_CACHE_DIR="/tmp/numba"
ENV MPLCONFIGDIR="/tmp/matplotlib"
ENV XDG_CACHE_HOME="/tmp/xdg_cache"
ENV NLTK_DATA="/tmp"
COPY jarvis jarvis
CMD [ "python3", "jarvis/app.py" ]