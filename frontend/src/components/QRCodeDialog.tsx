import { QRCodeSVG } from 'qrcode.react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface QRCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  url: string
  moduleName: string
}

export function QRCodeDialog({ open, onOpenChange, url, moduleName }: QRCodeDialogProps) {
  const handleDownload = () => {
    const svg = document.getElementById('qr-code-svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    canvas.width = 512
    canvas.height = 512

    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 512, 512)
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.download = `${moduleName.replace(/\s+/g, '-')}-qr-code.png`
          link.href = url
          link.click()
          URL.revokeObjectURL(url)
        }
      })
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Module</DialogTitle>
          <DialogDescription>
            Scan this QR code to view the lesson on any device
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-6 rounded-2xl border-2 border-yellow-200">
            <QRCodeSVG
              id="qr-code-svg"
              value={url}
              size={256}
              level="H"
              includeMargin={true}
            />
          </div>
          <div className="text-center">
            <p className="font-semibold text-lg mb-1">{moduleName}</p>
            <p className="text-sm text-muted-foreground mb-4">Read-only view</p>
          </div>
          <Button
            onClick={handleDownload}
            variant="yellow"
            className="w-full"
            size="lg"
          >
            <Download className="size-5 mr-2" />
            Download QR Code
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            The QR code links to: <br />
            <span className="font-mono text-xs break-all">{url}</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
