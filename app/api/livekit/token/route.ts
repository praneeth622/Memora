import { NextRequest, NextResponse } from 'next/server';
import { generateAccessToken } from '@/lib/livekit';

export async function POST(request: NextRequest) {
  try {
    const { roomName, participantName } = await request.json();

    if (!roomName || !participantName) {
      return NextResponse.json(
        { error: 'Room name and participant name are required' },
        { status: 400 }
      );
    }

    // Generate access token
    const token = await generateAccessToken(roomName, participantName);

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Token generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate access token' },
      { status: 500 }
    );
  }
}