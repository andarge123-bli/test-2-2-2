import {
  date,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { usersTable } from "./auth";

export const studyProfilesTable = pgTable("study_profiles", {
  userId: varchar("user_id")
    .primaryKey()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  university: varchar("university", { length: 180 }).notNull().default("University"),
  major: varchar("major", { length: 180 }).notNull().default("Undeclared"),
  currentXp: integer("current_xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  streakCount: integer("streak_count").notNull().default(0),
  lastActiveDate: date("last_active_date", { mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const uploadIntentsTable = pgTable(
  "upload_intents",
  {
    objectPath: varchar("object_path", { length: 1024 }).primaryKey(),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileSizeBytes: integer("file_size_bytes").notNull(),
    contentType: varchar("content_type", { length: 100 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("upload_intents_user_idx").on(table.userId)],
);

export const booksTable = pgTable(
  "study_books",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    author: varchar("author", { length: 200 }),
    subject: varchar("subject", { length: 120 }).notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    objectPath: varchar("object_path", { length: 1024 }).notNull().unique(),
    sha256Hash: varchar("sha256_hash", { length: 64 }).notNull(),
    fileSizeBytes: integer("file_size_bytes").notNull(),
    totalPages: integer("total_pages").notNull().default(0),
    status: varchar("status", { length: 24 }).notNull().default("READY"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("study_books_user_created_idx").on(table.userId, table.createdAt)],
);

export const bookSectionsTable = pgTable(
  "book_sections",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    bookId: varchar("book_id", { length: 36 })
      .notNull()
      .references(() => booksTable.id, { onDelete: "cascade" }),
    chapterTitle: varchar("chapter_title", { length: 240 }).notNull(),
    title: varchar("title", { length: 240 }).notNull(),
    sectionNumber: varchar("section_number", { length: 32 }).notNull(),
    startPage: integer("start_page").notNull().default(1),
    endPage: integer("end_page").notNull().default(1),
    keyConcepts: text("key_concepts")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
  },
  (table) => [index("book_sections_book_idx").on(table.bookId)],
);

export const bookChunksTable = pgTable(
  "book_chunks",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    bookId: varchar("book_id", { length: 36 })
      .notNull()
      .references(() => booksTable.id, { onDelete: "cascade" }),
    sectionId: varchar("section_id", { length: 36 })
      .notNull()
      .references(() => bookSectionsTable.id, { onDelete: "cascade" }),
    chunkIndex: integer("chunk_index").notNull(),
    pageNumber: integer("page_number").notNull().default(1),
    heading: varchar("heading", { length: 240 }).notNull(),
    content: text("content").notNull(),
  },
  (table) => [index("book_chunks_section_idx").on(table.sectionId, table.chunkIndex)],
);

export const quizzesTable = pgTable(
  "study_quizzes",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    bookId: varchar("book_id", { length: 36 })
      .notNull()
      .references(() => booksTable.id, { onDelete: "cascade" }),
    sectionId: varchar("section_id", { length: 36 })
      .notNull()
      .references(() => bookSectionsTable.id, { onDelete: "cascade" }),
    difficulty: varchar("difficulty", { length: 32 }).notNull(),
    questionCount: integer("question_count").notNull(),
    status: varchar("status", { length: 24 }).notNull().default("ACTIVE"),
    score: integer("score").notNull().default(0),
    percentage: real("percentage"),
    studySeconds: integer("study_seconds").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("study_quizzes_user_created_idx").on(table.userId, table.createdAt)],
);

export const quizQuestionsTable = pgTable(
  "quiz_questions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    quizId: varchar("quiz_id", { length: 36 })
      .notNull()
      .references(() => quizzesTable.id, { onDelete: "cascade" }),
    questionNumber: integer("question_number").notNull(),
    questionText: text("question_text").notNull(),
    options: jsonb("options").$type<[string, string, string, string]>().notNull(),
    correctAnswerIndex: integer("correct_answer_index").notNull(),
    explanation: text("explanation").notNull(),
    concept: varchar("concept", { length: 240 }).notNull(),
    pageReferences: integer("page_references").array().notNull().default(sql`'{}'::integer[]`),
    answeredIndex: integer("answered_index"),
    isCorrect: boolean("is_correct"),
    answeredAt: timestamp("answered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("quiz_questions_quiz_idx").on(table.quizId),
    uniqueIndex("quiz_questions_order_idx").on(table.quizId, table.questionNumber),
  ],
);

export const chatMessagesTable = pgTable(
  "study_chat_messages",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    bookId: varchar("book_id", { length: 36 }).references(
      () => booksTable.id,
      { onDelete: "set null" },
    ),
    sectionId: varchar("section_id", { length: 36 }).references(
      () => bookSectionsTable.id,
      { onDelete: "set null" },
    ),
    sender: varchar("sender", { length: 12 }).notNull(),
    text: text("text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("study_chat_user_created_idx").on(table.userId, table.createdAt)],
);

export type StudyProfile = typeof studyProfilesTable.$inferSelect;
export type Book = typeof booksTable.$inferSelect;
export type BookSection = typeof bookSectionsTable.$inferSelect;
export type BookChunk = typeof bookChunksTable.$inferSelect;
export type Quiz = typeof quizzesTable.$inferSelect;
export type QuizQuestion = typeof quizQuestionsTable.$inferSelect;
export type ChatMessage = typeof chatMessagesTable.$inferSelect;
