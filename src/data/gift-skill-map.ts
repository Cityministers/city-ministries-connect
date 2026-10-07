/**
 * Spiritual-gift → practical-skill affinity map, transcribed from the
 * "Spiritual Gifts + Practical Skills Matcher" workbook. Weights run 1-5
 * (5 = strongly associated). Used to anchor ministry suggestions and
 * "fits your gifts" hints; it is a discernment aid, not proof of calling.
 */

export type GiftSkill = { skill: string; weight: number; example: string };

export const GIFT_SKILL_MAP: Record<string, GiftSkill[]> = {
  Administration: [
    { skill: "Project management", weight: 5, example: "Coordinate ministry initiatives" },
    { skill: "Operations management", weight: 5, example: "Run recurring ministry operations" },
    { skill: "Scheduling", weight: 4, example: "Build volunteer and event schedules" },
    { skill: "Process design", weight: 4, example: "Create repeatable workflows" },
    { skill: "Budget administration", weight: 3, example: "Track and allocate resources" },
    { skill: "Database management", weight: 3, example: "Maintain ministry records" },
    { skill: "Event management", weight: 4, example: "Coordinate programs and gatherings" },
    { skill: "Volunteer coordination", weight: 5, example: "Assign and support volunteers" },
  ],
  "Apostolic / Pioneering Ministry": [
    { skill: "Church planting", weight: 5, example: "Launch a new faith community" },
    { skill: "Cross-cultural ministry", weight: 5, example: "Serve across cultures" },
    { skill: "Strategic planning", weight: 4, example: "Define a new ministry path" },
    { skill: "Partnership development", weight: 4, example: "Build collaborative networks" },
    { skill: "Fundraising", weight: 3, example: "Resource a pioneering work" },
    { skill: "Leadership development", weight: 5, example: "Equip emerging leaders" },
    { skill: "Organizational design", weight: 4, example: "Build structures for growth" },
    { skill: "Entrepreneurship", weight: 5, example: "Start and adapt new initiatives" },
  ],
  Discernment: [
    { skill: "Critical thinking", weight: 5, example: "Evaluate messages and situations" },
    { skill: "Biblical evaluation", weight: 5, example: "Compare teaching with Scripture" },
    { skill: "Risk recognition", weight: 4, example: "Identify potential harm" },
    { skill: "Safeguarding", weight: 5, example: "Protect vulnerable people" },
    { skill: "Doctrinal review", weight: 4, example: "Assess theological alignment" },
    { skill: "Interviewing", weight: 3, example: "Ask clarifying questions" },
    { skill: "Conflict assessment", weight: 3, example: "Identify underlying dynamics" },
  ],
  Encouragement: [
    { skill: "Active listening", weight: 5, example: "Hear needs without rushing" },
    { skill: "Coaching", weight: 5, example: "Help people identify next steps" },
    { skill: "Mentoring", weight: 5, example: "Support long-term growth" },
    { skill: "Motivational speaking", weight: 4, example: "Strengthen discouraged audiences" },
    { skill: "Goal setting", weight: 3, example: "Turn intention into action" },
    { skill: "Follow-up communication", weight: 4, example: "Maintain supportive contact" },
    { skill: "Support group facilitation", weight: 4, example: "Guide constructive conversation" },
  ],
  Evangelism: [
    { skill: "Gospel presentation", weight: 5, example: "Explain the Christian message clearly" },
    { skill: "Public speaking", weight: 4, example: "Address groups effectively" },
    { skill: "Apologetics", weight: 4, example: "Respond thoughtfully to questions" },
    { skill: "Storytelling", weight: 4, example: "Communicate testimony and meaning" },
    { skill: "Cross-cultural communication", weight: 4, example: "Adapt without distorting the message" },
    { skill: "Digital outreach", weight: 3, example: "Engage people online" },
    { skill: "New-believer mentoring", weight: 5, example: "Walk with new believers" },
    { skill: "Community engagement", weight: 4, example: "Build trusted local relationships" },
  ],
  Faith: [
    { skill: "Vision casting", weight: 5, example: "Inspire toward a God-sized goal" },
    { skill: "Perseverance", weight: 5, example: "Keep going through setbacks" },
    { skill: "Crisis leadership", weight: 4, example: "Steady people in hard moments" },
    { skill: "Prayer leadership", weight: 5, example: "Lead others in believing prayer" },
    { skill: "Entrepreneurial initiative", weight: 4, example: "Step out on faith" },
    { skill: "Resilience", weight: 5, example: "Recover and continue" },
    { skill: "Calculated risk-taking", weight: 3, example: "Move forward with wise safeguards" },
  ],
  Giving: [
    { skill: "Financial stewardship", weight: 5, example: "Manage resources faithfully" },
    { skill: "Budgeting", weight: 4, example: "Plan sustainable giving" },
    { skill: "Fundraising", weight: 4, example: "Invite others to give" },
    { skill: "Donor engagement", weight: 4, example: "Thank and update supporters" },
    { skill: "Grant writing", weight: 3, example: "Apply for ministry funding" },
    { skill: "Resource allocation", weight: 5, example: "Direct resources where needed" },
    { skill: "Procurement", weight: 3, example: "Acquire supplies wisely" },
    { skill: "Benevolence management", weight: 5, example: "Administer assistance fairly" },
  ],
  Healing: [
    { skill: "Compassionate prayer", weight: 5, example: "Pray sensitively with people" },
    { skill: "Hospital visitation", weight: 4, example: "Visit the sick" },
    { skill: "Chaplaincy", weight: 4, example: "Provide spiritual care" },
    { skill: "Counseling", weight: 3, example: "Support emotional healing" },
    { skill: "Trauma-informed care", weight: 4, example: "Care without re-wounding" },
    { skill: "Recovery support", weight: 4, example: "Walk with people in recovery" },
    { skill: "Professional referral", weight: 5, example: "Connect people to qualified help" },
    { skill: "Safeguarding", weight: 5, example: "Protect vulnerable people" },
  ],
  Helps: [
    { skill: "Executive assistance", weight: 4, example: "Support leaders practically" },
    { skill: "Documentation", weight: 4, example: "Keep clear records" },
    { skill: "Calendar management", weight: 3, example: "Coordinate commitments" },
    { skill: "Research support", weight: 3, example: "Gather needed information" },
    { skill: "Technical support", weight: 4, example: "Keep tools and systems running" },
    { skill: "Production assistance", weight: 4, example: "Help events and media happen" },
    { skill: "Equipment preparation", weight: 4, example: "Set up what's needed" },
    { skill: "Follow-up", weight: 5, example: "Make sure nothing falls through" },
  ],
  "Interpretation of Tongues": [
    { skill: "Attentive listening", weight: 5, example: "Listen carefully before speaking" },
    { skill: "Clear verbal communication", weight: 4, example: "Convey meaning understandably" },
    { skill: "Congregational sensitivity", weight: 5, example: "Discern what serves the body" },
    { skill: "Pastoral accountability", weight: 5, example: "Submit to pastoral oversight" },
    { skill: "Responsible delivery", weight: 5, example: "Share with humility and care" },
  ],
  Knowledge: [
    { skill: "Research", weight: 5, example: "Dig into a subject thoroughly" },
    { skill: "Biblical study", weight: 5, example: "Study Scripture carefully" },
    { skill: "Pattern recognition", weight: 4, example: "See connections others miss" },
    { skill: "Information synthesis", weight: 5, example: "Bring facts together clearly" },
    { skill: "Diagnostic questioning", weight: 4, example: "Ask the questions that reveal" },
    { skill: "Data analysis", weight: 3, example: "Draw insight from data" },
    { skill: "Confidentiality", weight: 5, example: "Protect sensitive information" },
  ],
  Leadership: [
    { skill: "Vision development", weight: 5, example: "Define where we're going" },
    { skill: "Strategic planning", weight: 5, example: "Chart the course" },
    { skill: "Decision-making", weight: 5, example: "Decide well under pressure" },
    { skill: "Team building", weight: 5, example: "Form people into a team" },
    { skill: "Delegation", weight: 4, example: "Entrust work to others" },
    { skill: "Change management", weight: 4, example: "Guide transitions" },
    { skill: "Conflict resolution", weight: 4, example: "Bring people back together" },
    { skill: "Succession planning", weight: 3, example: "Raise up the next leaders" },
  ],
  Mercy: [
    { skill: "Compassionate listening", weight: 5, example: "Be present with people in pain" },
    { skill: "Grief support", weight: 5, example: "Walk with the grieving" },
    { skill: "Crisis response", weight: 4, example: "Show up when it matters most" },
    { skill: "Caregiving", weight: 4, example: "Provide sustained assistance" },
    { skill: "Disability inclusion", weight: 4, example: "Make room for everyone" },
    { skill: "Advocacy", weight: 4, example: "Support people facing injustice" },
    { skill: "Case coordination", weight: 3, example: "Connect multiple services" },
    { skill: "Prison ministry", weight: 3, example: "Serve the incarcerated" },
  ],
  Miracles: [
    { skill: "Intercessory prayer", weight: 5, example: "Pray boldly for breakthrough" },
    { skill: "Pastoral accountability", weight: 5, example: "Submit to pastoral oversight" },
    { skill: "Testimony documentation", weight: 4, example: "Record what God has done" },
    { skill: "Responsible communication", weight: 5, example: "Speak with humility and care" },
    { skill: "Safeguarding", weight: 5, example: "Protect vulnerable people" },
    { skill: "Professional referral", weight: 5, example: "Connect people to qualified help" },
  ],
  "Pastoral Care / Shepherding": [
    { skill: "Pastoral counseling", weight: 5, example: "Guide people through struggles" },
    { skill: "Spiritual direction", weight: 5, example: "Help others hear God" },
    { skill: "Visitation", weight: 4, example: "Visit people where they are" },
    { skill: "Conflict mediation", weight: 4, example: "Help people reconcile" },
    { skill: "Crisis intervention", weight: 4, example: "Respond in urgent moments" },
    { skill: "Discipleship", weight: 5, example: "Walk people toward maturity" },
    { skill: "Safeguarding", weight: 5, example: "Protect vulnerable people" },
    { skill: "Referral coordination", weight: 4, example: "Connect people to the right help" },
  ],
  Prophecy: [
    { skill: "Biblical interpretation", weight: 5, example: "Ground communication in Scripture" },
    { skill: "Public speaking", weight: 4, example: "Address groups effectively" },
    { skill: "Prayerful listening", weight: 5, example: "Listen to God for others" },
    { skill: "Ethical discernment", weight: 5, example: "Tell truth from compromise" },
    { skill: "Courageous communication", weight: 4, example: "Say the hard thing lovingly" },
    { skill: "Devotional writing", weight: 3, example: "Write words that build up" },
    { skill: "Pastoral accountability", weight: 5, example: "Submit to pastoral oversight" },
  ],
  Service: [
    { skill: "Event setup", weight: 4, example: "Prepare spaces for gatherings" },
    { skill: "Hospitality operations", weight: 4, example: "Make guests feel welcome" },
    { skill: "Facilities support", weight: 4, example: "Care for buildings and spaces" },
    { skill: "Transportation coordination", weight: 3, example: "Get people and things where needed" },
    { skill: "Food preparation", weight: 3, example: "Prepare meals for others" },
    { skill: "Administrative assistance", weight: 4, example: "Handle practical office tasks" },
    { skill: "Troubleshooting", weight: 4, example: "Fix what's broken" },
    { skill: "Task execution", weight: 5, example: "Get things done reliably" },
  ],
  Teaching: [
    { skill: "Lesson planning", weight: 5, example: "Prepare clear teaching" },
    { skill: "Curriculum development", weight: 5, example: "Build a learning path" },
    { skill: "Biblical research", weight: 5, example: "Study source material carefully" },
    { skill: "Instructional design", weight: 4, example: "Shape how people learn" },
    { skill: "Facilitation", weight: 4, example: "Lead group learning" },
    { skill: "Mentoring", weight: 3, example: "Support long-term growth" },
    { skill: "Assessment and feedback", weight: 4, example: "Check understanding constructively" },
    { skill: "Writing study materials", weight: 4, example: "Create resources learners use" },
  ],
  Tongues: [
    { skill: "Prayer", weight: 5, example: "Sustain a deep prayer life" },
    { skill: "Worship sensitivity", weight: 5, example: "Follow the Spirit in worship" },
    { skill: "Pastoral accountability", weight: 5, example: "Submit to pastoral oversight" },
    { skill: "Cross-cultural awareness", weight: 3, example: "Respect cultural differences" },
    { skill: "Orderly participation", weight: 5, example: "Serve the body's good order" },
  ],
  Wisdom: [
    { skill: "Strategic counsel", weight: 5, example: "Advise with long view" },
    { skill: "Complex problem-solving", weight: 5, example: "Work through competing factors" },
    { skill: "Ethical analysis", weight: 5, example: "Weigh what is right" },
    { skill: "Decision facilitation", weight: 5, example: "Help groups decide well" },
    { skill: "Mediation", weight: 4, example: "Help parties find peace" },
    { skill: "Risk assessment", weight: 4, example: "See around corners" },
    { skill: "Systems thinking", weight: 4, example: "Understand how parts connect" },
    { skill: "Policy development", weight: 3, example: "Write wise guidelines" },
  ],
};

/**
 * Maps the app's gift labels (walkthrough + /gifts pages) onto workbook gifts.
 * Hospitality and Intercession are the app's own gifts: Hospitality expresses
 * through Service/Helps skills, Intercession through Healing/Miracles prayer.
 */
export const GIFT_ALIASES: Record<string, string[]> = {
  Teaching: ["Teaching"],
  Helping: ["Helps"],
  "Service / helps": ["Service", "Helps"],
  Service: ["Service"],
  Faith: ["Faith"],
  "Discernment of Spirits": ["Discernment"],
  Discernment: ["Discernment"],
  Mercy: ["Mercy"],
  Prayer: ["Healing", "Miracles"],
  "Intercession / prayer": ["Healing", "Miracles"],
  Giving: ["Giving"],
  Administration: ["Administration"],
  Leading: ["Leadership"],
  Leadership: ["Leadership"],
  "Word of Knowledge": ["Knowledge"],
  "Knowledge / study": ["Knowledge"],
  Encouragement: ["Encouragement"],
  Exhortation: ["Encouragement"],
  Apostleship: ["Apostolic / Pioneering Ministry"],
  Preaching: ["Evangelism"],
  Evangelism: ["Evangelism"],
  Prophecy: ["Prophecy"],
  Miracles: ["Miracles"],
  Tongues: ["Tongues"],
  "Interpretation of Tongues": ["Interpretation of Tongues"],
  Healing: ["Healing"],
  Hospitality: ["Service", "Helps"],
  Wisdom: ["Wisdom"],
  "Shepherding / pastoring": ["Pastoral Care / Shepherding"],
};

/** Bridges the walkthrough's broad ability picks to catalog skills. */
export const ABILITY_BRIDGES: Record<string, string[]> = {
  "Cooking & meal prep": ["Food preparation", "Hospitality operations"],
  "Hospitality & hosting": ["Hospitality operations", "Event setup"],
  "Driving & rides": ["Transportation coordination"],
  "Repairs & handyman": ["Troubleshooting", "Facilities support"],
  "Building & woodworking": ["Facilities support", "Equipment preparation"],
  "Cleaning & organizing": ["Event setup", "Administrative assistance"],
  "Moving & heavy lifting": ["Event setup", "Task execution"],
  "Music & worship": ["Worship sensitivity"],
  "Tech & computers": ["Technical support", "Digital outreach", "Data analysis"],
  "Teaching & tutoring": ["Lesson planning", "Facilitation", "Mentoring"],
  "Listening & conversation": ["Active listening", "Compassionate listening"],
  "Prayer & intercession": ["Intercessory prayer", "Compassionate prayer", "Prayer leadership"],
  "Mentoring & counseling": ["Mentoring", "Coaching", "Pastoral counseling"],
  "Hair & beauty": ["Hospitality operations"],
  "Sewing & mending": ["Task execution", "Production assistance"],
  "Medical & caregiving": ["Caregiving", "Hospital visitation", "Trauma-informed care"],
  "Money & budgeting": ["Budgeting", "Budget administration", "Financial stewardship"],
  "Languages & translation": ["Cross-cultural communication", "Cross-cultural ministry"],
  "Gardening & yardwork": ["Facilities support", "Task execution"],
  "Writing & storytelling": ["Storytelling", "Writing study materials", "Devotional writing"],
  "Art, design & crafts": ["Production assistance"],
  "Photography & videography": ["Digital outreach", "Production assistance"],
  "Sports & fitness": ["Community engagement", "Coaching"],
  "Games & recreation": ["Community engagement", "Event management"],
  "Outdoor skills (fishing, camping, hiking)": ["Event management", "Community engagement"],
  Childcare: ["Caregiving", "Support group facilitation"],
  "Event planning": ["Event management", "Scheduling", "Volunteer coordination"],
  "Public speaking": ["Public speaking", "Motivational speaking", "Gospel presentation"],
  "Advocacy & outreach": ["Advocacy", "Community engagement", "Digital outreach"],
  "Food prep & meal delivery": ["Food preparation", "Transportation coordination"],
};

export type Affinity = {
  gift: string;
  skill: string;
  example: string;
  score: number;
};

type AffinityInput = {
  gifts?: string[];
  customGifts?: string[];
  abilities?: string[];
};

/**
 * Ranks a member's strongest gift + skill combinations. A member's chosen
 * gifts contribute their workbook weights; broad abilities boost the skills
 * they bridge to, so a gift backed by a matching skill rises to the top.
 */
export function topAffinities(input: AffinityInput, limit = 8): Affinity[] {
  const abilitySkills = new Set<string>();
  for (const ability of input.abilities ?? []) {
    for (const skill of ABILITY_BRIDGES[ability] ?? []) abilitySkills.add(skill.toLowerCase());
  }

  const results: Affinity[] = [];
  const seenGifts = new Set<string>();
  for (const label of [...(input.gifts ?? []), ...(input.customGifts ?? [])]) {
    for (const gift of GIFT_ALIASES[label] ?? []) {
      if (seenGifts.has(gift)) continue;
      seenGifts.add(gift);
      for (const entry of GIFT_SKILL_MAP[gift] ?? []) {
        const boosted = abilitySkills.has(entry.skill.toLowerCase());
        results.push({
          gift,
          skill: entry.skill,
          example: entry.example,
          score: entry.weight + (boosted ? 3 : 0),
        });
      }
    }
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

function words(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length > 3);
}

/**
 * Matches a post's wording against a member's top affinities and returns the
 * strongest gift + skill pairs (at most `limit`), or an empty list when the
 * post doesn't connect to anything in their profile.
 */
export function postGiftFit(postText: string, input: AffinityInput, limit = 2): Affinity[] {
  const text = postText.toLowerCase();
  const matches: Affinity[] = [];
  for (const affinity of topAffinities(input, 20)) {
    const keys = [...words(affinity.skill), ...words(affinity.example), ...words(affinity.gift)];
    if (keys.some((k) => text.includes(k))) matches.push(affinity);
    if (matches.length >= limit) break;
  }
  return matches;
}
