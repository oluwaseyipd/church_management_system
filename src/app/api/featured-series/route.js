import { NextResponse } from "next/server";
import { query } from "@/lib/db";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

// Helper to ensure database table exists
async function ensureTableExists() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS featured_series (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category VARCHAR(255) NOT NULL UNIQUE,
      title VARCHAR(255) NOT NULL,
      subtitle VARCHAR(255) NULL,
      description TEXT NULL,
      coverPhoto VARCHAR(1024) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await query(createTableQuery);
}

// GET /api/featured-series - Retrieve the currently featured series
export async function GET() {
  try {
    await ensureTableExists();
    const results = await query("SELECT * FROM featured_series LIMIT 1");
    const featuredSeries = results.length > 0 ? results[0] : null;
    return NextResponse.json({ success: true, featuredSeries }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error("Database error in GET /api/featured-series:", error);
    return NextResponse.json(
      { error: "Failed to retrieve featured series from database" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

// POST /api/featured-series - Set a category as the featured series
export async function POST(request) {
  try {
    await ensureTableExists();
    const body = await request.json();
    const { category, title, subtitle, description, coverPhoto } = body;

    if (!category || !title || !coverPhoto) {
      return NextResponse.json(
        { error: "Missing required fields (category, title, coverPhoto)" },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    // Enforce that only one category can be featured at a time
    const existing = await query("SELECT COUNT(*) as count FROM featured_series");
    if (existing[0].count > 0) {
      return NextResponse.json(
        { error: "A featured series is already active. Please remove the existing featured series before adding a new one." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const insertQuery = `
      INSERT INTO featured_series (category, title, subtitle, description, coverPhoto) 
      VALUES (?, ?, ?, ?, ?)
    `;
    await query(insertQuery, [
      category,
      title,
      subtitle || null,
      description || null,
      coverPhoto
    ]);

    return NextResponse.json({ 
      success: true, 
      message: "Category successfully featured as a series" 
    }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error("Database error in POST /api/featured-series:", error);
    return NextResponse.json(
      { error: "Failed to save featured series details to database" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

// DELETE /api/featured-series - Remove the currently featured series
export async function DELETE() {
  try {
    await ensureTableExists();
    await query("DELETE FROM featured_series");
    return NextResponse.json({ 
      success: true, 
      message: "Featured series successfully removed" 
    }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error("Database error in DELETE /api/featured-series:", error);
    return NextResponse.json(
      { error: "Failed to remove featured series from database" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
