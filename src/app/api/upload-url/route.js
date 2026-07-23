import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT_URL,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
  });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");
    const filetype = searchParams.get("filetype");

    if (!filename || !filetype) {
      return NextResponse.json(
        { error: "filename and filetype are required parameters" },
        { status: 400 }
      );
    }

    const r2 = getR2Client();
    const bucketName = process.env.R2_BUCKET_NAME || "";
    
    // Create folder structure: audio/2026/file.mp3 or sermon_image/2026/file.jpg
    const date = new Date();
    const year = date.getFullYear();
    const folder = filetype.startsWith("audio/") ? "audio" : "sermon_image";
    
    // Sanitize filename to avoid S3 path issues
    const cleanFilename = filename.toLowerCase().replace(/[^a-z0-9.]/g, "-");
    const key = `${folder}/${year}/${cleanFilename}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: filetype,
    });

    // Generate presigned PUT URL (valid for 15 minutes / 900 seconds)
    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 900 });

    // Determine the public access URL
    const cdnUrl = process.env.R2_PUBLIC_URL || `https://${bucketName}.r2.cloudflarestorage.com`;
    const publicUrl = `${cdnUrl}/${key}`;

    return NextResponse.json({ uploadUrl, publicUrl, key });
  } catch (error) {
    console.error("Error generating presigned R2 upload URL:", error);
    return NextResponse.json(
      { error: "Internal Server Error during presigned URL generation" },
      { status: 500 }
    );
  }
}
