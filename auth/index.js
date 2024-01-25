import StorageToken from "../model/index.js";

const auth = async (req, res, next) => {
  try {
    //     check cookie for token
    if (req.cookies?.token) {
      const token = req.cookies.token;
      const storageToken = await StorageToken.findOne({ token: token });
      if (storageToken) {
        req.storage = storageToken;
        next();
      } else {
        // clear cookie
        res.clearCookie("token");
        return res.json({
          status: "Bad Request",
          message: "Invalid token",
        });
      }
    } else {
      return res.json({
        status: "Bad Request",
        message: "Storage not found",
      });
    }
  } catch (error) {
    console.error(error);
    return res.json({
      status: "Internal Server Error",
      message: error.message,
    });
  }
};

export default auth;
