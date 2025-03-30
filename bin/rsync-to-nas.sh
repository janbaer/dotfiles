#!/bin/bash

. /home/jan/bin/rsync-mydata.sh

backup "jabasoft-ug" "${HOSTNAME}/$(whoami)" "$(whoami)" "/home/$(whoami)" "/home/$(whoami)/rsync-remote-excludes"
