import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await axios.post(`${BACKEND_URL}/api/screenings`, body, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Screening API error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.response?.data?.error || 'Failed to create screening' },
      { status: error.response?.status || 500 }
    );
  }
}

export async function GET() {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/screenings`);

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Screening list API error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.response?.data?.error || 'Failed to fetch screenings' },
      { status: error.response?.status || 500 }
    );
  }
}
