export const isLoggedIn = async (req, res, next) => {
  try {
    console.log(req.cookies);
    let token = req.cookies?.token;
    console.log("token found", token ? "Yes" : "No");
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "unauthorized failed" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("decoded data:", decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.log("auth middleware failure");
    return res.status(500).json({
      success: false,
      message: "interval server error"
    });
  }
  next();
};
