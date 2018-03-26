#!/bin/sh

# files to be run through echidna
FILES=/app/input/contracts_combine/*.sol

# cd /echidna

for filepath in $FILES
do
  # /app/input/MyContract.sol --> MyContract.sol
  filename=$(basename "$filepath")

  # ignore Migrations.sol file
  if [ $filename = "Migrations.sol" ]; then
    continue
  fi

  # echidna-test is installed to here
  /root/.local/bin/echidna-test $filepath | tee /app/output/$filename
done
