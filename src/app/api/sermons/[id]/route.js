import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// PUT /api/sermons/[id] - Update a sermon
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
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
        { error: "Missing required fields for update" },
        { status: 400 }
      );
    }

    const updateQuery = `
      UPDATE sermons 
      SET 
        title = ?, 
        minister = ?, 
        date = ?, 
        bibleText = ?, 
        category = ?, 
        coverPhoto = ?, 
        audioSource = ?, 
        featureStatus = ? 
      WHERE id = ?
    `;

    const results = await query(updateQuery, [
      title,
      minister,
      date,
      bibleText || "",
      category || "General",
      coverPhoto,
      audioSource || null,
      featureStatus ? 1 : 0,
      id
    ]);

    if (results.affectedRows === 0) {
      return NextResponse.json(
        { error: "Sermon not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "Sermon updated successfully" 
    });
  } catch (error) {
    console.error("Database error in PUT /api/sermons/[id]:", error);
    return NextResponse.json(
      { error: "Failed to update sermon in database" },
      { status: 500 }
    );
  }
}

// DELETE /api/sermons/[id] - Delete a sermon
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    const deleteQuery = "DELETE FROM sermons WHERE id = ?";
    const results = await query(deleteQuery, [id]);

    if (results.affectedRows === 0) {
      return NextResponse.json(
        { error: "Sermon not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "Sermon deleted successfully" 
    });
  } catch (error) {
    console.error("Database error in DELETE /api/sermons/[id]:", error);
    return NextResponse.json(
      { error: "Failed to delete sermon from database" },
      { status: 500 }
    );
  }
}
