// ─────────────────────────────────────────────────────────────
// EDIT THIS FILE to customize the wedding site. No other files
// need to change for basic content updates (names, date, venue,
// FAQ, photos, RSVP link). See README.md for step-by-step help.
// ─────────────────────────────────────────────────────────────

// Prefixes image paths with Vite's base URL (see `base` in vite.config.js)
// so photos resolve correctly whether the site is hosted at a domain root
// or a subpath (e.g. GitHub Pages' username.github.io/repo-name/). Exported
// so components reaching into `public/` directly (not through this content
// object) can prefix their own paths the same way.
export const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

const content = {
  couple: {
    partner1: "Yashoratna",
    partner2: "Mahek",
  },

  wedding: {
    // ISO 8601 with a timezone offset (not "Z") so the countdown is
    // accurate for every guest regardless of their own timezone.
    // Set to the Phere (main ceremony) date/time, IST (+05:30).
    dateTimeISO: "2026-12-06T17:00:00+05:30",
    displayDate: "DECEMBER 6, 2026", // human-readable, revealed by the scratch card
  },

  hero: {
    tagline: "With All The Blessings",
    invite: "WE INVITE YOU TO",
  },

  // Shown in the "Meet the Couple" / Family section — traditional royal Indian
  // wedding family cards with shloka, parentage, and blessings.
  familySection: {
    shloka: [
      "॥ ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं ।",
      "भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात् ॥",
    ],
    quote:
      '"We meditate on the transcendent glory of the Divine Sun, creator of all realms — may that divine brilliance inspire and illuminate our path."',
    brideFamily: {
      symbol: "॥ मंगलम् ॥",
      symbolTranslation: "Auspicious Beginning",
      familyTitle: "THE GUPTA FAMILY",
      location: "Moradabad · The City of Brass",
      grandparents: ["Late Smt. Sarla Devi Gupta", "Late Shri Prem Shankar Gupta"],
      invitePhrase1: "with their family and loved ones",
      parents: ["Smt. Deepa Gupta", "Shri Rajiv Gupta"],
      invitePhrase2: "request the pleasure of your company on the auspicious wedding of",
      name: "Mahek",
      relation: "Their beloved daughter",
    },
    groomFamily: {
      symbol: "॥ युग्म ॥",
      symbolTranslation: "Sacred Union",
      familyTitle: "THE GUPTA FAMILY",
      location: "Moradabad · The City of Brass",
      grandparents: ["Late Smt. Rama Gupta", "Late Shri Shri Niwas Gupta"],
      invitePhrase1: "with their family and loved ones",
      parents: ["Smt. Renu Gupta", "Shri Sandeep Kumar Gupta"],
      invitePhrase2: "request the pleasure of your company on the auspicious wedding of",
      name: "Yashoratna",
      relation: "Their beloved son",
    },
  },

  coupleProfiles: {
    bride: {
      name: "Mahek Gupta",
      grandparentage: {
        label: "Granddaughter of",
        person1: "Late Smt. Sarla Devi Gupta",
        person2: "Late Shri Prem Shankar Gupta",
      },
      parentage: {
        label: "Daughter of",
        person1: "Smt. Deepa Gupta",
        person2: "Shri Rajiv Gupta",
      },
    },
    groom: {
      name: "Yashoratna Gupta",
      grandparentage: {
        label: "Grandson of",
        person1: "Late Smt. Rama Gupta",
        person2: "Late Shri Shri Niwas Gupta",
      },
      parentage: {
        label: "Son of",
        person1: "Smt. Renu Gupta",
        person2: "Shri Sandeep Kumar Gupta",
      },
    },
  },

  coupleVectorArt: asset("/images/bridengroom/brideNgroom_No_Bg_Vector.png"),

  // Time in seconds after which a flipped event card automatically flips back to the front.
  eventCardAutoFlipSeconds: 20,

  // Event cards shown on the Event Details section (3D flip cards).
  // Front shows name, day, date, time; back reveals description, attire, location, and notes.
  events: [
    {
      name: "Haldi",
      meal: "Lunch to follow",
      day: "Saturday",
      date: "December 5, 2026",
      time: "12:30 PM",
      description: "A joyful and vibrant ceremony of turmeric blessings, love, and sunny smiles.",
      attire: "Shades of Pink",
      location: "Poolside Lawn",
      note: "Get ready for color, music, and haldi fun!",
    },
    {
      name: "Engagement & Sangeet",
      day: "Saturday",
      date: "December 5, 2026",
      time: "5:00 PM",
      description: "An enchanting evening of music, dance performances, and celebration.",
      attire: "Glam and Glitter",
      location: "Grand Ballroom",
      note: "Followed by dinner, music & celebration.",
    },
    {
      name: "Godh Bharai & Sagai",
      meal: "Dinner to follow",
      day: "Saturday",
      date: "December 5, 2026",
      time: "7:00 PM",
      description: "Traditional blessings and auspicious ring ceremony with family & loved ones.",
      attire: "Glam and Glitter",
      location: "Grand Ballroom",
      note: "Celebration followed by music and dinner.",
    },
    {
      name: "Baraat & Ghurchari",
      day: "Sunday",
      date: "December 6, 2026",
      time: "10:30 AM",
      description: "The groom's royal dancing procession with festive dhol beats and celebration.",
      attire: "Ethnic Wear",
      location: "Resort Entrance to Mandap",
      note: "Join the groom's baraat procession!",
    },
    {
      name: "Jaimaal",
      meal: "Gala Lunch to follow",
      day: "Sunday",
      date: "December 6, 2026",
      time: "1:00 PM",
      description: "The auspicious floral garland exchange marking the union of bride and groom.",
      attire: "Ethnic Wear",
      location: "Central Mandap",
      note: "Shower the couple with flower petals.",
    },
    {
      name: "Phere",
      meal: "Dinner to follow",
      mealTime: "8:00 PM",
      day: "Sunday",
      date: "December 6, 2026",
      time: "5:00 PM",
      description: "The seven sacred vows around the holy agni solemnizing the sacred marriage bond.",
      attire: "Ethnic Wear",
      location: "Mandap by the Forest",
      note: "Dinner & reception to follow.",
    },
  ],

  // Venue information & 'How to reach the venue?' popup details
  venue: {
    name: "Winsome Resort & Spa",
    phone: "+91 99714 99502 / +91 95600 02045",
    website: "https://www.winsomeresorts.com/",
    address:
      "Vill. Nandpur, Choi, Gabua (Near Dabka River, Jim Corbett National Park), Ramnagar – Nainital Road, Khempur, Uttarakhand 244715",
    qrUrl: "https://share.google/xZAuCAlAAjEHdfEsY",
    directionsUrl:
      "https://maps.google.com/?daddr=Winsome+Resort+Jim+Corbett",
    modalAutoCloseSeconds: 90,
    saveEventsAutoCloseSeconds: 90,
    howToReach: [
      {
        mode: "By Road",
        subtitle: "Driving Routes",
        routes: [
          {
            name: "Delhi",
            distance: "~245 km · ~5–6 hrs",
            details: [{ text: "→ Moradabad → Ramnagar" }],
          },
          {
            name: "Moradabad",
            distance: "~81 km · ~2 hrs",
            details: [
              { text: "*Route 1* — Tanda → Bajpur → Ramnagar  ✅ *Recommended*" },
              { text: "*Route 2* — Kashipur → Ramnagar" },
            ],
          },
          {
            name: "Bareilly",
            distance: "~138 km · ~3 hrs",
            details: [{ text: "→ Rampur → Suar → Bajpur → Ramnagar" }],
          },
          {
            name: "Dehradun / Haridwar",
            distance: "~250 km · ~5 hrs",
            details: [{ text: "→ Haridwar → Ramnagar" }],
          },
          {
            name: "Chandigarh",
            distance: "~425 km · ~8 hrs",
            details: [{ text: "→ Saharanpur → Haridwar → Ramnagar" }],
          }
        ],
      },
      {
        mode: "By Train",
        subtitle: "Railway Stations",
        routes: [
          {
            name: "Ramnagar Railway Station (RMR)",
            distance: "~7 km · ~15 min",
            details: [{ text: "→ Direct trains available from Delhi & Moradabad" }],
          },
          {
            name: "Kathgodam Railway Station (KGM)",
            distance: "~80 km · ~2.5 hrs",
            details: [{ text: "→ Connected by trains from Delhi and other major cities" }]
          },
        ],
      },
      {
        mode: "By Air",
        subtitle: "Airport Connectivity",
        routes: [
          {
            name: "Pantnagar Airport (PGH)",
            distance: "~150 km · ~3–4 hrs",
            details: [{ text: "→ Nearest airport to the resort." }],
          },
          {
            name: "Indira Gandhi International Airport (IGI)",
            distance: "~265 km · ~5.5–6 hrs",
            details: [{ text: "→ Major airport hub with direct cabs and train connections to Ramnagar." }],
          },
        ],
      },
    ],
  },

  // Map destination address
  mapAddress: "Winsome Resorts and Spa, Jim Corbett",

  gallery: [
    { src: asset("/images/gallery/placeholder-01.jpg"), alt: "Placeholder photo 1" },
    { src: asset("/images/gallery/placeholder-02.jpg"), alt: "Placeholder photo 2" },
    { src: asset("/images/gallery/placeholder-03.jpg"), alt: "Placeholder photo 3" },
    { src: asset("/images/gallery/placeholder-04.jpg"), alt: "Placeholder photo 4" },
    { src: asset("/images/gallery/placeholder-05.jpg"), alt: "Placeholder photo 5" },
    { src: asset("/images/gallery/placeholder-06.jpg"), alt: "Placeholder photo 6" },
  ],

  blessings: {
    heading: "Wall of Blessings",
    subtext: "Sweet wishes from our family & friends",
  },

  blessingsRsvp: {
    heading: "RSVP",
    subtext: "Please let us know if you will be celebrating with us",
  },

  faq: [
    {
      question: "How do I reach the venue?",
      answer: "Click the button below to save, download pdf or share as text/pdf over whatsapp",
      action: {
        type: "venueModal",
        label: "How to reach the venue?",
      },
    },
    {
      question: "How to save or share the event details?",
      answer: "Click the button below to save, download pdf or share as text/pdf over whatsapp",
      action: {
        type: "saveEventsModal",
        label: "Save Event Details",
      },
    },
    {
      question: "Is parking available at the venue?",
      answer:
        "Yes, complimentary on-site self-parking and dedicated valet assistance are available at Winsome Resort & Spa for all wedding guests throughout the celebrations.",
    },
    {
      question: "What are the dress codes and themes for the events?",
      answer:
        "We encourage you to dress in accordance with the ceremony themes:\n" +
        "• Haldi (Dec 5, 12:30 PM): Shades of Pink\n" +
        "• Engagement & Sangeet (Dec 5, 5:00 PM): Glam and Glitter\n" +
        "• Wedding Day (Dec 6): Ethnic Wear",
    },
    {
      question: "What will the weather be like in Jim Corbett in December?",
      answer:
        "• Daytime: Roughly 21–24°C, comfortable and pleasant.\n" +
        "• Afternoons: Usually sunny and pleasant, with around 9 hours of sunshine.\n" +
        "• Mornings: Can be cool and occasionally misty or foggy.\n" +
        "• Night & Early Morning: Roughly 8–12°C, so it can feel quite cold.\n\n" +
        "(Tip: We recommend carrying warm shawls, jackets, or blazers for the evening and early morning outdoor celebrations).",
    },
    {
      question: "What are the check-in formalities and accommodation arrangements?",
      answer:
        "Room accommodations have been arranged at Winsome Resort & Spa for outstation guests.\n\n" +
        "• Check-in Time: 12:00 PM\n" +
        "• Check-out Time: 10:00 AM\n\n" +
        "• Mandatory Photo ID: As per resort and Uttarakhand government regulations, all adult guests must present a valid physical or digital Aadhaar Card (or Driving License / Govt. ID) during check-in.\n\n" +
        "• Hospitality & Assistance Contacts:\n" +
        "  - Resort Helpdesk: +91 99714 99502 / +91 95600 02045\n" +
        "  - Shri Sandeep Kumar Gupta (Groom Side): +91 81719 97832\n" +
        "  - Shri Rajiv Gupta (Bride Side): +91 94128 06535\n\n" +
        "Resort's hospitality desk will be stationed at the resort reception to assist you with room keys, luggage, and event timings throughout your stay.\n\n" +
        "Snacks will be available throughout the event for untimely hunger pangs, late-night cravings, overnight chakhna needs, and guests arriving at different times.",
    },
    {
      question: "What are the official wedding hashtags for sharing photos?",
      answer:
        "If you upload photos, stories, or reels anywhere on social media (Instagram, Facebook, etc.), please use our wedding hashtags:\n\n" +
        "#MahekWedsYash\n" +
        "#YashKiMahek\n\n" +
        "You can also upload your candid photos and videos directly to our wedding album:",
      action: {
        type: "uploadModal",
        label: "Upload Photos & Videos",
      },
    },
  ],

  // Background music, played site-wide with a mute button in the bottom
  // corner. Leave `src` blank (default) and the player is hidden entirely.
  // To enable it, add your own royalty-free/licensed audio file at
  // public/audio/background-music.mp3 and set src below — see README.md
  // "Background music" for details and where to legally source a track.
  music: {
    src: asset("/audio/background-music.mp3"),
  },

  integrations: {
    // Google Sheets & Drive integration (Primary)
    appsScriptUrl:
      "https://script.google.com/macros/s/AKfycbylOxWOQ0hVZfrTDVLmqm3qIhdIRylwc-kOgu0iu-zrTkQeutSD96UARBdNltJe1zMDlA/exec",

    // Firebase Firestore integration (Real-time text blessings & RSVPs)
    firebase: {
      apiKey: "AIzaSyB-H7JyM-REapOa3PftjigCqhMBjaSOu3Y",
      authDomain: "yashmahekwedding.firebaseapp.com",
      projectId: "yashmahekwedding",
      messagingSenderId: "965259334403",
      appId: "1:965259334403:web:a39a2f27c227082a7dcf36",
    },

    // Optional: a phone number (with country code, e.g. "919876543210") to
    // pre-address the RSVP "Share via WhatsApp" button at. Leave blank and
    // the button opens WhatsApp's contact picker instead.
    whatsappNumber: "",
  },
};

export default content;
