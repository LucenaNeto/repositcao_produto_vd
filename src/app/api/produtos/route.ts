import { db, schema } from "@/server/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { verifyToken } from "@/lib/verifyToken";

export const runtime = "nodejs";

const ProdutoSchema = z.object({
  sku: z.string().min(1),
  nome: z.string().min(1),
  unidade: z.string().min(1),
});

export async function GET(req: Request) {
  try {
    verifyToken(req.headers.get("authorization") || undefined);
    const produtos = await db.select().from(schema.produtos).all();
    return NextResponse.json(produtos);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    verifyToken(req.headers.get("authorization") || undefined);
    const data = ProdutoSchema.parse(await req.json());
    const [novo] = await db.insert(schema.produtos).values(data).returning();
    return NextResponse.json(novo, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
