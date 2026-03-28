# Use the official lightweight Nginx image
FROM nginx:alpine

# Copy local code to the container image
COPY . /usr/share/nginx/html

# Copy the Nginx configuration template
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

# Cloud Run sets the PORT setting (default 8080)
# We use envsubst for Nginx and sed for the static app.js to inject the API key securely.
CMD /bin/sh -c "sed -i 's/REPLACE_ME_GEMINI_API_KEY/'\"$GEMINI_API_KEY\"'/g' /usr/share/nginx/html/js/app.js && envsubst '\\$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"
