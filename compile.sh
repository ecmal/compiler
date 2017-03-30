
FILE_NAME="tsconfig.json"

if [ "$1" != "" ]; then
    FILE_NAME="tsconfig.$1.json"
fi

./tsc.sh -p ./$FILE_NAME
echo "Compiled $1"