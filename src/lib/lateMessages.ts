interface LateMessage {
  heading: string;
  body: string;
  button: string;
}

const TIMED_INDIVIDUAL: LateMessage[] = [
  {
    heading: "Oops, you were a little late today!",
    body: "Think about what you can do to be ready earlier next time.",
    button: "I can do it next time!",
  },
  {
    heading: "Oh no, the time ran out!",
    body: "You didn't make it today, but that's OK \u2014 you can do it next time!",
    button: "I'll get it next time!",
  },
  {
    heading: "Almost! You were so close today.",
    body: "What's one thing you could do faster next time?",
    button: "I've got a plan!",
  },
  {
    heading: "Not quite on time today.",
    body: "That's OK \u2014 every day is a chance to try again. You've got this!",
    button: "I'll be ready next time!",
  },
  {
    heading: "The clock beat you today!",
    body: "But you're getting better. Think about one thing that slowed you down.",
    button: "I know what to do next time!",
  },
];

const TIMED_TEAM: LateMessage[] = [
  {
    heading: "Your team was a little late today!",
    body: "Think about how you can help each other be ready faster next time.",
    button: "We'll do better next time!",
  },
  {
    heading: "Oh no, the time ran out for your team!",
    body: "You didn't make it today, but you can work together to get it next time!",
    button: "We'll get it next time!",
  },
  {
    heading: "Almost! Your team was so close today.",
    body: "How can you help each other be even faster next time?",
    button: "We've got a plan!",
  },
  {
    heading: "Your team didn't quite make it today.",
    body: "That's OK \u2014 you're a team and you can figure this out together!",
    button: "We'll be ready next time!",
  },
  {
    heading: "The clock beat your team today!",
    body: "Talk to each other about what slowed you down. You'll crack it!",
    button: "We know what to do next time!",
  },
];

const UNTIMED_INDIVIDUAL: LateMessage[] = [
  {
    heading: "You didn't get this one done today.",
    body: "That's OK! Think about what you can do differently next time.",
    button: "I'll try next time!",
  },
  {
    heading: "This one didn't happen today.",
    body: "No worries \u2014 next time is a fresh start!",
    button: "I've got this!",
  },
  {
    heading: "Not today, but that's alright!",
    body: "Think about what got in the way and how to make it easier next time.",
    button: "I'll figure it out!",
  },
  {
    heading: "You missed this one today.",
    body: "Everyone has days like this. What matters is trying again!",
    button: "I'm not giving up!",
  },
  {
    heading: "Today didn't go as planned.",
    body: "That happens sometimes! You can get back on track next time.",
    button: "I'll bounce back!",
  },
];

const UNTIMED_TEAM: LateMessage[] = [
  {
    heading: "Your team didn't get this one done today.",
    body: "That's OK! Talk about how you can help each other next time.",
    button: "We'll try next time!",
  },
  {
    heading: "This one didn't happen for your team today.",
    body: "No worries \u2014 next time is a fresh start for everyone!",
    button: "We've got this!",
  },
  {
    heading: "Not today, but that's alright!",
    body: "Think about what got in the way and how your team can help each other next time.",
    button: "We'll figure it out!",
  },
  {
    heading: "Your team missed this one today.",
    body: "Every team has days like this. What matters is trying again together!",
    button: "We're not giving up!",
  },
  {
    heading: "Today didn't go as planned for your team.",
    body: "That happens sometimes! You can get back on track together next time.",
    button: "We'll bounce back!",
  },
];

export function getRandomLateMessage(
  isTimed: boolean,
  isTeam: boolean
): LateMessage {
  const pool = isTimed
    ? isTeam
      ? TIMED_TEAM
      : TIMED_INDIVIDUAL
    : isTeam
      ? UNTIMED_TEAM
      : UNTIMED_INDIVIDUAL;
  return pool[Math.floor(Math.random() * pool.length)];
}
