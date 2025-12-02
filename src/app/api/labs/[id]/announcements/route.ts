import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { labAnnouncements, labSessions, labParticipants, users } from '@/db/schema';
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

    // Validate required parameters
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid lab session ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

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
      // Teachers can only view announcements of labs they teach
      if (labSession[0].teacherId !== userId) {
        return NextResponse.json(
          { error: 'You are not authorized to view announcements for this lab', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
    } else if (role === 'student') {
      // Students can only view announcements of labs they participate in
      const participation = await db
        .select()
        .from(labParticipants)
        .where(
          and(
            eq(labParticipants.labSessionId, labSessionId),
            eq(labParticipants.studentId, userId)
          )
        )
        .limit(1);

      if (participation.length === 0) {
        return NextResponse.json(
          { error: 'You are not a participant of this lab', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid role', code: 'INVALID_ROLE' },
        { status: 400 }
      );
    }

    // Fetch announcements with creator details
    const announcements = await db
      .select({
        id: labAnnouncements.id,
        labSessionId: labAnnouncements.labSessionId,
        message: labAnnouncements.message,
        createdBy: labAnnouncements.createdBy,
        creatorName: users.fullName,
        createdAt: labAnnouncements.createdAt,
      })
      .from(labAnnouncements)
      .leftJoin(users, eq(labAnnouncements.createdBy, users.id))
      .where(eq(labAnnouncements.labSessionId, labSessionId))
      .orderBy(desc(labAnnouncements.createdAt));

    return NextResponse.json(announcements, { status: 200 });
  } catch (error) {
    console.error('GET announcements error:', error);
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
    const { userId, role, message } = body;

    // Validate lab session ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid lab session ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

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

    if (!message) {
      return NextResponse.json(
        { error: 'message is required', code: 'MISSING_MESSAGE' },
        { status: 400 }
      );
    }

    // Validate message is not empty
    if (message.trim().length === 0) {
      return NextResponse.json(
        { error: 'message must be at least 1 character', code: 'INVALID_MESSAGE' },
        { status: 400 }
      );
    }

    // Check if role is teacher
    if (role !== 'teacher') {
      return NextResponse.json(
        { error: 'Only teachers can create announcements', code: 'FORBIDDEN_ROLE' },
        { status: 403 }
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

    // Check if the teacher is authorized to create announcements for this lab
    if (labSession[0].teacherId !== userId) {
      return NextResponse.json(
        { error: 'You are not authorized to create announcements for this lab', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Create announcement
    const newAnnouncement = await db
      .insert(labAnnouncements)
      .values({
        labSessionId,
        message: message.trim(),
        createdBy: userId,
        createdAt: new Date().toISOString(),
      })
      .returning();

    // Fetch creator details
    const creator = await db
      .select({
        fullName: users.fullName,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const announcementWithCreator = {
      ...newAnnouncement[0],
      creatorName: creator[0]?.fullName || null,
    };

    return NextResponse.json(announcementWithCreator, { status: 201 });
  } catch (error) {
    console.error('POST announcement error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}