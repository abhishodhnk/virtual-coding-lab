import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { labSessions, users, labParticipants } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid lab session ID is required',
          code: 'INVALID_ID' 
        },
        { status: 400 }
      );
    }

    // Validate required query parameters
    if (!userId) {
      return NextResponse.json(
        { 
          error: 'userId parameter is required',
          code: 'MISSING_USER_ID' 
        },
        { status: 400 }
      );
    }

    if (!role) {
      return NextResponse.json(
        { 
          error: 'role parameter is required',
          code: 'MISSING_ROLE' 
        },
        { status: 400 }
      );
    }

    const labId = parseInt(id);

    // Fetch lab session with teacher details
    const labSession = await db
      .select({
        id: labSessions.id,
        sessionCode: labSessions.sessionCode,
        title: labSessions.title,
        description: labSessions.description,
        teacherId: labSessions.teacherId,
        teacherName: users.fullName,
        isActive: labSessions.isActive,
        createdAt: labSessions.createdAt,
      })
      .from(labSessions)
      .leftJoin(users, eq(labSessions.teacherId, users.id))
      .where(eq(labSessions.id, labId))
      .limit(1);

    if (labSession.length === 0) {
      return NextResponse.json(
        { 
          error: 'Lab session not found',
          code: 'LAB_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    const lab = labSession[0];

    // Authorization check based on role
    if (role === 'teacher') {
      // Teachers can only view labs they created
      if (lab.teacherId !== userId) {
        return NextResponse.json(
          { 
            error: 'You are not authorized to view this lab session',
            code: 'FORBIDDEN' 
          },
          { status: 403 }
        );
      }
    } else if (role === 'student') {
      // Students can only view labs they are participants in
      const participation = await db
        .select()
        .from(labParticipants)
        .where(
          and(
            eq(labParticipants.labSessionId, labId),
            eq(labParticipants.studentId, userId)
          )
        )
        .limit(1);

      if (participation.length === 0) {
        return NextResponse.json(
          { 
            error: 'You are not authorized to view this lab session',
            code: 'FORBIDDEN' 
          },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { 
          error: 'Invalid role specified',
          code: 'INVALID_ROLE' 
        },
        { status: 400 }
      );
    }

    // Return lab session with teacher details
    return NextResponse.json(lab, { status: 200 });

  } catch (error) {
    console.error('GET lab session error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error as Error).message 
      },
      { status: 500 }
    );
  }
}