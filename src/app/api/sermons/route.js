import { NextResponse } from "next/server";
import { query } from "@/lib/db";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

// GET /api/sermons - Retrieve all sermons
export async function GET() {
  try {
    const results = await query(
      "SELECT * FROM sermons ORDER BY date DESC, id DESC"
    );
    // Ensure numbers/dates are normalized nicely if required
    return NextResponse.json(results, {
      headers: CORS_HEADERS,
    });
  } catch (error) {
    console.error("Database error in GET /api/sermons:", error);
    return NextResponse.json(
      { error: "Failed to retrieve sermons from database" },
      { 
        status: 500,
        headers: CORS_HEADERS,
      }
    );
  }
}

// POST /api/sermons - Add a new sermon record
export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      title, 
      minister, 
      date, 
      bibleText, 
      category, 
      coverPhoto, 
      audioSource, 
      featureStatus 
    } = body;

    if (!title || !minister || !date || !coverPhoto) {
      return NextResponse.json(
        { error: "Missing required sermon metadata fields" },
        { 
          status: 400,
          headers: CORS_HEADERS,
        }
      );
    }

    const insertQuery = `
      INSERT INTO sermons 
        (title, minister, date, bibleText, category, coverPhoto, audioSource, featureStatus) 
      VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const results = await query(insertQuery, [
      title,
      minister,
      date,
      bibleText || "",
      category || "General",
      coverPhoto,
      audioSource || null,
      featureStatus ? 1 : 0
    ]);

    return NextResponse.json({ 
      success: true, 
      insertId: results.insertId,
      message: "Sermon successfully recorded in database"
    }, {
      headers: CORS_HEADERS,
    });
  } catch (error) {
    console.error("Database error in POST /api/sermons:", error);
    return NextResponse.json(
      { error: "Failed to record sermon in database" },
      { 
        status: 500,
        headers: CORS_HEADERS,
      }
    );
  }
}
