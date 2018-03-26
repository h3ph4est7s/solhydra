#!/bin/sh

# files to be run through oyente
FILES=/app/input/contracts_flatten/*.sol

for filepath in $FILES
do
  # /app/input/MyContract.sol --> MyContract.sol
  filename=$(basename "$filepath")

  # ignore Migrations.sol file
  if [ $filename = "Migrations.sol" ]; then
    continue
  fi

  # NOTE: oyente outputs to stderr
   oyente -s $filepath 2>&1 | tee /app/output/$filename
done
