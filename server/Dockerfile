FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4000

# npm run dev (nodemon) never ran migrations -- this is the actual root
# cause of production's `users` table never existing despite
# render.yaml's startCommand saying otherwise: this Render service's
# environment is "Docker," meaning it was created as a plain Web Service
# (auto-detects and uses this Dockerfile) rather than via the render.yaml
# Blueprint, so that startCommand was never actually in effect. Mirrors
# it here so the fix applies regardless of which path Render is using.
CMD ["sh", "-c", "npm run migrate && npm run seed && npm start"]
