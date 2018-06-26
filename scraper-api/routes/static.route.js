const express = require('express');
const rp = require('request-promise');
const { getLinks, appendInnerPage } = require('../common.js');
const router = express.Router();
// Get Static Route
router.post('/get-static', async (req, res) => {

  let url = req.body.url;
  let {context, link_selector: linkSelector, inner_page_selector: innerPageSelector, break_in_parts: breakInParts, no_of_parts: noOfParts, left_html: leftHtml, inner_feeds_scraper: innerFeedsScraper} = req.body.options;

  let results = {
    'status': '',
    'response': {},
    'error': {},
    'left': '',
    'leftHtml': ''
  };

  try {
    // For Remaining HTML content
    if (breakInParts && leftHtml != "") {
      results.response.body = leftHtml;
      results.response.statusCode = 200;
    } else { // For first time
      console.log("Fetching");
      await rp({
        uri: url,
        method: 'GET',
        resolveWithFullResponse: true
      }).then(async (response) => {
        results.response = response;
      });
    }

    links = getLinks(results.response.body, context, linkSelector, breakInParts, noOfParts);
    console.log(links);
    // Inner Fetching Check
    if (innerFeedsScraper) {
      // If enabled inner fetching
      const body = await Promise.all(links.map(url =>
        rp(url)
      )).then(values => {
        return values;
      });
      // Append Inner Page in context
      [results.response.body, results.leftHtml, results.left] = appendInnerPage(results.response.body, context, body, innerPageSelector, breakInParts, noOfParts);
    }
    // Set status to true if everything goes successfull.
    results.status = true;
  }
  catch(err) {
    // Set status to false if error occurs.
    results.status = false;
    results.error = err;
    console.log(err);
  }
  // Return the response in json
  res.send(JSON.stringify(results));
});

module.exports = router;
