'use strict';

import {registerBidder} from 'prebid.js/src/adapters/bidderFactory.js';
import {BANNER, NATIVE} from 'prebid.js/src/mediaTypes.js';

const BIDDER_CODE = 'publicgood';
const PUBLIC_GOOD_ENDPOINT = 'https://advice-demo.pgs.io';
var PGSAdServed = false;

export const spec = {
  code: BIDDER_CODE,
  supportedMediaTypes: [BANNER, NATIVE],

  isBidRequestValid: function (bid) {
    // right now all params are optional, the url passed to the service can determine partnerId

    if (PGSAdServed) {
      return false;
    }

    return true;
  },


  buildRequests: function (validBidRequests, bidderRequest) {

    let partnerId = "";
    let slotId= "";

    if (validBidRequests[0] && validBidRequests[0].params) {
      partnerId = validBidRequests[0].params.partnerId;
      slotId = validBidRequests[0].params.slotId;
    }

    let payload = {
      url: bidderRequest.refererInfo.page || bidderRequest.refererInfo.referer,
      partner_id: partnerId,
      isprebid: true,
      slotid: slotId,
      bidRequest: validBidRequests[0]
    }


    return {
      method: 'POST',
      url: PUBLIC_GOOD_ENDPOINT,
      data: payload,
      options: {
        withCredentials: false,
      },
      bidId: validBidRequests[0].bidId
    }
  },

  interpretResponse: function (serverResponse, bidRequest) {
    const serverBody = serverResponse.body;
    let bidResponses = [];
    let bidResponse = {};
    let partnerId = serverBody && serverBody.targetData ? serverBody.targetData.partner_id : "error";

    if (!serverBody || typeof serverBody !== 'object') {
      return [];
    }

    if (serverBody.action !== 'Hide' && !PGSAdServed) {

      bidResponse.requestId = bidRequest.bidId; // will maybe need to update to pass session_id
      bidResponse.creativeId = serverBody.targetData.target_id;
      bidResponse.cpm = serverBody.targetData.cpm;
      bidResponse.width = "320";
      bidResponse.height = "470";
      bidResponse.ad = `<div class="pgs-dpg-flex" partner-id="${partnerId}" style="height: 470px; width: 100%"></div> <script async type="text/JavaScript" src="https://assets.publicgood.com/pgm/v1/dpg.js"></script>`;
      bidResponse.currency = 'USD';
      bidResponse.netRevenue = true;
      bidResponse.ttl = 360; 
      bidResponse.meta = {advertiserDomains: []};
      bidResponses.push(bidResponse);
      
    }

    // We only want to call advice once, not for every bid - but we could theoretically replicate this 
    // bid x times for all valid bid requests instead - for now only bid on the first request
    return bidResponses;
  },

  /**
   * Register the user sync pixels which should be dropped after the auction.
   *
   * @param {SyncOptions} syncOptions Which user syncs are allowed?
   * @param {ServerResponse[]} serverResponses List of server's responses.
   * @return {UserSync[]} The user syncs which should be dropped.
   */
  getUserSyncs: (syncOptions, serverResponses) => [],

  /**
   * Register bidder specific code, which will execute if a bid from this bidder won the auction
   * @param {Bid} The bid that won the auction
   */
  onBidWon: function(bid) {
    // Can we use this to cancel all remaining bids or is it too late
    PGSAdServed = true;
  }

};
registerBidder(spec);
