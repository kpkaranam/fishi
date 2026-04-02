---
id: database-mongodb
name: MongoDB
category: database
frameworks: ["MongoDB","mongoose","mongodb"]
dependencies: ["MongoDB","mongoose","mongodb"]
description: "Document database with flexible schema and Atlas managed service"
---

# MongoDB

**Category:** Database
**Tools:** MongoDB, mongoose, mongodb

### Setup
- Install: `pnpm add mongoose` (ODM) or `pnpm add mongodb` (native driver)
- Env vars: MONGODB_URI (mongodb+srv://user:pass@cluster.mongodb.net/db)

### Architecture
- Mongoose: Define schemas with validation, middleware, virtuals, and methods
- Native driver: Direct MongoDB queries for maximum flexibility
- Atlas: Managed service with built-in search, serverless, and edge functions
- Aggregation pipeline for complex queries and data transformations

### Key Patterns
- Design schemas for your access patterns — denormalize for read performance
- Use Mongoose middleware (pre/post hooks) for validation and side effects
- Indexes: Create compound indexes for common query patterns
- Use MongoDB Atlas Search for full-text search capabilities

### Pitfalls
- No joins — use embedding or $lookup (expensive). Design for denormalized reads
- Mongoose models are cached — use `mongoose.models.User || mongoose.model('User', schema)`
- ObjectId comparison requires .toString() or .equals() — not ===
