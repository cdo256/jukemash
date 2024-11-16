FROM python:3.12.7
RUN apt-get update && apt-get install --no-install-suggests --no-install-recommends --yes pipx

COPY . . 
RUN pipx install poetry
ENV PATH="/root/.local/bin:${PATH}"
RUN chmod +x start.sh
ENTRYPOINT ["./start.sh"]
