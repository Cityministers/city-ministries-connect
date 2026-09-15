export type ChildEntry = { name: string; age: string };

export type ShapeAnswers = {
  city: string;
  zip: string;
  firstName: string;
  ageRange: string;
  marital: string;
  timePerMonth: string;
  household: string;
  children: ChildEntry[];
  gifts: string[];
  customGifts: string[];
  giftsNote: string;
  giftLean: Record<string, string>;
  heart: string[];
  heartNote: string;
  abilities: string[];
  abilitiesNote: string;
  personality: Record<string, string>;
  settings: string[];
  experiences: string[];
  experienceNote: string;
  resources: string[];
  budget: string;
  pastService: string[];
  serviceNote: string;
  familyServe: string[];
  availableTimes: string[];
  travel: string;
  frequency: string;
  groupSize: string;
  kidsWelcome: string;
  dreamNote: string;
  biggestBarrier: string;
  freeTalk: string;
  /** Raw spoken answers, keyed by step id. */
  transcripts: Record<string, string>;
};

export const emptyAnswers: ShapeAnswers = {
  city: "",
  zip: "",
  firstName: "",
  ageRange: "",
  marital: "",
  timePerMonth: "",
  household: "",
  children: [],
  gifts: [],
  customGifts: [],
  giftsNote: "",
  giftLean: {},
  heart: [],
  heartNote: "",
  abilities: [],
  abilitiesNote: "",
  personality: {},
  settings: [],
  experiences: [],
  experienceNote: "",
  resources: [],
  budget: "",
  pastService: [],
  serviceNote: "",
  familyServe: [],
  availableTimes: [],
  travel: "",
  frequency: "",
  groupSize: "",
  kidsWelcome: "",
  dreamNote: "",
  biggestBarrier: "",
  freeTalk: "",
  transcripts: {},
};

export type Field =
  | { kind: "text"; key: keyof ShapeAnswers; label: string; placeholder?: string }
  | { kind: "longtext"; key: keyof ShapeAnswers; label: string; placeholder?: string }
  | { kind: "single"; key: keyof ShapeAnswers; label: string; options: string[] }
  | { kind: "multi"; key: keyof ShapeAnswers; label: string; options: string[] }
  | {
      kind: "pair";
      group: "giftLean" | "personality";
      id: string;
      label: string;
      options: string[];
    }
  | { kind: "children" };

export type Step = {
  id: string;
  letter?: string;
  title: string;
  blurb?: string;
  /** What we ask people to say out loud on this step. */
  prompt: string;
  fields: Field[];
};

/** Extra words that should also select an option when someone says them out loud. */
export const OPTION_SYNONYMS: Record<string, string[]> = {
  "Service / helps": ["serving", "helping", "helps", "hands on"],
  "Intercession / prayer": ["pray", "prayer", "praying", "intercede"],
  "Shepherding / pastoring": ["shepherd", "pastor", "pastoring", "discipling"],
  "Knowledge / study": ["study", "studying", "bible study", "knowledge"],
  "Craftsmanship / building": ["build", "building", "woodwork", "craft", "carpentry"],
  "Music / worship": ["music", "sing", "singing", "worship", "guitar", "piano"],
  "Homeless neighbors": ["homeless", "unhoused", "shelter"],
  "Teens & students": ["teen", "teens", "student", "students", "youth"],
  "Immigrants & refugees": ["immigrant", "immigrants", "refugee", "refugees"],
  "Lonely neighbors nearby": ["lonely", "loneliness", "neighbor", "neighbors"],
  "Addiction recovery": ["addiction", "recovery", "sober", "alcohol", "drugs"],
  "People with disabilities": ["disability", "disabilities", "special needs", "wheelchair"],
  "Repairs & handyman": ["repair", "repairs", "handyman", "fix", "fixing"],
  "Tech & computers": ["tech", "computer", "computers", "phones", "technology"],
  "Teaching & tutoring": ["teach", "teaching", "tutor", "tutoring"],
  "Hair & beauty": ["hair", "haircut", "haircuts", "nails", "beauty"],
  "Medical & caregiving": ["nurse", "medical", "caregiving", "caregiver", "doctor"],
  "Money & budgeting": ["money", "budget", "budgeting", "finance", "taxes"],
  "Sports & fitness": ["sports", "fitness", "coach", "coaching", "gym"],
  "A public place (cafe, park)": ["cafe", "coffee shop", "park", "public"],
  "On the move (driving, walking)": ["driving", "walking", "on the move", "car"],
  "Loss of a loved one": ["loss", "grief", "died", "passed away", "widow"],
  "Serious illness": ["illness", "cancer", "sick", "hospital"],
  "Poverty or homelessness": ["poverty", "poor", "homeless", "broke"],
  "Foster care or adoption": ["foster", "adoption", "adopted"],
  "Career change or job loss": ["laid off", "job loss", "career change", "unemployed"],
  "Coming to faith later in life": ["came to faith", "saved later", "converted"],
  "Depression or anxiety": ["depression", "depressed", "anxiety", "anxious", "panic"],
  "Loneliness or isolation": ["lonely", "loneliness", "isolated", "alone"],
  "A loved one's addiction": ["addict", "alcoholic", "loved one's addiction", "relapse"],
  "A loved one in prison": ["prison", "jail", "incarcerated", "inmate", "locked up"],
  "Disability (yours or a loved one's)": ["disability", "disabled", "handicap", "wheelchair", "injury"],
  "Single parenting": ["single parent", "single mom", "single dad", "raising kids alone"],
  "Miscarriage or infertility": ["miscarriage", "infertility", "infertile", "lost a baby"],
  "Surviving abuse": ["abuse", "abusive", "domestic violence", "assault"],
  "Family estrangement": ["estranged", "estrangement", "cut off", "no contact"],
  "Long-term unemployment or debt": ["debt", "unemployed", "broke", "financial"],
  "Caring for a child with special needs": ["special needs", "special needs child", "autism"],
  "Mental health crisis in the family": ["mental health", "psychiatric", "suicide", "bipolar", "schizophrenia"],
  "Caring for a parent": ["caring for my mom", "caring for my dad", "caregiver", "elderly parent"],
  "Yes, kids welcome": ["kids welcome", "kids can come", "family friendly"],
  "Adults only": ["adults only", "no kids"],
  "Kids only": ["kids only", "just kids", "children only"],
  "Books to lend or give": ["books", "lend books", "give books", "library"],
  "Clothes & shoes to share": ["clothes", "clothing", "shoes", "wardrobe"],
  "Food or groceries": ["food", "groceries", "pantry", "meal"],
  "A warm meal I can cook": ["cook", "cooking", "dinner", "meal"],
  "Coffee, tea, or drinks": ["coffee", "tea", "drinks", "beverages"],
  "Baby gear or toys": ["baby gear", "toys", "stroller", "kids toys"],
  "Games, puzzles, or recreation supplies": ["games", "puzzles", "recreation"],
  "Art & craft supplies": ["art supplies", "crafts", "paints", "canvas"],
  "Hair or beauty supplies": ["hair products", "beauty supplies", "clippers"],
  "Stamps & stationery": ["stamps", "stationery", "envelopes", "letters"],
  "A phone or internet connection": ["phone", "internet", "wifi", "hotspot"],
  "A printer or office supplies": ["printer", "paper", "office supplies"],
  "Outdoor gear (fishing, tent, bikes)": ["fishing gear", "tent", "bikes", "outdoor"],
  "Pet supplies or animal care": ["pet supplies", "dog food", "animal care"],
  "A safe home to meet in": ["my home", "house", "living room", "meet at my place"],
  "A listening ear and my presence": ["listen", "listening ear", "just be there"],
  "My professional network": ["network", "contacts", "connections"],
  "Volunteer hours at church": ["volunteer", "church hours", "serve at church"],
};

export const SPIRITUAL_GIFTS = [
  "Teaching",
  "Hospitality",
  "Mercy",
  "Encouragement",
  "Giving",
  "Leadership",
  "Service / helps",
  "Faith",
  "Evangelism",
  "Administration",
  "Intercession / prayer",
  "Discernment",
  "Shepherding / pastoring",
  "Wisdom",
  "Knowledge / study",
  "Craftsmanship / building",
  "Music / worship",
] as const;

/** The fuller list of Biblical gifts used on the /gifts pages. */
export const BIBLICAL_GIFTS = [
  "Helping",
  "Faith",
  "Discernment of Spirits",
  "Mercy",
  "Prayer",
  "Giving",
  "Administration",
  "Leading",
  "Word of Knowledge",
  "Encouragement",
  "Exhortation",
  "Music",
  "Dance",
  "Artistic Skills",
  "Craftsmanship",
  "Apostleship",
  "Service",
  "Teaching",
  "Preaching",
  "Leadership",
  "Evangelism",
  "Prophecy",
  "Miracles",
  "Tongues",
  "Interpretation of Tongues",
  "Healing",
] as const;

export const steps: Step[] = [
  {
    id: "place",
    title: "Where will you serve?",
    prompt: "Say where you'll be serving — your city, and your ZIP code if you know it.",
    fields: [
      { kind: "text", key: "city", label: "City", placeholder: "Beaverton" },
      { kind: "text", key: "zip", label: "ZIP code", placeholder: "97006" },
    ],
  },
  {
    id: "about",
    title: "A little about you",
    prompt:
      "Say your first name, roughly your age, your relationship status, and how much time you could give each month to your ideal ministry.",
    fields: [
      { kind: "text", key: "firstName", label: "First name", placeholder: "Joseph" },
      {
        kind: "single",
        key: "ageRange",
        label: "Age range",
        options: ["Under 20", "20s", "30s", "40s", "50s", "60s", "70+"],
      },
      {
        kind: "single",
        key: "marital",
        label: "Marital status",
        options: ["Single", "Dating", "Engaged", "Married", "Widowed", "Divorced"],
      },
      {
        kind: "single",
        key: "timePerMonth",
        label: "Time you can give each month to your ideal ministry",
        options: ["1-2 hours", "3-5 hours", "6-10 hours", "10+ hours"],
      },
    ],
  },
  {
    id: "family",
    title: "Your family",
    prompt: "Say the names and ages of your children, and who else lives with you.",
    fields: [
      { kind: "children" },
      {
        kind: "text",
        key: "household",
        label: "Anyone else at home?",
        placeholder: "Spouse, my mother, a roommate...",
      },
    ],
  },
  {
    id: "gifts",
    letter: "S",
    title: "Spiritual gifts",
    prompt: "Say what you think God has gifted you to do for others. Talk as long as you like.",
    fields: [
      {
        kind: "multi",
        key: "gifts",
        label: "Choose all that fit",
        options: [...BIBLICAL_GIFTS],
      },
      {
        kind: "longtext",
        key: "giftsNote",
        label: "Anything else about how God uses you? (optional)",
        placeholder: "People tell me I'm good at...",
      },
    ],
  },
  {
    id: "gifts-lean",
    letter: "S",
    title: "Which feels more like you?",
    prompt: "Say which of these sounds more like you, in your own words.",
    fields: [
      {
        kind: "pair",
        group: "giftLean",
        id: "teach-vs-serve",
        label: "In a group, you'd rather...",
        options: ["Explain and teach", "Quietly get things done"],
      },
      {
        kind: "pair",
        group: "giftLean",
        id: "lead-vs-comfort",
        label: "When something goes wrong, you...",
        options: ["Organize a plan", "Sit with the hurting person"],
      },
      {
        kind: "pair",
        group: "giftLean",
        id: "give-vs-pray",
        label: "Your first instinct to help is to...",
        options: ["Give what you have", "Pray it through"],
      },
      {
        kind: "pair",
        group: "giftLean",
        id: "invite-vs-go",
        label: "You'd rather...",
        options: ["Invite people to your table", "Go out to where they are"],
      },
      {
        kind: "pair",
        group: "giftLean",
        id: "speak-vs-write",
        label: "You share best by...",
        options: ["Speaking to people", "Writing it down"],
      },
      {
        kind: "pair",
        group: "giftLean",
        id: "start-vs-sustain",
        label: "You're better at...",
        options: ["Starting something new", "Keeping it going faithfully"],
      },
      {
        kind: "pair",
        group: "giftLean",
        id: "crowd-vs-overlooked",
        label: "You're drawn to...",
        options: ["The crowd up front", "The person nobody noticed"],
      },
    ],
  },
  {
    id: "heart",
    letter: "H",
    title: "Your heart",
    prompt: "Say who or what you can't stop caring about, and what breaks your heart.",
    fields: [
      {
        kind: "multi",
        key: "heart",
        label: "Who or what stirs you?",
        options: [
          "Kids",
          "Teens & students",
          "College students",
          "Young adults",
          "Elderly",
          "Widows & widowers",
          "Single parents",
          "Struggling parents",
          "Foster & adoptive families",
          "Veterans",
          "Homeless neighbors",
          "People in poverty",
          "Food insecure families",
          "People without transportation",
          "Addiction recovery",
          "People with mental illness",
          "People with disabilities",
          "Immigrants & refugees",
          "Prisoners & former prisoners",
          "Grieving people",
          "People facing illness",
          "Caregivers",
          "Healthcare workers",
          "First responders",
          "Teachers & school staff",
          "Marriages",
          "New believers",
          "The unchurched",
          "Local schools",
          "My neighborhood",
          "Lonely neighbors nearby",
          "International missions",
          "Creation & the environment",
        ],
      },
      {
        kind: "longtext",
        key: "heartNote",
        label: "What breaks your heart? (optional)",
        placeholder: "When I see...",
      },
    ],
  },
  {
    id: "abilities",
    letter: "A",
    title: "Your abilities",
    prompt: "Say what you're good at — anything practical you already do well.",
    fields: [
      {
        kind: "multi",
        key: "abilities",
        label: "Pick your skills",
        options: [
          "Cooking & meal prep",
          "Hospitality & hosting",
          "Driving & rides",
          "Repairs & handyman",
          "Building & woodworking",
          "Cleaning & organizing",
          "Moving & heavy lifting",
          "Music & worship",
          "Tech & computers",
          "Teaching & tutoring",
          "Listening & conversation",
          "Prayer & intercession",
          "Mentoring & counseling",
          "Hair & beauty",
          "Sewing & mending",
          "Medical & caregiving",
          "Money & budgeting",
          "Languages & translation",
          "Gardening & yardwork",
          "Writing & storytelling",
          "Art, design & crafts",
          "Photography & videography",
          "Sports & fitness",
          "Games & recreation",
          "Outdoor skills (fishing, camping, hiking)",
          "Childcare",
          "Event planning",
          "Public speaking",
          "Advocacy & outreach",
          "Food prep & meal delivery",
        ],
      },
      {
        kind: "longtext",
        key: "abilitiesNote",
        label: "Anything unusual you can do? (optional)",
        placeholder: "I fix bikes, I speak Tagalog, I cut hair...",
      },
    ],
  },
  {
    id: "resources",
    letter: "A",
    title: "What you have to share",
    prompt: "Say what you have that could be shared — space, a vehicle, tools, food, anything — and how much you could put toward it each month.",
    fields: [
      {
        kind: "multi",
        key: "resources",
        label: "Pick what you could share",
        options: [
          "A big table or kitchen",
          "A yard, garage, or fire pit",
          "A spare room",
          "A vehicle or truck",
          "A second vehicle, RV, or trailer",
          "Bikes or scooters",
          "Tools",
          "Sports or camping gear",
          "Outdoor gear (fishing, tent, bikes)",
          "Musical instruments",
          "A sound system or speakers",
          "A computer or camera",
          "A phone or internet connection",
          "A printer or office supplies",
          "A workplace or business",
          "Land or a farm",
          "A washer/dryer or laundry access",
          "Books to lend or give",
          "Clothes & shoes to share",
          "Food or groceries",
          "A warm meal I can cook",
          "Coffee, tea, or drinks",
          "Baby gear or toys",
          "Games, puzzles, or recreation supplies",
          "Art & craft supplies",
          "Hair or beauty supplies",
          "Cleaning supplies",
          "Stamps & stationery",
          "Pet supplies or animal care",
          "Seasonal or event decorations",
          "Gift cards or small cash",
          "A safe home to meet in",
          "A listening ear and my presence",
          "My professional network",
          "Volunteer hours at church",
          "Time more than things",
        ],
      },
      {
        kind: "single",
        key: "budget",
        label: "How much could you spend each month on this ministry?",
        options: ["Nothing right now", "Under $25", "$25-$100", "$100+", "Whatever it takes"],
      },
    ],
  },
  {
    id: "personality",
    letter: "P",
    title: "Your personality",
    prompt:
      "Say how you recharge, whether you plan or go with the flow, and whether you lead or support.",
    fields: [
      {
        kind: "pair",
        group: "personality",
        id: "energy",
        label: "You're energized by...",
        options: ["A room full of people", "One-on-one time"],
      },
      {
        kind: "pair",
        group: "personality",
        id: "plan",
        label: "You'd describe yourself as...",
        options: ["A planner", "Spontaneous"],
      },
      {
        kind: "pair",
        group: "personality",
        id: "role",
        label: "You're happiest...",
        options: ["Leading the thing", "Supporting someone else"],
      },
      {
        kind: "pair",
        group: "personality",
        id: "rhythm",
        label: "You prefer...",
        options: ["A steady routine", "Lots of variety"],
      },
      {
        kind: "pair",
        group: "personality",
        id: "pace",
        label: "You do better with...",
        options: ["A short, intense push", "A slow, steady commitment"],
      },
      {
        kind: "pair",
        group: "personality",
        id: "front",
        label: "You'd rather be...",
        options: ["Out front and visible", "Behind the scenes"],
      },
    ],
  },
  {
    id: "setting",
    letter: "P",
    title: "Where you're most yourself",
    prompt: "Say where serving would feel most natural to you.",
    fields: [
      {
        kind: "multi",
        key: "settings",
        label: "Pick your settings",
        options: [
          "My home",
          "A public place (cafe, park)",
          "Church",
          "Outdoors",
          "Online",
          "On the move (driving, walking)",
        ],
      },
    ],
  },
  {
    id: "experiences",
    letter: "E",
    title: "Your experiences",
    prompt: "Say what hard chapters you've walked through, only what you're comfortable sharing.",
    fields: [
      {
        kind: "multi",
        key: "experiences",
        label: "Chapters you've walked through",
        options: [
          "Loss of a loved one",
          "Serious illness",
          "Divorce",
          "Addiction & recovery",
          "Immigration",
          "Military service",
          "Poverty or homelessness",
          "Foster care or adoption",
          "Career change or job loss",
          "Raising kids",
          "Caring for a parent",
          "Depression or anxiety",
          "Loneliness or isolation",
          "A loved one's addiction",
          "A loved one in prison",
          "Disability (yours or a loved one's)",
          "Single parenting",
          "Miscarriage or infertility",
          "Surviving abuse",
          "Family estrangement",
          "Long-term unemployment or debt",
          "Caring for a child with special needs",
          "Mental health crisis in the family",
          "Coming to faith later in life",
        ],
      },
      {
        kind: "longtext",
        key: "experienceNote",
        label: "Anything you'd want a neighbor to know? (optional)",
        placeholder: "What I learned from it...",
      },
    ],
  },
  {
    id: "service-history",
    letter: "E",
    title: "Where you've served before",
    prompt: "Say how you've served people before, at church or anywhere else, and how it went.",
    fields: [
      {
        kind: "multi",
        key: "pastService",
        label: "Ways you've served before",
        options: [
          "Kids or nursery",
          "Youth group",
          "Worship team",
          "Greeting or hospitality",
          "Small group leader",
          "Teaching or preaching",
          "Missions trip",
          "Food pantry or meals",
          "Prison or hospital visits",
          "Shelter or street outreach",
          "Building or repair projects",
          "Behind the scenes / admin",
          "Hosting dinners or coffee chats",
          "Babysitting or childcare",
          "Giving rides or errands",
          "Free clothes or giveaways",
          "Cleaning or organizing for someone",
          "Moving or heavy lifting",
          "Handyman or yardwork help",
          "Free haircuts or beauty care",
          "Praying with people one-on-one",
          "Writing or encouraging inmates",
          "Mentoring or discipleship",
          "Recovery or support groups",
          "Visiting elderly or shut-ins",
          "Supporting foster or single-parent families",
          "Game nights or community events",
          "Music, art, or crafts for others",
          "Tech, media, or sound",
          "Caring for pets or dog walking",
          "Never served formally",
        ],
      },
      {
        kind: "longtext",
        key: "serviceNote",
        label: "What did you love or hate about it? (optional)",
        placeholder: "I loved... but I never want to...",
      },
    ],
  },
  {
    id: "scope",
    title: "The scope of your ministry",
    prompt:
      "Say how far you'd travel, how often, how many people at once, and whether kids are welcome.",
    fields: [
      {
        kind: "single",
        key: "travel",
        label: "How far would you travel to minister?",
        options: ["My street", "My neighborhood", "Across the city", "Anywhere in the metro"],
      },
      {
        kind: "single",
        key: "frequency",
        label: "How often?",
        options: ["Once", "Monthly", "Every other week", "Weekly", "Anytime someone asks"],
      },
      {
        kind: "single",
        key: "groupSize",
        label: "How many people would you serve or gather with at once?",
        options: ["One person", "2-4 people", "A small group", "A crowd"],
      },
      {
        kind: "single",
        key: "kidsWelcome",
        label: "Are kids welcome?",
        options: ["Yes, kids welcome", "Adults only", "Kids only"],
      },
      {
        kind: "multi",
        key: "availableTimes",
        label: "When are you usually free?",
        options: [
          "Weekday mornings",
          "Weekday afternoons",
          "Weeknights",
          "Saturdays",
          "Sundays",
          "Whenever there's a need",
        ],
      },
    ],
  },
  {
    id: "family-serve",
    title: "Serving together",
    blurb: "Optional. Skip if you'll be serving on your own.",
    prompt: "Say who would serve alongside you, and what your family enjoys doing together.",
    fields: [
      {
        kind: "multi",
        key: "familyServe",
        label: "Who would join you?",
        options: [
          "Just me",
          "My spouse",
          "My kids",
          "My whole household",
          "A friend or two",
          "My small group",
          "My church",
        ],
      },
    ],
  },
  {
    id: "dream",
    title: "Your dream and what's in the way",
    prompt:
      "Say what you'd love to do for your neighbors if nothing held you back, and what's making it hard to start.",
    fields: [
      {
        kind: "longtext",
        key: "dreamNote",
        label: "If nothing held you back, what would you do? (optional)",
        placeholder: "I'd love to...",
      },
      {
        kind: "single",
        key: "biggestBarrier",
        label: "What makes it hardest to start?",
        options: [
          "Not enough time",
          "Not sure where to start",
          "Money",
          "No one to do it with",
          "Health or energy",
          "Shy about reaching out",
          "Family responsibilities",
          "Work schedule",
          "Caring for someone at home",
          "Don't feel qualified",
          "Afraid I'll fail",
          "Transportation",
          "My church isn't involved yet",
          "Not sure who needs help",
          "Worry what others will think",
          "Burned out from past serving",
          "Language or cultural barriers",
          "My home feels too small or messy",
          "Nothing, I'm ready",
        ],
      },
    ],
  },
  {
    id: "freetalk",
    title: "Just tell me about yourself",
    prompt:
      "Tell me about your life right now, the people around you, what you love doing, what you'd love to do for your neighbors, and anything you need help with yourself.",
    fields: [],
  },
  {
    id: "review",
    title: "Your S.H.A.P.E.",
    prompt: "",
    fields: [],
  },
];

export type MinistryIdea = {
  kind: "ministry" | "need";
  shortTitle: string;
  title: string;
  description: string;
  whyItFits: string;
  familyFriendly: boolean;
};
