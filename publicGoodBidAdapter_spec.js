import { expect } from 'chai';
import sinon from 'sinon';
import { spec, storage } from 'modules/publicGoodBidAdapter.js';
import { hook } from 'src/hook.js';

describe('PublicGoodAdapter', function () {
  let bidRequests;
  let bidRequest;
  let bidResponse;
  let element;
  let sandbox;

  before(function () {
    hook.ready();
  });

  beforeEach(function () {
    element = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      getBoundingClientRect: () => {
        return {
          width: element.width,
          height: element.height,

          left: element.x,
          top: element.y,
          right: element.x + element.width,
          bottom: element.y + element.height
        };
      }
    };

    $$PREBID_GLOBAL$$.bidderSettings = {
      publicgood: {
        storageAllowed: true
      }
    };

    bidRequests = [
      {
        bidder: 'publicgood',
        params: {
          partnerId: 'publicgood',
          slotType: 'test'
        },
        adUnitCode: 'desktop_leaderboard_variable',
        bidId: 'foo',
        ortb2Imp: {
          ext: {
            tid: ''
          }
        },
        sizes: [[1030, 590]]
      }
    ];

    bidRequest = {
      refererInfo: {
        page: 'https://publicgood.com/'
      },
      uspConsent: '1YN-',
      gdprConsent: {},
      gppConsent: {}
    };

    bidResponse = {
      body: {
        "targetData": {
            "deviceType": "desktop",
            "parent_org": "publicgood",
            "cpm": 0,
            "target_id": "a9b430ab-1f62-46f3-9d3a-1ece821dca61",
            "deviceInfo": {
                "os": {
                    "name": "Mac OS",
                    "version": "10.15.7"
                },
                "engine": {
                    "name": "Blink",
                    "version": "130.0.0.0"
                },
                "browser": {
                    "major": "130",
                    "name": "Chrome",
                    "version": "130.0.0.0"
                },
                "cpu": {},
                "ua": "Mozilla\/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit\/537.36 (KHTML, like Gecko) Chrome\/130.0.0.0 Safari\/537.36",
                "device": {
                    "vendor": "Apple",
                    "model": "Macintosh"
                }
            },
            "widget_type": "card",
            "isInApp": false,
            "partner_id": "publicgood",
            "countryCode": "US",
            "metroCode": "602",
            "hasReadMore": false,
            "region": "IL",
            "campaign_id": "a9b430ab-1f62-46f3-9d3a-1ece821dca61"
        },
        "action": "Default",
        "url": "https%3A%2F%2Fpublicgood.com%2F",
        "content": {
            "parent_org": "publicgood",
            "rules_match_info": null,
            "content_id": 20446189,
            "all_matches": [
                {
                    "analysis_tag": "a9b430ab-1f62-46f3-9d3a-1ece821dca61",
                    "guid": "a9b430ab-1f62-46f3-9d3a-1ece821dca61"
                }
            ],
            "is_override": true,
            "cid_match_type": "",
            "target_id": "a9b430ab-1f62-46f3-9d3a-1ece821dca61",
            "url_id": 128113623,
            "title": "Public Good",
            "hide": false,
            "partner_id": "publicgood",
            "qa_verified": true,
            "tag": "a9b430ab-1f62-46f3-9d3a-1ece821dca61",
            "is_filter": false
        }
      }
    }

    sandbox = sinon.sandbox.create();
    sandbox.stub(document, 'getElementById').withArgs('desktop_leaderboard_variable').returns(element)
  });

  afterEach(function () {
    $$PREBID_GLOBAL$$.bidderSettings = {};
    sandbox.restore();
  });

  describe('spec.isBidRequestValid', function() {
    it('should return when it received all the required params', function() {
      const bid = bidRequests[0];
      expect(spec.isBidRequestValid(bid)).to.equal(true);
    });

  });

  describe('spec.buildRequests', function() {
    it('should have a url parameter', function() {
      const request = spec.buildRequests(bidRequests, bidRequest);
      expect(request.url).to.include('url=');
    });
  });

  describe('spec.interpretResponse', function() {
    it('should return bids in the shape expected by prebid', function() {
      const bids = spec.interpretResponse(bidResponse, bidRequest);

      const requiredFields = ['requestId', 'cpm', 'width', 'height', 'ad', 'ttl', 'creativeId', 'netRevenue', 'currency'];

      requiredFields.forEach(function(field) {
        expect(bids[0]).to.have.property(field);
      });
    });

    it('should return empty bids if there is no response from server', function() {
      const bids = spec.interpretResponse({ body: null }, bidRequest);
      expect(bids).to.have.lengthOf(0);
    });

    it('should return empty bids if the url results in a hide', function() {
      const bids = spec.interpretResponse({ body: {action: "Hide"} }, bidRequest);
      expect(bids).to.have.lengthOf(0);
    });
  });
});
