import { rebuildCatalogue } from "./catalogue-store";
const data = await rebuildCatalogue();
console.log(`Built ${data.publications.length} published records. Run thumbnails:queue to refresh image requests.`);
