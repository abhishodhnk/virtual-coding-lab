import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { labCodes, labSessions, labParticipants } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid lab session ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Validate required parameters
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (!role) {
      return NextResponse.json(
        { error: 'role is required', code: 'MISSING_ROLE' },
        { status: 400 }
      );
    }

    const labSessionId = parseInt(id);

    // Check if lab session exists
    const labSession = await db
      .select()
      .from(labSessions)
      .where(eq(labSessions.id, labSessionId))
      .limit(1);

    if (labSession.length === 0) {
      return NextResponse.json(
        { error: 'Lab session not found', code: 'LAB_NOT_FOUND' },
        { status: 404 }
      );
    }

    let codeFiles;

    if (role === 'teacher') {
      // Teachers can see all code files for the lab
      codeFiles = await db
        .select()
        .from(labCodes)
        .where(eq(labCodes.labSessionId, labSessionId))
        .orderBy(desc(labCodes.lastUpdated));
    } else if (role === 'student') {
      // Students can only see their own code files
      codeFiles = await db
        .select()
        .from(labCodes)
        .where(
          and(
            eq(labCodes.labSessionId, labSessionId),
            eq(labCodes.studentId, userId)
          )
        )
        .orderBy(desc(labCodes.lastUpdated));
    } else {
      return NextResponse.json(
        { error: 'Invalid role', code: 'INVALID_ROLE' },
        { status: 403 }
      );
    }

    return NextResponse.json(codeFiles, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { userId, role, fileName, language, code } = body;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid lab session ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const labSessionId = parseInt(id);

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (!role) {
      return NextResponse.json(
        { error: 'role is required', code: 'MISSING_ROLE' },
        { status: 400 }
      );
    }

    if (!fileName) {
      return NextResponse.json(
        { error: 'fileName is required', code: 'MISSING_FILE_NAME' },
        { status: 400 }
      );
    }

    if (!language) {
      return NextResponse.json(
        { error: 'language is required', code: 'MISSING_LANGUAGE' },
        { status: 400 }
      );
    }

    if (code === undefined || code === null) {
      return NextResponse.json(
        { error: 'code is required', code: 'MISSING_CODE' },
        { status: 400 }
      );
    }

    // Validate role is student
    if (role !== 'student') {
      return NextResponse.json(
        { error: 'Only students can submit code', code: 'TEACHER_NOT_ALLOWED' },
        { status: 403 }
      );
    }

    // Validate fileName length
    if (fileName.trim().length < 1) {
      return NextResponse.json(
        { error: 'fileName must be at least 1 character', code: 'INVALID_FILE_NAME' },
        { status: 400 }
      );
    }

    // Validate language length
    if (language.trim().length < 1) {
      return NextResponse.json(
        { error: 'language must be at least 1 character', code: 'INVALID_LANGUAGE' },
        { status: 400 }
      );
    }

    // Check if lab session exists
    const labSession = await db
      .select()
      .from(labSessions)
      .where(eq(labSessions.id, labSessionId))
      .limit(1);

    if (labSession.length === 0) {
      return NextResponse.json(
        { error: 'Lab session not found', code: 'LAB_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check if student is a participant in the lab
    const participant = await db
      .select()
      .from(labParticipants)
      .where(
        and(
          eq(labParticipants.labSessionId, labSessionId),
          eq(labParticipants.studentId, userId)
        )
      )
      .limit(1);

    if (participant.length === 0) {
      return NextResponse.json(
        { error: 'Student is not a participant in this lab', code: 'NOT_PARTICIPANT' },
        { status: 403 }
      );
    }

    // Check if code file already exists
    const existingCode = await db
      .select()
      .from(labCodes)
      .where(
        and(
          eq(labCodes.labSessionId, labSessionId),
          eq(labCodes.studentId, userId),
          eq(labCodes.fileName, fileName.trim())
        )
      )
      .limit(1);

    const lastUpdated = new Date().toISOString();

    if (existingCode.length > 0) {
      // Update existing code file
      const updated = await db
        .update(labCodes)
        .set({
          code: code,
          language: language.trim(),
          lastUpdated: lastUpdated,
        })
        .where(eq(labCodes.id, existingCode[0].id))
        .returning();

      return NextResponse.json(updated[0], { status: 200 });
    } else {
      // Create new code file
      const newCode = await db
        .insert(labCodes)
        .values({
          labSessionId: labSessionId,
          studentId: userId,
          fileName: fileName.trim(),
          language: language.trim(),
          code: code,
          lastUpdated: lastUpdated,
        })
        .returning();

      return NextResponse.json(newCode[0], { status: 201 });
    }
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}