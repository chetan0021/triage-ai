# Use the official lightweight Nginx image
FROM nginx:alpine

# Install gettext for envsubst
RUN apk add --no-cache gettext

# Copy local code to the container image
COPY . /usr/share/nginx/html

# Copy the Nginx configuration template
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

# Write the startup script
RUN printf '#!/bin/sh\n\
# Inject API key into app.js\n\
sed -i "s|REPLACE_ME_GEMINI_API_KEY|${GEMINI_API_KEY}|g" /usr/share/nginx/html/js/app.js\n\
# Inject PORT into nginx config\n\
envsubst "\$PORT" < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf\n\
# Start nginx\n\
nginx -g "daemon off;"\n' > /start.sh && chmod +x /start.sh

EXPOSE 8080

CMD ["/start.sh"]
