export function orderProductImagesByResolution(images: string[]): string[] {
  return images
    .map((url, index) => {
      const dimensions = url.match(/(?:^|[^\d])(\d{3,4})x(\d{3,4})(?:[^\d]|$)/i);
      const pixelArea = dimensions
        ? Number(dimensions[1]) * Number(dimensions[2])
        : 0;

      return { url, index, pixelArea };
    })
    .sort((a, b) => b.pixelArea - a.pixelArea || a.index - b.index)
    .map(image => image.url);
}
