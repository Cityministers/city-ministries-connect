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
  icon: LucideIcon;
  tone: Tone;
  description: string;
  neighborhood: string;
  city: string;
  zip: string;
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
    "Scripture hands revelation to friendship before it hands it to an office. Jesus stopped calling the twelve servants and called them friends (John 15:15), and the oldest name given to Abraham was \u201cfriend of God\u201d (James 2:23). God walked in a garden, ate at Abraham\u2019s table, and taught twelve men on a road; the earliest believers carried that pattern into ordinary homes, \u201cbreaking bread\u2026 with glad and generous hearts\u201d (Acts 2:46). The New Testament word for Christian hospitality is philoxenia \u2014 love of the stranger \u2014 and it is commanded of every household, not of a paid office. A coffee chat is that same invitation at its cheapest: one person willing to say \u201ccome\u201d and stay while someone else talks. Luke 14 sets the guest list \u2014 the poor, the crippled, the lame, the blind \u2014 anyone with nothing to trade back.",
    "Peter tells believers to \u201calways be prepared to make a defense to anyone who asks you for a reason for the hope that is in you, yet with gentleness and respect\u201d (1 Peter 3:15). Defense is the legal word apologia: a reasoned reply to a real question, not a speech, and it assumes someone is near enough to ask. The same letter weaves that answer into ordinary good conduct \u201camong the Gentiles\u201d (1 Peter 2:12) and ties it to humility \u2014 \u201cclothe yourselves with humility toward one another\u201d (1 Peter 5:5) \u2014 so witness is never a claim to be above anyone. Even Peter\u2019s own restoration came over a charcoal-fire breakfast and a question asked three times (John 21:9\u201317). The light in Matthew 5 is not argued for; it is simply not hidden. Two people talking honestly over coffee is a small, unembarrassed light \u2014 and out of it the gospel is preached plainly: God is near, and he is worth meeting.",
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