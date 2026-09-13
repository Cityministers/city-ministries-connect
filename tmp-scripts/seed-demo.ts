/* One-off seeding of demo neighbours, their posts, photos and engagement. */
import { createClient } from "@supabase/supabase-js";
import catalog from "../../tmp/demo/catalog.json" assert { type: "json" };

const url = process.env["SUPABASE_URL"]!;
const key = process.env["SUPABASE_SERVICE_ROLE_KEY"]!;
const admin = createClient(url, key, { auth: { persistSession: false } });

type Demo = {
  slug: string;
  name: string;
  bio: string;
  city: string;
  zip: string;
  id?: string;
};

const demos: Demo[] = [
  {
    slug: "maria",
    name: "Maria Salcedo",
    bio: "And let us consider how to stir up one another to love and good works, not neglecting to meet together.",
    city: "Beaverton",
    zip: "97006",
  },
  {
    slug: "sam",
    name: "Pastor Sam Delgado",
    bio: "As each has received a gift, use it to serve one another, as good stewards of God's varied grace.",
    city: "Portland",
    zip: "97205",
  },
  {
    slug: "ruth",
    name: "Ruth Abara",
    bio: "Clothe yourselves with compassion, kindness, humility, meekness, and patience.",
    city: "Hillsboro",
    zip: "97124",
  },
  {
    slug: "marcus",
    name: "Marcus Okafor",
    bio: "The Son of Man came not to be served but to serve, and to give his life as a ransom for many.",
    city: "Portland",
    zip: "97239",
  },
  {
    slug: "bethany",
    name: "Bethany Cole",
    bio: "Bear one another's burdens, and so fulfill the law of Christ.",
    city: "Beaverton",
    zip: "97007",
  },
  {
    slug: "dee",
    name: "Dee Whitfield",
    bio: "All Scripture is breathed out by God and profitable for teaching, for reproof, for correction, and for training in righteousness.",
    city: "Portland",
    zip: "97211",
  },
  {
    slug: "grace",
    name: "Grace Lin",
    bio: "Rejoice in hope, be patient in tribulation, be constant in prayer.",
    city: "Tigard",
    zip: "97223",
  },
  {
    slug: "andre",
    name: "Andre Boone",
    bio: "Each of you should use whatever gift you have received to serve others, as faithful stewards of God's grace.",
    city: "Gresham",
    zip: "97030",
  },
];

async function findUser(email: string): Promise<string | null> {
  for (let page = 1; page <= 5; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    const hit = data.users.find((u) => u.email === email);
    if (hit) return hit.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function upload(path: string, file: string) {
  const bytes = await Bun.file(file).arrayBuffer();
  const { error } = await admin.storage
    .from("ministry-avatars")
    .upload(path, bytes, { contentType: "image/jpeg", upsert: true });
  if (error) throw error;
}

// 1. Demo accounts + profiles + portraits
for (const d of demos) {
  const email = `demo.${d.slug}@cityministers.app`;
  let id = await findUser(email);
  if (!id) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: crypto.randomUUID() + "aA1!",
      email_confirm: true,
      user_metadata: { display_name: d.name },
    });
    if (error) throw error;
    id = data.user!.id;
  }
  d.id = id;
  const avatarPath = `demo/${d.slug}.jpg`;
  await upload(avatarPath, `/tmp/demo/${d.slug}.jpg`);
  const { error } = await admin.from("profiles").upsert({
    id,
    display_name: d.name,
    bio: d.bio,
    city: d.city,
    zip: d.zip,
    avatar_url: avatarPath,
    is_demo: true,
    onboarded_at: new Date().toISOString(),
  });
  if (error) throw error;
  console.log("demo ready:", d.name, id);
}

const demoIds = demos.map((d) => d.id!);
const pick = (i: number) => demoIds[i % demoIds.length]!;

// 2. Post photos
const photos = ["post-coffee", "post-ride", "post-clothes", "post-meals", "post-moving"];
for (const p of photos) await upload(`demo/${p}.jpg`, `/tmp/demo/${p}.jpg`);

// 3. Hand seeded posts over to the demo neighbours
const legacyOwners = [
  "a391cdc6-70ef-4ae1-967d-54ef4f4c742c",
  "d5651241-84ae-4d52-a3ef-7e6e7ddec23e",
];
for (const table of ["user_ministries", "user_needs"] as const) {
  const { data } = await admin.from(table).select("id, owner_id").in("owner_id", legacyOwners);
  let i = 0;
  for (const row of data ?? []) {
    await admin.from(table).update({ owner_id: pick(i++) }).eq("id", row.id);
  }
  console.log("reassigned", data?.length ?? 0, table);
}

// 4. Every catalogue ministry becomes a real, clickable post
const { data: existing } = await admin.from("user_ministries").select("short_title");
const taken = new Set((existing ?? []).map((r) => r.short_title.trim().toLowerCase()));
let n = 0;
for (const [i, m] of (catalog as any[]).entries()) {
  if (taken.has(m.label.trim().toLowerCase())) continue;
  const gallery =
    m.id === "coffee-chat"
      ? [{ path: "demo/post-coffee.jpg", kind: "image" }]
      : m.id === "a-local-ride"
        ? [{ path: "demo/post-ride.jpg", kind: "image" }]
        : m.id === "free-clothes"
          ? [{ path: "demo/post-clothes.jpg", kind: "image" }]
          : m.id === "buy-or-give-food"
            ? [{ path: "demo/post-meals.jpg", kind: "image" }]
            : m.id === "help-move-or-labor"
              ? [{ path: "demo/post-moving.jpg", kind: "image" }]
              : [];
  const { error } = await admin.from("user_ministries").insert({
    owner_id: pick(i),
    short_title: m.label,
    title: m.label,
    description: m.description,
    city: m.city,
    zip: m.zip,
    icon_id: m.id,
    gallery,
    status: "active",
  });
  if (error) throw error;
  n++;
}
console.log("catalogue ministries added:", n);

// 5. Believable engagement from the demo neighbours
const notes = [
  "This is such a blessing, thank you for offering it.",
  "Sent this to a friend in the neighborhood. Praying for you.",
  "We did this last month and it made a real difference.",
  "Count me in on Saturday if you still need hands.",
  "Grateful for neighbors like you.",
];
const { data: posts } = await admin
  .from("user_ministries")
  .select("id")
  .order("created_at", { ascending: false })
  .limit(40);
const { data: needRows } = await admin
  .from("user_needs")
  .select("id")
  .order("created_at", { ascending: false })
  .limit(40);

const targets = [
  ...(posts ?? []).map((p) => ({ post_type: "ministry" as const, post_id: p.id })),
  ...(needRows ?? []).map((p) => ({ post_type: "need" as const, post_id: p.id })),
];
let likes = 0;
let comments = 0;
for (const [i, t] of targets.entries()) {
  const likers = demoIds.filter((_, k) => (i + k) % 3 !== 0);
  for (const uid of likers) {
    const { error } = await admin
      .from("post_reactions")
      .insert({ user_id: uid, ...t, kind: "like" });
    if (!error) likes++;
  }
  if (i % 3 === 0) {
    const { error } = await admin.from("post_comments").insert({
      user_id: pick(i + 1),
      ...t,
      body: notes[i % notes.length]!,
    });
    if (!error) comments++;
  }
  if (i % 4 === 0) {
    await admin.from("favorites").insert({ user_id: pick(i + 2), ...t });
  }
}
console.log("likes", likes, "comments", comments);
