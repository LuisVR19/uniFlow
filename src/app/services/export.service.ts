import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class ExportService {
  async exportAsPng(element: HTMLElement, filename: string): Promise<void> {
    const canvas = await this.renderCanvas(element, 2);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))),
        'image/png',
      );
    });
    await this.saveBlob(blob, filename);
  }

  async exportAsPdf(element: HTMLElement, filename: string): Promise<void> {
    const canvas = await this.renderCanvas(element, 1.5);
    const imgData = canvas.toDataURL('image/png');

    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    const pad = 8;
    const maxW = pageW - pad * 2;
    const maxH = pageH - pad * 2;
    const ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
    const imgW = canvas.width * ratio;
    const imgH = canvas.height * ratio;
    const x = (pageW - imgW) / 2;
    const y = (pageH - imgH) / 2;

    pdf.addImage(imgData, 'PNG', x, y, imgW, imgH);
    const pdfBlob = pdf.output('blob');
    await this.saveBlob(pdfBlob, filename);
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private async saveBlob(blob: Blob, filename: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await this.saveNative(blob, filename);
    } else {
      this.saveWeb(blob, filename);
    }
  }

  private async saveNative(blob: Blob, filename: string): Promise<void> {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');

    const base64 = await this.blobToBase64(blob);
    const result = await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Cache,
    });

    await Share.share({ title: filename, url: result.uri });
  }

  private saveWeb(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private async renderCanvas(element: HTMLElement, scale: number): Promise<HTMLCanvasElement> {
    const { default: html2canvas } = await import('html2canvas');

    const backgroundColor =
      getComputedStyle(document.documentElement)
        .getPropertyValue('--ion-background-color')
        .trim() || '#f8fafc';

    return html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor,
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight,
      windowWidth: element.scrollWidth,
    });
  }
}
