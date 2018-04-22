#!/bin/sh

FILES=/app/input/contracts_flatten/*.sol

for filepath in $FILES
do
  # /app/input/MyContract.sol --> MyContract.sol
  filename=$(basename "$filepath")

  # ignore Migrations.sol file
  if [ $filename = "Migrations.sol" ]; then
    continue
  fi

  node /solidity-analyzer/cli.js $filepath 2>&1 | tee /app/output/$filename
  if [ -f /app/output/$filename ]; then echo "Found nothing" > /app/output/$filename; fi
done
