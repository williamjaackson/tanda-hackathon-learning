import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Award } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface CertificateProps {
  userName: string
  courseName: string
  courseCode: string
  completionDate: Date
  courseId: number
}

export function Certificate({ userName, courseName, courseCode, completionDate, courseId }: CertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null)

  const handleDownload = async () => {
    if (!certificateRef.current) return

    try {
      // Temporarily scale up for high quality capture
      const originalWidth = certificateRef.current.style.width
      certificateRef.current.style.width = '1122px'

      // Wait for layout to settle
      await new Promise(resolve => setTimeout(resolve, 100))

      // Capture the certificate as an image
      const canvas = await html2canvas(certificateRef.current, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
      })

      // Restore original width
      certificateRef.current.style.width = originalWidth

      // Create PDF
      const imgWidth = 297 // A4 width in mm (landscape)
      const imgHeight = 210 // A4 height in mm (landscape)

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      })

      const imgData = canvas.toDataURL('image/png', 1.0)
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, '', 'FAST')

      // Download
      const fileName = `${courseName.replace(/\s+/g, '-')}-Certificate.pdf`
      pdf.save(fileName)
    } catch (error) {
      console.error('Error generating certificate:', error)
      alert('Failed to generate certificate. Please try again.')
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Certificate Preview */}
      <div
        ref={certificateRef}
        className="p-16 relative overflow-hidden mx-auto"
        style={{
          width: '100%',
          maxWidth: '1122px',
          aspectRatio: '297/210',
          backgroundColor: '#ffffff',
        }}
      >
        {/* Decorative Border */}
        <div className="absolute inset-8 rounded-lg" style={{ border: '8px solid #eab308' }}></div>
        <div className="absolute inset-12 rounded-lg" style={{ border: '2px solid #fde047' }}></div>

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 text-9xl" style={{ color: '#eab308' }}>★</div>
          <div className="absolute top-10 right-10 text-9xl" style={{ color: '#eab308' }}>★</div>
          <div className="absolute bottom-10 left-10 text-9xl" style={{ color: '#eab308' }}>★</div>
          <div className="absolute bottom-10 right-10 text-9xl" style={{ color: '#eab308' }}>★</div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Award className="size-16" style={{ color: '#eab308' }} />
            </div>
            <h1 className="text-6xl font-bold mb-2" style={{ color: '#1f2937' }}>
              Certificate of Completion
            </h1>
            <div className="w-32 h-1 mx-auto" style={{ backgroundColor: '#eab308' }}></div>
          </div>

          {/* Body */}
          <div className="text-center space-y-6 mb-8">
            <p className="text-2xl" style={{ color: '#4b5563' }}>This is to certify that</p>

            <h2 className="text-5xl font-bold my-4 px-8 py-3" style={{ color: '#111827' }}>
              {userName}
            </h2>

            <p className="text-2xl" style={{ color: '#4b5563' }}>has successfully completed</p>

            <div className="my-4">
              <h3 className="text-4xl font-bold mb-2" style={{ color: '#ca8a04' }}>
                {courseName}
              </h3>
              <p className="text-xl font-mono" style={{ color: '#6b7280' }}>
                {courseCode}
              </p>
            </div>

            <p className="text-xl" style={{ color: '#4b5563' }}>
              demonstrating mastery of all course modules
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-end w-full mt-auto pt-8">
            <div className="text-center">
              <div className="w-48 mb-2" style={{ borderTop: '2px solid #1f2937' }}></div>
              <p className="text-sm font-semibold" style={{ color: '#4b5563' }}>Date of Completion</p>
              <p className="text-lg" style={{ color: '#1f2937' }}>{formatDate(completionDate)}</p>
            </div>

            <div className="text-center">
              <div className="rounded-full p-6 mb-2" style={{ backgroundColor: '#eab308' }}>
                <Award className="size-12" style={{ color: '#ffffff' }} />
              </div>
              <p className="text-xs" style={{ color: '#6b7280' }}>Official Seal</p>
            </div>

            <div className="text-center">
              <div className="w-48 mb-2" style={{ borderTop: '2px solid #1f2937' }}></div>
              <p className="text-sm font-semibold" style={{ color: '#4b5563' }}>Cogni.lol</p>
              <p className="text-xs" style={{ color: '#6b7280' }}>AI-Powered Learning Platform</p>
            </div>
          </div>

          {/* Certificate ID */}
          <div className="absolute bottom-6 right-6 text-right">
            <p className="text-xs font-mono" style={{ color: '#9ca3af' }}>
              Certificate ID: {courseId}-{Date.now().toString(36).toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      {/* Download Button */}
      <Button
        onClick={handleDownload}
        variant="yellow"
        size="lg"
        className="w-full text-lg"
      >
        <Download className="size-5 mr-2" />
        Download Certificate
      </Button>
    </div>
  )
}
