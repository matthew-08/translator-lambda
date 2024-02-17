export const combineBuffer = (buffers: Buffer[]) => {
  const resultBuffer = Buffer.alloc(
    buffers.reduce((prev, curr) => prev + curr.length, 0)
  );

  let prevBuffEnd = 0;
  for (const buffer of buffers) {
    buffer.copy(resultBuffer, prevBuffEnd);
    prevBuffEnd += buffer.length;
  }

  return resultBuffer;
};
