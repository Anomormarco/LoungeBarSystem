const httpError = require("../utils/httpError");
const { verifyToken } = require("../utils/auth");

function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [type, token] = header.split(" ");

    if (type !== "Bearer" || !token) {
      throw httpError(401, "Nevtreh erh shaardlagatai");
    }

    req.user = verifyToken(token);
    next();
  } catch (error) {
    next(error.statusCode ? error : httpError(401, "Token buruu esvel hugatsaa duussan baina"));
  }
}

function roleGuard(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.type)) {
      return next(httpError(403, "Ene uildliig hiih erhgui"));
    }

    next();
  };
}

const ownerGuard = [authRequired, roleGuard("owner")];
const adminGuard = [authRequired, roleGuard("admin")];

module.exports = {
  authRequired,
  roleGuard,
  ownerGuard,
  adminGuard,
};
