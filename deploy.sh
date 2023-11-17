#!/bin/bash

if [ $# -ne 2 ]; then
    echo "Uso: $0 <dirección IP> <ruta>"
    exit 1
fi

ip="$1"
ruta="$2"

cd build

comando_scp="scp -r * root@$ip:/var/www/html/duoc/$ruta"

eval "$comando_scp"