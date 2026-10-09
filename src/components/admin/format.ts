export function formatPkr(amount: number) {
  return `Rs. ${amount.toLocaleString('en-PK')}`
}

/** Sample series. Swap these arrays for live GMV / billing queries later. */
export const PLACEHOLDER_GMV = {
  note: 'Placeholder GMV series — replace with live sales aggregation.',
  '7D': [
    { label: 'Mon', gmv: 1800 },
    { label: 'Tue', gmv: 2400 },
    { label: 'Wed', gmv: 2100 },
    { label: 'Thu', gmv: 3200 },
    { label: 'Fri', gmv: 4100 },
    { label: 'Sat', gmv: 5200 },
    { label: 'Sun', gmv: 4700 },
  ],
  '30D': [
    { label: 'W1', gmv: 14200 },
    { label: 'W2', gmv: 16800 },
    { label: 'W3', gmv: 15100 },
    { label: 'W4', gmv: 23500 },
  ],
  '12M': [
    { label: 'Oct', gmv: 42000 },
    { label: 'Nov', gmv: 38000 },
    { label: 'Dec', gmv: 51000 },
    { label: 'Jan', gmv: 47000 },
    { label: 'Feb', gmv: 53000 },
    { label: 'Mar', gmv: 49000 },
    { label: 'Apr', gmv: 61000 },
    { label: 'May', gmv: 58000 },
    { label: 'Jun', gmv: 64000 },
    { label: 'Jul', gmv: 59000 },
    { label: 'Aug', gmv: 72000 },
    { label: 'Sep', gmv: 68000 },
  ],
} as const

export const PLACEHOLDER_SPARKS = {
  dealers: [1, 1, 1, 2, 2, 2],
  outlets: [1, 2, 2, 3, 3, 3],
  gmv: [12, 14, 13, 18, 21, 23.5],
  trials: [1, 2, 2, 3, 3, 3],
}
