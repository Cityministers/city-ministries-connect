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
  travel: string;
  frequency: string;
  groupSize: string;
  kidsWelcome: string;
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
  travel: "",
  frequency: "",
  groupSize: "",
  kidsWelcome: "",
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
  "Caring for a parent": ["caring for my mom", "caring for my dad", "caregiver", "elderly parent"],
  "Yes, kids welcome": ["kids welcome", "kids can come", "family friendly"],
  "Adults only": ["adults only", "no kids"],
  "Kids only": ["kids only", "just kids", "children only"],
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
    blurb: "Optional. If you have kids, we'll suggest ministries the whole family can do together.",
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
    blurb: "The abilities God gave you to serve others. Pick the ones that sound like you.",
    prompt: "Say what you think God has gifted you to do for others. Talk as long as you like.",
    fields: [
      {
        kind: "multi",
        key: "gifts",
        label: "Choose all that fit",
        options: [...SPIRITUAL_GIFTS],
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
    blurb: "Quick either/or questions to sharpen your top gifts.",
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
    ],
  },
  {
    id: "heart",
    letter: "H",
    title: "Your heart",
    blurb: "The people and causes you can't stop caring about.",
    prompt: "Say who or what you can't stop caring about, and what breaks your heart.",
    fields: [
      {
        kind: "multi",
        key: "heart",
        label: "Who or what stirs you?",
        options: [
          "Kids",
          "Teens & students",
          "Elderly",
          "Homeless neighbors",
          "Addiction recovery",
          "Single parents",
          "Immigrants & refugees",
          "Prisoners",
          "Grieving people",
          "Marriages",
          "People with disabilities",
          "Lonely neighbors nearby",
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
    blurb: "Natural talents and skills you already use in everyday life.",
    prompt: "Say what you're good at — anything practical you already do well.",
    fields: [
      {
        kind: "multi",
        key: "abilities",
        label: "Pick your skills",
        options: [
          "Cooking",
          "Driving",
          "Repairs & handyman",
          "Music",
          "Tech & computers",
          "Teaching & tutoring",
          "Hair & beauty",
          "Medical & caregiving",
          "Money & budgeting",
          "Languages",
          "Gardening",
          "Writing",
          "Sports & fitness",
          "Childcare",
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
    id: "personality",
    letter: "P",
    title: "Your personality",
    blurb: "How you recharge and how you work with people.",
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
    ],
  },
  {
    id: "setting",
    letter: "P",
    title: "Where you're most yourself",
    blurb: "The settings where serving would feel natural.",
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
    blurb:
      "Private and always optional. Hard chapters often become the ministry only you can offer.",
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
    id: "scope",
    title: "The scope of your ministry",
    blurb: "How far, how often, and how many.",
    prompt:
      "Say how far you'd travel, how often, how many people at once, and whether kids are welcome.",
    fields: [
      {
        kind: "single",
        key: "travel",
        label: "How far will you travel?",
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
    ],
  },
  {
    id: "freetalk",
    title: "Just tell me about yourself",
    blurb: "Talk freely for as long as you like. Anything you cover here fills in what we missed.",
    prompt:
      "Tell me about your life right now, the people around you, what you love doing, what you'd love to do for your neighbors, and anything you need help with yourself.",
    fields: [],
  },
  {
    id: "review",
    title: "Your S.H.A.P.E.",
    blurb: "Here's what we heard. Ready for your ministry ideas?",
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
