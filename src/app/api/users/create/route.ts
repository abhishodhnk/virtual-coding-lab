import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, email, fullName, role } = body;

    // Validate required fields
    if (!id || !email || !fullName || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate role
    if (role !== "teacher" && role !== "student") {
      return NextResponse.json(
        { error: "Invalid role. Must be 'teacher' or 'student'" },
        { status: 400 }
      );
    }

    // Create user record
    const newUser = await db.insert(users).values({
      id,
      email,
      fullName,
      role,
      createdAt: new Date().toISOString(),
    }).returning();

    return NextResponse.json(newUser[0], { status: 201 });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Failed to create user record" },
      { status: 500 }
    );
  }
}
