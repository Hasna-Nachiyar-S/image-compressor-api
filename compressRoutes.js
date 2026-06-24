console.log("compressRoutes loaded");

const express = require("express");
const router = express.Router();

const controller = require("../controllers/compressController");

router.post("/from-url", controller.compressFromUrl);

module.exports = router;
