#!/bin/sh
# Run migrations before starting the server
echo "Running migrations..."
# In standalone mode, we might need a different way to run migrate or bundled tsx is not there.
# But we can also use a simple native node script that doesn't need tsx if we build it.
# For now, let's assume we can run a simple node migration script.
node migrate.js

echo "Starting server..."
node server.js
