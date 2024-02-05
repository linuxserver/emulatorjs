#! /bin/bash
set -e
set -o pipefail
rom_path=$1
rom_type=$2
full_scan=$3
# Set user folder
if [ -d '/data' ]; then
  user_folder='/data'
else
  user_folder='frontend/user'
fi
check_files=$(find "${user_folder}${rom_path}" -maxdepth 1 -not -type d -and -not -name '.*' -exec basename {} \; | sort)

# Clear out old hashes
if [ "${full_scan}" = "true" ]; then
  if [ -d "${user_folder}/hashes/${rom_path}" ]; then
    rm -Rf "${user_folder}/hashes/${rom_path}"
  fi
fi

# Clean up for bad scans
rm -Rf "${user_folder}/hashes/${rom_path}/tmp/"

# Process zip file hashes
process_zip () {
  mkdir -p "${user_folder}/hashes/${rom_path}/tmp"
  echo "unzipping ${file}"
  unzip -j -q "${user_folder}${rom_path}/${file}" -d "${user_folder}/hashes/${rom_path}/tmp"
  rm "${user_folder}/hashes/${rom_path}/tmp/"*.{txt,nfo,xml,readme,README} &> /dev/null || :
  echo "hashing ${file}"
  firstfile=( "${user_folder}/hashes/${rom_path}/tmp/"* )
  sum=$(sha1sum "$firstfile" | awk '{print $1;exit}')
  rm -R "${user_folder}/hashes/${rom_path}/tmp/"
  printf ${sum^^} > "${user_folder}/hashes/${rom_path}/${file}.sha1"
}

# Process 7zip file hashes
process_7z () {
  mkdir -p "${user_folder}/hashes/${rom_path}/tmp"
  echo "unzipping ${file}"
  7z e "${user_folder}${rom_path}/${file}" -o"${user_folder}/hashes/${rom_path}/tmp"
  rm "${user_folder}/hashes/${rom_path}/tmp/"*.{txt,nfo,xml,readme,README} &> /dev/null || :
  find "${user_folder}/hashes/${rom_path}/tmp/" -empty -type d -delete
  echo "hashing ${file}"
  firstfile=( "${user_folder}/hashes/${rom_path}/tmp/"* )
  sum=$(sha1sum "$firstfile" | awk '{print $1;exit}')
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
    unzip -j -q "${user_folder}${rom_path}/${file}" -d "${user_folder}/hashes/${rom_path}/tmp"
    rm "${user_folder}/hashes/${rom_path}/tmp/"*.{txt,nfo,xml,readme,README} &> /dev/null || :
    file_to_sha="${user_folder}/hashes/${rom_path}/tmp/"*
  elif [ $file_type == 'x-7z-compressed' ]; then
    echo "unzipping ${file}"
    mkdir -p "${user_folder}/hashes/${rom_path}/tmp"
    echo "unzipping ${file}"
    7z x "${user_folder}${rom_path}/${file}" -o"${user_folder}/hashes/${rom_path}/tmp"
    rm "${user_folder}/hashes/${rom_path}/tmp/"*.{txt,nfo,xml,readme,README} &> /dev/null || :
    file_to_sha="${user_folder}/hashes/${rom_path}/tmp/"*
  else
    file_to_sha="${user_folder}/${rom_path}/${file}"
  fi
  echo "hashing ${file}"
  sum=$(NES20Tool -operation rominfo -rom-file ${file_to_sha} |awk '/ROM SHA1/ {print $3;exit}' || sha1sum ${file_to_sha} | awk '{print $1;exit}')
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
  echo "processing ${file}"
  mkdir -p "${user_folder}/hashes/${rom_path}/tmp"
  chdman extractcd -i "${user_folder}${rom_path}/${file}" -o "${user_folder}/hashes/${rom_path}/tmp/FILE.cue"
  # Check if file has a track 2
  if grep -q "TRACK 02" "${user_folder}/hashes/${rom_path}/tmp/FILE.cue"; then
    echo "${file} is multi track need to split"
    mkdir -p "${user_folder}/hashes/${rom_path}/tmp/split"
    NOSPLIT=false
    binmerge -s "${user_folder}/hashes/${rom_path}/tmp/FILE.cue" FILE -o "${user_folder}/hashes/${rom_path}/tmp/split" || NOSPLIT=true
    if [ "${NOSPLIT}" == "false" ]; then
      echo "hashing ${file} (Track 1)"
      if [ -f "${user_folder}/hashes/${rom_path}/tmp/split/FILE (Track 1).bin" ]; then
        sum=$(sha1sum "${user_folder}/hashes/${rom_path}/tmp/split/FILE (Track 1).bin" | awk '{print $1;exit}')
      elif [ -f "${user_folder}/hashes/${rom_path}/tmp/split/FILE (Track 01).bin" ];then
        sum=$(sha1sum "${user_folder}/hashes/${rom_path}/tmp/split/FILE (Track 01).bin" | awk '{print $1;exit}')
      fi
    else
     echo "splitting failed hashing full bin ${file}"
     sum=$(sha1sum "${user_folder}/hashes/${rom_path}/tmp/FILE.cue" | awk '{print $1;exit}')
    fi
  elif grep -q "TRACK 01" "${user_folder}/hashes/${rom_path}/tmp/FILE.cue"; then
    echo "hashing ${file}"
    sum=$(sha1sum "${user_folder}/hashes/${rom_path}/tmp/FILE.bin" | awk '{print $1;exit}')
  fi
  printf ${sum^^} > "${user_folder}/hashes/${rom_path}/${file}.sha1"
  if [ -d "${user_folder}/hashes/${rom_path}/tmp" ]; then
    rm -R "${user_folder}/hashes/${rom_path}/tmp"
  fi
}

process_bin () {
  echo "processing ${file}"
  # Make sure we have a cue file
  cuefile=$(echo "${file}" | sed 's/.bin$/.cue/')
  if [ ! -f "${user_folder}/${rom_path}/${cuefile}" ]; then
    echo "No cue found"
    return 0
  fi
  # Check if file has a track 2
  if grep -q "TRACK 02" "${user_folder}/${rom_path}/${cuefile}"; then
    echo "${file} is multi track need to split"
    mkdir -p "${user_folder}/${rom_path}/tmp/"
    NOSPLIT=false
    binmerge -s "${user_folder}/${rom_path}/${cuefile}" FILE -o "${user_folder}/${rom_path}/tmp/" || NOSPLIT=true
    if [ "${NOSPLIT}" == "false" ]; then
      echo "hashing ${file} (Track 1)"
      if [ -f "${user_folder}/${rom_path}/tmp/FILE (Track 1).bin" ]; then
        sum=$(sha1sum "${user_folder}/${rom_path}/tmp/FILE (Track 1).bin" | awk '{print $1;exit}')
      elif [ -f "${user_folder}/${rom_path}/tmp/FILE (Track 01).bin" ];then
        sum=$(sha1sum "${user_folder}/${rom_path}/tmp/FILE (Track 01).bin" | awk '{print $1;exit}')
      fi
    else
      echo "splitting failed hashing full bin ${file}"
      sum=$(sha1sum "${user_folder}/${rom_path}/${file}" | awk '{print $1;exit}')
    fi
  elif grep -q "TRACK 01" "${user_folder}/${rom_path}/${cuefile}"; then
    echo "hashing ${file}"
    sum=$(sha1sum "${user_folder}/${rom_path}/${file}" | awk '{print $1;exit}')
  fi
  printf ${sum^^} > "${user_folder}/hashes/${rom_path}/${file}.sha1"
  if [ -d "${user_folder}/${rom_path}/tmp" ]; then
    rm -R "${user_folder}/${rom_path}/tmp"
  fi
}

# Process special zip file hashes
process_zip_by_name () {
  mkdir -p "${user_folder}/hashes/${rom_path}/tmp"
  echo "unzipping ${file}"
  unzip -j -q "${user_folder}${rom_path}/${file}" -d "${user_folder}/hashes/${rom_path}/tmp"
  echo "hashing ${file}"
  sum=$(sha1sum "${user_folder}/hashes/${rom_path}/tmp/${file%.*}."* | awk '{print $1;exit}')
  rm -R "${user_folder}/hashes/${rom_path}/tmp/"
  printf ${sum^^} > "${user_folder}/hashes/${rom_path}/${file}.sha1"
}

IFS=$'\n'
mkdir -p "${user_folder}/hashes/${rom_path}"
for file in $check_files; do
  if [ ! -f "${user_folder}/hashes/${rom_path}/${file}.sha1" ]; then
    file_extension="${file##*.}"
    if [ "${file_extension,,}" = 'multiwad' ]; then
      process_zip_by_name
    elif [ $rom_type == 'arcade' ] || [ $rom_type == 'segaSaturn' ] && [[ "${file_extension,,}" != @(img|cue|ccd|disk*|sub) ]]; then
      process_name
    elif [ "${file_extension,,}" = 'chd' ] && [ $rom_type == 'pce' ]; then
      process_name 
    elif [ "${file_extension,,}" = 'chd' ] || ([ $rom_type == 'psx' ] && [[ "${file_extension,,}" == "disk1" ]]); then
      process_chd
    elif [ "${file_extension,,}" = 'bin' ] && [ $rom_type != '3do' ]; then
      process_bin
    elif [[ "${file_extension,,}" = @(img|cue|ccd|disk*|sub) ]]; then
      echo "Filetype ${file_extension} not supported"
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
  fi
done
