#!/usr/bin/env bash

# Fail if anything in here fails
set -e

# This script runs from the project root
cd "$(dirname "$0")/.."

source scripts/helpers.sh

###################################################################################################
# Setup: Node should already have been set up in the environment init

run_command "./scripts/check-environment.sh"
run_command "yarn install --frozen-lockfile"

###################################################################################################
# All functionality is available via package.json scripts

run_command "yarn clean"
run_command "yarn all:readonly"
run_command "yarn packages:build"
