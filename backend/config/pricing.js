// Active booth types — these power the public /vendors/prices endpoint and
// the Register page dropdown. 'Food Slot' and 'Drinks' were retired from
// new sales but are kept in LEGACY_BOOTH_PRICES below so vendors who already
// registered with them can still be priced and pay.
export const BOOTH_PRICES = {
  'Default': {
    'Royal Booth': 390000,
    'Half Booth': 195000
  },
  'Lagos': {
    'Royal Booth': 390000,
    'Half Booth': 195000
  },
  'Abuja': {
    'Royal Booth': 390000,
    'Half Booth': 195000
  },
  'Port Harcourt': {
    'Royal Booth': 390000,
    'Half Booth': 195000
  }
};

// Booth types no longer sold but still held by existing registrations.
// Payment validation (paymentService) checks this when the active price
// list has no entry — without it, legacy vendors' payments would be
// rejected as "Unrecognized booth type".
export const LEGACY_BOOTH_PRICES = {
  'Food Slot': 320000,
  'Drinks': 320000,
  'Drinks Slot': 320000
};

