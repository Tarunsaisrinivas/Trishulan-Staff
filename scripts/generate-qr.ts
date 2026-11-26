import path from "path";
import QRCode from "qrcode";
import sharp from "sharp";

async function main() {
	const employee = {
		name: "Ganesh Alla",
		employeeId: "EMP001",
		designation: "Software Developer",
		department: "Engineering",
		company: "ABC Technologies",
		phone: "+91 9876543210",
		email: "ganesh@company.com",
	};

	const details = Object.entries(employee)
		.map(([key, value]) => `${key}: ${value}`)
		.join("\n");

	const qrSize = 500;
	const logoSize = 100;
	const logoBackgroundSize = 120;

	// Logo inside the public folder
	const logoPath = path.join(process.cwd(), "public", "logo.png");

	// Generate QR code
	const qrBuffer = await QRCode.toBuffer(details, {
		width: qrSize,
		margin: 3,
		errorCorrectionLevel: "H",
	});

	// Resize logo
	const logoBuffer = await sharp(logoPath)
		.resize(logoSize, logoSize, {
			fit: "contain",
			background: "#ffffff",
		})
		.png()
		.toBuffer();

	// Create white background behind logo
	const logoWithBackground = await sharp({
		create: {
			width: logoBackgroundSize,
			height: logoBackgroundSize,
			channels: 4,
			background: "#ffffff",
		},
	})
		.composite([
			{
				input: logoBuffer,
				left: (logoBackgroundSize - logoSize) / 2,
				top: (logoBackgroundSize - logoSize) / 2,
			},
		])
		.png()
		.toBuffer();

	// Calculate center position
	const position = Math.floor((qrSize - logoBackgroundSize) / 2);

	// Add logo to QR code
	await sharp(qrBuffer)
		.composite([
			{
				input: logoWithBackground,
				left: position,
				top: position,
			},
		])
		.png()
		.toFile("employee-EMP001.png");

	console.log("QR generated successfully with logo!");
}

main().catch(console.error);
