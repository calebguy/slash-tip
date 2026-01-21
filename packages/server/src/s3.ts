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
	fileId?: string,
): Promise<Buffer> {
	console.log(`Downloading from Slack: ${url.substring(0, 80)}...`);
	console.log(`Bot token prefix: ${botToken.substring(0, 10)}...`);

	// If we have a file ID, try to get fresh file info from Slack API first
	if (fileId) {
		console.log(`Fetching fresh file info for file ID: ${fileId}`);
		const fileInfoResponse = await fetch(
			`https://slack.com/api/files.info?file=${fileId}`,
			{
				headers: {
					Authorization: `Bearer ${botToken}`,
				},
			},
		);
		const fileInfo = (await fileInfoResponse.json()) as {
			ok: boolean;
			error?: string;
			file?: {
				url_private_download?: string;
				url_private?: string;
			};
		};

		console.log(`files.info response:`, JSON.stringify(fileInfo, null, 2));
		if (fileInfo.ok && fileInfo.file) {
			const freshUrl =
				fileInfo.file.url_private_download || fileInfo.file.url_private;
			if (freshUrl && freshUrl !== url) {
				console.log(`Using fresh URL from files.info: ${freshUrl.substring(0, 80)}...`);
				url = freshUrl;
			}
		} else {
			console.log(`files.info failed: ${fileInfo.error || "unknown error"}`);
			console.log(`This likely means the app is missing the 'files:read' scope. Please add it in your Slack app settings under OAuth & Permissions > Bot Token Scopes.`);
		}
	}

	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${botToken}`,
			Accept: "application/octet-stream, image/*, */*",
		},
		redirect: "follow",
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
		// Log some of the HTML to help debug
		const htmlPreview = buffer.toString("utf8", 0, 500);
		console.log(`HTML response preview: ${htmlPreview}`);
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
