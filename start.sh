#!/bin/bash
poetry install
poetry run flask run --host=0.0.0.0
