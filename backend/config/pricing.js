// Active booth types — these power the public /vendors/prices endpoint and
// the Register page dropdown.
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

// Booth types that are completely SOLD OUT.
// Any pending/unpaid vendors registered under these cannot pay.
export const SOLD_OUT_BOOTHS = ['food slot', 'drinks', 'drinks slot'];

export const LEGACY_BOOTH_PRICES = {};


