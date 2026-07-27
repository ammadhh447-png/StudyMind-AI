import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { User } from "../models/User.js";

function signToken(user) {
  return jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

function publicUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    avatar: user.avatar || "",
    authProvider: user.googleId ? "google" : "local",
  };
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }
    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hash });
    const token = signToken(user);
    res.status(201).json({
      success: true,
      token,
      user: publicUser(user),
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user?.password) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    const token = signToken(user);
    res.json({
      success: true,
      token,
      user: publicUser(user),
    });
  } catch (err) {
    next(err);
  }
}

export async function googleAuth(req, res, next) {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: "Missing Google credential" });
    }
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(503).json({ success: false, message: "Google sign-in not configured" });
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
    const payload = ticket.getPayload();
    const email = payload?.email;
    const googleId = payload?.sub;
    const name = payload?.name || email?.split("@")[0] || "Student";
    const avatar = payload?.picture;

    if (!email) {
      return res.status(400).json({ success: false, message: "Google account email unavailable" });
    }

    let user = await User.findOne({ $or: [{ email }, { googleId }] });
    if (!user) {
      user = await User.create({ name, email, googleId, avatar });
    } else if (!user.googleId) {
      user.googleId = googleId;
      if (avatar) user.avatar = avatar;
      await user.save();
    } else if (avatar && user.avatar !== avatar) {
      user.avatar = avatar;
      await user.save();
    }

    const token = signToken(user);
    res.json({ success: true, token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({
      success: true,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        avatar: user.avatar || "",
        bio: user.bio,
        preferences: user.preferences,
        authProvider: user.googleId ? "google" : "local",
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { name, bio, preferences, password, newPassword } = req.body;
    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };
    if (newPassword) {
      if (!user.password) {
        return res.status(400).json({
          success: false,
          message: "Google accounts manage password through Google",
        });
      }
      if (!password) {
        return res.status(400).json({ success: false, message: "Current password required" });
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ success: false, message: "Current password incorrect" });
      }
      user.password = await bcrypt.hash(newPassword, 12);
    }
    await user.save();

    res.json({
      success: true,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        avatar: user.avatar || "",
        bio: user.bio,
        preferences: user.preferences,
        authProvider: user.googleId ? "google" : "local",
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function uploadAvatar(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (user.googleId) {
      return res.status(400).json({
        success: false,
        message: "Google profile photo is managed by your Google account",
      });
    }
    if (!req.file?.buffer?.length) {
      return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    const { storeFile } = await import("../services/storage.service.js");
    const stored = await storeFile(req.file.buffer, req.file.originalname, req.file.mimetype);
    user.avatar = stored.url;
    await user.save();

    res.json({
      success: true,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        avatar: user.avatar || "",
        bio: user.bio,
        preferences: user.preferences,
        authProvider: "local",
      },
    });
  } catch (err) {
    next(err);
  }
}
