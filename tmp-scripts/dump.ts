import { ministries } from "../src/data/ministries";
const out = ministries.map((m) => ({ id: m.id, label: m.label, description: m.description, city: m.city, zip: m.zip, neighborhood: m.neighborhood, poster: m.poster.name, bio: m.poster.bio, likes: m.likes, comments: m.comments, favorites: m.favorites }));
await Bun.write("/tmp/demo/catalog.json", JSON.stringify(out, null, 2));
console.log(out.length);
