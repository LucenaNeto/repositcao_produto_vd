import { NextResponse } from "next/server";
import { db, schema } from "@/server/db";

export async function GET() {
  const rows = db.select().from(schema.produtos).all(); // síncrono, mas ok no server
  return NextResponse.json(rows);
}
