import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  role: text('role').notNull(), // 'teacher' or 'student'
  createdAt: text('created_at').notNull(),
});

// Lab Sessions table
export const labSessions = sqliteTable('lab_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionCode: text('session_code').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  teacherId: text('teacher_id').notNull().references(() => users.id),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
});

// Lab Participants table
export const labParticipants = sqliteTable('lab_participants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  labSessionId: integer('lab_session_id').notNull().references(() => labSessions.id),
  studentId: text('student_id').notNull().references(() => users.id),
  joinedAt: text('joined_at').notNull(),
});

// Lab Announcements table
export const labAnnouncements = sqliteTable('lab_announcements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  labSessionId: integer('lab_session_id').notNull().references(() => labSessions.id),
  message: text('message').notNull(),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: text('created_at').notNull(),
});

// Lab Chats table
export const labChats = sqliteTable('lab_chats', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  labSessionId: integer('lab_session_id').notNull().references(() => labSessions.id),
  senderId: text('sender_id').notNull().references(() => users.id),
  receiverId: text('receiver_id').references(() => users.id),
  message: text('message').notNull(),
  createdAt: text('created_at').notNull(),
});

// Lab Codes table
export const labCodes = sqliteTable('lab_codes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  labSessionId: integer('lab_session_id').notNull().references(() => labSessions.id),
  studentId: text('student_id').notNull().references(() => users.id),
  fileName: text('file_name').notNull(),
  language: text('language').notNull(),
  code: text('code').notNull(),
  lastUpdated: text('last_updated').notNull(),
});


// Auth tables for better-auth
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});