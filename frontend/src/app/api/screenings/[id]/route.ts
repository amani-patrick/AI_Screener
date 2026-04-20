import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/screenings/${params.id}`);

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Screening result API error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.response?.data?.error || 'Failed to fetch screening result' },
      { status: error.response?.status || 500 }
    );
  }
}
