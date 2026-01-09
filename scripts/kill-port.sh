#!/bin/bash
PORT=${1:-3001}
lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
