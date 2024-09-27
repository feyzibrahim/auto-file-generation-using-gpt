"use client"; // This page will be a client component

import React, { useState } from "react";

const medicalConditions = [
	"Hepatitis B",
	"Hepatitis C",
	"Herpes Simplex Virus (HSV)",
	"Hodgkin's Lymphoma",
	"Huntington's Disease",
	"Hypertension (High Blood Pressure)",
	"Hypothyroidism",
	"Influenza (Flu)",
	"Irritable Bowel Syndrome (IBS)",
	"Kidney Stones",
	"Laryngeal Cancer",
	"Leukemia",
	"Liver Cancer",
	"Lupus (Systemic Lupus Erythematosus)",
	"Lymphoma",
	"Macular Degeneration",
	"Malaria",
	"Melanoma",
	"Meniere's Disease",
	"Meningitis",
	"Metabolic Syndrome",
	"Migraine",
	"Multiple Myeloma",
	"Multiple Sclerosis (MS)",
	"Muscular Dystrophy",
	"Myasthenia Gravis",
	"Non-Hodgkin’s Lymphoma",
	"Obesity",
	"Obstructive Sleep Apnea (OSA)",
	"Osteoarthritis",
	"Osteoporosis",
	"Ovarian Cancer",
	"Pancreatic Cancer",
	"Parkinson’s Disease",
	"Pelvic Inflammatory Disease (PID)",
	"Peripheral Artery Disease (PAD)",
	"Pneumonia",
	"Polycystic Ovary Syndrome (PCOS)",
	"Post-Traumatic Stress Disorder (PTSD)",
	"Prostate Cancer",
	"Psoriasis",
	"Pulmonary Embolism (PE)",
	"Rabies",
	"Rheumatoid Arthritis (RA)",
	"Scleroderma",
	"Sickle Cell Anemia",
	"Skin Cancer (Non-Melanoma)",
	"Stroke",
	"Thalassemia",
	"Thyroid Cancer",
	"Tonsillitis",
	"Tuberculosis (TB)",
	"Ulcerative Colitis",
];

const GenerateFiles = () => {
	const [statuses, setStatuses] = useState<string[]>(
		new Array(medicalConditions.length).fill("Pending")
	);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleGenerateFiles = async () => {
		setError(null);
		setLoading(true);
		setStatuses(new Array(medicalConditions.length).fill("Pending")); // Reset statuses

		// Use a traditional for loop to iterate through the array
		for (let index = 0; index < medicalConditions.length; index++) {
			const condition = medicalConditions[index];

			// Set loading for the current item
			setStatuses((prev) => {
				const newStatuses = [...prev];
				newStatuses[index] = "Loading..."; // Set loading for the current item
				return newStatuses;
			});

			try {
				const res = await fetch("/api", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						name: condition,
						index: `file_${index + 48}`,
					}),
				});

				if (!res.ok) {
					throw new Error(`Error generating files for ${condition}`);
				}

				const data = await res.json();
				console.log(`Success for ${condition}:`, data.data);

				// Mark the condition as done
				setStatuses((prev) => {
					const newStatuses = [...prev];
					newStatuses[index] = "Done"; // Set done for the current item
					return newStatuses;
				});
			} catch (err: any) {
				setError(err.message);
				setStatuses((prev) => {
					const newStatuses = [...prev];
					newStatuses[index] = "Error"; // Set error for the current item
					return newStatuses;
				});
			}
		}
		setLoading(false);
	};

	return (
		<div className="flex flex-col items-center p-4">
			<h1 className="text-xl font-bold mb-4">
				Generate Policy, Bill, and Patient File
			</h1>
			<button
				onClick={handleGenerateFiles}
				className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
				disabled={loading}
			>
				{loading ? "Generating..." : "Generate Files"}
			</button>

			<table className="min-w-full mt-4">
				<thead>
					<tr>
						<th className="border border-gray-200 px-4 py-2">No</th>
						<th className="border border-gray-200 px-4 py-2">Medication</th>
						<th className="border border-gray-200 px-4 py-2">Status</th>
					</tr>
				</thead>
				<tbody>
					{medicalConditions.map((condition, index) => (
						<tr key={index}>
							<td className="border border-gray-200 px-4 py-2">
								{index + 1}
							</td>
							<td className="border border-gray-200 px-4 py-2">
								{condition}
							</td>
							<td className="border border-gray-200 px-4 py-2">
								{statuses[index]}
							</td>
						</tr>
					))}
				</tbody>
			</table>

			{error && <p className="text-red-500">{error}</p>}
		</div>
	);
};

export default GenerateFiles;
