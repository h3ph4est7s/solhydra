#!/bin/sh

# files to be run through mythril
FILES=/app/input/contracts_flatten/*.sol

rm -rf /app/tmp
mkdir -p /app/tmp

for filepath in $FILES
do
  # /app/input/MyContract.sol --> MyContract.sol
  filename=$(basename "$filepath")

  # ignore Migrations.sol file
  if [ $filename = "Migrations.sol" ]; then
    continue
  fi


  # myth -xo json $filepath > /app/tmp/$filename.json

  echo "start executing mythril on $filename"
  myth -xo markdown $filepath > /app/tmp/$filename.md

  # fix the outputted markdown
  node /app/markdown-fix.js /app/tmp/$filename.md /app/output/$filename
  echo "finished executing mythril on $filename"

  # convert json output to text we want to show in html report
  # node /app/json-to-text.js /app/tmp/$filename.json /app/output/$filename
done

rm -rf /app/tmp
