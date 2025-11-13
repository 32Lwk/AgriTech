import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Checking farmlands table...");
    
    // Check if farmer exists
    const farmer = await prisma.farmer.findUnique({
      where: { id: "farmer-001" },
    });
    console.log("Farmer:", farmer ? `Found: ${farmer.name}` : "Not found");

    // Check farmlands
    const farmlands = await prisma.farmland.findMany({
      where: { farmerId: "farmer-001" },
    });
    console.log(`Found ${farmlands.length} farmlands`);
    
    if (farmlands.length > 0) {
      console.log("\nFarmlands details:");
      farmlands.forEach((f, i) => {
        console.log(`\n${i + 1}. ${f.name}`);
        console.log(`   ID: ${f.id}`);
        console.log(`   Latitude: ${f.latitude}`);
        console.log(`   Longitude: ${f.longitude}`);
        console.log(`   Address: ${f.address || "null"}`);
        console.log(`   Prefecture: ${f.prefecture || "null"}`);
        console.log(`   City: ${f.city || "null"}`);
        console.log(`   ImageUrls: ${f.imageUrls || "null"}`);
      });
    }

    // Check table structure
    const result = await prisma.$queryRaw<Array<{ name: string; type: string; notnull: number }>>`
      PRAGMA table_info(farmlands);
    `;
    console.log("\nTable structure:");
    result.forEach((col) => {
      console.log(`  ${col.name}: ${col.type} ${col.notnull ? "NOT NULL" : "NULL"}`);
    });
  } catch (error) {
    console.error("Error:", error);
    if (error instanceof Error) {
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();

