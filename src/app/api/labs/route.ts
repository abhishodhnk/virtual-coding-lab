import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { labSessions, labParticipants } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Helper function to generate random 6-character alphanumeric code
function generateSessionCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Helper function to check if session code exists
async function isSessionCodeUnique(code: string): Promise<boolean> {
  const existing = await db.select()
    .from(labSessions)
    .where(eq(labSessions.sessionCode, code))
    .limit(1);
  return existing.length === 0;
}

// Helper function to generate unique session code
async function generateUniqueSessionCode(): Promise<string> {
  let code = generateSessionCode();
  let attempts = 0;
  const maxAttempts = 10;

  while (!await isSessionCodeUnique(code) && attempts < maxAttempts) {
    code = generateSessionCode();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique session code');
  }

  return code;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');

    // Validate required parameters
    if (!userId) {
      return NextResponse.json({
        error: 'userId parameter is required',
        code: 'MISSING_USER_ID'
      }, { status: 400 });
    }

    if (!role) {
      return NextResponse.json({
        error: 'role parameter is required',
        code: 'MISSING_ROLE'
      }, { status: 400 });
    }

    // Validate role value
    if (role !== 'teacher' && role !== 'student') {
      return NextResponse.json({
        error: 'role must be either "teacher" or "student"',
        code: 'INVALID_ROLE'
      }, { status: 400 });
    }

    let labs;

    if (role === 'teacher') {
      // Return labs where teacherId matches userId
      labs = await db.select()
        .from(labSessions)
        .where(eq(labSessions.teacherId, userId));
    } else {
      // For students, join with labParticipants to get enrolled labs
      labs = await db.select({
        id: labSessions.id,
        sessionCode: labSessions.sessionCode,
        title: labSessions.title,
        description: labSessions.description,
        teacherId: labSessions.teacherId,
        isActive: labSessions.isActive,
        createdAt: labSessions.createdAt,
      })
        .from(labSessions)
        .innerJoin(
          labParticipants,
          and(
            eq(labParticipants.labSessionId, labSessions.id),
            eq(labParticipants.studentId, userId)
          )
        );
    }

    return NextResponse.json(labs, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, role, title, description } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json({
        error: 'userId is required',
        code: 'MISSING_USER_ID'
      }, { status: 400 });
    }

    if (!role) {
      return NextResponse.json({
        error: 'role is required',
        code: 'MISSING_ROLE'
      }, { status: 400 });
    }

    // Check if user is a teacher
    if (role !== 'teacher') {
      return NextResponse.json({
        error: 'Only teachers can create lab sessions',
        code: 'FORBIDDEN_NOT_TEACHER'
      }, { status: 403 });
    }

    // Validate title
    if (!title) {
      return NextResponse.json({
        error: 'title is required',
        code: 'MISSING_TITLE'
      }, { status: 400 });
    }

    if (typeof title !== 'string' || title.trim().length < 3) {
      return NextResponse.json({
        error: 'title must be at least 3 characters long',
        code: 'INVALID_TITLE'
      }, { status: 400 });
    }

    // Generate unique session code
    let sessionCode: string;
    try {
      sessionCode = await generateUniqueSessionCode();
    } catch (error) {
      console.error('Session code generation error:', error);
      return NextResponse.json({
        error: 'Failed to generate unique session code',
        code: 'SESSION_CODE_GENERATION_FAILED'
      }, { status: 500 });
    }

    // Prepare insert data
    const now = new Date().toISOString();
    const insertData = {
      sessionCode,
      title: title.trim(),
      description: description ? description.trim() : null,
      teacherId: userId,
      isActive: true,
      createdAt: now,
    };

    // Insert new lab session
    const newLabSession = await db.insert(labSessions)
      .values(insertData)
      .returning();

    if (newLabSession.length === 0) {
      return NextResponse.json({
        error: 'Failed to create lab session',
        code: 'INSERT_FAILED'
      }, { status: 500 });
    }

    return NextResponse.json(newLabSession[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);

    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({
        error: 'Session code already exists. Please try again.',
        code: 'DUPLICATE_SESSION_CODE'
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}