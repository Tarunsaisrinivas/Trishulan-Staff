"use client";
import { toJpeg } from "html-to-image";
import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/client";
import type { Employee } from "@/lib/types";
import { BackCard, FrontCard } from "@/src/components/IdCard";

const empty: Employee = {
	employee_id: "",
	name: "",
	designation: "",
	department: "",
	blood_group: "",
	valid_upto: "",
	photo_url: "",
};
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "";

export default function Admin() {
	const supabase = createClient();
	const [session, setSession] = useState<any>(null);
	const [checking, setChecking] = useState(true);
	const [list, setList] = useState<Employee[]>([]);
	const [form, setForm] = useState<Employee>(empty);
	const [sheetRows, setSheetRows] = useState<Employee[]>([]);
	const [preview, setPreview] = useState<Employee | null>(null);
	const [exporting, setExporting] = useState(false);
	const front = useRef<HTMLDivElement>(null);
	const back = useRef<HTMLDivElement>(null);

	useEffect(() => {
		supabase.auth.getSession().then(({ data }) => {
			setSession(data.session);
			setChecking(false);
		});
	}, []);

	const load = async () => {
		const { data } = await supabase
			.from("employees")
			.select("*")
			.order("employee_id");
		setList(data || []);
	};
	useEffect(() => {
		if (session) load();
	}, [session]);

	if (checking) return <main className="p-10 text-center">Loading…</main>;
	if (!session) return <Login onDone={setSession} />;

	// ---- photo upload (returns public URL or null) ----
	const uploadPhoto = async (file: File, empId: string) => {
		const ext = file.name.split(".").pop() || "jpg";
		const safeId = empId.replace(/[^a-zA-Z0-9_-]/g, "");
		const path = `${safeId}-${Date.now()}.${ext}`;
		const { error } = await supabase.storage
			.from("photos")
			.upload(path, file, { upsert: true });
		if (error) {
			alert("Photo upload failed: " + error.message);
			return null;
		}
		return supabase.storage.from("photos").getPublicUrl(path).data.publicUrl;
	};

	// ---- single save (insert or update) ----
	const save = async () => {
		if (!form.employee_id || !form.name)
			return alert("Employee ID and Name are required");
		const { id, ...rest } = form as any;
		const { error } = await supabase
			.from("employees")
			.upsert(rest, { onConflict: "employee_id" });
		if (error) return alert(error.message);
		setForm(empty);
		setPreview(null);
		load();
	};

	// ---- Excel import ----
	const onExcel = async (file: File) => {
		const wb = XLSX.read(await file.arrayBuffer());
		const json = XLSX.utils.sheet_to_json<any>(wb.Sheets[wb.SheetNames[0]], {
			raw: false,
		});
		setSheetRows(
			json.map((r) => ({
				employee_id: r["Employee ID"] ?? "",
				name: r["Name"] ?? "",
				designation: r["Designation"] ?? "",
				department: r["Department"] ?? "",
				blood_group: r["Blood Group"] ?? "",
				valid_upto: r["Valid Upto"] ?? "",
				photo_url: r["Photo URL"] ?? "",
			})),
		);
	};
	const editSheet = (i: number, k: keyof Employee, v: string) =>
		setSheetRows((rows) =>
			rows.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)),
		);
	const saveSheet = async () => {
		const { error } = await supabase
			.from("employees")
			.upsert(sheetRows, { onConflict: "employee_id" });
		if (error) return alert(error.message);
		setSheetRows([]);
		load();
	};

	// ---- Download front + back as ONE zip (folder inside) ----
	const exportZip = async () => {
		if (!front.current || !back.current) return;
		if (!active.employee_id) return alert("Select or enter an employee first");
		setExporting(true);
		try {
			const JSZip = (await import("jszip")).default;
			const opts = {
				quality: 0.95,
				pixelRatio: 3,
				backgroundColor: "#ffffff",
				cacheBust: true,
			};

			// first call warms up images/fonts so the real render isn't blank
			await toJpeg(front.current, opts).catch(() => null);

			const frontData = await toJpeg(front.current, opts);
			const backData = await toJpeg(back.current, opts);

			const id = active.employee_id;
			const zip = new JSZip();
			const folder = zip.folder(id)!;
			folder.file(`${id}-front.jpg`, frontData.split(",")[1], { base64: true });
			folder.file(`${id}-back.jpg`, backData.split(",")[1], { base64: true });

			const blob = await zip.generateAsync({ type: "blob" });
			const a = document.createElement("a");
			a.href = URL.createObjectURL(blob);
			a.download = `${id}-idcard.zip`;
			a.click();
			URL.revokeObjectURL(a.href);
		} catch (err: any) {
			alert("Export failed: " + (err?.message || err));
		} finally {
			setExporting(false);
		}
	};

	const logout = async () => {
		await supabase.auth.signOut();
		setSession(null);
	};

	const fields: (keyof Employee)[] = [
		"employee_id",
		"name",
		"designation",
		"department",
		"blood_group",
		"valid_upto",
	];
	const active = preview ?? form;
	const qrUrl = `${SITE}/verify/${(active as any).id ?? "preview"}`;

	return (
		<main className="p-6 grid lg:grid-cols-2 gap-8 bg-white text-black">
			<section className="space-y-8">
				<div className="flex justify-end">
					<button onClick={logout} className="text-sm text-gray-600 underline">
						Logout
					</button>
				</div>

				{/* Manual form */}
				<div>
					<h2 className="font-bold text-lg mb-3">Add / Edit Employee</h2>
					<div className="grid grid-cols-2 gap-3">
						{fields.map((f) => (
							<input
								key={f}
								placeholder={f.replace("_", " ")}
								className="border rounded p-2"
								value={(form[f] as string) ?? ""}
								onChange={(e) => setForm({ ...form, [f]: e.target.value })}
							/>
						))}
						<div className="col-span-2">
							<input
								type="file"
								accept="image/*"
								onChange={async (e) => {
									const f = e.target.files?.[0];
									if (!f) return;
									if (!form.employee_id)
										return alert("Enter Employee ID first");
									const url = await uploadPhoto(f, form.employee_id);
									if (url) setForm((prev) => ({ ...prev, photo_url: url }));
								}}
							/>
							<p className="text-xs mt-1 text-gray-500">
								{form.photo_url
									? "✔ Photo attached. Now press Save."
									: "No photo attached yet."}
							</p>
						</div>
					</div>
					<button
						onClick={save}
						className="mt-3 bg-blue-900 text-white px-4 py-2 rounded"
					>
						Save
					</button>
					<button
						onClick={() => {
							setForm(empty);
							setPreview(null);
						}}
						className="mt-3 ml-2 border px-4 py-2 rounded"
					>
						Clear
					</button>
				</div>

				{/* Excel */}
				<div>
					<h2 className="font-bold text-lg mb-1">Import from Excel</h2>
					<p className="text-xs text-gray-500 mb-2">
						Columns: Employee ID, Name, Designation, Department, Blood Group,
						Valid Upto, Photo URL (optional)
					</p>
					<input
						type="file"
						accept=".xlsx,.xls,.csv"
						onChange={(e) => e.target.files?.[0] && onExcel(e.target.files[0])}
					/>
					{sheetRows.length > 0 && (
						<div className="mt-3 overflow-x-auto">
							<table className="text-sm border">
								<thead>
									<tr className="bg-gray-100 text-xs">
										{[...fields, "photo_url"].map((k) => (
											<th key={k} className="border p-1">
												{k}
											</th>
										))}
										<th className="border p-1">Upload photo</th>
										<th />
									</tr>
								</thead>
								<tbody>
									{sheetRows.map((r, i) => (
										<tr key={i}>
											{([...fields, "photo_url"] as (keyof Employee)[]).map(
												(k) => (
													<td key={k} className="border">
														<input
															className="p-1 w-32"
															value={(r[k] as string) ?? ""}
															onChange={(e) => editSheet(i, k, e.target.value)}
														/>
													</td>
												),
											)}
											<td className="border p-1">
												<input
													type="file"
													accept="image/*"
													className="w-40 text-xs"
													onChange={async (e) => {
														const f = e.target.files?.[0];
														if (!f) return;
														if (!r.employee_id)
															return alert("This row has no Employee ID");
														const url = await uploadPhoto(f, r.employee_id);
														if (url) editSheet(i, "photo_url", url);
													}}
												/>
											</td>
											<td>
												<button
													className="px-2 text-red-600"
													onClick={() =>
														setSheetRows(sheetRows.filter((_, x) => x !== i))
													}
												>
													✕
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
							<button
								onClick={saveSheet}
								className="mt-3 bg-green-700 text-white px-4 py-2 rounded"
							>
								Save {sheetRows.length} rows
							</button>
						</div>
					)}
				</div>

				{/* List */}
				<div>
					<h2 className="font-bold text-lg mb-2">Employees</h2>
					{list.map((e) => (
						<div
							key={e.id}
							className="flex justify-between border-b py-2 text-sm"
						>
							<span>
								{e.employee_id} – {e.name}
							</span>
							<span className="space-x-3">
								<button className="text-blue-700" onClick={() => setPreview(e)}>
									Preview
								</button>
								<button
									className="text-amber-700"
									onClick={() => {
										setForm(e);
										setPreview(null);
									}}
								>
									Edit
								</button>
								<button
									className="text-red-600"
									onClick={async () => {
										if (!confirm(`Delete ${e.name}?`)) return;
										await supabase.from("employees").delete().eq("id", e.id);
										load();
									}}
								>
									Delete
								</button>
							</span>
						</div>
					))}
				</div>
			</section>

			{/* Live preview + export */}
			<section>
				<h2 className="font-bold text-lg mb-3">Preview</h2>
				<div className="flex gap-4 flex-wrap">
					<FrontCard ref={front} e={active} qrUrl={qrUrl} />
					<BackCard ref={back} e={active} />
				</div>
				<div className="mt-4">
					<button
						disabled={exporting}
						className="bg-blue-900 text-white px-4 py-2 rounded disabled:opacity-50"
						onClick={exportZip}
					>
						{exporting ? "Preparing…" : "Download ID Card (ZIP: front + back)"}
					</button>
				</div>
				<p className="text-xs text-gray-500 mt-2">
					Use “Preview” on a saved employee so the QR contains the real verify
					link.
				</p>
			</section>
		</main>
	);
}

function Login({ onDone }: { onDone: (s: any) => void }) {
	const supabase = createClient();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	return (
		<main className="min-h-screen grid place-items-center bg-gray-300 text-black">
			<div className="space-y-3 w-72">
				<h1 className="text-[30px] font-bold text-center">Admin login</h1>
				<input
					className="border p-2 w-full rounded"
					placeholder="Email"
					onChange={(e) => setEmail(e.target.value)}
				/>
				<input
					className="border p-2 w-full rounded"
					type="password"
					placeholder="Password"
					onChange={(e) => setPassword(e.target.value)}
				/>
				<button
					className="bg-blue-900 text-white w-full py-2 rounded"
					onClick={async () => {
						const { data, error } = await supabase.auth.signInWithPassword({
							email,
							password,
						});
						if (error) alert(error.message);
						else onDone(data.session);
					}}
				>
					Login
				</button>
			</div>
		</main>
	);
}
