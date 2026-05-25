import type { APIRoute } from "astro";
import { getContestIndex } from "../../lib/data.ts";

export const GET: APIRoute = () => {
	const body = JSON.stringify(getContestIndex());
	return new Response(body, {
		headers: { "Content-Type": "application/json" },
	});
};
