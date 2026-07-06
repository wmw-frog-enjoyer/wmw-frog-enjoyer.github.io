const fs = require("fs");
const path = require("path");

function generateMissingIds(filePath) {
  try {
    // 1. Read and parse the JSON file
    const rawData = fs.readFileSync(filePath, "utf8");
    const maps = JSON.parse(rawData);

    let updatedCount = 0;

    // 2. Map over the array to fix/assign sequential 3-digit IDs
    const updatedMaps = maps.map((map, index) => {
      // Calculate what the correct ID should be based on its 1-indexed position
      const correctId = String(index + 1).padStart(3, "0");

      // If the ID is missing or incorrect, update it
      if (map.id !== correctId) {
        map.id = correctId;
        updatedCount++;
      }

      // Ensure the 'id' key is at the very top of the object structure for neatness
      return {
        id: map.id,
        ...map,
      };
    });

    // 3. Write the updated data back to the file with nice formatting
    if (updatedCount > 0) {
      fs.writeFileSync(filePath, JSON.stringify(updatedMaps, null, 2), "utf8");
      console.log(
        ` Successfully updated ${updatedCount} map entry/entries in sspm.json!`,
      );
    } else {
      console.log(
        " Everything looks good! All entries already have valid, sequential IDs.",
      );
    }
  } catch (error) {
    console.error("Error processing the JSON file:", error.message);
  }
}

// Run the function (adjust the path to match your environment if needed)
const targetPath = path.resolve(__dirname, "sspm.json");
generateMissingIds(targetPath);
