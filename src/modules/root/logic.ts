const NUM_BUCKETS = 5
export const computeHistogram = (data: {index: number, val: number}[]) => {
  const compareFnFactory = (shouldAscend = true) => {
    if(shouldAscend) return (d1, d2) => d1.val - d2.val
    else return (d1, d2) => d2.val - d1.val
  }
  const negativeSortedData = data.filter(({ val }) => val < 0).sort(compareFnFactory(false))
  const positiveSortedData = data.filter(({ val }) => val >= 0).sort(compareFnFactory(true))

  // fill buckts equally
  negativeSortedData.forEach((d, index) => {
    (d as any).bucket = Math.floor((index / negativeSortedData.length) * NUM_BUCKETS)
  })
  positiveSortedData.forEach((d, index) => {
    (d as any).bucket = Math.floor((index / positiveSortedData.length) * NUM_BUCKETS)
  })

  return negativeSortedData.concat(positiveSortedData) as {index: number, val: number, bucket: number}[]
}

export const getColorForBucket = (isPositive: boolean, bucket:number) => {
  const SHADES_OF_GREEN = [100, 200, 300, 400, 500]
  const SHADES_OF_RED = [100, 200, 300, 400, 500]
  if(isPositive) return `green.${[SHADES_OF_GREEN[bucket]]}`
  else return `red.${[SHADES_OF_RED[bucket]]}`
}