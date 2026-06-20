FROM node:20-slim

WORKDIR /app

# Copy dependency files for build caching
COPY package.json package-lock.json ./

RUN npm install

COPY . .

EXPOSE 5173

# Start Vite dev server exposing port 5173
CMD ["npm", "run", "dev"]
