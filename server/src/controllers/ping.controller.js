// Ping controller
export const getPing = async (req, res) => {
  try {
    return res.status(200).json({ message: "pong" });
  } catch (error) {
    console.error("Error in ping controller:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
