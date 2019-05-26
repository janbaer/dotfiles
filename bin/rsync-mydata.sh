function backup {
  SERVER_ADDRESS=$1
  HOSTNAME=$2
  USER=$3
  DIRECTORIES=$4

  for DIRECTORY_NAME in $DIRECTORIES; do
    rsync -avuz --progress --delete \
          --exclude="node_modules/" --exclude="DS_store" --exclude=".localized" \
          -e "ssh -i ~/.ssh/rsync-key -p $JABASOFT_DS_SSH_PORT" \
          ~/$DIRECTORY_NAME $USER@$SERVER_ADDRESS:/volume1/homes/$USER/$HOSTNAME/
  done

  rsync -avuz --progress --delete \
        --exclude=".local/" --include="*.local" --exclude="*" \
        -e "ssh -i ~/.ssh/rsync-key -p $JABASOFT_DS_SSH_PORT" \
        ~/ $USER@$SERVER_ADDRESS:/volume1/homes/$USER/$HOSTNAME/
}

