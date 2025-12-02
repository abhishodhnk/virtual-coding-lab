import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { labChats, labSessions, labParticipants, users } from '@/db/schema';
import { eq, and, or, isNull, asc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');
    const receiverId = searchParams.get('receiverId');

    // Validate required parameters
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid lab session ID is required', code: 'INVALID_LAB_ID' },
        { status: 400 }
      );
    }

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'userId and role are required', code: 'MISSING_REQUIRED_PARAMS' },
        { status: 400 }
      );
    }

    const labSessionId = parseInt(id);

    // Check if lab session exists
    const labSession = await db.select()
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
      // Teachers can only view messages for labs they teach
      if (labSession[0].teacherId !== userId) {
        return NextResponse.json(
          { error: 'You do not have permission to view messages for this lab', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
    } else if (role === 'student') {
      // Students can only view messages for labs they participate in
      const participation = await db.select()
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
          { error: 'You are not a participant in this lab', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid role', code: 'INVALID_ROLE' },
        { status: 400 }
      );
    }

    // Build query for messages with joins to get sender and receiver names
    let messageConditions;

    if (receiverId) {
      // Private messages: (senderId = userId AND receiverId = receiverId) OR (senderId = receiverId AND receiverId = userId)
      messageConditions = and(
        eq(labChats.labSessionId, labSessionId),
        or(
          and(
            eq(labChats.senderId, userId),
            eq(labChats.receiverId, receiverId)
          ),
          and(
            eq(labChats.senderId, receiverId),
            eq(labChats.receiverId, userId)
          )
        )
      );
    } else {
      // Public messages: receiverId IS NULL
      messageConditions = and(
        eq(labChats.labSessionId, labSessionId),
        isNull(labChats.receiverId)
      );
    }

    // Fetch messages with sender and receiver details
    const messages = await db.select({
      id: labChats.id,
      labSessionId: labChats.labSessionId,
      senderId: labChats.senderId,
      senderName: users.fullName,
      receiverId: labChats.receiverId,
      message: labChats.message,
      createdAt: labChats.createdAt,
    })
      .from(labChats)
      .leftJoin(users, eq(labChats.senderId, users.id))
      .where(messageConditions)
      .orderBy(asc(labChats.createdAt));

    // Fetch receiver names for messages that have receivers
    const messagesWithReceiverNames = await Promise.all(
      messages.map(async (msg) => {
        if (msg.receiverId) {
          const receiver = await db.select({ fullName: users.fullName })
            .from(users)
            .where(eq(users.id, msg.receiverId))
            .limit(1);

          return {
            ...msg,
            receiverName: receiver.length > 0 ? receiver[0].fullName : null,
          };
        }
        return {
          ...msg,
          receiverName: null,
        };
      })
    );

    return NextResponse.json(messagesWithReceiverNames, { status: 200 });
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

    // Validate lab session ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid lab session ID is required', code: 'INVALID_LAB_ID' },
        { status: 400 }
      );
    }

    const labSessionId = parseInt(id);

    const body = await request.json();
    const { userId, role, receiverId, message } = body;

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

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'message is required and must be at least 1 character', code: 'INVALID_MESSAGE' },
        { status: 400 }
      );
    }

    // Check if lab session exists
    const labSession = await db.select()
      .from(labSessions)
      .where(eq(labSessions.id, labSessionId))
      .limit(1);

    if (labSession.length === 0) {
      return NextResponse.json(
        { error: 'Lab session not found', code: 'LAB_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify sender exists
    const sender = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (sender.length === 0) {
      return NextResponse.json(
        { error: 'Sender user not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Authorization check based on role
    if (role === 'teacher') {
      // Teachers can only send messages in labs they teach
      if (labSession[0].teacherId !== userId) {
        return NextResponse.json(
          { error: 'You do not have permission to send messages in this lab', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
    } else if (role === 'student') {
      // Students can only send messages in labs they participate in
      const participation = await db.select()
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
          { error: 'You are not a participant in this lab', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid role', code: 'INVALID_ROLE' },
        { status: 400 }
      );
    }

    // Validate receiver if provided
    let receiverName = null;
    if (receiverId) {
      const receiver = await db.select()
        .from(users)
        .where(eq(users.id, receiverId))
        .limit(1);

      if (receiver.length === 0) {
        return NextResponse.json(
          { error: 'Receiver user not found', code: 'RECEIVER_NOT_FOUND' },
          { status: 404 }
        );
      }
      receiverName = receiver[0].fullName;
    }

    // Create the chat message
    const newMessage = await db.insert(labChats)
      .values({
        labSessionId,
        senderId: userId,
        receiverId: receiverId || null,
        message: message.trim(),
        createdAt: new Date().toISOString(),
      })
      .returning();

    // Return created message with sender and receiver details
    const response = {
      id: newMessage[0].id,
      labSessionId: newMessage[0].labSessionId,
      senderId: newMessage[0].senderId,
      senderName: sender[0].fullName,
      receiverId: newMessage[0].receiverId,
      receiverName,
      message: newMessage[0].message,
      createdAt: newMessage[0].createdAt,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}