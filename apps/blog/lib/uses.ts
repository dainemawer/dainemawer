export type UsesSection = {
  id: string;
  label: string;
  items: { name: string; description: string }[];
};

export const usesReviewedOn = "2026-10-13";

export const usesSections: UsesSection[] = [
  {
    id: "desk",
    label: "Desk",
    items: [
      {
        name: "MacBook Air 15″ M5",
        description:
          "16GB. Fanless and light enough to carry everywhere, with a screen big enough that the desk setup is a preference, not a requirement.",
      },
      {
        name: "Dell UltraSharp U3225QE",
        description:
          "32″ 4K IPS with a Thunderbolt hub. One cable to the laptop carries video, power and every peripheral. Still a single display, not two.",
      },
      {
        name: "Logitech MX Master + MX Keys S",
        description:
          "Wireless mouse and keyboard, paired to switch between devices. The scroll wheel is the part I would miss most.",
      },
      {
        name: "iPhone 16 Pro Max",
        description:
          "The on-device test unit. A simulator will lie to you about haptics, camera, and real network conditions.",
      },
      {
        name: "Samsung A26",
        description:
          "A mid-range Android on purpose. It is closer to what most users carry than a flagship, which is where React Native's cross-platform promise actually gets tested.",
      },
    ],
  },
  {
    id: "editor",
    label: "Editor",
    items: [
      {
        name: "Cursor",
        description: "Dark mode. The AI-assisted editor I work in day to day.",
      },
      {
        name: "Biome",
        description:
          "Replaced ESLint and Prettier on new projects. The speed difference is not subtle.",
      },
      {
        name: "Ghostty",
        description:
          "The terminal. Fast, native, and where both Claude sessions live.",
      },
      {
        name: "Xcode + Android Studio",
        description:
          "Open for the simulators and native build tooling, not for writing code in either.",
      },
      {
        name: "Expo CLI / EAS",
        description:
          "The actual dev loop for the React Native work — prebuild, dev client, and OTA updates without a store release.",
      },
    ],
  },
  {
    id: "ai",
    label: "AI",
    items: [
      {
        name: "Two Claude accounts",
        description:
          "Work and personal, kept apart and symlinked on my desktop as “claude” and “claude-personal”, each running in its own Ghostty window.",
      },
      {
        name: "Remote control",
        description:
          "Both accounts are reachable from my iPhone and Android, so a long-running task does not need me at the desk.",
      },
      {
        name: "Mac Mini",
        description:
          "Permanently on, kept awake with Caffeine, for any task that has to keep running while I am away.",
      },
      {
        name: "Tailscale",
        description:
          "Device tunnels and access. It is how the phones reach the Mac Mini without exposing anything to the public internet.",
      },
    ],
  },
  {
    id: "measuring",
    label: "Measuring",
    items: [
      {
        name: "Chrome DevTools",
        description:
          "Performance and Coverage panels. Almost everything I've written about performance started in one of the two.",
      },
      {
        name: "WebPageTest",
        description:
          "Throttled mobile, Cape Town test location. Lab numbers from a fast desktop are a story, not data.",
      },
      {
        name: "CrUX + Vercel Analytics",
        description: "Field data settles arguments that lab data starts.",
      },
      {
        name: "React Native DevTools",
        description:
          "Replaced Flipper in the stack. Component tree, network, and the profiler in one place, without a separate app running.",
      },
    ],
  },
  {
    id: "shipping",
    label: "Shipping",
    items: [
      {
        name: "This site",
        description:
          "Next.js, self-hosted fonts, deployed on Vercel. No client-side framework on article pages.",
      },
      {
        name: "Vercel",
        description:
          "Where this site and most web projects deploy. Preview URLs per branch make review a link, not a checkout.",
      },
      {
        name: "Neon / Supabase",
        description:
          "Postgres in both cases. Neon when I only need a database, Supabase when auth and storage come with it.",
      },
      {
        name: "Storybook",
        description:
          "With visual regression. The subject of one of the more useful things I've written.",
      },
      {
        name: "EAS Build + Submit",
        description:
          "Cloud builds for both platforms from one config, then straight to store submission without touching Xcode or Android Studio's own release flow.",
      },
      {
        name: "TestFlight + Play Console",
        description:
          "Where a build actually lands in front of a client before it reaches the store.",
      },
    ],
  },
];
