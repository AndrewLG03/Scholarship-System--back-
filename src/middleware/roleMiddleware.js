function onlyCommittee(req, res, next) {
    if (!req.user || req.user.role !== "comite") {
        return res.status(403).json({ message: "Acceso denegado: solo comité" });
    }
    next();
}

module.exports = { onlyCommittee };

