"use server";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { join } from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import { policySystemPrompt } from "../utils/constants";

const openai = new OpenAI();

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const medicationName: string = body.name; // Get the medication name from the request body
		const index: string = body.index; // Get the index from the request body

		if (!medicationName) {
			console.error("Medication name is missing in the request body.");
			return NextResponse.json(
				{ error: "Medication name is required." },
				{ status: 400 }
			);
		}

		if (!index) {
			console.error("Index is missing in the request body.");
			return NextResponse.json({ error: "Index is required." }, { status: 400 });
		}

		console.log(
			`Generating files for medication: ${medicationName} with index: ${index}`
		);

		// Generate files based on the medication name
		await generateFiles(medicationName, index);
		console.log("Files generated successfully.");
		return NextResponse.json(
			{ message: "Files generated successfully." },
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error processing the request:", error);
		return NextResponse.json({ error: "Error generating files" }, { status: 500 });
	}
}

async function generateFiles(medicationName: string, index: string) {
	const med = { name: medicationName }; // Create a medication object with just the name
	const policy = await generatePolicy(med);
	const patientFile = await generatePatientFile(med, policy!);
	const itemizedBill = await generateItemizedBill(med, patientFile!);

	// Create a folder inside the public directory using the index
	const folderPath = join(process.cwd(), "public", `${index}`);
	fs.mkdirSync(folderPath, { recursive: true }); // Create the directory if it doesn't exist

	// Save each document as a PDF in the newly created folder
	await Promise.all([
		saveAsPDF(join(folderPath, `Policy.pdf`), policy),
		saveAsPDF(join(folderPath, `Patient_File.pdf`), patientFile),
		saveAsPDF(join(folderPath, `Itemized_Bill.pdf`), itemizedBill),
	]);
}

async function generatePolicy(med: { name: string }) {
	const response = await openai.chat.completions.create({
		model: "gpt-4",
		messages: [
			{ role: "system", content: policySystemPrompt },
			{
				role: "user",
				content: `I want a similar data for ${med.name} Don't keep any styling for the generated text just sent the data as plain text. for titles and subtitles put a colon at the end.`,
			},
		],
	});
	return response.choices[0].message.content;
}

async function generateItemizedBill(med: { name: string }, patientFile: string) {
	const response = await openai.chat.completions.create({
		model: "gpt-4",
		messages: [
			{
				role: "system",
				content:
					"Generate an itemized bill for a medication. Don't keep any styling for the generated text just sent the data as plain text. for titles and subtitles put a colon at the end.",
			},
			{
				role: "user",
				content: `Generate an itemized bill for ${med.name} based on the following patient information: ${patientFile}`,
			},
		],
	});
	return response.choices[0].message.content;
}

async function generatePatientFile(med: { name: string }, policy: string) {
	const response = await openai.chat.completions.create({
		model: "gpt-4",
		messages: [
			{
				role: "system",
				content:
					"Generate a patient file for a medication. Don't keep any styling for the generated text just sent the data as plain text. for titles and subtitles put a colon at the end.",
			},
			{
				role: "user",
				content: `I have extracted data from a policy file. And I need patient medical file for this policy file. Extracted policy file: ${policy}.  `,
			},
		],
	});
	return response.choices[0].message.content;
}

async function saveAsPDF(filePath: string, content: string | null) {
	if (!content) return;

	// Create a new PDF document using PDFKit
	const doc = new PDFDocument({ size: "A4", margin: 50 });

	// Stream the output to a file
	const stream = fs.createWriteStream(filePath);
	doc.pipe(stream);

	// Set the font size and text properties
	doc.fontSize(12);

	// Split the content into lines and draw text, adding new pages as needed
	const lines = content.split("\n");
	lines.forEach((line) => {
		// If the current page is full, automatically add a new page
		if (doc.y + 20 > doc.page.height - doc.page.margins.bottom) {
			doc.addPage();
		}

		// Draw the text, titles are bold
		if (line.trim().endsWith(":")) {
			doc.font("Helvetica-Bold").text(line, { paragraphGap: 10 });
		} else {
			doc.font("Helvetica").text(line, { paragraphGap: 10 });
		}
	});

	// Finalize the PDF and end the stream
	doc.end();

	// Return a promise when the stream is finished
	return new Promise((resolve, reject) => {
		stream.on("finish", resolve);
		stream.on("error", reject);
	});
}
