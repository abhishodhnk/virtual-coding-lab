import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { labSessions, labParticipants } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, role, sessionCode } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { 
          error: 'User ID is required',
          code: 'MISSING_USER_ID' 
        },
        { status: 400 }
      );
    }

    if (!role) {
      return NextResponse.json(
        { 
          error: 'Role is required',
          code: 'MISSING_ROLE' 
        },
        { status: 400 }
      );
    }

    if (!sessionCode) {
      return NextResponse.json(
        { 
          error: 'Session code is required',
          code: 'MISSING_SESSION_CODE' 
        },
        { status: 400 }
      );
    }

    // Validate role is student
    if (role !== 'student') {
      return NextResponse.json(
        { 
          error: 'Only students can join lab sessions',
          code: 'FORBIDDEN_NOT_STUDENT' 
        },
        { status: 403 }
      );
    }

    // Validate session code length
    if (sessionCode.length !== 6) {
      return NextResponse.json(
        { 
          error: 'Session code must be 6 characters',
          code: 'INVALID_SESSION_CODE_LENGTH' 
        },
        { status: 400 }
      );
    }

    // Find lab session by session code (case-insensitive)
    const session = await db.select()
      .from(labSessions)
      .where(sql`LOWER(${labSessions.sessionCode}) = LOWER(${sessionCode})`)
      .limit(1);

    if (session.length === 0) {
      return NextResponse.json(
        { 
          error: 'Lab session not found',
          code: 'SESSION_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    const labSession = session[0];

    // Check if lab session is active
    if (!labSession.isActive) {
      return NextResponse.json(
        { 
          error: 'Lab session is not active',
          code: 'SESSION_NOT_ACTIVE' 
        },
        { status: 404 }
      );
    }

    // Check if student is already a participant
    const existingParticipant = await db.select()
      .from(labParticipants)
      .where(
        and(
          eq(labParticipants.labSessionId, labSession.id),
          eq(labParticipants.studentId, userId)
        )
      )
      .limit(1);

    if (existingParticipant.length > 0) {
      // Student already joined, return existing participant record
      return NextResponse.json(
        {
          ...existingParticipant[0],
          labSession: {
            id: labSession.id,
            sessionCode: labSession.sessionCode,
            title: labSession.title,
            description: labSession.description,
            teacherId: labSession.teacherId,
            isActive: labSession.isActive,
            createdAt: labSession.createdAt
          }
        },
        { status: 200 }
      );
    }

    // Create new participant record
    const newParticipant = await db.insert(labParticipants)
      .values({
        labSessionId: labSession.id,
        studentId: userId,
        joinedAt: new Date().toISOString()
      })
      .returning();

    // Return newly created participant with lab session details
    return NextResponse.json(
      {
        ...newParticipant[0],
        labSession: {
          id: labSession.id,
          sessionCode: labSession.sessionCode,
          title: labSession.title,
          description: labSession.description,
          teacherId: labSession.teacherId,
          isActive: labSession.isActive,
          createdAt: labSession.createdAt
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}