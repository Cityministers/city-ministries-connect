/**
 * Grouped display of BIBLICAL_GIFTS. `values` are the stored gift names, so
 * merged cards (e.g. Helping & Service) keep older saved answers working.
 * Restore point: delete this file and GiftGroupPicker to return to the flat list.
 */
export type GiftItem = { label: string; values: string[]; desc: string };
export type GiftGroup = { title: string; items: GiftItem[] };

export const GIFT_GROUPS: GiftGroup[] = [
  {
    title: "Serving & Helping",
    items: [
      { label: "Helping & Service", values: ["Helping", "Service"], desc: "Doing practical tasks so others can thrive." },
      { label: "Mercy", values: ["Mercy"], desc: "Staying close to people who are hurting, sick, or grieving." },
      { label: "Giving", values: ["Giving"], desc: "Sharing money and resources generously and gladly." },
      { label: "Craftsmanship", values: ["Craftsmanship"], desc: "Building, fixing, and making things with your hands." },
    ],
  },
  {
    title: "Teaching & Sharing",
    items: [
      { label: "Teaching & Preaching", values: ["Teaching", "Preaching"], desc: "Explaining God's Word so people understand and grow." },
      { label: "Encouragement", values: ["Encouragement", "Exhortation"], desc: "Lifting up discouraged people and urging them forward." },
      { label: "Evangelism", values: ["Evangelism"], desc: "Sharing the good news of Jesus naturally with others." },
      { label: "Word of Knowledge", values: ["Word of Knowledge"], desc: "Grasping and sharing deep truth for a specific moment." },
    ],
  },
  {
    title: "Leading & Organizing",
    items: [
      { label: "Leadership", values: ["Leadership", "Leading"], desc: "Casting vision and guiding people toward a goal." },
      { label: "Administration", values: ["Administration"], desc: "Organizing details, people, and plans so ministry runs well." },
      { label: "Apostleship", values: ["Apostleship"], desc: "Pioneering new ministries, churches, or places." },
    ],
  },
  {
    title: "Prayer & Discernment",
    items: [
      { label: "Prayer", values: ["Prayer"], desc: "Praying faithfully and often for others." },
      { label: "Faith", values: ["Faith"], desc: "Trusting God boldly for what others think impossible." },
      { label: "Discernment of Spirits", values: ["Discernment of Spirits"], desc: "Sensing what is true, false, safe, or harmful." },
      { label: "Prophecy", values: ["Prophecy"], desc: "Speaking God's truth to build up, warn, or comfort." },
      { label: "Healing", values: ["Healing"], desc: "Praying for God to restore people's bodies and hearts." },
      { label: "Miracles", values: ["Miracles"], desc: "Trusting God for signs of His power." },
      { label: "Tongues", values: ["Tongues"], desc: "Praying or speaking in a language given by the Spirit." },
      { label: "Interpretation of Tongues", values: ["Interpretation of Tongues"], desc: "Making Spirit-given languages understood by others." },
    ],
  },
  {
    title: "Creative & Arts",
    items: [
      { label: "Music", values: ["Music"], desc: "Leading or serving others through song and sound." },
      { label: "Artistic Skills", values: ["Artistic Skills"], desc: "Expressing faith through visual art, design, or writing." },
      { label: "Dance", values: ["Dance"], desc: "Worshiping and expressing joy through movement." },
    ],
  },
];
