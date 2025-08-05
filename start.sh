#!/bin/bash
poetry config --local installer.no-binary ":all:"
poetry install

if [ "$USE_SSL" = "true" ]; then
  poetry run gunicorn --bind 0.0.0.0:443 \
    --keyfile /ssl/privkey.pem \
    --certfile /ssl/fullchain.pem \
    run:app
else
  poetry run gunicorn --bind 0.0.0.0:80 \
    run:app
fi