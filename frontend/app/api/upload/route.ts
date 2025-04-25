import { NextRequest, NextResponse } from "next/server";

export interface UploadResult {
    success: boolean
    message: string
    numPages?: number
    numTokens?: number
    url?: string
}

export async function POST(req: NextRequest) {
    try {
        const url = process.env.BACKEND_URL;
        if (!url) {
            throw new Error('BACKEND_URL is not set!');
        }
        console.log("Received new upload request");

        // Parse the incoming form data
        const formData = await req.formData();
        const uploadId = formData.get('uploadId');
        const mode = formData.get('mode');
        const userId = formData.get('userId');
        const file = formData.get('file');

        if (!uploadId) {
            throw new Error("Upload ID must be set");
        }
        if (!mode) {
            throw new Error("Mode must be set");
        }
        if (!file || !(file instanceof Blob)) {
            throw new Error('Invalid file data');
        }

        // Prepare the form data to send to the backend
        const backendFormData = new FormData();
        backendFormData.append("upload_id", uploadId);
        backendFormData.append("mode", mode);
        backendFormData.append("fileb", file);

        const resp = await fetch(
            `${url}/api/v1/users/${userId}/uploads/document`,
            {
                method: "POST",
                body: backendFormData,
            }
        );

        const res = await resp.json();
        return NextResponse.json({
            "success": res.success,
            "message": res.message,
            "numPages": res["num_pages"],
            "numTokens": res["num_tokens"],
            "url": res?.url,
        } as UploadResult);
    } catch (error) {
        console.error("Error uploading file:", error);
        return NextResponse.json({ error: "File upload failed" }, { status: 500 });
    }

}


