import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";

export async function POST(req: NextRequest) {
    try {
        console.log("received new upload request");
        const data = await req.json(); // Parse JSON body
        const { base64Data, path, uploadId } = data;

        if (!base64Data || !path) {
            return NextResponse.json(
                { error: "Missing base64Data or fname" },
                { status: 400 }
            );
        }

        // Decode Base64 to Uint8Array
        const uint8Array = base64ToUint8Array(base64Data);

        // Upload to Google Cloud Storage
        const storage = new Storage();
        // raw/${userId}/${uploadId}/${fname}
        const documentBucket = process.env.DOCUMENT_BUCKET;
        if (!documentBucket) {
            throw Error("document bucket is not set");
        }
        await storage.bucket(documentBucket).file(path).save(uint8Array);

        console.log("File uploaded successfully", uploadId);
        return NextResponse.json({ message: "File uploaded successfully", id: uploadId });
    } catch (error) {
        console.error("Error uploading file:", error);
        return NextResponse.json({ error: "File upload failed" }, { status: 500 });
    }
}

function base64ToUint8Array(base64: string): Uint8Array {
    // Remove Base64 header (e.g., "data:application/pdf;base64,")
    // Correctly decode Base64
    const binaryString = Buffer.from(base64.split(",")[1], "base64");
    return new Uint8Array(binaryString);
}
