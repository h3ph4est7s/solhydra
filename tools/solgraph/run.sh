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

  node /solgraph/solgraph.js $filepath | dot -Tpng | base64 > /app/output/$filename

  node /app/png-to-dataurl.js /app/output/$filename
done
