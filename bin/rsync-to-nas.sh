#!/bin/bash

. /home/jan/bin/rsync-mydata.sh

hostname=$(hostname | tr '[a-zA-Z]' '[A-Za-z]')

backup "jabasoft-ug" "${hostname}/$(whoami)" "$(whoami)" "/home/$(whoami)/" "/home/$(whoami)/rsync-remote-excludes"
