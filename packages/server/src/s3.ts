import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "./env";

const s3Client = new S3Client({
	region: env.AWS_REGION,
	credentials: {
		accessKeyId: env.AWS_ACCESS_KEY_ID,
		secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
	},
});

export async function uploadToS3(
	key: string,
	body: Buffer,
	contentType: string,
): Promise<string> {
	const command = new PutObjectCommand({
		Bucket: env.AWS_S3_BUCKET,
		Key: key,
		Body: body,
		ContentType: contentType,
	});

	await s3Client.send(command);

	// Return public URL
	return `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
}

export async function downloadFromSlack(
	url: string,
	botToken: string,
): Promise<Buffer> {
	console.log(`Downloading from Slack: ${url.substring(0, 80)}...`);

	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${botToken}`,
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to download from Slack: ${response.status} ${response.statusText}`);
	}

	const contentType = response.headers.get("content-type");
	console.log(`Response content-type: ${contentType}`);

	const arrayBuffer = await response.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	// Check if we got HTML instead of an image (auth redirect)
	if (contentType?.includes("text/html") || buffer.toString("utf8", 0, 15).includes("<!DOCTYPE")) {
		throw new Error(`Received HTML instead of image - possible auth issue. Content-type: ${contentType}`);
	}

	console.log(`Downloaded ${buffer.length} bytes`);
	return buffer;
}

export function getFileExtension(filename: string): string {
	const parts = filename.split(".");
	return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "png";
}

export function getContentType(extension: string): string {
	const types: Record<string, string> = {
		jpg: "image/jpeg",
		jpeg: "image/jpeg",
		png: "image/png",
		gif: "image/gif",
		webp: "image/webp",
	};
	return types[extension] || "image/png";
}
