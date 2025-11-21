import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Certificate } from './Certificate'

interface CertificateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userName: string
  courseName: string
  courseCode: string
  completionDate: Date
  courseId: number
}

export function CertificateDialog({
  open,
  onOpenChange,
  userName,
  courseName,
  courseCode,
  completionDate,
  courseId,
}: CertificateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Your Certificate</DialogTitle>
          <DialogDescription>
            Congratulations on completing {courseName}! Download your certificate below.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <Certificate
            userName={userName}
            courseName={courseName}
            courseCode={courseCode}
            completionDate={completionDate}
            courseId={courseId}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
