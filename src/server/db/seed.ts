import { db, schema } from "./index";

function main() {
  // Evita duplicar seed se já existir
  const produtosCount = db.select({ count: schema.produtos.id }).from(schema.produtos).all().length;
  if (produtosCount === 0) {
    db.insert(schema.produtos).values([
      { sku: "SKU-1001", nome: "Shampoo X 300ml", unidade: "UN" },
      { sku: "SKU-2001", nome: "Condicionador Y 300ml", unidade: "UN" },
    ]).run();
  }

  const consultorasCount = db.select({ count: schema.consultoras.id }).from(schema.consultoras).all().length;
  if (consultorasCount === 0) {
    db.insert(schema.consultoras).values([
      { codigo: "C-001", nome: "Ana Paula" },
      { codigo: "C-002", nome: "Beatriz Silva" },
    ]).run();
  }

  console.log("Seed concluído.");
}

main();
