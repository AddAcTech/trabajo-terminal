import db from "../../models/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const storeUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await db.User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await db.User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: "Email not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET || "your-secret-key"
      // { expiresIn: "" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error logging in:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

//indica si el atributo MainKey ha sido asignado 
export const verifyMainKey = async (req, res) => {
  try {
    const { id_user } = req.body;
    console.log("body veirfy: ", req.body)
    const user = await db.User.findOne({ where: { id : id_user } });

    if (!user) {
      return res.status(401).json({ error: "No se encontró al usuario" });
    }
    
    const hasMasterKey = user.mainkey != null
    console.log(`Usuario ${id_user} ${hasMasterKey?'':'NO'} tiene una clave asignada`)
    return res.status(200).json({
      poseeClaveMaestra : hasMasterKey
    });
  } catch (error) {
    console.error("Error verificando la clave maestra:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

//Verifica si el MainKey mandado es correcto
export const checkMainKey = async (req, res) => {
  try {
      console.log("body check: ", req.body)
    const { id_user, key } = req.body;
    const user = await db.User.findOne({ where: { id: id_user } });

    if (!user) {
      return res.status(401).json({ error: "No se encontró al usuario" });
    }
    
    const isKeyValid = await bcrypt.compare(key, user.mainkey);
    if (!isKeyValid) {
      return res.status(401).json({ error: "Clave maestra invalida" });
    }
    return res.status(200).json({
      message : "Clave valida"
    });
  } catch (error) {
    console.error("Error verificando la clave maestra:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

//almacenar la clave maestra
export const storeKey = async (req, res) => {
  try {
    console.log("body store: ", req.body)
    const { id_user, key } = req.body;

    // Hash the key
    const salt = await bcrypt.genSalt(10);
    const hashedKey = await bcrypt.hash(key, salt);

    const user = await db.User.findOne({ where : { id : id_user }  });
    user.mainkey = hashedKey;
    await user.save();

    return res.status(201).json({
      message: "Se añadio correctamente la clave maestra",
    });
  } catch (error) {
    console.error("Error al establecer la clave maestra:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};