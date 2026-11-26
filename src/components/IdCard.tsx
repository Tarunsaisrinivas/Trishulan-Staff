"use client";
import { QRCodeCanvas } from "qrcode.react";
import { forwardRef } from "react";
import type { Employee } from "@/lib/types";

const GOLD = "#b08d3c",
	INK = "#0d2b1f",
	CREAM = "#fbf6ea",
	FRAME = "#c9a24a";

// Blank template in /public, 1024 x 1536
const TEMPLATE = "/card-front-bg.png";
const TW = 1024,
	TH = 1536;

// Draws a crop of the template (sx, sy, sw, sh in template pixels) into a box on the card
const Slice = ({
	sx,
	sy,
	sw,
	sh,
	left,
	top,
	dw,
	dh,
}: {
	sx: number;
	sy: number;
	sw: number;
	sh: number;
	left: number;
	top: number;
	dw: number;
	dh: number;
}) => (
	<div
		className="absolute pointer-events-none"
		style={{
			left,
			top,
			width: dw,
			height: dh,
			backgroundImage: `url(${TEMPLATE})`,
			backgroundRepeat: "no-repeat",
			backgroundSize: `${(TW * dw) / sw}px ${(TH * dh) / sh}px`,
			backgroundPosition: `${(-sx * dw) / sw}px ${(-sy * dh) / sh}px`,
		}}
	/>
);

const BottomSwoosh = () => (
	<Slice
		sx={0}
		sy={1150}
		sw={1024}
		sh={386}
		left={0}
		top={528}
		dw={377}
		dh={112}
	/>
);

const GoldFrame = () => (
	<div
		className="absolute inset-0 rounded-[24px] pointer-events-none"
		style={{ border: `3px solid ${FRAME}` }}
	/>
);

const FrontBackground = () => (
	<>
		{/* left swoosh */}
		<Slice
			sx={0}
			sy={100}
			sw={330}
			sh={480}
			left={0}
			top={109}
			dw={121.4}
			dh={176.6}
		/>
		{/* right swoosh */}
		<Slice
			sx={700}
			sy={460}
			sw={324}
			sh={400}
			left={257.8}
			top={235}
			dw={119.2}
			dh={147.2}
		/>
		<BottomSwoosh />
		<GoldFrame />
	</>
);

const BackBackground = () => (
	<>
		<BottomSwoosh />
		<GoldFrame />
	</>
);

const Header = ({ tagline }: { tagline: string }) => (
	<div className="relative text-center pt-6">
		<img
			src="/logo.png"
			crossOrigin="anonymous"
			className="h-[80px] mx-auto"
			alt=""
		/>
		<h1
			className="mt-3 text-[17px] font-extrabold tracking-tight whitespace-nowrap"
			style={{ color: INK }}
		>
			TRISHULAN INDUSTRIAL CONNECT
		</h1>
		<p className="text-[8px] tracking-[0.25em] font-semibold text-gray-600 mt-1">
			{tagline}
		</p>
	</div>
);

// Dark text sitting on the cream area just above the bottom swoosh
const VerifiedBlock = () => (
	<div className="absolute top-[530px] inset-x-0 text-center">
		<p
			className="text-[10px] tracking-[0.25em] font-bold"
			style={{ color: INK }}
		>
			TRISHULAN INDUSTRIAL CONNECT
		</p>
		<div className="mt-2 flex items-center justify-center gap-3">
			<span className="h-px w-[28px]" style={{ background: GOLD }} />
			<span
				className="text-[11px] tracking-[0.25em] font-bold"
				style={{ color: GOLD }}
			>
				VERIFIED EMPLOY
			</span>
			<span className="h-px w-[28px]" style={{ background: GOLD }} />
		</div>
	</div>
);

const wrap = "relative w-[377px] h-[640px] overflow-hidden rounded-[24px]";

export const FrontCard = forwardRef<
	HTMLDivElement,
	{ e: Employee; qrUrl: string }
>(({ e, qrUrl }, ref) => (
	<div ref={ref} className={wrap} style={{ background: CREAM }}>
		<FrontBackground />
		<Header tagline="GLOBAL TRADE | SUSTAINABLE TOMORROW" />

		{/* photo */}
		<div className="absolute top-[176px] inset-x-0 flex justify-center">
			{e.photo_url ? (
				<img
					src={e.photo_url}
					crossOrigin="anonymous"
					className="w-[145px] h-[145px] object-cover object-top"
					alt=""
				/>
			) : (
				<div className="w-[145px] h-[145px] bg-gray-200" />
			)}
		</div>

		{/* name / designation / department */}
		<div className="absolute top-[335px] inset-x-0 text-center px-6">
			<h2
				className="font-bold uppercase text-center leading-tight pr-10"
				style={{
					color: INK,
					fontSize:
						e.name?.length > 20
							? "14px"
							: e.name?.length > 15
								? "18px"
								: "20px",
				}}
			>
				{e.name
					? `${e.name.trim().split(" ")[0]} ${e.name.trim().split(" ").at(-1)}`
					: "NAME"}
			</h2>
			<p
				className="mt-2 text-[15px] font-bold tracking-[0.3em]"
				style={{ color: GOLD }}
			>
				{(e.designation || "").toUpperCase()}
			</p>
			<p className="mt-2 text-[14px] text-gray-700 uppercase">{e.department}</p>
		</div>

		{/* details + QR */}
		<div className="absolute top-[430px] left-[41px] right-[36px] flex justify-between items-start">
			<table
				className="text-[11px] text-gray-600 border-separate"
				style={{ borderSpacing: 0 }}
			>
				<tbody>
					<tr>
						<td className="py-1 w-[84px]">User ID</td>
						<td className="py-1 w-[12px]">:</td>
						<td className="py-1 font-bold text-[14px] text-black">
							{e.employee_id}
						</td>
					</tr>
					<tr>
						<td className="py-1">Blood Group</td>
						<td className="py-1">:</td>
						<td className="py-1 font-bold text-[12px] text-black">
							{e.blood_group}
						</td>
					</tr>
					<tr>
						<td className="py-1">Valid Upto</td>
						<td className="py-1">:</td>
						<td className="py-1 font-bold text-[12px] text-black">
							{e.valid_upto}
						</td>
					</tr>
				</tbody>
			</table>

			<div className="relative flex items-center justify-center bg-white p-1">
				<QRCodeCanvas value={qrUrl} size={78} level="H" includeMargin={false} />
				<div className="absolute flex items-center justify-center bg-white rounded-sm p-[2px]">
					<img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain" />
				</div>
			</div>
		</div>

		<VerifiedBlock />
	</div>
));
FrontCard.displayName = "FrontCard";

export const BackCard = forwardRef<HTMLDivElement, { e: Employee }>(
	({ e }, ref) => {
		const rows = [
			["EMPLOYEE NAME", e.name],
			["EMPLOYEE ID", e.employee_id],
			["DESIGNATION", e.designation],
			["DEPARTMENT", e.department],
			["BLOOD GROUP", e.blood_group],
			["VALID UPTO", e.valid_upto],
		];
		return (
			<div ref={ref} className={wrap} style={{ background: CREAM }}>
				<BackBackground />
				<Header tagline="GLOBAL TRADE | MARKET ANALYSIS" />

				<div
					className="relative mx-11 mt-6 border-t-2"
					style={{ borderColor: GOLD }}
				>
					<p
						className="text-center mt-3 text-[13px] font-bold tracking-[0.3em]"
						style={{ color: GOLD }}
					>
						EMPLOYEE DETAILS
					</p>
					{rows.map(([k, v]) => (
						<div
							key={k}
							className="flex justify-between items-center border-b border-gray-200 py-[9px]"
						>
							<span className="text-[10px] font-bold tracking-widest text-gray-600">
								{k}
							</span>
							<span
								className="text-[12px] font-bold text-right"
								style={{ color: INK }}
							>
								{v}
							</span>
						</div>
					))}
					<div
						className="mt-4 mx-2 rounded-lg border p-2 text-center"
						style={{ borderColor: GOLD }}
					>
						<p
							className="text-[10px] font-bold tracking-[0.3em]"
							style={{ color: GOLD }}
						>
							CONTACT
						</p>
						<p className="text-[12px] font-bold mt-1">+91 9084535999</p>
						<p className="text-[12px] font-bold">hr@trishulan.com</p>
					</div>
				</div>

				<VerifiedBlock />
				<p className="absolute bottom-[10px] inset-x-6 text-center text-[8px] text-white">
					This card is the property of Trishulan Industrial Connect. Return on
					separation.
				</p>
			</div>
		);
	},
);
BackCard.displayName = "BackCard";
