#!/bin/bash

# set -x

hyprctl keyword monitor DP1,3840x2160@60,0x1

result=$(hyprctl monitors | grep -Eo ".*HDMI-A-1.*")
if [ -z "$result" ]; then
  hyprctl keyword monitor HDMI-A-1,1980x1080@60,3840x240,1,transform,3
else
  hyprctl keyword monitor HDMI-A-1,disable
fi

