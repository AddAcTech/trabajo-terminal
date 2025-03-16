import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pingRoutes from "./src/routes/ping.routes.js";
import usersRoutes from "./src/routes/users.route.js";
import imagesRoutes from "./src/routes/images.routes.js";

dotenv.config();

// Initialize express
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "http://localhost:5174" }));

// Routes
app.use("/ping", pingRoutes);
app.use("/users", usersRoutes);
app.use("/images", imagesRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
