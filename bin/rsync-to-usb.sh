#!/bin/bash

. /home/jan/bin/rsync-mydata.sh

hostname=$(hostname | tr '[a-zA-Z]' '[A-Za-z]')

backup "USB" "${hostname}/$(whoami)" "$(whoami)" "/home/$(whoami)/" "/home/$(whoami)/rsync-local-excludes"
backup "USB" "${hostname}/local-bin" "$(whoami)" "/usr/local/bin/" "/home/$(whoami)/rsync-local-excludes"
backup "USB" "${hostname}/etc" "$(whoami)" "/etc/hosts" "/home/$(whoami)/rsync-local-excludes"
backup "USB" "${hostname}/etc" "$(whoami)" "/etc/fstab" "/home/$(whoami)/rsync-local-excludes"
backup "USB" "${hostname}/etc/bu" "$(whoami)" "/etc/bu/" "/home/$(whoami)/rsync-local-excludes"
