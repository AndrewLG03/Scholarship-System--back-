function onlyCommittee(req, res, next) {
  try {
    // Si no viene un usuario en el token
    if (!req.user) {
      return res.status(401).json({ error: "No autorizado" });
    }

    // Validar que el rol del usuario sea Comité
    if (req.user.role !== "comite") {
      return res.status(403).json({ error: "Acceso denegado. Solo comité." });
    }

    next(); // El usuario tiene rol de comité → continúa
  } catch (error) {
    console.error("Error en control de roles:", error);
    res.status(500).json({ error: "Error interno de permisos" });
  }
}

module.exports = { onlyCommittee };
