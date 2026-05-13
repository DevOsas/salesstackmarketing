const QUESTIONS = [
  {
    id: "lead_source",
    category: "Lead Generation",
    prompt: "Where do most of your customers currently come from?",
    gap: "Inconsistent lead sources",
    options: {
      "Referrals only": 1,
      "Social media/content": 2,
      "Paid ads": 2,
      "Website/SEO": 2,
      Outreach: 2,
      "Multiple sources": 3,
      "Not sure": 0
    }
  },
  {
    id: "response_speed",
    category: "Response Speed",
    prompt: "When a new lead comes in, how fast do you usually respond?",
    gap: "Slow response time",
    options: {
      "Within 5 minutes": 3,
      "Within 1 hour": 2,
      "Same day": 1,
      "Next day or later": 0,
      "It depends": 1
    }
  },
  {
    id: "lead_capture",
    category: "Lead Capture",
    prompt: "Do you have a system that captures every inquiry?",
    gap: "Weak lead capture process",
    options: {
      "Yes, everything is captured": 3,
      "Some are captured": 2,
      "Mostly manual": 1,
      "No clear system": 0
    }
  },
  {
    id: "follow_up",
    category: "Follow-Up",
    prompt: "If a lead does not buy or book immediately, what happens next?",
    gap: "Manual or inconsistent follow-up",
    options: {
      "Automated follow-up sequence": 3,
      "Manual follow-up": 2,
      "Occasional follow-up": 1,
      Nothing: 0
    }
  },
  {
    id: "booking_conversion",
    category: "Booking Conversion",
    prompt: "Do you have a clear process that moves leads into bookings or sales?",
    gap: "No clear booking or sales conversion path",
    options: {
      "Yes, fully structured": 3,
      "Somewhat structured": 2,
      "Not really": 1,
      "No system": 0
    }
  },
  {
    id: "retention",
    category: "Retention",
    prompt: "Do you have a system to bring past customers or old leads back?",
    gap: "No repeat customer or reactivation system",
    options: {
      Yes: 3,
      Sometimes: 2,
      "Not really": 1,
      No: 0
    }
  }
];

const RECOMMENDATIONS = {
  "Lead Generation": "Build a balanced source mix so your growth is not dependent on one channel.",
  "Lead Capture": "Centralize every inquiry into one lead capture system with clear ownership.",
  "Response Speed": "Create instant alerts and first-response automations for every new lead.",
  "Follow-Up": "Install a structured follow-up sequence that keeps leads moving after the first inquiry.",
  "Booking Conversion": "Define the exact steps that turn interest into a booked call, visit, quote, or sale.",
  Retention: "Add reactivation and repeat-purchase campaigns for past customers and dormant leads."
};

function getResultLevel(percentage) {
  if (percentage >= 84) return "Strong Customer Flow";
  if (percentage >= 56) return "Unstable Customer Flow";
  if (percentage >= 28) return "Major Growth Gaps";
  return "High Leakage Risk";
}

function calculateScore(answers = {}) {
  let totalScore = 0;
  const categoryScores = {};
  const answerDetails = [];
  const detectedGaps = [];

  QUESTIONS.forEach((question) => {
    const selected = answers[question.id];
    const score = Number.isInteger(question.options[selected]) ? question.options[selected] : 0;
    totalScore += score;
    categoryScores[question.category] = {
      score,
      max: 3,
      percentage: Math.round((score / 3) * 100)
    };
    answerDetails.push({
      id: question.id,
      question: question.prompt,
      category: question.category,
      answer: selected || "Not answered",
      score
    });
    if (score <= 1) detectedGaps.push(question.gap);
  });

  const scorePercentage = Math.round((totalScore / 18) * 100);
  const weakest = answerDetails.reduce((risk, item) => (item.score < risk.score ? item : risk), answerDetails[0]);

  return {
    totalScore,
    scorePercentage,
    resultLevel: getResultLevel(scorePercentage),
    categoryScores,
    detectedGaps: detectedGaps.slice(0, 4),
    answerDetails,
    biggestRiskArea: weakest ? weakest.category : "Lead Generation",
    recommendedFixes: answerDetails
      .filter((item) => item.score <= 2)
      .map((item) => RECOMMENDATIONS[item.category])
      .filter(Boolean)
      .slice(0, 5)
  };
}

module.exports = {
  QUESTIONS,
  calculateScore,
  getResultLevel
};
