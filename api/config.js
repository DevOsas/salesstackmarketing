module.exports = function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method not allowed." });
  }

  return res.status(200).json({
    booking_link: process.env.BOOKING_LINK || "https://yourbookinglink.com"
  });
};
