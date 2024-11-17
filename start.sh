#!/bin/bash
poetry config --local installer.no-binary ":all:"
poetry install
poetry run python run.py
