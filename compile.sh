MYDIR=`dirname $0`;
FILE_NAME="tsconfig.json"

if [ "$1" != "" ]; then
    FILE_NAME="tsconfig.$1.json"
fi

$MYDIR/tsc.sh -p $MYDIR/$FILE_NAME
echo "Compiled $1"