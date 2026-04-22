export async function extractTextFromPDF(file: File): Promise<string> {
  // Use dynamic import so pdfjs-dist isn't evaluated on the server
  const pdfjsLib = await import('pdfjs-dist');
  
  // Configure the worker to be loaded from CDN since Webpack/Turbopack handles it clunkily by default
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDocument = await loadingTask.promise;
  
  let fullText = '';
  
  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
      
    fullText += pageText + '\\n\\n';
  }
  
  return fullText.trim();
}
