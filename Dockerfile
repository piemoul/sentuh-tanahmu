FROM node:24-bookworm-slim@sha256:a5f4366e834695d5f363b920c104953a535d3a9864d1bdf74566a0ebe01daee5

ENV NODE_ENV=production PORT=4173 BIND_HOST=0.0.0.0
WORKDIR /app/webapp
COPY --chown=node:node webapp/ /app/webapp/
# Empty mount targets only. APK evidence and recovered config are not image layers.
RUN mkdir -p /app/analysis/unpacked/apk/config.arm64_v8a/lib/arm64-v8a /app/analysis/recovered/blutter-unique \
    && touch /app/analysis/unpacked/apk/config.arm64_v8a/lib/arm64-v8a/libapp.so /app/analysis/recovered/blutter-unique/pp.txt
USER node
EXPOSE 4173
HEALTHCHECK --interval=20s --timeout=5s --start-period=20s --retries=3 CMD node -e "fetch('http://127.0.0.1:4173/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
# Needed to read the APK's legacy PKCS12 container; TLS stays verified and >=1.2.
CMD ["node", "--openssl-legacy-provider", "server.mjs"]
