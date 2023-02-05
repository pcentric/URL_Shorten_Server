const express = require("express");
const validUrl = require("valid-url");
const shortId = require("shortid");
const Url = require("../models/Url");
const config = require("config");

const router = express.Router();

router.get("/", (req, res) => {
  return res.status(200).json({
    message: "APP IS RUNNING BROTHER.",
  });
});
router.get("/all", (req, res) => {
  Url.find()
    .then((result) => {
      console.log(result)
      if (result.length > 0) {
        return res
          .status(200)
          .send({ message: "Search Result", ServerResponse: result });
      } else {
        return res.status(404).send({ message: "No results found" });
      }
    })
    .catch((error) => {
      res.status(500).send({ ErrorOccured: error });
    });
});

router.post("/shorten", async (req, res) => {
  const { longUrl } = req.body;

  const baseUrl = config.get("baseUrl");

  if (!validUrl.isUri(baseUrl)) {
    return res.status(400).json({ message: "Invalid base url" });
  }
  if (validUrl.isUri(longUrl)) {
    try {
      let url = await Url.findOne({ longUrl });
      if (url) {
        console.log("Already exists...");
        return res.status(201).json({ data: url });
      } else {
        let urlCode = shortId.generate();
        let shortUrl = baseUrl + "/" + urlCode;

        let url = new Url({
          longUrl,
          shortUrl,
          urlCode,
          date: new Date(),
        });

        console.log("Saving...");
        await url.save();
        return res.status(201).json({ data: url });
      }
    } catch (error) {
      return res.status(500).json({ message: "Some error has occurred" });
    }
  } else {
    return res.status(400).json({ message: "Invalid long url" });
  }
});

router.get("/:code", async (req, res) => {
  try {
    const url = await Url.findOne({ urlCode: req.params.code });

    if (url) {
      console.log("Long url found for short url. Redirecting...");
      return res.redirect(url.longUrl);
    } else {
      return res.status(404).json({ message: "No url found" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Some error has occurred" });
  }
});

module.exports = router;
