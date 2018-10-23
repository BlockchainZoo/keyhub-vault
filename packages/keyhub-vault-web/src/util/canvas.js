'use strict'

const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
  const words = text.split(' ')
  let line = ''

  let height = y
  ctx.textBaseline = 'top'

  for (let n = 0; n < words.length; n += 1) {
    const testLine = `${line}${words[n]} `
    const metrics = ctx.measureText(testLine)
    const testWidth = metrics.width
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, height)
      line = `${words[n]} `
      height += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, x, height)
  height += lineHeight
  return height
}

const drawText = (ctx, text, width) => {
  const { canvas } = ctx

  // setting the width or height should clear the canvas
  if (width) canvas.width = width
  canvas.height = 10000
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  ctx.font = '14pt Lato, Roboto, Calibri, serif'
  ctx.fillStyle = '#333'
  const height = wrapText(ctx, text, 5, 5, canvas.width, 25)
  const imageData = ctx.getImageData(0, 0, canvas.width, height)

  // setting the height should clear the canvas
  canvas.height = height
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.putImageData(imageData, 0, 0)
  return ctx
}

const getImageData = ctx => ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)

module.exports = {
  wrapText,
  drawText,
  getImageData,
}
