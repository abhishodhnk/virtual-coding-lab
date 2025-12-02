import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { labCodes, labSessions, users } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');

    // Validate lab session ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        {
          error: 'Valid lab session ID is required',
          code: 'INVALID_LAB_SESSION_ID',
        },
        { status: 400 }
      );
    }

    // Validate required parameters
    if (!userId) {
      return NextResponse.json(
        {
          error: 'userId parameter is required',
          code: 'MISSING_USER_ID',
        },
        { status: 400 }
      );
    }

    if (!role) {
      return NextResponse.json(
        {
          error: 'role parameter is required',
          code: 'MISSING_ROLE',
        },
        { status: 400 }
      );
    }

    // Validate role is teacher
    if (role !== 'teacher') {
      return NextResponse.json(
        {
          error: 'Only teachers can access all students code',
          code: 'FORBIDDEN_NOT_TEACHER',
        },
        { status: 403 }
      );
    }

    const labSessionId = parseInt(id);

    // Check if lab session exists and verify teacher ownership
    const labSession = await db
      .select()
      .from(labSessions)
      .where(eq(labSessions.id, labSessionId))
      .limit(1);

    if (labSession.length === 0) {
      return NextResponse.json(
        {
          error: 'Lab session not found',
          code: 'LAB_SESSION_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Verify teacher owns this lab session
    if (labSession[0].teacherId !== userId) {
      return NextResponse.json(
        {
          error: 'You are not authorized to view code for this lab session',
          code: 'FORBIDDEN_NOT_OWNER',
        },
        { status: 403 }
      );
    }

    // Get all code files for this lab session with student details
    const codeFiles = await db
      .select({
        id: labCodes.id,
        labSessionId: labCodes.labSessionId,
        studentId: labCodes.studentId,
        studentName: users.fullName,
        studentEmail: users.email,
        fileName: labCodes.fileName,
        language: labCodes.language,
        code: labCodes.code,
        lastUpdated: labCodes.lastUpdated,
      })
      .from(labCodes)
      .leftJoin(users, eq(labCodes.studentId, users.id))
      .where(eq(labCodes.labSessionId, labSessionId))
      .orderBy(asc(users.fullName), asc(labCodes.fileName));

    return NextResponse.json(codeFiles, { status: 200 });
  } catch (error) {
    console.error('GET all students code error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}