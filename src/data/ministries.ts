import {
  Accessibility,
  Baby,
  Bird,
  BookOpen,
  Building2,
  CalendarHeart,
  Car,
  Church,
  Coffee,
  Dog,
  Fish,
  Gamepad2,
  HandHeart,
  HandHelping,
  Heart,
  Home,
  Mail,
  MessageCircle,
  Music,
  Palette,
  Scissors,
  ShoppingBag,
  Shirt,
  Sparkles,
  Truck,
  Users,
  UtensilsCrossed,
  Wine,
  Wrench,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import postCoffee from "@/assets/post-coffee.jpg";
import postCoffee2 from "@/assets/post-coffee-2.jpg";
import postCoffee3 from "@/assets/post-coffee-3.jpg";
import postCoffee4 from "@/assets/post-coffee-4.jpg";
import postCoffeeClip from "@/assets/post-coffee-clip.mp4";
import postRide from "@/assets/post-ride.jpg";
import postClothes from "@/assets/post-clothes.jpg";
import posterMaria from "@/assets/poster-maria.jpg";
import posterJames from "@/assets/poster-james.jpg";
import posterRuth from "@/assets/poster-ruth.jpg";
import posterSam from "@/assets/poster-sam.jpg";

export type Tone =
  | "rose"
  | "blue"
  | "cyan"
  | "pink"
  | "orange"
  | "amber"
  | "purple"
  | "emerald"
  | "indigo"
  | "need";

export const toneStyles: Record<Tone, string> = {
  rose: "bg-tone-rose/12 ring-tone-rose/35 text-tone-rose",
  blue: "bg-tone-blue/12 ring-tone-blue/35 text-tone-blue",
  cyan: "bg-tone-cyan/12 ring-tone-cyan/35 text-tone-cyan",
  pink: "bg-tone-pink/12 ring-tone-pink/35 text-tone-pink",
  orange: "bg-tone-orange/12 ring-tone-orange/35 text-tone-orange",
  amber: "bg-tone-amber/12 ring-tone-amber/35 text-tone-amber",
  purple: "bg-tone-purple/12 ring-tone-purple/35 text-tone-purple",
  emerald: "bg-tone-emerald/12 ring-tone-emerald/35 text-tone-emerald",
  indigo: "bg-tone-indigo/12 ring-tone-indigo/35 text-tone-indigo",
  need: "bg-ink-soft ring-mist/25 text-sand",
};

export type Ministry = {
  id: string;
  label: string;
  /** One-sentence teaser shown under the ministry name on the homepage. */
  tagline?: string;
  icon: LucideIcon;
  tone: Tone;
  description: string;
  neighborhood: string;
  city: string;
  zip: string;
  country?: string;
  /** Illustrative distance from the searched place, in miles. */
  distanceMi: number;
  /** Real map coordinates, looked up from the post's city and ZIP. */
  lat?: number;
  lng?: number;
  media?: string;
  mediaAlt?: string;
  /** Extra photos and video the poster attached. */
  gallery?: { url: string; kind: "image" | "video" }[];
  /** Uploaded profile photo, used as the icon for user-created ministries. */
  avatarUrl?: string;
  /** True when a member created this ministry themselves. */
  custom?: boolean;
  /** True when this is a posted need (a request for help) rather than an offer. */
  isNeed?: boolean;
  /** Longer title for user-created ministries. */
  fullTitle?: string;
  /** Database identity for user-created posts, used for saving and messaging. */
  postType?: "ministry" | "need";
  postId?: string;
  ownerId?: string;
  poster: { name: string; photo?: string; bio: string };
  likes: number;
  favorites: number;
  comments: number;
  /** Position on the splash map, if this ministry is pinned there. */
  position?: string;
};

const seed: Omit<Ministry, "city" | "zip" | "distanceMi">[] = [
  {
    id: "coffee-chat",
    label: "Coffee Chat",
    tagline: "A cup of coffee and someone willing to listen.",
    icon: Coffee,
    tone: "amber",
    description:
      "Grab a cup with someone nearby who wants to talk, listen, and share life over coffee.",
    neighborhood: "Beaverton, OR",
    media: postCoffee,
    mediaAlt: "Two cups of coffee on a cafe table",
    gallery: [
      { url: postCoffee, kind: "image" },
      { url: postCoffee2, kind: "image" },
      { url: postCoffee4, kind: "image" },
      { url: postCoffee3, kind: "image" },
      { url: postCoffeeClip, kind: "video" },
    ],
    poster: {
      name: "Maria S.",
      photo: posterMaria,
      bio: "And let us consider how to stir up one another to love and good works, not neglecting to meet together.",
    },
    likes: 24,
    favorites: 9,
    comments: 5,
    position: "left-[12%] top-[14%]",
  },
  {
    id: "volunteer-at-church",
    label: "Volunteer at Church",
    tagline: "Lend your hands to the house of God.",
    icon: Church,
    tone: "emerald",
    description:
      "Give a few hours to a local congregation — setup, greeting, nursery, cleanup, whatever is needed that week.",
    neighborhood: "Downtown Portland",
    poster: {
      name: "Pastor Sam D.",
      photo: posterSam,
      bio: "As each has received a gift, use it to serve one another, as good stewards of God's varied grace.",
    },
    likes: 62,
    favorites: 28,
    comments: 11,
  },
  {
    id: "lend-a-book",
    label: "Lend a Book",
    tagline: "Pass on the book that changed you.",
    icon: BookOpen,
    tone: "blue",
    description:
      "Pass along a book that shaped you. Borrow one back when you're ready. No due dates, no fees.",
    neighborhood: "Cedar Mill",
    poster: {
      name: "Dee W.",
      bio: "All Scripture is breathed out by God and profitable for teaching, for reproof, for correction, and for training in righteousness.",
    },
    likes: 38,
    favorites: 21,
    comments: 7,
  },
  {
    id: "dine-out-in-public",
    label: "Dine-out in Public",
    tagline: "Share a meal where life is visible.",
    icon: UtensilsCrossed,
    tone: "cyan",
    description:
      "Meet at a café or diner so no one eats alone. Public, daylight, split the check or it's on me.",
    neighborhood: "Rock Creek",
    poster: {
      name: "Marcus O.",
      bio: "The Son of Man came not to be served but to serve, and to give his life as a ransom for many.",
    },
    likes: 55,
    favorites: 24,
    comments: 9,
    position: "right-[26%] top-[34%]",
  },
  {
    id: "help-move-or-labor",
    label: "Help Move or Labor",
    tagline: "Show up with strong hands and no invoice.",
    icon: Truck,
    tone: "orange",
    description:
      "Boxes, stairs, a truck, and a strong weekend. Moving day help and general heavy lifting.",
    neighborhood: "St. Johns",
    poster: {
      name: "Bethany & Cole",
      bio: "Bear one another's burdens, and so fulfill the law of Christ.",
    },
    likes: 103,
    favorites: 62,
    comments: 17,
  },
  {
    id: "free-clothes",
    label: "Free Clothes",
    tagline: "Good clothes, no price tag, no questions.",
    icon: Shirt,
    tone: "rose",
    description:
      "Share gently used clothing with people in your community who could use a fresh start.",
    neighborhood: "Hillsboro, OR",
    media: postClothes,
    mediaAlt: "Neatly folded stacks of donated clothes",
    poster: {
      name: "Ruth A.",
      photo: posterRuth,
      bio: "Clothe yourselves with compassion, kindness, humility, meekness, and patience.",
    },
    likes: 58,
    favorites: 33,
    comments: 21,
    position: "left-[44%] bottom-[16%]",
  },
  {
    id: "dine-in-dinner-host",
    label: "Dine-In Dinner Host",
    tagline: "Set one more place at your table.",
    icon: Home,
    tone: "cyan",
    description:
      "Open your table at home. A hot meal, a real conversation, and a seat that's yours.",
    neighborhood: "Southeast Division",
    poster: {
      name: "Nina R.",
      bio: "Contribute to the needs of the saints and seek to show hospitality.",
    },
    likes: 110,
    favorites: 66,
    comments: 18,
    position: "left-[18%] bottom-[26%]",
  },
  {
    id: "clean-or-organize",
    label: "Clean or Organize",
    tagline: "Give a tired home room to breathe.",
    icon: Sparkles,
    tone: "purple",
    description:
      "Help a neighbor dig out — a deep clean, a garage, a closet, or a house after a hard season.",
    neighborhood: "Tigard",
    poster: {
      name: "Priya N.",
      bio: "Whatever you do, work heartily, as for the Lord and not for men.",
    },
    likes: 44,
    favorites: 19,
    comments: 6,
  },
  {
    id: "a-local-ride",
    label: "A Local Ride",
    tagline: "Be the way someone gets where they need to go.",
    icon: Car,
    tone: "cyan",
    description:
      "Offer or request a ride to appointments, church, the store, or anywhere a neighbor needs to go.",
    neighborhood: "Aloha, OR",
    media: postRide,
    mediaAlt: "A car parked on a city street with the door open",
    poster: {
      name: "James T.",
      photo: posterJames,
      bio: "Whoever is generous to the poor lends to the Lord, and he will repay him for his deed.",
    },
    likes: 41,
    favorites: 17,
    comments: 12,
    position: "right-[10%] top-[12%]",
  },
  {
    id: "blind-date",
    label: "Blind Date",
    tagline: "Introduce two people who would click.",
    icon: Heart,
    tone: "rose",
    description:
      "A gentle introduction in daylight, in public, with a friend nearby. No pressure, honest conversation.",
    neighborhood: "Tom McCall Waterfront",
    poster: {
      name: "Elena V.",
      bio: "Two are better than one, because they have a good reward for their toil.",
    },
    likes: 33,
    favorites: 14,
    comments: 7,
  },
  {
    id: "babysit",
    label: "Babysit",
    tagline: "Give exhausted parents a night to themselves.",
    icon: Baby,
    tone: "amber",
    description:
      "Free childcare so a parent can work a shift, keep an appointment, or simply rest for an evening.",
    neighborhood: "Gresham",
    poster: {
      name: "Tasha B.",
      bio: "Children are a heritage from the Lord, the fruit of the womb a reward.",
    },
    likes: 71,
    favorites: 35,
    comments: 12,
  },
  {
    id: "host-prayer-praise-event",
    label: "Host Prayer & Praise Event",
    tagline: "Open a room for neighbors to seek God together.",
    icon: Music,
    tone: "orange",
    description:
      "Gather people for worship and prayer — a living room, a park, a rooftop. Bring a voice, that's all.",
    neighborhood: "Pearl District",
    poster: {
      name: "Camille F.",
      bio: "Rejoice in hope, be patient in tribulation, be constant in prayer.",
    },
    likes: 88,
    favorites: 40,
    comments: 25,
    position: "right-[38%] bottom-[34%]",
  },
  {
    id: "game-nite-or-play-date",
    label: "Game Nite or Play Date",
    tagline: "Fun that makes room for faith.",
    icon: Gamepad2,
    tone: "amber",
    description:
      "Controllers, board games, and mentors who stick around after the game ends. Kids and teens welcome.",
    neighborhood: "Gresham",
    poster: {
      name: "Andre K.",
      bio: "A joyful heart is good medicine, but a crushed spirit dries up the bones.",
    },
    likes: 96,
    favorites: 38,
    comments: 42,
  },
  {
    id: "community-service",
    label: "Community Service",
    tagline: "Love the block you live on.",
    icon: HandHeart,
    tone: "emerald",
    description:
      "Park cleanups, food banks, and neighborhood projects that need more hands than they have.",
    neighborhood: "Lloyd District",
    poster: {
      name: "Omar H.",
      bio: "Let your light shine before others, so that they may see your good works and give glory to your Father.",
    },
    likes: 67,
    favorites: 29,
    comments: 10,
  },
  {
    id: "host-small-group-meeting",
    label: "Host Small Group Meeting",
    tagline: "Open your door to a handful of neighbors.",
    icon: Users,
    tone: "indigo",
    description:
      "Open your space for a weekly study or support circle. Coffee on, phones down, honest talk.",
    neighborhood: "Beaverton Central",
    poster: {
      name: "Grace L.",
      bio: "And day by day, attending the temple together and breaking bread in their homes.",
    },
    likes: 52,
    favorites: 27,
    comments: 13,
    position: "left-[62%] top-[20%]",
  },
  {
    id: "fishing-or-camping",
    label: "Fishing or Camping",
    tagline: "Talk with God on the water or by a fire.",
    icon: Fish,
    tone: "cyan",
    description:
      "Take someone outdoors who never gets to go — a river morning, a campfire night, gear provided.",
    neighborhood: "Sandy River",
    poster: {
      name: "Hollis G.",
      bio: "The heavens declare the glory of God, and the sky above proclaims his handiwork.",
    },
    likes: 59,
    favorites: 31,
    comments: 8,
  },
  {
    id: "reach-out-to-hurting",
    label: "Reach Out to Lost, Lonely, or Hurt People",
    tagline: "Notice the neighbor nobody notices.",
    icon: MessageCircle,
    tone: "blue",
    description:
      "Say the hard thing out loud to someone trained to hold it. Peer support, strict confidence, no fixing unless asked.",
    neighborhood: "Hollywood District",
    poster: {
      name: "Devon A.",
      bio: "The Lord is near to the brokenhearted and saves the crushed in spirit.",
    },
    likes: 91,
    favorites: 57,
    comments: 23,
  },
  {
    id: "buy-or-give-food",
    label: "Buy or Give Food (not money)",
    tagline: "Feed someone with your own hands.",
    icon: ShoppingBag,
    tone: "orange",
    description:
      "Groceries, a hot plate, or a full cart for a family that's short this week. Food only, no cash.",
    neighborhood: "Rockwood",
    poster: {
      name: "Terrance J.",
      bio: "If your enemy is hungry, feed him; if he is thirsty, give him something to drink.",
    },
    likes: 118,
    favorites: 70,
    comments: 15,
  },
  {
    id: "romantic-double-date",
    label: "Romantic Double Date",
    tagline: "Pair two people you actually trust.",
    icon: CalendarHeart,
    tone: "pink",
    description:
      "Two couples, one evening. A safe, fun way to meet someone new or to pour into a younger marriage.",
    neighborhood: "Ladd's Addition",
    poster: {
      name: "Rosalind P.",
      bio: "Therefore what God has joined together, let not man separate.",
    },
    likes: 47,
    favorites: 26,
    comments: 9,
  },
  {
    id: "pray-with-or-for-someone",
    label: "Pray With or For Someone",
    tagline: "Say their name out loud before God.",
    icon: HandHelping,
    tone: "emerald",
    description:
      "Bring a request, or sit with someone while they bring theirs. In person, on a call, or quietly on your own.",
    neighborhood: "Downtown Portland",
    poster: {
      name: "Sister Anne M.",
      bio: "The prayer of a righteous person has great power as it is working.",
    },
    likes: 129,
    favorites: 81,
    comments: 22,
    position: "right-[14%] bottom-[20%]",
  },
  {
    id: "host-homeless-or-rehab-person",
    label: "Host a Homeless or Rehab Person",
    tagline: "A bed, a meal, and no catch.",
    icon: Building2,
    tone: "indigo",
    description:
      "A spare room, a transition month, and steady support for someone leaving the street or a program.",
    neighborhood: "Milwaukie",
    poster: {
      name: "Bethany & Cole",
      bio: "I was a stranger and you welcomed me.",
    },
    likes: 76,
    favorites: 48,
    comments: 20,
  },
  {
    id: "intellectual-talks",
    label: "Intellectual Talks Over Wine or Beer",
    tagline: "Ask the hard questions over a glass.",
    icon: Wine,
    tone: "purple",
    description:
      "Big questions, good drinks, real disagreement handled kindly. Faith, doubt, books, and everything under them.",
    neighborhood: "Old Town",
    poster: {
      name: "Rico P.",
      bio: "Come now, let us reason together, says the Lord.",
    },
    likes: 54,
    favorites: 21,
    comments: 30,
  },
  {
    id: "artistic-abilities",
    label: "Artistic Abilities",
    tagline: "Make something that lifts someone else.",
    icon: Palette,
    tone: "pink",
    description:
      "Murals, portraits, music lessons, photos — offer your craft to someone who could never pay for it.",
    neighborhood: "Sellwood",
    poster: {
      name: "Andre K.",
      bio: "He has filled him with the Spirit of God, with skill, with intelligence, with knowledge, and with all craftsmanship.",
    },
    likes: 128,
    favorites: 80,
    comments: 26,
  },
  {
    id: "help-injured-or-handicap",
    label: "Help Injured or Handicap",
    tagline: "Meet a body's limits with practical help.",
    icon: Accessibility,
    tone: "blue",
    description:
      "Errands, transport, ramps, and daily help for neighbors living with injury or disability.",
    neighborhood: "West Hills",
    poster: {
      name: "Camille F.",
      bio: "Religion that is pure and undefiled before God is this: to visit orphans and widows in their affliction.",
    },
    likes: 63,
    favorites: 37,
    comments: 11,
  },
  {
    id: "write-an-inmate",
    label: "Write an Inmate",
    tagline: "Letters to the people the world forgot.",
    icon: Mail,
    tone: "blue",
    description:
      "Handwritten letters to people inside — steady encouragement, stamps and stationery provided.",
    neighborhood: "Orenco Station",
    poster: {
      name: "Grace L.",
      bio: "Remember those who are in prison, as though in prison with them.",
    },
    likes: 72,
    favorites: 44,
    comments: 9,
  },
  {
    id: "help-with-handyman-services",
    label: "Help With Handyman Services",
    tagline: "Fix what's broken for someone who can't.",
    icon: Wrench,
    tone: "emerald",
    description:
      "Leaky faucets, broken steps, a door that won't latch. Small repairs done free for those who can't.",
    neighborhood: "Forest Grove",
    poster: {
      name: "Omar H.",
      bio: "Each of you should use whatever gift you have received to serve others, as faithful stewards of God's grace.",
    },
    likes: 84,
    favorites: 45,
    comments: 14,
  },
  {
    id: "open-to-requests",
    label: "Open to Requests",
    tagline: "Tell me what you need and I'll come.",
    icon: HelpCircle,
    tone: "purple",
    description:
      "Not sure what to call it? Say what you can offer, or what you need, and let a neighbor answer.",
    neighborhood: "Anywhere nearby",
    poster: {
      name: "City Ministers",
      bio: "And whatever you do, in word or deed, do everything in the name of the Lord Jesus, giving thanks to God.",
    },
    likes: 39,
    favorites: 18,
    comments: 12,
  },
  {
    id: "free-haircuts",
    label: "Free Haircuts",
    tagline: "A free haircut and a listening ear.",
    icon: Scissors,
    tone: "rose",
    description:
      "A fresh cut for someone who can't afford one right now. Clippers, scissors, and a listening ear.",
    neighborhood: "Rockwood",
    poster: {
      name: "Monica T.",
      bio: "Do not neglect to do good and to share what you have, for such sacrifices are pleasing to God.",
    },
    likes: 86,
    favorites: 41,
    comments: 16,
  },
  {
    id: "walk-your-dog",
    label: "Walk Your Dog",
    tagline: "Walk a dog, meet the neighbor on the porch.",
    icon: Dog,
    tone: "amber",
    description:
      "Take a neighbor's dog out when they're stuck at work, sick, or just need a hand.",
    neighborhood: "Lloyd District",
    poster: {
      name: "Jesse P.",
      bio: "A righteous man cares for the needs of his animal.",
    },
    likes: 64,
    favorites: 29,
    comments: 11,
  },
  {
    id: "feed-chickens",
    label: "Feed Chickens",
    tagline: "Watch a backyard flock while its owner is away.",
    icon: Bird,
    tone: "emerald",
    description:
      "Help a backyard flock owner with feeding, watering, and collecting eggs while they're away.",
    neighborhood: "Forest Grove",
    poster: {
      name: "Hank W.",
      bio: "Look at the birds of the air: they neither sow nor reap nor gather into barns, and yet your heavenly Father feeds them.",
    },
    likes: 51,
    favorites: 22,
    comments: 8,
  },
];

const placeByNeighborhood: Record<string, { city: string; zip: string }> = {
  "Beaverton, OR": { city: "Beaverton", zip: "97006" },
  "Beaverton Central": { city: "Beaverton", zip: "97005" },
  "Aloha, OR": { city: "Aloha", zip: "97078" },
  "Hillsboro, OR": { city: "Hillsboro", zip: "97124" },
  "Orenco Station": { city: "Hillsboro", zip: "97124" },
  "Forest Grove": { city: "Forest Grove", zip: "97116" },
  "Cedar Mill": { city: "Portland", zip: "97229" },
  "Rock Creek": { city: "Portland", zip: "97229" },
  "West Hills": { city: "Portland", zip: "97210" },
  "Downtown Portland": { city: "Portland", zip: "97204" },
  "Old Town": { city: "Portland", zip: "97209" },
  "Pearl District": { city: "Portland", zip: "97209" },
  "Lloyd District": { city: "Portland", zip: "97232" },
  "Hollywood District": { city: "Portland", zip: "97213" },
  "Southeast Division": { city: "Portland", zip: "97214" },
  "Ladd's Addition": { city: "Portland", zip: "97214" },
  "Sellwood": { city: "Portland", zip: "97202" },
  "St. Johns": { city: "Portland", zip: "97203" },
  "Tom McCall Waterfront": { city: "Portland", zip: "97204" },
  "Rockwood": { city: "Gresham", zip: "97030" },
  Gresham: { city: "Gresham", zip: "97030" },
  "Sandy River": { city: "Troutdale", zip: "97060" },
  Milwaukie: { city: "Milwaukie", zip: "97222" },
  Tigard: { city: "Tigard", zip: "97223" },
  "Anywhere nearby": { city: "Portland", zip: "97006" },
};

const ministryOrder = [
  "coffee-chat",
  "free-haircuts",
  "lend-a-book",
  "dine-out-in-public",
  "help-move-or-labor",
  "free-clothes",
  "dine-in-dinner-host",
  "clean-or-organize",
  "a-local-ride",
  "blind-date",
  "babysit",
  "host-prayer-praise-event",
  "game-nite-or-play-date",
  "community-service",
  "host-small-group-meeting",
  "fishing-or-camping",
  "reach-out-to-hurting",
  "buy-or-give-food",
  "romantic-double-date",
  "pray-with-or-for-someone",
  "host-homeless-or-rehab-person",
  "intellectual-talks",
  "artistic-abilities",
  "help-injured-or-handicap",
  "write-an-inmate",
  "help-with-handyman-services",
  "open-to-requests",
  "walk-your-dog",
  "feed-chickens",
  "volunteer-at-church",
];

export const ministries: Ministry[] = ministryOrder.map((id, i) => {
  const m = seed.find((s) => s.id === id)!;
  return {
    ...m,
    ...(placeByNeighborhood[m.neighborhood] ?? { city: "Portland", zip: "97006" }),
    distanceMi: Math.round((0.4 + ((i * 7) % 43) / 10) * 10) / 10,
  };
});

export const mapMinistries = ministries.filter((m) => m.position);

export type Scripture = { text: string; reference: string };

/**
 * Theological and historical reflection on why each ministry type matters,
 * keyed by ministry id. Shown above that ministry's scriptures.
 */
export const ministryReflections: Record<string, string[]> = {
  "coffee-chat": [
    "Scripture hands revelation to friendship before it hands it to an office. Jesus stopped calling the twelve servants and called them friends (John 15:15), and the oldest name given to Abraham was “friend of God” (James 2:23). God walked in a garden, ate at Abraham’s table, and taught twelve men on a road; the earliest believers carried that pattern into ordinary homes, “breaking bread… with glad and generous hearts” (Acts 2:46). The New Testament word for Christian hospitality is philoxenia — love of the stranger — and it is commanded of every household, not of a paid office. A coffee chat is that same invitation at its cheapest: one person willing to say “come” and stay while someone else talks. Luke 14 sets the guest list — the poor, the crippled, the lame, the blind — anyone with nothing to trade back.",
    "Peter tells believers to “always be prepared to make a defense to anyone who asks you for a reason for the hope that is in you, yet with gentleness and respect” (1 Peter 3:15). Defense is the legal word apologia: a reasoned reply to a real question, not a speech, and it assumes someone is near enough to ask. The same letter weaves that answer into ordinary good conduct “among the Gentiles” (1 Peter 2:12) and ties it to humility — “clothe yourselves with humility toward one another” (1 Peter 5:5) — so witness is never a claim to be above anyone. Even Peter’s own restoration came over a charcoal-fire breakfast and a question asked three times (John 21:9–17). The light in Matthew 5 is not argued for; it is simply not hidden. Two people talking honestly over coffee is a small, unembarrassed light — and out of it the gospel is preached plainly: God is near, and he is worth meeting.",
  ],
  "volunteer-at-church": [
    "The New Testament’s commonest word for Christian service is diakonia — waiting on people, table-service — and the first time it appears in an organized church, it is about food. “The daily distribution of food was being neglected,” so the apostles asked the crowd for “seven men of good repute, full of the Spirit and of wisdom,” and put them in charge of serving (Acts 6:2–4). Peter puts the whole gift system on the volunteer: “as each has received a gift, use it to serve one another, as good stewards of God’s varied grace” (1 Peter 4:10), and Paul insists the gifts exist “for the common good” (1 Corinthians 12:7).",
    "The ladder in the church runs downward. “Whoever would be great among you must be your servant… the Son of Man came not to be served but to serve” (Mark 10:43–45), and the Lord of the story “rose from supper, laid aside his garments, and girded himself with a towel” (John 13:4–5). So the volunteer who sets chairs, counts offerings, or wipes down the nursery is doing the job Jesus did, in the same order of importance. “Whatever you do, work heartily, as for the Lord and not for men, knowing that from the Lord you will receive the inheritance as your reward; you serve the Lord Christ” (Colossians 3:23–24). Nobody sees the hands that keep a church open — which is precisely the humility the gospel asks for.",
  ],
  "lend-a-book": [
    "The book that changed a nation is a borrowed one. “All Scripture is breathed out by God and profitable for teaching, for reproof, for correction, and for training in righteousness” (2 Timothy 3:16), and Isaiah says the written word “shall not return to me empty, but will accomplish what I desire” (Isaiah 55:11). The apostle who wrote most of the New Testament asked for reading material: “bring the book, especially the parchments” (2 Timothy 4:13) — Paul needed someone else’s scrolls. The earliest believers’ Bibles were manuscripts copied and carried hand to hand, and the faith travelled by lending.",
    "The New Testament’s own picture of a converted town is a shared text. The Bereans “received the word with all eagerness, examining the Scriptures daily to see if these things were so” (Acts 17:11) — a model of honest reading that expects the reader to check. In Acts 8, a man reading Isaiah aloud in a chariot is asked, “Do you understand what you are reading?” and Philip “beginning at this Scripture, preached Jesus to him” (Acts 8:30–35). Lending a book is the first half of that conversation: it puts the words in someone’s hands without a sermon attached, and says, read this, then tell me what you think. The Spirit does the rest, and the loan is the instrument.",
  ],
  "dine-out-in-public": [
    "Jesus drew his sharpest criticism at a table. “This man receives sinners and eats with them” (Luke 15:1–2), and his own opponents labelled him “a glutton and a drunkard, a friend of tax collectors and sinners” (Matthew 11:19). He answered by doing it more. The kingdom was announced at dinners — Zacchaeus’ house (Luke 19:5–9), Levi’s feast (Mark 2:15), an upstairs room before the cross — and Paul told believers that if an unbeliever invites you and you want to go, “eat whatever is set before you” (1 Corinthians 10:27). A public table is not a neutral place in Scripture; it is where reputations are spent on purpose. Dining out in public is simply refusing to let the church be the only room with food in it.",
    "Paul describes his own method as a kind of guesthood: “I have made myself a servant to all… I have become all things to all people, that I might by all means save some” (1 Corinthians 9:19–22), and then “give no offense… not seeking my own advantage but that of many, that they may be saved” (1 Corinthians 10:32–33). Eating where your neighbours eat makes you a guest in their world before you are a teacher in theirs, and a guest has to listen first. There is real humility in showing up without a program, in a booth, with no lights and no list. The gospel that comes out of that table is usually delivered in ordinary sentences, over ordinary food, by someone who stayed long enough to be asked an honest question.",
  ],
  "help-move-or-labor": [
    "Paul’s own hands were calloused. He “worked with his own hands” (Acts 18:3; 1 Corinthians 4:12) and could say to the Ephesian elders, “these hands have ministered to my necessities” (Acts 20:34), quoting Jesus: “it is more blessed to give than to receive” (Acts 20:35). Manual labor was never a lower calling; it is how the gospel earned its own wage and stayed free of charge. Paul’s command for the believer’s work is plain: “bear one another’s burdens, and so fulfill the law of Christ” (Galatians 6:2), and “whatever you do, work heartily, as for the Lord and not for men” (Colossians 3:23).",
    "The strongest picture of God in the Bible is a man with a towel. Jesus “rose from supper, laid aside his garments, and girded himself with a towel” and washed dirty feet (John 13:4–5) — a slave’s task, done by the one who “came not to be served but to serve” (Mark 10:45). Physical labor is that towel in a modern form: a couch up two flights of stairs, a truck backed in, a yard cleared before the movers arrive. There is no audience, and the sweat is the argument. The gospel this carries is not a slogan but an incarnation — “the Word became flesh and dwelt among us” (John 1:14), which in Greek reads “pitched his tent among us.” God got close enough to help move.",
  ],
  "free-clothes": [
    "The first mercy God performed after the fall was a garment: “the LORD God made for Adam and for his wife coats of skins and clothed them” (Genesis 3:21). Israel’s law then made clothing a legal claim on your neighbour’s closet — if you took a poor man’s cloak as security, “you shall surely restore to him the pledge… that he may sleep in his own cloak” (Deuteronomy 24:12–13), and the harvest’s leftovers belonged to the sojourner and the fatherless (Deuteronomy 24:19–21). Isaiah names covering the naked as the fast God chooses (Isaiah 58:7), and Jesus lists it beside feeding: “I was naked and you clothed me” (Matthew 25:36, 40).",
    "Clothing is the least glamorous gift and the one God made a command of, which is why it exposes faith so well. If a brother or sister is poorly clothed and lacking daily food, and one of you says “go in peace, be warmed and filled,” without giving what the body needs, “what does it profit?” (James 2:15–16). A folded shirt carries no lecture and demands no explanation. It says: you are not invisible, and the church is not a building you are outside of. “Whoever is generous to the poor lends to the LORD” (Proverbs 14:31). And the gospel behind it is older than any wardrobe — God clothed the first sinners himself, before they had anything to offer.",
  ],
  "dine-in-dinner-host": [
    "Paul puts hospitality on the ordinary believer’s timetable: “contribute to the needs of the saints, seek to show hospitality” (Romans 12:13), and the word behind it is philoxenia — love of the stranger. Hebrews 13:2 keeps the older story alive: “do not neglect to show hospitality to strangers, for thereby some have entertained angels unawares,” pointing back to Abraham at Mamre, who ran out to three strangers and spread a feast under a tree (Genesis 18:1–8). Jesus made the home his own pulpit — teaching at Levi’s table, and in the house of Martha and Mary, where he told the busy host that “only one thing is necessary” (Luke 10:38–42). The earliest churches had no buildings. They had dining rooms.",
    "The most important meals of the faith were hosted in homes: the last supper in a borrowed upper room (Mark 14:14–15; Luke 22), and the risen Jesus recognized “in the breaking of the bread” at Emmaus (Luke 24:30–31). So the host is not running an event; he is providing the room where Christ is known. That is why the guest list matters — “call the poor, the crippled, the lame, the blind… and you will be blessed, because they cannot repay you” (Luke 14:13–14) — and why the host’s own posture is a servant’s, washing feet before teaching (John 13:1–17). A dinner host gives away an evening, a table, and a little privacy, and in return a stranger is fed, listened to, and never quite a stranger again.",
  ],
  "clean-or-organize": [
    "Some of the Bible’s most important work is janitorial. When Josiah’s reform began, the money went “into the hands of the workmen who had the oversight of the house of the LORD” — “the carpenters and builders of the house of the LORD” — to repair the temple (2 Kings 22:3–7). The Levites’ job description included “having charge of the sanctuary” and “all manner of work of the service of the house of God” (1 Chronicles 23:28–32), and Nehemiah personally threw a misused room’s furniture out into the street before it could be used again (Nehemiah 13:8–9). Paul’s summary of the worshiping community is not improvisation but order: “all things should be done decently and in order” (1 Corinthians 14:40).",
    "The person who cleans is the reason a church can host anybody at all. Paul’s body metaphor is aimed exactly there: “the parts of the body that seem to be weaker are indispensable, and those parts of the body that we think less honorable we surround with greater honor” (1 Corinthians 12:22–24). Nobody applauds a swept floor, and that is the point — the reward of hidden work is that a stranger walks into a room that says he was expected. There is a quiet discipline in it too: “let us not grow weary of doing good” (Galatians 6:9). The gospel is served by mops and bins as really as by sermons, because the Lord who washed feet told his people to do the same low job (John 13:14–15).",
  ],
  "a-local-ride": [
    "The one story Jesus told to define “neighbour” is a rescue that needed a vehicle. A Samaritan “saw him, and he came to him, and bound his wounds… and setting him on his own animal, brought him to an inn and took care of him,” paying his own money for the stranger’s lodging and promising to cover any extra bill (Luke 10:30–35). Israel’s law had already made the stranger a claim on your protection: “you shall love him, for you were sojourners in the land of Egypt” (Deuteronomy 10:19). The gospel’s own travels were borrowed wheels — a donkey into Jerusalem, a boat across a lake, an upper room somebody else had furnished.",
    "The early church expected its traveling workers to be carried and funded by ordinary households: “you do faithfully whatever you do for the brothers, when they travel to strange places… we ought to support such men” (3 John 1:5–8), and Phoebe is called a prostatis — patron, helper, sponsor — “of many” (Romans 16:1–2). A ride is that same patronage at the lowest price: keys, gas, a waiting hour. It says, you matter enough for me to leave my house twice. The humility of it is real — you are a driver, not a guest speaker, and the conversation is whatever the passenger wants — and that low position is where good news usually arrives, because the person in the passenger seat has just been helped by someone with no reason to bother.",
  ],
  "blind-date": [
    "The Bible’s first recorded arranged meeting happens at a well. Abraham’s servant is sent ahead with a prayer: let the young woman who says “drink, and I will water your camels also” be the one God has appointed for Isaac — and Rebekah does exactly that, drawing water for ten thirsty camels (Genesis 24:14–21). The result is not a romance of impulse but a family’s discernment, a blessing spoken over a woman, and a man who “brought her into the tent of Sarah his mother and was comforted after his mother’s death” (Genesis 24:67). Scripture’s own proverb is blunt: “he who finds a wife finds a good thing and obtains favor from the LORD” (Proverbs 18:22).",
    "The Song of Songs gives marriage its own language of delight — “let him kiss me with the kisses of his mouth,” “love is as strong as death, many waters cannot quench it” (Song of Songs 1:2; 8:6–7) — and Paul puts the church’s own story in the same frame: “Christ loved the church and gave himself up for her” (Ephesians 5:25). A community that introduces single believers to each other is playing the servant at the well: doing the asking, the vouching, the walking-over, and then getting out of the way. And it keeps purity a shared practice rather than a private test — “treat younger women as sisters, with absolute purity” (1 Timothy 5:2). The matchmaker’s work is hidden, and hidden service is the kind Jesus praised.",
  ],
  "babysit": [
    "Children were brought to Jesus and the disciples rebuked the people bringing them. Jesus was indignant: “let the children come to me; do not hinder them, for to such belongs the kingdom of God” (Mark 10:14), and “whoever receives one such child in my name receives me” (Matthew 18:5). God describes his own care in a nursing mother’s terms: “can a woman forget her nursing child, that she should have no compassion on the son of her womb? Even these may forget, yet I will not forget you” (Isaiah 49:15). Hannah gave back the child she had prayed for, and “she worshiped the LORD there” (1 Samuel 1:28).",
    "Babysitting is ministry to the parents. A young mother cannot get to a prayer meeting, a counseling appointment, or a job interview because there is no one to stay. Paul’s teaching on the body was written for exactly this: “the parts of the body that seem to be weaker are indispensable… that there may be no division in the body” (1 Corinthians 12:22–25). The work is unpaid, unseen, and repeated — the widow’s two coins (Mark 12:44) multiplied into a hundred evenings. And the children are not a burden moved from room to room; they are the citizens of the kingdom Jesus insisted on holding (Mark 10:16). The one who watches them is doing a deacon’s work.",
  ],
  "host-prayer-praise-event": [
    "Praise is not a warm-up in Scripture; it is where God has chosen to be. “You are holy, enthroned on the praises of Israel” (Psalm 22:3). At the temple’s dedication “the trumpeters and singers joined in praise… and the glory of the LORD filled the house of God” (2 Chronicles 5:13–14). Paul and Silas “were praying and singing hymns to God, and the prisoners were listening to them,” and the night ended with a jailer’s household baptized (Acts 16:25–34). Paul’s instruction for a gathered church is to “teach and admonish one another… singing psalms and hymns and spiritual songs, with thankfulness in your hearts to God” (Colossians 3:16).",
    "The reason a room is needed is that Jesus attached himself to gathering: “where two or three are gathered in my name, there am I among them” (Matthew 18:20), and the earliest believers “did not cease to teach and preach” publicly and from house to house (Acts 5:42). So the host does something real by opening a room, arranging chairs, and handing out a microphone — he is building the place God has promised to meet. The songs the church sings are doctrine set to music: the earliest Christian hymn is the one Paul quotes about Christ’s humiliation and exaltation (Philippians 2:6–11). And the New Testament’s plainest word about meeting is not to skip it: “not neglecting to meet together, but encouraging one another” (Hebrews 10:25).",
  ],
  "game-nite-or-play-date": [
    "Scripture is not shy about play. “A time to weep, and a time to laugh; a time to mourn, and a time to dance” (Ecclesiastes 3:4); “a joyful heart is good medicine, but a crushed spirit dries up the bones” (Proverbs 17:22). Israel’s calendar was built from feasts and games — harvest, lots cast at Purim, booths on roofs. Jesus’ first sign happened at a wedding party, and the host’s complaint there was about wine, not decorum (John 2:1–11). Nehemiah stopped a rebuilding crew mid-wall to say “the joy of the LORD is your strength” (Nehemiah 8:10). Even the games of the stadium became a picture of discipleship: “run in such a way as to get the prize” (1 Corinthians 9:24–27).",
    "A game night is also a way of telling the truth without a lecture. “Iron sharpens iron, and one man sharpens another” (Proverbs 27:17) — and you learn a person fast at a table: how he handles losing, how he treats the beginner, whether he cheats when nobody is watching. Paul’s rule covers the whole evening: “whatever you eat or drink, or whatever you do, do all to the glory of God” (1 Corinthians 10:31). And when the earliest believers ate and met together, the note the record keeps is “glad and generous hearts” (Acts 2:46). Play removes the costume. Two people laughing over a board are no longer performing, and the conversation that follows is honest enough to carry something about God.",
  ],
  "community-service": [
    "Exile gave Israel a civic command: “seek the welfare of the city where I have sent you into exile, and pray to the LORD on its behalf, for in its welfare you will find your welfare” (Jeremiah 29:7). Micah compresses the whole law into three verbs — “do justice, love kindness, and walk humbly with your God” (Micah 6:8). James calls unglamorous visitation “pure religion and undefiled before God the Father: to visit orphans and widows in their affliction” (James 1:27), and John will not allow a verbal faith: “let us not love in word or talk but in deed and in truth” (1 John 3:18). Paul tells Titus to “devote themselves to caring for the needs of everyday life” (Titus 3:14).",
    "The church’s good works began as its reputation. The apostles created a paid service for neglected widows (Acts 6:1–7), and Paul carried a collection from Gentile congregations to the poor of Jerusalem so that “your abundance at the present time should supply their need” (2 Corinthians 8:14). Salt and light are both public and useful: “let your light shine before others, so that they see your good deeds and glorify your Father in heaven” (Matthew 5:16). A community service day does the same thing quietly — a park cleared, a family’s yard mowed, a shelter fed — and the neighbour learns something about God before he learns the word for it, because “whoever is generous to the poor lends to the LORD” (Proverbs 14:31).",
  ],
  "host-small-group-meeting": [
    "The church described in Acts had no buildings; it had homes. “They devoted themselves to the apostles’ teaching and the fellowship, to the breaking of bread and the prayers… day by day, attending the temple together and breaking bread in their homes” (Acts 2:42–46), and “in the temple and by house to house they did not cease to teach” (Acts 5:42). Paul’s letters name the actual rooms: “Nympha and the church in her house” (Colossians 4:15), “the church in your house” (Philemon 1:2). The upper room Jesus asked for — “a large upper room furnished and ready” (Mark 14:15) — was somebody’s spare space, and from it came the first communion.",
    "The host’s role comes before the teaching. Jesus washed his disciples’ feet before he explained anything (John 13:1–17), and the host is the one who does the washing — the kettle, the chairs, the childcare, the door held open for the person who knows nobody there. That is why the guest list matters: “call the poor, the crippled, the lame, the blind… they cannot repay you” (Luke 14:13–14), and “do not neglect to do good and to share what you have, for such sacrifices are pleasing to God” (Hebrews 13:16). A small group in a living room is the smallest form of a church, and the person who opens the door is the reason it exists at all.",
  ],
  "fishing-or-camping": [
    "Jesus called fishermen while they were fishing. “Follow me, and I will make you fishers of men,” he said as he passed by and saw them casting a net (Mark 1:16–19). After the resurrection he found the same men on the Sea of Tiberias on an ordinary fishing trip, where “they found a fire of burning coals there, and a fish laid upon it,” and he cooked breakfast (John 21:3–9). Creation is Scripture’s own second book: “the heavens declare the glory of God” (Psalm 19:1), and “he has made everything beautiful in its time” (Ecclesiastes 3:11).",
    "God keeps leading people out to talk. “I will now allure her, and lead her into the wilderness, and speak tenderly to her” (Hosea 2:14). Abraham lived in tents as a sojourner (Hebrews 11:9), Israel carried a tent of meeting through a desert (Exodus 25:8), and Peter calls his readers “sojourners and exiles” (1 Peter 2:11). A campfire or a boat does what a sermon cannot: it takes the noise down. Nobody is performing on the water, and a conversation that starts about a knot or a fish can end somewhere it could never have gone in a building. The gospel that comes out of a fishing trip is usually the one about someone who drew near and walked with you, and asked a question you did not expect (Luke 24:15–17).",
  ],
  "reach-out-to-hurting": [
    "Three stories in Luke 15 are told to people annoyed that Jesus welcomed the broken: a lost sheep carried home on the shoulders, a lost coin searched for “until she finds it,” and a father who “saw him while he was still far off, and was moved with compassion, ran and embraced him.” Jesus’ own summary: “the Son of Man came to seek and to save the lost” (Luke 19:10), and “those who are well have no need of a physician, but those who are sick” (Matthew 9:12). The Old Testament’s God is the same one: “my heart turns within me; my compassion grows together” (Hosea 11:8).",
    "The church is asked to be the running father. “Weep with those who weep” (Romans 12:15); “encourage the discouraged, help the weak, be patient with them all” (1 Thessalonians 5:14); “the God of all comfort… who comforts us in all our affliction, so that we may be able to comfort those who are in any affliction” (2 Corinthians 1:3–4). Reaching out to the hurt is costly because it is unglamorous and slow — a text sent into silence, a ride nobody asked for, a name remembered months later. And the reward is not a convert’s story but a person who finally believes God is near. “As we have opportunity, let us do good to everyone” (Galatians 6:10).",
  ],
  "buy-or-give-food": [
    "Israel’s welfare law was written in food. “You shall open your hand wide to your brother who is poor and needy” (Deuteronomy 15:7–11), and the harvest itself was legislated to leak: the forgotten sheaf, the leftover olives, the unfinished grape harvest were left for the sojourner, the fatherless and the widow (Deuteronomy 24:19–21). Isaiah names the fast God actually wants — “if you spend yourself on the hungry and satisfy the afflicted soul” (Isaiah 58:10) — and Proverbs says “whoever has a generous eye will be blessed, for he gives his bread to the poor” (Proverbs 22:9). Jesus tied himself to the food line: “I was hungry and you gave me food… as you did it to one of the least of these, you did it to me” (Matthew 25:35, 40).",
    "Food was also the church’s first administrative problem. “The daily distribution of food was being neglected,” so seven Spirit-filled men were appointed over it (Acts 6:1–7), and the word for that service is diakonia — ministry. Paul organized a multi-church collection for the poor of Jerusalem on a principle of “fair balance” (2 Corinthians 8:13–15). Giving food rather than money keeps the gift embodied: somebody carries something, somebody eats. And it points past itself, because Jesus called himself “the bread of life” (John 6:35, 48–51). The neighbour who is fed a real meal by a real neighbour is being told something about God before anyone has quoted a verse at him.",
  ],
  "romantic-double-date": [
    "Scripture celebrates romantic love without embarrassment: “let him kiss me with the kisses of his mouth… for your love is better than wine” (Song of Songs 1:2), and “set me as a seal upon your heart, for love is as strong as death; many waters cannot quench love” (Song of Songs 8:6–7). It also warns that love needs company and a cord: “a threefold cord is not quickly broken” (Ecclesiastes 4:12), and “one man sharpens another” (Proverbs 27:17). The New Testament’s own picture of the church is a wedding — “Christ loved the church and gave himself up for her” (Ephesians 5:25) — so how a couple is courted is never merely private.",
    "A double date is a small fellowship of two. “Let us consider how to stir one another up to love and good works, not neglecting to meet together, but encouraging one another” (Hebrews 10:24–25) applies as much to a table of four as to a pew. Paul’s instruction to young men is remarkably practical: “treat younger women as sisters, with absolute purity” (1 Timothy 5:2) — a shared outing makes that easier than a private one, and it lets two couples ask the questions a couple should not have to ask alone: what do you believe, where are you going, what are you not willing to risk. Witness here is not a speech; it is a table where a couple can be honest without being alone.",
  ],
  "pray-with-or-for-someone": [
    "Scripture is full of people praying for other people, and it is blunt about how much that counts. “The prayer of a righteous person has great power as it is working. Elijah was a man with a nature like ours” (James 5:16–17); “pray at all times in the Spirit” (Ephesians 6:18); “if two of you agree on earth about anything they ask, it will be done for them by my Father in heaven” (Matthew 18:19). Abraham once argued a city’s life out of God, asking six times for mercy on the guilty (Genesis 18:22–33), and Moses is said to have “stood in the breach” so that wrath would not destroy the people (Psalm 106:23).",
    "The church’s own memory is a chain of answered intercession. Job’s friends were told, “my servant Job shall pray for you” (Job 42:8); the church “earnestly prayed to God for him” when Peter sat in a cell, and he was walked past the guard post (Acts 12:5, 12); and even now the risen Christ “always lives to make intercession” for us (Hebrews 7:25), while the Spirit “intercedes with groanings too deep for words” when we do not know what to say (Romans 8:26–27). Praying with somebody is the least expensive miracle available: it costs a few minutes, requires no skill, and can be done by anyone. And it leaves two people in the same room with the same hope, which is what a witness is.",
  ],
  "host-homeless-or-rehab-person": [
    "“I was a stranger and you took me in” (Matthew 25:35) is one of the few things Jesus says about himself that can be done to him physically, and he counts it as done to his own body (Matthew 25:40). Israel’s law made the resident alien a legal neighbour: “the sojourner who resides with you shall be to you as the native among you, and you shall love him as yourself, for you were sojourners in the land of Egypt” (Leviticus 19:34). Hebrews extends the table into the cell: “remember those who are in prison, as though in prison with them” (Hebrews 13:3). The gospel itself began in a borrowed room with no bed available (Luke 2:7).",
    "Restoration is a biblical plotline, not a slogan. Joshua the high priest stands in filthy garments and is told, “I have caused your iniquity to pass from you, and I have clothed you with rich apparel” (Zechariah 3:3–5). The man from the tombs is found “dressed, in his right mind,” and sent home to tell what had happened (Mark 5:15–20). Onesimus the runaway is to be received “no longer as a slave, but better than a slave, as a beloved brother” (Philemon 1:16). “Receive one another, therefore, as Christ has received you” (Romans 15:7). Opening a home to someone without housing, or fresh out of rehab, is that plotline made of a spare room and a door you leave unlocked — a person is re-clothed, re-named, and re-sent.",
  ],
  "intellectual-talks": [
    "Paul’s own method with honest questioners was not a lecture. In Thessalonica he “reasoned with them from the Scriptures, opening and setting forth that the Christ had to suffer and rise from the dead” (Acts 17:2–3), and in Ephesus for two years he “discussed daily in the lecture hall of Tyrannus” (Acts 19:9) — a rented room, a daily habit, an open question time. The Bereans are praised because “they examined the Scriptures daily to see if these things were so” (Acts 17:11). Paul’s demand is intellectual maturity, not credulity: “do not be children in your thinking; be infants in evil, but in your thinking be mature” (1 Corinthians 14:20).",
    "Wisdom in Proverbs sets a table with wine on it: “come, eat of my bread and drink of the wine I have mixed; leave off simple ones, and live” (Proverbs 9:5–6), and “she is a tree of life to those who take hold of her” (Proverbs 3:18). Wine itself is no scandal in Scripture — Jesus’ first sign was at a party (John 2:1–11), and “wine gladdens the heart of man” (Psalm 104:15). The church’s deepest teaching often grew out of small-group talk: Augustine’s earliest writings are dialogues with friends and students on a short retreat. A reasoned conversation over a glass is apologia in its plainest form — “a defense… with gentleness and respect” (1 Peter 3:15) — and the person who asks the hard question is closer than the one who never asks.",
  ],
  "artistic-abilities": [
    "The first person the Bible says was “filled with the Spirit of God” is not a preacher; he is an artist. Bezalel is filled “with ability, with intelligence, with knowledge, and with all craftsmanship, to devise artistic designs,” and the same Spirit equips the women who spin goat hair (Exodus 31:1–5; 35:25–26). Israel’s worship was staffed by musicians: David “set apart… Asaph, Heman, and Jeduthun, who prophesied with lyres, harps, and cymbals” (1 Chronicles 25:1), and Saul was eased from a tormenting spirit when David played the harp (1 Samuel 16:23).",
    "The Psalms are the Bible’s own songbook, and they keep asking for something new: “sing to the LORD a new song; sing to the LORD, all the earth” (Psalm 96:1), and Revelation’s redeemed crowd “sings a new song” (Revelation 5:9). The command on the artist is the one given to everyone else: “whatever you do, work heartily, as for the Lord and not for men” (Colossians 3:23). And the caution is built into the gift: the same gold that made the Ark also made the calf (Exodus 32), so beauty can carry God or replace him. A church that fills its room with paintings, songs, poems, and photographs is telling its neighbours something a sermon cannot: God is beautiful, and he is worth making things for.",
  ],
  "help-injured-or-handicap": [
    "The neighbour Jesus defines is the one who stopped for a bleeding stranger. The priest and the Levite passed, but a Samaritan “saw him and was moved with compassion; he came to him and bound his wounds, pouring on oil and wine,” then carried him to safety and paid for his care (Luke 10:33–35). Israel’s law protected the disabled specifically: “you shall not curse the deaf or put a stumbling block before the blind, but you shall fear your God: I am the LORD” (Leviticus 19:14). And David kept a crippled man at his own table for life: Mephibosheth, lame in both feet, “ate at the king’s table, like one of the king’s sons” (2 Samuel 9:13).",
    "Paul’s rule for a body is that the injured member is not optional: “the parts of the body that seem to be weaker are indispensable” (1 Corinthians 12:22). Jesus met a man born blind and refused the easy explanation — “neither this man sinned, nor his parents, but the works of God were to be displayed in his life” (John 9:3) — and after the resurrection he kept his wounds where a doubting friend could put a finger in them (John 20:27). Helping an injured or disabled neighbour is therefore not charity from above; it is a body tending itself. The work is physical and often unglamorous, and the Lord who washed feet sits with the ones who do it (John 13:14–15).",
  ],
  "write-an-inmate": [
    "Two of Jesus’ plainest words about himself are about prisoners: “I was in prison, and you came to me” (Matthew 25:36), and when honest people ask when, he answers, “as you did it to one of the least of these my brothers, you did it to me” (Matthew 25:40). Hebrews makes it an obligation on the church’s memory: “remember those who are in prison, as though in prison with them, since you also are in the body” (Hebrews 13:3). Paul, who wrote Ephesians, Philippians, Colossians and Philemon from a cell, counted “in prisons more frequently” as an ordinary credential of ministry (2 Corinthians 6:5).",
    "A letter is a biblical instrument of freedom. Philemon is a one-page letter from a prisoner asking a church to receive a runaway as a brother (Philemon 1:10–17). Acts 16 has a jailer’s household turned the same night Paul and Silas sang at midnight (Acts 16:25–34), and Psalm 142 is a prayer from inside a pit: “bring my soul out of prison, that I may give thanks to your name” (Psalm 142:7). Writing costs a stamp and an hour, and it reaches a person whose world has been narrowed to a cell and a number. It says, you are still known outside these walls — and the God who “proclaims release to the captives” (Isaiah 61:1) is the one the letter is really from.",
  ],
  "help-with-handyman-services": [
    "The most quoted line about Jesus in his hometown was about his trade: “Is not this the carpenter?” (Mark 6:3). The Word of God spent thirty years in a village workshop, and the first people Scripture says were filled with the Spirit of God were craftsmen — Bezalel, “with ability, with intelligence, with knowledge, and with all craftsmanship,” with Oholiab beside him (Exodus 31:1–5). Israel’s repairs were done by hired hands: the money was given “to the carpenters and builders of the house of the LORD” (2 Kings 22:6), and Nehemiah’s wall rose gate by gate, each family building the section next to its own door (Nehemiah 3).",
    "A handyman’s witness is a fixed hinge. Paul asks for exactly this quietness: “aspire to live quietly, and to mind your own affairs, and to work with your hands… so that you may walk properly before outsiders and be dependent on no one” (1 Thessalonians 4:11–12). The work is small and the effect is not — a door that locks, a stair rail that holds, a bathroom where an old man can stand up without fear. “Whatever you do, work heartily, as for the Lord” (Colossians 3:23). And the Scripture that ends up describing the worker is the one Jesus applied to himself: “the stone that the builders rejected has become the cornerstone” (Psalm 118:22).",
  ],
  "open-to-requests": [
    "The New Testament’s portrait of an ordinary believer is a woman with a sewing basket. “In Joppa there was a disciple named Tabitha… she was full of good works and acts of charity,” and when she died the widows “stood by weeping, and showed all the coats and garments which Dorcas used to make while she was with them” (Acts 9:36–39). Paul’s summary of the Christian life is the same: “as each has received a gift, use it to serve one another, as good stewards of God’s varied grace” (1 Peter 4:10), and “give to the one who begs from you” (Matthew 5:42).",
    "Saying “I am available” is the hardest form of faith, because you do not know what you are agreeing to. Paul built his whole ethic on the one-another commands — “through love serve one another” (Galatians 5:13), “outdo one another in showing honor” (Romans 12:10) — and made the body’s survival depend on mutual need, “that there may be no division in the body” (1 Corinthians 12:25). Jesus made the first place the last seat: “if anyone would be first, he must be last of all and servant of all” (Mark 9:35). An open request list is a widow’s two coins offered before you know what they will cover (Mark 12:44), and it lets God spend your evening on someone you have not met yet.",
  ],
  "free-haircuts": [
    "Hair is a biblical subject, and not by accident. The Nazirite let his hair grow uncut as an outward sign that he was “holy to the LORD” (Numbers 6:1–21), and Samson’s unshorn head was the visible token of a vow (Judges 16:17). Mephibosheth’s untrimmed beard was how Jerusalem read his grief (2 Samuel 19:24). The prophet’s correction to a culture obsessed with appearance still stands: “man looks on the outward appearance, but the LORD looks on the heart” (1 Samuel 16:7). A haircut is a small, physical dignity — the kind of mercy James calls “pure and undefiled” when it visits the orphan and the widow (James 1:27).",
    "The barber’s chair is the one seat where a person sits still, is handled without being harmed, and is listened to. That is why it is ministry: Paul’s body teaches that “the parts of the body that seem to be weaker are indispensable” (1 Corinthians 12:22–24), and nobody is weaker, or more indispensable, than the man who cannot pay for a haircut and cannot get a job without one. No sermon is required in the chair, and none should be forced — the scissors do the talking, and trust is built one visit at a time. Then the question comes naturally, and the answer is the one Peter told us to be ready for: a reason for the hope that is in us, “with gentleness and respect” (1 Peter 3:15).",
  ],
  "walk-your-dog": [
    "The oldest scene of God meeting people is a walk: “they heard the sound of the LORD God walking in the garden in the cool of the day” (Genesis 3:8). Israel’s command to teach the faith was a walking command: “you shall talk of them when you sit in your house, and when you walk in the way, and when you lie down, and when you rise” (Deuteronomy 6:7). The Bible even expects the righteous to be practical about animals: “the righteous cares for the life of his beast” (Proverbs 12:10). Micah’s summary of the godly life is a walk too — “to walk humbly with your God” (Micah 6:8).",
    "The New Testament’s favorite word for how a Christian lives is peripateo — to walk. “Walk as children of light” (Ephesians 5:8); “walk in the Spirit” (Galatians 5:16). A dog walk is the most repetitive version of that word: the same route, the same hour, the same faces, week after week. That repetition is the ministry. It is the neighbour who notices the family that moved in on the corner, the man whose limp is worse than last month, the woman who is always alone on the bench — and who is therefore around when something goes wrong. Paul wanted exactly this unremarkable presence: “aspire to live quietly… so that you may walk properly before outsiders” (1 Thessalonians 4:12). Nothing is announced from a leash, and everything is being built.",
  ],
  "feed-chickens": [
    "The first job description in the Bible is husbandry: “the LORD God took the man and put him in the garden of Eden to work it and keep it” (Genesis 2:15), and the blessing on the first humans included the animals’ welfare (Genesis 1:28). Jesus pointed at the chickens and the sparrows to make a point about anxiety: “look at the birds of the air: they neither sow nor reap nor gather into barns, and yet your heavenly Father feeds them” (Matthew 6:26). Psalm 104 says the same from God’s side — “you give them their food in due season; you open your hand, you satisfy the desire of every living thing” (Psalm 104:27–28) — and Proverbs makes it wisdom: “know well the condition of your flocks” (Proverbs 27:23).",
    "Feeding something alive is the oldest form of the faithfulness Scripture keeps asking for. Paul used a farm animal to argue for the support of gospel workers: “you shall not muzzle an ox when it treads out the grain. Is it for the oxen that God cares? Certainly he cares for us” (1 Corinthians 9:9–10) — the principle of the crumb and the trough is a theological principle. And the God of the Bible uses hens for himself: “how often would I have gathered your children together as a hen gathers her brood under her wings, and you were not willing” (Matthew 23:37). Caring for animals is a small rehearsal of the new creation, when creation itself “will be set free from its bondage to corruption” (Romans 8:21).",
  ],
};

/** Bible passages (ESV) that highlight each ministry type, keyed by ministry id. */
export const ministryScriptures: Record<string, Scripture[]> = {
  "coffee-chat": [
    {
      text: "And let us consider how to stir up one another to love and good works, not neglecting to meet together, as is the habit of some, but encouraging one another…",
      reference: "Hebrews 10:24–25",
    },
    {
      text: "Two are better than one, because they have a good reward for their toil. For if they fall, one will lift up his fellow.",
      reference: "Ecclesiastes 4:9–10",
    },
  ],
  "volunteer-at-church": [
    {
      text: "As each has received a gift, use it to serve one another, as good stewards of God's varied grace.",
      reference: "1 Peter 4:10",
    },
    {
      text: "Therefore, my beloved brothers, be steadfast, immovable, always abounding in the work of the Lord, knowing that in the Lord your labor is not in vain.",
      reference: "1 Corinthians 15:58",
    },
  ],
  "lend-a-book": [
    {
      text: "All Scripture is breathed out by God and profitable for teaching, for reproof, for correction, and for training in righteousness.",
      reference: "2 Timothy 3:16",
    },
    {
      text: "The beginning of wisdom is this: Get wisdom, and whatever you get, get insight.",
      reference: "Proverbs 4:7",
    },
  ],
  "dine-out-in-public": [
    {
      text: "And day by day, attending the temple together and breaking bread in their homes, they received their food with glad and generous hearts.",
      reference: "Acts 2:46",
    },
    {
      text: "When you give a feast, invite the poor, the crippled, the lame, the blind, and you will be blessed, because they cannot repay you.",
      reference: "Luke 14:13–14",
    },
  ],
  "help-move-or-labor": [
    {
      text: "Bear one another's burdens, and so fulfill the law of Christ.",
      reference: "Galatians 6:2",
    },
    {
      text: "But if anyone has the world's goods and sees his brother in need, yet closes his heart against him, how does God's love abide in him? Little children, let us not love in word or talk but in deed and in truth.",
      reference: "1 John 3:17–18",
    },
  ],
  "free-clothes": [
    {
      text: "Is it not to share your bread with the hungry and bring the homeless poor into your house; when you see the naked, to cover him, and not to hide yourself from your own flesh?",
      reference: "Isaiah 58:7",
    },
    {
      text: "For I was hungry and you gave me food, I was thirsty and you gave me drink, I was a stranger and you welcomed me, I was naked and you clothed me…",
      reference: "Matthew 25:35–36",
    },
  ],
  "dine-in-dinner-host": [
    {
      text: "Contribute to the needs of the saints and seek to show hospitality.",
      reference: "Romans 12:13",
    },
    {
      text: "Do not neglect to show hospitality to strangers, for thereby some have entertained angels unawares.",
      reference: "Hebrews 13:2",
    },
  ],
  "clean-or-organize": [
    {
      text: "Truly, I say to you, as you did it to one of the least of these my brothers, you did it to me.",
      reference: "Matthew 25:40",
    },
    {
      text: "Do nothing from selfish ambition or conceit, but in humility count others more significant than yourselves. Let each of you look not only to his own interests, but also to the interests of others.",
      reference: "Philippians 2:3–4",
    },
  ],
  "a-local-ride": [
    {
      text: "So then, as we have opportunity, let us do good to everyone, and especially to those who are of the household of faith.",
      reference: "Galatians 6:10",
    },
    {
      text: "Contribute to the needs of the saints and seek to show hospitality.",
      reference: "Romans 12:13",
    },
  ],
  "blind-date": [
    {
      text: "Iron sharpens iron, and one man sharpens another.",
      reference: "Proverbs 27:17",
    },
    {
      text: "Love is patient and kind; love does not envy or boast; it is not arrogant or rude.",
      reference: "1 Corinthians 13:4–5",
    },
  ],
  babysit: [
    {
      text: "Let the little children come to me and do not hinder them, for to such belongs the kingdom of heaven.",
      reference: "Matthew 19:14",
    },
    {
      text: "Behold, children are a heritage from the Lord, the fruit of the womb a reward.",
      reference: "Psalm 127:3",
    },
  ],
  "host-prayer-praise-event": [
    {
      text: "Make a joyful noise to the Lord, all the earth! Serve the Lord with gladness! Come into his presence with singing!",
      reference: "Psalm 100:1–2",
    },
    {
      text: "And day by day, attending the temple together and breaking bread in their homes, they received their food with glad and generous hearts, praising God and having favor with all the people.",
      reference: "Acts 2:46–47",
    },
  ],
  "game-nite-or-play-date": [
    {
      text: "Let no one despise you for your youth, but set the believers an example in speech, in conduct, in love, in faith, in purity.",
      reference: "1 Timothy 4:12",
    },
    {
      text: "Train up a child in the way he should go; even when he is old he will not depart from it.",
      reference: "Proverbs 22:6",
    },
  ],
  "community-service": [
    {
      text: "For you were called to freedom, brothers. Only do not use your freedom as an opportunity for the flesh, but through love serve one another.",
      reference: "Galatians 5:13",
    },
    {
      text: "For even the Son of Man came not to be served but to serve, and to give his life as a ransom for many.",
      reference: "Mark 10:45",
    },
  ],
  "host-small-group-meeting": [
    {
      text: "For where two or three are gathered in my name, there am I among them.",
      reference: "Matthew 18:20",
    },
    {
      text: "And let us consider how to stir up one another to love and good works, not neglecting to meet together, as is the habit of some, but encouraging one another…",
      reference: "Hebrews 10:24–25",
    },
  ],
  "fishing-or-camping": [
    {
      text: "And Jesus said to them, “Follow me, and I will make you become fishers of men.”",
      reference: "Mark 1:17",
    },
    {
      text: "The heavens declare the glory of God, and the sky above proclaims his handiwork.",
      reference: "Psalm 19:1",
    },
  ],
  "reach-out-to-hurting": [
    {
      text: "Blessed be the God and Father of our Lord Jesus Christ, the Father of mercies and God of all comfort, who comforts us in all our affliction, so that we may be able to comfort those who are in any affliction, with the comfort with which we ourselves are comforted by God.",
      reference: "2 Corinthians 1:3–4",
    },
    {
      text: "The Lord is near to the brokenhearted and saves the crushed in spirit.",
      reference: "Psalm 34:18",
    },
  ],
  "buy-or-give-food": [
    {
      text: "Whoever has a bountiful eye will be blessed, for he shares his bread with the poor.",
      reference: "Proverbs 22:9",
    },
    {
      text: "If a brother or sister is poorly clothed and lacking in daily food, and one of you says to them, “Go in peace, be warmed and filled,” without giving them the things needed for the body, what good is that?",
      reference: "James 2:15–16",
    },
  ],
  "romantic-double-date": [
    {
      text: "And though a man might prevail against one who is alone, two will withstand him—a threefold cord is not quickly broken.",
      reference: "Ecclesiastes 4:12",
    },
    {
      text: "What therefore God has joined together, let not man separate.",
      reference: "Mark 10:9",
    },
  ],
  "pray-with-or-for-someone": [
    {
      text: "Therefore, confess your sins to one another and pray for one another, that you may be healed. The prayer of a righteous person has great power as it is working.",
      reference: "James 5:16",
    },
    {
      text: "Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God.",
      reference: "Philippians 4:6",
    },
  ],
  "host-homeless-or-rehab-person": [
    {
      text: "Is it not to share your bread with the hungry and bring the homeless poor into your house; when you see the naked, to cover him, and not to hide yourself from your own flesh?",
      reference: "Isaiah 58:7",
    },
    {
      text: "Truly, I say to you, as you did it to one of the least of these my brothers, you did it to me.",
      reference: "Matthew 25:40",
    },
  ],
  "intellectual-talks": [
    {
      text: "Now these Jews were more noble than those in Thessalonica; they received the word with all eagerness, examining the Scriptures daily to see if these things were so.",
      reference: "Acts 17:11",
    },
    {
      text: "It is the glory of God to conceal things, but the glory of kings is to search things out.",
      reference: "Proverbs 25:2",
    },
  ],
  "artistic-abilities": [
    {
      text: "And I have filled him with the Spirit of God, with ability and intelligence, with knowledge and all craftsmanship, to devise artistic designs, to work in gold, silver, and bronze, in cutting stones for setting, and in carving wood, to work in every craft.",
      reference: "Exodus 31:3–5",
    },
    {
      text: "Whatever you do, work heartily, as for the Lord and not for men.",
      reference: "Colossians 3:23",
    },
  ],
  "help-injured-or-handicap": [
    {
      text: "But a Samaritan, as he journeyed, came to where he was, and when he saw him, he had compassion. He went to him and bound up his wounds… Then he set him on his own animal and brought him to an inn and took care of him.",
      reference: "Luke 10:33–34",
    },
    {
      text: "Bear one another's burdens, and so fulfill the law of Christ.",
      reference: "Galatians 6:2",
    },
  ],
  "write-an-inmate": [
    {
      text: "I was naked and you clothed me, I was sick and you visited me, I was in prison and you came to me.",
      reference: "Matthew 25:36",
    },
    {
      text: "The Lord sets the prisoners free; the Lord opens the eyes of the blind. The Lord lifts up those who are bowed down.",
      reference: "Psalm 146:7–8",
    },
  ],
  "help-with-handyman-services": [
    {
      text: "And let us not grow weary of doing good, for in due season we will reap, if we do not give up.",
      reference: "Galatians 6:9",
    },
    {
      text: "Whatever you do, work heartily, as for the Lord and not for men.",
      reference: "Colossians 3:23",
    },
  ],
  "open-to-requests": [
    {
      text: "Let each of you look not only to his own interests, but also to the interests of others.",
      reference: "Philippians 2:4",
    },
    {
      text: "Ask, and it will be given to you; seek, and you will find; knock, and it will be opened to you.",
      reference: "Matthew 7:7",
    },
  ],
  "free-haircuts": [
    {
      text: "Truly, I say to you, as you did it to one of the least of these my brothers, you did it to me.",
      reference: "Matthew 25:40",
    },
    {
      text: "But if a woman has long hair, it is her glory? For her hair is given to her for a covering.",
      reference: "1 Corinthians 11:15",
    },
  ],
  "walk-your-dog": [
    {
      text: "Whoever is righteous has regard for the life of his beast, but the mercy of the wicked is cruel.",
      reference: "Proverbs 12:10",
    },
    {
      text: "For every beast of the forest is mine, the cattle on a thousand hills. I know all the birds of the hills, and all that moves in the field is mine.",
      reference: "Psalm 50:10–11",
    },
  ],
  "feed-chickens": [
    {
      text: "Know well the condition of your flocks, and give attention to your herds.",
      reference: "Proverbs 27:23",
    },
    {
      text: "He gives to the beasts their food, and to the young ravens that cry.",
      reference: "Psalm 147:9",
    },
  ],
};