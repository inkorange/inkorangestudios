// Pure document builder for the Sanity seed. No I/O here.
const key = (prefix, i) => `${prefix}${i + 1}`;

function block(id, text) {
  return {
    _type: "block",
    _key: id,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `${id}s`, text, marks: [] }],
  };
}

const slug = (current) => ({ _type: "slug", current });

/*
 * Ids are hyphenated on purpose: in Sanity a dotted id ("studioGame.terraforge") is a
 * private document, readable only with a token. The site reads unauthenticated via the
 * CDN, so dotted ids would make every seeded document invisible.
 */
export function buildDocuments() {
  const terraforge = {
    _id: "studioGame-terraforge",
    _type: "studioGame",
    name: "TerraForge",
    slug: slug("terraforge"),
    status: "out-now",
    genres: ["Sandbox", "Creative"],
    platforms: ["Web", "Android (soon)"],
    blurb:
      "Build planets and whole star systems from scratch, explore real exoplanets, and share your creations with other players.",
    description: [
      block(
        "tf-p1",
        "TerraForge is a sandbox for making worlds. Start with a blank sphere and shape it into a planet that's entirely yours — then give it neighbors, a star, and a place in a galaxy shared by every player.",
      ),
      block(
        "tf-p2",
        "When you want inspiration, visit the real thing: TerraForge pulls in planets discovered beyond our solar system, so you can see them from orbit or drop down to the surface for a look around.",
      ),
    ],
    features: [
      ["Procedural planets", "Generate a new world in seconds, then tweak it until it’s exactly right."],
      ["Whole star systems", "Build the star, the neighbors and the system they live in."],
      ["Real exoplanets", "Explore planets discovered by astronomers, with data from the NASA Exoplanet Archive."],
      ["Surface views", "Drop from orbit to the ground and look around."],
      ["Share any world", "Every planet gets its own link to send or post anywhere."],
      ["Community gallery", "Browse what other players have built and add your own."],
    ].map(([title, body], i) => ({ _type: "feature", _key: key("tf-feature-", i), title, body })),
    facts: [
      ["Developer", "inkOrange Studios"],
      ["Genre", "Sandbox, Creative"],
      ["Platforms", "Web · Android (soon)"],
      ["Players", "Single-player, shared gallery"],
    ].map(([label, value], i) => ({ _type: "fact", _key: key("tf-fact-", i), label, value })),
    primaryCta: { label: "Play free in browser", url: "https://www.terraforgeworlds.com" },
    notifyPlatform: { enabled: true, platform: "Android" },
    featured: true,
    featuredOrder: 1,
    sortOrder: 1,
  };

  const spaceCowboy = {
    _id: "studioGame-space-cowboy",
    _type: "studioGame",
    name: "Space Cowboy",
    slug: slug("space-cowboy"),
    status: "coming-soon",
    genres: ["Puzzle"],
    platforms: ["iOS", "Android"],
    blurb: "A story-driven puzzle game: plan the perfect shot, slingshot around obstacles and hit the target.",
    featured: true,
    featuredOrder: 2,
    sortOrder: 2,
  };

  const exoplanetExplorer = {
    _id: "studioGame-exoplanet-explorer",
    _type: "studioGame",
    name: "Exoplanet Explorer",
    slug: slug("exoplanet-explorer"),
    status: "coming-soon",
    genres: ["Exploration"],
    platforms: ["Web"],
    blurb: "Explore real planets discovered beyond our solar system.",
    featured: false,
    sortOrder: 3,
  };

  const settings = {
    _id: "studioSettings",
    _type: "studioSettings",
    betaCallout: {
      eyebrow: "NOW RECRUITING TESTERS",
      title: "Play Space Cowboy before anyone else.",
      body: "Join the iOS and Android beta and help shape the game before launch.",
      game: { _type: "reference", _ref: "studioGame-space-cowboy" },
      platforms: ["ios", "android"],
    },
    newsletterBlurb: "New releases, beta invites and studio news. A few emails a year.",
    foundedLine:
      "Founded in New York in 2020 by design engineer Chris West, inkOrange Studios builds games that are easy to pick up and worth figuring out.",
  };

  return [terraforge, spaceCowboy, exoplanetExplorer, settings];
}
