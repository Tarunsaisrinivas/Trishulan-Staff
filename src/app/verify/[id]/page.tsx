import { connection } from "next/server";
import { Suspense } from "react";
import { createPublicClient } from "@/lib/supabase/public";

export default function VerifyPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	return (
		<Suspense
			fallback={
				<main className="p-10 text-center text-gray-500">Loading…</main>
			}
		>
			<Verify params={params} />
		</Suspense>
	);
}

async function Verify({ params }: { params: Promise<{ id: string }> }) {
	await connection(); // always fetch fresh data at request time

	const { id } = await params;
	const supabase = createPublicClient();

	const { data, error } = await supabase.rpc("get_employee", { p_id: id });
	const e = data?.[0];

	if (error || !e) {
		return (
			<main className="p-10 text-center text-red-600 font-semibold">
				Employee not found
				{error && <p className="text-xs text-gray-500 mt-2">{error.message}</p>}
			</main>
		);
	}

	const rows = [
		["Name", e.name],
		["Employee ID", e.employee_id],
		["Designation", e.designation],
		["Department", e.department],
		["Blood Group", e.blood_group],
		["Valid Upto", e.valid_upto],
	];

	return (
		<main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
			<div className="w-full max-w-sm bg-white rounded-2xl shadow p-6 text-center">
				<img src="/logo.png" className="h-16 mx-auto" alt="" />
				<p className="text-green-600 font-bold mt-2">✔ Verified Employee</p>
				{e.photo_url && (
					<img
						src={e.photo_url}
						className="w-32 h-32 rounded-full object-cover mx-auto mt-4"
						alt=""
					/>
				)}
				<dl className="mt-4 text-left divide-y text-black">
					{rows.map(([k, v]) => (
						<div key={k} className="flex justify-between py-2 text-sm">
							<dt className="text-gray-500 upper">{k}</dt>
							<dd className="font-semibold">{v}</dd>
						</div>
					))}
				</dl>
			</div>
		</main>
	);
}
