import db from "../../models/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { borrarImagen } from "./images.controller.js";

export const storeUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, keyPolitic } = req.body;

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await db.User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      keyPolitic
    });

    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        useUniqueKey: user.useUniqueKey
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
        useUniqueKey: user.useUniqueKey
      },
    });
  } catch (error) {
    console.error("Error al inciar sesión: ", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id_user } = req.body;
    if (id_user == undefined || id_user == null || id_user == 0){ //no hay nada que validar
      return res.status(401).json({ error: "No se encontró al usuario" });
    }

    const user = await db.User.findOne({ where: { id : id_user} });
    if (!user) {
      return res.status(401).json({ error: "No se encontró al usuario" });
    }
    //borrar todas las imagenes de cloudnary:
    const images = await db.Image.findAll({
          where: {
            userId: id_user
          },
        });
    images.map(async (image) => {
      await borrarImagen(image.publicId);
    });
    //una vez se ejecuta la instrucción de borrar, 
    await user.destroy();

    return res.status(200).json({
      message: "Usuario borrado con exito"
    });
  } catch (error) {
    console.error("Error verificando la clave maestra:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

//indica si el atributo MainKey ha sido asignado, pero solo se se tiene activa la politica de 
export const verifyMainKey = async (req, res) => {
  try {
    const { id_user } = req.body;
    if (id_user == undefined || id_user == null || id_user == 0){ //no hay nada que validar
      return res.status(401).json({ error: "No se encontró el identificador del usuario" });
    }
    const user = await db.User.findOne({ where: { id : id_user} });

    if (!user) {
      return res.status(401).json({ error: "No se encontró al usuario" });
    }
    const hasMasterKey = user.mainKey != null 
      && user.useUniqueKey == 1 //Si mainKey es null, y se tiene activada la politica, entonces no hay una clave asignada
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
    
    const isKeyValid = user.useUniqueKey == 0 || //si vale cero (false), entonces no importa que envíe, por que no se necesita verificar la igualdad
    await bcrypt.compare(key, user.mainey); //si vale uno (true), entonces si hayq ue verificar que sea igual
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
    user.mainKey = hashedKey;
    await user.save();

    return res.status(201).json({
      message: "Se añadio correctamente la clave maestra",
    });
  } catch (error) {
    console.error("Error al establecer la clave maestra:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const setKeyPolitic = async (req, res) => {
  try {
    console.log("body politic: ", req.body)
    const { id_user, useUniqueKey } = req.body; //ingresa un booleano
    const user = await db.User.findOne({ where : { id : id_user }  });
    user.useUniqueKey = useUniqueKey?1:0;
    //para no tener problemas, siempre que se cambie la configuración, se borra el campo de la llave
    user.mainKey = null;
    await user.save();

    return res.status(201).json({
      message: "Se modificó la preferencia",
    });
  } catch (error) {
    console.error("Error al cambiar la politica de la clave maestra:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}