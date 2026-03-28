# Use the official lightweight Nginx image
FROM nginx:alpine

# Copy local code to the container image
COPY . /usr/share/nginx/html

# Copy the Nginx configuration template
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

# Cloud Run sets the PORT setting (default 8080)
# We use envsubst to inject the $PORT dynamically into the Nginx config
CMD /bin/sh -c "envsubst '\\$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"
