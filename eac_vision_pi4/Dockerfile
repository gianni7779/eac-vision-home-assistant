FROM ghcr.io/home-assistant/base:latest

ARG BUILD_ARCH
RUN apk add --no-cache python3 py3-aiohttp ffmpeg ca-certificates
COPY bin/ /opt/eac/bin/
RUN set -eu; \
    case "${BUILD_ARCH:-$(uname -m)}" in \
      amd64|x86_64) asset=go2rtc_linux_amd64; hash=20b46c6910734cb05ecefb234066f36868ff19b42ba1418a7a32e13a3e035712 ;; \
      aarch64|arm64) asset=go2rtc_linux_arm64; hash=af416f22b21a24ab83b8d78642190b4932ae695b4e386853f11d1b0319781763 ;; \
      armv7|armv7l|arm) asset=go2rtc_linux_arm; hash=cbffe4075a004e2015fd9d7e324800ab7968b52f49e9ce803361879d5e246028 ;; \
      *) echo "Architettura non supportata: ${BUILD_ARCH:-$(uname -m)}" >&2; exit 1 ;; \
    esac; \
    cp "/opt/eac/bin/${asset}" /usr/local/bin/go2rtc; \
    echo "${hash}  /usr/local/bin/go2rtc" | sha256sum -c -; \
    chmod 755 /usr/local/bin/go2rtc

COPY server.py /opt/eac/server.py
COPY core.py /opt/eac/core.py
COPY mp4_compat.py /opt/eac/mp4_compat.py
COPY web/ /opt/eac/web/
COPY run.sh /run.sh
RUN chmod 755 /run.sh
CMD ["/run.sh"]
