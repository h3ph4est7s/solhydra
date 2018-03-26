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

  # first line will be an empty line, so remove it
  solhint $filepath | tail -n +2 | tee /app/output/$filename
done
