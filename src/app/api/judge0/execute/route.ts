import { NextRequest, NextResponse } from "next/server";

const JUDGE0_API_URL = "https://judge0-ce.p.rapidapi.com";
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || "test";
const JUDGE0_API_HOST = "judge0-ce.p.rapidapi.com";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source_code, language_id, stdin } = body;

    // Submit code to Judge0
    const submitResponse = await fetch(`${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RapidAPI-Key": JUDGE0_API_KEY,
        "X-RapidAPI-Host": JUDGE0_API_HOST,
      },
      body: JSON.stringify({
        source_code,
        language_id,
        stdin: stdin || "",
      }),
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.error("Judge0 submission failed:", errorText);
      return NextResponse.json(
        { error: "Failed to submit code to Judge0" },
        { status: submitResponse.status }
      );
    }

    const result = await submitResponse.json();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Judge0 API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
