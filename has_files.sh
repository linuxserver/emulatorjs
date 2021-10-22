#! /bin/bash

rom_path=$1
rom_type=$2
user_folder='/data'
check_files=$(ls -1 "${user_folder}${rom_path}")

# Process zip file hashes
process_zip () {
  mkdir -p "${user_folder}/hashes/${rom_path}/tmp"
  echo "unzipping ${file}"
  unzip -q "${user_folder}${rom_path}/${file}" -d "${user_folder}/hashes/${rom_path}/tmp"
  rm "${user_folder}/hashes/${rom_path}/tmp/"*.{txt,nfo,xml,readme,README} &> /dev/null
  echo "hashing ${file}"
  sum=$(sha1sum "${user_folder}/hashes/${rom_path}/tmp/"* | awk '{print $1;exit}')
  rm -R "${user_folder}/hashes/${rom_path}/tmp/"
  printf ${sum^^} > "${user_folder}/hashes/${rom_path}/${file}.sha1"
}

# Process 7zip file hashes
process_7z () {
  mkdir -p "${user_folder}/hashes/${rom_path}/tmp"
  echo "unzipping ${file}"
  7z x "${user_folder}${rom_path}/${file}" -o"${user_folder}/hashes/${rom_path}/tmp"
  rm "${user_folder}/hashes/${rom_path}/tmp/"*.{txt,nfo,xml,readme,README} &> /dev/null
  echo "hashing ${file}"
  sum=$(sha1sum "${user_folder}/hashes/${rom_path}/tmp/"* | awk '{print $1;exit}')
  rm -R "${user_folder}/hashes/${rom_path}/tmp/"
  printf ${sum^^} > "${user_folder}/hashes/${rom_path}/${file}.sha1"
}

# Just hash the file
just_hash () {
  mkdir -p "${user_folder}/hashes/${rom_path}"
  echo "hashing ${file}"
  sum=$(sha1sum "${user_folder}/${rom_path}/${file}" | awk '{print $1;exit}')
  printf ${sum^^} > "${user_folder}/hashes/${rom_path}/${file}.sha1"
}

# For NES roms strip headers to get raw sha1
process_nes () {
  if [ $file_type == 'zip' ]; then
    mkdir -p "${user_folder}/hashes/${rom_path}/tmp"
    echo "unzipping ${file}"
    unzip -q "${user_folder}${rom_path}/${file}" -d "${user_folder}/hashes/${rom_path}/tmp"
    rm "${user_folder}/hashes/${rom_path}/tmp/"*.{txt,nfo,xml,readme,README} &> /dev/null
    file_to_sha="${user_folder}/hashes/${rom_path}/tmp/"*
  elif [ $file_type == 'x-7z-compressed' ]; then
    echo "unzipping ${file}"
    mkdir -p "${user_folder}/hashes/${rom_path}/tmp"
    echo "unzipping ${file}"
    7z x "${user_folder}${rom_path}/${file}" -o"${user_folder}/hashes/${rom_path}/tmp"
    rm "${user_folder}/hashes/${rom_path}/tmp/"*.{txt,nfo,xml,readme,README} &> /dev/null
    file_to_sha="${user_folder}/hashes/${rom_path}/tmp/"*
  else
    file_to_sha="${user_folder}/${rom_path}/${file}"
  fi
  echo "hashing ${file}"
  sum=$(NES20Tool -operation rominfo -rom-file ${file_to_sha} |awk '/ROM SHA1/ {print $3;exit}')
  wait
  printf ${sum^^} > "${user_folder}/hashes/${rom_path}/${file}.sha1"
  if [ -d "${user_folder}/hashes/${rom_path}/tmp" ]; then
    rm -R "${user_folder}/hashes/${rom_path}/tmp"
  fi
}

# Use the file name for a key for arcade games and pceCD
process_name () {
  printf "${file%.*}" > "${user_folder}/hashes/${rom_path}/${file}.sha1"
}

process_chd () {
  mkdir -p "${user_folder}/hashes/${rom_path}/tmp"
  chdman extractcd -i "${user_folder}${rom_path}/${file}" -o "${user_folder}/hashes/${rom_path}/tmp/FILE.cue"
  # Check if file has a track 2
  if grep -q "TRACK 02" "${user_folder}/hashes/${rom_path}/tmp/FILE.cue"; then
    mkdir -p "${user_folder}/hashes/${rom_path}/tmp/split"
    binmerge -s "${user_folder}/hashes/${rom_path}/tmp/FILE.cue" FILE -o "${user_folder}/hashes/${rom_path}/tmp/split"
    if [ -f "${user_folder}/hashes/${rom_path}/tmp/split/FILE (Track 1).bin" ]; then
      sum=$(sha1sum "${user_folder}/hashes/${rom_path}/tmp/split/FILE (Track 1).bin" | awk '{print $1;exit}')
    elif [ -f "${user_folder}/hashes/${rom_path}/tmp/split/FILE (Track 01).bin" ];then
      sum=$(sha1sum "${user_folder}/hashes/${rom_path}/tmp/split/FILE (Track 01).bin" | awk '{print $1;exit}')
    fi
  elif grep -q "TRACK 01" "${user_folder}/hashes/${rom_path}/tmp/FILE.cue"; then
    sum=$(sha1sum "${user_folder}/hashes/${rom_path}/tmp/FILE.bin" | awk '{print $1;exit}')
  fi
  printf ${sum^^} > "${user_folder}/hashes/${rom_path}/${file}.sha1"
  if [ -d "${user_folder}/hashes/${rom_path}/tmp" ]; then
    rm -R "${user_folder}/hashes/${rom_path}/tmp"
  fi
}


IFS=$'\n'
mkdir -p "${user_folder}/hashes/${rom_path}"
for file in $check_files; do
  file_extension="${file##*.}"
  if [ $rom_type == 'arcade' ] || [ $rom_type == 'segaSaturn' ]; then
    process_name
  elif [ "${file_extension,,}" = 'chd' ] && [ $rom_type == 'pce' ]; then
    process_name 
  elif [ "${file_extension,,}" = 'chd' ]; then
    process_chd
  elif [ "${file_extension,,}" = 'bin' ] || [ "${file_extension,,}" = 'cue' ] || [ "${file_extension,,}" = 'pbp' ]; then
    echo "Filetype ${file_extension} not supported"
    printf "NOTSUPPORTED" > "${user_folder}/hashes/${rom_path}/${file}.sha1"
  elif [ $rom_type == 'nes' ]; then
    file_type=$(file -b --mime-type "${user_folder}${rom_path}/${file}" | awk -F'/' '{print $2}')
    process_nes
  else
    file_type=$(file -b --mime-type "${user_folder}${rom_path}/${file}" | awk -F'/' '{print $2}')
    if [ $file_type == 'zip' ]; then
      process_zip
    elif [ $file_type == 'x-7z-compressed' ]; then
      process_7z
    else
      just_hash
    fi
  fi
done
