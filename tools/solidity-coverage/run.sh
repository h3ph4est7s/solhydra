#!/bin/sh

#----------------------------------#
#                                  #
# check for required folders/files #
#                                  #
#----------------------------------#

if [ ! -d "/app/input/specs" ]; then
  echo "did not find test/ dir in truffle project"
  exit 1
fi
if [ ! -d "/app/input/migrations" ]; then
  echo "did not find migrations/ dir in truffle project"
  exit 1
fi
if [ ! -f "/app/input/package.json" ]; then
  echo "did not find package.json in truffle project"
  exit 1
fi

#------------------------------------------------------------#
#                                                            #
# create new project dir in container and copy folders/files #
#                                                            #
#------------------------------------------------------------#

# IMPORTANT: clear out previous run data
rm -rf /app/separate-repo

# NOTE: use flattened version since we need the dependencies, deps in node_modules doesn't seem to work
mkdir -p /app/separate-repo/contracts && cp -a /app/input/contracts_flatten/. /app/separate-repo/contracts/
mkdir -p /app/separate-repo/migrations && cp -a /app/input/migrations/. /app/separate-repo/migrations/
mkdir -p /app/separate-repo/test && cp -a /app/input/specs/. /app/separate-repo/test/
cp /app/input/packag*.json /app/separate-repo/

#----------------------------------------------#
#                                              #
# install project npm deps + solidity-coverage #
#                                              #
#----------------------------------------------#

cd /app/separate-repo

npm install --quiet

# BUG: installing solidity-coverage globally doesn't seem to work
npm install solidity-coverage

#---------------------------#
#                           #
# execute solidity-coverage #
#                           #
#---------------------------#

# execute tests with code coverage monitoring
# NOTE: use sed to remove color codes -->  | sed -r "s/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]//g"
/app/separate-repo/node_modules/.bin/solidity-coverage

#---------------------------------------------------------------------------------#
#                                                                                 #
# transform each contract's coverage report report so that all assets are inlined #
#                                                                                 #
#---------------------------------------------------------------------------------#

# output reports will be per file
FILES=/app/input/contracts_flatten/*.sol

for filepath in $FILES
do
  # /app/input/MyContract.sol --> MyContract.sol
  filename=$(basename "$filepath")

  # ignore Migrations.sol file
  if [ $filename = "Migrations.sol" ]; then
    continue
  fi

  if [ ! -f "/app/separate-repo/coverage/contracts/$filename.html" ]; then
    echo "did not find output coverage report for $filename"
    continue
  fi

  # make all assets inline
  node /app/format-report.js /app/separate-repo/coverage/contracts/$filename.html /app/output/$filename

  echo "created coverage report for $filename"
done
