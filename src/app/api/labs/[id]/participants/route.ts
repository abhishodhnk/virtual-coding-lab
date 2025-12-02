import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { labParticipants, users, labSessions } from '@/db/schema';
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

    // Validate required parameters
    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (!role) {
      return NextResponse.json(
        { error: 'role parameter is required', code: 'MISSING_ROLE' },
        { status: 400 }
      );
    }

    // Validate ID is valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid lab session ID is required', code: 'INVALID_ID' },
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

    // Authorization check based on role
    if (role === 'teacher') {
      // Teachers can only view participants of labs they created
      if (labSession[0].teacherId !== userId) {
        return NextResponse.json(
          { error: 'Not authorized to view participants of this lab session', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
    } else if (role === 'student') {
      // Students can only view participants of labs they are participating in
      const isParticipant = await db
        .select()
        .from(labParticipants)
        .where(
          and(
            eq(labParticipants.labSessionId, labSessionId),
            eq(labParticipants.studentId, userId)
          )
        )
        .limit(1);

      if (isParticipant.length === 0) {
        return NextResponse.json(
          { error: 'Not authorized to view participants of this lab session', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid role specified', code: 'INVALID_ROLE' },
        { status: 400 }
      );
    }

    // Get participants with user details
    const participants = await db
      .select({
        id: labParticipants.id,
        labSessionId: labParticipants.labSessionId,
        studentId: labParticipants.studentId,
        studentName: users.fullName,
        studentEmail: users.email,
        joinedAt: labParticipants.joinedAt,
      })
      .from(labParticipants)
      .innerJoin(users, eq(labParticipants.studentId, users.id))
      .where(eq(labParticipants.labSessionId, labSessionId))
      .orderBy(asc(labParticipants.joinedAt));

    return NextResponse.json(participants, { status: 200 });
  } catch (error) {
    console.error('GET lab participants error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}