#!/bin/sh

#set -x
#set -e

dir_root="$(cd "$(dirname "${0}")"; pwd -P)"
svc_name="$(echo ${dir_root} | sed -E 's|.*/([^/]+)|\1|')"
img_name="${svc_name}_node_modules"
img_tag="$(whoami)"
cnt_name="${svc_name}_node_modules"
dockerfile_src="Dockerdeps"

if [ ${#} -gt 1 ]; then
  echo "Usage: ${0} [docker-image]"
  exit 1
fi

if docker ps -a | grep "${cnt_name}" > /dev/null 2> /dev/null; then
  docker rm -f "${cnt_name}"
fi
if docker images | grep "${img_name}:${img_tag}" > /dev/null 2> /dev/null; then
  docker rmi "${img_name}:${img_tag}"
fi

dockerfile=${dockerfile_src}
if [ ${#} -eq 1 ]; then
  dockerfile=".${dockerfile_src}"
  sed -E "s/^FROM[[:space:]]+[a-zA-Z0-9:._-]+$/FROM ${1}/" Dockerdeps > "${dockerfile}"
fi
docker build --file "${dockerfile}" --tag "${img_name}:${img_tag}" "${dir_root}"
docker run --name "${cnt_name}" --detach --rm "${img_name}:${img_tag}" sleep 86400
docker cp "${cnt_name}:/opt/node_modules" "${dir_root}/."
docker cp "${cnt_name}:/opt/package-lock.json" "${dir_root}/."
docker rm -f "${cnt_name}"
if [ "${dockerfile_src}" != "${dockerfile}" ]; then
  rm "${dockerfile}"
fi


